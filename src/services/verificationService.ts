/**
 * Verification Service - Cross-source verification and fact validation
 * Ensures accuracy by requiring multiple sources for critical events
 */

import { TimelineEvent, NewsArticle } from '../types';
import { EVENT_TYPES, SEVERITY_LEVELS } from '../constants';

interface VerificationResult {
  verified: boolean;
  confidence: number;
  sources: string[];
  discrepancies: string[];
  consensusDetails: {
    location?: string;
    casualties?: { min: number; max: number };
    time?: Date;
    eventType?: string;
  };
}

interface EventClaim {
  source: string;
  timestamp: Date;
  location: string;
  casualties?: number;
  description: string;
  article: NewsArticle;
}

export class VerificationService {
  private readonly VERIFICATION_WINDOW_HOURS = 48;
  private readonly MIN_SOURCES_REQUIRED = 2;
  private readonly TRUSTED_SOURCE_WEIGHT = 1.5;

  /**
   * Verify an event by cross-referencing multiple sources
   */
  verifyEvent(event: TimelineEvent, allArticles: NewsArticle[]): VerificationResult {
    // Find related articles within time window
    const relatedClaims = this.findRelatedClaims(event, allArticles);
    
    if (relatedClaims.length < this.MIN_SOURCES_REQUIRED) {
      return {
        verified: false,
        confidence: 0.3,
        sources: relatedClaims.map(c => c.source),
        discrepancies: ['Insufficient sources for verification'],
        consensusDetails: {}
      };
    }

    // Analyze claims for consensus
    const consensus = this.analyzeConsensus(relatedClaims);
    const discrepancies = this.findDiscrepancies(relatedClaims, consensus);
    const confidence = this.calculateVerificationConfidence(relatedClaims, consensus, discrepancies);

    return {
      verified: confidence > 0.7 && discrepancies.length < 2,
      confidence,
      sources: Array.from(new Set(relatedClaims.map(c => c.source))),
      discrepancies,
      consensusDetails: consensus
    };
  }

  /**
   * Find articles related to an event
   */
  private findRelatedClaims(event: TimelineEvent, articles: NewsArticle[]): EventClaim[] {
    const eventTime = new Date(event.timestamp);
    const windowStart = new Date(eventTime.getTime() - this.VERIFICATION_WINDOW_HOURS * 60 * 60 * 1000);
    const windowEnd = new Date(eventTime.getTime() + this.VERIFICATION_WINDOW_HOURS * 60 * 60 * 1000);

    const claims: EventClaim[] = [];

    for (const article of articles) {
      const articleTime = new Date(article.publishedAt);
      
      // Check if within time window
      if (articleTime < windowStart || articleTime > windowEnd) continue;

      // Check if content matches
      const text = `${article.title} ${article.description || ''}`.toLowerCase();
      const eventText = `${event.title} ${event.description}`.toLowerCase();

      // Calculate similarity
      const similarity = this.calculateTextSimilarity(text, eventText);
      const locationMatch = this.locationMatches(event.location, text);

      if (similarity > 0.4 || locationMatch) {
        claims.push({
          source: article.source.name || 'Unknown',
          timestamp: articleTime,
          location: this.extractLocation(text) || event.location,
          casualties: this.extractCasualties(text),
          description: article.description || article.title,
          article
        });
      }
    }

    return claims;
  }

  /**
   * Analyze claims to find consensus
   */
  private analyzeConsensus(claims: EventClaim[]): VerificationResult['consensusDetails'] {
    // Location consensus
    const locations = claims.map(c => c.location).filter(Boolean);
    const locationCounts = this.countOccurrences(locations);
    const consensusLocation = this.getMostCommon(locationCounts);

    // Casualty consensus
    const casualties = claims.map(c => c.casualties).filter(c => c !== undefined) as number[];
    const casualtyRange = casualties.length > 0 ? {
      min: Math.min(...casualties),
      max: Math.max(...casualties)
    } : undefined;

    // Time consensus (median time)
    const times = claims.map(c => c.timestamp.getTime()).sort((a, b) => a - b);
    const medianTime = times.length > 0 ? new Date(times[Math.floor(times.length / 2)]) : undefined;

    return {
      location: consensusLocation,
      casualties: casualtyRange,
      time: medianTime,
      eventType: EVENT_TYPES.STRIKE // Could be enhanced with type detection
    };
  }

