import { NextRequest } from 'next/server';

export interface ServerSideData {
  clientIP: string;
  userAgent?: string;
  timestamp: number;
}

/**
 * Get client IP address from request headers
 * This function can be used in server components or API routes
 */
export function getClientIPFromRequest(request: NextRequest): string {
  try {
    // Get client IP from request headers (Next.js provides this)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    
    let clientIP = '127.0.0.1';
    
    // Try to get the real client IP from various headers
    if (cfConnectingIp) {
      clientIP = cfConnectingIp;
    } else if (realIp) {
      clientIP = realIp;
    } else if (forwarded) {
      // x-forwarded-for can contain multiple IPs, take the first one
      clientIP = forwarded.split(',')[0].trim();
    }
    
    // Validate IP format
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(clientIP)) {
      clientIP = '127.0.0.1';
    }
    
    return clientIP;
  } catch (error) {
    console.error('Error getting client IP from request:', error);
    return '127.0.0.1';
  }
}

/**
 * Get comprehensive server-side data from request
 */
export function getServerSideData(request: NextRequest): ServerSideData {
  return {
    clientIP: getClientIPFromRequest(request),
    userAgent: request.headers.get('user-agent') || undefined,
    timestamp: Date.now(),
  };
}

/**
 * Create headers for client-side fetch requests
 * Useful for maintaining consistency between server and client requests
 */
export function createRequestHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  };
}
