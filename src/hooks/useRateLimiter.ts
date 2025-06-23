import { useState, useCallback, useRef } from 'react';

interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
  onLimitReached?: () => void;
}

export const useRateLimiter = (options: RateLimiterOptions) => {
  const { maxRequests, windowMs, onLimitReached } = options;
  const [isLimited, setIsLimited] = useState(false);
  const requestTimes = useRef<number[]>([]);

  const checkLimit = useCallback(() => {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Remove old requests outside the window
    requestTimes.current = requestTimes.current.filter(time => time > windowStart);

    // Check if we're at the limit
    if (requestTimes.current.length >= maxRequests) {
      setIsLimited(true);
      if (onLimitReached) {
        onLimitReached();
      }
      
      // Calculate when the oldest request will expire
      const oldestRequest = Math.min(...requestTimes.current);
      const resetTime = oldestRequest + windowMs - now;
      
      // Reset the limit after the window expires
      setTimeout(() => {
        setIsLimited(false);
      }, resetTime);
      
      return false;
    }

    // Add the current request
    requestTimes.current.push(now);
    return true;
  }, [maxRequests, windowMs, onLimitReached]);

  const executeWithLimit = useCallback(<T extends any[], R>(
    fn: (...args: T) => R | Promise<R>
  ) => {
    return async (...args: T): Promise<R | null> => {
      if (!checkLimit()) {
        return null;
      }
      
      try {
        return await fn(...args);
      } catch (error) {
        // Remove the request if it failed
        requestTimes.current.pop();
        throw error;
      }
    };
  }, [checkLimit]);

  const getRemainingRequests = useCallback(() => {
    const now = Date.now();
    const windowStart = now - windowMs;
    const validRequests = requestTimes.current.filter(time => time > windowStart);
    return Math.max(0, maxRequests - validRequests.length);
  }, [maxRequests, windowMs]);

  const getResetTime = useCallback(() => {
    if (requestTimes.current.length === 0) {
      return null;
    }
    
    const now = Date.now();
    const windowStart = now - windowMs;
    const validRequests = requestTimes.current.filter(time => time > windowStart);
    
    if (validRequests.length < maxRequests) {
      return null;
    }
    
    const oldestRequest = Math.min(...validRequests);
    return new Date(oldestRequest + windowMs);
  }, [maxRequests, windowMs]);

  return {
    isLimited,
    executeWithLimit,
    getRemainingRequests,
    getResetTime,
    checkLimit
  };
};