import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { getSession } from '@/lib/supabase'

export default function AuthCallback() {
  const [, setLocation] = useLocation()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const session = await getSession()
        
        if (session) {
          setLocation('/')
        } else {
          setLocation('/login')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setLocation('/login')
      }
    }

    handleAuthCallback()
  }, [setLocation])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}