import { useState, useEffect, useCallback } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { AuthService, type AuthUser } from '../services/authService';

export interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  login: (
    walletAddress: string,
    userData?: { username?: string; email?: string; avatar_url?: string }
  ) => Promise<AuthUser | null>;
  logout: () => void;
  updateProfile: (updates: Partial<AuthUser>) => Promise<boolean>;
}

export const useAuth = (): UseAuthReturn => {
  const { primaryWallet, user: dynamicUser, handleUnlinkWallet } = useDynamicContext();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get client IP address from our server-side API
  const getClientIP = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch('/api/ip');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.ip) {
          return data.ip;
        }
      }
      
      // Fallback to a default IP if the API fails
      return '127.0.0.1';
    } catch (error) {
      console.error('Error getting client IP:', error);
      return '127.0.0.1';
    }
  }, []);

  // Initialize authentication
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (primaryWallet) {
          // User has wallet connected
          const authUser = await AuthService.authenticateUser(primaryWallet.address);
          if (authUser) {
            setUser(authUser);
          }
        } else {
          // No wallet connected - check for demo user
          try {
            const clientIP = await getClientIP();
            if (clientIP) {
              const demoUser = await AuthService.getOrCreateUser(undefined, clientIP);
              if (demoUser) {
                setUser(demoUser);
              }
            }
          } catch (error) {
            console.error('Error checking demo user:', error);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [primaryWallet, dynamicUser, getClientIP]);

  // Handle wallet connection changes
  useEffect(() => {
    if (primaryWallet && dynamicUser) {
      const authenticateUser = async () => {
        try {
          const authUser = await AuthService.authenticateUser(primaryWallet.address, {
            username: dynamicUser.username || undefined,
            email: dynamicUser.email || undefined,
            avatar_url: undefined // UserProfile doesn't have avatar_url
          });
          setUser(authUser);
        } catch (error) {
          console.error('Error authenticating user:', error);
        }
      };

      authenticateUser();
    }
  }, [primaryWallet, dynamicUser]);

  const login = useCallback(
    async (
      walletAddress: string,
      userData?: { username?: string; email?: string; avatar_url?: string }
    ): Promise<AuthUser | null> => {
      try {
        const authUser = await AuthService.authenticateUser(walletAddress, userData);
        setUser(authUser);
        return authUser;
      } catch (error) {
        console.error('Error logging in:', error);
        return null;
      }
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    if (primaryWallet) {
      handleUnlinkWallet(primaryWallet.address);
    }
  }, [primaryWallet, handleUnlinkWallet]);

  const updateProfile = useCallback(
    async (updates: Partial<AuthUser>): Promise<boolean> => {
      if (!user) return false;

      try {
        const success = await AuthService.updateUserProfile(user.wallet_address, updates);
        if (success) {
          // Update local user state
          setUser((prev) => (prev ? { ...prev, ...updates } : null));
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error updating profile:', error);
        return false;
      }
    },
    [user]
  );

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    isDemoMode: user?.is_demo_user || false,
    login,
    logout,
    updateProfile
  };
};
