/**
 * Reliable redirect helper for deployed environments
 * Handles differences between development and production navigation
 */

export const safeRedirect = (path: string, delay: number = 100) => {
  // Use window.location.href for deployed environments as it's more reliable
  // than wouter's navigate for post-authentication redirects
  setTimeout(() => {
    console.log(`🔀 Redirecting to: ${path}`);
    window.location.href = path;
  }, delay);
};

export const isProduction = () => {
  // Check if we're in a deployed environment (not localhost)
  return !window.location.hostname.includes('localhost') && 
         !window.location.hostname.includes('127.0.0.1');
};

export const getRedirectDelay = () => {
  // Longer delay for production environments to handle network latency
  return isProduction() ? 500 : 100;
};

export const logEnvironmentInfo = () => {
  console.log('🌍 Environment info:', {
    hostname: window.location.hostname,
    href: window.location.href,
    isProduction: isProduction(),
    redirectDelay: getRedirectDelay()
  });
};