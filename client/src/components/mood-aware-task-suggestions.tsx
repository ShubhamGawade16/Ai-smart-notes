import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Heart, Smile, Frown, Meh, Sun, Cloud, CloudRain, Star } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface MoodData {
  current: 'energetic' | 'focused' | 'tired' | 'stressed' | 'neutral';
  energy: number;
  focus: number;
  stress: number;
}

interface TaskSuggestion {
  id: string;
  title: string;
  description: string;
  moodAlignment: number;
  estimatedTime: number;
  energyRequired: 'low' | 'medium' | 'high';
  reasoning: string;
}

const moodIcons = {
  energetic: <Star className="h-5 w-5 text-yellow-500" />,
  focused: <Sun className="h-5 w-5 text-blue-500" />,
  tired: <Cloud className="h-5 w-5 text-gray-500" />,
  stressed: <CloudRain className="h-5 w-5 text-red-500" />,
  neutral: <Meh className="h-5 w-5 text-gray-400" />
};

const moodLabels = {
  energetic: 'Energetic',
  focused: 'Focused', 
  tired: 'Tired',
  stressed: 'Stressed',
  neutral: 'Neutral'
};

export function MoodAwareTaskSuggestions() {
  const [selectedMood, setSelectedMood] = useState<MoodData['current']>('neutral');
  const { toast } = useToast();

  // Get current mood analysis
  const { data: moodData, isLoading } = useQuery({
    queryKey: ['/api/ai/mood-analysis'],
    queryFn: async () => {
      // Mock mood analysis data
      return {
        current: 'focused',
        energy: 75,
        focus: 85,
        stress: 25
      } as MoodData;
    },
    refetchInterval: 300000, // Update every 5 minutes
  });

  // Get mood-based task suggestions
  const { data: suggestions } = useQuery({
    queryKey: ['/api/ai/mood-suggestions', selectedMood],
    queryFn: async () => {
      // Mock suggestions based on mood
      const mockSuggestions: Record<string, TaskSuggestion[]> = {
        energetic: [
          {
            id: '1',
            title: 'Tackle that big project milestone',
            description: 'Perfect time for challenging work that requires creativity and drive',
            moodAlignment: 95,
            estimatedTime: 120,
            energyRequired: 'high',
            reasoning: 'High energy levels make this ideal for ambitious tasks'
          },
          {
            id: '2', 
            title: 'Organize workspace and plan ahead',
            description: 'Channel your energy into setting up for future success',
            moodAlignment: 80,
            estimatedTime: 45,
            energyRequired: 'medium',
            reasoning: 'Organization tasks benefit from high motivation'
          }
        ],
        focused: [
          {
            id: '3',
            title: 'Deep work on detailed analysis',
            description: 'Your focus is optimal for tasks requiring concentration',
            moodAlignment: 92,
            estimatedTime: 90,
            energyRequired: 'medium',
            reasoning: 'High focus state perfect for analytical work'
          },
          {
            id: '4',
            title: 'Review and refine existing work',
            description: 'Great time for careful editing and quality improvements',
            moodAlignment: 88,
            estimatedTime: 60,
            energyRequired: 'low',
            reasoning: 'Focused state ideal for detail-oriented tasks'
          }
        ],
        tired: [
          {
            id: '5',
            title: 'Simple administrative tasks',
            description: 'Handle routine work that doesn\'t require high energy',
            moodAlignment: 70,
            estimatedTime: 30,
            energyRequired: 'low',
            reasoning: 'Low energy tasks prevent burnout while staying productive'
          },
          {
            id: '6',
            title: 'Plan tomorrow\'s priorities',
            description: 'Light planning work that prepares you for tomorrow',
            moodAlignment: 65,
            estimatedTime: 20,
            energyRequired: 'low',
            reasoning: 'Planning helps you rest easier and start strong tomorrow'
          }
        ],
        stressed: [
          {
            id: '7',
            title: 'Quick wins and easy completions',
            description: 'Build momentum with tasks you can finish quickly',
            moodAlignment: 75,
            estimatedTime: 15,
            energyRequired: 'low',
            reasoning: 'Quick completions reduce stress and build confidence'
          },
          {
            id: '8',
            title: 'Mindful break and reset',
            description: 'Take time to decompress before tackling bigger tasks',
            moodAlignment: 85,
            estimatedTime: 10,
            energyRequired: 'low',
            reasoning: 'Managing stress improves overall productivity'
          }
        ],
        neutral: [
          {
            id: '9',
            title: 'Moderate complexity tasks',
            description: 'Balanced work that gradually builds momentum',
            moodAlignment: 70,
            estimatedTime: 60,
            energyRequired: 'medium',
            reasoning: 'Neutral mood is good for steady, consistent progress'
          }
        ]
      };
      return mockSuggestions[selectedMood] || mockSuggestions['neutral'];
    },
    enabled: !!selectedMood
  });

  // Create task from suggestion
  const createTaskMutation = useMutation({
    mutationFn: async (suggestion: TaskSuggestion) => {
      return apiRequest('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: suggestion.title,
          description: suggestion.description,
          estimatedTime: suggestion.estimatedTime,
          priority: suggestion.energyRequired === 'high' ? 'high' : 
                   suggestion.energyRequired === 'low' ? 'low' : 'medium'
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Task Created",
        description: "Mood-optimized task added to your list!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    }
  });

  const currentMood = moodData?.current || selectedMood;

  return (
    <div className="space-y-6">
      {/* Current Mood Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Current Mood Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {moodIcons[currentMood]}
              <span className="font-medium">{moodLabels[currentMood]}</span>
            </div>
            <Badge variant="outline">
              {Math.round((moodData?.energy || 50) + (moodData?.focus || 50)) / 2}% Optimal
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Energy</span>
                <span>{moodData?.energy || 50}%</span>
              </div>
              <Progress value={moodData?.energy || 50} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Focus</span>
                <span>{moodData?.focus || 50}%</span>
              </div>
              <Progress value={moodData?.focus || 50} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Stress</span>
                <span>{moodData?.stress || 25}%</span>
              </div>
              <Progress value={moodData?.stress || 25} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mood Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Adjust Mood (Override Detection)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(moodIcons).map(([mood, icon]) => (
              <Button
                key={mood}
                variant={selectedMood === mood ? "default" : "outline"}
                className="flex flex-col h-auto p-3"
                onClick={() => setSelectedMood(mood as MoodData['current'])}
              >
                {icon}
                <span className="text-xs mt-1">{moodLabels[mood as keyof typeof moodLabels]}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Task Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>Mood-Optimized Task Suggestions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestions?.map((suggestion) => (
            <div key={suggestion.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">{suggestion.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {suggestion.description}
                  </p>
                </div>
                <Badge variant="secondary">
                  {suggestion.moodAlignment}% match
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span>⏱️ {suggestion.estimatedTime}min</span>
                  <span>⚡ {suggestion.energyRequired} energy</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => createTaskMutation.mutate(suggestion)}
                  disabled={createTaskMutation.isPending}
                >
                  Add Task
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground italic">
                💡 {suggestion.reasoning}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}