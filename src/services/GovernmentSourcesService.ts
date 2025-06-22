/**
 * Government & NGO Data Sources Service
 * Aggregates official information from various governmental and NGO sources
 */

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
      // IAEA provides RSS feeds and some JSON endpoints
      const response = await fetch('https://www.iaea.org/feeds/topnews.rss');
      const text = await response.text();
      
      // Parse RSS (you'll need an RSS parser library)
      const iranRelated = await this.parseRSSForIran(text);
      
      // Extract facility-specific information
      return iranRelated.map(item => ({
        title: item.title,
        date: item.pubDate,
        summary: item.description,
        facilities: this.extractFacilityMentions(item.description),
        url: item.link
      }));
    } catch (error) {
      console.error('Error fetching IAEA reports:', error);
      return [];
    }
  }

  /**
   * Fetch humanitarian data from UN OCHA via ReliefWeb API
   */
  async fetchHumanitarianData() {
    const params = new URLSearchParams({
      'filter[field]': 'country',
      'filter[value]': 'Iran,Israel',
      'filter[operator]': 'OR',
      'fields[include][]': 'title,body,date,source',
      'sort': '-date.created',
      'limit': '10'
    });

    try {
      const response = await fetch(
        `https://api.reliefweb.int/v1/reports?${params}`
      );
      const data = await response.json();
      
      return data.data.map((report: any) => ({
        title: report.fields.title,
        date: report.fields.date.created,
        source: report.fields.source.map((s: any) => s.name).join(', '),
        casualties: this.extractCasualtyData(report.fields.body),
        url: report.fields.url
      }));
    } catch (error) {
      console.error('Error fetching humanitarian data:', error);
      return [];
    }
  }

  /**
   * Fetch IDF official statements
   */
  async fetchIDFStatements() {
    // IDF provides English RSS feed
    try {
      const response = await fetch('/api/proxy/idf-rss'); // You'll need a proxy
      const text = await response.text();
      
      return this.parseRSS(text).filter(item => 
        item.title.toLowerCase().includes('iran') ||
        item.title.toLowerCase().includes('operation')
      );
    } catch (error) {
      console.error('Error fetching IDF statements:', error);
      return [];
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
    return items;
  }
}

// Note: Many government sources require:
// 1. Proxy servers to bypass geo-restrictions
// 2. Authentication for certain APIs
// 3. Web scraping for sites without APIs
// 4. Translation services for non-English sources

export default new GovernmentSourcesService();