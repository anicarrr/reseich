'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Plus, Clock, CheckCircle, AlertCircle, Library } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { ResearchService } from '@/lib/services/researchService';
import { AuthService } from '@/lib/services/authService';
import { researchService, marketplaceService } from '@/lib/database';
import type { ResearchFormData, ResearchItem, ResearchItemWithUser, MarketplaceListingWithResearch } from '@/lib/types';
import { ResearchForm } from '@/components/research/ResearchForm';
import { ResearchStatusList } from '@/components/research/ResearchStatus';
import ResearchCard from '@/components/ResearchCard';
import { mockResearchItems, mockUsers } from '@/lib/mockData';
import { usePageTitle } from '@/lib/hooks/usePageTitle';
import { useMutation } from '@tanstack/react-query';
import { SEI_CONSTANTS } from '@/lib/constants';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

function ResearchPageContent() {
  usePageTitle('Research Tools');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isDemoMode, isAuthenticated } = useAuth();
  const { primaryWallet, user: dynamicUser } = useDynamicContext();

  const [activeTab, setActiveTab] = useState('new');
  const [isLoading, setIsLoading] = useState(false);
  const [researchItems, setResearchItems] = useState<ResearchItem[]>([]);
  const [allAccessibleResearch, setAllAccessibleResearch] = useState<ResearchItemWithUser[]>([]);
  const [purchasedResearch, setPurchasedResearch] = useState<MarketplaceListingWithResearch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [updatingPrivacy, setUpdatingPrivacy] = useState<Set<string>>(new Set());

  // Fix hydration mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Check URL parameters for section and set active tab
  useEffect(() => {
    const section = searchParams.get('section');
    if (section === 'library') {
      setActiveTab('library');
    } else if (section === 'purchases') {
      setActiveTab('purchases');
    }
  }, [searchParams]);

  // Handle tab change and update URL
  const handleTabChange = (value: string) => {
    setActiveTab(value);

    // Update URL to reflect the current tab
    const newSearchParams = new URLSearchParams(searchParams.toString());

    if (value === 'library') {
      newSearchParams.set('section', 'library');
    } else if (value === 'purchases') {
      newSearchParams.set('section', 'purchases');
    } else {
      newSearchParams.delete('section');
    }

    const newUrl = `${window.location.pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`;
    router.replace(newUrl);
  };

  // Load all accessible research
  useEffect(() => {
    const loadAllResearch = async () => {
      if (isAuthenticated && user?.wallet_address) {
        try {
          const accessibleResearch = await researchService.getAccessibleResearch(user.wallet_address, isDemoMode);

          // If no research found in database, use mock data as fallback
          if (accessibleResearch.length === 0) {
            console.log('No accessible research found in database, using mock data as fallback');
            const mockResearchWithUsers = mockResearchItems
              .filter((item) => item.status === 'completed')
              .map((research) => {
                const user = mockUsers.find((u) => u.id === research.user_id);
                return {
                  ...research,
                  user: user
                    ? {
                        username: user.username,
                        wallet_address: user.wallet_address
                      }
                    : undefined
                };
              });
            setAllAccessibleResearch(isDemoMode ? mockResearchWithUsers : []);
          } else {
            setAllAccessibleResearch(accessibleResearch);
          }
        } catch (error) {
          console.error('Error loading accessible research:', error);
        }
      } else {
        // For non-authenticated users, load only public research
        try {
          const publicResearch = await researchService.getPublicResearch(1, 100);
          const publicResearchData = publicResearch.data || [];

          // If no research found in database, use mock data as fallback
          if (publicResearchData.length === 0) {
            console.log('No public research found in database, using mock data as fallback');
            const mockPublicResearch = mockResearchItems
              .filter((item) => item.research_type === 'public' && item.status === 'completed')
              .map((research) => {
                const user = mockUsers.find((u) => u.id === research.user_id);
                return {
                  ...research,
                  user: user
                    ? {
                        username: user.username,
                        wallet_address: user.wallet_address
                      }
                    : undefined
                };
              });
            setAllAccessibleResearch(mockPublicResearch);
          } else {
            setAllAccessibleResearch(publicResearchData);
          }
        } catch (error) {
          console.error('Error loading public research:', error);
        }
      }
    };

    if (isHydrated) {
      loadAllResearch();
    }
  }, [isAuthenticated, user?.wallet_address, isHydrated, isDemoMode]);

  // Load user's purchased research
  useEffect(() => {
    const loadPurchasedResearch = async () => {
      if (isAuthenticated && user?.wallet_address && !isDemoMode) {
        try {
          const purchases = await marketplaceService.getUserPurchases(user.id, false);
          setPurchasedResearch(purchases);
        } catch (error) {
          console.error('Error loading purchased research:', error);
        }
      } else if (isDemoMode && user?.demo_ip) {
        try {
          const purchases = await marketplaceService.getUserPurchases(user.demo_ip, true);
          setPurchasedResearch(purchases);
        } catch (error) {
          console.error('Error loading demo purchased research:', error);
        }
      }
    };

    if (isHydrated) {
      loadPurchasedResearch();
    }
  }, [isAuthenticated, user?.wallet_address, user?.id, user?.demo_ip, isHydrated, isDemoMode]);

  // Manual migration function for testing
  const handleManualMigration = async () => {
    if (!primaryWallet || !user || !user.is_demo_user) {
      console.log('❌ Cannot migrate: missing wallet or user is not demo');
      return;
    }

    try {
      console.log('🔄 Manual migration triggered...', {
        demoIP: user.demo_ip,
        walletAddress: primaryWallet.address
      });

      const migratedUser = await AuthService.migrateDemoToRealUser(user.demo_ip || '', primaryWallet.address, {
        username: dynamicUser?.username || user.username,
        email: dynamicUser?.email || user.email,
        avatar_url: undefined
      });

      if (migratedUser) {
        console.log('✅ Manual migration successful!');
        setSuccess(
          'Migration successful! You are now a real user with credits. Please refresh the page to see your updated status.'
        );
      } else {
        setError('Sorry, there was an issue with the data migration. Please try again in a moment.');
      }
    } catch {
      console.error('❌ Manual migration error occurred');
      setError('Sorry, there was an issue with the data migration. Please try again in a moment.');
    }
  };

  // Webhook mutation for research
  const researchWebhookMutation = useMutation({
    mutationFn: async (formData: ResearchFormData) => {
      const startTime = Date.now();

      // Build the request body with form-id for n8n routing - each form field as separate property
      const requestBody = {
        'form-id': 'research',
        // Core research fields
        title: formData.title,
        description: formData.description || '',
        query: formData.query,
        research_type: formData.research_type,
        research_depth: formData.research_depth,
        category: formData.category || '',
        tags: formData.tags || [],
        // User context - separate fields for demo vs authenticated users
        user_id: isDemoMode ? null : user?.id || null,
        demo_user_id: isDemoMode ? user?.id || null : null,
        wallet_address: isDemoMode ? null : user?.wallet_address || null,
        demo_mode: isDemoMode,
        demo_ip: isDemoMode ? user?.demo_ip || 'browser_session' : null,
        // Additional metadata
        credits_cost: ResearchService.calculateCreditCost(formData.research_depth),
        estimated_completion: ResearchService.estimateCompletionTime(formData.research_depth),
        timestamp: new Date().toISOString(),
        // Enhanced research fields
        source_preferences: formData.source_preferences || null,
        additional_context: formData.additional_context || null,
        specific_requirements: formData.specific_requirements || null
      };

      console.log('Sending research webhook:', requestBody);
      console.log('Webhook URL:', SEI_CONSTANTS.WEBHOOK_URL);

      const response = await fetch(SEI_CONSTANTS.WEBHOOK_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Ensure minimum 1 second delay for better UX
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);

      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('Research webhook response:', data);
      // The success handling will be done in handleResearchSubmit
    },
    onError: (error) => {
      console.error('Research webhook error:', error);
      setError('Sorry, there was an error during the research request. Please try again in a moment.');
    }
  });

  // Load user's research items on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadUserResearch();
    }
  }, [isAuthenticated]);

  const loadUserResearch = async () => {
    try {
      // This would typically fetch from your database
      // For now, we'll use mock data or empty array
      setResearchItems([]);
    } catch (error) {
      console.error('Failed to load research items:', error);
    }
  };

  const handleResearchSubmit = async (formData: ResearchFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate form data
      const validation = ResearchService.validateResearchData(formData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Check if user can afford the research
      const creditCost = ResearchService.calculateCreditCost(formData.research_depth);
      if (!isDemoMode && (user?.credits || 0) < creditCost) {
        throw new Error(`Insufficient credits. You need ${creditCost} credits but have ${user?.credits || 0}.`);
      }

      // Check demo limits
      if (isDemoMode && user && user.research_count && user.research_count >= 1) {
        throw new Error('Demo limit reached. Connect your wallet for unlimited access.');
      }

      // Send research request via webhook
      const webhookResult = await researchWebhookMutation.mutateAsync(formData);

      // Create a new research item for tracking
      const newResearch: ResearchItem = {
        id: webhookResult.research_id || `research_${Date.now()}`,
        user_id: user?.id || 'demo',
        title: formData.title,
        description: formData.description,
        research_type: formData.research_type,
        research_depth: formData.research_depth,
        query: formData.query,
        credits_used: creditCost,
        status: 'pending',
        tags: formData.tags,
        category: formData.category,
        estimated_completion:
          webhookResult.estimated_completion || ResearchService.estimateCompletionTime(formData.research_depth),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Enhanced research metadata
        result_metadata: {
          source_preferences: formData.source_preferences,
          additional_context: formData.additional_context,
          specific_requirements: formData.specific_requirements
        }
      };

      setResearchItems((prev) => [newResearch, ...prev]);
      setActiveTab('status');
      setSuccess(
        `Research "${formData.title}" started successfully! Estimated completion: ${newResearch.estimated_completion ? new Date(newResearch.estimated_completion).toLocaleString() : 'TBD'}`
      );

      // Start polling for status updates
      startStatusPolling(newResearch.id);
    } catch {
      setError('Sorry, there was an error during the research. Please try again in a moment.');
    } finally {
      setIsLoading(false);
    }
  };

  const startStatusPolling = (researchId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const statusResult = await ResearchService.checkResearchStatus(researchId);

        if (statusResult.success && statusResult.data) {
          setResearchItems((prev) =>
            prev.map((item) =>
              item.id === researchId
                ? {
                    ...item,
                    status: statusResult.data!.status as ResearchItem['status'],
                    updated_at: new Date().toISOString()
                  }
                : item
            )
          );

          // Stop polling if research is completed or failed
          if (statusResult.data.status === 'completed' || statusResult.data.status === 'failed') {
            clearInterval(pollInterval);

            if (statusResult.data.status === 'completed') {
              setSuccess('Research completed successfully! You can now view the results.');
            }
          }
        }
      } catch (error) {
        console.error('Status polling failed:', error);
      }
    }, 10000); // Poll every 10 seconds

    // Cleanup after 1 hour
    setTimeout(() => clearInterval(pollInterval), 60 * 60 * 1000);
  };

  // Function to toggle research privacy (public/private)
  const handleTogglePrivacy = async (id: string, isPublic: boolean) => {
    try {
      setError(null);
      setUpdatingPrivacy((prev) => new Set(prev).add(id));

      const newType = isPublic ? 'private' : 'public';

      // Use static import of researchService
      const success = await researchService.updateResearch(id, {
        research_type: newType
      });

      if (!success) {
        throw new Error('Failed to update research');
      }

      // Update local state for researchItems
      setResearchItems((prev) => prev.map((item) => (item.id === id ? { ...item, research_type: newType } : item)));

      // Update local state for allAccessibleResearch
      setAllAccessibleResearch((prev) => prev.map((item) => (item.id === id ? { ...item, research_type: newType } : item)));

      setSuccess(`Research is now ${newType}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Failed to toggle privacy:', error);
      setError('Failed to update research privacy');
    } finally {
      setUpdatingPrivacy((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleViewResults = async (researchId: string) => {
    try {
      // Navigate directly to the research detail page
      router.push(`/research/${researchId}`);
    } catch {
      setError('Sorry, there was an error opening the research details. Please try again in a moment.');
    }
  };

  const handleDownload = async (researchId: string) => {
    try {
      const results = await ResearchService.getResearchResults(researchId);
      if (results.success && results.data?.fileUrl) {
        // Trigger download
        window.open(results.data.fileUrl, '_blank');
      } else {
        setError('Sorry, the download file is not available at the moment. Please try again later.');
      }
    } catch {
      setError('Sorry, there was an error downloading the research results. Please try again in a moment.');
    }
  };

  const handleShare = (researchId: string) => {
    const shareUrl = `${window.location.origin}/research/${researchId}`;
    if (navigator.share) {
      navigator.share({
        title: 'Check out this research',
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      setSuccess('Research link copied to clipboard!');
    }
  };

  const pendingResearch = researchItems.filter((item) => item.status === 'pending');
  const processingResearch = researchItems.filter((item) => item.status === 'processing');
  const completedResearch = researchItems.filter((item) => item.status === 'completed');

  return (
    <div className="header-spacer">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Research Engine</h1>
              <p className="text-gray-400">AI-powered research with multiple depth levels</p>
            </div>
          </div>

          {isHydrated && (
            <div className="text-right space-y-2">
              {!isDemoMode ? (
                <>
                  <p className="text-sm text-gray-400">Available Credits</p>
                  <p className="text-2xl font-bold text-[#e9407a]">{user?.credits || 0}</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-400">Demo Mode - Credits: ∞</p>
                  {primaryWallet && (
                    <Button
                      onClick={handleManualMigration}
                      size="sm"
                      className="bg-[#e9407a] hover:bg-[#e9407a]/80 text-white"
                    >
                      Migrate to Real User
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="mb-6 border-[#ef4444]/30 bg-[#ef4444]/20 text-[#ef4444]">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-[#10b981]/30 bg-[#10b981]/20 text-[#10b981]">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Webhook Status */}
        {researchWebhookMutation.isPending && (
          <Alert className="mb-6 border-[#3b82f6]/30 bg-[#3b82f6]/20 text-[#3b82f6]">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[#3b82f6] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-[#3b82f6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-[#3b82f6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <AlertDescription>Processing research request...</AlertDescription>
            </div>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/5 backdrop-blur-ultra border-white/10">
            <TabsTrigger
              value="new"
              className="flex items-center justify-center gap-2 data-[state=active]:bg-[#e9407a] data-[state=active]:text-white"
            >
              <Plus className="h-4 w-4" />
              New Research
            </TabsTrigger>
            <TabsTrigger
              value="library"
              className="flex items-center justify-center gap-2 data-[state=active]:bg-[#e9407a] data-[state=active]:text-white"
            >
              <Library className="h-4 w-4" />
              My Library
              {allAccessibleResearch.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-white/20 text-white border border-white/30 rounded-full">
                  {allAccessibleResearch.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="purchases"
              className="flex items-center justify-center gap-2 data-[state=active]:bg-[#e9407a] data-[state=active]:text-white"
            >
              <Library className="h-4 w-4" />
              Purchases
              {purchasedResearch.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-white/20 text-white border border-white/30 rounded-full">
                  {purchasedResearch.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* New Research Tab */}
          <TabsContent value="new" className="space-y-6">
            <ResearchForm
              onSubmit={handleResearchSubmit}
              userCredits={user?.credits || 0}
              isDemoMode={isDemoMode}
              demoLimits={isDemoMode ? { researchCount: 0, maxResearch: 1 } : undefined}
              isLoading={isLoading || researchWebhookMutation.isPending}
            />
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-6">
            {/* Show loading state when submitting new research */}
            {researchWebhookMutation.isPending && (
              <Card className="bg-white/5 backdrop-blur-ultra border-white/10 border-[#3b82f6]/30">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#3b82f6]/20 flex items-center justify-center">
                      <div className="flex gap-1">
                        <div
                          className="w-2 h-2 bg-[#3b82f6] rounded-full animate-bounce"
                          style={{ animationDelay: '0ms' }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-[#3b82f6] rounded-full animate-bounce"
                          style={{ animationDelay: '150ms' }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-[#3b82f6] rounded-full animate-bounce"
                          style={{ animationDelay: '300ms' }}
                        ></div>
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Submitting Research Request</h3>
                    <p className="text-gray-400">Sending your research to the AI system...</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {processingResearch.length === 0 && pendingResearch.length === 0 && !researchWebhookMutation.isPending ? (
              <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Active Research</h3>
                    <p className="text-gray-400 mb-4">Start a new research project to see its status here.</p>
                    <Button
                      onClick={() => setActiveTab('new')}
                      className="bg-gradient-to-r from-[#e9407a] to-[#ff8a00] hover:from-[#d63384] hover:to-[#e67e22]"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Start Research
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Processing Research */}
                {processingResearch.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Currently Processing</h3>
                    <ResearchStatusList
                      researchItems={processingResearch}
                      onView={handleViewResults}
                      onDownload={handleDownload}
                      onShare={handleShare}
                    />
                  </div>
                )}

                {/* Pending Research */}
                {/* {pendingResearch.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Pending</h3>
                    <ResearchStatusList
                      researchItems={pendingResearch}
                      onView={handleViewResults}
                      onDownload={handleDownload}
                      onShare={handleShare}
                    />
                  </div>
                )} */}
              </div>
            )}
          </TabsContent>

          {/* Completed Research Tab */}
          <TabsContent value="completed" className="space-y-6">
            {completedResearch.length === 0 ? (
              <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Completed Research</h3>
                    <p className="text-gray-400">Completed research projects will appear here.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Completed Research</h3>
                <ResearchStatusList
                  researchItems={completedResearch}
                  onView={handleViewResults}
                  onDownload={handleDownload}
                  onShare={handleShare}
                />
              </div>
            )}
          </TabsContent>

          {/* All Research Tab */}
          <TabsContent value="all" className="space-y-6">
            {researchItems.length === 0 ? (
              <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Research Projects</h3>
                    <p className="text-gray-400 mb-4">Start your first research project to get started.</p>
                    <Button
                      onClick={() => setActiveTab('new')}
                      className="bg-gradient-to-r from-[#e9407a] to-[#ff8a00] hover:from-[#d63384] hover:to-[#e67e22]"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Start Research
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">All Research Projects</h3>
                <ResearchStatusList
                  researchItems={researchItems}
                  onView={handleViewResults}
                  onDownload={handleDownload}
                  onShare={handleShare}
                />
              </div>
            )}
          </TabsContent>

          {/* My Library Tab */}
          <TabsContent value="library" className="space-y-6">
            {allAccessibleResearch.length === 0 ? (
              <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Library className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Research Available</h3>
                    <p className="text-gray-400 mb-4">
                      Your research library is empty. Start a new research project or browse public research.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        onClick={() => setActiveTab('new')}
                        className="bg-gradient-to-r from-[#e9407a] to-[#ff8a00] hover:from-[#d63384] hover:to-[#e67e22]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Start Research
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push('/explore?tab=research')}
                        className="border-white/20 text-white bg-white/5 hover:bg-white/10"
                      >
                        Browse Public Research
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">My Research Library</h3>
                    <p className="text-gray-400 text-sm">
                      All research accessible to you: your own research, purchased items, and public research
                    </p>
                  </div>
                  <div className="text-sm text-gray-400">{allAccessibleResearch.length} items</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allAccessibleResearch.map((research) => {
                    const isOwner = user?.wallet_address === research.user?.wallet_address;

                    return (
                      <ResearchCard
                        key={research.id}
                        research={research}
                        user={research.user ? { username: research.user.username || 'Unknown User' } : undefined}
                        isOwner={isOwner}
                        onView={handleViewResults}
                        onDownload={(id) => {
                          const item = allAccessibleResearch.find((r) => r.id === id);
                          if (item?.result_file_url) {
                            window.open(item.result_file_url, '_blank');
                          }
                        }}
                        onShare={handleShare}
                        onPurchase={() => router.push('/explore')}
                        onListInMarketplace={() => router.push(`/research/listing?id=${research.id}`)}
                        onTogglePrivacy={handleTogglePrivacy}
                        isUpdatingPrivacy={updatingPrivacy.has(research.id)}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Purchases Tab */}
          <TabsContent value="purchases" className="space-y-6">
            {purchasedResearch.length === 0 ? (
              <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Library className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Purchases Yet</h3>
                    <p className="text-gray-400 mb-4">
                      You haven&apos;t purchased any research yet. Browse the marketplace to find valuable research.
                    </p>
                    <Button
                      onClick={() => router.push('/explore?tab=research')}
                      className="bg-gradient-to-r from-[#e9407a] to-[#ff8a00] hover:from-[#d63384] hover:to-[#e67e22]"
                    >
                      Browse Marketplace
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">My Purchases</h3>
                    <p className="text-gray-400 text-sm">Research you&apos;ve purchased from the marketplace</p>
                  </div>
                  <div className="text-sm text-gray-400">{purchasedResearch.length} items</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {purchasedResearch.map((listing) => {
                    const research = listing.research;
                    if (!research) return null;

                    return (
                      <ResearchCard
                        key={listing.id}
                        research={research}
                        user={research.user ? { username: research.user.username || 'Unknown User' } : undefined}
                        isOwner={false}
                        onView={handleViewResults}
                        onDownload={(id) => {
                          if (research.result_file_url) {
                            window.open(research.result_file_url, '_blank');
                          }
                        }}
                        onShare={handleShare}
                        onPurchase={() => router.push('/explore')}
                        onListInMarketplace={() => {}}
                        onTogglePrivacy={() => {}}
                        isUpdatingPrivacy={false}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function ResearchPageLoading() {
  return (
    <div className="header-spacer">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#e9407a]/20 flex items-center justify-center">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[#e9407a] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-[#e9407a] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-[#e9407a] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
            <p className="text-gray-400">Loading research tools...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main export wrapped in Suspense
export default function ResearchPage() {
  return (
    <Suspense fallback={<ResearchPageLoading />}>
      <ResearchPageContent />
    </Suspense>
  );
}
