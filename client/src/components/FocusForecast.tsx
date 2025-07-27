import React, { useState } from 'react';
import { Brain, Clock, AlertTriangle, TrendingUp, Battery, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { useUpgrade } from '@/hooks/useUpgrade';
import { apiRequest } from '@/lib/queryClient';

interface FocusWindow {
  start: string;
  end: string;
  confidence: number;
  reason?: string;
}

interface SuggestedBreak {
  time: string;
  duration: number;
  reason: string;
}

interface BurnoutRisk {
  level: 'low' | 'medium' | 'high';
  factors: string[];
  recommendations: string[];
}

interface FocusForecastData {
  peakFocusWindows: FocusWindow[];
  suggestedBreaks: SuggestedBreak[];
  burnoutRisk: BurnoutRisk;
}

export const FocusForecast: React.FC = () => {
  const [selectedDays, setSelectedDays] = useState(3);
  const { canUseFeature, showUpgradeModal, limits } = useUpgrade();

  const { data: forecastData, isLoading, error } = useQuery({
    queryKey: ['/api/ai/focus-forecast', selectedDays],
    enabled: canUseFeature('focus_forecast'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const forecast: FocusForecastData | null = forecastData?.forecast || null;

  if (!canUseFeature('focus_forecast')) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Focus Forecast
            <Badge variant="outline">Advanced Pro</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">Unlock Your Peak Performance</h3>
            <p className="text-gray-600 mb-4">
              Get AI-powered predictions of your optimal focus windows, break timing, and burnout prevention insights.
            </p>
            <Button 
              onClick={() => showUpgradeModal('focus_forecast', 'Focus Forecast requires Advanced Pro subscription for predictive insights.')}
            >
              Upgrade to Advanced Pro
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Focus Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !forecast) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Focus Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">
            Unable to generate focus forecast. Try again later.
          </div>
        </CardContent>
      </Card>
    );
  }

  const getBurnoutColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return timeStr;
    }
  };

  const maxDays = limits?.tier === 'premium_pro' ? 7 : 3;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          Focus Forecast
          <Badge variant="outline">
            {limits?.tier === 'premium_pro' ? '7-Day' : '3-Day'} Prediction
          </Badge>
        </CardTitle>
        
        {/* Day Selection */}
        <div className="flex gap-2 mt-2">
          {[1, 3, maxDays].filter((d, i, arr) => arr.indexOf(d) === i).map(days => (
            <Button
              key={days}
              variant={selectedDays === days ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDays(days)}
            >
              {days} Day{days > 1 ? 's' : ''}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Peak Focus Windows */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            Peak Focus Windows
          </h3>
          
          {forecast.peakFocusWindows.length > 0 ? (
            <div className="space-y-2">
              {forecast.peakFocusWindows.map((window, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium">
                      {formatTime(window.start)} - {formatTime(window.end)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Progress value={window.confidence * 100} className="w-16 h-2" />
                    <span className="text-xs text-gray-600">
                      {Math.round(window.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
              No optimal focus windows identified. Build more focus session history for better predictions.
            </div>
          )}
        </div>

        {/* Suggested Breaks */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Battery className="w-4 h-4 text-blue-500" />
            Suggested Breaks
          </h3>
          
          {forecast.suggestedBreaks.length > 0 ? (
            <div className="space-y-2">
              {forecast.suggestedBreaks.map((breakItem, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{formatTime(breakItem.time)}</div>
                    <div className="text-sm text-gray-600">{breakItem.reason}</div>
                  </div>
                  <Badge variant="outline">{breakItem.duration}min</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
              No specific break recommendations at this time.
            </div>
          )}
        </div>

        {/* Burnout Risk Assessment */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Burnout Risk Assessment
          </h3>
          
          <div className={`p-4 rounded-lg ${getBurnoutColor(forecast.burnoutRisk.level)}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold capitalize">
                {forecast.burnoutRisk.level} Risk
              </span>
              <div className="flex items-center gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < (forecast.burnoutRisk.level === 'high' ? 3 : forecast.burnoutRisk.level === 'medium' ? 2 : 1)
                        ? 'bg-current' 
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            {forecast.burnoutRisk.factors.length > 0 && (
              <div className="mb-3">
                <div className="text-sm font-medium mb-1">Risk Factors:</div>
                <ul className="text-sm space-y-1">
                  {forecast.burnoutRisk.factors.map((factor, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-current">•</span>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {forecast.burnoutRisk.recommendations.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-1">Recommendations:</div>
                <ul className="text-sm space-y-1">
                  {forecast.burnoutRisk.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-current">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Upgrade Prompt for 7-day forecast */}
        {limits?.tier !== 'premium_pro' && (
          <div className="p-4 border border-purple-200 rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-purple-800 dark:text-purple-200">
                Unlock 7-Day Focus Forecast
              </span>
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
              Get extended predictions, heat-map visualizations, and advanced pattern recognition with Premium Pro.
            </p>
            <Button 
              size="sm" 
              onClick={() => showUpgradeModal('focus_forecast_7day', 'Extended focus forecasting requires Premium Pro subscription.')}
            >
              Upgrade to Premium Pro
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};