import { NewsAPIOptimizer } from './newsAPIOptimizer';
import { VerificationService } from './verificationService';
import { NewsArticle } from '../types';
import { configService } from './ConfigService';
import { authService } from './authService';

interface NewsResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
}

class NewsService {
  private apiKey: string;
  private baseUrl: string;
  private isDemoMode: boolean;
  
  private newsOptimizer: NewsAPIOptimizer;
  private verificationService: VerificationService;
  private articleCache: Map<string, NewsArticle[]>;
  private cacheExpiry: Map<string, number>;

  constructor() {
    const config = configService.getConfig();
    this.apiKey = config.newsApiKey || '';
    this.baseUrl = configService.getNewsApiUrl('');
    this.isDemoMode = config.isDemoMode;
    
    this.newsOptimizer = new NewsAPIOptimizer(this.apiKey);
    this.verificationService = new VerificationService();
    this.articleCache = new Map();
    this.cacheExpiry = new Map();
    
    // Only log in development mode
    if (this.isDemoMode && process.env.NODE_ENV === 'development') {
      console.log('📰 NewsService: Running in demo mode');
    }
  }

  // Keywords to track the conflict
  private conflictKeywords = [
    'Israel Iran',
    'Iranian nuclear',
    'Israeli strike',
    'Iran missile',
    'Natanz facility',
    'Arak reactor',
    'Middle East conflict',
    'Iran retaliation',
    'Israel defense'
  ];

  async fetchConflictNews(): Promise<NewsArticle[]> {
    // Use demo data if in demo mode
    if (this.isDemoMode || !this.apiKey) {
      return this.getDemoNews();
    }

    // Check cache first
    const cacheKey = 'conflict_news';
    if (this.isCacheValid(cacheKey)) {
      return this.articleCache.get(cacheKey) || [];
    }

    try {
      // Use optimized fetching for both breaking and historical news
      const [breakingNews, historicalNews, topHeadlines] = await Promise.all([
        this.newsOptimizer.fetchBreakingNews(),
        this.newsOptimizer.fetchHistoricalData(24), // Last 24 hours
        this.fetchTopHeadlines() // Keep existing method for compatibility
      ]);
      
      // Combine and deduplicate
      const allArticles = this.deduplicateArticles([
        ...breakingNews, 
        ...historicalNews, 
        ...topHeadlines
      ]);
      
      // If no articles were fetched, use demo data
      if (allArticles.length === 0) {
        return this.getDemoNews();
      }
      
      // Cache results
      this.cacheArticles(cacheKey, allArticles, 5); // 5 minute cache
      
      return allArticles;
    } catch (error) {
      console.error('Error fetching conflict news:', error);
      // Return demo data as fallback
      return this.getDemoNews();
    }
  }

  // Get breaking news from top-headlines endpoint
  private async fetchTopHeadlines(): Promise<NewsArticle[]> {
    try {
      // Search by keywords in top headlines
      const params = new URLSearchParams({
        q: 'Israel Iran',
        category: 'general',
        sortBy: 'publishedAt',
        pageSize: '100'
      });

      // API key is now handled by backend proxy

      const response = await fetch(`${this.baseUrl}/top-headlines?${params}`, {
        headers: authService.getAuthHeaders()
      });

      if (!response.ok) {
        // Handle CORS and API errors gracefully
        if (response.status === 0) {
          // CORS error
          return [];
        }
        if (response.status === 426) {
          // Rate limit exceeded
          return [];
        }
        if (response.status === 401) {
          // Authentication failed
          return [];
        }
        throw new Error(`News API error: ${response.status}`);
      }

      const data: NewsResponse = await response.json();
      return data.articles || [];
    } catch (error) {
      console.error('Error fetching top headlines:', error);
      return [];
    }
  }

  // Get comprehensive results from everything endpoint
  private async fetchEverything(): Promise<NewsArticle[]> {
    try {
      // More specific conflict-related queries
      const queries = [
        '(Israel AND Iran) AND (strike OR missile OR nuclear OR attack)',
        '"Iranian nuclear facility" OR "Natanz" OR "Arak reactor"',
        '"Israel Defense Forces" AND Iran',
        'Iran retaliation Israel'
      ];

      const promises = queries.map(q => this.searchNews(q));
      const results = await Promise.all(promises);
      
      return results.flatMap(r => r.articles || []);
    } catch (error) {
      console.error('Error fetching everything:', error);
      return [];
    }
  }

