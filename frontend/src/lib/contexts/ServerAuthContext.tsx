'use client';

import React, { createContext, useContext, ReactNode } from 'react';

interface ServerAuthData {
  clientIP: string;
  userAgent?: string;
  timestamp: number;
  isServerSide: boolean;
}

interface ServerAuthContextType {
  serverData: ServerAuthData;
  getClientIP: () => string;
  getServerTimestamp: () => number;
}

const ServerAuthContext = createContext<ServerAuthContextType | undefined>(undefined);

interface ServerAuthProviderProps {
  children: ReactNode;
  serverData: Omit<ServerAuthData, 'isServerSide'>;
}

/**
 * Provider component that makes server-side data available to client components
 * This allows you to pass server-side data (like client IP) to client components
 * without making additional API calls
 */
export function ServerAuthProvider({ children, serverData }: ServerAuthProviderProps) {
  const contextValue: ServerAuthContextType = {
    serverData: {
      ...serverData,
      isServerSide: true,
    },
    getClientIP: () => serverData.clientIP,
    getServerTimestamp: () => serverData.timestamp,
  };

  return (
    <ServerAuthContext.Provider value={contextValue}>
      {children}
    </ServerAuthContext.Provider>
  );
}

/**
 * Hook to access server-side auth data in client components
 */
export function useServerAuth(): ServerAuthContextType {
  const context = useContext(ServerAuthContext);
  if (context === undefined) {
    throw new Error('useServerAuth must be used within a ServerAuthProvider');
  }
  return context;
}

/**
 * Hook to check if we're running with server-side data
 */
export function useHasServerData(): boolean {
  const context = useContext(ServerAuthContext);
  return context?.serverData.isServerSide || false;
}
