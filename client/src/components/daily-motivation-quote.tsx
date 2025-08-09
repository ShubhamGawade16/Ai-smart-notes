import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useSubscription } from '@/hooks/use-subscription';

const productivityQuotes = [
  {
    quote: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
    category: "start"
  },
  {
    quote: "Focus on being productive instead of busy.",
    author: "Tim Ferriss",
    category: "focus"
  },
  {
    quote: "Success is the sum of small efforts repeated day in and day out.",
    author: "Robert Collier",
    category: "consistency"
  },
  {
    quote: "Great things never come from comfort zones.",
    author: "Unknown",
    category: "growth"
  }
];

export default function DailyMotivationQuote() {
  const [currentQuote, setCurrentQuote] = useState(productivityQuotes[0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isAiQuote, setIsAiQuote] = useState(false);
  const { incrementAiUsage, checkAiUsageLimit } = useSubscription();

  // Fetch user's tasks for AI context
  const { data: tasksResponse } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const tasks = (tasksResponse as any)?.tasks || [];
  const completedTasks = tasks.filter((task: any) => task.completed);
  const incompleteTasks = tasks.filter((task: any) => !task.completed);

  // Get AI-generated personalized quote (FREE feature - no AI usage increment needed)
  const getAiPersonalizedQuote = async () => {
    try {
      console.log('🆓 Generating FREE daily motivation quote...');
      const response = await apiRequest('POST', '/api/ai/motivation-quote', {
        completedTasks: completedTasks.length,
        incompleteTasks: incompleteTasks.length,
        recentTasks: tasks.slice(0, 5).map((t: any) => ({ title: t.title, completed: t.completed }))
      });
      const data = await response.json();
      
      if (data.quote && data.quote.trim()) {
        console.log('AI quote generated successfully:', data.quote);
        return { 
          quote: data.quote, 
          author: data.author || 'Planify AI', 
          category: 'ai-personalized' 
        };
      } else {
        console.log('AI quote was empty, falling back to predefined');
        return getPersonalizedQuote();
      }
    } catch (error) {
      console.error('Failed to get AI quote:', error);
      return getPersonalizedQuote();
    }
  };

  // Get a personalized quote based on time of day and previous quote
  const getPersonalizedQuote = () => {
    const hour = new Date().getHours();
    let preferredCategory = 'general';
    
    // Morning: motivating start quotes
    if (hour >= 5 && hour < 12) {
      preferredCategory = 'start';
    }
    // Afternoon: focus and action quotes
    else if (hour >= 12 && hour < 17) {
      preferredCategory = 'focus';
    }
    // Evening: consistency and growth quotes
    else if (hour >= 17 && hour < 22) {
      preferredCategory = 'consistency';
    }
    
    // Filter quotes by preferred category or get random
    const filteredQuotes = productivityQuotes.filter(q => q.category === preferredCategory);
    const availableQuotes = filteredQuotes.length > 0 ? filteredQuotes : productivityQuotes;
    
    // Get a different quote than current
    const otherQuotes = availableQuotes.filter(q => q.quote !== currentQuote.quote);
    const randomQuote = otherQuotes[Math.floor(Math.random() * otherQuotes.length)];
    
    return randomQuote;
  };

  // Set initial quote based on the day
  useEffect(() => {
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const quoteIndex = dayOfYear % productivityQuotes.length;
    setCurrentQuote(productivityQuotes[quoteIndex]);
  }, []);

  const refreshQuote = async () => {
    setIsAnimating(true);
    setIsAiQuote(false);
    
    try {
      // Always try to get AI quote first
      console.log('Refresh clicked - attempting to generate AI quote');
      const aiQuote = await getAiPersonalizedQuote();
      
      if (aiQuote.category === 'ai-personalized') {
        setCurrentQuote(aiQuote);
        setIsAiQuote(true);
        console.log('AI quote set successfully');
      } else {
        setCurrentQuote(aiQuote); // This will be a fallback predefined quote
        setIsAiQuote(false);
        console.log('Using fallback predefined quote');
      }
    } catch (error) {
      console.error('Error in refreshQuote:', error);
      setCurrentQuote(getPersonalizedQuote());
      setIsAiQuote(false);
    }
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 card-animate overflow-hidden">
      <CardHeader className="pb-4 pt-6 px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="animate-pulse">💡</span>
            <span className="gradient-text">Daily Motivation</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshQuote}
            className="btn-hover h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
            title="Generate AI quote"
            disabled={isAnimating}
          >
            <RefreshCw className={`w-4 h-4 transition-transform duration-500 ${isAnimating ? 'animate-spin' : 'hover:rotate-180'}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className={`transition-all duration-500 ease-in-out ${isAnimating ? 'opacity-0 transform scale-95 translate-y-2' : 'opacity-100 transform scale-100 translate-y-0'}`}>
          <blockquote className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
            "{currentQuote.quote}"
          </blockquote>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              — {currentQuote.author}
            </p>
            {isAiQuote && (
              <span className="text-xs bg-gradient-to-r from-purple-500 to-teal-500 bg-clip-text text-transparent font-medium">
                ✨ AI Personalized
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}