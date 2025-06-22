/**
 * Event Deduplication Engine
 * Identifies and merges similar events from multiple news sources
 */

import { TimelineEvent } from '../types';

interface EventFingerprint {
  location: string;
  eventType: string;
  timeWindow: { start: Date; end: Date };
  keywords: Set<string>;
}

interface DuplicateGroup {
  primaryEvent: TimelineEvent;
  duplicates: TimelineEvent[];
  confidence: number;
  sources: Set<string>;
}

export class EventDeduplicator {
  private readonly TIME_WINDOW_HOURS = 24; // Events within 24 hours might be same
  private readonly LOCATION_THRESHOLD = 0.8; // Similarity threshold for locations
  private readonly KEYWORD_THRESHOLD = 0.6; // Similarity threshold for keywords

  /**
   * Deduplicate a list of events
   */
  deduplicateEvents(events: TimelineEvent[]): TimelineEvent[] {
    if (events.length === 0) return [];

    // Sort events by timestamp
    const sortedEvents = [...events].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Group similar events
    const groups = this.groupSimilarEvents(sortedEvents);
    
    // Merge each group into a single event
    return groups.map(group => this.mergeEventGroup(group));
  }

  /**
   * Group similar events together
   */
  private groupSimilarEvents(events: TimelineEvent[]): DuplicateGroup[] {
    const groups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < events.length; i++) {
      if (processed.has(events[i].id)) continue;

      const group: DuplicateGroup = {
        primaryEvent: events[i],
        duplicates: [],
        confidence: 1.0,
        sources: new Set([this.extractSource(events[i])])
      };

      // Find all similar events
      for (let j = i + 1; j < events.length; j++) {
        if (processed.has(events[j].id)) continue;

        const similarity = this.calculateSimilarity(events[i], events[j]);
        if (similarity > 0.7) {
          group.duplicates.push(events[j]);
          group.sources.add(this.extractSource(events[j]));
          processed.add(events[j].id);
        }
      }

      processed.add(events[i].id);
      groups.push(group);
    }

