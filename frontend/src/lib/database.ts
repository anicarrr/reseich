import { createClient } from '@supabase/supabase-js';
import type {
  User,
  ResearchItem,
  MarketplaceListing,
  MarketplaceAccess,
  Transaction,
  ChatSession,
  ChatMessage,
  DemoUsage,
  ResearchItemWithUser,
  MarketplaceListingWithResearch,
  PaginatedResponse,
  ResearchFilters,
  MarketplaceFilters
} from './types';

// Supabase client configuration (use anon key for database access)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database utility functions

// User management
export const userService = {
  // Get user by wallet address
  async getUserByWallet(walletAddress: string): Promise<User | null> {
    if (!supabase) {
      console.warn('Supabase client not configured, returning null');
      return null;
    }

    try {
      const { data, error } = await supabase.from('users').select('*').eq('wallet_address', walletAddress).single();

      if (error) {
        console.error('Error fetching user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserByWallet:', error);
      return null;
    }
  },

  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    if (!supabase) {
      console.warn('Supabase client not configured, returning null');
      return null;
    }

    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

      if (error) {
        console.error('Error fetching user by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserById:', error);
      return null;
    }
  },

  // Get user by ID (alias for getUserByWallet for consistency)
  async getUser(walletAddress: string): Promise<User | null> {
    return this.getUserByWallet(walletAddress);
  },

  // Create or update user
  async upsertUser(userData: Partial<User>): Promise<User | null> {
    if (!supabase) {
      console.warn('Supabase client not configured, returning null');
      return null;
    }

    try {
      console.log('🗄️ Upserting user data:', userData);

      const { data, error } = await supabase
        .from('users')
        .upsert(userData, { onConflict: 'wallet_address' })
        .select()
        .single();

      if (error) {
        console.error('❌ Error upserting user:', error);
        return null;
      }

      console.log('✅ User upserted successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Exception in upsertUser:', error);
      return null;
    }
  },

  // Update user
  async updateUser(walletAddress: string, updates: Partial<User>): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase client not configured, returning false');
      return false;
    }

    try {
      const { error } = await supabase.from('users').update(updates).eq('wallet_address', walletAddress);

      if (error) {
        console.error('Error updating user:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateUser:', error);
      return false;
    }
  },

  // Delete user
  async deleteUser(walletAddress: string): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase client not configured, returning false');
      return false;
    }

    try {
      const { error } = await supabase.from('users').delete().eq('wallet_address', walletAddress);

      if (error) {
        console.error('Error deleting user:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteUser:', error);
      return false;
    }
  },

  // Update user credits
  async updateCredits(walletAddress: string, credits: number): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase client not configured, returning false');
      return false;
    }

    try {
      const { error } = await supabase.from('users').update({ credits }).eq('wallet_address', walletAddress);

      if (error) {
        console.error('Error updating credits:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateCredits:', error);
      return false;
    }
  },

  // Get demo user by IP
  async getDemoUserByIP(ipAddress: string): Promise<DemoUsage | null> {
    if (!supabase) {
      console.warn('Supabase client not configured, returning null');
      return null;
    }

    try {
      const { data, error } = await supabase.from('demo_usage').select('*').eq('ip_address', ipAddress).single();

      if (error) {
        // If the table doesn't exist or has no data, return null gracefully
        if (error.code === 'PGRST116' || error.code === '42P01') {
          console.warn('Demo usage table not available or empty for IP:', ipAddress);
          return null;
        }
        console.error('Error fetching demo user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getDemoUserByIP:', error);
      return null;
    }
  },

  // Track demo usage
  async trackDemoUsage(ipAddress: string, usageType: 'research' | 'chat'): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase client not configured, returning false');
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('track_demo_usage', { ip_addr: ipAddress, usage_type: usageType });

      if (error) {
        console.error('Error tracking demo usage:', error);
        return false;
      }

      return data;
    } catch (error) {
      console.error('Error in trackDemoUsage:', error);
      return false;
    }
  },

  // Reset demo research count for daily limit
  async resetDemoResearchCount(ipAddress: string): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase client not configured, returning false');
      return false;
    }

    try {
      const { error } = await supabase
        .from('demo_usage')
        .update({
          research_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq('ip_address', ipAddress);

      if (error) {
        console.error('Error resetting demo research count:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in resetDemoResearchCount:', error);
      return false;
    }
  },

  // Create demo usage record
  async createDemoUsageRecord(demoUsageData: Partial<DemoUsage>): Promise<DemoUsage | null> {
    if (!supabase) {
      console.warn('Supabase client not configured, returning null');
      return null;
    }

    try {
      const { data, error } = await supabase.from('demo_usage').insert(demoUsageData).select().single();

      if (error) {
        console.error('Error creating demo usage record:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createDemoUsageRecord:', error);
      return null;
    }
  },

  // Get wallet address by user ID (for research purchases)
  async getWalletAddressByUserId(userId: string): Promise<string | null> {
    if (!supabase) {
      console.warn('Supabase client not configured, returning null');
      return null;
    }

    try {
      const { data, error } = await supabase.from('users').select('wallet_address').eq('id', userId).single();

      if (error) {
        console.error('Error fetching wallet address by user ID:', error);
        return null;
      }

      return data?.wallet_address || null;
    } catch (error) {
      console.error('Error in getWalletAddressByUserId:', error);
      return null;
    }
  }
};

// Research management
export const researchService = {
  // Get research item by ID
  async getResearchById(researchId: string): Promise<ResearchItem | null> {
    if (!supabase) {
      console.warn('Supabase client not configured, returning null');
      return null;
    }

    try {
      const { data, error } = await supabase.from('research_items').select('*').eq('id', researchId).single();

      if (error) {
        console.error('Error fetching research by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getResearchById:', error);
      return null;
    }
  },

  // Get public research items with pagination
  async getPublicResearch(
    page: number = 1,
    limit: number = 12,
    filters?: ResearchFilters
  ): Promise<PaginatedResponse<ResearchItemWithUser>> {
    if (!supabase) {
      console.warn('Supabase client not configured, returning empty results');
      return { data: [], total: 0, page, limit, hasMore: false };
    }

    let query = supabase
      .from('research_items')
      .select(
        `
        *,
        user:users(username, wallet_address)
      `
      )
      .eq('research_type', 'public')
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters?.depth && filters.depth !== 'all') {
      query = query.eq('research_depth', filters.depth);
    }

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    // Get total count
    const { count } = await supabase
      .from('research_items')
      .select('*', { count: 'exact', head: true })
      .eq('research_type', 'public')
      .eq('status', 'completed');

    // Get paginated results
    const { data, error } = await query.range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Error fetching public research:', error);
      return { data: [], total: 0, page, limit, hasMore: false };
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      hasMore: page * limit < (count || 0)
    };
  },

  // Get user's research items
  async getUserResearch(walletAddress: string): Promise<ResearchItem[]> {
    if (!supabase) {
      console.warn('Supabase client not configured, returning empty array');
      return [];
    }

    try {
      const user = await userService.getUserByWallet(walletAddress);
      if (!user) return [];

      const { data, error } = await supabase
        .from('research_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user research:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserResearch:', error);
      return [];
    }
  },

  // Get research items purchased by user
  async getPurchasedResearch(walletAddress: string): Promise<ResearchItemWithUser[]> {
    if (!supabase) {
      console.warn('Supabase client not configured, returning empty array');
      return [];
    }

    try {
      const user = await userService.getUserByWallet(walletAddress);
      if (!user) return [];

      // Get research items purchased through marketplace transactions
      const { data, error } = await supabase
        .from('transactions')
        .select(
          `
          research_id,
          research_items(
            *,
            user:users(username, wallet_address)
          )
        `
        )
        .eq('user_id', user.id)
        .eq('type', 'research_purchase')
        .eq('status', 'completed')
        .not('research_id', 'is', null);

      if (error) {
        console.error('Error fetching purchased research:', error);
        return [];
      }

      // Extract research items and flatten the structure
      const purchasedResearch =
        data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ?.map((transaction: any) => transaction.research_items)
          .filter(Boolean)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((research: any) => ({
            ...research,
            user: research.user
              ? {
                  username: research.user.username,
                  wallet_address: research.user.wallet_address
                }
              : undefined
          })) || [];

      return purchasedResearch;
    } catch (error) {
      console.error('Error in getPurchasedResearch:', error);
      return [];
    }
  },

  // Get all research accessible by user (owned + purchased + public)
  async getAccessibleResearch(walletAddress: string, isDemoMode: boolean): Promise<ResearchItemWithUser[]> {
    if (!supabase) {
      console.warn('Supabase client not configured, returning empty array');
      return [];
    }

    try {
      const user = await userService.getUserByWallet(walletAddress);
      if (!user || isDemoMode) {
        // If no user, only return public research
        const publicResearch = await this.getPublicResearch(1, 1000);
        return publicResearch.data;
      }

      // Get user's own research
      const ownResearch = await this.getUserResearch(walletAddress);

      // Get purchased research
      const purchasedResearch = await this.getPurchasedResearch(walletAddress);

      // Get public research (excluding user's own)
      // const publicResearch = await this.getPublicResearch(1, 1000);
      // const publicNotOwned = publicResearch.data.filter(research =>
      //   research.user?.wallet_address !== walletAddress
      // );

      // Combine all research with user info
      const ownResearchWithUser: ResearchItemWithUser[] = ownResearch.map((research) => ({
        ...research,
        user: { username: user.username, wallet_address: user.wallet_address }
      }));

      // Combine and deduplicate by ID
      const allResearch = [...ownResearchWithUser, ...purchasedResearch];
      const uniqueResearch = allResearch.filter(
        (research, index, self) => index === self.findIndex((r) => r.id === research.id)
      );

      return uniqueResearch.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('Error in getAccessibleResearch:', error);
      return [];
    }
  },

  // Create new research item
  async createResearch(researchData: Partial<ResearchItem>): Promise<ResearchItem | null> {
    if (!supabase) {
      console.warn('Supabase client not configured, returning null');
      return null;
    }

    try {
      const { data, error } = await supabase.from('research_items').insert(researchData).select().single();

      if (error) {
        console.error('Error creating research:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createResearch:', error);
      return null;
    }
  },

  // Update research item
  async updateResearch(id: string, updates: Partial<ResearchItem>): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase client not configured, returning false');
      return false;
    }

    try {
      const { error } = await supabase.from('research_items').update(updates).eq('id', id);

      if (error) {
        console.error('Error updating research:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateResearch:', error);
      return false;
    }
  },

  // Delete research item
  async deleteResearch(id: string): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase client not configured, returning false');
      return false;
    }

    try {
      const { error } = await supabase.from('research_items').delete().eq('id', id);

      if (error) {
        console.error('Error deleting research:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteResearch:', error);
      return false;
    }
  }
};

