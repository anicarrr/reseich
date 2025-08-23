# Server-Side Implementation Guide

## Overview

This guide explains how to implement server-side data fetching to avoid CORS issues when calling external APIs. The solution replaces client-side calls to external IP detection services with server-side data extraction using Next.js headers.

## Problem Solved

**Before**: The `useAuth` hook was calling external APIs like:
- `https://api.ipify.org?format=json`
- `https://api64.ipify.org?format=json`
- `https://httpbin.org/ip`

**Issues**:
- CORS errors in some browsers
- Dependency on external services
- Slower performance due to additional HTTP requests
- Potential rate limiting

**After**: Server-side data extraction using Next.js headers
- No CORS issues
- Better performance
- More reliable IP detection
- SEO friendly

## Implementation

### 1. API Route (`/api/ip`)

```typescript
// frontend/src/app/api/ip/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getClientIPFromRequest } from '@/lib/utils/serverUtils';

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIPFromRequest(request);
    
    return NextResponse.json({ 
      ip: clientIP,
      success: true 
    });
  } catch (error) {
    return NextResponse.json(
      { ip: '127.0.0.1', success: false, error: 'Failed to get client IP' },
      { status: 500 }
    );
  }
}
```

### 2. Utility Functions

```typescript
// frontend/src/lib/utils/serverUtils.ts
import { NextRequest } from 'next/server';

export function getClientIPFromRequest(request: NextRequest): string {
  // Extract IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  // Implementation details...
}
```

### 3. Updated useAuth Hook

```typescript
// frontend/src/lib/hooks/useAuth.ts
const getClientIP = useCallback(async (): Promise<string> => {
  try {
    // Now calls our local API instead of external services
    const response = await fetch('/api/ip');
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.ip) {
        return data.ip;
      }
    }
    return '127.0.0.1';
  } catch (error) {
    console.error('Error getting client IP:', error);
    return '127.0.0.1';
  }
}, []);
```

## Usage Patterns

### Pattern 1: API Route (Recommended for most cases)

```typescript
// In your client component
const getClientIP = async () => {
  const response = await fetch('/api/ip');
  const data = await response.json();
  return data.ip;
};
```

### Pattern 2: Server-Side Props in Page Components

```typescript
// In your page component (server component)
import { headers } from 'next/headers';
import { getServerSideData } from '@/lib/utils/serverUtils';

export default async function MyPage() {
  const headersList = await headers();
  const mockRequest = { headers: new Map(headersList.entries()) } as any;
  const serverData = getServerSideData(mockRequest);
  
  return (
    <div>
      <p>Client IP: {serverData.clientIP}</p>
      <ClientComponent serverData={serverData} />
    </div>
  );
}
```

### Pattern 3: Context Provider Pattern

```typescript
// In your page component
import { ServerAuthProvider } from '@/lib/contexts/ServerAuthContext';

export default async function MyPage() {
  const serverData = getServerSideData(request);
  
  return (
    <ServerAuthProvider serverData={serverData}>
      <ClientComponent />
    </ServerAuthProvider>
  );
}

// In your client component
import { useServerAuth } from '@/lib/contexts/ServerAuthContext';

function ClientComponent() {
  const { getClientIP } = useServerAuth();
  const clientIP = getClientIP();
  
  return <div>IP: {clientIP}</div>;
}
```

## Benefits

### ✅ **No CORS Issues**
- All external API calls are replaced with server-side data extraction
- Data flows from server → client, not client → external server

### ✅ **Better Performance**
- No additional HTTP requests needed
- Data is available immediately during server-side rendering

### ✅ **More Reliable**
- Server-side IP detection is more accurate
- No dependency on external services
- Works even if external APIs are down

### ✅ **SEO Friendly**
- Data is available during server-side rendering
- Better for search engine optimization

### ✅ **Security**
- Client IP is extracted server-side, more secure
- No exposure of external API endpoints to client

## Migration Guide

### Step 1: Update useAuth Hook
The `useAuth` hook has been updated to use `/api/ip` instead of external APIs.

### Step 2: Add API Route
Ensure the `/api/ip` route is available in your application.

### Step 3: Update Components (Optional)
If you want to use server-side props, wrap your components with the appropriate providers.

### Step 4: Test
Verify that IP detection still works and CORS errors are resolved.

## Example Implementation

See the example page at `/example-server-side` for a complete demonstration of the server-side approach.

## Troubleshooting

### IP Detection Not Working
1. Check that the `/api/ip` route is accessible
2. Verify Next.js headers are being passed correctly
3. Check server logs for errors

### Still Getting CORS Errors
1. Ensure you're not calling external APIs directly
2. Verify all IP detection goes through `/api/ip`
3. Check that your proxy/load balancer forwards headers correctly

### Performance Issues
1. The server-side approach should be faster
2. If slower, check for unnecessary re-renders
3. Consider caching if IP detection is called frequently

## Future Enhancements

- Add caching for IP detection results
- Implement IP geolocation using server-side services
- Add rate limiting for the `/api/ip` endpoint
- Consider using Edge Runtime for better performance
