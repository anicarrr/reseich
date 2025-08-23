'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, Plus, ShoppingCart, Brain, Library } from 'lucide-react';
import { MarketplaceBrowse } from '@/components/explore/MarketplaceBrowse';
import ResearchCard from '@/components/ResearchCard';
import { mockResearchItems, mockUsers } from '@/lib/mockData';
import { marketplaceService, researchService } from '@/lib/database';
import { useDemoMode } from '@/lib/hooks/useDemoMode';
import { usePageTitle } from '@/lib/hooks/usePageTitle';
import type { MarketplaceListingWithResearch, ResearchItem, ResearchItemWithUser, User } from '@/lib/types';

function ExplorePageContent() {
  usePageTitle('Research Explore');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDemoMode } = useDemoMode();
  const { primaryWallet, user: dynamicUser } = useDynamicContext();

  // Get section from search params for enhanced navigation
  const section = searchParams.get('section');
  const initialTab = section === 'library' ? 'library' : 'browse';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [listings, setListings] = useState<MarketplaceListingWithResearch[]>([]);
  const [userResearch, setUserResearch] = useState<ResearchItem[]>([]);
  const [allResearch, setAllResearch] = useState<ResearchItemWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Function to update URL with section parameter using replace instead of push
  const updateURLWithSection = (newSection: string) => {
    const params = new URLSearchParams(window.location.search);
    if (newSection === 'browse') {
      params.set('section', 'marketplace');
    } else if (newSection === 'library') {
      params.set('section', 'library');
    }
    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newURL);
  };

  // Handle tab change with URL update
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    updateURLWithSection(value);
  };

  const loadMarketplaceData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load ONLY marketplace listings (research that owners chose to list for sale)
      // This includes both public and private research that is actively listed
      const listingsResponse = await marketplaceService.getMarketplaceListings();
      setListings(listingsResponse.data || []);

      // Load all public research for the Research tab
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
        setAllResearch(mockPublicResearch);
      } else {
        setAllResearch(publicResearchData);
      }

      // Load user research if authenticated
      if ((primaryWallet && dynamicUser) || isDemoMode) {
        if (primaryWallet && dynamicUser) {
          // Create or get user from wallet data
          const userData: User = {
            id: primaryWallet.address,
            wallet_address: primaryWallet.address,
            display_name: dynamicUser.username || 'User',
            email: dynamicUser.email || '',
            username: dynamicUser.username || '',
            avatar_url: '',
            credits: 100,
            is_demo_user: false,
            research_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setUser(userData);

          try {
            const researchData = await researchService.getUserResearch(primaryWallet.address);
            setUserResearch(researchData || []);
          } catch (err) {
            console.error('Error loading user research:', err);
            setUserResearch([]);
          }
        } else if (isDemoMode) {
          // Demo mode user
          const demoUser: User = {
            id: 'demo-user',
            wallet_address: 'demo-address',
            display_name: 'Demo User',
            email: 'demo@example.com',
            username: 'demo',
            avatar_url: '',
            credits: 1000,
            is_demo_user: true,
            research_count: 5,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setUser(demoUser);
          setUserResearch([]);
        }
      } else {
        setUser(null);
        setUserResearch([]);
      }
    } catch (error) {
      console.error('Failed to load marketplace data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load marketplace data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load marketplace data on component mount
  useEffect(() => {
    loadMarketplaceData();
  }, [primaryWallet, dynamicUser, isDemoMode]);

  // Sync tab state with URL parameters on mount only
  useEffect(() => {
    const section = searchParams.get('section');
    if (section === 'library') {
      setActiveTab('library');
    } else {
      setActiveTab('browse');
    }
  }, []); // Empty dependency array to run only on mount

  const handleViewListing = (id: string) => {
    router.push(`/explore/listing/${id}`);
  };

  const handlePurchaseListing = async (listingId: string) => {
    console.log({ isDemoMode });
    if (isDemoMode) {
      setError('Please connect your wallet to purchase research');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setError(null);

      // Find the listing to get the research ID
      const listing = listings.find((l) => l.id === listingId);
      if (!listing) {
        setError('Research listing not found');
        return;
      }

      // Navigate to the research detail page where the purchase can be completed
      router.push(`/explore/${listing.research_id}`);
    } catch (error) {
      setError('Failed to navigate to research details');
    }
  };

  const handleViewResearch = (id: string) => {
    router.push(`/explore/${id}`);
  };

  // const handleCreateListing = async (data: ListingCreationData) => {
  //   try {
  //     setError(null);
  //     setSuccess(null);

  //     if (!user && !isDemoMode) {
  //       throw new Error('Please connect your wallet to create listings');
  //     }

  //     // Create marketplace listing
  //     const listingData = {
  //       ...data,
  //       user_id: user?.id || 'demo',
  //       is_active: true,
  //       views_count: 0,
  //       rating_average: 0,
  //       rating_count: 0
  //     };

  //     const newListing = await marketplaceService.createListing(listingData);

  //     if (!newListing) {
  //       throw new Error('Failed to create listing');
  //     }

  //     setSuccess('Marketplace listing created successfully!');

  //     // Refresh listings
  //     await loadMarketplaceData();

  //     // Switch to browse tab to see the new listing
  //     setActiveTab('browse');

  //     // Clear form after successful creation
  //     setTimeout(() => {
  //       setSuccess(null);
  //     }, 3000);
  //   } catch (error) {
  //     setError(error instanceof Error ? error.message : 'Failed to create listing');
  //   }
  // };

  // Show loading state with skeleton
  if (isLoading) {
    return (
      <div className="header-spacer">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header Skeleton */}
          <div className="mb-8 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-9 bg-white/10 rounded w-32 mb-2"></div>
                <div className="h-5 bg-white/10 rounded w-96"></div>
              </div>
            </div>
          </div>

          {/* Error/Success Alert Skeleton */}
          <div className="mb-6 animate-pulse">
            <div className="h-16 bg-white/5 border border-white/10 rounded-lg"></div>
          </div>

          {/* Tabs Skeleton */}
          <div className="animate-pulse space-y-6">
            {/* Tab List Skeleton */}
            <div className="grid w-full grid-cols-2 bg-white/5 backdrop-blur-ultra border-white/10 rounded-lg p-1">
              <div className="h-12 bg-white/10 rounded"></div>
              <div className="h-12 bg-white/10 rounded"></div>
            </div>

            {/* Tab Content Skeleton */}
            <div className="space-y-6">
              {/* Filters/Search Skeleton */}
              <div className="bg-white/5 backdrop-blur-ultra border-white/10 rounded-lg p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 h-10 bg-white/10 rounded"></div>
                  <div className="flex gap-2">
                    <div className="w-32 h-10 bg-white/10 rounded"></div>
                    <div className="w-32 h-10 bg-white/10 rounded"></div>
                    <div className="w-32 h-10 bg-white/10 rounded"></div>
                    <div className="w-8 h-10 bg-white/10 rounded"></div>
                  </div>
                </div>

                {/* Advanced Filters Skeleton */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex justify-center">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-5xl">
                      <div className="space-y-2 min-w-[280px] h-full flex flex-col">
                        <div className="h-4 bg-white/10 rounded w-24"></div>
                        <div className="px-2 flex-1 flex flex-col justify-center">
                          <div className="h-2 bg-white/10 rounded w-full"></div>
                        </div>
                        <div className="flex justify-between">
                          <div className="h-3 bg-white/10 rounded w-12"></div>
                          <div className="h-3 bg-white/10 rounded w-16"></div>
                        </div>
                      </div>

                      <div className="space-y-2 min-w-[280px] h-full flex flex-col">
                        <div className="h-4 bg-white/10 rounded w-32"></div>
                        <div className="px-2 flex-1 flex flex-col justify-center">
                          <div className="flex items-center gap-2">
                            <div className="h-2 bg-white/10 rounded flex-1"></div>
                            <div className="h-4 bg-white/10 rounded w-8"></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-4 w-4 bg-white/10 rounded"></div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start pt-6 ml-8">
                      <div className="h-8 w-24 bg-white/10 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* View Mode Toggle Skeleton */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-16 bg-white/10 rounded"></div>
                  <div className="h-8 w-16 bg-white/10 rounded"></div>
                </div>
                <div className="h-4 w-32 bg-white/10 rounded"></div>
              </div>

              {/* Content Grid Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white/5 backdrop-blur-ultra border-white/10 rounded-lg p-6">
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="h-6 bg-white/10 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-white/10 rounded w-1/2"></div>
                      </div>
                      <div className="text-right flex flex-col items-end justify-center">
                        <div className="h-8 bg-white/10 rounded w-20 mb-1"></div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, j) => (
                            <div key={j} className="h-4 w-4 bg-white/10 rounded"></div>
                          ))}
                          <div className="h-3 w-8 bg-white/10 rounded ml-1"></div>
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="h-3 bg-white/10 rounded w-12"></div>
                          <div className="h-6 bg-white/10 rounded w-16"></div>
                        </div>
                        <div className="space-y-1">
                          <div className="h-3 bg-white/10 rounded w-16"></div>
                          <div className="h-4 bg-white/10 rounded w-20"></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="h-3 bg-white/10 rounded w-8"></div>
                        <div className="flex flex-wrap gap-2">
                          {[...Array(3)].map((_, k) => (
                            <div key={k} className="h-5 bg-white/10 rounded w-12"></div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 bg-white/10 rounded"></div>
                          <div className="h-3 bg-white/10 rounded w-16"></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 bg-white/10 rounded"></div>
                          <div className="h-3 bg-white/10 rounded w-8"></div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <div className="h-8 bg-white/10 rounded flex-1"></div>
                        <div className="h-8 bg-white/10 rounded flex-1"></div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 bg-white/10 rounded"></div>
                        <div className="h-3 bg-white/10 rounded w-20"></div>
                        <div className="h-3 w-3 bg-white/10 rounded"></div>
                        <div className="h-3 bg-white/10 rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="header-spacer">
      <div className="max-w-7xl mx-auto p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Explore</h1>
              <p className="text-gray-400">Discover, buy, and sell high-quality research on the Sei Network</p>
            </div>
            <div className="flex items-center gap-3">
              {user && !isDemoMode && (
                <Button
                  onClick={() => setActiveTab('create')}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#e9407a] to-[#ff8a00] hover:from-[#d63384] hover:to-[#e67e22]"
                >
                  <Plus className="h-4 w-4" />
                  List Research
                </Button>
              )}
              <Button
                variant="outline"
                className="border-white/20 text-white bg-white/5 hover:bg-white/10"
                onClick={() => router.push('/research?section=purchases')}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                My Purchases
              </Button>
            </div>
          </div>
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

        {/* Demo Mode Notice */}
        {isDemoMode && (
          <div className="mb-6 p-4 bg-[#3b82f6]/20 border border-[#3b82f6]/30 rounded-lg backdrop-blur-sm">
            <div className="flex items-center gap-2 text-[#3b82f6]">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Demo Mode</span>
            </div>
            <p className="text-[#3b82f6]/80 text-sm mt-1">
              You&apos;re currently in demo mode. Connect your wallet to make purchases.
            </p>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/5 backdrop-blur-ultra border-white/10">
            <TabsTrigger
              value="browse"
              className="flex items-center gap-4 data-[state=active]:bg-[#e9407a] data-[state=active]:text-white"
            >
              <ShoppingCart className="h-4 w-4" />
              Explore Marketplace
            </TabsTrigger>
            {/* <TabsTrigger
              value="research"
              className="flex items-center gap-2 data-[state=active]:bg-[#e9407a] data-[state=active]:text-white"
            >
              <Brain className="h-4 w-4" />
              Research
            </TabsTrigger> */}
            <TabsTrigger
              value="library"
              className="flex items-center gap-4 data-[state=active]:bg-[#e9407a] data-[state=active]:text-white"
            >
              <Library className="h-4 w-4" />
              Explore Library
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            <MarketplaceBrowse
              listings={listings}
              onViewListing={handleViewListing}
              onPurchaseListing={handlePurchaseListing}
              onViewResearch={handleViewResearch}
              isLoading={false}
            />
          </TabsContent>

          <TabsContent value="library" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Public Research</h3>
              <p className="text-gray-400 mb-6">Discover and explore public research from the community</p>

              {allResearch.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allResearch.map((research) => {
                    const isOwner = user?.wallet_address === research.user?.wallet_address;

                    return (
                      <ResearchCard
                        key={research.id}
                        research={research}
                        user={research.user ? { username: research.user.username || 'Unknown User' } : undefined}
                        isOwner={isOwner}
                        onView={handleViewResearch}
                        onDownload={(id) => {
                          const item = allResearch.find((r) => r.id === id);
                          if (item?.result_file_url) {
                            window.open(item.result_file_url, '_blank');
                          }
                        }}
                        onShare={(id) => {
                          const shareUrl = `${window.location.origin}/research/${id}`;
                          if (navigator.share) {
                            navigator.share({
                              title: 'Check out this research',
                              url: shareUrl
                            });
                          } else {
                            navigator.clipboard.writeText(shareUrl);
                          }
                        }}
                        onPurchase={() => setActiveTab('browse')}
                        onListInMarketplace={() => setActiveTab('create')}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Research Available</h3>
                  <p className="text-gray-400 mb-4">There are no public research items available at the moment.</p>
                  <Button
                    onClick={() => router.push('/research')}
                    className="bg-gradient-to-r from-[#e9407a] to-[#ff8a00] hover:from-[#d63384] hover:to-[#e67e22]"
                  >
                    Start New Research
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* <TabsContent value="create" className="space-y-6">
            {!user && !isDemoMode ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Wallet Connection Required</h3>
                <p className="text-gray-400 mb-4">Please connect your wallet to create marketplace listings.</p>
                <Button
                  onClick={() => router.push('/')}
                  className="bg-gradient-to-r from-[#e9407a] to-[#ff8a00] hover:from-[#d63384] hover:to-[#e67e22]"
                >
                  Connect Wallet
                </Button>
              </div>
            ) : (
              <ListingCreationForm userResearch={userResearch} onSubmit={handleCreateListing} isLoading={false} />
            )}
          </TabsContent> */}
        </Tabs>

        {/* Marketplace Stats */}
        <div className="mt-12 p-6 bg-white/5 backdrop-blur-ultra rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Marketplace Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#3b82f6]">{listings.length}</div>
              <div className="text-sm text-gray-400">Active Listings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#10b981]">
                {listings.length > 0
                  ? (listings.reduce((sum, l) => sum + parseFloat(l.price_sei), 0) / listings.length).toFixed(2)
                  : '0'}
              </div>
              <div className="text-sm text-gray-400">Average Price (SEI)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#e9407a]">
                {new Set(listings.map((l) => l.research?.user?.wallet_address)).size}
              </div>
              <div className="text-sm text-gray-400">Active Sellers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#ff8a00]">{listings.filter((l) => l.is_active).length}</div>
              <div className="text-sm text-gray-400">Active Listings</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
            <p className="text-gray-400">Loading explore page...</p>
          </div>
        </div>
      }
    >
      <ExplorePageContent />
    </Suspense>
  );
}