// Marketplace management
export const marketplaceService = {
  // Get marketplace listing by ID
  async getListingById(listingId: string): Promise<MarketplaceListingWithResearch | null> {
    if (!supabase) {
      console.warn('Supabase client not configured, returning null');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select(
          `
          *,
          research:research_items(
            *,
            user:users(username, wallet_address)
          )
        `
        )
        .eq('id', listingId)
        .single();

      if (error) {
        console.error('Error fetching marketplace listing by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getListingById:', error);
      return null;
    }
  },

  // Grant access to marketplace item
  async grantAccess(
    listingId: string,
    userIdOrDemoIp: string,
    transactionId?: string,
    isDemoMode: boolean = false
  ): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase client not configured');
      return false;
    }

    try {
      // Get listing and research details
      const listing = await this.getListingById(listingId);
      if (!listing) {
        console.error('Listing not found');
        return false;
      }

      // Create access record
      const accessData: Partial<MarketplaceAccess> = {
        listing_id: listingId,
        research_id: listing.research_id,
        transaction_id: transactionId,
        access_type: isDemoMode ? 'demo' : 'purchased',
        is_demo: isDemoMode,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (isDemoMode) {
        accessData.demo_ip = userIdOrDemoIp;
      } else {
        accessData.user_id = userIdOrDemoIp;
      }

      const { data, error } = await supabase.from('marketplace_access').insert(accessData).select().single();

      if (error) {
        console.error('Error creating access record:', error);
        return false;
      }

      console.log(`Access granted to listing ${listingId} for ${isDemoMode ? 'demo IP' : 'user'} ${userIdOrDemoIp}`);
      return true;
    } catch (error) {
      console.error('Error granting access:', error);
      return false;
    }
  },

  // Check if user has access to marketplace item
  async hasAccess(listingId: string, userIdOrDemoIp: string, isDemoMode: boolean = false): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase client not configured');
      return false;
    }

    try {
      let query = supabase.from('marketplace_access').select('id').eq('listing_id', listingId);

      if (isDemoMode) {
        query = query.eq('demo_ip', userIdOrDemoIp).eq('is_demo', true);
      }
      // } else {
      //   query = query.eq('user_id', userIdOrDemoIp).eq('is_demo', false);
      // }

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking access:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in hasAccess:', error);
      return false;
    }
  },

  // Get user's purchased marketplace items
  async getUserPurchases(userIdOrDemoIp: string, isDemoMode: boolean = false): Promise<MarketplaceListingWithResearch[]> {
    if (!supabase) {
      console.warn('Supabase client not configured');
      return [];
    }

    try {
      let query = supabase.from('marketplace_access').select(`
          listing_id,
          marketplace_listings!inner(
            *,
            research:research_items(
              *,
              user:users(username, wallet_address)
            )
          )
        `);

      if (isDemoMode) {
        query = query.eq('demo_ip', userIdOrDemoIp).eq('is_demo', true);
      } else {
        query = query.eq('user_id', userIdOrDemoIp).eq('is_demo', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching user purchases:', error);
        return [];
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data?.map((item: any) => item.marketplace_listings).flat() || [];
    } catch (error) {
      console.error('Error in getUserPurchases:', error);
      return [];
    }
  },

  // Get active marketplace listings
  async getMarketplaceListings(
    page: number = 1,
    limit: number = 12,
    filters?: MarketplaceFilters
  ): Promise<PaginatedResponse<MarketplaceListingWithResearch>> {
    let query = supabase
      .from('marketplace_listings')
      .select(
        `
        *,
        research:research_items(
          *,
          user:users(username, wallet_address)
        )
      `
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.search) {
      query = query.or(`description.ilike.%${filters.search}%`);
    }

    if (filters?.category) {
      query = query.eq('research.category', filters.category);
    }

    if (filters?.priceRange) {
      query = query.gte('price_sei', filters.priceRange.min).lte('price_sei', filters.priceRange.max);
    }

    if (filters?.rating) {
      query = query.gte('rating_average', filters.rating);
    }

    // Apply sorting
    if (filters?.sortBy) {
      const sortOrder = filters.sortOrder || 'desc';
      if (filters.sortBy === 'price') {
        query = query.order('price_sei', { ascending: sortOrder === 'asc' });
      } else if (filters.sortBy === 'rating') {
        query = query.order('rating_average', { ascending: sortOrder === 'asc' });
      } else if (filters.sortBy === 'date') {
        query = query.order('created_at', { ascending: sortOrder === 'asc' });
      } else if (filters.sortBy === 'popularity') {
        query = query.order('views_count', { ascending: sortOrder === 'asc' });
      }
    }

    // Get total count
    const { count } = await supabase
      .from('marketplace_listings')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get paginated results
    const { data, error } = await query.range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Error fetching marketplace listings:', error);
      return { data: [], total: 0, page, limit, hasMore: false };
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      hasMore: page * limit < (count || 0)
    };
  },

  // Create marketplace listing
  async createListing(listingData: Partial<MarketplaceListing>): Promise<MarketplaceListing | null> {
    const { data, error } = await supabase.from('marketplace_listings').insert(listingData).select().single();

    if (error) {
      console.error('Error creating marketplace listing:', error);
      return null;
    }

    return data;
  },

  // Update marketplace listing
  async updateListing(id: string, updates: Partial<MarketplaceListing>): Promise<boolean> {
    const { error } = await supabase.from('marketplace_listings').update(updates).eq('id', id);

    if (error) {
      console.error('Error updating marketplace listing:', error);
      return false;
    }

    return true;
  }
};

