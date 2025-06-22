interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: {
    id: string | null;
    name: string;
  };
  content: string;
}

interface NewsResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
}

class NewsService {
  private apiKey = process.env.REACT_APP_NEWS_API_KEY;
  private baseUrl = process.env.NODE_ENV === 'development' 
    ? '/api/news' 
    : (process.env.REACT_APP_NEWS_API_URL || 'https://newsapi.org/v2');

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
    try {
      // Use both endpoints for comprehensive coverage
      const [topHeadlines, everything] = await Promise.all([
        this.fetchTopHeadlines(),
        this.fetchEverything()
      ]);
      
      // Combine and deduplicate
      const allArticles = [...topHeadlines, ...everything];
      return this.deduplicateArticles(allArticles);
    } catch (error) {
      console.error('Error fetching conflict news:', error);
      return [];
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

      const response = await fetch(
        `${this.baseUrl}/top-headlines?${params}`,
        {
          headers: {
            'X-Api-Key': this.apiKey || ''
          }
        }
      );

      if (!response.ok) {
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

    const response = await fetch(
      `${this.baseUrl}/everything?${params}`,
      {
        headers: {
          'X-Api-Key': this.apiKey || ''
        }
      }
    );

    if (!response.ok) {
      throw new Error(`News API error: ${response.status}`);
    }

    return response.json();
  }

  private deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>();
    return articles.filter(article => {
      const key = article.title + article.source.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Extract casualty numbers from news text using NLP patterns
  extractCasualties(text: string): { killed?: number; injured?: number } {
    const result: { killed?: number; injured?: number } = {};
    
    // Patterns for casualties
    const killedPatterns = [
      /(\d+)\s*(?:people\s*)?killed/i,
      /(\d+)\s*dead/i,
      /death toll.*?(\d+)/i,
      /(\d+)\s*casualties/i
    ];
    
    const injuredPatterns = [
      /(\d+)\s*(?:people\s*)?injured/i,
      /(\d+)\s*wounded/i,
      /(\d+)\s*hurt/i
    ];

    for (const pattern of killedPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result.killed = parseInt(match[1]);
        break;
      }
    }

    for (const pattern of injuredPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result.injured = parseInt(match[1]);
        break;
      }
    }

    return result;
  }

  // Extract location mentions
  extractLocations(text: string): string[] {
    const locations = [
      'Tehran', 'Tel Aviv', 'Jerusalem', 'Haifa',
      'Natanz', 'Arak', 'Bushehr', 'Fordow',
      'Damascus', 'Beirut', 'Gaza'
    ];

    return locations.filter(loc => 
      text.toLowerCase().includes(loc.toLowerCase())
    );
  }

  // Analyze sentiment/severity
  analyzeSeverity(article: NewsArticle): 'critical' | 'high' | 'medium' | 'low' {
    const text = (article.title + ' ' + article.description).toLowerCase();
    
    const criticalWords = ['nuclear', 'killed', 'strike', 'bomb', 'explosion'];
    const highWords = ['missile', 'attack', 'wounded', 'damage', 'destroyed'];
    const mediumWords = ['threat', 'warning', 'tension', 'alert'];

    const criticalCount = criticalWords.filter(w => text.includes(w)).length;
    const highCount = highWords.filter(w => text.includes(w)).length;
    
    if (criticalCount >= 2) return 'critical';
    if (criticalCount >= 1 || highCount >= 2) return 'high';
    if (highCount >= 1) return 'medium';
    return 'low';
  }
}

export default new NewsService();