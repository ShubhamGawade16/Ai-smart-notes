import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { analyticsApi } from "@/lib/api";

export function ProgressStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/analytics/stats'],
    queryFn: analyticsApi.getStats,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg card-shadow p-6">
        <Skeleton className="h-4 w-24 mb-4" />
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-12" />
          </div>
          <Skeleton className="h-2 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = stats?.total ? (stats.completed / stats.total) * 100 : 0;

  return (
    <div className="bg-card rounded-lg card-shadow p-6">
      <h3 className="font-semibold text-sm mb-4">Today's Progress</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Tasks Completed</span>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-semibold">{stats?.completed || 0}</span>
            <span className="text-sm text-muted-foreground">
              / {stats?.total || 0}
            </span>
          </div>
        </div>
        
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-accent">
              {Math.round((stats?.completed || 0) * 0.5 * 10) / 10}h
            </div>
            <div className="text-xs text-muted-foreground">Focus Time</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-warning">
              {(stats?.total || 0) * 2}
            </div>
            <div className="text-xs text-muted-foreground">AI Suggestions</div>
          </div>
        </div>
      </div>
    </div>
  );
}
