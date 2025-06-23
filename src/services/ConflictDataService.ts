import newsService from './NewsService';
import governmentSourcesService from './GovernmentSourcesService';
import osintService from './OSINTService';
import { EventProcessor } from './eventProcessor';
import { deduplicateTimelineEvents } from './deduplication';
import { VerificationService } from './verificationService';
import { NLPService } from './nlpService';
import { eventDatabase } from './EventDatabase';
import { 
  ConflictData, 
  TimelineEvent, 
  Alert, 
  Facility as NuclearFacility, 
  ThreatAssessment, 
  DemandData,
  NewsArticle,
  Casualties 
} from '../types';
import { 
  FACILITY_STATUS, 
  RADIATION_RISK, 
  SEVERITY_LEVELS, 
  ALERT_TYPES, 
  EVENT_TYPES, 
  THREAT_LEVELS, 
  THREAT_TRENDS, 
  DIPLOMATIC_STATUS, 
  UPDATE_INTERVALS 
} from '../constants';

// Type definitions moved to ../types.ts
// Using type aliases for compatibility
type DemandTracker = {
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
};

// Extend ConflictData to include DemandTracker
interface ExtendedConflictData extends ConflictData {
  demands: DemandTracker;
  lastGlobalUpdate: string;
}

class ConflictDataService {
  private data: ExtendedConflictData;
  private subscribers: ((data: ExtendedConflictData) => void)[] = [];
  private eventProcessor: EventProcessor;
  private verificationService: VerificationService;
  private nlpService: NLPService;
  private allArticles: NewsArticle[] = [];

  constructor() {
    this.data = this.getInitialData();
    this.eventProcessor = new EventProcessor();
    this.verificationService = new VerificationService();
    this.nlpService = new NLPService();
    this.startRealTimeUpdates();
  }

