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
      corsProxyUrl: process.env.REACT_APP_CORS_PROXY_URL || 'https://cors-anywhere.herokuapp.com/'
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
    
    // Skip proxy for GitHub raw content URLs as they typically allow CORS
    if (url.includes('raw.githubusercontent.com')) {
      console.log(`📁 Using direct GitHub raw URL: ${url}`);
      return url;
    }
    
    // Use CORS proxy for other external URLs
    console.log(`🌐 Using CORS proxy for: ${url}`);
    return `${this.config.corsProxyUrl}${url}`;
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
    // Always use backend proxy in production
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
    return `${backendUrl}/api/news${endpoint}`;
  }
  
  getOsintApiUrl(service: string, endpoint: string): string {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
    return `${backendUrl}/api/osint/${service}${endpoint}`;
  }
  
  getAuthApiUrl(endpoint: string): string {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
    return `${backendUrl}/api/auth${endpoint}`;
  }

  /**
   * Log configuration status (development only)
   */
  logStatus(): void {
    // Only log in development mode to prevent information disclosure
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Configuration Status:');
      console.log(`- Demo Mode: ${this.config.isDemoMode ? 'ENABLED' : 'DISABLED'}`);
      console.log(`- APIs configured: ${this.config.isDemoMode ? 0 : 'Check config'}`);
      
      if (this.config.isDemoMode) {
        console.log('ℹ️  Running in demo mode');
      }
    }
  }
}

export const configService = new ConfigService();

// Log configuration status on startup
if (typeof window !== 'undefined') {
  configService.logStatus();
}