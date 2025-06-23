/**
 * Rate Limiter for API requests
 * Helps stay within free tier limits
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  name: string;
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request can be made
   */
  canMakeRequest(): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Get existing requests for this limiter
    const requestTimes = this.requests.get(this.config.name) || [];
    
    // Remove old requests outside the window
    const validRequests = requestTimes.filter(time => time > windowStart);
    
    // Check if under limit
    return validRequests.length < this.config.maxRequests;
  }

  /**
   * Record a request
   */
  recordRequest(): void {
    const now = Date.now();
    const requestTimes = this.requests.get(this.config.name) || [];
    requestTimes.push(now);
    
    // Keep only requests within the window to save memory
    const windowStart = now - this.config.windowMs;
    const validRequests = requestTimes.filter(time => time > windowStart);
    
    this.requests.set(this.config.name, validRequests);
    
    console.log(`${this.config.name}: ${validRequests.length}/${this.config.maxRequests} requests in current window`);
  }

  /**
   * Get remaining requests
   */
  getRemainingRequests(): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const requestTimes = this.requests.get(this.config.name) || [];
    const validRequests = requestTimes.filter(time => time > windowStart);
    
    return Math.max(0, this.config.maxRequests - validRequests.length);
  }

  /**
   * Get time until next request can be made
   */
  getTimeUntilNextRequest(): number {
    if (this.canMakeRequest()) {
      return 0;
    }

    const requestTimes = this.requests.get(this.config.name) || [];
    if (requestTimes.length === 0) {
      return 0;
    }

    // Find the oldest request that would need to expire
    const sortedRequests = requestTimes.sort((a, b) => a - b);
    const oldestRequest = sortedRequests[0];
    const timeUntilExpiry = (oldestRequest + this.config.windowMs) - Date.now();
    
    return Math.max(0, timeUntilExpiry);
  }
}

// Pre-configured rate limiters
export const newsApiRateLimiter = new RateLimiter({
  name: 'NewsAPI',
  maxRequests: 100, // Free tier limit
  windowMs: 24 * 60 * 60 * 1000 // 24 hours
});

export const reliefWebRateLimiter = new RateLimiter({
  name: 'ReliefWeb',
  maxRequests: 1000, // ReliefWeb is more generous
  windowMs: 60 * 60 * 1000 // 1 hour
});