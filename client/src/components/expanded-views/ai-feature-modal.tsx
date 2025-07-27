import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Maximize2 } from "lucide-react";

interface AIFeatureModalProps {
  title: string;
  tier: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  trigger?: React.ReactNode;
}

export function AIFeatureModal({ 
  title, 
  tier, 
  description, 
  icon, 
  children, 
  trigger 
}: AIFeatureModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className="ml-auto"
    >
      <Maximize2 className="h-4 w-4" />
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              {icon}
              <DialogTitle className="text-xl">{title}</DialogTitle>
              <Badge variant="secondary">{tier}</Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">{description}</p>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}