  private async searchNews(query: string): Promise<NewsResponse> {
    const params = new URLSearchParams({
      q: query,
      sortBy: 'publishedAt',
      language: 'en',
      pageSize: '20'
    });

    // API key is now handled by backend proxy
    const response = await fetch(`${this.baseUrl}/everything?${params}`, {
      headers: authService.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`News API error: ${response.status}`);
    }

    return response.json();
  }

  private deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Map<string, NewsArticle>();
    
    for (const article of articles) {
      const key = article.url || article.title;
      if (!seen.has(key)) {
        seen.set(key, article);
      }
    }
    
    return Array.from(seen.values());
  }

  // Enhanced casualty extraction with verification
  extractCasualties(text: string): { killed?: number; injured?: number; confidence?: number } {
    const casualties: { killed?: number; injured?: number; confidence?: number } = {};
    let confidence = 0.5; // Base confidence
    
    // Look for killed/dead
    const killedPatterns = [
      { pattern: /(\d+)\s*(?:people\s*)?killed/i, confidence: 0.9 },
      { pattern: /(\d+)\s*dead/i, confidence: 0.85 },
      { pattern: /death\s*toll\s*(?:rises?\s*to\s*)?(\d+)/i, confidence: 0.8 },
      { pattern: /(\d+)\s*fatalities/i, confidence: 0.85 }
    ];
    
    for (const { pattern, confidence: patternConfidence } of killedPatterns) {
      const match = text.match(pattern);
      if (match) {
        casualties.killed = parseInt(match[1] || match[2]);
        confidence = Math.max(confidence, patternConfidence);
        break;
      }
    }
    
    // Look for injured/wounded
    const injuredPatterns = [
      { pattern: /(\d+)\s*(?:people\s*)?injured/i, confidence: 0.9 },
      { pattern: /(\d+)\s*wounded/i, confidence: 0.85 },
      { pattern: /(\d+)\s*hurt/i, confidence: 0.7 },
      { pattern: /(\d+)\s*hospitalized/i, confidence: 0.8 }
    ];
    
    for (const { pattern, confidence: patternConfidence } of injuredPatterns) {
      const match = text.match(pattern);
      if (match) {
        casualties.injured = parseInt(match[1]);
        confidence = Math.max(confidence, patternConfidence);
        break;
      }
    }
    
    casualties.confidence = confidence;
    return casualties;
  }

  // Enhanced location extraction with geocoding hints
  extractLocations(text: string): string[] {
    const locations: Array<{ name: string; confidence: number; type: string }> = [];
    const processedLocations = new Set<string>();
    
    // Pattern-based extraction
    const locationPattern = /(?:in|at|near|outside|around)\s+([A-Z][a-zA-Z\s]+?)(?:\.|,|;|\s+on)/g;
    
    let match;
    while ((match = locationPattern.exec(text)) !== null) {
      const location = match[1].trim();
      if (!processedLocations.has(location)) {
        locations.push({ name: location, confidence: 0.7, type: 'extracted' });
        processedLocations.add(location);
      }
    }
    
    // Known locations with types
    const knownLocations = [
      // Israeli cities
      { name: 'Tel Aviv', type: 'city_israel', confidence: 0.95 },
      { name: 'Jerusalem', type: 'city_israel', confidence: 0.95 },
      { name: 'Haifa', type: 'city_israel', confidence: 0.95 },
      { name: 'Gaza', type: 'territory', confidence: 0.9 },
      
      // Iranian cities and facilities
      { name: 'Tehran', type: 'city_iran', confidence: 0.95 },
      { name: 'Isfahan', type: 'city_iran', confidence: 0.9 },
      { name: 'Natanz', type: 'nuclear_facility', confidence: 0.98 },
      { name: 'Arak', type: 'nuclear_facility', confidence: 0.98 },
      { name: 'Bushehr', type: 'nuclear_facility', confidence: 0.98 },
      { name: 'Fordow', type: 'nuclear_facility', confidence: 0.98 },
      
      // Regional
      { name: 'Damascus', type: 'city_syria', confidence: 0.9 },
      { name: 'Beirut', type: 'city_lebanon', confidence: 0.9 },
      { name: 'Baghdad', type: 'city_iraq', confidence: 0.9 }
    ];
    
    for (const location of knownLocations) {
      if (text.includes(location.name) && !processedLocations.has(location.name)) {
        locations.push(location);
        processedLocations.add(location.name);
      }
    }
    
    // Return just the names for backward compatibility
    return locations
      .sort((a, b) => b.confidence - a.confidence)
      .map(loc => loc.name);
  }

  // Enhanced severity analysis with multiple factors
  analyzeSeverity(article: NewsArticle): 'low' | 'medium' | 'high' | 'critical' {
    const text = (article.title + ' ' + (article.description || '')).toLowerCase();
    let severityScore = 0;
    
    // Critical indicators (score: 10)
    const criticalTerms = [
      'nuclear leak', 'radiation', 'mass casualties', 'chemical weapons',
      'nuclear facility hit', 'reactor damage'
    ];
    if (criticalTerms.some(term => text.includes(term))) {
      return 'critical';
    }
    
    // High severity indicators (score: 5-8)
    const highTerms = {
      'killed': 8,
      'missile strike': 7,
      'air strike': 7,
      'nuclear facility': 6,
      'ballistic missile': 7,
      'death toll': 8,
      'fatalities': 7
    };
    
    for (const [term, score] of Object.entries(highTerms)) {
      if (text.includes(term)) {
        severityScore = Math.max(severityScore, score);
      }
    }
    
    // Medium severity indicators (score: 3-4)
    const mediumTerms = {
      'injured': 4,
      'wounded': 4,
      'damage': 3,
      'alert': 3,
      'intercepted': 3,
      'evacuated': 4
    };
    
    for (const [term, score] of Object.entries(mediumTerms)) {
      if (text.includes(term)) {
        severityScore = Math.max(severityScore, score);
      }
    }
    
    // Check casualty numbers
    const casualties = this.extractCasualties(text);
    if (casualties.killed && casualties.killed > 50) return 'critical';
    if (casualties.killed && casualties.killed > 10) severityScore = Math.max(severityScore, 7);
    if (casualties.injured && casualties.injured > 100) severityScore = Math.max(severityScore, 6);
    
    // Map score to severity
    if (severityScore >= 7) return 'high';
    if (severityScore >= 3) return 'medium';
    return 'low';
  }

  // Fetch articles related to military operations
  async fetchOperationNews(): Promise<NewsArticle[]> {
    const operations = [
      'Operation Rising Lion',
      'Operation True Promise',
      'Operation Swords of Iron',
      'Operation Breaking Dawn'
    ];
    
    return this.newsOptimizer.fetchOperationNews(operations);
  }

  // Get verification service instance
  getVerificationService(): VerificationService {
    return this.verificationService;
  }

  // Private helper methods
  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  private cacheArticles(key: string, articles: NewsArticle[], minutesToLive: number): void {
    this.articleCache.set(key, articles);
    this.cacheExpiry.set(key, Date.now() + minutesToLive * 60 * 1000);
  }

  // Get demo news articles when API is unavailable
  private getDemoNews(): NewsArticle[] {
    const now = new Date();
    return [
      {
        source: { id: null, name: 'Reuters' },
        author: 'Demo Data',
        title: 'Israel conducts defensive operations amid regional tensions',
        description: 'Israeli defense forces remain on high alert as regional tensions continue to escalate.',
        url: 'https://example.com/article1',
        urlToImage: null,
        publishedAt: new Date(now.getTime() - 1000 * 60 * 30).toISOString(), // 30 min ago
        content: 'Demo content for conflict tracking...',
      },
      {
        source: { id: null, name: 'BBC News' },
        author: 'Demo Data',
        title: 'Iranian nuclear facilities under international scrutiny',
        description: 'IAEA inspectors continue monitoring Iranian nuclear facilities amid ongoing negotiations.',
        url: 'https://example.com/article2',
        urlToImage: null,
        publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        content: 'Demo content about nuclear facilities...',
      },
      {
        source: { id: null, name: 'Al Jazeera' },
        author: 'Demo Data',
        title: 'Regional allies monitor Middle East situation closely',
        description: 'Countries in the region maintain heightened vigilance as tensions persist.',
        url: 'https://example.com/article3',
        urlToImage: null,
        publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
        content: 'Demo content about regional situation...',
      },
      {
        source: { id: null, name: 'CNN' },
        author: 'Demo Data',
        title: 'US military assets positioned in the Middle East',
        description: 'American forces maintain defensive posture in the region.',
        url: 'https://example.com/article4',
        urlToImage: null,
        publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
        content: 'Demo content about military positioning...',
      },
      {
        source: { id: null, name: 'Times of Israel' },
        author: 'Demo Data',
        title: 'Iron Dome intercepts projectiles over northern Israel',
        description: 'Air defense systems successfully engage incoming threats.',
        url: 'https://example.com/article5',
        urlToImage: null,
        publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
        content: 'Demo content about air defense...',
      }
    ];
  }
}

export const newsService = new NewsService();
export default newsService;