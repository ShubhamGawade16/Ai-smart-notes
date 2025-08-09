/**
 * Enhanced redirect helper for production environments
 * Handles the specific differences between preview and deployed environments
 */

export const isDeployedEnvironment = () => {
  const hostname = window.location.hostname;
  return hostname.includes('.replit.app') || 
         hostname.includes('.replit.co') ||
         hostname.includes('.replit.dev') ||
         !hostname.includes('localhost');
};

export const getRedirectDelay = () => {
  return isDeployedEnvironment() ? 200 : 100;
};

export const logEnvironmentInfo = () => {
  console.log('🌍 Environment info:', {
    hostname: window.location.hostname,
    isDeployed: isDeployedEnvironment(),
    redirectDelay: getRedirectDelay(),
    userAgent: navigator.userAgent.substring(0, 100)
  });
};

/**
 * Safe redirect that works in both preview and production
 */
export const safeRedirect = (url: string, delay: number = getRedirectDelay()) => {
  console.log(`🔄 Safe redirect to ${url} with ${delay}ms delay`);
  
  if (isDeployedEnvironment()) {
    // For deployed environments, use window.location.replace immediately
    setTimeout(() => {
      console.log(`🚀 Executing deployed redirect to ${url}`);
      window.location.replace(url);
    }, delay);
  } else {
    // For preview, use standard navigation
    setTimeout(() => {
      console.log(`🚀 Executing preview redirect to ${url}`);
      window.location.href = url;
    }, delay);
  }
};

/**
 * Force redirect for authentication flows in production
 */
export const forceAuthRedirect = (url: string) => {
  console.log(`🔥 Force auth redirect to ${url}`);
  
  // Clear any existing timers
  const timers = (window as any).__authRedirectTimers || [];
  timers.forEach((timer: number) => clearTimeout(timer));
  (window as any).__authRedirectTimers = [];
  
  // Set immediate redirect for production
  const timer = setTimeout(() => {
    console.log(`💥 Executing force redirect to ${url}`);
    window.location.replace(url);
  }, isDeployedEnvironment() ? 500 : 100);
  
  // Track timer
  (window as any).__authRedirectTimers = [timer];
};