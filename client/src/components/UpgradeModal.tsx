import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Zap, 
  Crown, 
  Check, 
  Sparkles, 
  Brain,
  Target,
  Infinity,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsage: number;
  dailyLimit: number;
}

export default function UpgradeModal({ isOpen, onClose, currentUsage, dailyLimit }: UpgradeModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleUpgrade = async () => {
    if (!user) return;
    
    setIsProcessing(true);
    try {
      // For now, simulate upgrade process
      // In a real implementation, this would integrate with payment processor
      const response = await apiRequest("POST", "/api/upgrade-subscription", {
        userId: user.id,
        plan: "premium"
      });
      
      if (response.ok) {
        toast({
          title: "Upgrade Successful!",
          description: "You now have unlimited AI features access.",
        });
        onClose();
        // Refresh the page to update user status
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Upgrade Failed",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSetup = () => {
    // For now, show instructions for manual payment
    toast({
      title: "Payment Setup",
      description: "Please contact support to set up your premium subscription.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-0 shadow-2xl">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
            Unlock Premium Features
          </DialogTitle>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            You've used {currentUsage} of {dailyLimit} daily AI requests
          </p>
        </DialogHeader>

        {/* Usage Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Daily AI Usage</span>
            <span>{currentUsage}/{dailyLimit}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-teal-500 to-teal-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((currentUsage / dailyLimit) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Premium Features */}
        <Card className="mb-6 border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50 to-white dark:from-teal-950 dark:to-gray-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-teal-600" />
              <h3 className="font-semibold text-teal-900 dark:text-teal-100">Premium Benefits</h3>
              <Badge variant="secondary" className="bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                ₹500/month
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-teal-600" />
                <span className="text-gray-700 dark:text-gray-300">Unlimited AI task analysis</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-teal-600" />
                <span className="text-gray-700 dark:text-gray-300">Advanced AI suggestions</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-teal-600" />
                <span className="text-gray-700 dark:text-gray-300">Priority support</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-teal-600" />
                <span className="text-gray-700 dark:text-gray-300">No daily limits</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Maybe Later
          </Button>
          <Button
            onClick={() => window.location.href = '/upgrade'}
            disabled={isProcessing}
            className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white border-0"
          >
            {isProcessing ? (
              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Crown className="w-4 h-4 mr-2" />
            )}
            Upgrade Now
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            🔒 Secure payment • Cancel anytime • 30-day money back
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}