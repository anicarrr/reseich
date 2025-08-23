import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { chatService, userService } from '@/lib/database';

const chatMessageSchema = z.object({
  session_id: z.string().uuid(),
  message: z.string().min(1, 'Message cannot be empty'),
  wallet_address: z.string().optional(),
  demo_ip: z.string().optional(),
  is_demo: z.boolean().default(false)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = chatMessageSchema.parse(body);

    // Check demo mode limits
    if (validatedData.is_demo && validatedData.demo_ip) {
      const demoUsage = await userService.getDemoUserByIP(validatedData.demo_ip);
      if (demoUsage && demoUsage.chat_message_count >= 10) {
        return NextResponse.json({ error: 'Demo users are limited to 10 chat messages' }, { status: 403 });
      }
    }

    // Add user message to chat
    const userMessage = await chatService.addChatMessage({
      session_id: validatedData.session_id,
      content: validatedData.message,
      is_user: true,
      user_id: validatedData.is_demo ? null : (await userService.getUserByWallet(validatedData.wallet_address!))?.id,
      demo_ip: validatedData.demo_ip || null,
      is_demo: validatedData.is_demo
    });

    if (!userMessage) {
      return NextResponse.json({ error: 'Failed to save user message' }, { status: 500 });
    }

    // Track demo usage
    if (validatedData.is_demo && validatedData.demo_ip) {
      await userService.trackDemoUsage(validatedData.demo_ip, 'chat');
    }

    // Trigger n8n chat workflow
    const chatPayload = {
      'form-id': 'chat', // Use hyphen to match n8n workflow expectation
      session_id: validatedData.session_id,
      message: validatedData.message,
      user_id: validatedData.is_demo ? null : (await userService.getUserByWallet(validatedData.wallet_address!))?.id,
      demo_mode: validatedData.is_demo,
      demo_ip: validatedData.demo_ip,
      callback_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/api/chat/response/${validatedData.session_id}`
    };

    const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chatPayload)
    });

    if (!n8nResponse.ok) {
      console.error('Failed to trigger chat workflow:', await n8nResponse.text());
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      message_id: userMessage.id,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Chat message error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
