import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createPublicClient, http } from 'viem';
import { SEI_CONSTANTS } from '@/lib/constants';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionHash, amountSei, creditsAmount, userWalletAddress, blockNumber } = body;

    // Validate required fields
    if (!transactionHash || !amountSei || !creditsAmount || !userWalletAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Network configuration
    const isTestnet = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_TESTNET === 'true';
    const networkConfig = isTestnet ? SEI_CONSTANTS.NETWORKS.TESTNET : SEI_CONSTANTS.NETWORKS.MAINNET;
    const rpcEndpoint = isTestnet ? SEI_CONSTANTS.RPC_ENDPOINTS.TESTNET : SEI_CONSTANTS.RPC_ENDPOINTS.MAINNET;
    const explorerUrl = isTestnet ? SEI_CONSTANTS.BLOCK_EXPLORERS.TESTNET : SEI_CONSTANTS.BLOCK_EXPLORERS.MAINNET;

    // Verify transaction on SEI Network
    try {
      // Create a viem client for SEI Network
      const seiClient = createPublicClient({
        chain: {
          id: networkConfig.chainId,
          name: networkConfig.chainName,
          network: networkConfig.name,
          nativeCurrency: networkConfig.nativeCurrency,
          rpcUrls: {
            default: { http: [rpcEndpoint] },
            public: { http: [rpcEndpoint] }
          },
          blockExplorers: {
            default: {
              name: 'SeiTrace',
              url: explorerUrl
            }
          }
        },
        transport: http()
      });

      // Get transaction receipt
      const receipt = await seiClient.getTransactionReceipt({ hash: transactionHash as `0x${string}` });

      if (!receipt || receipt.status !== 'success') {
        return NextResponse.json({ error: 'Transaction not confirmed on blockchain' }, { status: 400 });
      }

      // Verify the transaction details match
      // In a production environment, you might want to verify the transaction amount
      // and recipient address from the blockchain data
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return NextResponse.json({ error: 'Failed to verify transaction on blockchain' }, { status: 500 });
    }

    // Check if transaction already processed
    const { data: existingTransaction } = await supabase
      .from('transactions')
      .select('id')
      .eq('transaction_hash', transactionHash)
      .single();

    if (existingTransaction) {
      return NextResponse.json({ error: 'Transaction already processed' }, { status: 409 });
    }

    // Get or create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', userWalletAddress)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }

    let userData = user;
    if (!userData) {
      // Create new user if doesn't exist
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          wallet_address: userWalletAddress,
          credits: 0,
          is_demo_user: false
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
      userData = newUser;
    }

    // Update user credits
    const newCredits = (userData.credits || 0) + creditsAmount;
    const { error: updateError } = await supabase
      .from('users')
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', userWalletAddress);

    if (updateError) {
      console.error('Error updating user credits:', updateError);
      return NextResponse.json({ error: 'Failed to update user credits' }, { status: 500 });
    }

    // Create transaction record
    const { error: transactionError } = await supabase.from('transactions').insert({
      user_id: userData.id,
      type: 'credit_purchase',
      amount_sei: amountSei,
      credits_amount: creditsAmount,
      status: 'completed',
      transaction_hash: transactionHash,
      sei_network_data: {
        blockNumber,
        chainId: networkConfig.chainId,
        network: isTestnet ? 'Sei Testnet' : 'Sei Network',
        timestamp: new Date().toISOString()
      }
    });

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError);
      return NextResponse.json({ error: 'Failed to create transaction record' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Credits purchased successfully',
      data: {
        newCredits,
        transactionHash,
        creditsAmount,
        amountSei
      }
    });
  } catch (error) {
    console.error('Error processing credit purchase:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
