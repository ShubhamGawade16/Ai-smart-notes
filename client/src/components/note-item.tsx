import { Badge } from "@/components/ui/badge";
import type { Note } from "@shared/schema";
import { cn } from "@/lib/utils";

interface NoteItemProps {
  note: Note;
  onClick?: () => void;
}

export function NoteItem({ note, onClick }: NoteItemProps) {
  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-muted text-muted-foreground';
    
    const colors = {
      'Work': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      'Personal': 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300',
      'Ideas': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      'Meeting Notes': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    };
    
    return colors[category as keyof typeof colors] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getPreview = () => {
    if (note.aiSummary) {
      return note.aiSummary;
    }
    return note.content.length > 100 
      ? note.content.substring(0, 100) + '...'
      : note.content;
  };

  return (
    <div 
      className="border border-border rounded-lg p-4 hover:border-primary/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm mb-1">{note.title}</h3>
          <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
            {getPreview()}
          </p>
          <div className="flex items-center space-x-2">
            {note.category && (
              <Badge variant="secondary" className={cn("text-xs", getCategoryColor(note.category))}>
                {note.category}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDate(new Date(note.updatedAt!))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
