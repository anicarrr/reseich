import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { userService, researchService } from '@/lib/database';
import type { ResearchItem } from '@/lib/types';

const emailSchema = z.object({
  research_id: z.string().uuid(),
  recipient_email: z.string().email().optional(),
  recipient_wallet: z.string().optional(),
  result_content: z.string(),
  result_file_url: z.string().optional(),
  is_demo: z.boolean().default(false)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = emailSchema.parse(body);

    // Get research details
    const research = await researchService.getResearchById(validatedData.research_id);
    if (!research) {
      return NextResponse.json({ error: 'Research not found' }, { status: 404 });
    }

    let recipientEmail = validatedData.recipient_email;

    // If no email provided, try to get from user
    if (!recipientEmail && !validatedData.is_demo && research.user_id) {
      const user = await userService.getUserById(research.user_id);
      if (user?.email && user?.research_results_email) {
        recipientEmail = user.email;
      }
    }

    if (!recipientEmail) {
      return NextResponse.json({ error: 'No recipient email found' }, { status: 400 });
    }

    // Send email using SendGrid
    const emailPayload = {
      to: recipientEmail,
      from: process.env.EMAIL_FROM!,
      subject: `Research Complete: ${research.title}`,
      html: generateEmailHTML(research, validatedData.result_content, validatedData.result_file_url),
      text: generateEmailText(research, validatedData.result_content, validatedData.result_file_url)
    };

    const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    if (!sendgridResponse.ok) {
      const errorText = await sendgridResponse.text();
      console.error('SendGrid error:', errorText);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      recipient: recipientEmail
    });
  } catch (error) {
    console.error('Email sending error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateEmailHTML(research: ResearchItem, resultContent: string, fileUrl?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Research Complete: ${research.title}</title>
    </head>
    <body>
      <h1>Your Research is Complete!</h1>
      <h2>${research.title}</h2>
      <p><strong>Query:</strong> ${research.query}</p>
      <p><strong>Depth:</strong> ${research.research_depth}</p>
      <p><strong>Type:</strong> ${research.research_type}</p>
      
      <h3>Research Results:</h3>
      <div style="white-space: pre-wrap;">${resultContent}</div>
      
      ${fileUrl ? `<p><a href="${fileUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Download Full Results</a></p>` : ''}
      
      <p>Thank you for using ReSeich!</p>
    </body>
    </html>
  `;
}

function generateEmailText(research: ResearchItem, resultContent: string, fileUrl?: string): string {
  return `
Your Research is Complete!

${research.title}

Query: ${research.query}
Depth: ${research.research_depth}
Type: ${research.research_type}

Research Results:
${resultContent}

${fileUrl ? `Download Full Results: ${fileUrl}` : ''}

Thank you for using ReSeich!
  `;
}
