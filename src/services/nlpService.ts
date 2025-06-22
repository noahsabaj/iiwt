/**
 * NLP Service - Natural Language Processing for entity extraction
 * Uses compromise.js for lightweight browser-based NLP
 */

import nlp from 'compromise';
import { NewsArticle } from '../types';

interface ExtractedEntities {
  people: Array<{ name: string; role?: string; confidence: number }>;
  organizations: Array<{ name: string; type?: string; confidence: number }>;
  locations: Array<{ name: string; type?: string; coordinates?: { lat: number; lng: number } }>;
  weapons: Array<{ name: string; type: string; quantity?: number }>;
  casualties: Array<{ type: string; count: number; location?: string; party?: string }>;
  operations: Array<{ name: string; country?: string }>;
  dates: Array<{ text: string; date: Date; context: string }>;
}

export class NLPService {
  private weaponKeywords = {
    missiles: ['missile', 'ballistic', 'cruise', 'hypersonic', 'interceptor'],
    drones: ['drone', 'UAV', 'unmanned', 'quadcopter', 'Shahed'],
    aircraft: ['F-16', 'F-35', 'fighter', 'bomber', 'jet', 'aircraft'],
    defense: ['Iron Dome', 'Patriot', 'S-300', 'S-400', 'Arrow', 'David\'s Sling'],
    naval: ['destroyer', 'submarine', 'frigate', 'carrier', 'naval'],
  };

