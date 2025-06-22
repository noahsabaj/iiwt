/**
 * Type definitions for the Israel-Iran War Tracker
 */

export interface TimelineEvent {
  id: string;
  timestamp: Date | string;
  type: 'strike' | 'missile' | 'diplomacy' | 'evacuation' | 'casualty' | 'nuclear' | 'cyber' | 'alert' | 'intelligence' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: string;
  source?: string;
  metadata?: {
    source?: string;
    url?: string;
    publishedAt?: string;
    confidence?: number;
    sources?: string[];
    duplicateCount?: number;
    isDuplicate?: boolean;
    mergedFrom?: string[];
    eventTime?: string;
    timeConfidence?: number;
    entities?: {
      people: string[];
      organizations: string[];
      locations: string[];
      weapons: string[];
      operations: string[];
    };
  };
  confidence?: number;
}

export interface Alert {
  id: string;
  type: 'missile' | 'strike' | 'casualty' | 'diplomatic' | 'nuclear' | 'cyber' | 'evacuation' | 'military';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location?: string;
  timestamp: Date | string;
  isActive?: boolean;
  read?: boolean;
}

export interface Facility {
  id: string;
  name: string;
  location?: string;
  status: 'operational' | 'damaged' | 'destroyed' | 'evacuated' | 'offline';
  radiationRisk: 'none' | 'low' | 'moderate' | 'high' | 'critical';
  severity?: 'low' | 'moderate' | 'high' | 'critical';
  lastUpdate?: string;
  lastStrike: string;
  coordinates?: { lat: number; lng: number };
}

export interface CasualtyData {
  military?: number;
  civilian?: number;
  deaths?: number;
  injured: number;
  lastUpdate?: string;
}

export interface Casualties {
  israel: CasualtyData;
  iran: CasualtyData;
  usa?: CasualtyData;
  houthis?: CasualtyData;
  hezbollah?: CasualtyData;
  syria?: CasualtyData;
  iraq?: CasualtyData;
  other?: CasualtyData;
  lastUpdate?: string;
}

export interface ThreatAssessment {
  globalLevel: number; // 1-5
  regions: Array<{
    name: string;
    level: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  }>;
  nuclearThreat: boolean;
  lastAssessment: string;
}

export interface DemandData {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdate: string;
}

export interface DemandTracker {
  israel: {
    demands: string[];
    redLines: string[];
    lastUpdate: string;
  };
  iran: {
    demands: string[];
    redLines: string[];
    lastUpdate: string;
  };
  diplomaticStatus: 'active' | 'stalled' | 'suspended' | 'none';
}

export interface ConflictData {
  timeline: TimelineEvent[];
  alerts: Alert[];
  facilities: Facility[];
  casualties: Casualties;
  threatLevel: ThreatAssessment;
  demands?: DemandTracker;
  lastUpdate: string;
  dataSource: 'live' | 'demo';
}

export interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}