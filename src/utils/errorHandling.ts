// Enhanced error handling utilities

import { toast } from 'react-hot-toast';

// Error types for better categorization
export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API', 
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  PERMISSION = 'PERMISSION',
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
  userFriendlyMessage: string;
  retry?: () => Promise<void>;
  context?: string;
}

// Error factory for consistent error creation
export class ErrorFactory {
  static createNetworkError(message: string, context?: string): AppError {
    return {
      type: ErrorType.NETWORK,
      message,
      timestamp: new Date(),
      userFriendlyMessage: 'Connection issue. Please check your internet connection and try again.',
      context
    };
  }

  static createAPIError(message: string, code?: string, context?: string): AppError {
    return {
      type: ErrorType.API,
      message,
      code,
      timestamp: new Date(),
      userFriendlyMessage: 'Server error. Please try again in a moment.',
      context
    };
  }

  static createRateLimitError(retryAfter?: number): AppError {
    return {
      type: ErrorType.RATE_LIMIT,
      message: 'Rate limit exceeded',
      timestamp: new Date(),
      userFriendlyMessage: `Too many requests. Please wait ${retryAfter || 60} seconds and try again.`,
    };
  }

  static createTimeoutError(context?: string): AppError {
    return {
      type: ErrorType.TIMEOUT,
      message: 'Request timeout',
      timestamp: new Date(),
      userFriendlyMessage: 'Request timed out. Please try again.',
      context
    };
  }

  static fromError(error: Error, context?: string): AppError {
    // Parse common error patterns
    if (error.message.includes('fetch')) {
      return this.createNetworkError(error.message, context);
    }
    
    if (error.message.includes('timeout')) {
      return this.createTimeoutError(context);
    }

    return {
      type: ErrorType.UNKNOWN,
      message: error.message,
      timestamp: new Date(),
      userFriendlyMessage: 'An unexpected error occurred. Please try again.',
      context
    };
  }
}

// Enhanced error handler with retry logic
export class ErrorHandler {
  private static retryAttempts = new Map<string, number>();
  private static maxRetries = 3;

  static async handle(error: AppError, silent: boolean = false): Promise<void> {
    // Log error for debugging
    console.error('Application Error:', {
      type: error.type,
      message: error.message,
      context: error.context,
      timestamp: error.timestamp
    });

    // Track errors for analytics (if implemented)
    this.trackError(error);

    // Show user-friendly notification
    if (!silent) {
      this.showErrorNotification(error);
    }

    // Handle specific error types
    switch (error.type) {
      case ErrorType.RATE_LIMIT:
        await this.handleRateLimit(error);
        break;
      case ErrorType.NETWORK:
        await this.handleNetworkError(error);
        break;
      case ErrorType.AUTHENTICATION:
        await this.handleAuthError(error);
        break;
    }
  }

  private static showErrorNotification(error: AppError): void {
    const toastOptions = {
      duration: 5000,
      style: {
        background: '#f44336',
        color: 'white',
      },
    };

    if (error.retry) {
      toast.error(
        error.userFriendlyMessage + ' Please try the action again.',
        toastOptions
      );
    } else {
      toast.error(error.userFriendlyMessage, toastOptions);
    }
  }

  private static async handleRateLimit(error: AppError): Promise<void> {
    // Implement exponential backoff for rate limits
    const backoffTime = Math.min(Math.pow(2, this.getRetryCount(error.context || 'default')) * 1000, 60000);
    
    setTimeout(() => {
      if (error.retry) {
        error.retry();
      }
    }, backoffTime);
  }

  private static async handleNetworkError(error: AppError): Promise<void> {
    // Check if we should retry network errors
    const retryCount = this.getRetryCount(error.context || 'default');
    
    if (retryCount < this.maxRetries && error.retry) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      
      setTimeout(() => {
        this.incrementRetryCount(error.context || 'default');
        error.retry?.();
      }, delay);
    }
  }

  private static async handleAuthError(error: AppError): Promise<void> {
    // Redirect to login or refresh token
    console.warn('Authentication error detected. Consider redirecting to login.');
  }

  private static getRetryCount(context: string): number {
    return this.retryAttempts.get(context) || 0;
  }

  private static incrementRetryCount(context: string): void {
    const current = this.getRetryCount(context);
    this.retryAttempts.set(context, current + 1);
  }

  private static trackError(error: AppError): void {
    // Implement error tracking/analytics here
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Details');
      console.error('Type:', error.type);
      console.error('Message:', error.message);
      console.error('Context:', error.context);
      console.error('Timestamp:', error.timestamp);
      if (error.details) {
        console.error('Details:', error.details);
      }
      console.groupEnd();
    }
  }

  static clearRetryCount(context: string): void {
    this.retryAttempts.delete(context);
  }

  static clearAllRetryCounts(): void {
    this.retryAttempts.clear();
  }
}

// Wrapper for async operations with error handling
export const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string,
  silent?: boolean
): T => {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = error instanceof Error 
        ? ErrorFactory.fromError(error, context)
        : ErrorFactory.createAPIError('Unknown error occurred', undefined, context);
      
      await ErrorHandler.handle(appError, silent);
      throw appError;
    }
  }) as T;
};

// Success notification utility
export const showSuccess = (message: string, duration: number = 3000): void => {
  toast.success(message, {
    duration,
    style: {
      background: '#4caf50',
      color: 'white',
    },
  });
};

// Info notification utility
export const showInfo = (message: string, duration: number = 4000): void => {
  toast(message, {
    duration,
    icon: 'ℹ️',
    style: {
      background: '#2196f3',
      color: 'white',
    },
  });
};

// Warning notification utility
export const showWarning = (message: string, duration: number = 4000): void => {
  toast(message, {
    duration,
    icon: '⚠️',
    style: {
      background: '#ff9800',
      color: 'white',
    },
  });
};