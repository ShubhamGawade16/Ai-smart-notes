import { createClient } from '@supabase/supabase-js'

// Force using the new Supabase credentials directly (temporary fix for cache issue)
const supabaseUrl = 'https://qtdjrdxwfvhcwowebxnm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZGpyZHh3ZnZoY3dvd2VieG5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1OTE2NDgsImV4cCI6MjA3MDE2NzY0OH0.084iehz8I9T71uaN-xbdUgc8_GXJvP-KWBKUOrP4CRg'

console.log('🔄 Creating Supabase client with URL:', supabaseUrl)
console.log('🔑 Has anon key:', !!supabaseAnonKey)
console.log('📅 Config loaded at:', new Date().toISOString())
console.log('🎯 Using HARDCODED credentials to bypass cache')

// Force clear any old cached auth data
if (typeof window !== 'undefined') {
  // Clear all localStorage keys that might contain old Supabase data
  Object.keys(localStorage).forEach(key => {
    if (key.includes('supabase') || key.includes('humafgs')) {
      localStorage.removeItem(key)
    }
  })
  sessionStorage.clear()
}

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl && supabaseAnonKey && 
  supabaseUrl.startsWith('https://') && 
  supabaseUrl.includes('.supabase.co') &&
  supabaseAnonKey.length > 20

export const supabase = hasValidCredentials ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
}) : null

console.log('✅ Supabase client created:', !!supabase)

// Auth helpers
export const signInWithGoogle = async () => {
  if (!supabase) {
    throw new Error('Supabase not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.')
  }
  
  console.log('Initiating Google OAuth...')
  console.log('Supabase URL:', supabaseUrl)
  
  // Get the current host for proper redirect URL
  const redirectUrl = `${window.location.origin}/auth/callback`
  console.log('Using redirect URL:', redirectUrl)
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      scopes: 'openid email profile',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  
  console.log('Raw OAuth response:', { data, error })
  
  if (error) {
    console.error('Google OAuth initiation error:', error)
    console.error('Full error details:', JSON.stringify(error, null, 2))
    
    // Provide more specific error messages based on error types
    if (error.message.includes('Provider not found') || error.message.includes('provider_not_found')) {
      throw new Error('Google provider is not enabled in your Supabase project. Go to Authentication → Providers → Google and enable it with your Google OAuth credentials.')
    } else if (error.message.includes('redirect')) {
      throw new Error('Invalid redirect URL configuration. Please check your Redirect URLs in Supabase Authentication settings.')
    } else if (error.message.includes('Invalid login credentials')) {
      throw new Error('Google OAuth configuration issue. Please verify your Google Client ID and Secret in Supabase.')
    } else {
      throw new Error(`Google authentication error: ${error.message}`)
    }
  }
  
  console.log('Google OAuth initiated successfully. Data:', data)
  console.log('Redirect URL from Supabase:', data?.url)
  
  // If we reach here, the OAuth flow should redirect to Google
  if (!data || !data.url) {
    throw new Error('Google OAuth did not return a redirect URL. Please check your Supabase Google provider configuration.')
  }
  
  // Log the full redirect URL for debugging
  console.log('About to redirect to:', data.url)
  
  return data
}

export const signInWithEmail = async (email: string, password: string) => {
  if (!supabase) {
    throw new Error('Supabase not configured. Please check your environment variables.')
  }
  
  console.log('Attempting email sign in with:', { email, supabaseUrl })
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    console.log('Supabase auth response:', { data, error })
    
    if (error) {
      console.error('Supabase auth error details:', error)
      
      // Handle specific error types
      if (error.name === 'AuthRetryableFetchError' || error.status === 0) {
        throw new Error('Network connection issue. Please check your internet connection and try again.')
      }
      
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.')
      }
      
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Please check your email and click the verification link before signing in.')
      }
      
      throw new Error(`Sign in failed: ${error.message}`)
    }
    
    return data
  } catch (networkError: any) {
    console.error('Network or connection error:', networkError)
    
    // Handle network-level errors
    if (networkError.name === 'TypeError' && networkError.message.includes('fetch')) {
      throw new Error('Unable to connect to authentication service. Please check your internet connection.')
    }
    
    throw networkError
  }
}

export const signUpWithEmail = async (email: string, password: string, firstName: string, lastName: string) => {
  if (!supabase) {
    throw new Error('Supabase not configured. Please check your environment variables.')
  }
  
  console.log('Attempting email sign up with:', { 
    email, 
    firstName, 
    lastName,
    supabaseUrl,
    hasAnonKey: !!supabaseAnonKey
  })
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/verified`,
        data: {
          first_name: firstName,
          last_name: lastName,
          name: `${firstName} ${lastName}`,
        }
      }
    })
    
    console.log('Supabase signup response:', { data, error })
    
    if (error) {
      console.error('Supabase signup error details:', error)
      
      // Handle specific error types
      if (error.name === 'AuthRetryableFetchError' || error.status === 0) {
        throw new Error('Network connection issue. Please check your internet connection and try again.')
      }
      
      if (error.message.includes('User already registered')) {
        throw new Error('An account with this email already exists. Please try signing in instead.')
      }
      
      if (error.message.includes('Invalid email')) {
        throw new Error('Please enter a valid email address.')
      }
      
      if (error.message.includes('Password')) {
        throw new Error('Password must be at least 6 characters long.')
      }
      
      throw new Error(`Sign up failed: ${error.message}`)
    }
    
    return data
  } catch (networkError: any) {
    console.error('Network or connection error:', networkError)
    
    // Handle network-level errors
    if (networkError.name === 'TypeError' && networkError.message.includes('fetch')) {
      throw new Error('Unable to connect to authentication service. Please check your internet connection.')
    }
    
    throw networkError
  }
}

export const signOut = async () => {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }
  
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw error
  }
}

export const getSession = async () => {
  if (!supabase) {
    return null
  }
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Session error:', error)
      return null
    }
    return session
  } catch (error) {
    console.error('Session check failed:', error)
    return null
  }
}

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  if (!supabase) {
    return { data: { subscription: { unsubscribe: () => {} } } }
  }
  
  return supabase.auth.onAuthStateChange(callback)
}