// Chat management
export const chatService = {
  // Get user's chat sessions
  async getUserChatSessions(walletAddress: string): Promise<ChatSession[]> {
    const user = await userService.getUserByWallet(walletAddress);
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching chat sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserChatSessions:', error);
      return [];
    }
  },

  // Get demo chat sessions by IP
  async getDemoChatSessions(ipAddress: string): Promise<ChatSession[]> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('demo_ip', ipAddress)
      .eq('is_demo', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching demo chat sessions:', error);
      return [];
    }

    return data || [];
  },

  // Create chat session
  async createChatSession(sessionData: Partial<ChatSession>): Promise<ChatSession | null> {
    const { data, error } = await supabase.from('chat_sessions').insert(sessionData).select().single();

    if (error) {
      console.error('Error creating chat session:', error);
      return null;
    }

    return data;
  },

  // Get chat messages for a session
  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat messages:', error);
      return [];
    }

    return data || [];
  },

  // Get a single chat session by ID
  async getChatSession(sessionId: string): Promise<ChatSession | null> {
    const { data, error } = await supabase.from('chat_sessions').select('*').eq('id', sessionId).single();

    if (error) {
      console.error('Error fetching chat session:', error);
      return null;
    }

    return data;
  },

  // Add chat message
  async addChatMessage(messageData: Partial<ChatMessage>): Promise<ChatMessage | null> {
    const { data, error } = await supabase.from('chat_messages').insert(messageData).select().single();

    if (error) {
      console.error('Error adding chat message:', error);
      return null;
    }

    return data;
  },

  // Update chat session message count
  async updateMessageCount(sessionId: string, count: number): Promise<boolean> {
    const { error } = await supabase.from('chat_sessions').update({ message_count: count }).eq('id', sessionId);

    if (error) {
      console.error('Error updating message count:', error);
      return false;
    }

    return true;
  }
};

