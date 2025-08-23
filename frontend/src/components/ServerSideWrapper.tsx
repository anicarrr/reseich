'use client';

import React from 'react';

interface ServerSideWrapperProps {
  clientIP: string;
  userAgent?: string;
  timestamp: number;
  children: React.ReactNode;
}

/**
 * Wrapper component that receives server-side data as props
 * This component can be used to pass server-side data to client components
 */
export function ServerSideWrapper({ 
  clientIP, 
  userAgent, 
  timestamp, 
  children 
}: ServerSideWrapperProps) {
  // You can use the server-side data here or pass it down to children
  const serverData = {
    clientIP,
    userAgent,
    timestamp,
    formattedTime: new Date(timestamp).toLocaleString()
  };

  return (
    <div>
      {/* Optionally display server-side data for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50">
          <div>IP: {clientIP}</div>
          <div>Time: {serverData.formattedTime}</div>
        </div>
      )}
      
      {/* Pass server data to children via context or props */}
      {children}
    </div>
  );
}
