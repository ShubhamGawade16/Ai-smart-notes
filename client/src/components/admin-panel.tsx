import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  Users, 
  Activity, 
  Settings, 
  Database,
  Zap,
  Crown,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AdminPanelProps {
  onClose: () => void;
}

interface SystemDiagnostics {
  system: {
    nodeEnv: string;
    timestamp: string;
    uptime: number;
  };
  users: {
    total: number;
    byTier: Record<string, number>;
  };
  tasks: {
    total: number;
    byStatus: Record<string, number>;
  };
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [diagnostics, setDiagnostics] = useState<SystemDiagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [targetUserId, setTargetUserId] = useState('');
  const [newTier, setNewTier] = useState<'free' | 'basic' | 'pro'>('basic');
  const { toast } = useToast();

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const loadDiagnostics = async () => {
    try {
      const response = await apiRequest('GET', '/api/admin/diagnostics');
      if (response.ok) {
        const data = await response.json();
        setDiagnostics(data);
      }
    } catch (error) {
      console.error('Failed to load diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeUserTier = async () => {
    if (!targetUserId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid user ID",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiRequest('POST', '/api/admin/change-user-tier', {
        userId: targetUserId.trim(),
        tier: newTier,
        subscriptionStatus: newTier === 'free' ? null : 'active'
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `User tier changed to ${newTier} successfully`,
        });
        setTargetUserId('');
        await loadDiagnostics();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error: any) {
      toast({
        title: "Failed to change user tier",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetUserAI = async () => {
    if (!targetUserId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid user ID",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiRequest('POST', '/api/admin/reset-user-ai', {
        userId: targetUserId.trim()
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "User AI usage reset successfully",
        });
        setTargetUserId('');
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error: any) {
      toast({
        title: "Failed to reset AI usage",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl m-4">
          <CardContent className="p-8 text-center">
            <Activity className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading admin diagnostics...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-600 to-orange-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  Developer Admin Panel
                  <Badge variant="destructive" className="text-xs">
                    ADMIN ONLY
                  </Badge>
                </CardTitle>
                <CardDescription>
                  System diagnostics and user management tools
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* System Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">System Status</CardTitle>
                  <Activity className="w-4 h-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Environment:</span>
                    <Badge variant={diagnostics?.system.nodeEnv === 'production' ? 'destructive' : 'secondary'}>
                      {diagnostics?.system.nodeEnv?.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Uptime:</span>
                    <span className="font-mono">{formatUptime(diagnostics?.system.uptime || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Users</CardTitle>
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-bold">{diagnostics?.users.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Free:</span>
                    <span>{diagnostics?.users.byTier?.free || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Basic:</span>
                    <span>{diagnostics?.users.byTier?.basic || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pro:</span>
                    <span>{diagnostics?.users.byTier?.pro || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Tasks</CardTitle>
                  <Database className="w-4 h-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-bold">{diagnostics?.tasks.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending:</span>
                    <span>{diagnostics?.tasks.byStatus?.pending || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed:</span>
                    <span>{diagnostics?.tasks.byStatus?.completed || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user tiers and AI usage limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    placeholder="Enter user ID..."
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tier">New Tier</Label>
                  <Select value={newTier} onValueChange={(value: 'free' | 'basic' | 'pro') => setNewTier(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free Tier</SelectItem>
                      <SelectItem value="basic">Basic Tier</SelectItem>
                      <SelectItem value="pro">Pro Tier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={changeUserTier} className="flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  Change Tier
                </Button>
                <Button variant="outline" onClick={resetUserAI} className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Reset AI Usage
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Admin Information */}
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <AlertTriangle className="w-5 h-5" />
                Admin Access Information
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-700 dark:text-amber-300">
              <p>
                You have admin-level access to this system. This panel provides developer tools and system diagnostics 
                that are not available to regular users. All actions are logged and should be used responsibly.
              </p>
              <div className="mt-4 space-y-1">
                <p className="font-semibold">Admin Users:</p>
                <ul className="space-y-1 ml-4">
                  <li>• shubhamgawadegd@gmail.com</li>
                  <li>• shubhamchandangawade63@gmail.com</li>
                  <li>• contact.hypervox@gmail.com</li>
                  <li>• yanoloj740@elobits.com</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}