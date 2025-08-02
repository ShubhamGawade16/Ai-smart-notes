import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Target, Calendar, Brain, CheckCircle, ArrowRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const goals = [
  {
    id: "productivity",
    title: "Boost My Productivity",
    description: "I want to get more done in less time",
    icon: Target,
  },
  {
    id: "organization",
    title: "Get Organized",
    description: "I need help managing my tasks and priorities",
    icon: Calendar,
  },
  {
    id: "habits",
    title: "Build Better Habits",
    description: "I want to develop consistent productive routines",
    icon: Brain,
  },
  {
    id: "all",
    title: "All of the Above",
    description: "I want comprehensive productivity improvement",
    icon: CheckCircle,
  },
];

export default function OnboardingPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState("");
  const [customGoals, setCustomGoals] = useState("");

  const saveOnboardingMutation = useMutation({
    mutationFn: async (data: { primaryGoal: string; customGoals: string }) => {
      return apiRequest("/api/user/onboarding", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Welcome to Planify!",
        description: "Your personalized workspace is ready.",
      });
      navigate("/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (step === 1 && selectedGoal) {
      setStep(2);
    }
  };

  const handleComplete = () => {
    if (selectedGoal && customGoals.trim()) {
      saveOnboardingMutation.mutate({
        primaryGoal: selectedGoal,
        customGoals: customGoals.trim(),
      });
    }
  };

  const isStepValid = step === 1 ? selectedGoal : customGoals.trim();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden">
              <img src="@assets/Planify_imresizer(1)_1753901727720.jpg" alt="Planify" className="w-full h-full object-cover" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome to Planify, {user?.firstName || "there"}!</CardTitle>
          <CardDescription>
            Let's personalize your experience to help you achieve your goals
          </CardDescription>
          <Progress value={step * 50} className="mt-4" />
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">What's your primary goal with Planify?</h3>
                <RadioGroup value={selectedGoal} onValueChange={setSelectedGoal}>
                  <div className="grid gap-4">
                    {goals.map((goal) => (
                      <Label
                        key={goal.id}
                        htmlFor={goal.id}
                        className="flex items-start gap-4 p-4 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <RadioGroupItem value={goal.id} id={goal.id} className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <goal.icon className="w-5 h-5 text-teal-600" />
                            <span className="font-medium">{goal.title}</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {goal.description}
                          </p>
                        </div>
                      </Label>
                    ))}
                  </div>
                </RadioGroup>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!selectedGoal}
                className="w-full"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Tell us more about your specific goals
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  This helps our AI personalize your experience and provide better recommendations
                </p>
                <Textarea
                  placeholder="Example: I want to manage my freelance projects better, balance work and personal life, and complete my tasks on time without feeling overwhelmed..."
                  value={customGoals}
                  onChange={(e) => setCustomGoals(e.target.value)}
                  className="min-h-[150px]"
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleComplete} 
                  disabled={!customGoals.trim() || saveOnboardingMutation.isPending}
                  className="flex-1"
                >
                  {saveOnboardingMutation.isPending ? "Setting up..." : "Complete Setup"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}