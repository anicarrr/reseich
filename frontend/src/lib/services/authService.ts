import { userService } from '../database';
import type { User, DemoUsage } from '../types';

export interface AuthUser {
  id: string;
  wallet_address: string;
  username?: string;
  email?: string;
  avatar_url?: string;
  display_name?: string;
  credits: number;
  research_count?: number;
  is_demo_user: boolean;
  demo_ip?: string;
  created_at: string;
  updated_at: string;
}

export class AuthService {
  /**
   * Handle user authentication - creates new user if first time, or returns existing user
   */
  static async authenticateUser(
    walletAddress: string,
    userData?: {
      username?: string;
      email?: string;
      avatar_url?: string;
    }
  ): Promise<AuthUser> {
    try {
      console.log('🔐 Authenticating user with wallet:', walletAddress);
      
      // Check if user already exists
      const existingUser = await userService.getUserByWallet(walletAddress);

      if (existingUser) {
        console.log('✅ User already exists:', existingUser.username);
        // User exists, return existing user data
        return {
          id: existingUser.id,
          wallet_address: existingUser.wallet_address,
          username: existingUser.username,
          email: existingUser.email,
          avatar_url: existingUser.avatar_url,
          credits: existingUser.credits,
          is_demo_user: existingUser.is_demo_user,
          demo_ip: existingUser.demo_ip,
          created_at: existingUser.created_at,
          updated_at: existingUser.updated_at
        };
      }

      console.log('🆕 Creating new user for wallet:', walletAddress);
      
      // User doesn't exist, create new user
      const newUser: Partial<User> = {
        wallet_address: walletAddress,
        username: userData?.username || `User_${walletAddress.slice(2, 8)}`,
        email: userData?.email,
        avatar_url: userData?.avatar_url,
        credits: 100, // Default credits for new users
        is_demo_user: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📝 New user data:', newUser);

      const createdUser = await userService.upsertUser(newUser);

      if (!createdUser) {
        console.error('❌ Failed to create new user');
        throw new Error('Failed to create new user');
      }

      console.log('✅ New user created successfully:', createdUser.username);

      return {
        id: createdUser.id,
        wallet_address: createdUser.wallet_address,
        username: createdUser.username,
        email: createdUser.email,
        avatar_url: createdUser.avatar_url,
        credits: createdUser.credits,
        is_demo_user: createdUser.is_demo_user,
        demo_ip: createdUser.demo_ip,
        created_at: createdUser.created_at,
        updated_at: createdUser.updated_at
      };
    } catch (error) {
      console.error('❌ Error in authenticateUser:', error);
      throw error;
    }
  }

  /**
   * Track demo user by IP address
   */
  static async trackDemoUser(ipAddress: string): Promise<DemoUsage | null> {
    try {
      // Check if demo user already exists for this IP
      const demoUsage = await userService.getDemoUserByIP(ipAddress);

      if (demoUsage) {
        // Update last activity - find the user by demo IP and update
        try {
          const demoUser = await userService.getUserByWallet(`demo_${ipAddress}`);
          if (demoUser) {
            await userService.updateUser(demoUser.wallet_address, {
              updated_at: new Date().toISOString()
            });
          }
        } catch (updateError) {
          console.warn('Failed to update demo user activity:', updateError);
        }
        return demoUsage;
      }

      // Create new demo user record in users table
      const newDemoUser: Partial<User> = {
        wallet_address: `demo_${ipAddress}`,
        username: `Demo User`,
        credits: 0,
        is_demo_user: true,
        demo_ip: ipAddress,
        demo_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const createdDemoUser = await userService.upsertUser(newDemoUser);

      if (!createdDemoUser) {
        throw new Error('Failed to create demo user');
      }

      // Try to create demo usage record, but don't fail if table doesn't exist
      try {
        const demoUsageData: Partial<DemoUsage> = {
          ip_address: ipAddress,
          research_count: 0,
          chat_message_count: 0,
          first_visit_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
          is_blocked: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Try to insert into demo_usage table
        await userService.createDemoUsageRecord(demoUsageData);
      } catch (demoTableError) {
        console.warn('Demo usage table not available, continuing without it:', demoTableError);
      }

      // Return demo user data even if demo_usage table fails
      return {
        id: createdDemoUser.id,
        ip_address: ipAddress,
        research_count: 0,
        chat_message_count: 0,
        first_visit_at: createdDemoUser.created_at,
        last_activity_at: createdDemoUser.updated_at,
        is_blocked: false,
        created_at: createdDemoUser.created_at,
        updated_at: createdDemoUser.updated_at
      };
    } catch (error) {
      console.error('Error in trackDemoUser:', error);
      return null;
    }
  }

  /**
   * Get or create user based on wallet connection or demo mode
   */
  static async getOrCreateUser(walletAddress?: string, ipAddress?: string): Promise<AuthUser | null> {
    try {
      if (walletAddress) {
        // User has wallet connected
        return await this.authenticateUser(walletAddress);
      } else if (ipAddress) {
        // Demo user - track by IP
        try {
          const demoUsage = await this.trackDemoUser(ipAddress);
          if (demoUsage) {
            return {
              id: demoUsage.id,
              wallet_address: `demo_${ipAddress}`,
              username: 'Demo User',
              credits: 1000, // Demo users get unlimited credits for display
              is_demo_user: true,
              demo_ip: ipAddress,
              created_at: demoUsage.created_at,
              updated_at: demoUsage.updated_at
            };
          }
        } catch (demoError) {
          console.warn('Failed to track demo user, creating basic demo user:', demoError);
          // Fallback: create a basic demo user without demo_usage table
          const fallbackDemoUser: AuthUser = {
            id: `demo_${ipAddress}`,
            wallet_address: `demo_${ipAddress}`,
            username: 'Demo User',
            credits: 0,
            is_demo_user: true,
            demo_ip: ipAddress,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          return fallbackDemoUser;
        }
      }

      return null;
    } catch (error) {
      console.error('Error in getOrCreateUser:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(
    walletAddress: string,
    updates: Partial<Pick<User, 'username' | 'email' | 'avatar_url'>>
  ): Promise<boolean> {
    try {
      return await userService.updateUser(walletAddress, updates);
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  /**
   * Get user by wallet address or demo IP
   */
  static async getUser(identifier: string, isDemo: boolean = false): Promise<AuthUser | null> {
    try {
      if (isDemo) {
        // For demo users, identifier is the IP address
        try {
          const demoUsage = await userService.getDemoUserByIP(identifier);
          if (demoUsage) {
            return {
              id: demoUsage.id,
              wallet_address: `demo_${identifier}`,
              username: 'Demo User',
              credits: 0,
              is_demo_user: true,
              demo_ip: identifier,
              created_at: demoUsage.created_at,
              updated_at: demoUsage.updated_at
            };
          }
        } catch (demoError) {
          console.warn('Failed to get demo user from demo_usage table, creating fallback:', demoError);
          // Fallback: create a basic demo user without demo_usage table
          const fallbackDemoUser: AuthUser = {
            id: `demo_${identifier}`,
            wallet_address: `demo_${identifier}`,
            username: 'Demo User',
            credits: 0,
            is_demo_user: true,
            demo_ip: identifier,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          return fallbackDemoUser;
        }
      } else {
        // For registered users, identifier is the wallet address
        const user = await userService.getUserByWallet(identifier);
        if (user) {
          return {
            id: user.id,
            wallet_address: user.wallet_address,
            username: user.username,
            email: user.email,
            avatar_url: user.avatar_url,
            credits: user.credits,
            is_demo_user: user.is_demo_user,
            demo_ip: user.demo_ip,
            created_at: user.created_at,
            updated_at: user.updated_at
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error in getUser:', error);
      return null;
    }
  }

  /**
   * Migrate demo user to real wallet user
   */
  static async migrateDemoToRealUser(
    demoIP: string,
    realWalletAddress: string,
    userData?: {
      username?: string;
      email?: string;
      avatar_url?: string;
    }
  ): Promise<AuthUser | null> {
    try {
      console.log('🔄 Starting migration from demo IP:', demoIP, 'to wallet:', realWalletAddress);
      
      // Get the demo user from users table
      const demoUser = await userService.getUserByWallet(`demo_${demoIP}`);
      if (!demoUser) {
        console.log('❌ No demo user found for IP:', demoIP);
        return null;
      }
      
      // Check if real wallet user already exists
      let realUser = await userService.getUserByWallet(realWalletAddress);
      
      if (realUser) {
        console.log('✅ Real wallet user already exists, merging credits');
        // User already exists, merge the credits from demo user
        const totalCredits = realUser.credits + demoUser.credits;
        await userService.updateUser(realWalletAddress, { credits: totalCredits });
        
        // Delete demo user
        try {
          await userService.deleteUser(`demo_${demoIP}`);
        } catch (e) {
          console.warn('Could not delete demo user:', e);
        }
        
        // Return updated real user
        realUser = await userService.getUserByWallet(realWalletAddress);
        if (!realUser) return null;
        
        return {
          id: realUser.id,
          wallet_address: realUser.wallet_address,
          username: realUser.username,
          email: realUser.email,
          avatar_url: realUser.avatar_url,
          credits: realUser.credits,
          is_demo_user: false,
          demo_ip: undefined,
          created_at: realUser.created_at,
          updated_at: realUser.updated_at
        };
      } else {
        console.log('🆕 Creating new real wallet user with demo data');
        // Create new real user with demo user's data
        const newUser: Partial<User> = {
          wallet_address: realWalletAddress,
          username: userData?.username || demoUser.username,
          email: userData?.email || demoUser.email,
          avatar_url: userData?.avatar_url || demoUser.avatar_url,
          credits: demoUser.credits, // Keep demo user's credits
          is_demo_user: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const createdUser = await userService.upsertUser(newUser);
        if (!createdUser) {
          console.error('❌ Failed to create migrated user');
          return null;
        }
        
        // Delete demo user after successful migration
        try {
          await userService.deleteUser(`demo_${demoIP}`);
        } catch (e) {
          console.warn('Could not delete demo user:', e);
        }
        
        console.log('✅ Migration completed successfully');
        
        return {
          id: createdUser.id,
          wallet_address: createdUser.wallet_address,
          username: createdUser.username,
          email: createdUser.email,
          avatar_url: createdUser.avatar_url,
          credits: createdUser.credits,
          is_demo_user: false,
          demo_ip: undefined,
          created_at: createdUser.created_at,
          updated_at: createdUser.updated_at
        };
      }
    } catch (error) {
      console.error('❌ Error migrating demo user:', error);
      return null;
    }
  }
}
