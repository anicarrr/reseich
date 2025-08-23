import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { getServerSideData } from '@/lib/utils/serverUtils';

/**
 * Example page demonstrating server-side props
 * This page gets client IP and other data server-side, avoiding CORS issues
 */
export default async function ExampleServerSidePage() {
  // Get headers on the server side
  const headersList = await headers();
  
  // Create a mock request object with the headers
  const mockRequest = {
    headers: new Map(headersList.entries())
  } as unknown as NextRequest;
  
  // Get server-side data
  const serverData = getServerSideData(mockRequest);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          Server-Side Props Example
        </h1>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Server-Side Data (No CORS Issues)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-2">Client IP</h3>
              <p className="text-gray-300 font-mono">{serverData.clientIP}</p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-2">Timestamp</h3>
              <p className="text-gray-300 font-mono">
                {new Date(serverData.timestamp).toLocaleString()}
              </p>
            </div>
            
            {serverData.userAgent && (
              <div className="bg-white/5 rounded-lg p-4 md:col-span-2">
                <h3 className="text-lg font-medium text-white mb-2">User Agent</h3>
                <p className="text-gray-300 font-mono text-sm break-all">
                  {serverData.userAgent}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">
            How It Works
          </h2>
          
          <div className="space-y-4 text-gray-300">
            <p>
              ✅ <strong>No CORS Issues:</strong> Data is fetched server-side using Next.js headers
            </p>
            <p>
              ✅ <strong>Better Performance:</strong> No additional client-side API calls needed
            </p>
            <p>
              ✅ <strong>More Reliable:</strong> Server-side IP detection is more accurate
            </p>
            <p>
              ✅ <strong>SEO Friendly:</strong> Data is available during server-side rendering
            </p>
          </div>
          
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <h3 className="text-lg font-medium text-blue-300 mb-2">Usage Pattern:</h3>
            <pre className="text-sm text-blue-200 overflow-x-auto">
{`// In your page component:
import { headers } from 'next/headers';
import { getServerSideData } from '@/lib/utils/serverUtils';

export default async function MyPage() {
  const headersList = await headers();
  const mockRequest = { headers: new Map(headersList.entries()) } as any;
  const serverData = getServerSideData(mockRequest);
  
  return <div>Client IP: {serverData.clientIP}</div>;
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
