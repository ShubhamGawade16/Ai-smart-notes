import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, AlertTriangle, Coffee, Zap, TrendingUp, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AIFeatureModal } from '@/components/expanded-views/ai-feature-modal';

interface FocusForecast {
  peakFocusWindows: Array<{start: string, end: string, confidence: number}>;
  suggestedBreaks: Array<{time: string, duration: number, reason: string}>;
  burnoutRisk: {level: 'low' | 'medium' | 'high', factors: string[], recommendations: string[]};
}

export default function FocusForecast() {
  const { data: forecast, isLoading } = useQuery<FocusForecast>({
    queryKey: ['/api/ai/focus-forecast'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            Focus Forecast
            <Badge variant="secondary">Advanced Pro</Badge>
          </CardTitle>
          <CardDescription>Loading your personalized focus insights...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!forecast) {
    return (
      <Card className="w-full border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-gray-400" />
            Focus Forecast
            <Badge variant="outline">Upgrade Required</Badge>
          </CardTitle>
          <CardDescription>
            Unlock AI-powered focus predictions with Advanced Pro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Get daily 30-second insights showing your peak focus windows, optimal break times, and burnout risk assessment.
            </p>
            <Button variant="outline">Upgrade to Advanced Pro</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default: return 'text-green-500 bg-green-50 dark:bg-green-900/20';
    }
  };

  const isInFocusWindow = (start: string, end: string) => {
    const now = currentTime.getHours() * 60 + currentTime.getMinutes();
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const windowStart = startHour * 60 + startMin;
    const windowEnd = endHour * 60 + endMin;
    return now >= windowStart && now <= windowEnd;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            <CardTitle>Focus Forecast</CardTitle>
            <Badge variant="secondary">Advanced Pro</Badge>
          </div>
          <AIFeatureModal
            title="Focus Forecast"
            tier="Advanced Pro"
            description="AI-powered predictions for your peak productivity today with detailed insights and recommendations."
            icon={<Zap className="h-5 w-5 text-blue-500" />}
            trigger={
              <Button variant="ghost" size="sm">
                <Maximize2 className="h-4 w-4" />
              </Button>
            }
          >
            <div className="space-y-6">
              {forecast && (
                <>
                  {/* Detailed Peak Focus Windows */}
                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-4">
                      <Clock className="h-4 w-4" />
                      Today's Peak Focus Windows
                    </h4>
                    <div className="space-y-3">
                      {forecast.peakFocusWindows.map((window, index) => (
                        <div key={index} className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">
                              {window.start} - {window.end}
                            </span>
                            <Badge variant={isInFocusWindow(window.start, window.end) ? 'default' : 'secondary'}>
                              {window.confidence}% confidence
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Optimal for deep work, complex problem-solving, and creative tasks.
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Break Recommendations */}
                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-4">
                      <Coffee className="h-4 w-4" />
                      Recommended Breaks
                    </h4>
                    <div className="space-y-3">
                      {forecast.suggestedBreaks.map((breakItem, index) => (
                        <div key={index} className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{breakItem.time}</span>
                            <Badge variant="outline">{breakItem.duration} minutes</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{breakItem.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Burnout Assessment */}
                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      Burnout Risk Assessment
                    </h4>
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={getRiskColor(forecast.burnoutRisk.level)}>
                          {forecast.burnoutRisk.level.toUpperCase()} RISK
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-2">Risk Factors:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {forecast.burnoutRisk.factors.map((factor, index) => (
                              <li key={index}>• {factor}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium mb-2">Recommendations:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {forecast.burnoutRisk.recommendations.map((rec, index) => (
                              <li key={index}>• {rec}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </AIFeatureModal>
        </div>
        <CardDescription>
          AI-powered predictions for your peak productivity today
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Peak Focus Windows */}
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4" />
            Peak Focus Windows
          </h4>
          <div className="space-y-2">
            {forecast.peakFocusWindows.map((window, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${
                  isInFocusWindow(window.start, window.end) 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                    : 'bg-gray-50 dark:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {window.start} - {window.end}
                    {isInFocusWindow(window.start, window.end) && (
                      <Badge variant="default" className="ml-2">Active Now</Badge>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <Progress value={window.confidence * 100} className="w-16" />
                    <span className="text-sm text-gray-500">
                      {Math.round(window.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested Breaks */}
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            <Coffee className="h-4 w-4" />
            Suggested Breaks
          </h4>
          <div className="space-y-2">
            {forecast.suggestedBreaks.map((breakItem, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded border">
                <div>
                  <span className="font-medium">{breakItem.time}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({breakItem.duration} min)
                  </span>
                </div>
                <span className="text-xs text-gray-500 max-w-48 text-right">
                  {breakItem.reason}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Burnout Risk */}
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4" />
            Burnout Risk Assessment
          </h4>
          <div className={`p-4 rounded-lg ${getRiskColor(forecast.burnoutRisk.level)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium capitalize">
                {forecast.burnoutRisk.level} Risk
              </span>
              <Badge variant="outline">
                {forecast.burnoutRisk.level.toUpperCase()}
              </Badge>
            </div>
            
            {forecast.burnoutRisk.factors.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Risk Factors:</p>
                <ul className="text-sm space-y-1">
                  {forecast.burnoutRisk.factors.map((factor, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-current"></div>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {forecast.burnoutRisk.recommendations.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">Recommendations:</p>
                <ul className="text-sm space-y-1">
                  {forecast.burnoutRisk.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-current"></div>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          Last updated: {currentTime.toLocaleTimeString()} • Refreshes every 30 seconds
        </div>
      </CardContent>
    </Card>
  );
}