  /**
   * Find discrepancies between claims
   */
  private findDiscrepancies(claims: EventClaim[], consensus: VerificationResult['consensusDetails']): string[] {
    const discrepancies: string[] = [];

    // Check casualty discrepancies
    if (consensus.casualties) {
      const range = consensus.casualties.max - consensus.casualties.min;
      if (range > 10 && range / consensus.casualties.max > 0.5) {
        discrepancies.push(`Casualty reports vary significantly: ${consensus.casualties.min}-${consensus.casualties.max}`);
      }
    }

    // Check location discrepancies
    const uniqueLocations = Array.from(new Set(claims.map(c => c.location).filter(Boolean)));
    if (uniqueLocations.length > 2) {
      discrepancies.push(`Multiple locations reported: ${uniqueLocations.join(', ')}`);
    }

    // Check time discrepancies
    const times = claims.map(c => c.timestamp.getTime());
    const timeRange = Math.max(...times) - Math.min(...times);
    if (timeRange > 24 * 60 * 60 * 1000) { // More than 24 hours
      discrepancies.push('Event timing varies by more than 24 hours across sources');
    }

    return discrepancies;
  }

  /**
   * Calculate verification confidence
   */
  private calculateVerificationConfidence(
    claims: EventClaim[], 
    consensus: VerificationResult['consensusDetails'],
    discrepancies: string[]
  ): number {
    let confidence = 0.5; // Base confidence

    // More sources = higher confidence
    confidence += Math.min(claims.length * 0.1, 0.3);

    // Trusted sources boost confidence
    const trustedSources = ['Reuters', 'Associated Press', 'BBC', 'CNN'];
    const hasTrustedSource = claims.some(c => 
      trustedSources.some(trusted => c.source.includes(trusted))
    );
    if (hasTrustedSource) confidence += 0.2;

    // Consensus on details boosts confidence
    if (consensus.location) confidence += 0.1;
    if (consensus.casualties) confidence += 0.1;

    // Discrepancies reduce confidence
    confidence -= discrepancies.length * 0.15;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calculate text similarity (simple approach)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set(Array.from(words1).filter(x => words2.has(x)));
    const union = new Set(Array.from(words1).concat(Array.from(words2)));
    
    return intersection.size / union.size;
  }

  /**
   * Check if location matches
   */
  private locationMatches(eventLocation: string, text: string): boolean {
    const normalizedLocation = eventLocation.toLowerCase();
    const normalizedText = text.toLowerCase();
    
    // Direct match
    if (normalizedText.includes(normalizedLocation)) return true;
    
    // Check key parts of location
    const locationParts = normalizedLocation.split(/[,\s]+/).filter(part => part.length > 3);
    return locationParts.some(part => normalizedText.includes(part));
  }

  /**
   * Extract location from text
   */
  private extractLocation(text: string): string | null {
    // Simple regex for locations (can be enhanced)
    const locationPattern = /(?:in|at|near)\s+([A-Z][a-zA-Z\s]+?)(?:\.|,|;)/;
    const match = text.match(locationPattern);
    return match ? match[1].trim() : null;
  }

  /**
   * Extract casualties from text
   */
  private extractCasualties(text: string): number | undefined {
    const patterns = [
      /(\d+)\s*(?:people\s*)?killed/i,
      /(\d+)\s*dead/i,
      /(\d+)\s*casualties/i,
      /death\s*toll\s*(?:rises?\s*to\s*)?(\d+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return undefined;
  }

  /**
   * Count occurrences in array
   */
  private countOccurrences(items: string[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const item of items) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }
    return counts;
  }

  /**
   * Get most common item from counts
   */
  private getMostCommon(counts: Map<string, number>): string | undefined {
    let maxCount = 0;
    let mostCommon: string | undefined;
    
    counts.forEach((count, item) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = item;
      }
    });
    
    return mostCommon;
  }

  /**
   * Verify multiple events in batch
   */
  verifyEventBatch(events: TimelineEvent[], allArticles: NewsArticle[]): Map<string, VerificationResult> {
    const results = new Map<string, VerificationResult>();
    
    for (const event of events) {
      results.set(event.id, this.verifyEvent(event, allArticles));
    }
    
    return results;
  }
}