/**
 * Temporal Parser - Extracts actual event times from article text
 * Handles phrases like "yesterday", "last Tuesday", "2 hours ago", etc.
 */

interface TemporalExtraction {
  eventTime: Date;
  confidence: number; // 0-1
  timePhrase: string; // The phrase that was parsed
  isExplicit: boolean; // true if exact date/time was found
}

export class TemporalParser {
  private publishedDate: Date;
  
  constructor(publishedDate: Date) {
    this.publishedDate = new Date(publishedDate);
  }

  /**
   * Extract event time from article text
   */
  extractEventTime(text: string): TemporalExtraction | null {
    // Clean the text
    const cleanText = text.toLowerCase();
    
    // Try explicit date patterns first
    const explicitDate = this.extractExplicitDate(cleanText);
    if (explicitDate) {
      return explicitDate;
    }
    
    // Try relative time patterns
    const relativeTime = this.extractRelativeTime(cleanText);
    if (relativeTime) {
      return relativeTime;
    }
    
    // Try day references
    const dayReference = this.extractDayReference(cleanText);
    if (dayReference) {
      return dayReference;
    }
    
    // Default to published time with low confidence
    return {
      eventTime: this.publishedDate,
      confidence: 0.3,
      timePhrase: 'No specific time found',
      isExplicit: false
    };
  }

  private extractExplicitDate(text: string): TemporalExtraction | null {
    // Pattern: "on December 15", "on Dec 15", "on 15/12", etc.
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                       'july', 'august', 'september', 'october', 'november', 'december'];
    const monthAbbr = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                      'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    
    // Try "on [Month] [Day]" pattern
    for (let i = 0; i < monthNames.length; i++) {
      const pattern = new RegExp(`on\\s+(${monthNames[i]}|${monthAbbr[i]})\\s+(\\d{1,2})`, 'i');
      const match = text.match(pattern);
      if (match) {
        const month = i;
        const day = parseInt(match[2]);
        const year = this.publishedDate.getFullYear();
        
        const eventDate = new Date(year, month, day);
        
        // If the date is in the future, assume it was last year
        if (eventDate > this.publishedDate) {
          eventDate.setFullYear(year - 1);
        }
        
        return {
          eventTime: eventDate,
          confidence: 0.9,
          timePhrase: match[0],
          isExplicit: true
        };
      }
    }
    
    // Try "December 15, 2025" pattern
    const fullDatePattern = /(\w+)\s+(\d{1,2}),?\s+(\d{4})/;
    const fullDateMatch = text.match(fullDatePattern);
    if (fullDateMatch) {
      const monthStr = fullDateMatch[1].toLowerCase();
      const monthIndex = [...monthNames, ...monthAbbr].findIndex(m => monthStr.includes(m));
      if (monthIndex >= 0) {
        const actualMonth = monthIndex >= 12 ? monthIndex - 12 : monthIndex;
        const eventDate = new Date(
          parseInt(fullDateMatch[3]), 
          actualMonth, 
          parseInt(fullDateMatch[2])
        );
        
        return {
          eventTime: eventDate,
          confidence: 0.95,
          timePhrase: fullDateMatch[0],
          isExplicit: true
        };
      }
    }
    
