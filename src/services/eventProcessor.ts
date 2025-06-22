/**
 * Event Processor - Core event processing with categorization and confidence scoring
 */

import { TimelineEvent } from '../types';
import { TemporalParser, extractMostLikelyEventTime } from './temporalParser';
import { EventDeduplicator } from './deduplication';
import { EVENT_TYPES } from '../constants';
import { NLPService } from './nlpService';

interface ProcessedEvent extends TimelineEvent {
  confidence: number;
  sources: string[];
  extractedTime: {
    eventTime: Date;
    confidence: number;
  };
}

interface EventCategory {
  type: typeof EVENT_TYPES[keyof typeof EVENT_TYPES];
  keywords: string[];
  priority: number;
}

export class EventProcessor {
  private deduplicator: EventDeduplicator;
  private categories: EventCategory[];
  private nlpService: NLPService;

  constructor() {
    this.deduplicator = new EventDeduplicator();
    this.categories = this.initializeCategories();
    this.nlpService = new NLPService();
  }

  /**
   * Process raw news articles into structured timeline events
   */
  processNewsArticles(articles: any[]): TimelineEvent[] {
    // Extract events from each article
    const rawEvents = articles.map(article => this.extractEventFromArticle(article));
    
    // Filter out low-confidence events
    const validEvents = rawEvents.filter(event => event.confidence > 0.5);
    
    // Deduplicate events
    const deduplicatedEvents = this.deduplicator.deduplicateEvents(validEvents);
    
    // Sort by event time (not publish time)
    return deduplicatedEvents.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA; // Most recent first
    });
  }

  /**
   * Extract event from a news article
   */
  private extractEventFromArticle(article: any): ProcessedEvent {
    const publishedDate = new Date(article.publishedAt);
    const fullText = `${article.title} ${article.description || ''} ${article.content || ''}`;
    
    // Use NLP to extract entities
    const { entities, summary } = this.nlpService.analyzeArticle(article);
    
    // Extract actual event time
    const temporalExtraction = extractMostLikelyEventTime(fullText, publishedDate);
    
    // Categorize the event with NLP insights
    const category = this.categorizeEvent(fullText, summary);
    
    // Calculate severity with entity information
    const severity = this.calculateSeverity(fullText, category.type, entities);
    
    // Extract location with NLP enhancement
    const location = this.extractLocationWithNLP(fullText, article.title, entities);
    
    // Calculate overall confidence
    const confidence = this.calculateConfidence({
      temporalConfidence: temporalExtraction.confidence,
      hasLocation: location !== 'Unknown location',
      hasDetails: fullText.length > 200,
      sourceReliability: this.assessSourceReliability(article.source?.name || ''),
      categoryConfidence: category.type !== EVENT_TYPES.OTHER ? 0.9 : 0.5
    });

    return {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: temporalExtraction.eventTime.toISOString(),
      type: category.type,
      severity,
      title: this.generateEventTitle(article.title, category.type),
      description: article.description || article.title,
      location,
      confidence,
      sources: [article.source?.name || 'Unknown'],
      extractedTime: temporalExtraction,
      metadata: {
        source: article.source?.name,
        url: article.url,
        publishedAt: article.publishedAt,
        confidence,
        eventTime: temporalExtraction.eventTime.toISOString(),
        timeConfidence: temporalExtraction.confidence,
        entities: {
          people: entities.people.map(p => p.name),
          organizations: entities.organizations.map(o => o.name),
          locations: entities.locations.map(l => l.name),
          weapons: entities.weapons.map(w => w.name),
          operations: entities.operations.map(op => op.name)
        }
      }
    };
  }

  /**
   * Initialize event categories
   */
  private initializeCategories(): EventCategory[] {
    return [
      {
        type: EVENT_TYPES.NUCLEAR,
        keywords: ['nuclear', 'uranium', 'enrichment', 'reactor', 'radiation', 
                  'contamination', 'natanz', 'arak', 'bushehr', 'fordow'],
        priority: 10
      },
      {
        type: EVENT_TYPES.MISSILE,
        keywords: ['missile', 'rocket', 'ballistic', 'cruise', 'launch', 'fired'],
        priority: 9
      },
      {
        type: EVENT_TYPES.STRIKE,
        keywords: ['strike', 'airstrike', 'attack', 'bomb', 'explosion', 'raid', 'hit'],
        priority: 8
      },
      {
        type: EVENT_TYPES.CYBER,
        keywords: ['cyber', 'hack', 'malware', 'stuxnet', 'digital', 'network'],
        priority: 7
      },
      {
        type: EVENT_TYPES.ALERT,
        keywords: ['alert', 'warning', 'siren', 'emergency', 'evacuation'],
        priority: 6
      },
      {
        type: EVENT_TYPES.DIPLOMACY,
        keywords: ['diplomatic', 'talks', 'negotiation', 'meeting', 'summit', 
                  'ambassador', 'sanctions'],
        priority: 5
      },
      {
        type: EVENT_TYPES.INTELLIGENCE,
        keywords: ['intelligence', 'spy', 'espionage', 'surveillance', 'mossad', 'cia'],
        priority: 6
      }
    ];
  }

  /**
   * Categorize event based on content and NLP analysis
   */
  private categorizeEvent(text: string, summary?: any): EventCategory {
    const lowerText = text.toLowerCase();
    let bestMatch = { category: this.categories[0], score: 0 };

    for (const category of this.categories) {
      let score = 0;
      for (const keyword of category.keywords) {
        if (lowerText.includes(keyword)) {
          score += category.priority;
        }
      }
      
      if (score > bestMatch.score) {
        bestMatch = { category, score };
      }
    }

    // Boost score based on NLP insights
    if (summary) {
      if (summary.hasNuclearContent && bestMatch.category.type === EVENT_TYPES.NUCLEAR) {
        bestMatch.score += 10;
      }
      if (summary.militaryOperations.length > 0 && bestMatch.category.type === EVENT_TYPES.STRIKE) {
        bestMatch.score += 5;
      }
    }
    
    // If no good match, return OTHER
    if (bestMatch.score < 5) {
      return {
        type: EVENT_TYPES.OTHER,
        keywords: [],
        priority: 1
      };
    }

    return bestMatch.category;
  }

  /**
   * Calculate event severity with entity information
   */
  private calculateSeverity(text: string, eventType: string, entities?: any): TimelineEvent['severity'] {
    const lowerText = text.toLowerCase();
    
    // Critical indicators
    if (lowerText.includes('nuclear') && (lowerText.includes('leak') || lowerText.includes('radiation'))) {
      return 'critical';
    }
    if (lowerText.match(/\d{3,}/)) { // 3+ digit numbers suggest mass casualties
      return 'critical';
    }
    
    // Check NLP-extracted casualties
    if (entities?.casualties) {
      const totalCasualties = entities.casualties.reduce((sum: number, c: any) => 
        sum + (c.type === 'killed' ? c.count * 2 : c.count), 0
      );
      if (totalCasualties > 100) return 'critical';
      if (totalCasualties > 20) return 'high';
    }
    
    // High severity indicators
    if (lowerText.includes('killed') || lowerText.includes('dead')) {
      const match = lowerText.match(/(\d+)\s*(killed|dead)/);
      if (match && parseInt(match[1]) > 10) {
        return 'critical';
      }
      return 'high';
    }
    
    if (eventType === EVENT_TYPES.NUCLEAR || eventType === EVENT_TYPES.MISSILE) {
      return 'high';
    }
    
    // Medium severity
    if (lowerText.includes('injured') || lowerText.includes('wounded') || 
        lowerText.includes('damage') || lowerText.includes('strike')) {
      return 'medium';
    }
    
    // Low severity
    return 'low';
  }

  /**
   * Extract location with NLP enhancement
   */
  private extractLocationWithNLP(text: string, title: string, entities?: any): string {
    // First check NLP-extracted locations
    if (entities?.locations && entities.locations.length > 0) {
      // Prefer nuclear facilities
      const nuclearFacility = entities.locations.find((loc: any) => 
        loc.type === 'nuclear facility'
      );
      if (nuclearFacility) return nuclearFacility.name;
      
      // Then cities
      const city = entities.locations.find((loc: any) => 
        loc.type && loc.type.includes('city')
      );
      if (city) return city.name;
      
      // Otherwise first location
      return entities.locations[0].name;
    }
    
    // Fallback to original extraction method
    return this.extractLocation(text, title);
  }
  
  /**
   * Original location extraction method
   */
  private extractLocation(text: string, title: string): string {
    // Known locations to search for
    const locations = [
      { name: 'Tel Aviv', variants: ['tel aviv', 'telaviv'] },
      { name: 'Jerusalem', variants: ['jerusalem'] },
      { name: 'Tehran', variants: ['tehran'] },
      { name: 'Natanz', variants: ['natanz'] },
      { name: 'Arak', variants: ['arak'] },
      { name: 'Bushehr', variants: ['bushehr'] },
      { name: 'Fordow', variants: ['fordow', 'qom'] },
      { name: 'Isfahan', variants: ['isfahan', 'esfahan'] },
      { name: 'Haifa', variants: ['haifa'] },
      { name: 'Gaza', variants: ['gaza'] },
      { name: 'Lebanon', variants: ['lebanon', 'lebanese'] },
      { name: 'Syria', variants: ['syria', 'syrian', 'damascus'] },
      { name: 'Iraq', variants: ['iraq', 'iraqi', 'baghdad'] },
      { name: 'Iran', variants: ['iran', 'iranian'] },
      { name: 'Israel', variants: ['israel', 'israeli'] }
    ];

    const searchText = `${title} ${text}`.toLowerCase();
    
    // Look for specific locations first
    for (const location of locations) {
      for (const variant of location.variants) {
        if (searchText.includes(variant)) {
          // Try to find more specific context
          const contextPattern = new RegExp(`(in|at|near|outside)\\s+${variant}`, 'i');
          if (contextPattern.test(searchText)) {
            return location.name;
          }
        }
      }
    }

    // Look for generic location patterns
    const genericPattern = /(?:in|at|near)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/;
    const match = text.match(genericPattern);
    if (match) {
      return match[1];
    }

    // If only country is mentioned, return country
    if (searchText.includes('iran')) return 'Iran';
    if (searchText.includes('israel')) return 'Israel';

    return 'Unknown location';
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(factors: {
    temporalConfidence: number;
    hasLocation: boolean;
    hasDetails: boolean;
    sourceReliability: number;
    categoryConfidence: number;
  }): number {
    const weights = {
      temporalConfidence: 0.25,
      hasLocation: 0.2,
      hasDetails: 0.15,
      sourceReliability: 0.25,
      categoryConfidence: 0.15
    };

    let score = 0;
    score += factors.temporalConfidence * weights.temporalConfidence;
    score += (factors.hasLocation ? 1 : 0) * weights.hasLocation;
    score += (factors.hasDetails ? 1 : 0) * weights.hasDetails;
    score += factors.sourceReliability * weights.sourceReliability;
    score += factors.categoryConfidence * weights.categoryConfidence;

    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Assess source reliability
   */
  private assessSourceReliability(sourceName: string): number {
    const reliabilityScores: { [key: string]: number } = {
      'reuters': 0.95,
      'associated press': 0.95,
      'ap': 0.95,
      'bbc': 0.9,
      'cnn': 0.85,
      'the guardian': 0.85,
      'the new york times': 0.9,
      'washington post': 0.9,
      'al jazeera': 0.85,
      'haaretz': 0.85,
      'the times of israel': 0.8,
      'jerusalem post': 0.8
    };

    const lowerSource = sourceName.toLowerCase();
    
    for (const [source, score] of Object.entries(reliabilityScores)) {
      if (lowerSource.includes(source)) {
        return score;
      }
    }

    return 0.7; // Default reliability
  }

  /**
   * Generate clean event title
   */
  private generateEventTitle(originalTitle: string, eventType: string): string {
    // Remove source attributions
    let cleanTitle = originalTitle
      .replace(/\s*[-–—]\s*[^-–—]+$/, '') // Remove "- Source" at end
      .replace(/^\[[^\]]+\]\s*/, ''); // Remove "[Source]" at beginning

    // Add event type prefix if not already present
    const typeWords = eventType.toLowerCase().split('_');
    const hasType = typeWords.some(word => cleanTitle.toLowerCase().includes(word));
    
    if (!hasType && eventType !== EVENT_TYPES.OTHER) {
      const typeLabel = eventType.charAt(0) + eventType.slice(1).toLowerCase().replace('_', ' ');
      cleanTitle = `${typeLabel}: ${cleanTitle}`;
    }

    return cleanTitle;
  }
}