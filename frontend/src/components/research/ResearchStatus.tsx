'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Clock, CheckCircle, XCircle, Loader2, Download, Share2, Eye, Calendar } from 'lucide-react';
import type { ResearchItem } from '@/lib/types';

interface ResearchStatusProps {
  research: ResearchItem;
  onView?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  showActions?: boolean;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pending':
      return {
        color: 'bg-[#ff8a00]/20 text-[#ff8a00] border-[#ff8a00]/30',
        icon: Clock,
        label: 'Pending',
        description: 'Research is queued and waiting to start'
      };
    case 'processing':
      return {
        color: 'bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]/30',
        icon: Loader2,
        label: 'Processing',
        description: 'AI is actively researching your topic'
      };
    case 'completed':
      return {
        color: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30',
        icon: CheckCircle,
        label: 'Completed',
        description: 'Research is ready for review'
      };
    case 'failed':
      return {
        color: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30',
        icon: XCircle,
        label: 'Failed',
        description: 'Research encountered an error'
      };
    default:
      return {
        color: 'bg-white/20 text-gray-300 border-white/30',
        icon: Clock,
        label: 'Unknown',
        description: 'Status unknown'
      };
  }
};

const getProgressValue = (status: string, estimatedCompletion?: string) => {
  if (status === 'completed') return 100;
  if (status === 'failed') return 0;
  if (status === 'pending') return 10;

  // For processing, calculate based on time elapsed vs estimated
  if (status === 'processing' && estimatedCompletion) {
    const now = new Date();
    const estimated = new Date(estimatedCompletion);
    const created = new Date(); // This should come from research.created_at

    if (estimated > created) {
      const total = estimated.getTime() - created.getTime();
      const elapsed = now.getTime() - created.getTime();
      return Math.min(Math.max((elapsed / total) * 100, 20), 90);
    }
  }

  return 50; // Default processing progress
};

const formatTimeRemaining = (estimatedCompletion?: string) => {
  if (!estimatedCompletion) return 'Unknown';

  const now = new Date();
  const estimated = new Date(estimatedCompletion);
  const diff = estimated.getTime() - now.getTime();

  if (diff <= 0) return 'Ready soon';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
};

export const ResearchStatus: React.FC<ResearchStatusProps> = ({
  research,
  onDownload,
  onShare,
  showActions = true
}) => {
  const router = useRouter();
  const statusConfig = getStatusConfig(research.status);
  const StatusIcon = statusConfig.icon;
  const progressValue = getProgressValue(research.status, research.estimated_completion);
  const timeRemaining = formatTimeRemaining(research.estimated_completion);

  const handleTitleClick = () => {
    router.push(`/research/${research.id}`);
  };

  return (
    <Card className="w-full bg-white/5 backdrop-blur-ultra border-white/10">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle 
              className="text-lg font-semibold line-clamp-2 text-white cursor-pointer hover:text-blue-300 transition-colors"
              onClick={handleTitleClick}
            >
              {research.title}
            </CardTitle>
            <CardDescription className="line-clamp-2">{research.description || 'No description provided'}</CardDescription>
          </div>
          <Badge className={statusConfig.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Description */}
        <p className="text-sm text-gray-400">{statusConfig.description}</p>

        {/* Progress Bar */}
        {research.status === 'processing' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progressValue)}%</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>
        )}

        {/* Research Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-gray-400">Depth</p>
            <Badge variant="outline" className="capitalize">
              {research.research_depth}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-gray-400">Type</p>
            <Badge variant={research.research_type === 'public' ? 'default' : 'secondary'}>{research.research_type}</Badge>
          </div>
          <div className="space-y-1">
            <p className="text-gray-400">Credits Used</p>
            <p className="font-medium text-white">{research.credits_used}</p>
          </div>
          <div className="space-y-1">
            <p className="text-gray-400">Category</p>
            <p className="font-medium text-white">{research.category || 'Uncategorized'}</p>
          </div>
        </div>

        {/* Tags */}
        {research.tags && research.tags.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-400">Tags</p>
            <div className="flex flex-wrap gap-2">
              {research.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Time Information */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-gray-400 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Created
            </p>
            <p className="font-medium text-white">{new Date(research.created_at).toLocaleDateString()}</p>
          </div>
          {research.completed_at && (
            <div className="space-y-1">
              <p className="text-gray-400 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Completed
              </p>
              <p className="font-medium text-white">{new Date(research.completed_at).toLocaleDateString()}</p>
            </div>
          )}
          {research.status === 'processing' && research.estimated_completion && (
            <div className="space-y-1">
              <p className="text-gray-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Estimated
              </p>
              <p className="font-medium text-white">{timeRemaining}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-2">
              {/* View Details Button - Always visible */}
              <Button variant="outline" size="sm" onClick={handleTitleClick}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              
              {research.status === 'completed' && (
                <>
                  {onDownload && (
                    <Button variant="outline" size="sm" onClick={onDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                  {research.research_type === 'public' && onShare && (
                    <Button variant="outline" size="sm" onClick={onShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  )}
                </>
              )}
              {research.status === 'failed' && (
                <Button variant="outline" size="sm" className="text-red-600 border-red-200">
                  <XCircle className="h-4 w-4 mr-2" />
                  Retry Research
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Skeleton loading component
export const ResearchStatusSkeleton: React.FC = () => (
  <Card className="w-full bg-white/5 backdrop-blur-ultra border-white/10">
    <CardHeader className="pb-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-6 bg-white/20 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-white/20 rounded w-1/2 animate-pulse" />
        </div>
        <div className="h-6 w-20 bg-white/20 rounded animate-pulse" />
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="h-4 bg-white/20 rounded w-full animate-pulse" />
      <div className="h-2 bg-white/20 rounded w-full animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-white/20 rounded w-16 animate-pulse" />
            <div className="h-5 bg-white/20 rounded w-20 animate-pulse" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// List component for multiple research items
export const ResearchStatusList: React.FC<{
  researchItems: ResearchItem[];
  onView?: (id: string) => void;
  onDownload?: (id: string) => void;
  onShare?: (id: string) => void;
  showActions?: boolean;
}> = ({ researchItems, onView, onDownload, onShare, showActions = true }) => {
  return (
    <div className="space-y-4">
      {researchItems.map((research) => (
        <ResearchStatus
          key={research.id}
          research={research}
          onView={onView ? () => onView(research.id) : undefined}
          onDownload={onDownload ? () => onDownload(research.id) : undefined}
          onShare={onShare ? () => onShare(research.id) : undefined}
          showActions={showActions}
        />
      ))}
    </div>
  );
};
