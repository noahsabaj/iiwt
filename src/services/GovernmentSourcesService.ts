/**
 * Government & NGO Data Sources Service
 * Aggregates official information from various governmental and NGO sources
 */

import { configService } from './ConfigService';

interface OfficialSource {
  name: string;
  type: 'government' | 'ngo' | 'international';
  url: string;
  rssUrl?: string;
  apiUrl?: string;
  scrapeConfig?: {
    selector: string;
    updateInterval: number;
  };
}

class GovernmentSourcesService {
  private sources: OfficialSource[] = [
    // UN & International Organizations
    {
      name: 'IAEA - International Atomic Energy Agency',
      type: 'international',
      url: 'https://www.iaea.org',
      rssUrl: 'https://www.iaea.org/feeds/topnews.rss',
      scrapeConfig: {
        selector: '.news-story',
        updateInterval: 3600000 // 1 hour
      }
    },
    {
      name: 'UN OCHA - Humanitarian Affairs',
      type: 'international',
      url: 'https://www.unocha.org',
      apiUrl: 'https://api.reliefweb.int/v1/reports',
      rssUrl: 'https://reliefweb.int/feeds/country/ir'
    },
    {
      name: 'WHO - World Health Organization',
      type: 'international',
      url: 'https://www.who.int',
      rssUrl: 'https://www.who.int/feeds/entity/emergencies/news/en/rss.xml'
    },
    
    // Israeli Sources
    {
      name: 'IDF - Israel Defense Forces',
      type: 'government',
      url: 'https://www.idf.il/en/',
      rssUrl: 'https://www.idf.il/en/minisites/press-releases/rss/',
      scrapeConfig: {
        selector: '.press-release',
        updateInterval: 1800000 // 30 minutes
      }
    },
    {
      name: 'Israeli Ministry of Foreign Affairs',
      type: 'government',
      url: 'https://www.gov.il/en/departments/ministry_of_foreign_affairs',
      rssUrl: 'https://mfa.gov.il/MFA/PressRoom/RSS/Pages/default.aspx'
    },
    
    // Iranian Sources (often blocked/limited)
    {
      name: 'IRNA - Islamic Republic News Agency',
      type: 'government',
      url: 'https://en.irna.ir',
      rssUrl: 'https://en.irna.ir/rss',
      // Note: May require proxy/VPN access
    },
    
    // Think Tanks & Research
    {
      name: 'ISW - Institute for Study of War',
      type: 'ngo',
      url: 'https://www.understandingwar.org',
      rssUrl: 'https://www.understandingwar.org/rss.xml'
    },
    {
      name: 'CSIS - Center for Strategic Studies',
      type: 'ngo',
      url: 'https://www.csis.org',
      rssUrl: 'https://www.csis.org/regions/middle-east/feed'
    }
  ];

