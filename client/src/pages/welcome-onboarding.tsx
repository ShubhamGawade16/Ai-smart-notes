import WelcomeOnboardingCarousel from '@/components/welcome-onboarding-carousel';
import { useAuth } from '@/hooks/use-supabase-auth';
import { Loader2 } from 'lucide-react';

export default function WelcomeOnboarding() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-teal-500 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p>Please sign in to continue</p>
        </div>
      </div>
    );
  }

  return <WelcomeOnboardingCarousel />;
}