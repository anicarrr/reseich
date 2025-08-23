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
    console.error('Error getting client IP:', error);
    return NextResponse.json(
      { 
        ip: '127.0.0.1', 
        success: false, 
        error: 'Failed to get client IP' 
      },
      { status: 500 }
    );
  }
}
