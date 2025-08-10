import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Shield, Users, Settings, Zap } from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tier: 'free' | 'basic' | 'pro';
  subscriptionStatus: string | null;
  dailyAiCalls: number;
  monthlyAiCalls: number;
  createdAt: string;
}

export default function AdminPanel() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [selectedTier, setSelectedTier] = useState<'free' | 'basic' | 'pro'>('free');
  const { toast } = useToast();

  // Check admin status
  const { data: adminCheck } = useQuery({
    queryKey: ['/api/admin/check'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/check');
      return await response.json();
    },
  });

  // Get all users (admin only)
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/users');
      return await response.json();
    },
    enabled: adminCheck?.isAdmin,
  });

  // Change user tier mutation
  const changeTierMutation = useMutation({
    mutationFn: async ({ userEmail, tier }: { userEmail: string; tier: string }) => {
      const response = await apiRequest('POST', '/api/admin/change-user-tier', {
        userEmail,
        tier
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User tier changed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setSelectedUserEmail("");
      setSelectedTier('free');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change user tier",
        variant: "destructive",
      });
    },
  });

  // Reset user AI usage mutation
  const resetAiUsageMutation = useMutation({
    mutationFn: async (userEmail: string) => {
      const response = await apiRequest('POST', '/api/admin/reset-user-ai-usage', {
        userEmail
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User AI usage reset successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset AI usage",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (adminCheck) {
      setIsAdmin(adminCheck.isAdmin);
    }
  }, [adminCheck]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Card className="text-center">
            <CardContent className="p-8">
              <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
              <p className="text-gray-600 dark:text-gray-400">
                You don't have admin permissions to access this panel.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const users: User[] = usersData?.users || [];

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'pro':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'basic':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Header />
      
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold">Admin Panel</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage users, subscriptions, and system settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Management */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading users...</div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-medium">
                              {user.firstName} {user.lastName}
                            </span>
                            <Badge className={getTierBadgeColor(user.tier)}>
                              {user.tier.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {user.email}
                          </p>
                          <div className="flex gap-4 text-xs text-gray-500">
                            <span>Daily AI: {user.dailyAiCalls}</span>
                            <span>Monthly AI: {user.monthlyAiCalls}</span>
                            <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resetAiUsageMutation.mutate(user.email)}
                            disabled={resetAiUsageMutation.isPending}
                          >
                            <Zap className="w-4 h-4 mr-1" />
                            Reset AI
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Admin Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Admin Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    User Email
                  </label>
                  <Input
                    placeholder="user@example.com"
                    value={selectedUserEmail}
                    onChange={(e) => setSelectedUserEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    New Tier
                  </label>
                  <Select value={selectedTier} onValueChange={(value: 'free' | 'basic' | 'pro') => setSelectedTier(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full"
                  onClick={() => changeTierMutation.mutate({ 
                    userEmail: selectedUserEmail, 
                    tier: selectedTier 
                  })}
                  disabled={!selectedUserEmail || changeTierMutation.isPending}
                >
                  Change User Tier
                </Button>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Admin Info</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Logged in as: {adminCheck?.email}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Total Users: {users.length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}