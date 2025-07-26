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
  
  console.log('Attempting Google sign in...')
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: 'email profile',
    },
  })
  
  if (error) {
    console.error('Supabase OAuth error:', error)
    throw new Error(`Google authentication failed: ${error.message}. Please ensure Google OAuth is configured in your Supabase project.`)
  }
  
  console.log('Google sign in data:', data)
  return data
}

export const signInWithEmail = async (email: string, password: string) => {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    throw new Error(`Sign in failed: ${error.message}`)
  }
  
  return data
}

export const signUpWithEmail = async (email: string, password: string, firstName: string, lastName: string) => {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        name: `${firstName} ${lastName}`,
      }
    }
  })
  
  if (error) {
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