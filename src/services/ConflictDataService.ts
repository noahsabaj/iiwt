export interface ConflictData {
  casualties: {
    israel: { deaths: number; injured: number; lastUpdate: string };
    iran: { deaths: number; injured: number; lastUpdate: string };
  };
  facilities: NuclearFacility[];
  alerts: Alert[];
  threatLevel: ThreatAssessment;
  timeline: TimelineEvent[];
  demands: DemandTracker;
  lastGlobalUpdate: string;
}

export interface NuclearFacility {
  id: string;
  name: string;
  location: string;
  status: 'operational' | 'damaged' | 'evacuated' | 'offline';
  lastStrike: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  radiationRisk: 'none' | 'low' | 'moderate' | 'high';
}

export interface Alert {
  id: string;
  timestamp: Date;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'missile' | 'strike' | 'casualty' | 'diplomatic' | 'nuclear';
  read: boolean;
}

export interface ThreatAssessment {
  globalLevel: 1 | 2 | 3 | 4 | 5;
  regions: {
    name: string;
    level: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  }[];
}

export interface TimelineEvent {
  id: string;
  timestamp: Date;
  title: string;
  description: string;
  location: string;
  type: 'strike' | 'missile' | 'diplomacy' | 'evacuation' | 'casualty';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
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

class ConflictDataService {
  private data: ConflictData;
  private subscribers: ((data: ConflictData) => void)[] = [];

  constructor() {
    this.data = this.getInitialData();
    this.startRealTimeUpdates();
  }

  private getInitialData(): ConflictData {
    return {
      casualties: {
        israel: { deaths: 24, injured: 685, lastUpdate: '2 min ago' },
        iran: { deaths: 156, injured: 892, lastUpdate: '5 min ago' },
      },
      facilities: [
        {
          id: '1',
          name: 'Arak Heavy Water Reactor',
          location: 'Arak, Iran',
          status: 'evacuated',
          lastStrike: '6 hours ago',
          severity: 'high',
          radiationRisk: 'none',
        },
        {
          id: '2',
          name: 'Natanz Nuclear Facility',
          location: 'Natanz, Iran',
          status: 'damaged',
          lastStrike: '2 days ago',
          severity: 'critical',
          radiationRisk: 'moderate',
        },
        {
          id: '3',
          name: 'Bushehr Nuclear Plant',
          location: 'Bushehr, Iran',
          status: 'operational',
          lastStrike: 'Never',
          severity: 'low',
          radiationRisk: 'none',
        },
        {
          id: '4',
          name: 'Fordow Fuel Enrichment',
          location: 'Qom, Iran',
          status: 'offline',
          lastStrike: '1 day ago',
          severity: 'high',
          radiationRisk: 'low',
        },
      ],
      alerts: [],
      threatLevel: {
        globalLevel: 4,
        regions: [
          { name: 'Middle East', level: 5, trend: 'increasing' },
          { name: 'Mediterranean', level: 3, trend: 'stable' },
          { name: 'Persian Gulf', level: 4, trend: 'increasing' },
          { name: 'Red Sea', level: 3, trend: 'increasing' },
        ],
      },
      timeline: [
        {
          id: '1',
          timestamp: new Date('2025-06-22T10:30:00Z'),
          title: 'US Strikes Iranian Nuclear Sites',
          description: 'United States launches offensive strikes on three Iranian nuclear facilities.',
          location: 'Multiple locations, Iran',
          type: 'strike',
          severity: 'critical',
          source: 'CNN'
        },
        // Add more timeline events...
      ],
      demands: {
        israel: {
          demands: [
            'Complete halt to Iranian nuclear enrichment program',
            'Withdrawal of Iranian forces from Syria and Lebanon',
            'End Iranian support for Hezbollah and Hamas',
            'International inspection of all Iranian military sites',
          ],
          redLines: [
            'No Iranian nuclear weapons capability',
            'No Iranian missiles targeting Israeli cities',
            'No Iranian proxy attacks on Israeli territory',
          ],
          lastUpdate: '1 hour ago',
        },
        iran: {
          demands: [
            'Immediate end to Israeli strikes on Iranian territory',
            'Lifting of all international sanctions',
            'Recognition of Iranian nuclear rights under NPT',
            'Israeli withdrawal from occupied territories',
          ],
          redLines: [
            'No foreign military bases in the region',
            'No interference in Iranian internal affairs',
            'Respect for Iranian sovereignty',
          ],
          lastUpdate: '2 hours ago',
        },
        diplomaticStatus: 'suspended',
      },
      lastGlobalUpdate: new Date().toISOString(),
    };
  }

  private startRealTimeUpdates() {
    // Simulate real-time data updates
    setInterval(() => {
      this.updateData();
    }, 30000); // Update every 30 seconds

    // Faster updates for casualties
    setInterval(() => {
      this.updateCasualties();
    }, 10000); // Update every 10 seconds
  }

  private updateData() {
    // Simulate random data changes
    if (Math.random() > 0.7) {
      this.data.threatLevel.globalLevel = Math.max(3, Math.min(5, 
        this.data.threatLevel.globalLevel + (Math.random() > 0.5 ? 1 : -1)
      )) as 1 | 2 | 3 | 4 | 5;
    }

    // Update regional threats
    this.data.threatLevel.regions = this.data.threatLevel.regions.map(region => ({
      ...region,
      level: Math.max(2, Math.min(5, 
        region.level + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0)
      )),
    }));

    this.data.lastGlobalUpdate = new Date().toISOString();
    this.notifySubscribers();
  }

  private updateCasualties() {
    // Simulate casualty updates
    if (Math.random() > 0.85) {
      if (Math.random() > 0.5) {
        this.data.casualties.israel.deaths += Math.random() > 0.7 ? 1 : 0;
        this.data.casualties.israel.injured += Math.floor(Math.random() * 3);
        this.data.casualties.israel.lastUpdate = 'Just now';
      } else {
        this.data.casualties.iran.deaths += Math.random() > 0.8 ? Math.floor(Math.random() * 2) : 0;
        this.data.casualties.iran.injured += Math.floor(Math.random() * 5);
        this.data.casualties.iran.lastUpdate = 'Just now';
      }
      this.notifySubscribers();
    }
  }

  public subscribe(callback: (data: ConflictData) => void) {
    this.subscribers.push(callback);
    // Immediately call with current data
    callback(this.data);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.data));
  }

  public getCurrentData(): ConflictData {
    return { ...this.data };
  }

  // Simulate fetching from external APIs
  public async fetchLatestData(): Promise<ConflictData> {
    // In a real implementation, this would call actual news APIs
    // For now, we simulate API delay and return current data
    await new Promise(resolve => setTimeout(resolve, 1000));
    return this.getCurrentData();
  }
}

export const conflictDataService = new ConflictDataService();