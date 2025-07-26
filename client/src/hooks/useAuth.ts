import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { User } from "@shared/schema"
import { supabase, signInWithGoogle, signOut, getSession, onAuthStateChange } from "@/lib/supabase"
import { apiRequest } from "@/lib/queryClient"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    let isMounted = true;
    
    // Get initial session
    const initAuth = async () => {
      try {
        const session = await getSession();
        if (!isMounted) return;
        
        setSession(session)
        if (session?.user) {
          // Sync with our backend
          await syncUserWithBackend(session.user)
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Session check error:', error)
        if (isMounted) {
          setIsLoading(false)
        }
      }
    };

    initAuth();

    // Listen for auth changes
    let subscription: any = null;
    try {
      const { data: { subscription: sub } } = onAuthStateChange(async (event, session) => {
        if (!isMounted) return;
        
        setSession(session)
        if (session?.user) {
          await syncUserWithBackend(session.user)
        } else {
          setUser(null)
          setIsLoading(false)
          queryClient.clear()
        }
      })
      subscription = sub;
    } catch (error) {
      console.error('Auth state change error:', error)
      if (isMounted) {
        setIsLoading(false)
      }
    }

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [queryClient])

  const syncUserWithBackend = async (supabaseUser: any) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseUser.access_token}`,
        },
        body: JSON.stringify({
          id: supabaseUser.id,
          email: supabaseUser.email,
          firstName: supabaseUser.user_metadata?.first_name || supabaseUser.user_metadata?.name?.split(' ')[0] || '',
          lastName: supabaseUser.user_metadata?.last_name || supabaseUser.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
          profileImageUrl: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
        }),
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      }
    } catch (error) {
      console.error('Error syncing user with backend:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loginMutation = useMutation({
    mutationFn: signInWithGoogle,
    onError: (error) => {
      console.error('Google login error:', error)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      setUser(null)
      setSession(null)
      queryClient.clear()
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      if (!session?.access_token) throw new Error('No valid session')
      
      return apiRequest('/api/auth/user', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser)
    },
  })

  const login = async () => {
    await loginMutation.mutateAsync()
  }

  const logout = async () => {
    await logoutMutation.mutateAsync()
  }

  const updateProfile = async (updates: Partial<User>) => {
    await updateProfileMutation.mutateAsync(updates)
  }

  return {
    user,
    session,
    isLoading: isLoading || loginMutation.isPending || logoutMutation.isPending,
    isAuthenticated: !!user && !!session,
    login,
    logout,
    updateProfile,
    loginError: loginMutation.error?.message,
    isLoginPending: loginMutation.isPending,
  }
}