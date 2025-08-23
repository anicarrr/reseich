'use client';

import React, { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { usePublicClient, useWalletClient } from 'wagmi';
import { parseEther, formatEther, type Address } from 'viem';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Wallet,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  ArrowRight,
  ShoppingCart,
  User,
  Clock
} from 'lucide-react';
import { userService } from '@/lib/database';
import type { MarketplaceListingWithResearch } from '@/lib/types';

interface ResearchPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: MarketplaceListingWithResearch;
  onPurchaseSuccess: (transactionHash: string) => void;
  onPurchaseFailure: (error: string) => void;
}

interface PaymentState {
  step: 'confirm' | 'processing' | 'success' | 'failed';
  transactionHash?: string;
  error?: string;
  isProcessing: boolean;
}

export const ResearchPurchaseModal: React.FC<ResearchPurchaseModalProps> = ({
  isOpen,
  onClose,
  listing,
  onPurchaseSuccess,
  onPurchaseFailure
}) => {
  const { primaryWallet, user: dynamicUser } = useDynamicContext();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [paymentState, setPaymentState] = useState<PaymentState>({
    step: 'confirm',
    isProcessing: false
  });
  const [showWalletDetails, setShowWalletDetails] = useState(false);
  const [userSEIBalance, setUserSEIBalance] = useState<string>('0.000000');
  const [sellerWalletAddress, setSellerWalletAddress] = useState<string>('');
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPaymentState({ step: 'confirm', isProcessing: false });
      loadPurchaseData();
    }
  }, [isOpen]);

  const loadPurchaseData = async () => {
    if (!primaryWallet || !listing.research?.user_id || !publicClient) {
      setIsLoadingData(false);
      return;
    }

    try {
      setIsLoadingData(true);

      // Get user's SEI balance using publicClient
      const balanceWei = await publicClient.getBalance({
        address: primaryWallet.address as Address
      });
      const balance = formatEther(balanceWei);
      setUserSEIBalance(balance);

      // Get seller's wallet address
      const sellerWallet = await userService.getWalletAddressByUserId(listing.research.user_id);
      if (sellerWallet) {
        setSellerWalletAddress(sellerWallet);
      }
    } catch (error) {
      console.error('Error loading purchase data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handlePurchase = async () => {
    if (!primaryWallet || !sellerWalletAddress || !walletClient || !publicClient) {
      setPaymentState(prev => ({
        ...prev,
        step: 'failed',
        error: 'Missing wallet information or client not available',
        isProcessing: false
      }));
      return;
    }

    try {
      setPaymentState(prev => ({ ...prev, step: 'processing', isProcessing: true }));

      // Step 1: Check user balance
      const balanceWei = await publicClient.getBalance({
        address: primaryWallet.address as Address
      });
      const currentBalance = parseFloat(formatEther(balanceWei));
      const requiredAmount = parseFloat(listing.price_sei);
      
      if (currentBalance < requiredAmount) {
        throw new Error(`Insufficient SEI balance. You have ${currentBalance.toFixed(6)} SEI but need ${listing.price_sei} SEI.`);
      }

      // Step 2: Prepare transaction value
      const valueWei = parseEther(listing.price_sei.toString());
      
      // Step 3: Estimate gas
      let gasEstimate: bigint;
      try {
        gasEstimate = await publicClient.estimateGas({
          account: primaryWallet.address as Address,
          to: sellerWalletAddress as Address,
          value: valueWei
        });
      } catch (gasErr) {
        console.error('Gas estimation failed:', gasErr);
        gasEstimate = BigInt(21000); // Default gas limit for simple transfer
      }

      // Add 20% buffer to gas estimate
      const gasLimit = (gasEstimate * BigInt(120)) / BigInt(100);

      // Step 4: Send the actual SEI transaction
      const hash = await walletClient.sendTransaction({
        account: primaryWallet.address as Address,
        to: sellerWalletAddress as Address,
        value: valueWei,
        gas: gasLimit
      });

      if (!hash) {
        throw new Error('Transaction failed to submit');
      }

      // Step 5: Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
        timeout: 60000 // 60 second timeout
      });

      if (receipt.status === 'reverted') {
        throw new Error('Transaction was reverted');
      }

      // Step 6: Call the payment API to record the transaction and grant access
      const response = await fetch('/api/payments/sei', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listing_id: listing.id,
          buyer_wallet: primaryWallet.address,
          seller_wallet: sellerWalletAddress,
          amount_sei: listing.price_sei.toString(),
          transaction_hash: hash,
          is_demo: primaryWallet.address.startsWith('demo_'),
          demo_ip: primaryWallet.address.startsWith('demo_') ? primaryWallet.address.replace('demo_', '') : undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment processing failed');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Payment processing failed');
      }

      setPaymentState(prev => ({
        ...prev,
        step: 'success',
        transactionHash: hash,
        isProcessing: false
      }));

      // Call success callback
      onPurchaseSuccess(hash);
    } catch (error) {
      console.error('Payment failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      
      setPaymentState(prev => ({
        ...prev,
        step: 'failed',
        error: errorMessage,
        isProcessing: false
      }));
      
      onPurchaseFailure(errorMessage);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openExplorer = (txHash: string) => {
    window.open(`https://sei.explorers.guru/transaction/${txHash}`, '_blank');
  };

  const canAfford = parseFloat(userSEIBalance) >= parseFloat(listing.price_sei);

  if (isLoadingData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] bg-[#1a2035] border-white/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <ShoppingCart className="h-5 w-5 text-[#e9407a]" />
              Loading Purchase Details
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#e9407a]" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (paymentState.step === 'success' && paymentState.transactionHash) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] bg-[#1a2035] border-white/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-400">
              <CheckCircle className="h-5 w-5" />
              Purchase Successful!
            </DialogTitle>
            <DialogDescription className="text-green-300">
              Your payment has been processed successfully
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-400">Transaction Hash</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(paymentState.transactionHash!)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openExplorer(paymentState.transactionHash!)}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="font-mono text-sm bg-white/5 p-2 rounded text-gray-300">
                {paymentState.transactionHash}
              </div>
            </div>

            <Alert className="border-green-500/30 bg-green-500/20">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300">
                You now have access to this research. You can view the full content anytime.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2 justify-center">
              <Button onClick={onClose} className="bg-gradient-to-r from-[#e9407a] to-[#ff8a00] hover:from-[#d63384] hover:to-[#e67e22]">
                View Research
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (paymentState.step === 'failed') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] bg-[#1a2035] border-white/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              Purchase Failed
            </DialogTitle>
            <DialogDescription className="text-red-300">
              {paymentState.error || 'An error occurred during payment'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="border-red-500/30 bg-red-500/20">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                {paymentState.error || 'Payment processing failed. Please try again.'}
              </AlertDescription>
            </Alert>

            <div className="flex gap-2 justify-center">
              <Button onClick={onClose} variant="outline" className="border-white/20 text-white">
                Cancel
              </Button>
              <Button 
                onClick={() => setPaymentState({ step: 'confirm', isProcessing: false })}
                className="bg-gradient-to-r from-[#e9407a] to-[#ff8a00] hover:from-[#d63384] hover:to-[#e67e22]"
              >
                Try Again
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-[#1a2035] border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Wallet className="h-5 w-5 text-[#3b82f6]" />
            Purchase Research
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Complete your purchase using SEI cryptocurrency
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Research Summary */}
          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
            <h3 className="font-semibold mb-3 text-white">Research Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Title:</span>
                <span className="font-medium text-white text-right max-w-[250px] truncate">
                  {listing.research?.title || 'Unknown Research'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Author:</span>
                <span className="text-gray-300">{listing.research?.user?.username || 'Anonymous'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Category:</span>
                <Badge variant="outline" className="text-xs">
                  {listing.research?.category || 'Uncategorized'}
                </Badge>
              </div>
              <Separator className="bg-white/10" />
              <div className="flex justify-between font-semibold">
                <span className="text-gray-400">Price:</span>
                <span className="text-lg text-[#10b981]">{listing.price_sei} SEI</span>
              </div>
            </div>
          </div>

          {/* Wallet Information */}
          <div className="bg-[#3b82f6]/10 p-4 rounded-lg border border-[#3b82f6]/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#3b82f6]">Your Wallet</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowWalletDetails(!showWalletDetails)}>
                {showWalletDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[#3b82f6]">Address:</span>
                <span className="text-sm font-mono text-gray-300">
                  {showWalletDetails 
                    ? primaryWallet?.address 
                    : `${primaryWallet?.address.slice(0, 6)}...${primaryWallet?.address.slice(-4)}`
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#3b82f6]">Balance:</span>
                <span className="text-sm font-semibold text-white">{userSEIBalance} SEI</span>
              </div>
            </div>

            {!canAfford && (
              <Alert className="mt-3 border-orange-500/30 bg-orange-500/20">
                <AlertCircle className="h-4 w-4 text-orange-400" />
                <AlertDescription className="text-orange-300">
                  Insufficient SEI balance. You need {listing.price_sei} SEI but have {userSEIBalance} SEI.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Network Information */}
          <div className="bg-[#10b981]/10 p-4 rounded-lg border border-[#10b981]/20">
            <h3 className="font-semibold text-[#10b981] mb-2">Network</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30">
                Sei Network
              </Badge>
              <span className="text-sm text-[#10b981]">EVM Compatible • Fast & Secure</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={onClose} 
              variant="outline" 
              className="flex-1 border-white/20 text-white" 
              disabled={paymentState.isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={!canAfford || paymentState.isProcessing || !sellerWalletAddress}
              className="flex-1 bg-gradient-to-r from-[#e9407a] to-[#ff8a00] hover:from-[#d63384] hover:to-[#e67e22]"
            >
              {paymentState.isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  Pay {listing.price_sei} SEI
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Processing State */}
          {paymentState.step === 'processing' && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e9407a] mx-auto mb-2"></div>
              <p className="text-sm text-gray-400">Processing payment on Sei Network...</p>
              <p className="text-xs text-gray-500 mt-1">This may take a few moments</p>
            </div>
          )}

          {/* Info */}
          <Alert className="border-white/20 bg-white/5">
            <AlertCircle className="h-4 w-4 text-gray-400" />
            <AlertDescription className="text-gray-400">
              Your payment will be processed on the Sei Network blockchain. Transaction fees are minimal and the process is secure and transparent.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
};