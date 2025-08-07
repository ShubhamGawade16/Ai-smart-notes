import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, Send, Copy, Clipboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useSubscription } from '@/hooks/use-subscription';

export default function CustomAiPrompt() {
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [responseFormat, setResponseFormat] = useState('text');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { subscriptionStatus } = useSubscription();

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }

    if (!subscriptionStatus.canUseAi) {
      toast({
        title: "AI Limit Reached",
        description: "You've reached your AI usage limit. Upgrade to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Parse context as JSON if provided
      let contextObj = {};
      if (context.trim()) {
        try {
          contextObj = JSON.parse(context);
        } catch (e) {
          // If not valid JSON, treat as simple text context
          contextObj = { context: context };
        }
      }

      const response = await apiRequest('POST', '/api/ai/custom-prompt', {
        prompt,
        context: contextObj,
        responseFormat
      });
      
      const data = await response.json();
      
      if (data.response) {
        setResponse(data.response);
        toast({
          title: "Success",
          description: "AI response generated successfully",
        });
      } else {
        // Handle JSON response format
        setResponse(JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error('Custom prompt error:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Text copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const examplePrompts = [
    {
      title: "Task Priority Analyzer",
      prompt: "Analyze these tasks and suggest which ones should be prioritized based on urgency and importance:",
      context: '{"tasks": ["Complete project proposal", "Buy groceries", "Call dentist", "Review code"]}',
      format: "json"
    },
    {
      title: "Daily Schedule Optimizer",
      prompt: "Create an optimized daily schedule for maximum productivity:",
      context: '{"workHours": "9-5", "breakPreferences": "30min lunch", "energy": "high morning, low afternoon"}',
      format: "text"
    },
    {
      title: "Goal Setting Assistant",
      prompt: "Help me break down this large goal into smaller, actionable steps:",
      context: '{"goal": "Learn a new programming language", "timeframe": "3 months", "experience": "beginner"}',
      format: "json"
    }
  ];

  const loadExample = (example: typeof examplePrompts[0]) => {
    setPrompt(example.prompt);
    setContext(example.context);
    setResponseFormat(example.format);
  };

  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
      <CardHeader className="pb-4 pt-6 px-6">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-600" />
          Custom AI Prompt
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Send custom prompts to GPT-4o with optional context and formatting
        </p>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-4">
        {/* Example Prompts */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Quick Examples:
          </label>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((example, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => loadExample(example)}
                className="text-xs"
              >
                {example.title}
              </Button>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Your Prompt:
          </label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your custom prompt here..."
            className="min-h-[100px] resize-none"
          />
        </div>

        {/* Context Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Context (optional):
          </label>
          <Textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder='Additional context as JSON: {"key": "value"} or plain text'
            className="min-h-[80px] resize-none"
          />
        </div>

        {/* Response Format */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Response Format:
          </label>
          <Select value={responseFormat} onValueChange={setResponseFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Plain Text</SelectItem>
              <SelectItem value="json">JSON Format</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !subscriptionStatus.canUseAi}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Zap className="w-4 h-4 mr-2 animate-pulse" />
              Generating...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send to AI
            </>
          )}
        </Button>

        {/* Usage Info */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Usage: {subscriptionStatus.dailyAiUsage}/{subscriptionStatus.dailyAiLimit === -1 ? '∞' : subscriptionStatus.dailyAiLimit} daily
          {subscriptionStatus.isBasic && ` | ${subscriptionStatus.monthlyAiUsage || 0}/30 monthly`}
        </div>

        {/* Response */}
        {response && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                AI Response:
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(response)}
                className="h-8 w-8 p-0"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-[300px] overflow-y-auto">
              <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                {response}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}