    return groups;
  }

  /**
   * Calculate similarity between two events
   */
  private calculateSimilarity(event1: TimelineEvent, event2: TimelineEvent): number {
    // Type must match
    if (event1.type !== event2.type) return 0;

    const scores = {
      location: this.compareLocations(event1.location, event2.location) * 0.3,
      time: this.compareTimeWindows(event1.timestamp, event2.timestamp) * 0.2,
      keywords: this.compareKeywords(event1, event2) * 0.3,
      severity: event1.severity === event2.severity ? 0.2 : 0.1
    };

    return Object.values(scores).reduce((a, b) => a + b, 0);
  }

  /**
   * Compare location strings
   */
  private compareLocations(loc1: string, loc2: string): number {
    const norm1 = this.normalizeLocation(loc1);
    const norm2 = this.normalizeLocation(loc2);

    if (norm1 === norm2) return 1.0;

    // Check if one contains the other
    if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.8;

    // Check for common key terms
    const keywords1 = this.extractLocationKeywords(norm1);
    const keywords2 = this.extractLocationKeywords(norm2);
    
    const intersection = new Set(Array.from(keywords1).filter(x => keywords2.has(x)));
    const union = new Set(Array.from(keywords1).concat(Array.from(keywords2)));
    
    return intersection.size / union.size;
  }

  /**
   * Normalize location string
   */
  private normalizeLocation(location: string): string {
    return location
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract location keywords
   */
  private extractLocationKeywords(location: string): Set<string> {
    const keywords = new Set<string>();
    const important = ['israel', 'iran', 'tehran', 'tel aviv', 'jerusalem', 
                      'natanz', 'arak', 'bushehr', 'fordow', 'isfahan',
                      'gaza', 'lebanon', 'syria', 'iraq'];
    
    const normalized = location.toLowerCase();
    for (const keyword of important) {
      if (normalized.includes(keyword)) {
        keywords.add(keyword);
      }
    }

    // Also add any words that look like place names (capitalized)
    const words = location.split(/\s+/);
    for (const word of words) {
      if (word[0] && word[0] === word[0].toUpperCase() && word.length > 2) {
        keywords.add(word.toLowerCase());
      }
    }

    return keywords;
  }

  /**
   * Compare time windows
   */
  private compareTimeWindows(time1: string | Date, time2: string | Date): number {
    const date1 = typeof time1 === 'string' ? new Date(time1) : time1;
    const date2 = typeof time2 === 'string' ? new Date(time2) : time2;
    const hoursDiff = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60);

    if (hoursDiff <= 1) return 1.0;
    if (hoursDiff <= 6) return 0.8;
    if (hoursDiff <= 12) return 0.6;
    if (hoursDiff <= 24) return 0.4;
    if (hoursDiff <= 48) return 0.2;
    return 0;
  }

  /**
   * Compare keywords between events
   */
  private compareKeywords(event1: TimelineEvent, event2: TimelineEvent): number {
    const keywords1 = this.extractKeywords(event1);
    const keywords2 = this.extractKeywords(event2);

    const intersection = new Set(Array.from(keywords1).filter(x => keywords2.has(x)));
    const union = new Set(Array.from(keywords1).concat(Array.from(keywords2)));

    if (union.size === 0) return 0;
    return intersection.size / union.size;
  }

  /**
   * Extract keywords from event
   */
  private extractKeywords(event: TimelineEvent): Set<string> {
    const keywords = new Set<string>();
    const text = `${event.title} ${event.description}`.toLowerCase();

    // Military terms
    const militaryTerms = ['missile', 'strike', 'attack', 'bomb', 'explosion', 
                          'aircraft', 'drone', 'rocket', 'artillery', 'raid'];
    
    // Damage terms
    const damageTerms = ['killed', 'injured', 'wounded', 'casualties', 'damage',
                        'destroyed', 'hit', 'struck', 'targeted'];
    
    // Nuclear terms
    const nuclearTerms = ['nuclear', 'uranium', 'enrichment', 'reactor', 'facility',
                         'radiation', 'contamination'];

    const allTerms = [...militaryTerms, ...damageTerms, ...nuclearTerms];
    
    for (const term of allTerms) {
      if (text.includes(term)) {
        keywords.add(term);
      }
    }

    // Extract numbers (potential casualty counts)
    const numbers = text.match(/\d+/g);
    if (numbers) {
      numbers.forEach(num => keywords.add(`num:${num}`));
    }

    return keywords;
  }

  /**
   * Merge a group of duplicate events
   */
  private mergeEventGroup(group: DuplicateGroup): TimelineEvent {
    const { primaryEvent, duplicates } = group;
    
    // If no duplicates, return primary
    if (duplicates.length === 0) {
      return {
        ...primaryEvent,
        metadata: {
          ...primaryEvent.metadata,
          sources: Array.from(group.sources),
          confidence: 1.0,
          isDuplicate: false
        }
      };
    }

    // Merge information from all events
    const allEvents = [primaryEvent, ...duplicates];
    
    // Use earliest timestamp
    const earliestTime = allEvents
      .map(e => new Date(e.timestamp))
      .sort((a, b) => a.getTime() - b.getTime())[0];

    // Combine descriptions
    const descriptions = new Set(allEvents.map(e => e.description));
    const combinedDescription = Array.from(descriptions).join(' | ');

    // Use most severe severity level
    const severities = ['low', 'medium', 'high', 'critical'];
    const maxSeverity = allEvents
      .map(e => severities.indexOf(e.severity))
      .sort((a, b) => b - a)[0];

    // Calculate confidence based on number of sources
    const confidence = Math.min(0.5 + (group.sources.size * 0.1), 1.0);

    return {
      ...primaryEvent,
      timestamp: earliestTime.toISOString(),
      description: combinedDescription,
      severity: severities[maxSeverity] as TimelineEvent['severity'],
      metadata: {
        ...primaryEvent.metadata,
        sources: Array.from(group.sources),
        duplicateCount: duplicates.length,
        confidence,
        isDuplicate: false,
        mergedFrom: allEvents.map(e => e.id)
      }
    };
  }

  /**
   * Extract source from event
   */
  private extractSource(event: TimelineEvent): string {
    // Try to extract from metadata
    if (event.metadata?.source) {
      return event.metadata.source;
    }

    // Try to extract from description
    const sourcePattern = /\(Source: ([^)]+)\)/;
    const match = event.description.match(sourcePattern);
    if (match) {
      return match[1];
    }

    return 'Unknown';
  }
}

/**
 * Helper function to deduplicate events
 */
export function deduplicateTimelineEvents(events: TimelineEvent[]): TimelineEvent[] {
  const deduplicator = new EventDeduplicator();
  return deduplicator.deduplicateEvents(events);
}