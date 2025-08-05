import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Tag } from "lucide-react";

const DEFAULT_TAGS = [
  "work", "personal", "urgent", "important", "meeting", "deadline",
  "project", "home", "health", "learning", "shopping", "finance",
  "family", "social", "travel", "hobby", "exercise", "reading"
];

interface CustomTagsProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  customTags?: string[];
  onCustomTagsChange?: (tags: string[]) => void;
}

export function CustomTags({ 
  selectedTags, 
  onTagsChange, 
  customTags = [], 
  onCustomTagsChange 
}: CustomTagsProps) {
  const [newTag, setNewTag] = useState("");
  const [showAddTag, setShowAddTag] = useState(false);

  const allTags = [...DEFAULT_TAGS, ...customTags];

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    if (newTag.trim() && !allTags.includes(newTag.trim().toLowerCase())) {
      const newCustomTag = newTag.trim().toLowerCase();
      onCustomTagsChange?.([...customTags, newCustomTag]);
      onTagsChange([...selectedTags, newCustomTag]);
      setNewTag("");
      setShowAddTag(false);
    }
  };

  const handleRemoveCustomTag = (tag: string) => {
    onCustomTagsChange?.(customTags.filter(t => t !== tag));
    onTagsChange(selectedTags.filter(t => t !== tag));
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Tags
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Default Tags */}
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">
            Popular Tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_TAGS.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className={`cursor-pointer text-xs px-2 py-1 transition-all ${
                  selectedTags.includes(tag)
                    ? "bg-teal-600 hover:bg-teal-700 text-white"
                    : "hover:bg-teal-50 dark:hover:bg-teal-950"
                }`}
                onClick={() => handleTagToggle(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Custom Tags */}
        {customTags.length > 0 && (
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">
              Your Custom Tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {customTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className={`cursor-pointer text-xs px-2 py-1 transition-all group ${
                    selectedTags.includes(tag)
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "hover:bg-blue-50 dark:hover:bg-blue-950"
                  }`}
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                  <X
                    className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCustomTag(tag);
                    }}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Add Custom Tag */}
        <div>
          {!showAddTag ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddTag(true)}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Custom Tag
            </Button>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Enter tag name"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTag()}
                className="h-8 text-xs"
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleAddCustomTag}
                disabled={!newTag.trim()}
                className="h-8 px-3"
              >
                Add
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddTag(false);
                  setNewTag("");
                }}
                className="h-8 px-3"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Selected Tags Summary */}
        {selectedTags.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Selected ({selectedTags.length}):
            </p>
            <div className="flex flex-wrap gap-1">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs px-2 py-0.5"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}