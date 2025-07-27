import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Trash2, FileText, Tag } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Note {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface NotesModalProps {
  note?: Note;
  trigger: React.ReactNode;
  onClose?: () => void;
  isCreating?: boolean;
}

export function NotesModal({ note, trigger, onClose, isCreating = false }: NotesModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editedNote, setEditedNote] = useState(note || {
    title: '',
    content: '',
    category: '',
    tags: []
  } as Partial<Note>);
  const [isEditing, setIsEditing] = useState(isCreating);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock API functions - replace with actual API calls
  const createNote = async (noteData: Partial<Note>) => {
    // Simulate API call
    return { ...noteData, id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  };

  const updateNote = async (id: string, noteData: Partial<Note>) => {
    // Simulate API call
    return { ...noteData, id, updatedAt: new Date().toISOString() };
  };

  const deleteNote = async (id: string) => {
    // Simulate API call
    return { success: true };
  };

  const saveNoteMutation = useMutation({
    mutationFn: (data: Partial<Note>) => 
      isCreating ? createNote(data) : updateNote(note!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notes/recent'] });
      setIsEditing(false);
      if (isCreating) {
        setIsOpen(false);
      }
      toast({
        title: isCreating ? "Note created" : "Note updated",
        description: "Your changes have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to ${isCreating ? 'create' : 'update'} note. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: () => deleteNote(note!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notes/recent'] });
      setIsOpen(false);
      toast({
        title: "Note deleted",
        description: "The note has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!editedNote.title?.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your note.",
        variant: "destructive",
      });
      return;
    }

    saveNoteMutation.mutate(editedNote);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this note?")) {
      deleteNoteMutation.mutate();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsEditing(isCreating);
    if (!isCreating && note) {
      setEditedNote(note);
    }
    onClose?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <DialogTitle className="text-xl">
              {isCreating ? 'Create Note' : 'Note Details'}
            </DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isCreating) {
                      handleClose();
                    } else {
                      setIsEditing(false);
                      setEditedNote(note!);
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saveNoteMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isCreating ? 'Create' : 'Save'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
                {!isCreating && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleteNoteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-2 block">Title</label>
            {isEditing ? (
              <Input
                value={editedNote.title || ''}
                onChange={(e) => setEditedNote({ ...editedNote, title: e.target.value })}
                placeholder="Note title..."
              />
            ) : (
              <h2 className="text-lg font-medium">{note?.title}</h2>
            )}
          </div>

          {/* Content */}
          <div>
            <label className="text-sm font-medium mb-2 block">Content</label>
            {isEditing ? (
              <Textarea
                value={editedNote.content || ''}
                onChange={(e) => setEditedNote({ ...editedNote, content: e.target.value })}
                placeholder="Write your note content here..."
                rows={12}
                className="min-h-[300px]"
              />
            ) : (
              <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{note?.content || 'No content provided.'}</p>
              </div>
            )}
          </div>

          {/* Category and Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              {isEditing ? (
                <Input
                  value={editedNote.category || ''}
                  onChange={(e) => setEditedNote({ ...editedNote, category: e.target.value })}
                  placeholder="Category..."
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {note?.category || 'No category'}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tags</label>
              {note?.tags && note.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {note.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tags assigned</p>
              )}
            </div>
          </div>

          {/* Metadata */}
          {note && !isCreating && (
            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Created: {new Date(note.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(note.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}