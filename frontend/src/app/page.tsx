'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, TrendingUp, Users, Zap, ArrowRight, Sparkles } from 'lucide-react';
import ResearchCard from '@/components/ResearchCard';
import SearchAndFilter from '@/components/SearchAndFilter';
import { mockCategories, mockResearchItems, mockUsers } from '@/lib/mockData';
import { filterResearchItems } from '@/lib/utils';
import { ResearchItemWithUser, SearchFilters } from '@/lib/types';
import { researchService } from '@/lib/database';
import { useAuth } from '@/lib/hooks/useAuth';
import Image from 'next/image';
import { usePageTitle } from '@/lib/hooks/usePageTitle';

export default function HomePage() {
  usePageTitle('Sei Research & DeSci Platform');
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [allResearch, setAllResearch] = useState<ResearchItemWithUser[]>([]);
  const [filteredResearch, setFilteredResearch] = useState<ResearchItemWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    type: 'all',
    depth: 'all',
    category: '',
    date_range: 'all'
  });

  // Load research data
  useEffect(() => {
    const loadResearch = async () => {
      try {
        setIsLoading(true);
        let research: ResearchItemWithUser[] = [];

        // if (isAuthenticated && user?.wallet_address) {
        //   // Load all accessible research for authenticated users
        //   research = await researchService.getAccessibleResearch(user.wallet_address);
        // } else {
        // Load only public research for non-authenticated users
        const publicResearch = await researchService.getPublicResearch(1, 100);
        research = publicResearch.data;
        // }

        // Only show completed research on home page
        const completedResearch = research.filter((item) => item.status === 'completed');

        // If no research found in database, use mock data as fallback
        if (completedResearch.length === 0) {
          console.log('No research found in database, using mock data as fallback');
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
          setAllResearch(mockResearchWithUsers);
        } else {
          setAllResearch(completedResearch);
        }
      } catch (error) {
        console.error('Error loading research:', error);
        setAllResearch([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadResearch();
  }, [isAuthenticated, user?.wallet_address]);

  // Filter research items when filters change
  useEffect(() => {
    const filtered = filterResearchItems(allResearch, filters);
    setFilteredResearch(filtered);
  }, [allResearch, filters]);

  const handleViewResearch = (id: string) => {
    router.push(`/research/${id}`);
  };

  const handleDownloadResearch = (id: string) => {
    const research = allResearch.find((r) => r.id === id);
    if (research?.result_file_url) {
      window.open(research.result_file_url, '_blank');
    }
  };

  const handleShareResearch = (id: string) => {
    const shareUrl = `${window.location.origin}/research/${id}`;
    if (navigator.share) {
      navigator.share({
        title: 'Check out this research',
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  const handlePurchaseResearch = (id: string) => {
    router.push(`/explore`);
  };

  const handleTogglePrivacy = (id: string, isPrivate: boolean) => {
    console.log('Toggling privacy for research:', id, isPrivate);
    // This would require implementing privacy toggle functionality
  };

  const handleListInMarketplace = (id: string) => {
    router.push(`/explore`);
  };

  return (
    <>
      {/* Hero Section */}
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 pt-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-white space-y-8">
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                <span className="gradient-text-animated">Sei Research & DeSci Platform</span>
              </h1>

              <p className="text-lg text-gray-400 max-w-lg">
                Access advanced AI research tools, monetize your work, and discover groundbreaking insights on Sei Network
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push('/research')}
                  className="group bg-gradient-to-r from-[#e9407a] to-[#ff8a00] text-white px-8 py-4 rounded-xl font-semibold hover:from-[#d63384] hover:to-[#e67e22] transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-[#e9407a]/25 flex items-center justify-center space-x-2 animate-glow"
                >
                  <span>Launch App</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => router.push('/explore')}
                  className="border-2 border-gray-400 text-gray-300 px-8 py-4 rounded-xl font-semibold hover:border-white hover:text-white hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                >
                  Explore Research
                </button>
              </div>
            </div>

            {/* Right Robot Image */}
            <div className="relative flex justify-center">
              <div className="relative animate-float">
                <Image
                  src="/landing-page/robot.png"
                  alt="AI Robot with glowing brain"
                  width={500}
                  height={600}
                  className="w-auto h-auto max-w-md lg:max-w-lg drop-shadow-2xl md:w-[200%]"
                />
                {/* Enhanced glow effect around robot */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#ff8a00]/20 to-[#e9407a]/20 rounded-full blur-3xl scale-150 animate-pulse-slow"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6]/10 to-[#e9407a]/10 rounded-full blur-2xl scale-125 animate-pulse delay-1000"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white/5 backdrop-blur-ultra border border-white/10 rounded-2xl mx-4 sm:mx-8 lg:mx-auto max-w-7xl mb-20">
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-br from-[#e9407a]/20 to-[#ff8a00]/20 rounded-xl border border-[#e9407a]/30 group-hover:scale-110 transition-transform duration-300 animate-glow">
                  <Brain className="h-8 w-8 text-[#e9407a]" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-2">1,247</div>
              <div className="text-gray-400">Research Papers</div>
            </div>
            <div className="text-center group">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-br from-[#3b82f6]/20 to-[#10b981]/20 rounded-xl border border-[#3b82f6]/30 group-hover:scale-110 transition-transform duration-300 animate-glow">
                  <Users className="h-8 w-8 text-[#3b82f6]" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-2">892</div>
              <div className="text-gray-400">Active Researchers</div>
            </div>
            <div className="text-center group">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-br from-[#10b981]/20 to-[#059669]/20 rounded-xl border border-[#10b981]/30 group-hover:scale-110 transition-transform duration-300 animate-glow">
                  <TrendingUp className="h-8 w-8 text-[#10b981]" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-2">156</div>
              <div className="text-gray-400">Marketplace Sales</div>
            </div>
            <div className="text-center group">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-br from-[#ff8a00]/20 to-[#f97316]/20 rounded-xl border border-[#ff8a00]/30 group-hover:scale-110 transition-transform duration-300 animate-glow">
                  <Zap className="h-8 w-8 text-[#ff8a00]" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-gray-400">AI Availability</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#e9407a]/20 to-[#ff8a00]/20 border border-[#e9407a]/30 rounded-full px-6 py-2 mb-6 backdrop-blur-sm">
            <Sparkles className="h-5 w-5 text-[#e9407a] animate-bounce-slow" />
            <span className="text-[#e9407a] font-medium">Research Library</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Discover Cutting-Edge Research</h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Explore groundbreaking insights from the global community. Filter by type, depth, and category to find exactly
            what you need.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-12">
          <SearchAndFilter onFiltersChange={setFilters} categories={mockCategories} />
        </div>

        {/* Results Summary */}
        <div className="mb-8 flex items-center justify-between text-gray-400">
          <div className="text-sm">
            {isLoading ? 'Loading...' : `Showing ${filteredResearch.length} of ${allResearch.length} research items`}
          </div>
          <div className="text-sm">{filters.query && `Results for "${filters.query}"`}</div>
        </div>

        {/* Research Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-ultra border border-white/10 rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-white/20 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-white/20 rounded w-full mb-3"></div>
                <div className="h-3 bg-white/20 rounded w-2/3 mb-4"></div>
                <div className="h-8 bg-white/20 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : filteredResearch.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResearch.map((research) => {
              const isOwner = user?.wallet_address === research.user?.wallet_address;

              return (
                <ResearchCard
                  key={research.id}
                  research={research}
                  user={research.user ? { username: research.user.username || 'Unknown User' } : undefined}
                  isOwner={isOwner}
                  onView={handleViewResearch}
                  onDownload={handleDownloadResearch}
                  onShare={handleShareResearch}
                  onPurchase={handlePurchaseResearch}
                  onTogglePrivacy={handleTogglePrivacy}
                  onListInMarketplace={handleListInMarketplace}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="p-4 bg-gradient-to-br from-[#e9407a]/20 to-[#ff8a00]/20 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center animate-glow">
              <Brain className="h-10 w-10 text-[#e9407a]" />
            </div>
            <h3 className="text-xl font-medium text-white mb-3">No research found</h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Try adjusting your search criteria or browse all available research.
            </p>
            <button
              onClick={() =>
                setFilters({
                  query: '',
                  type: 'all',
                  depth: 'all',
                  category: '',
                  date_range: 'all'
                })
              }
              className="bg-gradient-to-r from-[#e9407a] to-[#ff8a00] text-white px-8 py-3 rounded-xl hover:from-[#d63384] hover:to-[#e67e22] transition-all duration-300 transform hover:scale-105"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-20">
          <div className="bg-gradient-to-r from-[#e9407a]/10 to-[#ff8a00]/10 border border-[#e9407a]/20 rounded-2xl p-12 text-center backdrop-blur-ultra">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to conduct your own research?</h3>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Use our advanced AI-powered research tools to explore any topic. Choose from simple, full, or maximum depth
              research options.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/research')}
                className="group bg-gradient-to-r from-[#e9407a] to-[#ff8a00] text-white px-10 py-4 rounded-xl font-semibold hover:from-[#d63384] hover:to-[#e67e22] transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-[#e9407a]/25 flex items-center justify-center space-x-2 animate-glow"
              >
                <span>Start New Research</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => router.push('/explore')}
                className="border-2 border-[#e9407a] text-[#e9407a] px-10 py-4 rounded-xl font-semibold hover:border-[#e9407a] hover:text-white hover:bg-[#e9407a]/10 transition-all duration-300 backdrop-blur-sm"
              >
                Browse Marketplace
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
