'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { UserLibrary } from '@/components/library/UserLibrary';
import { researchService } from '@/lib/database';
import { useAuth } from '@/lib/hooks/useAuth';
import { usePageTitle } from '@/lib/hooks/usePageTitle';
import type { ResearchItem } from '@/lib/types';

export default function LibraryPage() {
  usePageTitle('Research Library');
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, isDemoMode } = useAuth();
  const [researchItems, setResearchItems] = useState<ResearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadUserResearch = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (isDemoMode) {
        // For demo mode, we'll use mock data or empty array
        setResearchItems([]);
      } else if (user && !user.is_demo_user) {
        // Load user's research from database
        const researchData = await researchService.getUserResearch(user.wallet_address);
        setResearchItems(researchData || []);
      } else {
        // Demo user or no user
        setResearchItems([]);
      }
    } catch (error) {
      console.error('Failed to load research items:', error);
      setError(error instanceof Error ? error.message : 'Failed to load research items');
    } finally {
      setIsLoading(false);
    }
  };

  // Load user's research items on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadUserResearch();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [user, isDemoMode, isAuthenticated, authLoading]);

  const handleViewResearch = (id: string) => {
    router.push(`/research/${id}/results`);
  };

  const handleDownloadResearch = async (id: string) => {
    try {
      setError(null);
      // For now, we'll just show a success message
      // In a real implementation, this would fetch the research results
      setSuccess('Research download started');
    } catch (error) {
      setError('Failed to download research results');
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
      setSuccess('Research link copied to clipboard!');
    }
  };

  const handleTogglePrivacy = async (id: string, isPublic: boolean) => {
    try {
      setError(null);
      const newType = isPublic ? 'public' : 'private';

      const success = await researchService.updateResearch(id, {
        research_type: newType
      });

      if (!success) {
        throw new Error('Failed to update research');
      }

      // Update local state
      setResearchItems((prev) => prev.map((item) => (item.id === id ? { ...item, research_type: newType } : item)));

      setSuccess(`Research is now ${isPublic ? 'public' : 'private'}`);
    } catch (error) {
      console.error('Failed to toggle privacy:', error);
      setError('Failed to update research privacy');
    }
  };

  const handleListInMarketplace = (id: string) => {
    router.push(`/marketplace/list/${id}`);
  };

  const handleDeleteResearch = async (id: string) => {
    try {
      setError(null);

      const success = await researchService.deleteResearch(id);

      if (!success) {
        throw new Error('Failed to delete research');
      }

      // Remove from local state
      setResearchItems((prev) => prev.filter((item) => item.id !== id));
      setSuccess('Research deleted successfully');
    } catch (error) {
      console.error('Failed to delete research:', error);
      setError('Failed to delete research');
    }
  };

  const handleUpdateResearch = async (id: string, updates: Partial<ResearchItem>) => {
    try {
      setError(null);

      const success = await researchService.updateResearch(id, updates);

      if (!success) {
        throw new Error('Failed to update research');
      }

      // Update local state
      setResearchItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));

      setSuccess('Research updated successfully');
    } catch (error) {
      console.error('Failed to update research:', error);
      setError('Failed to update research');
    }
  };

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="header-spacer flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#e9407a] mx-auto mb-4" />
          <p className="text-gray-400">Loading your research library...</p>
        </div>
      </div>
    );
  }

  // Show error if no user and not in demo mode
  if (!isAuthenticated) {
    return (
      <div className="header-spacer flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-[#ef4444] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Access Required</h2>
          <p className="text-gray-400 mb-4">Please connect your wallet or use demo mode to access your research library.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-[#e9407a] to-[#ff8a00] hover:from-[#d63384] hover:to-[#e67e22] text-white px-4 py-2 rounded-lg transition-all duration-300"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="header-spacer">
      <div className="max-w-7xl mx-auto p-6">
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

        {/* Main Library Component */}
        <UserLibrary
          user={
            user || {
              id: 'demo',
              wallet_address: 'demo',
              credits: 0,
              is_demo_user: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          }
          researchItems={researchItems}
          onViewResearch={handleViewResearch}
          onDownloadResearch={handleDownloadResearch}
          onShareResearch={handleShareResearch}
          onTogglePrivacy={handleTogglePrivacy}
          onListInMarketplace={handleListInMarketplace}
          onDeleteResearch={handleDeleteResearch}
          onUpdateResearch={handleUpdateResearch}
        />

        {/* Demo Mode Notice */}
        {isDemoMode && (
          <div className="mt-8 p-4 bg-[#3b82f6]/20 border border-[#3b82f6]/30 rounded-lg backdrop-blur-sm">
            <div className="flex items-center gap-2 text-[#3b82f6]">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Demo Mode</span>
            </div>
            <p className="text-[#3b82f6]/80 text-sm mt-1">
              You&apos;re currently in demo mode. Connect your wallet to access your full research library and manage your
              projects.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