  private getInitialData(): ExtendedConflictData {
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
          status: FACILITY_STATUS.EVACUATED,
          lastStrike: '6 hours ago',
          severity: SEVERITY_LEVELS.HIGH,
          radiationRisk: RADIATION_RISK.NONE,
        },
        {
          id: '2',
          name: 'Natanz Nuclear Facility',
          location: 'Natanz, Iran',
          status: FACILITY_STATUS.DAMAGED,
          lastStrike: '2 days ago',
          severity: SEVERITY_LEVELS.CRITICAL,
          radiationRisk: RADIATION_RISK.MODERATE,
        },
        {
          id: '3',
          name: 'Bushehr Nuclear Plant',
          location: 'Bushehr, Iran',
          status: FACILITY_STATUS.OPERATIONAL,
          lastStrike: 'Never',
          severity: SEVERITY_LEVELS.LOW,
          radiationRisk: RADIATION_RISK.NONE,
        },
        {
          id: '4',
          name: 'Fordow Fuel Enrichment',
          location: 'Qom, Iran',
          status: FACILITY_STATUS.OFFLINE,
          lastStrike: '1 day ago',
          severity: SEVERITY_LEVELS.HIGH,
          radiationRisk: RADIATION_RISK.LOW,
        },
      ],
      alerts: [],
      threatLevel: {
        globalLevel: THREAT_LEVELS.HIGH,
        regions: [
          { name: 'Middle East', level: THREAT_LEVELS.CRITICAL, trend: THREAT_TRENDS.INCREASING },
          { name: 'Mediterranean', level: THREAT_LEVELS.MODERATE, trend: THREAT_TRENDS.STABLE },
          { name: 'Persian Gulf', level: THREAT_LEVELS.HIGH, trend: THREAT_TRENDS.INCREASING },
          { name: 'Red Sea', level: THREAT_LEVELS.MODERATE, trend: THREAT_TRENDS.INCREASING },
        ],
        nuclearThreat: true,
        lastAssessment: new Date().toISOString(),
      },
      timeline: [
        {
          id: '1',
          timestamp: new Date('2025-06-22T10:30:00Z'),
          title: 'US Strikes Iranian Nuclear Sites',
          description: 'United States launches offensive strikes on three Iranian nuclear facilities.',
          location: 'Multiple locations, Iran',
          type: EVENT_TYPES.STRIKE,
          severity: SEVERITY_LEVELS.CRITICAL,
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
        diplomaticStatus: DIPLOMATIC_STATUS.SUSPENDED,
      },
      lastGlobalUpdate: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      dataSource: 'demo' as const,
    };
  }

  private startRealTimeUpdates() {
    // Initial fetch
    this.fetchLatestData();

    // With NewsAPI free tier (100 requests/day), we need to be conservative
    // 100 requests / 24 hours = ~4 requests per hour
    // Let's update every 30 minutes to stay well within limits
    setInterval(() => {
      this.fetchLatestData();
    }, 30 * 60 * 1000); // Update every 30 minutes

    // Update UI with simulated changes between API calls
    setInterval(() => {
      this.updateData();
    }, 30000); // Update UI every 30 seconds
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
        this.data.casualties.israel.deaths = (this.data.casualties.israel.deaths || 0) + (Math.random() > 0.7 ? 1 : 0);
        this.data.casualties.israel.injured = (this.data.casualties.israel.injured || 0) + Math.floor(Math.random() * 3);
        this.data.casualties.israel.lastUpdate = 'Just now';
      } else {
        this.data.casualties.iran.deaths = (this.data.casualties.iran.deaths || 0) + (Math.random() > 0.8 ? Math.floor(Math.random() * 2) : 0);
        this.data.casualties.iran.injured = (this.data.casualties.iran.injured || 0) + Math.floor(Math.random() * 5);
        this.data.casualties.iran.lastUpdate = 'Just now';
      }
      this.notifySubscribers();
    }
  }

  public subscribe(callback: (data: ExtendedConflictData) => void) {
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

  public getCurrentData(): ExtendedConflictData {
    return { ...this.data };
  }

  // Fetch real data from external APIs
  public async fetchLatestData(): Promise<ExtendedConflictData> {
    console.log('🔄 Starting fetchLatestData...');
    try {
      // Create timeout wrapper for API calls
      const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, name: string): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error(`${name} timeout after ${timeoutMs}ms`)), timeoutMs)
          )
        ]);
      };

      // Fetch from multiple sources in parallel with timeouts and fallbacks
      const results = await Promise.allSettled([
        withTimeout(newsService.fetchConflictNews(), 15000, 'News Service'),
        withTimeout(governmentSourcesService.fetchAllGovernmentSources(), 15000, 'Government Sources'),
        withTimeout(osintService.gatherIntelligence(), 30000, 'OSINT Service')
      ]);

      const newsArticles = results[0].status === 'fulfilled' ? results[0].value : [];
      const governmentData = results[1].status === 'fulfilled' ? results[1].value : [];
      const osintData = results[2].status === 'fulfilled' ? results[2].value : null;

      // Log any failures
      results.forEach((result, index) => {
        const names = ['News Service', 'Government Sources', 'OSINT Service'];
        if (result.status === 'rejected') {
          console.warn(`⚠️ ${names[index]} failed:`, result.reason);
        } else {
          console.log(`✅ ${names[index]} completed successfully`);
        }
      });

      // Process news articles for casualties and events
      if (newsArticles.length > 0) {
        this.processNewsArticles(newsArticles);
      }

      // Update facility status from government sources
      if (governmentData.length > 0) {
        this.processGovernmentData(governmentData);
      }

      // Update threat level from OSINT
      if (osintData && (osintData.explosions?.length > 0 || osintData.gdelt?.events?.length > 0 || osintData.acled?.events?.length > 0)) {
        this.processOSINTData(osintData);
      }

      this.data.lastGlobalUpdate = new Date().toISOString();
      this.notifySubscribers();
      
      console.log('✅ fetchLatestData completed successfully');
      return this.getCurrentData();
    } catch (error) {
      console.error('❌ Error in fetchLatestData:', error);
      // Ensure we notify subscribers with current data even on error
      this.notifySubscribers();
      // Return current data as fallback
      return this.getCurrentData();
    }
  }

  private processNewsArticles(articles: any[]) {
    // Store articles for verification
    this.allArticles = [...articles, ...this.allArticles].slice(0, 200); // Keep last 200 articles
    
    // Use EventProcessor for accurate timeline event extraction
    const processedEvents = this.eventProcessor.processNewsArticles(articles);
    
    // Verify events using VerificationService
    const verificationResults = this.verificationService.verifyEventBatch(processedEvents, this.allArticles);
    
    // Convert processed events to local TimelineEvent format with verification data
    const newEvents = processedEvents.map(event => {
      const verification = verificationResults.get(event.id);
      return {
        id: event.id,
        timestamp: new Date(event.timestamp),
        title: event.title,
        description: event.description,
        location: event.location,
        type: this.mapEventType(event.type),
        severity: event.severity,
        source: event.metadata?.source || 'Unknown',
        confidence: event.confidence,
        metadata: {
          ...event.metadata,
          verified: verification?.verified || false,
          verificationConfidence: verification?.confidence || event.confidence,
          sources: verification?.sources || event.metadata?.sources || []
        }
      };
    });
    
    // Merge with existing timeline, avoiding duplicates
    const existingIds = new Set(this.data.timeline.map(e => e.id));
    const uniqueNewEvents = newEvents.filter(e => !existingIds.has(e.id));
    
    // Add new events and sort by actual event time
    this.data.timeline = [...uniqueNewEvents, ...this.data.timeline]
      .sort((a, b) => {
        const timeA = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : a.timestamp.getTime();
        const timeB = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : b.timestamp.getTime();
        return timeB - timeA;
      })
      .slice(0, 50); // Keep latest 50 events
    
    // Store new events in database
    if (uniqueNewEvents.length > 0) {
      eventDatabase.storeEvents(uniqueNewEvents).catch(err => 
        console.error('Failed to store events in database:', err)
      );
    }
    
    // Extract casualties from articles using enhanced NLP
    const recentArticles = articles.slice(0, 10);
    for (const article of recentArticles) {
      // Use NLP service to extract casualties with party information
      const nlpResults = this.nlpService.analyzeArticle(article);
      const casualties = nlpResults.entities.casualties;
      
      for (const casualty of casualties) {
        if (casualty.party) {
          const partyKey = casualty.party as keyof Casualties;
          
          // Initialize party casualties if not exists
          if (!this.data.casualties[partyKey] && partyKey !== 'lastUpdate') {
            this.data.casualties[partyKey] = { injured: 0 };
          }
          
          const partyCasualties = this.data.casualties[partyKey];
          if (partyCasualties && typeof partyCasualties !== 'string') {
            if (casualty.type === 'killed') {
              partyCasualties.deaths = (partyCasualties.deaths || 0) + casualty.count;
            } else if (casualty.type === 'injured' || casualty.type === 'wounded') {
              partyCasualties.injured = (partyCasualties.injured || 0) + casualty.count;
            } else if (casualty.type === 'casualties') {
              // Split casualties between killed and injured (rough estimate)
              partyCasualties.deaths = (partyCasualties.deaths || 0) + Math.floor(casualty.count * 0.3);
              partyCasualties.injured = (partyCasualties.injured || 0) + Math.floor(casualty.count * 0.7);
            }
            partyCasualties.lastUpdate = this.getTimeAgo(new Date(article.publishedAt));
          }
        }
      }
    }
    
    // Create alerts for high-confidence critical events
    const criticalEvents = processedEvents.filter(e => 
      (e.severity === 'critical' || e.severity === 'high') && 
      (e.confidence || 0) > 0.7
    );
    
    for (const event of criticalEvents) {
      const alert: Alert = {
        id: `alert-${event.id}`,
        timestamp: new Date(event.timestamp),
        title: event.title.substring(0, 100),
        description: event.description,
        severity: event.severity,
        type: this.mapAlertType(event.type),
        read: false
      };
      
      if (!this.data.alerts.find(a => a.id === alert.id)) {
        this.data.alerts.unshift(alert);
        this.data.alerts = this.data.alerts.slice(0, 15); // Keep latest 15
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
    if (data.explosions?.length > 5) {
      this.data.threatLevel.globalLevel = 5;
    } else if (data.explosions?.length > 2) {
      this.data.threatLevel.globalLevel = 4;
    }
    
    // Update threat level based on GDELT conflict intensity
    if (data.gdelt?.conflictIntensity) {
      const intensity = data.gdelt.conflictIntensity;
      if (intensity >= 80) {
        this.data.threatLevel.globalLevel = 5;
      } else if (intensity >= 60) {
        this.data.threatLevel.globalLevel = Math.max(4, this.data.threatLevel.globalLevel);
      }
    }
    
    // Update regional threat based on ACLED events
    if (data.acled?.events) {
      for (const event of data.acled.events) {
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
    
    // Update regional threat based on GDELT hotspots
    if (data.gdelt?.hotspots) {
      for (const hotspot of data.gdelt.hotspots) {
        const region = this.getRegionFromLocation(hotspot.location);
        if (region) {
          const regionData = this.data.threatLevel.regions.find(r => r.name === region);
          if (regionData && hotspot.intensity > 50) {
            regionData.trend = 'increasing';
          }
        }
      }
    }
  }

  private mapEventType(type: string): TimelineEvent['type'] {
    const typeMap: { [key: string]: TimelineEvent['type'] } = {
      'missile': 'missile',
      'strike': 'strike',
      'diplomatic': 'diplomacy',
      'evacuation': 'evacuation',
      'alert': 'strike',
      'nuclear': 'strike',
      'cyber': 'strike',
      'intelligence': 'strike'
    };
    return typeMap[type] || 'strike';
  }

  private mapAlertType(type: string): Alert['type'] {
    const alertMap: { [key: string]: Alert['type'] } = {
      'missile': 'missile',
      'strike': 'strike',
      'diplomatic': 'diplomatic',
      'nuclear': 'nuclear',
      'alert': 'missile',
      'cyber': 'strike',
      'intelligence': 'strike'
    };
    return alertMap[type] || 'strike';
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