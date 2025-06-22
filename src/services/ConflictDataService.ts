import newsService from './NewsService';
import governmentSourcesService from './GovernmentSourcesService';
import osintService from './OSINTService';

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
    // Initial fetch
    this.fetchLatestData();

    // Fetch real data every 60 seconds
    setInterval(() => {
      this.fetchLatestData();
    }, 60000); // Update every minute

    // Quick updates for simulated data between API calls
    setInterval(() => {
      this.updateData();
    }, 30000); // Update every 30 seconds
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

  // Fetch real data from external APIs
  public async fetchLatestData(): Promise<ConflictData> {
    try {
      // Fetch from multiple sources in parallel
      const [newsArticles, governmentData, osintData] = await Promise.all([
        newsService.fetchConflictNews(),
        governmentSourcesService.fetchAllGovernmentSources(),
        osintService.gatherIntelligence()
      ]);

      // Process news articles for casualties and events
      if (newsArticles.length > 0) {
        this.processNewsArticles(newsArticles);
      }

      // Update facility status from government sources
      if (governmentData.length > 0) {
        this.processGovernmentData(governmentData);
      }

      // Update threat level from OSINT
      if (osintData.explosions.length > 0 || osintData.events.length > 0) {
        this.processOSINTData(osintData);
      }

      this.data.lastGlobalUpdate = new Date().toISOString();
      this.notifySubscribers();
      
      return this.getCurrentData();
    } catch (error) {
      console.error('Error fetching latest data:', error);
      // Return current data as fallback
      return this.getCurrentData();
    }
  }

  private processNewsArticles(articles: any[]) {
    // Extract casualties from recent articles
    const recentArticles = articles.slice(0, 10); // Process latest 10 articles
    
    for (const article of recentArticles) {
      const text = article.title + ' ' + article.description;
      
      // Extract casualties
      const casualties = newsService.extractCasualties(text);
      if (casualties.killed || casualties.injured) {
        // Determine which country based on context
        const isIsrael = text.toLowerCase().includes('israel') || 
                        text.toLowerCase().includes('tel aviv');
        const isIran = text.toLowerCase().includes('iran') || 
                      text.toLowerCase().includes('tehran');
        
        if (isIsrael && casualties.killed) {
          this.data.casualties.israel.deaths = casualties.killed;
          this.data.casualties.israel.injured = casualties.injured || this.data.casualties.israel.injured;
          this.data.casualties.israel.lastUpdate = this.getTimeAgo(new Date(article.publishedAt));
        } else if (isIran && casualties.killed) {
          this.data.casualties.iran.deaths = casualties.killed;
          this.data.casualties.iran.injured = casualties.injured || this.data.casualties.iran.injured;
          this.data.casualties.iran.lastUpdate = this.getTimeAgo(new Date(article.publishedAt));
        }
      }
      
      // Create timeline events from articles
      const severity = newsService.analyzeSeverity(article);
      const locations = newsService.extractLocations(text);
      
      if (locations.length > 0) {
        const event: TimelineEvent = {
          id: article.url,
          timestamp: new Date(article.publishedAt),
          title: article.title,
          description: article.description,
          location: locations[0],
          type: this.categorizeEventType(text),
          severity: severity,
          source: article.source.name
        };
        
        // Add to timeline if not already present
        if (!this.data.timeline.find(e => e.id === event.id)) {
          this.data.timeline.unshift(event);
          this.data.timeline = this.data.timeline.slice(0, 20); // Keep latest 20
        }
      }
      
      // Create alerts for critical news
      if (severity === 'critical' || severity === 'high') {
        const alert: Alert = {
          id: `alert-${article.url}`,
          timestamp: new Date(article.publishedAt),
          title: article.title.substring(0, 100),
          description: article.description,
          severity: severity,
          type: this.categorizeAlertType(text),
          read: false
        };
        
        if (!this.data.alerts.find(a => a.id === alert.id)) {
          this.data.alerts.unshift(alert);
          this.data.alerts = this.data.alerts.slice(0, 10); // Keep latest 10
        }
      }
    }
  }

  private processGovernmentData(data: any[]) {
    // Update facility status from IAEA reports
    for (const report of data) {
      if (report.facilities) {
        for (const facilityName of report.facilities) {
          const facility = this.data.facilities.find(f => 
            f.name.toLowerCase().includes(facilityName.toLowerCase())
          );
          if (facility) {
            // Update facility based on report
            if (report.title.toLowerCase().includes('damage')) {
              facility.status = 'damaged';
            } else if (report.title.toLowerCase().includes('operational')) {
              facility.status = 'operational';
            }
            facility.lastStrike = this.getTimeAgo(new Date(report.date));
          }
        }
      }
    }
  }

  private processOSINTData(data: any) {
    // Update threat level based on activity
    if (data.explosions.length > 5) {
      this.data.threatLevel.globalLevel = 5;
    } else if (data.explosions.length > 2) {
      this.data.threatLevel.globalLevel = 4;
    }
    
    // Update regional threat based on events
    if (data.events) {
      for (const event of data.events) {
        const region = this.getRegionFromLocation(event.location);
        if (region) {
          const regionData = this.data.threatLevel.regions.find(r => r.name === region);
          if (regionData && event.fatalities > 0) {
            regionData.trend = 'increasing';
            regionData.level = Math.min(5, regionData.level + 1);
          }
        }
      }
    }
  }

  private categorizeEventType(text: string): TimelineEvent['type'] {
    const lower = text.toLowerCase();
    if (lower.includes('missile') || lower.includes('rocket')) return 'missile';
    if (lower.includes('strike') || lower.includes('attack')) return 'strike';
    if (lower.includes('diplomatic') || lower.includes('talks')) return 'diplomacy';
    if (lower.includes('evacuate')) return 'evacuation';
    if (lower.includes('casualt') || lower.includes('killed')) return 'casualty';
    return 'strike';
  }

  private categorizeAlertType(text: string): Alert['type'] {
    const lower = text.toLowerCase();
    if (lower.includes('missile') || lower.includes('rocket')) return 'missile';
    if (lower.includes('strike') || lower.includes('attack')) return 'strike';
    if (lower.includes('diplomatic') || lower.includes('talks')) return 'diplomatic';
    if (lower.includes('nuclear') || lower.includes('facility')) return 'nuclear';
    if (lower.includes('casualt') || lower.includes('killed')) return 'casualty';
    return 'strike';
  }

  private getRegionFromLocation(location: string): string | null {
    if (location.includes('Israel') || location.includes('Tel Aviv')) return 'Middle East';
    if (location.includes('Iran') || location.includes('Tehran')) return 'Persian Gulf';
    if (location.includes('Mediterranean')) return 'Mediterranean';
    if (location.includes('Red Sea')) return 'Red Sea';
    return null;
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
}

export const conflictDataService = new ConflictDataService();