    return null;
  }

  private extractRelativeTime(text: string): TemporalExtraction | null {
    const patterns = [
      // Hours ago
      { regex: /(\\d+)\\s*hours?\\s*ago/, unit: 'hours', confidence: 0.85 },
      // Minutes ago
      { regex: /(\\d+)\\s*minutes?\\s*ago/, unit: 'minutes', confidence: 0.9 },
      // Days ago
      { regex: /(\\d+)\\s*days?\\s*ago/, unit: 'days', confidence: 0.8 },
      // Weeks ago
      { regex: /(\\d+)\\s*weeks?\\s*ago/, unit: 'weeks', confidence: 0.75 },
      // "Earlier today"
      { regex: /earlier\\s*today/, unit: 'today', confidence: 0.85 },
      // "This morning"
      { regex: /this\\s*morning/, unit: 'morning', confidence: 0.8 },
      // "Last night"
      { regex: /last\\s*night/, unit: 'lastnight', confidence: 0.85 },
      // "Yesterday"
      { regex: /yesterday/, unit: 'yesterday', confidence: 0.9 }
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern.regex);
      if (match) {
        let eventTime = new Date(this.publishedDate);
        
        switch (pattern.unit) {
          case 'hours':
            eventTime.setHours(eventTime.getHours() - parseInt(match[1]));
            break;
          case 'minutes':
            eventTime.setMinutes(eventTime.getMinutes() - parseInt(match[1]));
            break;
          case 'days':
            eventTime.setDate(eventTime.getDate() - parseInt(match[1]));
            break;
          case 'weeks':
            eventTime.setDate(eventTime.getDate() - (parseInt(match[1]) * 7));
            break;
          case 'today':
            eventTime.setHours(eventTime.getHours() - 6); // Assume ~6 hours ago
            break;
          case 'morning':
            eventTime.setHours(9, 0, 0, 0); // 9 AM same day
            break;
          case 'lastnight':
            eventTime.setDate(eventTime.getDate() - 1);
            eventTime.setHours(21, 0, 0, 0); // 9 PM previous day
            break;
          case 'yesterday':
            eventTime.setDate(eventTime.getDate() - 1);
            break;
        }
        
        return {
          eventTime,
          confidence: pattern.confidence,
          timePhrase: match[0],
          isExplicit: false
        };
      }
    }
    
    return null;
  }

  private extractDayReference(text: string): TemporalExtraction | null {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = this.publishedDate.getDay();
    
    // Check for "last [day]" pattern
    const lastDayPattern = /last\\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/;
    const lastDayMatch = text.match(lastDayPattern);
    
    if (lastDayMatch) {
      const targetDay = days.indexOf(lastDayMatch[1]);
      let daysAgo = currentDay - targetDay;
      if (daysAgo <= 0) daysAgo += 7;
      
      const eventTime = new Date(this.publishedDate);
      eventTime.setDate(eventTime.getDate() - daysAgo);
      
      return {
        eventTime,
        confidence: 0.8,
        timePhrase: lastDayMatch[0],
        isExplicit: false
      };
    }
    
    // Check for "on [day]" pattern (assume most recent occurrence)
    const onDayPattern = /on\\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/;
    const onDayMatch = text.match(onDayPattern);
    
    if (onDayMatch) {
      const targetDay = days.indexOf(onDayMatch[1]);
      let daysAgo = currentDay - targetDay;
      if (daysAgo < 0) daysAgo += 7;
      if (daysAgo === 0) daysAgo = 7; // If same day, assume last week
      
      const eventTime = new Date(this.publishedDate);
      eventTime.setDate(eventTime.getDate() - daysAgo);
      
      return {
        eventTime,
        confidence: 0.7,
        timePhrase: onDayMatch[0],
        isExplicit: false
      };
    }
    
    return null;
  }

  /**
   * Extract all time references from text
   */
  extractAllTimeReferences(text: string): TemporalExtraction[] {
    const references: TemporalExtraction[] = [];
    const sentences = text.split(/[.!?]/);
    
    for (const sentence of sentences) {
      const extraction = this.extractEventTime(sentence);
      if (extraction && extraction.confidence > 0.5) {
        references.push(extraction);
      }
    }
    
    return references;
  }
}

/**
 * Helper function to find the most likely event time from article
 */
export function extractMostLikelyEventTime(
  articleText: string, 
  publishedDate: Date
): { eventTime: Date; confidence: number } {
  const parser = new TemporalParser(publishedDate);
  const extraction = parser.extractEventTime(articleText);
  
  if (extraction) {
    return {
      eventTime: extraction.eventTime,
      confidence: extraction.confidence
    };
  }
  
  // Fallback to published date
  return {
    eventTime: publishedDate,
    confidence: 0.3
  };
}