  /**
   * Fetch IAEA nuclear facility reports
   */
  async fetchIAEAReports() {
    try {
      // Use demo data due to CORS restrictions
      if (configService.shouldUseDemoData()) {
        return this.getDemoIAEAReports();
      }
      
      // IAEA RSS feeds are blocked by CORS in browser
      // Would need a proxy server or backend service
      const proxyUrl = configService.getProxiedUrl('https://www.iaea.org/feeds/topnews.rss');
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch IAEA data');
      }
      
      const text = await response.text();
      const iranRelated = await this.parseRSSForIran(text);
      
      return iranRelated.map(item => ({
        title: item.title,
        date: item.pubDate,
        summary: item.description,
        facilities: this.extractFacilityMentions(item.description),
        url: item.link
      }));
    } catch (error) {
      console.error('Error fetching IAEA reports:', error);
      // Return demo data as fallback
      return this.getDemoIAEAReports();
    }
  }

  /**
   * Fetch humanitarian data from UN OCHA via ReliefWeb API
   */
  async fetchHumanitarianData() {
    // Use demo data if configured
    if (configService.shouldUseDemoData()) {
      return this.getDemoHumanitarianData();
    }

    try {
      // ReliefWeb API v1 format - use query parameter with JSON
      const query = {
        value: '(country:"Iran" OR country:"Israel") AND (conflict OR humanitarian OR crisis)',
        fields: ['country', 'title', 'body']
      };
      
      const params = new URLSearchParams({
        appname: 'conflict-tracker',
        query: JSON.stringify(query),
        fields: JSON.stringify({
          include: ['title', 'body', 'date', 'source', 'url']
        }),
        limit: '10'
      });

      const response = await fetch(`https://api.reliefweb.int/v1/reports?${params}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`ReliefWeb API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.data || !Array.isArray(data.data)) {
        return this.getDemoHumanitarianData();
      }
      
      return data.data.map((report: any) => ({
        title: report.fields?.title || 'No title',
        date: report.fields?.date?.created || new Date().toISOString(),
        source: report.fields?.source?.map((s: any) => s.name).join(', ') || 'Unknown',
        casualties: this.extractCasualtyData(report.fields?.body || ''),
        url: report.fields?.url || '#'
      }));
    } catch (error) {
      console.error('Error fetching humanitarian data:', error);
      return this.getDemoHumanitarianData();
    }
  }

  /**
   * Fetch IDF official statements
   */
  async fetchIDFStatements() {
    // IDF RSS feeds require proxy due to CORS
    try {
      if (configService.shouldUseDemoData()) {
        return this.getDemoIDFStatements();
      }
      
      // Would need a proxy server for production
      const response = await fetch('/api/proxy/idf-rss');
      const text = await response.text();
      
      return this.parseRSS(text).filter(item => 
        item.title.toLowerCase().includes('iran') ||
        item.title.toLowerCase().includes('operation')
      );
    } catch (error) {
      console.error('Error fetching IDF statements:', error);
      return this.getDemoIDFStatements();
    }
  }

  /**
   * Aggregate all government sources
   */
  async fetchAllGovernmentSources() {
    const results = await Promise.allSettled([
      this.fetchIAEAReports(),
      this.fetchHumanitarianData(),
      this.fetchIDFStatements(),
      // Add more sources as needed
    ]);

    const successfulResults = results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<any>).value)
      .flat();

    return this.normalizeAndDeduplicate(successfulResults);
  }

  // Helper methods
  private async parseRSSForIran(rssText: string): Promise<any[]> {
    try {
      // Note: RSS parsing needs to be done server-side due to CORS
      // For client-side, we need a proxy or backend service
      
      // Temporary: parse XML manually or use a CORS proxy
      const parser = new DOMParser();
      const xml = parser.parseFromString(rssText, 'text/xml');
      const items = Array.from(xml.querySelectorAll('item'));
      
      return items
        .filter(item => {
          const title = item.querySelector('title')?.textContent || '';
          const description = item.querySelector('description')?.textContent || '';
          const content = title + ' ' + description;
          return content.toLowerCase().includes('iran') || 
                 content.toLowerCase().includes('nuclear');
        })
        .map(item => ({
          title: item.querySelector('title')?.textContent || '',
          description: item.querySelector('description')?.textContent || '',
          link: item.querySelector('link')?.textContent || '',
          pubDate: item.querySelector('pubDate')?.textContent || '',
        }));
    } catch (error) {
      console.error('Error parsing RSS:', error);
      return [];
    }
  }

  private extractFacilityMentions(text: string): string[] {
    const facilities = ['Natanz', 'Arak', 'Bushehr', 'Fordow', 'Isfahan'];
    return facilities.filter(f => 
      text.toLowerCase().includes(f.toLowerCase())
    );
  }

  private extractCasualtyData(text: string): { killed?: number; injured?: number } {
    // Similar to NewsService extraction
    return {};
  }

  private parseRSS(rssText: string): any[] {
    // Implement RSS parsing
    return [];
  }

  private normalizeAndDeduplicate(items: any[]): any[] {
    // Remove duplicates and normalize format
    const seen = new Set<string>();
    return items.filter(item => {
      const key = item.title || item.url;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Demo data methods
  private getDemoIAEAReports() {
    return [
      {
        title: 'IAEA Continues Verification Activities in Iran',
        date: new Date().toISOString(),
        summary: 'The IAEA continues to verify the non-diversion of declared nuclear material in Iran.',
        facilities: ['Natanz', 'Fordow'],
        url: 'https://www.iaea.org'
      },
      {
        title: 'Update on Iran\'s Nuclear Program',
        date: new Date(Date.now() - 86400000).toISOString(),
        summary: 'Latest monitoring report on Iranian nuclear facilities.',
        facilities: ['Arak', 'Bushehr'],
        url: 'https://www.iaea.org'
      }
    ];
  }

  private getDemoHumanitarianData() {
    return [
      {
        title: 'Humanitarian Situation Update: Middle East',
        date: new Date().toISOString(),
        source: 'UN OCHA',
        casualties: { killed: 0, injured: 0 },
        url: 'https://reliefweb.int'
      },
      {
        title: 'Emergency Response Plan Activated',
        date: new Date(Date.now() - 3600000).toISOString(),
        source: 'Red Cross',
        casualties: { killed: 0, injured: 0 },
        url: 'https://reliefweb.int'
      }
    ];
  }

  private getDemoIDFStatements() {
    return [
      {
        title: 'IDF Spokesperson Update on Regional Security',
        date: new Date().toISOString(),
        description: 'Routine security assessment of regional threats.',
        link: 'https://www.idf.il',
        pubDate: new Date().toISOString()
      },
      {
        title: 'Defense Forces on High Alert',
        date: new Date(Date.now() - 7200000).toISOString(),
        description: 'Increased readiness across all sectors.',
        link: 'https://www.idf.il',
        pubDate: new Date(Date.now() - 7200000).toISOString()
      }
    ];
  }
}

// Note: Many government sources require:
// 1. Proxy servers to bypass geo-restrictions
// 2. Authentication for certain APIs
// 3. Web scraping for sites without APIs
// 4. Translation services for non-English sources

export const governmentSourcesService = new GovernmentSourcesService();
export default governmentSourcesService;