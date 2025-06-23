// Data validation utilities for robust data handling

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Base validator class
export abstract class BaseValidator<T> {
  abstract validate(value: T): ValidationResult;

  // Combine multiple validation results
  static combine(...results: ValidationResult[]): ValidationResult {
    return {
      isValid: results.every(r => r.isValid),
      errors: results.flatMap(r => r.errors),
      warnings: results.flatMap(r => r.warnings)
    };
  }
}

// String validators
export class StringValidator extends BaseValidator<string> {
  private rules: Array<(value: string) => ValidationResult> = [];

  required(message = 'This field is required') {
    this.rules.push((value) => ({
      isValid: Boolean(value && value.trim()),
      errors: !value || !value.trim() ? [message] : [],
      warnings: []
    }));
    return this;
  }

  minLength(min: number, message?: string) {
    this.rules.push((value) => {
      const isValid = !value || value.length >= min;
      return {
        isValid,
        errors: !isValid ? [message || `Must be at least ${min} characters`] : [],
        warnings: []
      };
    });
    return this;
  }

  maxLength(max: number, message?: string) {
    this.rules.push((value) => {
      const isValid = !value || value.length <= max;
      return {
        isValid,
        errors: !isValid ? [message || `Must be no more than ${max} characters`] : [],
        warnings: []
      };
    });
    return this;
  }

  pattern(regex: RegExp, message = 'Invalid format') {
    this.rules.push((value) => {
      const isValid = !value || regex.test(value);
      return {
        isValid,
        errors: !isValid ? [message] : [],
        warnings: []
      };
    });
    return this;
  }

  email(message = 'Invalid email address') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.pattern(emailRegex, message);
  }

  url(message = 'Invalid URL') {
    this.rules.push((value) => {
      if (!value) return { isValid: true, errors: [], warnings: [] };
      
      try {
        new URL(value);
        return { isValid: true, errors: [], warnings: [] };
      } catch {
        return { isValid: false, errors: [message], warnings: [] };
      }
    });
    return this;
  }

  validate(value: string): ValidationResult {
    const results = this.rules.map(rule => rule(value));
    return BaseValidator.combine(...results);
  }
}

// Number validators
export class NumberValidator extends BaseValidator<number> {
  private rules: Array<(value: number) => ValidationResult> = [];

  required(message = 'This field is required') {
    this.rules.push((value) => ({
      isValid: value !== null && value !== undefined && !isNaN(value),
      errors: (value === null || value === undefined || isNaN(value)) ? [message] : [],
      warnings: []
    }));
    return this;
  }

  min(min: number, message?: string) {
    this.rules.push((value) => {
      const isValid = value === null || value === undefined || value >= min;
      return {
        isValid,
        errors: !isValid ? [message || `Must be at least ${min}`] : [],
        warnings: []
      };
    });
    return this;
  }

  max(max: number, message?: string) {
    this.rules.push((value) => {
      const isValid = value === null || value === undefined || value <= max;
      return {
        isValid,
        errors: !isValid ? [message || `Must be no more than ${max}`] : [],
        warnings: []
      };
    });
    return this;
  }

  integer(message = 'Must be a whole number') {
    this.rules.push((value) => {
      const isValid = value === null || value === undefined || Number.isInteger(value);
      return {
        isValid,
        errors: !isValid ? [message] : [],
        warnings: []
      };
    });
    return this;
  }

  positive(message = 'Must be a positive number') {
    this.rules.push((value) => {
      const isValid = value === null || value === undefined || value > 0;
      return {
        isValid,
        errors: !isValid ? [message] : [],
        warnings: []
      };
    });
    return this;
  }

  validate(value: number): ValidationResult {
    const results = this.rules.map(rule => rule(value));
    return BaseValidator.combine(...results);
  }
}

// Array validators
export class ArrayValidator<T> extends BaseValidator<T[]> {
  private rules: Array<(value: T[]) => ValidationResult> = [];

  required(message = 'At least one item is required') {
    this.rules.push((value) => ({
      isValid: Array.isArray(value) && value.length > 0,
      errors: (!Array.isArray(value) || value.length === 0) ? [message] : [],
      warnings: []
    }));
    return this;
  }

  minLength(min: number, message?: string) {
    this.rules.push((value) => {
      const isValid = !Array.isArray(value) || value.length >= min;
      return {
        isValid,
        errors: !isValid ? [message || `Must have at least ${min} items`] : [],
        warnings: []
      };
    });
    return this;
  }

  maxLength(max: number, message?: string) {
    this.rules.push((value) => {
      const isValid = !Array.isArray(value) || value.length <= max;
      return {
        isValid,
        errors: !isValid ? [message || `Must have no more than ${max} items`] : [],
        warnings: []
      };
    });
    return this;
  }

