import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ResearchItem } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Credit calculation utilities
export const CREDIT_RATES = {
  SIMPLE: 5,
  FULL: 10,
  MAX: 20
} as const;

export const SEI_TO_CREDIT_RATE = 10; // $1 = 10 credits
export const SEI_TO_USD_RATE = 0.5; // 1 SEI = $0.50 (example rate)

export function calculateCreditsNeeded(depth: 'simple' | 'full' | 'max'): number {
  return CREDIT_RATES[depth.toUpperCase() as keyof typeof CREDIT_RATES];
}

export function calculateSEICost(credits: number): number {
  return credits / SEI_TO_CREDIT_RATE;
}

export function calculateUSDCost(seiAmount: number): number {
  return seiAmount * SEI_TO_USD_RATE;
}

export function formatCredits(credits: number): string {
  return `${credits} credit${credits !== 1 ? 's' : ''}`;
}

export function formatSEI(amount: number): string {
  return `${amount.toFixed(4)} SEI`;
}

export function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

// Date formatting utilities
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatDate(d);
}

// Research status utilities
export function getResearchStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'text-green-600 bg-green-100';
    case 'processing':
      return 'text-blue-600 bg-blue-100';
    case 'pending':
      return 'text-yellow-600 bg-yellow-100';
    case 'failed':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function getResearchDepthColor(depth: string): string {
  switch (depth) {
    case 'simple':
      return 'text-blue-600 bg-blue-100';
    case 'full':
      return 'text-purple-600 bg-purple-100';
    case 'max':
      return 'text-orange-600 bg-orange-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function getResearchTypeColor(type: string): string {
  switch (type) {
    case 'public':
      return 'text-green-600 bg-green-100';
    case 'private':
      return 'text-gray-600 bg-gray-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

// Search and filter utilities
export function filterResearchItems(
  items: ResearchItem[],
  filters: {
    query?: string;
    type?: string;
    depth?: string;
    category?: string;
  }
): ResearchItem[] {
  return items.filter((item) => {
    if (
      filters.query &&
      !item.title.toLowerCase().includes(filters.query.toLowerCase()) &&
      !item.description?.toLowerCase().includes(filters.query.toLowerCase())
    ) {
      return false;
    }

    if (filters.type && filters.type !== 'all' && item.research_type !== filters.type) {
      return false;
    }

    if (filters.depth && filters.depth !== 'all' && item.research_depth !== filters.depth) {
      return false;
    }

    if (filters.category && item.category !== filters.category) {
      return false;
    }

    return true;
  });
}

// Demo mode utilities
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;

  // Check if user has connected wallet
  const hasWallet = localStorage.getItem('wallet_connected');
  if (hasWallet === 'true') return false;

  // Check demo usage limits
  const demoUsage = JSON.parse(localStorage.getItem('demo_usage') || '{}');
  const researchCount = demoUsage.research_count || 0;
  const chatCount = demoUsage.chat_message_count || 0;

  return researchCount < 1 && chatCount < 10;
}

export function canPerformDemoAction(action: 'research' | 'chat'): boolean {
  if (typeof window === 'undefined') return false;

  const demoUsage = JSON.parse(localStorage.getItem('demo_usage') || '{}');

  if (action === 'research') {
    return (demoUsage.research_count || 0) < 1;
  }

  if (action === 'chat') {
    return (demoUsage.chat_message_count || 0) < 10;
  }

  return false;
}

export function trackDemoUsage(action: 'research' | 'chat'): void {
  if (typeof window === 'undefined') return;

  const demoUsage = JSON.parse(localStorage.getItem('demo_usage') || '{}');

  if (action === 'research') {
    demoUsage.research_count = (demoUsage.research_count || 0) + 1;
  }

  if (action === 'chat') {
    demoUsage.chat_message_count = (demoUsage.chat_message_count || 0) + 1;
  }

  demoUsage.last_activity = new Date().toISOString();
  localStorage.setItem('demo_usage', JSON.stringify(demoUsage));
}

// Validation utilities
export function validateWalletAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// File utilities
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

// Pagination utilities
export function paginateArray<T>(array: T[], page: number, limit: number): T[] {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return array.slice(startIndex, endIndex);
}

export function calculatePaginationMeta(total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    total_pages: totalPages,
    has_next: page < totalPages,
    has_prev: page > 1
  };
}

// Truncate text utilities
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function truncateAddress(address: string, start: number = 6, end: number = 4): string {
  if (address.length <= start + end) return address;
  return `${address.substring(0, start)}...${address.substring(address.length - end)}`;
}

// Generate mock data utilities
export function generateMockId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function generateMockDate(daysAgo: number = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}
