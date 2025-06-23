/**
 * Open Source Intelligence (OSINT) Service
 * Aggregates data from various OSINT sources for conflict monitoring
 * Integrates GDELT, ACLED, and other real-time intelligence sources
 */

import { configService } from './ConfigService';

interface OSINTSource {
  name: string;
  type: 'flight' | 'maritime' | 'social' | 'satellite' | 'cyber';
  description: string;
  dataType: string;
}

interface FlightData {
  id: string;
  registration: string;
  aircraft: string;
  origin: string;
  destination: string;
  altitude: number;
  speed: number;
  heading: number;
  timestamp: Date;
  military?: boolean;
}

interface FireData {
  latitude: number;
  longitude: number;
  brightness: number;
  confidence: number;
  timestamp: Date;
  satellite: string;
}

interface GDELTEvent {
  globalEventID: string;
  dateAdded: string;
  eventDate: string;
  actor1Name: string;
  actor1CountryCode: string;
  actor2Name: string;
  actor2CountryCode: string;
  eventCode: string;
  eventRootCode: string;
  goldsteinScale: number; // -10 to +10 scale of event impact
  numMentions: number;
  numSources: number;
  numArticles: number;
  avgTone: number;
  actionGeo_Lat?: number;
  actionGeo_Long?: number;
  actionGeo_FullName?: string;
  sourceURL: string;
}

interface ACLEDEvent {
  id: string;
  data_id: string;
  event_date: string;
  event_type: string;
  sub_event_type: string;
  actor1: string;
  actor2: string;
  country: string;
  location: string;
  latitude: number;
  longitude: number;
  fatalities: number;
  notes: string;
  source: string;
  tags?: string[];
}

export interface OSINTData {
  gdelt: {
    events: GDELTEvent[];
    conflictIntensity: number; // 0-100 based on Goldstein scale
    hotspots: { lat: number; lng: number; intensity: number; location: string }[];
  };
  acled: {
    events: ACLEDEvent[];
    fatalities24h: number;
    battleEvents: number;
    explosionEvents: number;
  };
  flights: FlightData[];
  explosions: FireData[];
  socialIntel: {
    trendingTopics: string[];
    breakingAlerts: { source: string; message: string; timestamp: Date }[];
  };
  timestamp: Date;
}

export class OSINTService {
  private sources: OSINTSource[] = [
    {
      name: 'Flightradar24',
      type: 'flight',
      description: 'Track military and civilian aircraft movements',
      dataType: 'Military transport, reconnaissance flights'
    },
    {
      name: 'FIRMS (NASA)',
      type: 'satellite',
      description: 'Fire Information for Resource Management System',
      dataType: 'Detect explosions, fires from strikes'
    },
    {
      name: 'MarineTraffic',
      type: 'maritime',
      description: 'Track naval vessels and shipping',
      dataType: 'Naval movements in Persian Gulf, Mediterranean'
    },
    {
      name: 'Sentinel Hub',
      type: 'satellite',
      description: 'European Space Agency satellite imagery',
      dataType: 'Damage assessment, facility monitoring'
    },
    {
      name: 'ACLED',
      type: 'social',
      description: 'Armed Conflict Location & Event Data',
      dataType: 'Verified conflict events with coordinates'
    }
  ];

  /**
   * Track military flights in the region
   * Note: Requires Flightradar24 API access or scraping
   */
  async trackMilitaryFlights(): Promise<FlightData[]> {
    // Define areas of interest
    const regions = [
      { name: 'Israel', bounds: { lat: [29.5, 33.3], lng: [34.2, 35.9] } },
      { name: 'Iran', bounds: { lat: [25.0, 39.8], lng: [44.0, 63.3] } },
      { name: 'Syria', bounds: { lat: [32.3, 37.3], lng: [35.7, 42.4] } }
    ];

    // Military aircraft identifiers
    const militaryIdentifiers = [
      'IAF', // Israeli Air Force
      'IRIAF', // Islamic Republic of Iran Air Force
      'RCH', // US Military transport
      'CNV', // US Navy
    ];

    // In production, this would call Flightradar24 API
    // For now, return mock data structure
    return [
      {
        id: 'IAF358',
        registration: 'Unknown',
        aircraft: 'F-35I Adir',
        origin: 'LLBG', // Ben Gurion
        destination: 'Unknown',
        altitude: 35000,
        speed: 450,
        heading: 45,
        timestamp: new Date(),
        military: true
      }
    ];
  }