  private operationPatterns = [
    /Operation\s+([A-Z][a-zA-Z\s]+)/g,
    /"Operation\s+([^"]+)"/g,
    /launched\s+([A-Z][a-zA-Z\s]+)\s+operation/gi,
  ];

  /**
   * Extract all entities from article text
   */
  extractEntities(article: NewsArticle): ExtractedEntities {
    const fullText = `${article.title} ${article.description || ''} ${article.content || ''}`;
    const doc = nlp(fullText);

    return {
      people: this.extractPeople(doc, fullText),
      organizations: this.extractOrganizations(doc, fullText),
      locations: this.extractLocations(doc, fullText),
      weapons: this.extractWeapons(fullText),
      casualties: this.extractCasualties(fullText),
      operations: this.extractOperations(fullText),
      dates: this.extractDates(doc, fullText),
    };
  }

  /**
   * Extract people mentioned in text
   */
  private extractPeople(doc: any, text: string): ExtractedEntities['people'] {
    const people: ExtractedEntities['people'] = [];
    
    // Use compromise to find people
    const peopleFound = doc.people().json();
    peopleFound.forEach((person: any) => {
      people.push({
        name: person.text,
        confidence: 0.8,
      });
    });

    // Look for specific titles and roles
    const titlePatterns = [
      { pattern: /(President|Prime Minister|General|Admiral|Colonel)\s+([A-Z][a-z]+\s*)+/g, role: 'match' },
      { pattern: /([A-Z][a-z]+\s+)+(Netanyahu|Khamenei|Biden|Gallant|Salami)/g, role: 'leader' },
      { pattern: /(IDF|IRGC)\s+(Chief|Commander|Spokesperson)\s+([A-Z][a-z]+\s*)+/g, role: 'military' },
    ];

    for (const { pattern, role } of titlePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const name = match[0].trim();
        const actualRole = role === 'match' ? match[1] : role;
        
        if (!people.find(p => p.name === name)) {
          people.push({
            name,
            role: actualRole,
            confidence: 0.9,
          });
        }
      }
    }

    return people;
  }

  /**
   * Extract organizations mentioned
   */
  private extractOrganizations(doc: any, text: string): ExtractedEntities['organizations'] {
    const orgs: ExtractedEntities['organizations'] = [];
    
    // Known organizations
    const knownOrgs = [
      { name: 'IDF', full: 'Israel Defense Forces', type: 'military' },
      { name: 'IRGC', full: 'Islamic Revolutionary Guard Corps', type: 'military' },
      { name: 'Hezbollah', type: 'militant' },
      { name: 'Hamas', type: 'militant' },
      { name: 'UN', full: 'United Nations', type: 'international' },
      { name: 'IAEA', full: 'International Atomic Energy Agency', type: 'international' },
      { name: 'NATO', type: 'military alliance' },
      { name: 'Mossad', type: 'intelligence' },
      { name: 'CIA', type: 'intelligence' },
    ];

    for (const org of knownOrgs) {
      if (text.includes(org.name) || (org.full && text.includes(org.full))) {
        orgs.push({
          name: org.full || org.name,
          type: org.type,
          confidence: 0.95,
        });
      }
    }

    // Use compromise for other organizations
    const orgsFound = doc.organizations().json();
    orgsFound.forEach((org: any) => {
      if (!orgs.find(o => o.name === org.text)) {
        orgs.push({
          name: org.text,
          confidence: 0.7,
        });
      }
    });

    return orgs;
  }

  /**
   * Extract locations with enhanced geocoding
   */
  private extractLocations(doc: any, text: string): ExtractedEntities['locations'] {
    const locations: ExtractedEntities['locations'] = [];
    
    // Known locations with coordinates
    const knownLocations = [
      { name: 'Tel Aviv', type: 'city', coordinates: { lat: 32.0853, lng: 34.7818 } },
      { name: 'Jerusalem', type: 'city', coordinates: { lat: 31.7683, lng: 35.2137 } },
      { name: 'Tehran', type: 'city', coordinates: { lat: 35.6892, lng: 51.3890 } },
      { name: 'Natanz', type: 'nuclear facility', coordinates: { lat: 33.7245, lng: 51.7263 } },
      { name: 'Arak', type: 'nuclear facility', coordinates: { lat: 34.3773, lng: 49.7643 } },
      { name: 'Bushehr', type: 'nuclear facility', coordinates: { lat: 28.8296, lng: 50.8884 } },
      { name: 'Fordow', type: 'nuclear facility', coordinates: { lat: 34.8845, lng: 50.9936 } },
      { name: 'Damascus', type: 'city', coordinates: { lat: 33.5138, lng: 36.2765 } },
      { name: 'Beirut', type: 'city', coordinates: { lat: 33.8938, lng: 35.5018 } },
      { name: 'Gaza', type: 'territory', coordinates: { lat: 31.3547, lng: 34.3088 } },
    ];

    // Check for known locations
    for (const loc of knownLocations) {
      if (text.includes(loc.name)) {
        locations.push(loc);
      }
    }

    // Use compromise for other places
    const placesFound = doc.places().json();
    placesFound.forEach((place: any) => {
      if (!locations.find(l => l.name === place.text)) {
        locations.push({
          name: place.text,
          type: 'unknown',
        });
      }
    });

    return locations;
  }

  /**
   * Extract weapon systems mentioned
   */
  private extractWeapons(text: string): ExtractedEntities['weapons'] {
    const weapons: ExtractedEntities['weapons'] = [];
    const lowerText = text.toLowerCase();

    // Check each weapon category
    for (const [type, keywords] of Object.entries(this.weaponKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          // Try to extract quantity
          const quantityPattern = new RegExp(`(\\d+)\\s*${keyword}`, 'i');
          const quantityMatch = text.match(quantityPattern);
          
          weapons.push({
            name: keyword,
            type,
            quantity: quantityMatch ? parseInt(quantityMatch[1]) : undefined,
          });
        }
      }
    }

    return weapons;
  }

  /**
   * Extract casualty information
   */
  private extractCasualties(text: string): ExtractedEntities['casualties'] {
    const casualties: ExtractedEntities['casualties'] = [];
    
    const patterns = [
      { regex: /(\d+)\s*(?:people\s*)?killed/gi, type: 'killed' },
      { regex: /(\d+)\s*(?:people\s*)?injured/gi, type: 'injured' },
      { regex: /(\d+)\s*(?:people\s*)?wounded/gi, type: 'wounded' },
      { regex: /(\d+)\s*casualties/gi, type: 'casualties' },
      { regex: /death\s*toll\s*(?:rises?\s*to\s*)?(\d+)/gi, type: 'killed' },
    ];

    // Party identifiers
    const partyIdentifiers = [
      { party: 'israel', keywords: ['israeli', 'idf', 'israel defense forces'] },
      { party: 'iran', keywords: ['iranian', 'irgc', 'iran', 'islamic revolutionary guard'] },
      { party: 'usa', keywords: ['american', 'us ', 'u.s.', 'united states', 'us forces', 'us military'] },
      { party: 'houthis', keywords: ['houthi', 'yemen', 'ansar allah'] },
      { party: 'hezbollah', keywords: ['hezbollah', 'lebanese', 'lebanon'] },
      { party: 'syria', keywords: ['syrian', 'syria'] },
      { party: 'iraq', keywords: ['iraqi', 'iraq'] },
    ];

    for (const { regex, type } of patterns) {
      let match;
      regex.lastIndex = 0; // Reset regex
      while ((match = regex.exec(text)) !== null) {
        const count = parseInt(match[1]);
        
        // Extract context around the match (100 chars before and after)
        const contextStart = Math.max(0, match.index - 100);
        const contextEnd = Math.min(text.length, match.index + match[0].length + 100);
        const context = text.substring(contextStart, contextEnd).toLowerCase();
        
        // Try to identify the party
        let party: string | undefined;
        for (const identifier of partyIdentifiers) {
          if (identifier.keywords.some(keyword => context.includes(keyword))) {
            party = identifier.party;
            break;
          }
        }
        
        casualties.push({
          type,
          count,
          party
        });
      }
    }

    return casualties;
  }

  /**
   * Extract military operation names
   */
  private extractOperations(text: string): ExtractedEntities['operations'] {
    const operations: ExtractedEntities['operations'] = [];
    const seen = new Set<string>();

    // Enhanced patterns for better operation extraction
    const enhancedPatterns = [
      ...this.operationPatterns,
      /(?:launched|began|started|initiated)\s+Operation\s+([A-Z][a-zA-Z\s]+?)(?:\s|,|\.|$)/gi,
      /Operation\s+"([^"]+)"/g,
      /(?:codenamed|code-named)\s+"?([A-Z][a-zA-Z\s]+?)"?(?:\s|,|\.|$)/gi
    ];

    // Known operation names to look for
    const knownOperations = [
      { name: 'Rising Lion', country: 'Israel' },
      { name: 'True Promise', country: 'Iran' },
      { name: 'Desert Shield', country: 'Israel' },
      { name: 'Swords of Iron', country: 'Israel' },
      { name: 'Guardian of the Walls', country: 'Israel' },
      { name: 'Breaking Dawn', country: 'Israel' },
      { name: 'Shield and Arrow', country: 'Israel' }
    ];

    // Check for pattern matches
    for (const pattern of enhancedPatterns) {
      let match;
      pattern.lastIndex = 0; // Reset regex
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1].trim();
        if (!seen.has(name) && name.length > 3 && !name.match(/^(The|And|Or|In|At|On|For)$/i)) {
          seen.add(name);
          
          // Try to determine country
          let country: string | undefined;
          const contextStart = Math.max(0, match.index - 100);
          const contextEnd = Math.min(text.length, match.index + match[0].length + 100);
          const context = text.substring(contextStart, contextEnd);
          
          if (context.match(/Israel|Israeli|IDF/i)) {
            country = 'Israel';
          } else if (context.match(/Iran|Iranian|IRGC/i)) {
            country = 'Iran';
          }
          
          operations.push({ 
            name: name.includes('Operation') ? name : `Operation ${name}`, 
            country 
          });
        }
      }
    }

    // Check for known operations
    for (const knownOp of knownOperations) {
      const regex = new RegExp(`\\b${knownOp.name}\\b`, 'i');
      if (regex.test(text) && !seen.has(knownOp.name)) {
        seen.add(knownOp.name);
        operations.push({ 
          name: `Operation ${knownOp.name}`, 
          country: knownOp.country 
        });
      }
    }

    return operations;
  }

  /**
   * Extract dates and times
   */
  private extractDates(doc: any, text: string): ExtractedEntities['dates'] {
    const dates: ExtractedEntities['dates'] = [];
    
    // Use compromise to find dates
    const datesFound = doc.dates().json();
    datesFound.forEach((date: any) => {
      dates.push({
        text: date.text,
        date: new Date(date.text),
        context: this.extractContext(text, date.text),
      });
    });

    // Additional patterns for relative dates
    const relativePatterns = [
      { pattern: /(\d+)\s*hours?\s*ago/gi, unit: 'hours' },
      { pattern: /(\d+)\s*days?\s*ago/gi, unit: 'days' },
      { pattern: /yesterday/gi, unit: 'yesterday' },
      { pattern: /today/gi, unit: 'today' },
      { pattern: /last\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi, unit: 'lastday' },
    ];

    for (const { pattern } of relativePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        dates.push({
          text: match[0],
          date: new Date(), // Would be converted by temporal parser
          context: this.extractContext(text, match[0]),
        });
      }
    }

    return dates;
  }

  /**
   * Extract surrounding context for a match
   */
  private extractContext(text: string, match: string, contextLength: number = 50): string {
    const index = text.indexOf(match);
    if (index === -1) return '';
    
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + match.length + contextLength);
    
    return text.substring(start, end).trim();
  }

  /**
   * Analyze article for key insights
   */
  analyzeArticle(article: NewsArticle): {
    entities: ExtractedEntities;
    summary: {
      hasNuclearContent: boolean;
      hasCasualties: boolean;
      militaryOperations: string[];
      primaryLocations: string[];
      keyPeople: string[];
      weaponTypes: string[];
    };
  } {
    const entities = this.extractEntities(article);
    
    const summary = {
      hasNuclearContent: this.detectNuclearContent(article),
      hasCasualties: entities.casualties.length > 0,
      militaryOperations: entities.operations.map(op => op.name),
      primaryLocations: entities.locations.slice(0, 3).map(loc => loc.name),
      keyPeople: entities.people.filter(p => p.confidence > 0.8).map(p => p.name),
      weaponTypes: Array.from(new Set(entities.weapons.map(w => w.type))),
    };

    return { entities, summary };
  }

  /**
   * Detect nuclear-related content
   */
  private detectNuclearContent(article: NewsArticle): boolean {
    const text = `${article.title} ${article.description || ''}`.toLowerCase();
    const nuclearTerms = [
      'nuclear', 'uranium', 'enrichment', 'reactor', 'radiation',
      'centrifuge', 'plutonium', 'atomic', 'radioactive', 'iaea'
    ];
    
    return nuclearTerms.some(term => text.includes(term));
  }
}