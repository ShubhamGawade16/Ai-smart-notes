/**
 * Immediate authentication redirect for deployed environments
 * This runs as soon as the page loads to catch authentication states
 */

export const setupImmediateAuthRedirect = () => {
  // Only run on auth callback page
  if (window.location.pathname !== '/auth/callback') return;
  
  console.log('🚨 Immediate auth redirect setup');
  
  // Check URL for auth success indicators
  const hasAuthToken = window.location.hash.includes('access_token') || 
                      window.location.search.includes('code=');
  
  // Check localStorage for existing auth
  const existingToken = localStorage.getItem('auth_token');
  
  console.log('Auth indicators:', { hasAuthToken, existingToken: !!existingToken });
  
  if (hasAuthToken || (existingToken && existingToken.startsWith('eyJ'))) {
    console.log('🔄 Immediate redirect to dashboard triggered');
    
    // Set a flag to prevent other redirects
    sessionStorage.setItem('immediate_redirect_triggered', 'true');
    
    // Immediate redirect for production
    setTimeout(() => {
      console.log('🚀 Executing immediate redirect');
      window.location.replace('/dashboard');
    }, 800); // Give some time for auth processing
    
    return true;
  }
  
  return false;
};

// Run immediately when script loads
if (typeof window !== 'undefined') {
  setupImmediateAuthRedirect();
}