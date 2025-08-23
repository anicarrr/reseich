import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const researchId = formData.get('research_id') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!researchId) {
      return NextResponse.json({ error: 'Research ID required' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain', 'application/json'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF, TXT, and JSON files are allowed' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB' }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `research-${researchId}-${timestamp}.${fileExtension}`;

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET || 'research-files')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET || 'research-files')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      file_url: urlData.publicUrl,
      file_name: fileName,
      file_size: file.size,
      file_type: file.type
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