  /**
   * Detect fires/explosions using NASA FIRMS data
   * Free API available at: https://firms.modaps.eosdis.nasa.gov/api/
   */
  async detectExplosions(): Promise<FireData[]> {
    const config = configService.getConfig();
    const API_KEY = config.nasaFirmsKey || '';
    
    // Return demo data if no API key
    if (!API_KEY || config.isDemoMode) {
      return this.getDemoExplosionData();
    }
    
    const baseUrl = 'https://firms.modaps.eosdis.nasa.gov/api/data';
    
    // Areas to monitor (Iran nuclear facilities)
    const facilities = [
      { name: 'Natanz', lat: 33.7222, lng: 51.9161 },
      { name: 'Arak', lat: 34.0541, lng: 49.2311 },
      { name: 'Bushehr', lat: 28.8290, lng: 50.8846 },
      { name: 'Fordow', lat: 34.8851, lng: 50.9956 }
    ];

    try {
      // FIRMS provides CSV/JSON data for fire detections
      const promises = facilities.map(async (facility) => {
        const params = new URLSearchParams({
          source: 'VIIRS_SNPP_NRT', // Near real-time VIIRS
          day_range: '1', // Last 24 hours
          area: `${facility.lat-0.5},${facility.lng-0.5},${facility.lat+0.5},${facility.lng+0.5}`
        });

        const paramsWithoutKey = new URLSearchParams({
          source: 'VIIRS_SNPP_NRT',
          day_range: '1',
          area: `${facility.lat-0.5},${facility.lng-0.5},${facility.lat+0.5},${facility.lng+0.5}`
        });
        
        const response = await fetch(
          configService.getOsintApiUrl('firms', `/area?${paramsWithoutKey}`)
        );
        return response.json();
      });

      const results = await Promise.all(promises);
      
      // Filter for high-brightness anomalies (potential explosions)
      return results.flat().filter((fire: any) => 
        fire.bright_ti4 > 350 && // High temperature
        fire.confidence > 80      // High confidence
      );
    } catch (error) {
      console.error('Error fetching FIRMS data:', error);
      // Return demo data on error
      return this.getDemoExplosionData();
    }
  }

  /**
   * Fetch real-time events from GDELT Project
   * Free, no API key required
   */
  async fetchGDELTEvents(): Promise<GDELTEvent[]> {
    const baseUrl = 'https://api.gdeltproject.org/api/v2/doc/doc';
    
    // Build query for Israel-Iran conflict
    const query = encodeURIComponent(
      '(Israel OR Iran) AND (strike OR attack OR missile OR nuclear OR military OR conflict) ' +
      'sourcecountry:(IS OR IR) OR locationcc:(IS OR IR)'
    );
    
    const params = new URLSearchParams({
      query: query,
      mode: 'ArtList',
      maxrecords: '50',
      timespan: '24h',
      format: 'json',
      sort: 'DateDesc'
    });

    try {
      const response = await fetch(`${baseUrl}?${params}`);
      const data = await response.json();
      
      if (!data.articles) return [];
      
      // Convert GDELT articles to events
      return data.articles.map((article: any) => ({
        globalEventID: article.id || Math.random().toString(),
        dateAdded: article.seendate,
        eventDate: article.dateadded,
        actor1Name: this.extractActor(article.title, 'Israel'),
        actor1CountryCode: 'IS',
        actor2Name: this.extractActor(article.title, 'Iran'),
        actor2CountryCode: 'IR',
        eventCode: this.classifyEvent(article.title),
        eventRootCode: this.getEventRootCode(article.title),
        goldsteinScale: this.calculateGoldsteinScale(article.title, article.tone),
        numMentions: 1,
        numSources: 1,
        numArticles: 1,
        avgTone: parseFloat(article.tone || '0'),
        actionGeo_Lat: article.lat,
        actionGeo_Long: article.lon,
        actionGeo_FullName: article.location,
        sourceURL: article.url
      }));
    } catch (error) {
      console.error('Error fetching GDELT data:', error);
      return [];
    }
  }

