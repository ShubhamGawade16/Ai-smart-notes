/**
 * Production-specific authentication fixes for deployed environments
 * Handles the specific timing and routing issues that occur in production
 */

export const isDeployedEnvironment = () => {
  return window.location.hostname.includes('.replit.app') || 
         window.location.hostname.includes('.replit.co') ||
         !window.location.hostname.includes('localhost');
};

export const handleProductionAuthRedirect = () => {
  const currentPath = window.location.pathname;
  const hasAuthFragment = window.location.hash.includes('access_token') || window.location.hash.includes('refresh_token');
  const hasAuthParam = window.location.search.includes('code=') || window.location.search.includes('access_token');
  
  console.log('🔍 Production auth check:', {
    path: currentPath,
    hasAuthFragment,
    hasAuthParam,
    isDeployed: isDeployedEnvironment()
  });

  // In deployed environments, if we're on auth callback with auth tokens, 
  // immediately redirect after a longer delay to allow proper session establishment
  if (isDeployedEnvironment() && 
      currentPath === '/auth/callback' && 
      (hasAuthFragment || hasAuthParam)) {
    
    console.log('🚀 Production auth redirect triggered');
    
    // Store tokens before redirect for improved reliability
    if (hasAuthFragment) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      if (accessToken) {
        localStorage.setItem('auth_token', accessToken);
        console.log('✅ Stored auth token from hash');
      }
    }
    
    // Wait longer for auth processing then redirect to app interface
    setTimeout(() => {
      console.log('🔄 Executing production redirect to dashboard');
      // Force redirect to main app interface, not general dashboard
      window.location.href = '/dashboard';
    }, 2500); // Increased delay for better production auth processing
    
    return true;
  }
  
  return false;
};

/**
 * Force authentication check and redirect for production
 */
export const forceProductionAuthCheck = async () => {
  if (!isDeployedEnvironment()) return false;
  
  // Check if user is authenticated via localStorage token
  const authToken = localStorage.getItem('auth_token');
  
  if (authToken && authToken.startsWith('eyJ')) { // JWT token check
    console.log('🔑 Found auth token in production, redirecting to dashboard');
    window.location.replace('/dashboard');
    return true;
  }
  
  return false;
};