// Transaction management
export const transactionService = {
  // Get user's transactions
  async getUserTransactions(walletAddress: string): Promise<Transaction[]> {
    const user = await userService.getUserByWallet(walletAddress);
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserTransactions:', error);
      return [];
    }
  },

  // Get demo transactions by IP
  async getDemoTransactions(ipAddress: string): Promise<Transaction[]> {
    try {
      // For demo users, we'll return an empty array since the transactions table
      // doesn't have demo-specific fields yet
      // TODO: Implement proper demo transaction tracking
      console.warn('Demo transactions not fully implemented yet, returning empty array');
      return [];
    } catch (error) {
      console.error('Error fetching demo transactions:', error);
      return [];
    }
  },

  // Create transaction
  async createTransaction(transactionData: Partial<Transaction>): Promise<Transaction | null> {
    const { data, error } = await supabase.from('transactions').insert(transactionData).select().single();

    if (error) {
      console.error('Error creating transaction:', error);
      return null;
    }

    return data;
  },

  // Update transaction
  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<boolean> {
    const { error } = await supabase.from('transactions').update(updates).eq('id', id);

    if (error) {
      console.error('Error updating transaction:', error);
      return false;
    }

    return true;
  },

  // Get transaction by ID
  async getTransaction(id: string): Promise<Transaction | null> {
    const { data, error } = await supabase.from('transactions').select('*').eq('id', id).single();

    if (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }

    return data;
  }
};

