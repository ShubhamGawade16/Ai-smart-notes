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
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: 'email profile',
    },
  })
  
  if (error) {
    throw error
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
  
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    throw error
  }
  return session
}

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  if (!supabase) {
    return { data: { subscription: { unsubscribe: () => {} } } }
  }
  
  return supabase.auth.onAuthStateChange(callback)
}