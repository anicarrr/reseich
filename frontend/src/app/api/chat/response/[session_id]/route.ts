import { NextRequest, NextResponse } from 'next/server';
import { chatService } from '@/lib/database';

export async function POST(request: NextRequest, { params }: { params: Promise<{ session_id: string }> }) {
  try {
    const { session_id: sessionId } = await params;
    const body = await request.json();

    const { response, error: aiError } = body;

    if (aiError) {
      console.error('AI chat error:', aiError);
      return NextResponse.json({ error: 'AI processing failed' }, { status: 500 });
    }

    if (!response) {
      return NextResponse.json({ error: 'No response content' }, { status: 400 });
    }

    // Add AI response to chat
    const aiMessage = await chatService.addChatMessage({
      session_id: sessionId,
      content: response,
      is_user: false,
      user_id: null,
      demo_ip: null,
      is_demo: false
    });

    if (!aiMessage) {
      return NextResponse.json({ error: 'Failed to save AI response' }, { status: 500 });
    }

    // Update session message count
    const session = await chatService.getChatSession(sessionId);
    if (session) {
      await chatService.updateMessageCount(sessionId, (session.message_count || 0) + 1);
    }

    return NextResponse.json({
      success: true,
      message_id: aiMessage.id,
      message: 'AI response saved successfully'
    });
  } catch (error) {
    console.error('Error saving AI response:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
