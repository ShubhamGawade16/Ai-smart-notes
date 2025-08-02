import { createClient } from '@supabase/supabase-js'

// Placeholder values for development - you'll need to add real Supabase credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

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
  },
}) : null

// Auth helpers
export const signInWithGoogle = async () => {
  if (!supabase) {
    throw new Error('Supabase not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.')
  }
  
  console.log('Initiating Google OAuth...')
  
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
  
  if (error) {
    console.error('Google OAuth initiation error:', error)
    
    // Provide more specific error messages based on error types
    if (error.message.includes('Provider not found')) {
      throw new Error('Google authentication is not enabled in your Supabase project. Please configure Google OAuth provider in your Supabase dashboard.')
    } else if (error.message.includes('redirect')) {
      throw new Error('Invalid redirect URL configuration. Please check your Redirect URLs in Supabase Authentication settings.')
    } else {
      throw new Error(`Google authentication setup error: ${error.message}`)
    }
  }
  
  console.log('Google OAuth initiated successfully:', data)
  return data
}

export const signInWithEmail = async (email: string, password: string) => {
  if (!supabase) {
    throw new Error('Supabase not configured. Please check your environment variables.')
  }
  
  console.log('Attempting email sign in with:', { email, supabaseUrl: import.meta.env.VITE_SUPABASE_URL })
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  console.log('Supabase auth response:', { data, error })
  
  if (error) {
    console.error('Supabase auth error details:', error)
    throw new Error(`Sign in failed: ${error.message}`)
  }
  
  return data
}

export const signUpWithEmail = async (email: string, password: string, firstName: string, lastName: string) => {
  if (!supabase) {
    throw new Error('Supabase not configured. Please check your environment variables.')
  }
  
  console.log('Attempting email sign up with:', { 
    email, 
    firstName, 
    lastName,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
  })
  
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
    throw new Error(`Sign up failed: ${error.message}`)
  }
  
  return data
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