  /**
   * Get verified conflict events from ACLED
   * Enhanced with better error handling and data processing
   */
  async getACLEDEvents(): Promise<ACLEDEvent[]> {
    const config = configService.getConfig();
    const ACLED_KEY = config.acledKey || '';
    const ACLED_EMAIL = config.acledEmail || '';
    
    if (!ACLED_KEY || !ACLED_EMAIL || config.isDemoMode) {
      return this.getSimulatedACLEDData();
    }
    
    const params = new URLSearchParams({
      key: ACLED_KEY,
      email: ACLED_EMAIL,
      country: 'Iran|Israel|Yemen|Lebanon|Syria',
      event_date: this.getDateRange(7), // Last 7 days
      event_type: 'Battles|Explosions/Remote violence|Strategic developments',
      limit: '100'
    });

    try {
      const response = await fetch(
        `https://api.acleddata.com/acled/read?${params}`
      );
      const data = await response.json();
      
      if (!data.data) return [];
      
      return data.data.map((event: any) => ({
        id: event.id,
        data_id: event.data_id,
        event_date: event.event_date,
        event_type: event.event_type,
        sub_event_type: event.sub_event_type,
        actor1: event.actor1,
        actor2: event.actor2,
        country: event.country,
        location: event.location,
        latitude: parseFloat(event.latitude),
        longitude: parseFloat(event.longitude),
        fatalities: parseInt(event.fatalities) || 0,
        notes: event.notes,
        source: event.source,
        tags: this.extractTags(event.notes)
      }));
    } catch (error) {
      console.error('Error fetching ACLED data:', error);
      return this.getSimulatedACLEDData();
    }
  }

  /**
   * Get simulated ACLED data when API is unavailable
   */
  private getSimulatedACLEDData(): ACLEDEvent[] {
    const events: ACLEDEvent[] = [
      {
        id: 'sim-1',
        data_id: 'ACLED-SIM-001',
        event_date: new Date().toISOString().split('T')[0],
        event_type: 'Explosions/Remote violence',
        sub_event_type: 'Air/drone strike',
        actor1: 'Military Forces of Israel',
        actor2: 'Iran',
        country: 'Iran',
        location: 'Isfahan',
        latitude: 32.6546,
        longitude: 51.6680,
        fatalities: 0,
        notes: 'Israeli airstrikes reported near military installations',
        source: 'Local Media',
        tags: ['airstrike', 'military', 'Isfahan']
      },
      {
        id: 'sim-2',
        data_id: 'ACLED-SIM-002',
        event_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        event_type: 'Battles',
        sub_event_type: 'Armed clash',
        actor1: 'Hezbollah',
        actor2: 'Military Forces of Israel',
        country: 'Lebanon',
        location: 'Southern Lebanon',
        latitude: 33.2778,
        longitude: 35.2844,
        fatalities: 3,
        notes: 'Cross-border exchange of fire',
        source: 'Reuters',
        tags: ['border', 'clash', 'Hezbollah']
      }
    ];
    
    return events;
  }

  /**
   * Helper functions for GDELT processing
   */
  private extractActor(title: string, country: string): string {
    const lowerTitle = title.toLowerCase();
    if (country === 'Israel' && lowerTitle.includes('israel')) return 'Israel';
    if (country === 'Iran' && lowerTitle.includes('iran')) return 'Iran';
    if (lowerTitle.includes('hezbollah')) return 'Hezbollah';
    if (lowerTitle.includes('hamas')) return 'Hamas';
    if (lowerTitle.includes('houthi')) return 'Houthis';
    return 'Unknown';
  }