// Types for realtime subscriptions
interface RealtimePayload<T = Record<string, unknown>> {
  new: T | null;
  old: T | null;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

// Real-time subscriptions
export const realtimeService = {
  // Subscribe to research updates
  subscribeToResearch(callback: (payload: RealtimePayload) => void) {
    return supabase
      .channel('research_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'research_items' }, callback)
      .subscribe();
  },

  // Subscribe to chat updates
  subscribeToChat(sessionId: string, callback: (payload: RealtimePayload) => void) {
    return supabase
      .channel(`chat_${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${sessionId}` },
        callback
      )
      .subscribe();
  },

  // Subscribe to marketplace updates
  subscribeToMarketplace(callback: (payload: RealtimePayload) => void) {
    return supabase
      .channel('marketplace_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketplace_listings' }, callback)
      .subscribe();
  }
};

// Utility functions
export const databaseUtils = {
  // Check if user can perform demo action
  async canPerformDemoAction(ipAddress: string, action: 'research' | 'chat'): Promise<boolean> {
    const demoUsage = await userService.getDemoUserByIP(ipAddress);

    if (!demoUsage) return true;

    if (action === 'research' && demoUsage.research_count >= 1) return false;
    if (action === 'chat' && demoUsage.chat_message_count >= 10) return false;

    return true;
  },

  // Get credit costs
  getCreditCosts(): Record<string, number> {
    return {
      simple: 5,
      full: 10,
      max: 20
    };
  },

  // Format SEI amount
  formatSEI(amount: string): string {
    const num = parseFloat(amount);
    return num.toFixed(6);
  },

  // Get user's remaining credits
  async getRemainingCredits(walletAddress: string): Promise<number> {
    const user = await userService.getUserByWallet(walletAddress);
    return user?.credits || 0;
  }
};
