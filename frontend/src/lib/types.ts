// ReSeich Database Types
// These types match the database schema defined in DATABASE_SPECS.md

export interface User {
  id: string;
  wallet_address: string;
  email?: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  credits: number;
  sei_balance?: string;
  is_demo_user: boolean;
  demo_ip?: string;
  demo_expires_at?: string;
  research_count?: number;
  research_results_email?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ResearchItem {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  research_type: 'public' | 'private';
  research_depth: 'simple' | 'full' | 'max';
  query: string;
  result_content?: string;
  result_file_url?: string;
  image_url?: string;
  result_metadata?: Record<string, unknown>;
  credits_used: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  tags?: string[];
  category?: string;
  estimated_completion?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceListing {
  id: string;
  research_id: string;
  user_id: string;
  title?: string;
  price_sei: string;
  price_usd?: number;
  description?: string;
  preview_content?: string;
  is_active: boolean;
  views_count: number;
  purchase_count: number;
  sales_count?: number;
  rating_average?: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceAccess {
  id: string;
  listing_id: string;
  research_id: string;
  user_id?: string;
  transaction_id?: string;
  access_type: 'purchased' | 'granted' | 'demo';
  demo_ip?: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id?: string;
  type:
    | 'credit_purchase'
    | 'research_purchase'
    | 'research_sale'
    | 'marketplace_purchase'
    | 'marketplace_sale'
    | 'access_granted'
    | 'access_revoked';
  amount_sei: string;
  amount_usd?: number;
  credits_amount?: number;
  research_id?: string;
  marketplace_listing_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transaction_hash?: string;
  sei_network_data?: Record<string, unknown>;
  description?: string;
  metadata?: Record<string, unknown>;
  demo_ip?: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  user_id?: string;
  title: string;
  is_demo: boolean;
  demo_ip?: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  content: string;
  is_user: boolean;
  user_id?: string | null;
  demo_ip?: string | null;
  is_demo?: boolean;
  message_type: 'text' | 'markdown' | 'code' | 'file';
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface DemoUsage {
  id: string;
  ip_address: string;
  research_count: number;
  chat_message_count: number;
  first_visit_at: string;
  last_activity_at: string;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

// Extended types for frontend use
export interface ResearchItemWithUser extends ResearchItem {
  user?: Pick<User, 'username' | 'wallet_address'>;
}

export interface MarketplaceListingWithResearch extends MarketplaceListing {
  research?: ResearchItemWithUser;
}

export interface ChatSessionWithMessages extends ChatSession {
  messages: ChatMessage[];
}

// Form types
export interface ResearchFormData {
  title: string;
  description?: string;
  research_type: 'public' | 'private';
  research_depth: 'simple' | 'full' | 'max';
  query: string;
  category?: string;
  tags?: string[];
  // Enhanced fields for better research
  source_preferences?: string;
  additional_context?: string;
  specific_requirements?: string;
}

export interface ChatFormData {
  message: string;
  sessionId?: string;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Demo mode types
export interface DemoLimits {
  researchCount: number;
  chatMessageCount: number;
  maxResearch: number;
  maxChatMessages: number;
}

// Credit system types
export interface CreditCosts {
  simple: number;
  full: number;
  max: number;
}

export interface CreditPurchase {
  amount_sei: string;
  credits_amount: number;
  wallet_address: string;
}

// Research execution types
export interface ResearchExecutionRequest {
  query: string;
  depth: 'simple' | 'full' | 'max';
  type: 'public' | 'private';
  userId?: string;
  demoMode: boolean;
  sessionId: string;
  additionalContext?: string;
  specificRequirements?: string;
  sourcePreferences?: string;
}

export interface ResearchExecutionResponse {
  success: boolean;
  researchId?: string;
  estimatedCompletion?: string;
  error?: string;
}

// Wallet types
export interface WalletInfo {
  address: string;
  chain: string;
  isConnected: boolean;
}

// UI State types
export interface AppState {
  user: User | null;
  wallet: WalletInfo | null;
  isDemoMode: boolean;
  demoLimits: DemoLimits;
  currentChatSession: ChatSessionWithMessages | null;
  isLoading: boolean;
  error: string | null;
}

// Filter and search types
export interface ResearchFilters {
  search?: string;
  type?: 'public' | 'private' | 'all';
  depth?: 'simple' | 'full' | 'max' | 'all';
  category?: string;
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface MarketplaceFilters {
  search?: string;
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  sortBy?: 'price' | 'rating' | 'date' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

// Additional types from the original frontend file
export interface NavItem {
  title: string;
  href: string;
  icon: string;
  description?: string;
}

export interface SearchFilters {
  query: string;
  type?: 'public' | 'private' | 'all';
  depth?: 'simple' | 'full' | 'max' | 'all';
  category?: string;
  date_range?: 'today' | 'week' | 'month' | 'year' | 'all';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface WalletConnection {
  address: string;
  chainId: number;
  isConnected: boolean;
  isConnecting: boolean;
}

export interface ResearchStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  estimated_completion?: string;
  current_step?: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface UserSettings {
  email_notifications: boolean;
  research_delivery_email?: string;
  privacy_level: 'public' | 'private' | 'selective';
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja';
}
