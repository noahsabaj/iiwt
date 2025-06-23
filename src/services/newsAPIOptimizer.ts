/**
 * NewsAPI Optimizer - Advanced queries and endpoint optimization
 * Uses both /everything and /top-headlines endpoints for comprehensive coverage
 */

import { NewsArticle } from '../types';
import { configService } from './ConfigService';
import { newsApiRateLimiter } from './RateLimiter';
import { authService } from './authService';

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
}

interface QueryOptions {
  endpoint: 'everything' | 'top-headlines';
  query?: string;
  sources?: string[];
  from?: Date;
  to?: Date;
  sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
  pageSize?: number;
  page?: number;
}

export class NewsAPIOptimizer {
  private apiKey: string;
  private baseUrl: string;
  private trustedSources: string[];
  private isDemoMode: boolean;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache

  constructor(apiKey: string) {
    const config = configService.getConfig();
    this.apiKey = apiKey || config.newsApiKey || '';
    this.baseUrl = configService.getNewsApiUrl('');
    this.isDemoMode = config.isDemoMode || !this.apiKey;
    
    // High-reliability news sources for the conflict
    this.trustedSources = [
      'reuters',
      'associated-press',
      'bbc-news',
      'cnn',
      'the-guardian-uk',
      'the-new-york-times',
      'the-washington-post',
      'al-jazeera-english',
      'the-times-of-israel',
      'haaretz'
    ];
  }

  /**
   * Build optimized query for conflict-related news
   */
  buildConflictQuery(): string {
    // Complex query using AND/OR/NOT logic
    const queries = [
      // Direct conflict queries
      '(Israel AND Iran) AND (strike OR attack OR missile OR nuclear)',
      
      // Nuclear facility queries
      '(Natanz OR Arak OR Bushehr OR Fordow) AND (nuclear OR facility OR reactor)',
      
      // Military action queries
      '("Iron Dome" OR "air defense" OR interception) AND (missile OR rocket)',
      
      // Casualty queries
      '(Israel OR Iran) AND (casualties OR killed OR injured OR wounded)',
      
      // Operation names
      '"Operation Rising Lion" OR "Operation True Promise"',
      
      // Key figures
      '(Netanyahu OR Khamenei OR IDF OR IRGC) AND (statement OR announced)'
    ];
    
    return queries.join(' OR ');
  }

  /**
   * Fetch breaking news using top-headlines endpoint
   */
  async fetchBreakingNews(): Promise<NewsArticle[]> {
    // Check cache first to minimize API calls
    const cacheKey = 'breaking-news';
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      // Using cached data
      return cached;
    }
    
