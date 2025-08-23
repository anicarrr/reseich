import { useState, useEffect, useCallback } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { userService } from '../database';
import type { DemoLimits, User } from '../types';

interface UseDemoModeReturn {
  isDemoMode: boolean;
  demoUser: User | null;
  demoLimits: DemoLimits;
  canPerformAction: (action: 'research' | 'chat') => boolean;
  trackAction: (action: 'research' | 'chat') => Promise<boolean>;
  getClientIP: () => Promise<string>;
  resetDemoMode: () => void;
}

export const useDemoMode = (): UseDemoModeReturn => {
  const { primaryWallet, user: dynamicUser } = useDynamicContext();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoUser, setDemoUser] = useState<User | null>(null);
  const [demoLimits, setDemoLimits] = useState<DemoLimits>({
    researchCount: 0,
    chatMessageCount: 0,
    maxResearch: 1,
    maxChatMessages: 10
  });
  const [clientIP, setClientIP] = useState<string>('');

  // Get client IP address
  const getClientIP = useCallback(async (): Promise<string> => {
    if (clientIP) return clientIP;

    try {
      // Try to get IP from multiple services for redundancy
      const responses = await Promise.allSettled([
        fetch('https://api.ipify.org?format=json'),
        fetch('https://api64.ipify.org?format=json'),
        fetch('https://httpbin.org/ip')
      ]);

      for (const response of responses) {
        if (response.status === 'fulfilled' && response.value.ok) {
          const data = await response.value.json();
          const ip = data.ip || data.origin;
          if (ip) {
            setClientIP(ip);
            return ip;
          }
        }
      }

      // Fallback to a default IP if all services fail
      const fallbackIP = '127.0.0.1';
      setClientIP(fallbackIP);
      return fallbackIP;
    } catch (error) {
      console.error('Error getting client IP:', error);
      const fallbackIP = '127.0.0.1';
      setClientIP(fallbackIP);
      return fallbackIP;
    }
  }, [clientIP]);

  // Check if user can perform demo action
  const canPerformAction = useCallback(
    (action: 'research' | 'chat'): boolean => {
      if (!isDemoMode) return true;

      if (action === 'research') {
        return demoLimits.researchCount < demoLimits.maxResearch;
      }

      if (action === 'chat') {
        return demoLimits.chatMessageCount < demoLimits.maxChatMessages;
      }

      return false;
    },
    [isDemoMode, demoLimits]
  );

  // Track demo action
  const trackAction = useCallback(
    async (action: 'research' | 'chat'): Promise<boolean> => {
      if (!isDemoMode) return true;

      const ip = await getClientIP();
      const success = await userService.trackDemoUsage(ip, action);

      if (success) {
        // Update local state
        setDemoLimits((prev) => ({
          ...prev,
          researchCount: action === 'research' ? prev.researchCount + 1 : prev.researchCount,
          chatMessageCount: action === 'chat' ? prev.chatMessageCount + 1 : prev.chatMessageCount
        }));
      }

      return success;
    },
    [isDemoMode, getClientIP]
  );

  // Reset demo mode
  const resetDemoMode = useCallback(() => {
    setIsDemoMode(false);
    setDemoLimits({
      researchCount: 0,
      chatMessageCount: 0,
      maxResearch: 1,
      maxChatMessages: 10
    });
  }, []);

  // Initialize demo mode
  useEffect(() => {
    const initializeDemoMode = async () => {
      try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') return;

        // Check if user is already authenticated with a wallet
        if (primaryWallet || dynamicUser) {
          console.log(' about to abort demo mode');
          // User has wallet connected - don't initialize demo mode
          console.log('User is authenticated with wallet, skipping demo mode initialization');
          setIsDemoMode(false);
          setDemoUser(null);
          return;
        }

        // No wallet connected - proceed with demo mode initialization
        const ip = await getClientIP();

        try {
          const demoUsage = await userService.getDemoUserByIP(ip);

          if (demoUsage) {
            setIsDemoMode(true);
            setDemoLimits({
              researchCount: demoUsage.research_count,
              chatMessageCount: demoUsage.chat_message_count,
              maxResearch: 1,
              maxChatMessages: 10
            });

            // Create demo user from DemoUsage data
            const demoUserData: User = {
              id: `demo-${ip}`,
              wallet_address: `demo-${ip}`,
              display_name: 'Demo User',
              email: 'demo@example.com',
              username: 'demo',
              avatar_url: '',
              credits: 1000,
              is_demo_user: true,
              demo_ip: ip,
              research_count: demoUsage.research_count,
              created_at: demoUsage.created_at,
              updated_at: demoUsage.updated_at
            };
            setDemoUser(demoUserData);
          }
        } catch (dbError) {
          // Database not set up yet or connection failed - fallback to demo mode
          console.warn('Demo mode database not available, using fallback:', dbError);
          setIsDemoMode(true);

          // Create fallback demo user
          const fallbackDemoUser: User = {
            id: `demo-${ip}`,
            wallet_address: `demo-${ip}`,
            display_name: 'Demo User',
            email: 'demo@example.com',
            username: 'demo',
            avatar_url: '',
            credits: 1000,
            is_demo_user: true,
            demo_ip: ip,
            research_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setDemoUser(fallbackDemoUser);
        }
      } catch (error) {
        console.warn('Error initializing demo mode, using fallback:', error);
        // Fallback to demo mode if everything fails (only if no wallet is connected)
        if (!primaryWallet || !dynamicUser) {
          setIsDemoMode(true);

          // Create fallback demo user
          const fallbackDemoUser: User = {
            id: 'demo-fallback',
            wallet_address: 'demo-fallback',
            display_name: 'Demo User',
            email: 'demo@example.com',
            username: 'demo',
            avatar_url: '',
            credits: 1000,
            is_demo_user: true,
            demo_ip: '127.0.0.1',
            research_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setDemoUser(fallbackDemoUser);
        }
      }
    };

    initializeDemoMode();
  }, [getClientIP, primaryWallet, dynamicUser]);

  // Check demo mode status periodically
  useEffect(() => {
    if (!isDemoMode) return;

    // Check if we're in a browser environment
    if (typeof window === 'undefined') return;

    const interval = setInterval(async () => {
      try {
        const ip = await getClientIP();

        try {
          const demoUsage = await userService.getDemoUserByIP(ip);

          if (demoUsage) {
            setDemoLimits({
              researchCount: demoUsage.research_count,
              chatMessageCount: demoUsage.chat_message_count,
              maxResearch: 1,
              maxChatMessages: 10
            });

            // Update demo user with latest data
            setDemoUser((prev) =>
              prev
                ? {
                    ...prev,
                    research_count: demoUsage.research_count,
                    updated_at: demoUsage.updated_at
                  }
                : null
            );
          }
        } catch (dbError) {
          // Database not available - skip update
          console.warn('Demo mode database not available for periodic check:', dbError);
        }
      } catch (error) {
        console.warn('Error updating demo limits:', error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isDemoMode, getClientIP]);

  return {
    isDemoMode,
    demoUser,
    demoLimits,
    canPerformAction,
    trackAction,
    getClientIP,
    resetDemoMode
  };
};

// Hook for checking if user should be in demo mode
export const useDemoModeCheck = (walletAddress?: string) => {
  const [shouldUseDemoMode, setShouldUseDemoMode] = useState(false);

  useEffect(() => {
    setShouldUseDemoMode(!walletAddress || walletAddress === '');
  }, [walletAddress]);

  return shouldUseDemoMode;
};

// Hook for demo mode UI state
export const useDemoModeUI = (isDemoMode: boolean, demoLimits: DemoLimits) => {
  const getDemoStatusMessage = useCallback(() => {
    if (!isDemoMode) return null;

    const remainingResearch = demoLimits.maxResearch - demoLimits.researchCount;
    const remainingChat = demoLimits.maxChatMessages - demoLimits.chatMessageCount;

    if (remainingResearch === 0 && remainingChat === 0) {
      return {
        type: 'warning' as const,
        message: 'Demo mode limit reached. Connect your wallet to continue.',
        action: 'Connect Wallet'
      };
    }

    return {
      type: 'info' as const,
      message: `Demo Mode: ${remainingResearch} research, ${remainingChat} chat messages remaining`,
      action: 'Upgrade'
    };
  }, [isDemoMode, demoLimits]);

  const getDemoProgress = useCallback(() => {
    if (!isDemoMode) return null;

    return {
      research: (demoLimits.researchCount / demoLimits.maxResearch) * 100,
      chat: (demoLimits.chatMessageCount / demoLimits.maxChatMessages) * 100
    };
  }, [isDemoMode, demoLimits]);

  return {
    getDemoStatusMessage,
    getDemoProgress
  };
};