  unique(message = 'Items must be unique') {
    this.rules.push((value) => {
      if (!Array.isArray(value)) return { isValid: true, errors: [], warnings: [] };
      
      const unique = new Set(value);
      const isValid = unique.size === value.length;
      return {
        isValid,
        errors: !isValid ? [message] : [],
        warnings: []
      };
    });
    return this;
  }

  validate(value: T[]): ValidationResult {
    const results = this.rules.map(rule => rule(value));
    return BaseValidator.combine(...results);
  }
}

// Date validators
export class DateValidator extends BaseValidator<Date> {
  private rules: Array<(value: Date) => ValidationResult> = [];

  required(message = 'Date is required') {
    this.rules.push((value) => ({
      isValid: value instanceof Date && !isNaN(value.getTime()),
      errors: (!(value instanceof Date) || isNaN(value.getTime())) ? [message] : [],
      warnings: []
    }));
    return this;
  }

  minDate(min: Date, message?: string) {
    this.rules.push((value) => {
      if (!(value instanceof Date) || isNaN(value.getTime())) {
        return { isValid: true, errors: [], warnings: [] };
      }
      
      const isValid = value >= min;
      return {
        isValid,
        errors: !isValid ? [message || `Date must be after ${min.toLocaleDateString()}`] : [],
        warnings: []
      };
    });
    return this;
  }

  maxDate(max: Date, message?: string) {
    this.rules.push((value) => {
      if (!(value instanceof Date) || isNaN(value.getTime())) {
        return { isValid: true, errors: [], warnings: [] };
      }
      
      const isValid = value <= max;
      return {
        isValid,
        errors: !isValid ? [message || `Date must be before ${max.toLocaleDateString()}`] : [],
        warnings: []
      };
    });
    return this;
  }

  future(message = 'Date must be in the future') {
    return this.minDate(new Date(), message);
  }

  past(message = 'Date must be in the past') {
    return this.maxDate(new Date(), message);
  }

  validate(value: Date): ValidationResult {
    const results = this.rules.map(rule => rule(value));
    return BaseValidator.combine(...results);
  }
}

// Object validator for complex data structures
export class ObjectValidator<T extends Record<string, any>> extends BaseValidator<T> {
  private fieldValidators = new Map<keyof T, BaseValidator<any>>();
  private customRules: Array<(value: T) => ValidationResult> = [];

  field<K extends keyof T>(key: K, validator: BaseValidator<T[K]>) {
    this.fieldValidators.set(key, validator);
    return this;
  }

  custom(rule: (value: T) => ValidationResult) {
    this.customRules.push(rule);
    return this;
  }

  validate(value: T): ValidationResult {
    const results: ValidationResult[] = [];

    // Validate each field
    this.fieldValidators.forEach((validator, key) => {
      const fieldResult = validator.validate(value[key]);
      
      // Prefix field errors with field name
      results.push({
        isValid: fieldResult.isValid,
        errors: fieldResult.errors.map(error => `${String(key)}: ${error}`),
        warnings: fieldResult.warnings.map(warning => `${String(key)}: ${warning}`)
      });
    });

    // Run custom rules
    results.push(...this.customRules.map(rule => rule(value)));

    return BaseValidator.combine(...results);
  }
}

// Predefined validators for common use cases
export const validators = {
  // Create validators with fluent API
  string: () => new StringValidator(),
  number: () => new NumberValidator(),
  array: <T>() => new ArrayValidator<T>(),
  date: () => new DateValidator(),
  object: <T extends Record<string, any>>() => new ObjectValidator<T>(),

  // Common validation functions
  isEmail: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  isURL: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  isPhoneNumber: (phone: string): boolean => {
    return /^\+?[\d\s\-\(\)]{10,}$/.test(phone);
  },

  isStrongPassword: (password: string): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      warnings.push('Consider adding special characters for stronger security');
    }

    if (password.length < 12) {
      warnings.push('Consider using a longer password for better security');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  },

  // Data sanitization
  sanitizeString: (str: string): string => {
    return str
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/[<>]/g, '') // Remove < and > characters
      .substring(0, 1000); // Limit length
  },

  sanitizeNumber: (num: any): number | null => {
    const parsed = parseFloat(num);
    return isNaN(parsed) ? null : parsed;
  },

  sanitizeDate: (date: any): Date | null => {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
};

// Form validation helper
export const validateForm = <T extends Record<string, any>>(
  data: T,
  schema: Record<keyof T, BaseValidator<any>>
): ValidationResult & { fieldErrors: Record<keyof T, string[]> } => {
  const fieldErrors = {} as Record<keyof T, string[]>;
  const allResults: ValidationResult[] = [];

  for (const [key, validator] of Object.entries(schema)) {
    const result = validator.validate(data[key as keyof T]);
    fieldErrors[key as keyof T] = result.errors;
    allResults.push(result);
  }

  const combined = BaseValidator.combine(...allResults);

  return {
    ...combined,
    fieldErrors
  };
};