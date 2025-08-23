'use client';

import React from 'react';
import Image from 'next/image';
import { Eye, Download, Share2, Clock, Globe, Lock, FileText, Tag, User, ShoppingCart, ImageIcon, Loader2 } from 'lucide-react';
import type { ResearchItem } from '@/lib/types';

interface ResearchCardProps {
  research: ResearchItem;
  user?: { username: string };
  isOwner?: boolean;
  onView?: (id: string) => void;
  onDownload?: (id: string) => void;
  onShare?: (id: string) => void;
  onPurchase?: (id: string) => void;
  onTogglePrivacy?: (id: string, isPrivate: boolean) => void;
  onListInMarketplace?: (id: string) => void;
  showActions?: boolean;
  className?: string;
  isUpdatingPrivacy?: boolean;
}

export default function ResearchCard({
  research,
  user,
  isOwner = false,
  onView,
  onDownload,
  onShare,
  onPurchase,
  onTogglePrivacy,
  onListInMarketplace,
  showActions = true,
  isUpdatingPrivacy = false
}: ResearchCardProps) {
  const handleView = () => {
    if (onView) {
      onView(research.id);
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(research.id);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(research.id);
    }
  };

  const handlePurchase = () => {
    if (onPurchase) {
      onPurchase(research.id);
    }
  };

  const handleTogglePrivacy = () => {
    if (onTogglePrivacy) {
      onTogglePrivacy(research.id, research.research_type === 'public');
    }
  };

  const handleListInMarketplace = () => {
    if (onListInMarketplace) {
      onListInMarketplace(research.id);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-ultra rounded-xl border border-white/10 shadow-custom hover:shadow-custom-lg transition-all duration-300 hover:scale-[1.02] group overflow-hidden">
      {/* Research Image */}
      {research.image_url ? (
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={research.image_url}
            alt={research.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          {/* Research type indicator - overlaid on image */}
          <div className="absolute top-3 right-3">
            <div
              className={`px-2 py-1 text-xs font-medium rounded-full flex items-center backdrop-blur-sm ${
                research.research_type === 'public'
                  ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                  : 'bg-[#e9407a]/20 text-[#e9407a] border border-[#e9407a]/30'
              }`}
            >
              {research.research_type === 'public' ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
              {research.research_type}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative h-48 w-full bg-gradient-to-br from-[#e9407a]/20 to-[#ff8a00]/20 flex items-center justify-center">
          <ImageIcon className="h-16 w-16 text-white/40" />
          {/* Research type indicator - overlaid on placeholder */}
          <div className="absolute top-3 right-3">
            <div
              className={`px-2 py-1 text-xs font-medium rounded-full flex items-center backdrop-blur-sm ${
                research.research_type === 'public'
                  ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                  : 'bg-[#e9407a]/20 text-[#e9407a] border border-[#e9407a]/30'
              }`}
            >
              {research.research_type === 'public' ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
              {research.research_type}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Title */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-white line-clamp-2 group-hover:text-[#e9407a] transition-colors duration-300">
            {research.title}
          </h3>
        </div>

        {/* Description */}
        <p className="text-gray-300 text-sm mb-4 line-clamp-3">{research.description || 'No description available'}</p>

        {/* Meta information */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="flex items-center text-gray-400">
            <Clock className="h-4 w-4 mr-2" />
            {new Date(research.created_at).toLocaleDateString()}
          </div>

          <div className="flex items-center text-gray-400">
            <FileText className="h-4 w-4 mr-2" />
            {research.credits_used}
          </div>

          <div className="flex items-center text-gray-400">
            <Tag className="h-4 w-4 mr-2" />
            {research.category || 'Uncategorized'}
          </div>

          <div className="flex items-center text-gray-400">
            <User className="h-4 w-4 mr-2" />
            {user?.username || 'Anonymous'}
          </div>
        </div>

        {/* Tags */}
        {research.tags && research.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {research.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-white/10 text-gray-300 text-xs rounded-full border border-white/20 backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
            {research.tags.length > 3 && (
              <span className="px-2 py-1 bg-white/10 text-gray-300 text-xs rounded-full border border-white/20 backdrop-blur-sm">
                +{research.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Research depth indicator */}
        <div className="flex items-center justify-between mb-4">
          <div
            className={`px-3 py-1 text-sm font-medium rounded-full backdrop-blur-sm ${
              research.research_depth === 'simple'
                ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                : research.research_depth === 'full'
                  ? 'bg-[#ff8a00]/20 text-[#ff8a00] border border-[#ff8a00]/30'
                  : 'bg-[#e9407a]/20 text-[#e9407a] border border-[#e9407a]/30'
            }`}
          >
            {research.research_depth.charAt(0).toUpperCase() + research.research_depth.slice(1)} Research
          </div>

          {research.status === 'processing' && research.estimated_completion && (
            <div className="text-sm text-[#3b82f6]">Est. completion: {research.estimated_completion}</div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-white/10">
            {/* View button */}
            <button
              onClick={handleView}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-[#e9407a] to-[#ff8a00] hover:from-[#d63384] hover:to-[#e67e22] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e9407a] transition-colors duration-300"
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </button>

            {/* Download button (if has file and is public or owner) */}
            {research.result_file_url && (isOwner || research.research_type === 'public') && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-3 py-2 border border-white/20 text-sm font-medium rounded-lg text-gray-300 bg-white/5 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e9407a] transition-colors duration-300 backdrop-blur-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
            )}

            {/* Share button (public only) */}
            {research.research_type === 'public' && (
              <button
                onClick={handleShare}
                className="inline-flex items-center px-3 py-2 border border-white/20 text-sm font-medium rounded-lg text-gray-300 bg-white/5 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e9407a] transition-colors duration-300 backdrop-blur-sm"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </button>
            )}

            {/* Owner actions */}
            {isOwner && (
              <>
                <button
                  onClick={handleTogglePrivacy}
                  disabled={isUpdatingPrivacy}
                  className="inline-flex items-center px-3 py-2 border border-white/20 text-sm font-medium rounded-lg text-gray-300 bg-white/5 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e9407a] transition-colors duration-300 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingPrivacy ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : research.research_type === 'public' ? (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Make Private
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4 mr-2" />
                      Make Public
                    </>
                  )}
                </button>

                {research.research_type === 'private' && (
                  <button
                    onClick={handleListInMarketplace}
                    className="inline-flex items-center px-3 py-2 border border-white/20 text-sm font-medium rounded-lg text-gray-300 bg-white/5 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e9407a] transition-colors duration-300 backdrop-blur-sm"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    List for Sale
                  </button>
                )}
              </>
            )}

            {/* Purchase button (if not owner and private) */}
            {!isOwner && research.research_type === 'private' && (
              <button
                onClick={handlePurchase}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#10b981] transition-colors duration-300"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Purchase
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
