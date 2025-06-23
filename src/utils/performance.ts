// Performance optimization utilities

import { useCallback, useRef, useEffect } from 'react';

// Debounce hook for search inputs and API calls
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const debouncedCallback = useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback as T;
};

// Throttle hook for scroll events and frequent updates
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastExecRef = useRef<number>(0);

  const throttledCallback = useCallback((...args: any[]) => {
    const now = Date.now();

    if (now - lastExecRef.current >= delay) {
      callback(...args);
      lastExecRef.current = now;
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
        lastExecRef.current = Date.now();
      }, delay - (now - lastExecRef.current));
    }
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback as T;
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {},
  triggerOnce: boolean = true
) => {
  const elementRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | undefined>(undefined);
  const isIntersectingRef = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && (!triggerOnce || !isIntersectingRef.current)) {
        isIntersectingRef.current = true;
        // Trigger callback or state update here
      }
    }, options);

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current && element) {
        observerRef.current.unobserve(element);
      }
    };
  }, [options, triggerOnce]);

  return elementRef;
};

// Performance monitoring utility
export const performanceMonitor = {
  startTime: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      performance.mark(`${label}-start`);
    }
  },

  endTime: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
      
      const measure = performance.getEntriesByName(label)[0];
      if (measure && measure.duration > 100) {
        console.warn(`⚠️ Performance warning: ${label} took ${measure.duration.toFixed(2)}ms`);
      }
    }
  },

  clearMarks: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      performance.clearMarks(`${label}-start`);
      performance.clearMarks(`${label}-end`);
      performance.clearMeasures(label);
    }
  }
};

// Memory usage monitoring
export const memoryMonitor = {
  logUsage: (context: string = 'General') => {
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
      const memory = (performance as any).memory;
      console.log(`🧠 Memory usage (${context}):`, {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      });
    }
  },

  checkForLeaks: () => {
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
      const memory = (performance as any).memory;
      const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      
      if (usagePercentage > 80) {
        console.warn(`⚠️ High memory usage detected: ${usagePercentage.toFixed(2)}%`);
      }
    }
  }
};

// Batch API calls to reduce server load
export class RequestBatcher {
  private batches: Map<string, Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
    params: any;
  }>> = new Map();

  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  public batch<T>(
    key: string,
    params: any,
    batchFn: (batchedParams: any[]) => Promise<T[]>,
    delay: number = 50
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.batches.has(key)) {
        this.batches.set(key, []);
      }

      const batch = this.batches.get(key)!;
      batch.push({ resolve, reject, params });

      // Clear existing timeout
      if (this.timeouts.has(key)) {
        clearTimeout(this.timeouts.get(key)!);
      }

      // Set new timeout
      const timeout = setTimeout(async () => {
        const currentBatch = this.batches.get(key) || [];
        this.batches.delete(key);
        this.timeouts.delete(key);

        if (currentBatch.length === 0) return;

        try {
          const batchedParams = currentBatch.map(item => item.params);
          const results = await batchFn(batchedParams);

          currentBatch.forEach((item, index) => {
            item.resolve(results[index]);
          });
        } catch (error) {
          currentBatch.forEach(item => {
            item.reject(error);
          });
        }
      }, delay);

      this.timeouts.set(key, timeout);
    });
  }

  public clear() {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
    this.batches.clear();
  }
}

// Global performance utilities
export const globalPerformance = {
  // Monitor FPS
  monitorFPS: () => {
    if (process.env.NODE_ENV === 'development') {
      let lastTime = performance.now();
      let frames = 0;

      const measureFPS = () => {
        frames++;
        const currentTime = performance.now();
        
        if (currentTime - lastTime >= 1000) {
          const fps = Math.round((frames * 1000) / (currentTime - lastTime));
          
          if (fps < 30) {
            console.warn(`⚠️ Low FPS detected: ${fps} fps`);
          }
          
          frames = 0;
          lastTime = currentTime;
        }
        
        requestAnimationFrame(measureFPS);
      };

      requestAnimationFrame(measureFPS);
    }
  },

  // Monitor long tasks
  monitorLongTasks: () => {
    if (process.env.NODE_ENV === 'development' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`);
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
    }
  }
};