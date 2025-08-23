'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Coins, TrendingUp, Activity, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { transactionService } from '@/lib/database';
import type { Transaction, User } from '@/lib/types';
import type { AuthUser } from '@/lib/services/authService';
import { CreditManagement } from '@/components/account/CreditManagement';
import { TransactionHistory } from '@/components/account/TransactionHistory';
import { UserSettings } from '@/components/account/UserSettings';
import { usePageTitle } from '@/lib/hooks/usePageTitle';

interface UserSettingsData {
  display_name?: string;
  email?: string;
  username?: string;
  avatar_url?: string;
}

export default function DashboardPage() {
  usePageTitle('User Account');
  const router = useRouter();
  const { user, isLoading, isAuthenticated, isDemoMode, login } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        if (!user) return;

        if (isDemoMode) {
          // Demo mode: load demo transactions (limited)
          try {
            const demoTransactions = await transactionService.getDemoTransactions(user.demo_ip || '');
            setTransactions(demoTransactions || []);
          } catch (demoErr) {
            console.warn('Demo transactions not available, using empty array:', demoErr);
            setTransactions([]);
          }
        } else {
          // Registered user: load real transactions
          const userTransactions = await transactionService.getUserTransactions(user.wallet_address);
          setTransactions(userTransactions || []);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      }
    };

    loadDashboardData();
  }, [user, isDemoMode]);

  const handleBuyCredits = async (amount: number, seiAmount: string) => {
    try {
      if (isDemoMode) {
        // Demo mode: simulate credit purchase
        // This would typically involve wallet transaction signing
        console.log('Real credit purchase:', { amount, seiAmount });
        // TODO: Implement actual SEI payment integration
      } else {
        // Real user: integrate with SEI wallet
        // This would typically involve wallet transaction signing
        console.log('Real credit purchase:', { amount, seiAmount });
        // TODO: Implement actual SEI payment integration
      }
    } catch (err) {
      console.error('Error buying credits:', err);
      setError('Failed to purchase credits. Please try again.');
    }
  };

  const handleViewTransaction = (id: string) => {
    // Navigate to transaction detail or show modal
    console.log('View transaction:', id);
  };

  const handleDownloadReceipt = (id: string) => {
    // Generate and download receipt
    console.log('Download receipt:', id);
  };

  const handleSaveSettings = async (settingsData: UserSettingsData) => {
    try {
      if (isDemoMode) {
        // Demo mode: update local state
        // This would typically involve wallet transaction signing
        console.log('Demo mode settings update:', settingsData);
      } else {
        // Real user: update in database
        // This would typically involve wallet transaction signing
        console.log('Real user settings update:', settingsData);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      if (isDemoMode) {
        // Demo mode: redirect to home
        router.push('/');
      } else {
        // Real user: delete from database
        // This would typically involve wallet transaction signing
        console.log('Real user account deletion');
        router.push('/');
      }
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account. Please try again.');
    }
  };

  const handleUserRefresh = async () => {
    try {
      // Force refresh user data by re-authenticating
      if (user && !user.is_demo_user) {
        await login(user.wallet_address);
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
    }
  };

  // Convert AuthUser to User type for components that expect it
  const convertToUserType = (authUser: AuthUser | null): User | null => {
    if (!authUser) return null;

    return {
      id: authUser.id,
      wallet_address: authUser.wallet_address,
      username: authUser.username || '',
      email: authUser.email || '',
      avatar_url: authUser.avatar_url || '',
      display_name: authUser.display_name || authUser.username || '',
      credits: authUser.credits || 0,
      sei_balance: '0', // AuthUser doesn't have sei_balance, use default
      research_count: authUser.research_count || 0,
      is_demo_user: authUser.is_demo_user,
      demo_ip: authUser.demo_ip || '',
      created_at: authUser.created_at,
      updated_at: authUser.updated_at
    };
  };

  // Show loading state with skeleton
  if (isLoading) {
    return (
      <div className="header-spacer">
        <div className="container mx-auto px-4 py-8">
          {/* Header Skeleton */}
          <div className="mb-8 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-9 bg-white/10 rounded w-32 mb-2"></div>
              </div>
              <div className="h-6 w-20 bg-white/10 rounded"></div>
            </div>
          </div>

          {/* Quick Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-ultra border-white/10 rounded-lg p-6">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-white/10 rounded"></div>
                  <div>
                    <div className="h-8 bg-white/10 rounded w-16 mb-1"></div>
                    <div className="h-4 bg-white/10 rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs Skeleton */}
          <div className="animate-pulse space-y-6">
            {/* Tab List Skeleton */}
            <div className="grid w-full grid-cols-4 bg-white/5 backdrop-blur-ultra border-white/10 rounded-lg p-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-white/10 rounded"></div>
              ))}
            </div>

            {/* Tab Content Skeleton */}
            <div className="space-y-6">
              {/* Overview Tab Content */}
              <div className="bg-white/5 backdrop-blur-ultra border-white/10 rounded-lg">
                {/* Card Header */}
                <div className="p-6 border-b border-white/10">
                  <div className="h-6 bg-white/10 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-white/10 rounded w-96"></div>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/10 rounded-full w-10 h-10"></div>
                          <div>
                            <div className="h-4 bg-white/10 rounded w-48 mb-1"></div>
                            <div className="h-3 bg-white/10 rounded w-24"></div>
                          </div>
                        </div>
                        <div className="h-6 bg-white/10 rounded w-16"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Additional Content Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 backdrop-blur-ultra border-white/10 rounded-lg p-6">
                  <div className="h-6 bg-white/10 rounded w-32 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-white/10 rounded w-full"></div>
                    <div className="h-4 bg-white/10 rounded w-3/4"></div>
                    <div className="h-4 bg-white/10 rounded w-1/2"></div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-ultra border-white/10 rounded-lg p-6">
                  <div className="h-6 bg-white/10 rounded w-28 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-white/10 rounded w-full"></div>
                    <div className="h-4 bg-white/10 rounded w-2/3"></div>
                    <div className="h-4 bg-white/10 rounded w-3/4"></div>
                  </div>
                </div>
              </div>

              {/* Form-like Content */}
              <div className="bg-white/5 backdrop-blur-ultra border-white/10 rounded-lg p-6">
                <div className="h-6 bg-white/10 rounded w-24 mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="h-4 bg-white/10 rounded w-20"></div>
                    <div className="h-10 bg-white/10 rounded w-full"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-white/10 rounded w-16"></div>
                    <div className="h-10 bg-white/10 rounded w-full"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-white/10 rounded w-24"></div>
                    <div className="h-10 bg-white/10 rounded w-full"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-white/10 rounded w-20"></div>
                    <div className="h-10 bg-white/10 rounded w-full"></div>
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <div className="h-10 bg-white/10 rounded w-24"></div>
                  <div className="h-10 bg-white/10 rounded w-32"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="header-spacer">
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive" className="bg-[#ef4444]/20 border-[#ef4444]/30 text-[#ef4444]">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="header-spacer">
        <div className="container mx-auto px-4 py-8">
          <Alert className="bg-[#3b82f6]/20 border-[#3b82f6]/30 text-[#3b82f6]">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please connect your wallet to access the account.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="header-spacer">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Account</h1>
              {/* <p className="text-gray-400">Welcome back, {user?.display_name || user?.username || 'User'}</p> */}
            </div>
            {isDemoMode && (
              <Badge variant="secondary" className="text-sm bg-[#ff8a00]/20 text-[#ff8a00] border-[#ff8a00]/30">
                Demo Mode
              </Badge>
            )}
          </div>
        </div>

        {/* Demo Mode Notice */}
        {isDemoMode && (
          <div className="mb-6 p-4 bg-[#3b82f6]/20 border border-[#3b82f6]/30 rounded-lg backdrop-blur-sm">
            <div className="flex items-center gap-2 text-[#3b82f6]">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Demo Mode</span>
            </div>
            <p className="text-[#3b82f6]/80 text-sm mt-1">
              You&apos;re currently in demo mode. This is an example view, connect your wallet for a real experience.
            </p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-[#ff8a00]" />
                <div>
                  <div className="text-2xl font-bold text-white">{(user?.credits || 0).toLocaleString()}</div>
                  <div className="text-sm text-gray-400">Available Credits</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#10b981]" />
                <div>
                  <div className="text-2xl font-bold text-white">${((user?.credits || 0) / 10).toFixed(2)}</div>
                  <div className="text-sm text-gray-400">Credits Value</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#3b82f6]" />
                <div>
                  <div className="text-2xl font-bold text-white">
                    {transactions.filter((t) => t.status === 'completed').length}
                  </div>
                  <div className="text-sm text-gray-400">Completed Transactions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-[#e9407a]" />
                <div>
                  <div className="text-2xl font-bold text-white">{user?.research_count || 0}</div>
                  <div className="text-sm text-gray-400">Research Projects</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/5 backdrop-blur-ultra border-white/10">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#e9407a] data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="credits" className="data-[state=active]:bg-[#e9407a] data-[state=active]:text-white">
              Credits
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-[#e9407a] data-[state=active]:text-white">
              Transactions
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-[#e9407a] data-[state=active]:text-white">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <CardDescription className="text-gray-400">Your latest research projects and transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.slice(0, 10).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-white/5 backdrop-blur-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#3b82f6]/20 rounded-full border border-[#3b82f6]/30">
                            <Activity className="h-4 w-4 text-[#3b82f6]" />
                          </div>
                          <div>
                            <div className="font-medium text-white">{transaction.description}</div>
                            <div className="text-sm text-gray-400">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-white/20 text-white bg-white/5">
                          {transaction.amount_sei} SEI
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credits">
            {convertToUserType(user) ? (
              <CreditManagement
                user={convertToUserType(user)!}
                onBuyCredits={handleBuyCredits}
                isLoading={false}
                isDemoMode={isDemoMode}
                onUserRefresh={handleUserRefresh}
                onCreditsUpdated={(newCredits) => {
                  // This would typically involve wallet transaction signing
                  console.log('Credits updated:', newCredits);
                }}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionHistory
              transactions={transactions}
              onViewTransaction={handleViewTransaction}
              onDownloadReceipt={handleDownloadReceipt}
              isLoading={false}
            />
          </TabsContent>

          <TabsContent value="settings">
            {convertToUserType(user) && (
              <UserSettings
                user={convertToUserType(user)!}
                onSaveSettings={handleSaveSettings}
                onDeleteAccount={handleDeleteAccount}
                isLoading={false}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
