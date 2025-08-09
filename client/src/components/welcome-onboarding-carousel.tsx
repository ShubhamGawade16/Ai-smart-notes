import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronLeft, 
  ChevronRight, 
  Target, 
  Zap, 
  Brain, 
  CheckCircle, 
  Star, 
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  Users,
  Award,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-supabase-auth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  content: React.ReactNode;
  backgroundGradient: string;
  icon: React.ElementType;
  actionType?: 'continue' | 'complete' | 'skip';
}

interface UserPreferences {
  workStyle?: string;
  goals?: string[];
  notificationStyle?: string;
  dailyGoals?: number;
  timePreference?: string;
}

export default function WelcomeOnboardingCarousel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const workStyles = [
    { id: 'focused', label: 'Deep Focus', description: 'Long uninterrupted work sessions', icon: Target },
    { id: 'flexible', label: 'Flexible', description: 'Adapt to changing priorities', icon: Zap },
    { id: 'structured', label: 'Structured', description: 'Planned schedules and routines', icon: Clock },
    { id: 'creative', label: 'Creative Bursts', description: 'Inspiration-driven work', icon: Lightbulb }
  ];

  const goals = [
    { id: 'productivity', label: 'Boost Productivity', icon: TrendingUp },
    { id: 'organization', label: 'Stay Organized', icon: Target },
    { id: 'balance', label: 'Work-Life Balance', icon: Star },
    { id: 'collaboration', label: 'Team Collaboration', icon: Users },
    { id: 'growth', label: 'Personal Growth', icon: Award },
    { id: 'creativity', label: 'Creative Projects', icon: Sparkles }
  ];

  const notificationStyles = [
    { id: 'gentle', label: 'Gentle Nudges', description: 'Soft reminders at optimal times' },
    { id: 'focused', label: 'Focus Blocks', description: 'Dedicated work sessions with breaks' },
    { id: 'achievement', label: 'Achievement-Based', description: 'Celebrate wins and streaks' }
  ];

  const slides: OnboardingSlide[] = [
    {
      id: 'welcome',
      title: `Welcome to Planify, ${user?.firstName || 'there'}!`,
      subtitle: 'Your AI-powered productivity companion',
      backgroundGradient: 'from-teal-500 via-cyan-500 to-blue-500',
      icon: Sparkles,
      content: (
        <div className="text-center space-y-6">
          <div className="mx-auto w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-4">
            <p className="text-white/90 text-lg">
              Let's personalize your experience in just a few steps
            </p>
            <div className="flex items-center justify-center space-x-4 text-white/80">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5" />
                <span>AI-Powered</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Goal-Oriented</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Results-Driven</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'work-style',
      title: 'How do you work best?',
      subtitle: 'Help us understand your work style',
      backgroundGradient: 'from-purple-500 via-pink-500 to-rose-500',
      icon: Target,
      content: (
        <div className="space-y-6">
          <p className="text-white/90 text-center">
            Choose the style that best describes your approach to work
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {workStyles.map((style) => {
              const Icon = style.icon;
              const isSelected = preferences.workStyle === style.id;
              return (
                <motion.div
                  key={style.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPreferences({ ...preferences, workStyle: style.id })}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'bg-white text-purple-700 shadow-lg' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className={`w-6 h-6 mt-1 ${isSelected ? 'text-purple-600' : 'text-white'}`} />
                    <div>
                      <h3 className="font-semibold">{style.label}</h3>
                      <p className={`text-sm ${isSelected ? 'text-purple-600' : 'text-white/80'}`}>
                        {style.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )
    },
    {
      id: 'goals',
      title: 'What are your main goals?',
      subtitle: 'Select up to 3 goals that matter most to you',
      backgroundGradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      icon: Star,
      content: (
        <div className="space-y-6">
          <p className="text-white/90 text-center">
            Our AI will tailor suggestions based on your priorities
          </p>
          <div className="grid md:grid-cols-3 gap-3">
            {goals.map((goal) => {
              const Icon = goal.icon;
              const isSelected = preferences.goals?.includes(goal.id);
              const selectedCount = preferences.goals?.length || 0;
              const canSelect = !isSelected && selectedCount < 3;
              
              return (
                <motion.div
                  key={goal.id}
                  whileHover={canSelect || isSelected ? { scale: 1.05 } : {}}
                  whileTap={canSelect || isSelected ? { scale: 0.95 } : {}}
                  onClick={() => {
                    if (isSelected) {
                      setPreferences({
                        ...preferences,
                        goals: preferences.goals?.filter(g => g !== goal.id) || []
                      });
                    } else if (canSelect) {
                      setPreferences({
                        ...preferences,
                        goals: [...(preferences.goals || []), goal.id]
                      });
                    }
                  }}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-200 text-center ${
                    isSelected
                      ? 'bg-white text-emerald-700 shadow-lg'
                      : canSelect
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-white/5 text-white/50 cursor-not-allowed'
                  }`}
                >
                  <Icon className={`w-8 h-8 mx-auto mb-2 ${
                    isSelected ? 'text-emerald-600' : canSelect ? 'text-white' : 'text-white/50'
                  }`} />
                  <p className="font-semibold text-sm">{goal.label}</p>
                </motion.div>
              );
            })}
          </div>
          <div className="text-center">
            <Badge variant="secondary" className="bg-white/20 text-white">
              {preferences.goals?.length || 0} of 3 selected
            </Badge>
          </div>
        </div>
      )
    },
    {
      id: 'notifications',
      title: 'How should we remind you?',
      subtitle: 'Choose your preferred notification style',
      backgroundGradient: 'from-orange-500 via-red-500 to-pink-500',
      icon: Clock,
      content: (
        <div className="space-y-6">
          <p className="text-white/90 text-center">
            We'll use AI to send reminders at the perfect time
          </p>
          <div className="space-y-4">
            {notificationStyles.map((style) => {
              const isSelected = preferences.notificationStyle === style.id;
              return (
                <motion.div
                  key={style.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPreferences({ ...preferences, notificationStyle: style.id })}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'bg-white text-orange-700 shadow-lg' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{style.label}</h3>
                      <p className={`text-sm ${isSelected ? 'text-orange-600' : 'text-white/80'}`}>
                        {style.description}
                      </p>
                    </div>
                    {isSelected && <CheckCircle className="w-6 h-6 text-orange-600" />}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )
    },
    {
      id: 'complete',
      title: "You're all set!",
      subtitle: 'Welcome to your personalized productivity journey',
      backgroundGradient: 'from-violet-500 via-purple-500 to-indigo-500',
      icon: CheckCircle,
      actionType: 'complete',
      content: (
        <div className="text-center space-y-6">
          <div className="mx-auto w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-4">
            <p className="text-white/90 text-lg">
              Based on your preferences, we've customized your experience
            </p>
            <div className="bg-white/10 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-center space-x-2 text-white">
                <Target className="w-5 h-5" />
                <span>Work Style: {workStyles.find(w => w.id === preferences.workStyle)?.label}</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-white">
                <Star className="w-5 h-5" />
                <span>Goals: {preferences.goals?.length || 0} selected</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-white">
                <Clock className="w-5 h-5" />
                <span>Notifications: {notificationStyles.find(n => n.id === preferences.notificationStyle)?.label}</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const canProceed = () => {
    const slide = slides[currentSlide];
    switch (slide.id) {
      case 'work-style':
        return !!preferences.workStyle;
      case 'goals':
        return (preferences.goals?.length || 0) >= 1;
      case 'notifications':
        return !!preferences.notificationStyle;
      default:
        return true;
    }
  };

  const completeOnboarding = async () => {
    setIsCompleting(true);
    try {
      // Save preferences to backend
      await apiRequest('POST', '/api/users/onboarding-complete', {
        preferences: {
          workStyle: preferences.workStyle,
          goals: preferences.goals,
          notificationStyle: preferences.notificationStyle,
          onboardingCompletedAt: new Date().toISOString()
        }
      });

      toast({
        title: "Welcome to Planify!",
        description: "Your personalized experience is ready to go.",
      });

      // Trigger completion callback
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      toast({
        title: "Setup Complete",
        description: "Welcome to your productivity journey!",
        variant: "default"
      });
      // Continue to dashboard even if save fails
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      }
    }
    setIsCompleting(false);
  };

  const skipOnboarding = async () => {
    try {
      await apiRequest('POST', '/api/users/onboarding-complete', {
        preferences: { skipped: true }
      });
    } catch (error) {
      console.error('Failed to mark onboarding as complete:', error);
    }
    window.location.href = '/dashboard';
  };

  const progressPercentage = ((currentSlide + 1) / slides.length) * 100;
  const currentSlideData = slides[currentSlide];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentSlideData.backgroundGradient} transition-all duration-1000`} />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="p-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">Planify</h1>
              <Badge variant="secondary" className="bg-white/20 text-white">
                Step {currentSlide + 1} of {slides.length}
              </Badge>
            </div>
            <Button 
              variant="ghost" 
              onClick={skipOnboarding}
              className="text-white hover:bg-white/10"
            >
              Skip
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="max-w-4xl mx-auto mt-4">
            <Progress value={progressPercentage} className="h-2 bg-white/20" />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-4xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <div className="mb-8">
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    {currentSlideData.title}
                  </h2>
                  <p className="text-xl text-white/80">
                    {currentSlideData.subtitle}
                  </p>
                </div>

                <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                  <CardContent className="p-8">
                    {currentSlideData.content}
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="text-white hover:bg-white/10 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="flex space-x-2">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentSlide ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>

            {currentSlideData.actionType === 'complete' ? (
              <Button
                onClick={completeOnboarding}
                disabled={isCompleting}
                className="bg-white text-purple-700 hover:bg-white/90"
              >
                {isCompleting ? 'Setting up...' : 'Get Started'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={nextSlide}
                disabled={!canProceed() || currentSlide === slides.length - 1}
                className="bg-white text-purple-700 hover:bg-white/90 disabled:opacity-50"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}