import { useEffect } from "react";

// Enhanced accessibility features for WCAG compliance
export function useAccessibilityEnhancements() {
  useEffect(() => {
    // Add skip link functionality
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded focus:z-50';
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Enhance focus management
    const handleKeyboardNavigation = (e: KeyboardEvent) => {
      // Escape key to close modals
      if (e.key === 'Escape') {
        const modal = document.querySelector('[role="dialog"]');
        if (modal) {
          const closeButton = modal.querySelector('[aria-label="Close"]') as HTMLElement;
          closeButton?.click();
        }
      }
    };

    document.addEventListener('keydown', handleKeyboardNavigation);

    return () => {
      document.removeEventListener('keydown', handleKeyboardNavigation);
      skipLink.remove();
    };
  }, []);
}

// Enhanced color contrast utilities
export const accessibleColors = {
  // High contrast ratios (4.5:1 minimum)
  teal: {
    primary: 'hsl(173, 58%, 35%)', // Enhanced contrast
    secondary: 'hsl(173, 40%, 45%)',
    background: 'hsl(173, 20%, 95%)',
    text: 'hsl(173, 58%, 20%)'
  },
  gray: {
    text: 'hsl(0, 0%, 15%)', // High contrast text
    textSecondary: 'hsl(0, 0%, 30%)',
    border: 'hsl(0, 0%, 70%)'
  }
};

// Screen reader announcements
export function announceToScreenReader(message: string) {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Focus management utilities
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  };

  element.addEventListener('keydown', handleTabKey);
  firstElement?.focus();

  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
}