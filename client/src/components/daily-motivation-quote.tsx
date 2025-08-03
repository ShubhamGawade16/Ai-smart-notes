import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

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
    quote: "You don't have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar",
    category: "start"
  },
  {
    quote: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney",
    category: "action"
  },
  {
    quote: "Success is the sum of small efforts repeated day in and day out.",
    author: "Robert Collier",
    category: "consistency"
  },
  {
    quote: "Your limitation—it's only your imagination.",
    author: "Unknown",
    category: "mindset"
  },
  {
    quote: "Great things never come from comfort zones.",
    author: "Unknown",
    category: "growth"
  },
  {
    quote: "Dream it. Wish it. Do it.",
    author: "Unknown",
    category: "action"
  },
  {
    quote: "Don't wait for opportunity. Create it.",
    author: "Unknown",
    category: "proactive"
  },
  {
    quote: "The harder you work for something, the greater you'll feel when you achieve it.",
    author: "Unknown",
    category: "effort"
  }
];

export default function DailyMotivationQuote() {
  const [currentQuote, setCurrentQuote] = useState(productivityQuotes[0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isAiQuote, setIsAiQuote] = useState(false);

  // Fetch user's tasks for AI context
  const { data: tasksResponse } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const tasks = (tasksResponse as any)?.tasks || [];
  const completedTasks = tasks.filter((task: any) => task.completed);
  const incompleteTasks = tasks.filter((task: any) => !task.completed);

  // Get AI-generated personalized quote
  const getAiPersonalizedQuote = async () => {
    try {
      const response = await apiRequest('POST', '/api/ai/motivation-quote', {
        completedTasks: completedTasks.length,
        incompleteTasks: incompleteTasks.length,
        recentTasks: tasks.slice(0, 5).map((t: any) => ({ title: t.title, completed: t.completed }))
      });
      const data = await response.json();
      return { quote: data.quote, author: data.author || 'AI Assistant', category: 'ai' };
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
    try {
      // 50% chance to get AI quote if user has tasks
      const useAi = tasks.length > 0 && Math.random() > 0.5;
      if (useAi) {
        const aiQuote = await getAiPersonalizedQuote();
        setCurrentQuote(aiQuote);
        setIsAiQuote(true);
      } else {
        setCurrentQuote(getPersonalizedQuote());
        setIsAiQuote(false);
      }
    } catch (error) {
      setCurrentQuote(getPersonalizedQuote());
      setIsAiQuote(false);
    }
    setIsAnimating(false);
  };

  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
      <CardHeader className="pb-4 pt-6 px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            💡 Daily Motivation
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshQuote}
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <RefreshCw className={`w-4 h-4 ${isAnimating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
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