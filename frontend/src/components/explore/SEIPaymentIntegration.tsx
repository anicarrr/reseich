'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, CheckCircle, AlertCircle, Loader2, ExternalLink, Copy, Eye, EyeOff, ArrowRight } from 'lucide-react';
import type { MarketplaceListingWithResearch } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface SEIPaymentIntegrationProps {
  listing: MarketplaceListingWithResearch;
  userWalletAddress: string;
  userSEIBalance: string;
  onPaymentSuccess: (transactionHash: string) => Promise<void>;
  onPaymentFailure: (error: string) => void;
  onCancel: () => void;
}

interface PaymentState {
  step: 'confirm' | 'processing' | 'success' | 'failed';
  transactionHash?: string;
  error?: string;
  isProcessing: boolean;
}

export const SEIPaymentIntegration: React.FC<SEIPaymentIntegrationProps> = ({
  listing,
  userWalletAddress,
  userSEIBalance,
  onPaymentSuccess,
  onPaymentFailure,
  onCancel
}) => {
  const [paymentState, setPaymentState] = useState<PaymentState>({
    step: 'confirm',
    isProcessing: false
  });
  const [showWalletDetails, setShowWalletDetails] = useState(false);

  const handlePayment = async () => {
    try {
      setPaymentState((prev) => ({ ...prev, step: 'processing', isProcessing: true }));

      // TODO: In a real implementation, this would:
      // 1. Connect to Sei Network wallet using Dynamic SDK
      // 2. Create and sign transaction on SEI blockchain
      // 3. Submit to blockchain and wait for confirmation
      
      // For now, simulate the payment process and make API call
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate processing

      // Generate mock transaction hash (in real implementation, this comes from blockchain)
      const mockTransactionHash = `sei_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Call the payment API to process the transaction
      const response = await fetch('/api/payments/sei', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listing_id: listing.id,
          buyer_wallet: userWalletAddress,
          amount_sei: listing.price_sei,
          transaction_hash: mockTransactionHash,
          is_demo: userWalletAddress.startsWith('demo_'),
          demo_ip: userWalletAddress.startsWith('demo_') ? userWalletAddress.replace('demo_', '') : undefined
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

      setPaymentState((prev) => ({
        ...prev,
        step: 'success',
        transactionHash: mockTransactionHash,
        isProcessing: false
      }));

      // Call success callback
      await onPaymentSuccess(mockTransactionHash);
    } catch (error) {
      console.error('Payment failed:', error);
      setPaymentState((prev) => ({
        ...prev,
        step: 'failed',
        error: error instanceof Error ? error.message : 'Payment failed',
        isProcessing: false
      }));
      onPaymentFailure(error instanceof Error ? error.message : 'Payment failed');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openExplorer = (txHash: string) => {
    // Open Sei Network explorer
    window.open(`https://sei.explorers.guru/transaction/${txHash}`, '_blank');
  };

  const canAfford = parseFloat(userSEIBalance) >= parseFloat(listing.price_sei);

  if (paymentState.step === 'success' && paymentState.transactionHash) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <CheckCircle className="h-5 w-5" />
            Payment Successful!
          </CardTitle>
          <CardDescription className="text-green-600 dark:text-green-400">
            Your payment has been processed successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Transaction Hash</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(paymentState.transactionHash!)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openExplorer(paymentState.transactionHash!)}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="font-mono text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded">{paymentState.transactionHash}</div>
          </div>

          <div className="text-center">
            <Button onClick={onCancel} variant="outline">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (paymentState.step === 'failed') {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertCircle className="h-5 w-5" />
            Payment Failed
          </CardTitle>
          <CardDescription className="text-red-600 dark:text-red-400">
            {paymentState.error || 'An error occurred during payment'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{paymentState.error || 'Payment processing failed. Please try again.'}</AlertDescription>
          </Alert>

          <div className="flex gap-2 justify-center">
            <Button onClick={onCancel} variant="outline">
              Cancel
            </Button>
            <Button onClick={() => setPaymentState({ step: 'confirm', isProcessing: false })}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-blue-500" />
          SEI Payment
        </CardTitle>
        <CardDescription>Complete your purchase using SEI cryptocurrency</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Summary */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Payment Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Research Item:</span>
              <span className="font-medium">{listing.research?.title || 'Unknown Research'}</span>
            </div>
            <div className="flex justify-between">
              <span>Price:</span>
              <span className="font-semibold text-blue-600">{listing.price_sei} SEI</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span className="text-lg">{listing.price_sei} SEI</span>
            </div>
          </div>
        </div>

        {/* Wallet Information */}
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200">Wallet Details</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowWalletDetails(!showWalletDetails)}>
              {showWalletDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-blue-600 dark:text-blue-400">Address:</span>
              <span className="text-sm font-mono">
                {showWalletDetails ? userWalletAddress : `${userWalletAddress.slice(0, 6)}...${userWalletAddress.slice(-4)}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-blue-600 dark:text-blue-400">Balance:</span>
              <span className="text-sm font-semibold">{userSEIBalance} SEI</span>
            </div>
          </div>

          {!canAfford && (
            <Alert className="mt-3 border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-orange-700 dark:text-orange-300">
                Insufficient SEI balance. You need {listing.price_sei} SEI but have {userSEIBalance} SEI.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Network Information */}
        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">Network</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
              Sei Network
            </Badge>
            <span className="text-sm text-green-600 dark:text-green-400">EVM Compatible • Fast & Secure</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={onCancel} variant="outline" className="flex-1" disabled={paymentState.isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={!canAfford || paymentState.isProcessing}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Processing payment on Sei Network...</p>
            <p className="text-xs text-muted-foreground mt-1">This may take a few moments</p>
          </div>
        )}

        {/* Info */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your payment will be processed on the Sei Network blockchain. Transaction fees are minimal and the process is
            secure and transparent.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
