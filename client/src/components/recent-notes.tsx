import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { NoteItem } from "./note-item";
import { Skeleton } from "@/components/ui/skeleton";
import { noteApi } from "@/lib/api";
import { NotesModal } from "@/components/expanded-views/notes-modal";
import { Plus } from "lucide-react";

export function RecentNotes() {
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['/api/notes/recent'],
    queryFn: noteApi.getRecent,
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg card-shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Notes</h2>
          <Skeleton className="h-8 w-16" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg card-shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent Notes</h2>
        <div className="flex items-center gap-2">
          <NotesModal
            isCreating={true}
            trigger={
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Note
              </Button>
            }
          />
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            View All
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        {notes?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No notes yet!</p>
            <p className="text-sm mt-1">Create your first note to get started.</p>
          </div>
        ) : (
          notes?.map((note) => (
            <NoteItem 
              key={note.id} 
              note={note}
              onClick={() => {
                // TODO: Open note editor/viewer
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
