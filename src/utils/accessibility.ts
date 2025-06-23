// Accessibility utilities for better user experience

import { useEffect, useRef, useState } from 'react';

// Focus management utilities
export const focusUtils = {
  // Trap focus within a container (useful for modals)
  trapFocus: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // Focus first element
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  },

  // Focus the first focusable element in a container
  focusFirst: (container: HTMLElement) => {
    const focusable = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    
    focusable?.focus();
  },

  // Save and restore focus
  saveFocus: () => {
    const activeElement = document.activeElement as HTMLElement;
    return () => {
      activeElement?.focus();
    };
  }
};

// Keyboard navigation hook
export const useKeyboardNavigation = (
  items: any[],
  onSelect: (index: number) => void,
  options: {
    loop?: boolean;
    orientation?: 'horizontal' | 'vertical';
    disabled?: boolean;
  } = {}
) => {
  const { loop = true, orientation = 'vertical', disabled = false } = options;
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (disabled) return;

    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isVertical = orientation === 'vertical';
      const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
      const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';

      switch (e.key) {
        case nextKey:
          e.preventDefault();
          setActiveIndex(prev => {
            const next = prev + 1;
            return next >= items.length ? (loop ? 0 : prev) : next;
          });
          break;

        case prevKey:
          e.preventDefault();
          setActiveIndex(prev => {
            const next = prev - 1;
            return next < 0 ? (loop ? items.length - 1 : prev) : next;
          });
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          if (activeIndex >= 0) {
            onSelect(activeIndex);
          }
          break;

        case 'Escape':
          setActiveIndex(-1);
          break;

        case 'Home':
          e.preventDefault();
          setActiveIndex(0);
          break;

        case 'End':
          e.preventDefault();
          setActiveIndex(items.length - 1);
          break;
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [items.length, onSelect, loop, orientation, disabled, activeIndex]);

  return { activeIndex, setActiveIndex, containerRef };
};

// Screen reader announcements
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('aria-relevant', 'text');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';

  document.body.appendChild(announcement);
  announcement.textContent = message;

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Reduced motion detection
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// High contrast detection
export const useHighContrast = () => {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersHighContrast;
};

// Color contrast validation
export const validateContrast = (foreground: string, background: string): {
  ratio: number;
  aa: boolean;
  aaa: boolean;
} => {
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Calculate relative luminance
  const getLuminance = (rgb: { r: number; g: number; b: number }) => {
    const sRGB = [rgb.r, rgb.g, rgb.b].map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };

  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  if (!fg || !bg) {
    return { ratio: 0, aa: false, aaa: false };
  }

  const fgLum = getLuminance(fg);
  const bgLum = getLuminance(bg);

  const ratio = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);

  return {
    ratio,
    aa: ratio >= 4.5,
    aaa: ratio >= 7
  };
};

// Skip link component utility
export const createSkipLink = (targetId: string, text: string = 'Skip to main content') => {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className = 'sr-only-focusable';
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 6px;
    width: 1px;
    height: 1px;
    padding: 0;
    border: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  `;

  skipLink.addEventListener('focus', () => {
    skipLink.style.cssText = `
      position: absolute;
      top: 6px;
      left: 6px;
      z-index: 9999;
      padding: 8px 16px;
      background: #000;
      color: #fff;
      text-decoration: none;
      border-radius: 4px;
      width: auto;
      height: auto;
      overflow: visible;
      clip: auto;
      white-space: normal;
    `;
  });

  skipLink.addEventListener('blur', () => {
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      width: 1px;
      height: 1px;
      padding: 0;
      border: 0;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
    `;
  });

  return skipLink;
};

// ARIA utilities
export const ariaUtils = {
  // Generate unique IDs for ARIA relationships
  generateId: (prefix: string = 'aria') => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Set ARIA attributes for better screen reader support
  setAriaAttributes: (element: HTMLElement, attributes: Record<string, string>) => {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key.startsWith('aria-') ? key : `aria-${key}`, value);
    });
  },

  // Live region for dynamic content announcements
  createLiveRegion: (politeness: 'polite' | 'assertive' = 'polite') => {
    const region = document.createElement('div');
    region.setAttribute('aria-live', politeness);
    region.setAttribute('aria-atomic', 'true');
    region.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    
    document.body.appendChild(region);
    
    return {
      announce: (message: string) => {
        region.textContent = message;
      },
      destroy: () => {
        document.body.removeChild(region);
      }
    };
  }
};

// Keyboard shortcuts manager
export class KeyboardShortcuts {
  private shortcuts = new Map<string, () => void>();
  private isActive = true;

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  register(combination: string, callback: () => void) {
    this.shortcuts.set(combination.toLowerCase(), callback);
  }

  unregister(combination: string) {
    this.shortcuts.delete(combination.toLowerCase());
  }

  setActive(active: boolean) {
    this.isActive = active;
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (!this.isActive) return;

    // Skip if user is typing in input fields
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const combination = [
      e.ctrlKey ? 'ctrl' : '',
      e.altKey ? 'alt' : '',
      e.shiftKey ? 'shift' : '',
      e.metaKey ? 'meta' : '',
      e.key.toLowerCase()
    ].filter(Boolean).join('+');

    const callback = this.shortcuts.get(combination);
    if (callback) {
      e.preventDefault();
      callback();
    }
  }

  destroy() {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.shortcuts.clear();
  }
}