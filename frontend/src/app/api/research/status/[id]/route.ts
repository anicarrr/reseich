import { NextRequest, NextResponse } from 'next/server';
import { researchService } from '@/lib/database';
import { ResearchItem } from '@/lib/types';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: researchId } = await params;

    // Get research item status
    const research = await researchService.getResearchById(researchId);
    if (!research) {
      return NextResponse.json({ error: 'Research not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: research.id,
      status: research.status,
      progress: research.progress || 0,
      estimated_completion: research.estimated_completion,
      result_content: research.result_content,
      result_file_url: research.result_file_url,
      created_at: research.created_at,
      updated_at: research.updated_at
    });
  } catch (error) {
    console.error('Error fetching research status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Webhook endpoint for n8n to update research status
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: researchId } = await params;
    const body = await request.json();

    // Validate webhook payload
    const { status, progress, result_content, result_file_url, estimated_completion } = body;

    if (!status || !['pending', 'processing', 'completed', 'failed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update research item
    const updateData: Partial<ResearchItem> = {
      status: status as 'pending' | 'processing' | 'completed' | 'failed',
      updated_at: new Date().toISOString()
    };

    if (progress !== undefined) updateData.progress = progress;
    if (result_content !== undefined) updateData.result_content = result_content;
    if (result_file_url !== undefined) updateData.result_file_url = result_file_url;
    if (estimated_completion !== undefined) updateData.estimated_completion = estimated_completion;

    const success = await researchService.updateResearch(researchId, updateData);

    if (!success) {
      return NextResponse.json({ error: 'Failed to update research' }, { status: 500 });
    }

    // If research is completed, send email notification (if configured)
    if (status === 'completed' && result_content) {
      // Trigger email delivery workflow
      try {
        const emailPayload = {
          'form-id': 'email', // Use hyphen to match n8n workflow expectation
          research_id: researchId,
          result_content,
          result_file_url,
          callback_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/api/email/send`
        };

        await fetch(process.env.N8N_WEBHOOK_URL!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPayload)
        });
      } catch (emailError) {
        console.error('Failed to trigger email workflow:', emailError);
        // Don't fail the webhook, just log the error
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating research status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
