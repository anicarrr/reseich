import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { researchService, userService, transactionService } from '@/lib/database';

const researchSubmitSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  query: z.string().min(5, 'Query must be at least 5 characters'),
  research_depth: z.enum(['simple', 'full', 'max']),
  research_type: z.enum(['public', 'private']),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  // Enhanced research fields
  source_preferences: z.string().optional(),
  additional_context: z.string().optional(),
  specific_requirements: z.string().optional(),
  // System fields
  wallet_address: z.string().optional(),
  demo_user_id: z.string().optional(),
  demo_ip: z.string().optional(),
  is_demo: z.boolean().default(false)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = researchSubmitSchema.parse(body);

    // Check if user can perform research (demo limits, credits, etc.)
    if (validatedData.is_demo) {
      // Demo mode: check IP-based limits with daily reset
      const demoUsage = await userService.getDemoUserByIP(validatedData.demo_ip!);
      if (demoUsage) {
        // Check if 24 hours have passed since last research
        const lastResearchTime = new Date(demoUsage.updated_at);
        const now = new Date();
        const hoursSinceLastResearch = (now.getTime() - lastResearchTime.getTime()) / (1000 * 60 * 60);
        
        // If more than 24 hours have passed, reset the research count
        if (hoursSinceLastResearch >= 24) {
          // Reset research count for new day
          await userService.resetDemoResearchCount(validatedData.demo_ip!);
        } else if (demoUsage.research_count >= 1) {
          const hoursRemaining = Math.ceil(24 - hoursSinceLastResearch);
          return NextResponse.json({ 
            error: `Demo limit reached. You can use 1 free research per day. Try again in ${hoursRemaining} hours.` 
          }, { status: 403 });
        }
      }
    } else if (validatedData.wallet_address) {
      // Real user: check credits
      const user = await userService.getUserByWallet(validatedData.wallet_address);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const creditCosts = { simple: 5, full: 10, max: 20 };
      const requiredCredits = creditCosts[validatedData.research_depth];

      if (user.credits < requiredCredits) {
        return NextResponse.json(
          { error: `Insufficient credits. Required: ${requiredCredits}, Available: ${user.credits}` },
          { status: 402 }
        );
      }
    }

    // Create research item in database
    const researchData = {
      title: validatedData.title,
      description: validatedData.description,
      query: validatedData.query,
      research_depth: validatedData.research_depth,
      research_type: validatedData.research_type,
      category: validatedData.category || 'general',
      tags: validatedData.tags || [],
      credits_used: { simple: 5, full: 10, max: 20 }[validatedData.research_depth],
      status: 'pending' as const,
      user_id: validatedData.wallet_address
        ? (await userService.getUserByWallet(validatedData.wallet_address))?.id
        : undefined,
      demo_ip: validatedData.demo_ip || null,
      is_demo: validatedData.is_demo
    };

    const researchItem = await researchService.createResearch(researchData);
    if (!researchItem) {
      return NextResponse.json({ error: 'Failed to create research item' }, { status: 500 });
    }

    // Deduct credits for real users
    if (!validatedData.is_demo && validatedData.wallet_address) {
      const user = await userService.getUserByWallet(validatedData.wallet_address);
      if (user) {
        await userService.updateCredits(validatedData.wallet_address, user.credits - researchData.credits_used);
      }
    }

    // Track demo usage
    if (validatedData.is_demo && validatedData.demo_ip) {
      await userService.trackDemoUsage(validatedData.demo_ip, 'research');
    }

    // Create transaction record
    const transactionData = {
      user_id: validatedData.wallet_address
        ? (await userService.getUserByWallet(validatedData.wallet_address))?.id
        : undefined,
      demo_ip: validatedData.demo_ip || undefined,
      is_demo: validatedData.is_demo,
      type: 'research_purchase' as const,
      amount_sei: '0', // Research doesn't cost SEI, only credits
      credits_amount: -researchData.credits_used,
      description: `Research: ${validatedData.title} (${validatedData.research_depth} depth)`,
      status: 'completed' as const,
      metadata: {
        research_id: researchItem.id,
        research_depth: validatedData.research_depth,
        research_type: validatedData.research_type
      }
    };

    await transactionService.createTransaction(transactionData);

    // Trigger n8n workflow with standardized payload - each form field as separate property
    const n8nPayload = {
      'form-id': 'research', // Use hyphen to match n8n workflow expectation
      // Core research fields
      title: validatedData.title,
      description: validatedData.description || '',
      query: validatedData.query,
      research_type: validatedData.research_type,
      research_depth: validatedData.research_depth,
      category: validatedData.category || '',
      tags: validatedData.tags || [],
      // Database reference
      research_id: researchItem.id,
      // User context - separate fields for demo vs authenticated users
      user_id: validatedData.wallet_address ? (await userService.getUserByWallet(validatedData.wallet_address))?.id : null,
      demo_user_id: validatedData.demo_user_id || null,
      wallet_address: validatedData.wallet_address || null,
      demo_mode: validatedData.is_demo,
      demo_ip: validatedData.demo_ip || null,
      // Additional metadata
      credits_cost: researchData.credits_used,
      estimated_completion: getEstimatedCompletion(validatedData.research_depth),
      timestamp: new Date().toISOString(),
      // System callbacks
      callback_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/api/research/status/${researchItem.id}`,
      // Enhanced research fields
      source_preferences: validatedData.source_preferences || null,
      additional_context: validatedData.additional_context || null,
      specific_requirements: validatedData.specific_requirements || null
    };

    const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(n8nPayload)
    });

    if (!n8nResponse.ok) {
      console.error('Failed to trigger n8n workflow:', await n8nResponse.text());
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      research_id: researchItem.id,
      message: 'Research submitted successfully',
      estimated_completion: getEstimatedCompletion(validatedData.research_depth)
    });
  } catch (error) {
    console.error('Research submission error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getEstimatedCompletion(depth: string): string {
  const estimates = {
    simple: '5-10 minutes',
    full: '15-30 minutes',
    max: '30-60 minutes'
  };
  return estimates[depth as keyof typeof estimates] || 'Unknown';
}
