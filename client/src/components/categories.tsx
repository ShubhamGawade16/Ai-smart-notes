import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { analyticsApi } from "@/lib/api";

const categoryColors = [
  'bg-blue-500',
  'bg-pink-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-yellow-500',
  'bg-indigo-500',
  'bg-red-500',
  'bg-cyan-500',
];

export function Categories() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: analyticsApi.getCategories,
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg card-shadow p-6">
        <Skeleton className="h-4 w-16 mb-4" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <div className="flex items-center space-x-2">
                <Skeleton className="w-3 h-3 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-6" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg card-shadow p-6">
      <h3 className="font-semibold text-sm mb-4">Categories</h3>
      
      <div className="space-y-2">
        {categories?.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No categories yet
          </div>
        ) : (
          categories?.map((category, index) => (
            <div key={category.name} className="flex items-center justify-between py-1">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${categoryColors[index % categoryColors.length]}`} />
                <span className="text-sm">{category.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{category.count}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
