import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { supabase } from '@/lib/supabase'
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Brain, CheckCircle, AlertCircle } from "lucide-react"

export default function AuthCallback() {
  const [, setLocation] = useLocation()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        if (!supabase) {
          setError('Authentication service not configured')
          setStatus('error')
          return
        }

        // Handle OAuth callback - this automatically processes the hash/query params
        const { data, error: authError } = await supabase.auth.getSession()
        
        if (authError) {
          console.error('Auth callback error:', authError)
          setError(authError.message)
          setStatus('error')
          
          toast({
            title: "Authentication Failed",
            description: authError.message,
            variant: "destructive",
          })
          
          setTimeout(() => setLocation('/login'), 2000)
          return
        }

        if (data.session) {
          console.log('Authentication successful:', data.session.user.email)
          setStatus('success')
          
          toast({
            title: "Welcome back!",
            description: "You've been successfully signed in.",
          })

          // Check if user has completed onboarding
          const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted') === 'true'
          
          // Redirect based on onboarding status
          setTimeout(() => {
            if (hasCompletedOnboarding) {
              setLocation('/')
            } else {
              setLocation('/onboarding')
            }
          }, 1500)
        } else {
          console.log('No session found after callback')
          setError('Authentication session not found')
          setStatus('error')
          setTimeout(() => setLocation('/login'), 2000)
        }
      } catch (error: any) {
        console.error('Callback processing error:', error)
        setError(error.message || 'Authentication failed')
        setStatus('error')
        setTimeout(() => setLocation('/login'), 2000)
      }
    }

    // Small delay to ensure URL parameters are processed
    const timer = setTimeout(handleAuthCallback, 500)
    return () => clearTimeout(timer)
  }, [setLocation, toast])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center border border-gray-200 dark:border-gray-700">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <Brain className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Status Content */}
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Completing Sign In
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Processing your authentication...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="h-8 w-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Welcome Back!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Successfully signed in. Redirecting you now...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="h-8 w-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Authentication Failed
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error || 'Something went wrong during sign in'}
              </p>
              <Button 
                onClick={() => setLocation('/login')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                Try Again
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}