    try {
      // Check rate limit
      if (!newsApiRateLimiter.canMakeRequest()) {
        // Rate limit reached
        return [];
      }
      
      // First, try with trusted sources
      const params = new URLSearchParams({
        sources: this.trustedSources.join(','),
        pageSize: '50'
      });
      
      // API key is now handled by backend proxy

      const response = await fetch(`${this.baseUrl}/top-headlines?${params}`);
      
      if (!response.ok) {
        if (response.status === 426) {
          // Rate limit exceeded
          return [];
        }
        throw new Error(`API error: ${response.status}`);
      }
      
      // Record successful request
      newsApiRateLimiter.recordRequest();
      
      const data: NewsAPIResponse = await response.json();

      // Filter for conflict-related articles
      const conflictArticles = data.articles.filter(article => 
        this.isConflictRelated(article)
      );

      // If not enough results, query by keywords
      if (conflictArticles.length < 10) {
        // Check rate limit before second request
        if (!newsApiRateLimiter.canMakeRequest()) {
          // Rate limit reached
          return conflictArticles; // Return what we have
        }
        
        const keywordParams = new URLSearchParams({
          q: 'Israel Iran',
          language: 'en',
          pageSize: '30'
        });
        
        // API key is now handled by backend proxy

        const keywordResponse = await fetch(`${this.baseUrl}/top-headlines?${keywordParams}`);
        
        if (keywordResponse.ok) {
          newsApiRateLimiter.recordRequest();
        }
        
        const keywordData: NewsAPIResponse = await keywordResponse.json();

        // Merge and dedupe
        const allArticles = [...conflictArticles];
        const existingUrls = new Set(allArticles.map(a => a.url));
        
        for (const article of keywordData.articles) {
          if (!existingUrls.has(article.url) && this.isConflictRelated(article)) {
            allArticles.push(article);
          }
        }

        return allArticles;
      }

      // Cache results to reduce API calls
      this.saveToCache(cacheKey, conflictArticles);
      return conflictArticles;
    } catch (error) {
      console.error('Error fetching breaking news:', error);
      return [];
    }
  }

  /**
   * Fetch comprehensive historical data using everything endpoint
   */
  async fetchHistoricalData(hoursBack: number = 24): Promise<NewsArticle[]> {
    // Check cache first
    const cacheKey = `historical-${hoursBack}h`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      // Using cached data
      return cached;
    }
    
    const fromDate = new Date();
    fromDate.setHours(fromDate.getHours() - hoursBack);

    try {
      // Check rate limit
      if (!newsApiRateLimiter.canMakeRequest()) {
        // Rate limit reached
        return [];
      }
      
      const params = new URLSearchParams({
        q: this.buildConflictQuery(),
        from: fromDate.toISOString(),
        to: new Date().toISOString(),
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: '100'
      });
      
      // API key is now handled by backend proxy

      const response = await fetch(`${this.baseUrl}/everything?${params}`);
      
      if (!response.ok) {
        if (response.status === 426) {
          // Rate limit exceeded
          return [];
        }
        throw new Error(`API error: ${response.status}`);
      }
      
      // Record successful request
      newsApiRateLimiter.recordRequest();
      
      const data: NewsAPIResponse = await response.json();

      // Score articles by relevance
      const scoredArticles = data.articles.map(article => ({
        article,
        score: this.calculateRelevanceScore(article)
      }));

      // Sort by score and return top articles
      const results = scoredArticles
        .filter(item => item.score > 0.5)
        .sort((a, b) => b.score - a.score)
        .map(item => item.article)
        .slice(0, 50);
      
      // Cache results
      this.saveToCache(cacheKey, results);
      return results;

    } catch (error) {
      console.error('Error fetching historical data:', error);
      return [];
    }
  }

  /**
   * Check if article is conflict-related
   */
  private isConflictRelated(article: NewsArticle): boolean {
    const text = `${article.title} ${article.description || ''}`.toLowerCase();
    
    // Must mention both countries or key terms
    const israelMentioned = text.includes('israel');
    const iranMentioned = text.includes('iran') || text.includes('iranian');
    const conflictTerms = ['strike', 'attack', 'missile', 'nuclear', 'military', 
                          'killed', 'casualties', 'facility', 'uranium'];
    
    const hasConflictTerm = conflictTerms.some(term => text.includes(term));
    
    return (israelMentioned || iranMentioned) && hasConflictTerm;
  }

  /**
   * Calculate relevance score for article
   */
  private calculateRelevanceScore(article: NewsArticle): number {
    let score = 0;
    const text = `${article.title} ${article.description || ''}`.toLowerCase();
    
    // Source reliability
    if (article.source.name) {
      const sourceName = article.source.name.toLowerCase();
      if (this.trustedSources.some(trusted => sourceName.includes(trusted))) {
        score += 0.3;
      }
    }
    
    // Both countries mentioned
    if (text.includes('israel') && (text.includes('iran') || text.includes('iranian'))) {
      score += 0.2;
    }
    
    // Key terms
    const keyTerms = {
      nuclear: 0.15,
      missile: 0.1,
      strike: 0.1,
      casualties: 0.15,
      'iron dome': 0.1,
      natanz: 0.15,
      arak: 0.15,
      bushehr: 0.15,
      fordow: 0.15
    };
    
    for (const [term, weight] of Object.entries(keyTerms)) {
      if (text.includes(term)) {
        score += weight;
      }
    }
    
    // Recency bonus
    const ageHours = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
    if (ageHours < 1) score += 0.2;
    else if (ageHours < 6) score += 0.1;
    
    return Math.min(score, 1);
  }

  /**
   * Fetch articles by specific operation names
   */
  async fetchOperationNews(operationNames: string[]): Promise<NewsArticle[]> {
    // Check cache first
    const cacheKey = `operations-${operationNames.join('-')}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      // Using cached data
      return cached;
    }
    
    // Check rate limit
    if (!newsApiRateLimiter.canMakeRequest()) {
      // Rate limit reached
      return [];
    }
    
    const queries = operationNames.map(name => `"${name}"`).join(' OR ');
    
    try {
      const params = new URLSearchParams({
        q: queries,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: '50'
      });
      
      // API key is now handled by backend proxy

      const response = await fetch(`${this.baseUrl}/everything?${params}`);
      
      if (!response.ok) {
        if (response.status === 426) {
          // Rate limit exceeded
          return [];
        }
        throw new Error(`API error: ${response.status}`);
      }
      
      // Record successful request
      newsApiRateLimiter.recordRequest();
      
      const data: NewsAPIResponse = await response.json();
      
      // Cache results
      this.saveToCache(cacheKey, data.articles);
      
      return data.articles;
    } catch (error) {
      console.error('Error fetching operation news:', error);
      return [];
    }
  }

  /**
   * Get all available sources for the region
   */
  async getRegionalSources(): Promise<any[]> {
    // Check cache first
    const cacheKey = 'regional-sources';
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      // Using cached data
      return cached;
    }
    
    // Check rate limit
    if (!newsApiRateLimiter.canMakeRequest()) {
      // Rate limit reached
      return [];
    }
    
    try {
      const params = new URLSearchParams({
        country: 'us,gb,il', // US, UK, Israel
        language: 'en'
      });
      
      // API key is now handled by backend proxy

      const response = await fetch(`${this.baseUrl}/sources?${params}`);
      
      if (!response.ok) {
        if (response.status === 426) {
          // Rate limit exceeded
          return [];
        }
        throw new Error(`API error: ${response.status}`);
      }
      
      // Record successful request
      newsApiRateLimiter.recordRequest();
      
      const data = await response.json();
      
      // Cache results for longer since sources don't change often
      this.saveToCache(cacheKey, data.sources);
      
      return data.sources || [];
    } catch (error) {
      console.error('Error fetching sources:', error);
      return [];
    }
  }

  // Cache helper methods
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private saveToCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}