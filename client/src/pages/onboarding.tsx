import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Brain, 
  ArrowRight, 
  ArrowLeft,
  Target,
  Bell,
  Zap,
  CheckCircle,
  Sparkles,
  Clock,
  Trophy
} from "lucide-react";

// Step 1: Quick Preferences Setup (2-3 simple questions)
function PreferencesStep({ onNext, preferences, setPreferences }: any) {
  const priorities = [
    { id: 'work', label: 'Work Tasks', icon: Target },
    { id: 'personal', label: 'Personal Goals', icon: Trophy },
    { id: 'learning', label: 'Learning & Growth', icon: Brain },
    { id: 'health', label: 'Health & Fitness', icon: Zap },
    { id: 'creativity', label: 'Creative Projects', icon: Sparkles },
    { id: 'family', label: 'Family Time', icon: CheckCircle }
  ];

  const reminderStyles = [
    { id: 'gentle', label: 'Gentle nudges', description: 'Soft reminders at optimal times' },
    { id: 'focused', label: 'Focus blocks', description: 'Dedicated work sessions with breaks' },
    { id: 'gamified', label: 'Achievement-based', description: 'Streaks, points, and challenges' }
  ];

  const handlePriorityToggle = (priorityId: string) => {
    const current = preferences.priorities || [];
    const updated = current.includes(priorityId)
      ? current.filter((p: string) => p !== priorityId)
      : [...current, priorityId].slice(0, 3); // Limit to 3
    setPreferences({ ...preferences, priorities: updated });
  };

  const canProceed = preferences.priorities?.length >= 1 && preferences.reminderStyle;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <Badge className="mb-4 bg-indigo-100 text-indigo-800">Step 1 of 3</Badge>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Let's Personalize Your Experience
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Tell us about your priorities so we can provide better AI suggestions
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-indigo-600" />
            What are your top 3 daily priorities?
          </CardTitle>
          <CardDescription>
            Select up to 3 areas where you want to be most productive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {priorities.map((priority) => {
              const Icon = priority.icon;
              const isSelected = preferences.priorities?.includes(priority.id);
              return (
                <div
                  key={priority.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                  }`}
                  onClick={() => handlePriorityToggle(priority.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`} />
                    <span className={`font-medium ${isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-white'}`}>
                      {priority.label}
                    </span>
                    {isSelected && <CheckCircle className="h-4 w-4 text-indigo-600 ml-auto" />}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2 text-indigo-600" />
            Preferred reminder style?
          </CardTitle>
          <CardDescription>
            How would you like the AI to help keep you on track?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reminderStyles.map((style) => (
              <div
                key={style.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  preferences.reminderStyle === style.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                }`}
                onClick={() => setPreferences({ ...preferences, reminderStyle: style.id })}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{style.label}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{style.description}</div>
                  </div>
                  {preferences.reminderStyle === style.id && (
                    <CheckCircle className="h-5 w-5 text-indigo-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button
          onClick={onNext}
          disabled={!canProceed}
          size="lg"
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-8"
        >
          Continue to Tutorial
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

// Step 2: Interactive Tutorial - First Task Creation
function TutorialStep({ onNext, onBack, preferences }: any) {
  const [taskTitle, setTaskTitle] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);

  const handleCreateTask = () => {
    if (!taskTitle.trim()) return;

    // Simulate AI categorization based on user preferences
    const suggestion = {
      category: preferences.priorities?.[0] || 'work',
      priority: 'medium',
      estimatedTime: '30 minutes',
      tags: ['getting-started', 'demo'],
      aiTip: "Based on your preferences, I've categorized this as a work task. Pro users get unlimited AI suggestions like this!"
    };

    setAiSuggestion(suggestion);
    setShowSuggestion(true);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <Badge className="mb-4 bg-indigo-100 text-indigo-800">Step 2 of 3</Badge>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Let's Create Your First AI-Powered Task
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Watch how our AI automatically categorizes and enhances your tasks
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2 text-indigo-600" />
            Create Your First Task
          </CardTitle>
          <CardDescription>
            Type any task and see the AI magic happen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="task-title">Task Description</Label>
              <Input
                id="task-title"
                placeholder="e.g., Finish the quarterly report by Friday"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="text-lg"
              />
            </div>
            
            <Button
              onClick={handleCreateTask}
              disabled={!taskTitle.trim()}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze with AI
            </Button>

            {showSuggestion && aiSuggestion && (
              <div className="mt-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border-2 border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center mb-4">
                  <Brain className="h-5 w-5 text-indigo-600 mr-2" />
                  <span className="font-semibold text-indigo-900 dark:text-indigo-100">AI Analysis Complete!</span>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">Category: {aiSuggestion.category}</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">Priority: {aiSuggestion.priority}</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Est. {aiSuggestion.estimatedTime}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Tags: {aiSuggestion.tags.join(', ')}</span>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-indigo-200 dark:border-indigo-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    💡 <strong>AI Tip:</strong> {aiSuggestion.aiTip}
                  </p>
                </div>

                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Pro Feature Preview:</strong> In Pro, you'll get unlimited AI suggestions, smart scheduling, and advanced insights!
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline" size="lg">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!showSuggestion}
          size="lg"
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          Set My Goals
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

// Step 3: Early Habit Loop - 3-day streak goal
function GoalSettingStep({ onComplete, onBack, preferences }: any) {
  const [streakGoal, setStreakGoal] = useState(3);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);

  const habitSuggestions = [
    { id: 'daily-review', label: 'Daily task review', description: '5 minutes to plan tomorrow' },
    { id: 'morning-planning', label: 'Morning planning', description: 'Set 3 priorities each morning' },
    { id: 'focus-session', label: 'Deep work session', description: '25 minutes of focused work' },
    { id: 'progress-check', label: 'Progress check', description: 'Review completed tasks' }
  ];

  const handleHabitToggle = (habitId: string) => {
    const updated = selectedHabits.includes(habitId)
      ? selectedHabits.filter(h => h !== habitId)
      : [...selectedHabits, habitId];
    setSelectedHabits(updated);
  };

  const handleComplete = () => {
    // Save user preferences and start their journey
    onComplete({
      ...preferences,
      streakGoal,
      selectedHabits,
      onboardingCompleted: true,
      startDate: new Date().toISOString()
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <Badge className="mb-4 bg-indigo-100 text-indigo-800">Step 3 of 3</Badge>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Let's Build Your Success Streak
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Start with simple habits that create lasting productivity gains
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-indigo-600" />
            Set Your Initial Streak Goal
          </CardTitle>
          <CardDescription>
            We'll help you build momentum with a achievable goal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <Label htmlFor="streak-goal" className="text-lg">I want to maintain a</Label>
            <Input
              id="streak-goal"
              type="number"
              min="1"
              max="30"
              value={streakGoal}
              onChange={(e) => setStreakGoal(parseInt(e.target.value))}
              className="w-20 text-center text-lg font-bold"
            />
            <Label className="text-lg">day streak</Label>
          </div>
          
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Recommended:</strong> Starting with 3-7 days gives you the best chance of success and builds lasting habits!
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2 text-indigo-600" />
            Choose Starter Habits
          </CardTitle>
          <CardDescription>
            Select habits that align with your productivity goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {habitSuggestions.map((habit) => (
              <div
                key={habit.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedHabits.includes(habit.id)
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                }`}
                onClick={() => handleHabitToggle(habit.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{habit.label}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{habit.description}</div>
                  </div>
                  {selectedHabits.includes(habit.id) && (
                    <CheckCircle className="h-5 w-5 text-indigo-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Pro Tip:</strong> You can always add more habits later. Start small and build momentum!
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline" size="lg">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back
        </Button>
        <Button
          onClick={handleComplete}
          size="lg"
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        >
          Start My Journey
          <Sparkles className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [preferences, setPreferences] = useState<any>({});

  const handleComplete = (finalPreferences: any) => {
    // Store preferences in localStorage for now (would be saved to DB in real app)
    localStorage.setItem('userPreferences', JSON.stringify(finalPreferences));
    
    // Redirect to main dashboard
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Smart To-Do AI
            </span>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="container mx-auto px-4 mb-8">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step <= currentStep
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}
                >
                  {step < currentStep ? <CheckCircle className="h-5 w-5" /> : step}
                </div>
                {step < 3 && (
                  <div
                    className={`h-1 w-16 mx-2 ${
                      step < currentStep ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {currentStep === 1 && (
          <PreferencesStep
            onNext={() => setCurrentStep(2)}
            preferences={preferences}
            setPreferences={setPreferences}
          />
        )}
        {currentStep === 2 && (
          <TutorialStep
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
            preferences={preferences}
          />
        )}
        {currentStep === 3 && (
          <GoalSettingStep
            onComplete={handleComplete}
            onBack={() => setCurrentStep(2)}
            preferences={preferences}
          />
        )}
      </div>
    </div>
  );
}