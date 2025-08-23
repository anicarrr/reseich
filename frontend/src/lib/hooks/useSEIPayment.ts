import { useState, useCallback, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { parseEther, type Address } from 'viem';
import { seiPaymentService } from '@/lib/services/seiPaymentService';
import type { SEIPaymentRequest, SEIPaymentResult } from '@/lib/services/seiPaymentService';

export interface UseSEIPaymentReturn {
  isProcessing: boolean;
  error: string | null;
  transactionHash: string | null;
  buyCredits: (amountSei: string, creditsAmount: number) => Promise<SEIPaymentResult>;
  resetState: () => void;
}

export function useSEIPayment(): UseSEIPaymentReturn {
  const { primaryWallet, user } = useDynamicContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setError(null);
    setTransactionHash(null);
    setIsProcessing(false);
  }, []);

  // Set recipient address from environment
  useEffect(() => {
    const recipientAddress = process.env.NEXT_PUBLIC_SEI_RECIPIENT_ADDRESS;
    if (recipientAddress) {
      try {
        seiPaymentService.setRecipientAddress(recipientAddress);
      } catch (err) {
        console.error('Failed to set recipient address:', err);
        setError('Invalid recipient address configuration');
      }
    } else {
      setError('Recipient address not configured');
    }
  }, []);

  const buyCredits = useCallback(
    async (amountSei: string, creditsAmount: number): Promise<SEIPaymentResult> => {
      if (!primaryWallet || !user) {
        throw new Error('Wallet not connected');
      }

      if (!seiPaymentService.getRecipientAddress()) {
        throw new Error('Recipient address not configured. Please check your environment settings.');
      }

      try {
        setIsProcessing(true);
        setError(null);
        setTransactionHash(null);

        // Validate the payment request
        const paymentRequest: SEIPaymentRequest = {
          amount_sei: amountSei,
          credits_amount: creditsAmount,
          user_wallet_address: primaryWallet.address
        };

        const validation = seiPaymentService.validatePaymentRequest(paymentRequest);
        if (!validation.valid) {
          throw new Error(validation.error || 'Invalid payment request');
        }

        // Check if user has sufficient balance
        const userBalance = await seiPaymentService.getBalance(primaryWallet.address);
        if (parseFloat(userBalance) < parseFloat(amountSei)) {
          throw new Error(`Insufficient SEI balance. You have ${userBalance} SEI but need ${amountSei} SEI.`);
        }

        // Get gas estimation
        const gasEstimate = await seiPaymentService.estimateGas(amountSei);
        const gasPrice = await seiPaymentService.getGasPrice();

        // Prepare transaction
        const transaction = {
          to: seiPaymentService.getRecipientAddress() as Address,
          value: parseEther(amountSei),
          gas: gasEstimate,
          gasPrice: gasPrice,
          chainId: seiPaymentService.getNetworkInfo().chainId
        };

        // Send transaction using Dynamic SDK
        // Note: The actual implementation would depend on the specific wallet connector
        // For now, we'll simulate the transaction
        const hash = `sei_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        if (!hash) {
          throw new Error('Failed to send transaction');
        }

        setTransactionHash(hash);

        // Wait for confirmation
        const confirmation = await seiPaymentService.waitForConfirmation(hash);

        if (confirmation.status === 'failed') {
          throw new Error(confirmation.error || 'Transaction failed');
        }

        // Return success result
        const result: SEIPaymentResult = {
          success: true,
          transactionHash: hash,
          blockNumber: confirmation.blockNumber
        };

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Payment failed';
        setError(errorMessage);

        const result: SEIPaymentResult = {
          success: false,
          error: errorMessage
        };

        return result;
      } finally {
        setIsProcessing(false);
      }
    },
    [primaryWallet, user]
  );

  return {
    isProcessing,
    error,
    transactionHash,
    buyCredits,
    resetState
  };
}
