import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Download, ExternalLink, Calendar, User, ShoppingCart, Loader2 } from 'lucide-react';
import type { ResearchItemWithUser } from '@/lib/types';

interface ResearchCardProps {
  research: ResearchItemWithUser;
  onView: (id: string) => void;
  onDownload?: (id: string) => void;
  onPurchase?: (id: string) => void;
  onTogglePrivacy?: (id: string, isPublic: boolean) => void;
  isOwner?: boolean;
  showActions?: boolean;
  isUpdatingPrivacy?: boolean;
}

export const ResearchCard: React.FC<ResearchCardProps> = ({
  research,
  onView,
  onDownload,
  onPurchase,
  onTogglePrivacy,
  isOwner = false,
  showActions = true,
  isUpdatingPrivacy = false
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDepthColor = (depth: string) => {
    switch (depth) {
      case 'simple':
        return 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30';
      case 'full':
        return 'bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]/30';
      case 'max':
        return 'bg-[#e9407a]/20 text-[#e9407a] border-[#e9407a]/30';
      default:
        return 'bg-white/20 text-gray-300 border-white/30';
    }
  };

  const getCreditsColor = (credits: number) => {
    if (credits <= 5) return 'text-[#10b981]';
    if (credits <= 10) return 'text-[#3b82f6]';
    return 'text-[#e9407a]';
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200 overflow-hidden relative bg-white/5 backdrop-blur-ultra border-white/10">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold line-clamp-2 leading-tight text-white">{research.title}</CardTitle>
        </div>

        {research.description && (
          <CardDescription className="line-clamp-3 text-sm text-gray-400">{research.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1 pb-3 flex-shrink-0">
        <div className="space-y-3">
          {/* Tags */}
          {research.tags && research.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {research.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs bg-white/10 text-gray-300 border-white/20">
                  {tag}
                </Badge>
              ))}
              {research.tags.length > 3 && (
                <Badge variant="outline" className="text-xs bg-white/10 text-gray-300 border-white/20">
                  +{research.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Category */}
          {research.category && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Badge variant="outline" className="text-xs">
                {research.category}
              </Badge>
            </div>
          )}

          {/* Query Preview */}
          <div className="text-sm text-gray-400">
            <span className="font-medium">Query:</span>
            <p className="line-clamp-2 mt-1 text-gray-500">{research.query}</p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(research.created_at)}
            </div>
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {research.user?.username || 'Anonymous'}
            </div>
          </div>

          {/* Credits */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Credits used:</span>
            <span className={`font-semibold ${getCreditsColor(research.credits_used)}`}>{research.credits_used}</span>
          </div>
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="pt-3 flex-shrink-0 bg-gray-50/50 mt-auto">
          <div className="flex gap-2 w-full">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => onView(research.id)}>
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>

            {/* Show download button only for research that user owns */}
            {onDownload && research.result_file_url && isOwner && (
              <Button variant="outline" size="sm" onClick={() => onDownload(research.id)}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}

            {/* Show privacy toggle buttons only for research that user owns */}
            {onTogglePrivacy && isOwner && (
              <Button
                variant={research.research_type === 'public' ? 'outline' : 'default'}
                size="sm"
                onClick={() => onTogglePrivacy(research.id, research.research_type === 'private')}
                className="min-w-[100px]"
                disabled={isUpdatingPrivacy}
              >
                {isUpdatingPrivacy ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  research.research_type === 'public' ? 'Make Private' : 'Make Public'
                )}
              </Button>
            )}

            {/* Show purchase button for private research that user doesn't own */}
            {onPurchase && !isOwner && research.research_type === 'private' && (
              <Button variant="default" size="sm" onClick={() => onPurchase(research.id)}>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Purchase
              </Button>
            )}

            {/* Show share button for public research */}
            {research.research_type === 'public' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Implement share functionality
                  if (navigator.share) {
                    navigator.share({
                      title: research.title,
                      text: research.description || '',
                      url: window.location.href
                    });
                  } else {
                    // Fallback: copy to clipboard
                    navigator.clipboard.writeText(window.location.href);
                  }
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Share
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

// Skeleton loading component
export const ResearchCardSkeleton: React.FC = () => {
  return (
    <Card className="h-full animate-pulse bg-white/5 backdrop-blur-ultra border-white/10">
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <div className="h-6 bg-white/20 rounded w-3/4"></div>
          <div className="h-4 bg-white/20 rounded w-full"></div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="h-5 bg-white/20 rounded w-16"></div>
            <div className="h-5 bg-white/20 rounded w-20"></div>
          </div>
          <div className="h-4 bg-white/20 rounded w-full"></div>
          <div className="h-4 bg-white/20 rounded w-2/3"></div>
        </div>
      </CardContent>

      <CardFooter>
        <div className="h-9 bg-white/20 rounded w-full"></div>
      </CardFooter>
    </Card>
  );
};

// Grid container for research cards
export const ResearchGrid: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start ${className}`}>
      {children}
    </div>
  );
};
