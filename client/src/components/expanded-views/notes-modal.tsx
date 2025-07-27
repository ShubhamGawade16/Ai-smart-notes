import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Save, Sparkles } from 'lucide-react';

interface NotesModalProps {
  isCreating?: boolean;
  trigger: React.ReactNode;
  note?: {
    id: string;
    title: string;
    content: string;
    category?: string;
    tags?: string[];
  };
}

export function NotesModal({ isCreating = false, trigger, note }: NotesModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [category, setCategory] = useState(note?.category || '');
  const [tags, setTags] = useState(note?.tags?.join(', ') || '');
  const { toast } = useToast();

  // Create/update note mutation
  const saveNoteMutation = useMutation({
    mutationFn: async () => {
      const noteData = {
        title,
        content,
        category: category || undefined,
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      };

      if (isCreating) {
        return apiRequest('/api/notes', {
          method: 'POST',
          body: JSON.stringify(noteData),
        });
      } else {
        return apiRequest(`/api/notes/${note?.id}`, {
          method: 'PATCH',
          body: JSON.stringify(noteData),
        });
      }
    },
    onSuccess: () => {
      toast({
        title: isCreating ? "Note Created" : "Note Updated",
        description: "Your note has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notes/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      setOpen(false);
      
      // Reset form if creating
      if (isCreating) {
        setTitle('');
        setContent('');
        setCategory('');
        setTags('');
      }
    },
  });

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and content for your note.",
        variant: "destructive",
      });
      return;
    }
    saveNoteMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCreating ? 'Create New Note' : 'Edit Note'}
            <Badge variant="secondary" className="ml-2">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Enhanced
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title..."
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note content here..."
              rows={8}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Work">Work</SelectItem>
                <SelectItem value="Personal">Personal</SelectItem>
                <SelectItem value="Ideas">Ideas</SelectItem>
                <SelectItem value="Meeting Notes">Meeting Notes</SelectItem>
                <SelectItem value="Learning">Learning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Enter tags separated by commas..."
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple tags with commas (e.g., "important, project, deadline")
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saveNoteMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveNoteMutation.isPending ? 'Saving...' : (isCreating ? 'Create Note' : 'Update Note')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}