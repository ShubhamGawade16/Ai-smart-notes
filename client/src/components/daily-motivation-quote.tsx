import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  const refreshQuote = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentQuote(getPersonalizedQuote());
      setIsAnimating(false);
    }, 300);
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 border-0">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Daily Motivation</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshQuote}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`w-4 h-4 ${isAnimating ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
        <blockquote className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 italic">
          "{currentQuote.quote}"
        </blockquote>
        <cite className="text-sm text-gray-600 dark:text-gray-400 not-italic">
          — {currentQuote.author}
        </cite>
      </div>
    </Card>
  );
}