  private classifyEvent(title: string): string {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('missile') || lowerTitle.includes('rocket')) return 'MISSILE_ATTACK';
    if (lowerTitle.includes('airstrike') || lowerTitle.includes('strike')) return 'AIR_STRIKE';
    if (lowerTitle.includes('nuclear')) return 'NUCLEAR_THREAT';
    if (lowerTitle.includes('cyber')) return 'CYBER_ATTACK';
    if (lowerTitle.includes('naval') || lowerTitle.includes('ship')) return 'NAVAL_INCIDENT';
    return 'MILITARY_ACTION';
  }

  private getEventRootCode(title: string): string {
    const code = this.classifyEvent(title);
    const rootMap: { [key: string]: string } = {
      'MISSILE_ATTACK': '18', // ASSAULT
      'AIR_STRIKE': '19', // FIGHT
      'NUCLEAR_THREAT': '13', // THREATEN
      'CYBER_ATTACK': '17', // COERCE
      'NAVAL_INCIDENT': '15', // EXHIBIT FORCE
      'MILITARY_ACTION': '14' // PROTEST
    };
    return rootMap[code] || '10';
  }

  private calculateGoldsteinScale(title: string, tone: string): number {
    // Goldstein scale: -10 (most conflictual) to +10 (most cooperative)
    const lowerTitle = title.toLowerCase();
    let scale = 0;
    
    // Negative events
    if (lowerTitle.includes('attack') || lowerTitle.includes('strike')) scale -= 7;
    if (lowerTitle.includes('kill') || lowerTitle.includes('casualt')) scale -= 9;
    if (lowerTitle.includes('nuclear')) scale -= 8;
    if (lowerTitle.includes('missile')) scale -= 6;
    
    // Positive events
    if (lowerTitle.includes('ceasefire') || lowerTitle.includes('peace')) scale += 7;
    if (lowerTitle.includes('negotiat') || lowerTitle.includes('talk')) scale += 5;
    if (lowerTitle.includes('aid') || lowerTitle.includes('humanitarian')) scale += 3;
    
    // Adjust by tone
    const toneValue = parseFloat(tone || '0');
    scale += toneValue * 0.1;
    
    return Math.max(-10, Math.min(10, scale));
  }

  private extractTags(text: string): string[] {
    const tags: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Extract relevant tags from text
    const keywords = [
      'missile', 'drone', 'airstrike', 'nuclear', 'cyber',
      'naval', 'border', 'civilian', 'military', 'infrastructure'
    ];
    
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        tags.push(keyword);
      }
    });
    
    return tags;
  }

  private getDateRange(days: number): string {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    return `${start.toISOString().split('T')[0]}|${end.toISOString().split('T')[0]}`;
  }

  /**
   * Monitor social media for OSINT
   * Enhanced with simulated real-time alerts
   */
  async monitorSocialOSINT(): Promise<{
    trendingTopics: string[];
    breakingAlerts: { source: string; message: string; timestamp: Date }[];
  }> {
    // Simulated trending topics based on current events
    const trendingTopics = [
      '#IranNuclear',
      '#IronDome',
      '#MiddleEastConflict',
      '#OSINT',
      '#BreakingNews',
      'Natanz',
      'F-35',
      'Hezbollah'
    ];

    // Simulated breaking alerts from OSINT sources
    const breakingAlerts = [
      {
        source: '@OSINTdefender',
        message: 'ALERT: Unusual military aircraft activity detected over eastern Mediterranean',
        timestamp: new Date(Date.now() - 1000 * 60 * 15) // 15 min ago
      },
      {
        source: '@IntelCrab',
        message: 'Satellite imagery shows increased activity at Iranian missile sites',
        timestamp: new Date(Date.now() - 1000 * 60 * 45) // 45 min ago
      },
      {
        source: 'militarymaps',
        message: 'Cross-border artillery exchange reported along Lebanon-Israel border',
        timestamp: new Date(Date.now() - 1000 * 60 * 90) // 90 min ago
      }
    ];

    // In production, this would:
    // 1. Connect to Twitter API v2 for real-time tweets
    // 2. Use Telegram Bot API to monitor channels
    // 3. Apply NLP to extract relevant intelligence
    // 4. Cross-reference with known OSINT accounts
    
    return {
      trendingTopics,
      breakingAlerts: breakingAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    };
  }

  /**
   * Get demo explosion data when FIRMS API is unavailable
   */
  private getDemoExplosionData(): FireData[] {
    const now = new Date();
    return [
      {
        latitude: 33.7222, // Natanz
        longitude: 51.9161,
        brightness: 320,
        confidence: 75,
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2), // 2 hours ago
        satellite: 'VIIRS'
      },
      {
        latitude: 34.0541, // Arak
        longitude: 49.2311,
        brightness: 280,
        confidence: 65,
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 6), // 6 hours ago
        satellite: 'MODIS'
      }
    ];
  }

  /**
   * Calculate conflict intensity from GDELT events
   */
  private calculateConflictIntensity(events: GDELTEvent[]): number {
    if (events.length === 0) return 0;
    
    // Average negative Goldstein scores
    const negativeEvents = events.filter(e => e.goldsteinScale < 0);
    if (negativeEvents.length === 0) return 0;
    
    const avgGoldstein = negativeEvents.reduce((sum, e) => sum + Math.abs(e.goldsteinScale), 0) / negativeEvents.length;
    const eventFrequency = Math.min(negativeEvents.length / 10, 1); // Normalize to 0-1
    
    // Combine average intensity with frequency
    return Math.round((avgGoldstein / 10 * 0.7 + eventFrequency * 0.3) * 100);
  }

  /**
   * Identify geographic hotspots from events
   */
  private identifyHotspots(gdeltEvents: GDELTEvent[], acledEvents: ACLEDEvent[]): 
    { lat: number; lng: number; intensity: number; location: string }[] {
    
    const locationMap = new Map<string, { lat: number; lng: number; count: number; goldstein: number }>();
    
    // Process GDELT events
    gdeltEvents.forEach(event => {
      if (event.actionGeo_Lat && event.actionGeo_Long && event.actionGeo_FullName) {
        const key = `${event.actionGeo_Lat},${event.actionGeo_Long}`;
        const existing = locationMap.get(key) || { 
          lat: event.actionGeo_Lat, 
          lng: event.actionGeo_Long, 
          count: 0, 
          goldstein: 0 
        };
        existing.count++;
        existing.goldstein += Math.abs(event.goldsteinScale);
        locationMap.set(key, existing);
      }
    });
    
    // Process ACLED events
    acledEvents.forEach(event => {
      const key = `${event.latitude},${event.longitude}`;
      const existing = locationMap.get(key) || { 
        lat: event.latitude, 
        lng: event.longitude, 
        count: 0, 
        goldstein: 0 
      };
      existing.count += 2; // ACLED events are verified, give more weight
      existing.goldstein += 7; // Default high conflict score
      locationMap.set(key, existing);
    });
    
    // Convert to hotspots
    return Array.from(locationMap.entries())
      .map(([key, data]) => ({
        lat: data.lat,
        lng: data.lng,
        intensity: Math.min((data.count * 10 + data.goldstein) / 2, 100),
        location: this.getLocationName(data.lat, data.lng)
      }))
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 10); // Top 10 hotspots
  }

  private getLocationName(lat: number, lng: number): string {
    // Simple location mapping - in production, use reverse geocoding
    const locations = [
      { name: 'Tehran', lat: 35.6892, lng: 51.3890, radius: 0.5 },
      { name: 'Isfahan', lat: 32.6546, lng: 51.6680, radius: 0.5 },
      { name: 'Natanz', lat: 33.7222, lng: 51.9161, radius: 0.3 },
      { name: 'Tel Aviv', lat: 32.0853, lng: 34.7818, radius: 0.3 },
      { name: 'Jerusalem', lat: 31.7683, lng: 35.2137, radius: 0.3 },
      { name: 'Damascus', lat: 33.5138, lng: 36.2765, radius: 0.5 },
      { name: 'Beirut', lat: 33.8938, lng: 35.5018, radius: 0.3 }
    ];
    
    for (const loc of locations) {
      const distance = Math.sqrt(
        Math.pow(lat - loc.lat, 2) + Math.pow(lng - loc.lng, 2)
      );
      if (distance <= loc.radius) {
        return loc.name;
      }
    }
    
    return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  }

  /**
   * Aggregate all OSINT sources with enhanced data
   */
  async gatherIntelligence(): Promise<OSINTData> {
    const [gdeltResult, acledResult, flightsResult, explosionsResult] = await Promise.allSettled([
      this.fetchGDELTEvents(),
      this.getACLEDEvents(),
      this.trackMilitaryFlights(),
      this.detectExplosions()
    ]);

    const gdeltEvents = gdeltResult.status === 'fulfilled' ? gdeltResult.value : [];
    const acledEvents = acledResult.status === 'fulfilled' ? acledResult.value : [];
    const flights = flightsResult.status === 'fulfilled' ? flightsResult.value : [];
    const explosions = explosionsResult.status === 'fulfilled' ? explosionsResult.value : [];

    // Calculate ACLED statistics
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recent24hACLED = acledEvents.filter(e => new Date(e.event_date) >= last24h);
    
    const acledStats = {
      events: acledEvents,
      fatalities24h: recent24hACLED.reduce((sum, e) => sum + e.fatalities, 0),
      battleEvents: recent24hACLED.filter(e => e.event_type === 'Battles').length,
      explosionEvents: recent24hACLED.filter(e => e.event_type.includes('Explosion')).length
    };

    return {
      gdelt: {
        events: gdeltEvents,
        conflictIntensity: this.calculateConflictIntensity(gdeltEvents),
        hotspots: this.identifyHotspots(gdeltEvents, acledEvents)
      },
      acled: acledStats,
      flights,
      explosions,
      socialIntel: await this.monitorSocialOSINT(),
      timestamp: new Date()
    };
  }

  private getLastWeekDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  }
}

export const osintService = new OSINTService();
export default osintService;

/**
 * Additional OSINT Resources:
 * 
 * 1. Bellingcat's Online Investigation Toolkit
 * 2. LiveUAMap API (conflict mapping)
 * 3. Airpressure.info (flight tracking)
 * 4. VesselFinder API (ship tracking)
 * 5. Planet Labs (satellite imagery - paid)
 * 6. Maxar satellite imagery
 * 7. OSINT Framework (tools directory)
 * 
 * For production use:
 * - Set up proxy servers for accessing blocked content
 * - Implement data verification workflows
 * - Cross-reference multiple sources
 * - Use AI/ML for pattern detection
 */