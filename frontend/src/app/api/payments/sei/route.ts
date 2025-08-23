import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { transactionService, marketplaceService, userService } from '@/lib/database';

const paymentSchema = z.object({
  listing_id: z.string().uuid(),
  buyer_wallet: z.string(),
  seller_wallet: z.string().optional(),
  amount_sei: z.string(),
  transaction_hash: z.string().optional(),
  is_demo: z.boolean().default(false),
  demo_ip: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = paymentSchema.parse(body);

    // Get listing details
    const listing = await marketplaceService.getListingById(validatedData.listing_id);
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (!listing.is_active) {
      return NextResponse.json({ error: 'Listing is not active' }, { status: 400 });
    }

    // Verify payment amount
    if (parseFloat(validatedData.amount_sei) !== parseFloat(listing.price_sei)) {
      return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 });
    }

    // Get user ID for the transaction
    let userId: string | undefined;
    if (!validatedData.is_demo) {
      const user = await userService.getUserByWallet(validatedData.buyer_wallet);
      userId = user?.id;
    }

    // Get seller's wallet address if not provided
    let sellerWalletAddress = validatedData.seller_wallet;
    if (!sellerWalletAddress && listing.user_id) {
      const fetchedWalletAddress = await userService.getWalletAddressByUserId(listing.user_id);
      sellerWalletAddress = fetchedWalletAddress || undefined;
    }

    // Create transaction record
    const transactionData = {
      user_id: userId,
      demo_ip: validatedData.demo_ip || undefined,
      is_demo: validatedData.is_demo,
      type: 'marketplace_purchase' as const,
      amount_sei: validatedData.amount_sei.toString(),
      credits_amount: 0,
      description: `Marketplace purchase: ${listing.research?.title || 'Unknown Research'}`,
      status: 'completed' as const,
      transaction_hash: validatedData.transaction_hash || undefined,
      metadata: {
        listing_id: listing.id,
        seller_id: listing.user_id,
        seller_wallet: sellerWalletAddress,
        research_id: listing.research_id,
        buyer_wallet: validatedData.buyer_wallet
      }
    };

    const transaction = await transactionService.createTransaction(transactionData);
    if (!transaction) {
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    // Create transaction record for sale
    const transactionDataSale = {
      user_id: listing.user_id,
      demo_ip: validatedData.demo_ip || undefined,
      is_demo: validatedData.is_demo,
      type: 'marketplace_sale' as const,
      amount_sei: validatedData.amount_sei.toString(),
      credits_amount: 0,
      description: `Marketplace sale: ${listing.research?.title || 'Unknown Research'}`,
      status: 'completed' as const,
      transaction_hash: validatedData.transaction_hash || undefined,
      metadata: {
        listing_id: listing.id,
        seller_id: listing.user_id,
        seller_wallet: sellerWalletAddress,
        research_id: listing.research_id,
        buyer_wallet: validatedData.buyer_wallet
      }
    };

    const transactionSale = await transactionService.createTransaction(transactionDataSale);
    if (!transactionSale) {
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    // Grant access to the research item
    const accessGranted = await marketplaceService.grantAccess(
      listing.id, 
      userId || validatedData.demo_ip || 'unknown',
      transaction.id,
      validatedData.is_demo
    );

    if (!accessGranted) {
      return NextResponse.json({ error: 'Failed to grant access' }, { status: 500 });
    }

    // Update listing stats
    await marketplaceService.updateListing(listing.id, {
      views_count: (listing.views_count || 0) + 1,
      sales_count: (listing.sales_count || 0) + 1
    });

    return NextResponse.json({
      success: true,
      transaction_id: transaction.id,
      message: 'Payment processed successfully',
      access_granted: true
    });
  } catch (error) {
    console.error('Payment processing error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
