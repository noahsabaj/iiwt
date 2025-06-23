/**
 * Configuration Service
 * Manages API keys, URLs, and demo mode settings
 */

export interface AppConfig {
  newsApiKey?: string;
  acledKey?: string;
  acledEmail?: string;
  nasaFirmsKey?: string;
  newsProxyUrl?: string;
  isDemoMode: boolean;
  corsProxyUrl?: string;
}

class ConfigService {
  private config: AppConfig;

  constructor() {
    this.config = {
      newsApiKey: process.env.REACT_APP_NEWS_API_KEY,
      acledKey: process.env.REACT_APP_ACLED_KEY,
      acledEmail: process.env.REACT_APP_ACLED_EMAIL,
      nasaFirmsKey: process.env.REACT_APP_NASA_FIRMS_KEY,
      newsProxyUrl: process.env.REACT_APP_NEWS_PROXY_URL,
      isDemoMode: process.env.REACT_APP_DEMO_MODE === 'true' || !process.env.REACT_APP_NEWS_API_KEY,
      corsProxyUrl: process.env.REACT_APP_CORS_PROXY_URL || 'https://api.allorigins.win/raw?url='
    };
  }

  getConfig(): AppConfig {
    return this.config;
  }

  isApiConfigured(api: 'news' | 'acled' | 'firms'): boolean {
    switch (api) {
      case 'news':
        return !!this.config.newsApiKey || !!this.config.newsProxyUrl;
      case 'acled':
        return !!this.config.acledKey && !!this.config.acledEmail;
      case 'firms':
        return !!this.config.nasaFirmsKey;
      default:
        return false;
    }
  }

  /**
   * Get API URL with CORS proxy if needed
   */
  getProxiedUrl(url: string): string {
    // Skip proxy for local URLs or if proxy is disabled
    if (url.startsWith('http://localhost') || !this.config.corsProxyUrl) {
      return url;
    }
    
    // Use CORS proxy for external URLs
    return `${this.config.corsProxyUrl}${encodeURIComponent(url)}`;
  }

  /**
   * Check if we should use demo/simulated data
   */
  shouldUseDemoData(): boolean {
    return this.config.isDemoMode;
  }

  /**
   * Get NewsAPI URL (direct or proxied)
   */
  getNewsApiUrl(endpoint: string): string {
    if (this.config.newsProxyUrl) {
      return `${this.config.newsProxyUrl}${endpoint}`;
    }
    return `https://newsapi.org/v2${endpoint}`;
  }

  /**
   * Log configuration status
   */
  logStatus(): void {
    console.log('🔧 Configuration Status:');
    console.log(`- Demo Mode: ${this.config.isDemoMode ? 'ENABLED' : 'DISABLED'}`);
    console.log(`- NewsAPI: ${this.isApiConfigured('news') ? 'Configured' : 'Not configured'}`);
    console.log(`- ACLED: ${this.isApiConfigured('acled') ? 'Configured' : 'Not configured'}`);
    console.log(`- NASA FIRMS: ${this.isApiConfigured('firms') ? 'Configured' : 'Not configured'}`);
    
    if (this.config.isDemoMode) {
      console.log('ℹ️  Running in demo mode with simulated data');
      console.log('💡 To use real data, add API keys to .env.local file');
    }
  }
}

export const configService = new ConfigService();

// Log configuration status on startup
if (typeof window !== 'undefined') {
  configService.logStatus();
}