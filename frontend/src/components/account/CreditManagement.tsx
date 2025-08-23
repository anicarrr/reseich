'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Coins, TrendingUp, Activity, CheckCircle, AlertCircle, Wallet, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import type { User } from '@/lib/types';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { usePublicClient, useWalletClient } from 'wagmi';
import { parseEther, formatEther, type Address } from 'viem';
import { SEI_CONSTANTS } from '@/lib/constants';

// Types for ethereum provider
interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

// Type guard for ethereum provider
function getEthereumProvider(): EthereumProvider | null {
  return (window as { ethereum?: EthereumProvider }).ethereum || null;
}

interface CreditManagementProps {
  user: User;
  onBuyCredits: (amount: number, seiAmount: string) => Promise<void>;
  isLoading?: boolean;
  onCreditsUpdated?: (newCredits: number) => void;
  onUserRefresh?: () => Promise<void>;
  isDemoMode?: boolean;
}

interface CreditPurchaseSuccess {
  newCredits: number;
  transactionHash: string;
  creditsAmount: number;
  amountSei: string;
}

const BASE_CREDIT_PACKAGES = [
  { credits: 50, sei: 5, bonus: 0, popular: false },
  { credits: 100, sei: 10, bonus: 0, popular: false },
  { credits: 250, sei: 25, bonus: 25, popular: true },
  { credits: 500, sei: 50, bonus: 75, popular: false },
  { credits: 1000, sei: 100, bonus: 200, popular: false }
];

export const CreditManagement: React.FC<CreditManagementProps> = ({ user, isLoading = false, onCreditsUpdated, onUserRefresh, isDemoMode = false }) => {
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successData, setSuccessData] = useState<CreditPurchaseSuccess | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Dynamic wallet integration
  const { primaryWallet } = useDynamicContext();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [walletState, setWalletState] = useState({
    balance: '0',
    isLoading: false,
    error: null as string | null
  });

  // Check if testnet is configured
  const isTestnet = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_TESTNET === 'true';
  const targetChainId = isTestnet ? SEI_CONSTANTS.NETWORKS.TESTNET.chainId : SEI_CONSTANTS.NETWORKS.MAINNET.chainId;
  const recipientAddress = process.env.NEXT_PUBLIC_SEI_RECIPIENT_ADDRESS;

  // Calculate pricing based on network (testnet is 100x cheaper)
  const CREDIT_PACKAGES = BASE_CREDIT_PACKAGES.map(pkg => ({
    ...pkg,
    sei: isTestnet ? (pkg.sei / 100).toFixed(4) : pkg.sei.toString()
  }));

  // Check if wallet is connected and on correct network
  const isConnected = !!primaryWallet;
  const address = primaryWallet?.address;
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  
  // Check current network
  useEffect(() => {
    const checkNetwork = async () => {
      if (primaryWallet) {
        try {
          // Try multiple methods to get chain ID
          let chainId = null;
          
          // Method 1: Dynamic SDK chain property
          if (primaryWallet.chain && typeof primaryWallet.chain === 'object' && 'id' in primaryWallet.chain) {
            chainId = (primaryWallet.chain as { id: number }).id;
            console.log('Chain ID from primaryWallet.chain.id:', chainId);
          }
          
          // Method 2: Dynamic SDK getNetwork method
          if (!chainId && primaryWallet.getNetwork) {
            try {
              chainId = await primaryWallet.getNetwork();
              console.log('Chain ID from primaryWallet.getNetwork():', chainId);
            } catch (e) {
              console.warn('getNetwork failed:', e);
            }
          }
          
          // Method 3: Direct ethereum provider
          if (!chainId) {
            const ethereum = getEthereumProvider();
            if (ethereum) {
              try {
                const hexChainId = await ethereum.request({ method: 'eth_chainId' });
                chainId = parseInt(hexChainId as string, 16);
                console.log('Chain ID from window.ethereum:', chainId, '(hex:', hexChainId, ')');
              } catch (e) {
                console.warn('ethereum.request failed:', e);
              }
            }
          }
          
          console.log('Final detected chain ID:', chainId, 'Target chain ID:', targetChainId);
          setCurrentChainId(chainId as number | null);
        } catch (error) {
          console.error('Error checking network:', error);
        }
      }
    };
    
    checkNetwork();
  }, [primaryWallet, targetChainId]);

  const isCorrectNetwork = currentChainId === targetChainId;
  
  // Debug logging
  useEffect(() => {
    console.log('Network status:', {
      currentChainId,
      targetChainId,
      isCorrectNetwork,
      isTestnet,
      walletConnected: !!primaryWallet
    });
  }, [currentChainId, targetChainId, isCorrectNetwork, isTestnet, primaryWallet]);

  // Load wallet balance
  useEffect(() => {
    const loadBalance = async () => {
      if (!primaryWallet || !publicClient || !isCorrectNetwork) return;

      try {
        setWalletState(prev => ({ ...prev, isLoading: true }));
        const balanceWei = await publicClient.getBalance({
          address: primaryWallet.address as Address
        });
        const balance = formatEther(balanceWei);
        setWalletState(prev => ({ ...prev, balance, isLoading: false }));
      } catch (error) {
        console.warn('Could not fetch balance:', error);
        setWalletState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadBalance();
  }, [primaryWallet, publicClient, isCorrectNetwork]);

  // Handle wallet errors
  useEffect(() => {
    if (walletState.error && !showErrorModal) {
      setErrorMessage(walletState.error);
      setShowErrorModal(true);
    }
  }, [walletState.error, showErrorModal]);

  const handlePackageSelect = (packageIndex: number) => {
    setSelectedPackage(packageIndex);
    setShowCustomInput(false);
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedPackage(null);
  };

  // Switch to SEI network
  const switchToSEINetwork = async () => {
    if (!primaryWallet) {
      setWalletState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return false;
    }

    try {
      setWalletState(prev => ({ ...prev, isLoading: true }));
      
      const networkConfig = isTestnet ? SEI_CONSTANTS.NETWORKS.TESTNET : SEI_CONSTANTS.NETWORKS.MAINNET;
      
      // Try Dynamic SDK method first
      try {
        if (primaryWallet.switchNetwork) {
          await primaryWallet.switchNetwork(networkConfig.chainId);
        } else {
          // Fallback to direct wallet request for SEI Global Wallet
          const ethereum = getEthereumProvider();
          if (ethereum) {
            await ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${networkConfig.chainId.toString(16)}` }],
            });
          }
        }
      } catch (switchError: unknown) {
        // If network doesn't exist, try to add it
        const error = switchError as { code?: number; message?: string };
        if (error?.code === 4902 || error?.message?.includes('Unrecognized chain')) {
          const ethereum = getEthereumProvider();
          if (ethereum) {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${networkConfig.chainId.toString(16)}`,
                chainName: networkConfig.chainName,
                rpcUrls: [isTestnet ? SEI_CONSTANTS.RPC_ENDPOINTS.TESTNET : SEI_CONSTANTS.RPC_ENDPOINTS.MAINNET],
                nativeCurrency: networkConfig.nativeCurrency,
                blockExplorerUrls: [isTestnet ? SEI_CONSTANTS.BLOCK_EXPLORERS.TESTNET : SEI_CONSTANTS.BLOCK_EXPLORERS.MAINNET]
              }],
            });
          }
        } else {
          throw switchError;
        }
      }
      
      // Wait a bit for the network switch to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check new network
      let chainId = null;
      try {
        if (primaryWallet.chain && typeof primaryWallet.chain === 'object' && 'id' in primaryWallet.chain) {
          chainId = (primaryWallet.chain as { id: number }).id;
        } else if (primaryWallet.getNetwork) {
          chainId = await primaryWallet.getNetwork();
        }
      } catch {
        const ethereum = getEthereumProvider();
        if (ethereum) {
          const hexChainId = await ethereum.request({ method: 'eth_chainId' });
          chainId = parseInt(hexChainId as string, 16);
        }
      }
      
      setCurrentChainId(chainId as number | null);
      setWalletState(prev => ({ ...prev, isLoading: false }));
      return chainId === targetChainId;
    } catch (error) {
      console.error('Error switching network:', error);
      setWalletState(prev => ({ 
        ...prev, 
        error: 'Failed to switch to SEI network. Please switch manually in your wallet.',
        isLoading: false 
      }));
      return false;
    }
  };

  // Refresh balance
  const refreshBalance = async () => {
    if (!primaryWallet || !publicClient || !isCorrectNetwork) return;

    try {
      setWalletState(prev => ({ ...prev, isLoading: true }));
      const balanceWei = await publicClient.getBalance({
        address: primaryWallet.address as Address
      });
      const balance = formatEther(balanceWei);
      setWalletState(prev => ({ ...prev, balance, isLoading: false }));
    } catch (error) {
      console.warn('Could not refresh balance:', error);
      setWalletState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Clear error state
  const clearError = () => {
    setWalletState(prev => ({ ...prev, error: null }));
  };

  const handleBuyCredits = async () => {
    if (!isConnected) {
      setErrorMessage('Please connect your wallet first');
      setShowErrorModal(true);
      return;
    }

    if (!isCorrectNetwork) {
      setErrorMessage('Please switch to SEI network first');
      setShowErrorModal(true);
      return;
    }

    if (!recipientAddress) {
      setErrorMessage('Recipient address not configured');
      setShowErrorModal(true);
      return;
    }

    try {
      setIsPurchasing(true);
      clearError();

      let creditsAmount: number;
      let seiAmount: string;

      if (selectedPackage !== null) {
        const pkg = CREDIT_PACKAGES[selectedPackage];
        creditsAmount = pkg.credits + pkg.bonus;
        seiAmount = pkg.sei;
      } else if (showCustomInput && customAmount) {
        creditsAmount = parseInt(customAmount);
        const baseRate = isTestnet ? 0.001 : 0.1; // 1000 credits per SEI on testnet, 10 credits per SEI on mainnet
        seiAmount = (creditsAmount * baseRate).toFixed(isTestnet ? 6 : 2);
      } else {
        setErrorMessage('Please select a package or enter a custom amount');
        setShowErrorModal(true);
        return;
      }

      // Check balance
      const requiredAmount = parseFloat(seiAmount);
      const currentBalance = parseFloat(walletState.balance);
      
      if (currentBalance < requiredAmount) {
        setErrorMessage(`Insufficient balance. You have ${walletState.balance} SEI but need ${seiAmount} SEI`);
        setShowErrorModal(true);
        return;
      }

      // Execute SEI transaction
      if (!walletClient) {
        setErrorMessage('Wallet client not available');
        setShowErrorModal(true);
        return;
      }

      const valueWei = parseEther(seiAmount);
      
      // Estimate gas
      let gasEstimate: bigint;
      try {
        gasEstimate = await publicClient!.estimateGas({
          account: primaryWallet!.address as Address,
          to: recipientAddress as Address,
          value: valueWei
        });
      } catch (gasErr) {
        console.error('Gas estimation failed:', gasErr);
        gasEstimate = BigInt(21000); // Default gas limit for simple transfer
      }

      // Add 20% buffer to gas estimate
      const gasLimit = (gasEstimate * BigInt(120)) / BigInt(100);

      // Send transaction
      const hash = await walletClient.sendTransaction({
        account: primaryWallet!.address as Address,
        to: recipientAddress as Address,
        value: valueWei,
        gas: gasLimit
      });

      if (!hash) {
        setErrorMessage('Transaction failed to submit');
        setShowErrorModal(true);
        return;
      }

      // Wait for transaction confirmation
      const receipt = await publicClient!.waitForTransactionReceipt({
        hash,
        confirmations: 1,
        timeout: 60000 // 60 second timeout
      });

      if (receipt.status === 'reverted') {
        setErrorMessage('Transaction was reverted');
        setShowErrorModal(true);
        return;
      }

      // Call the API to update credits in Supabase
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transactionHash: hash,
          amountSei: seiAmount,
          creditsAmount: creditsAmount,
          userWalletAddress: user.wallet_address,
          blockNumber: Number(receipt.blockNumber)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessData(data.data);
        setShowSuccessModal(true);

        // Update local state
        if (onCreditsUpdated) {
          onCreditsUpdated(data.data.newCredits);
        }

        // Refresh user data to get updated credits
        if (onUserRefresh) {
          await onUserRefresh();
        }

        // Refresh wallet balance
        await refreshBalance();
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to update credits in database');
        setShowErrorModal(true);
      }
    } catch (err) {
      console.error('Error buying credits:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Payment failed');
      setShowErrorModal(true);
    } finally {
      setIsPurchasing(false);
    }
  };

  const getSelectedCredits = () => {
    if (selectedPackage !== null) {
      const pkg = CREDIT_PACKAGES[selectedPackage];
      return pkg.credits + pkg.bonus;
    }
    if (showCustomInput && customAmount) {
      return parseInt(customAmount);
    }
    return 0;
  };

  const getSelectedSeiAmount = () => {
    if (selectedPackage !== null) {
      return CREDIT_PACKAGES[selectedPackage].sei;
    }
    if (showCustomInput && customAmount) {
      const baseRate = isTestnet ? 0.001 : 0.1; // 1000 credits per SEI on testnet, 10 credits per SEI on mainnet
      return (parseInt(customAmount) * baseRate).toFixed(isTestnet ? 6 : 2);
    }
    return '0';
  };

  const canBuy = (selectedPackage !== null || (showCustomInput && customAmount)) && 
                 !isLoading && 
                 !isPurchasing && 
                 !walletState.isLoading &&
                 isConnected && 
                 isCorrectNetwork;

  return (
    <div className="space-y-6">
      {/* Demo Mode Warning */}
      {isDemoMode && (
        <Alert className="border-[#ff8a00]/30 bg-[#ff8a00]/20 text-[#ff8a00]">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You&apos;re in demo mode, but you can still purchase credits with your connected wallet. 
            {isTestnet && ' Testnet prices are 100x cheaper for testing!'}
          </AlertDescription>
        </Alert>
      )}

      {/* Network Status */}
      {isConnected && !isCorrectNetwork && (
        <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <AlertCircle className="h-5 w-5 text-[#ff8a00]" />
              Wrong Network
            </CardTitle>
            <CardDescription>Switch to SEI {isTestnet ? 'Testnet' : 'Network'} to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <AlertCircle className="h-12 w-12 text-[#ff8a00] mx-auto mb-4" />
              <p className="text-gray-400 mb-4">
                You&apos;re connected to the wrong network. Please switch to SEI {isTestnet ? 'Testnet' : 'Network'}.
              </p>
              <Button 
                onClick={switchToSEINetwork}
                disabled={walletState.isLoading}
                className="bg-gradient-to-r from-[#e9407a] to-[#ff8a00] hover:from-[#c7356a] hover:to-[#e6780e]"
              >
                {walletState.isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Switching...
                  </>
                ) : (
                  <>
                    Switch to SEI {isTestnet ? 'Testnet' : 'Network'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Balance */}
      <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Coins className="h-5 w-5 text-[#ff8a00]" />
            Credit Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-[#ff8a00]">{user.credits.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Available credits</div>
            </div>
            <Badge variant="secondary" className="text-sm">
              ${(user.credits / 10).toFixed(2)} USD value
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Credit Packages */}
      <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Activity className="h-5 w-5 text-[#3b82f6]" />
            Buy Credits
          </CardTitle>
          <CardDescription>
            Purchase credits to unlock research features. 
            {isTestnet ? ' 1 SEI = 1000 credits (testnet rates)' : ' 1 SEI = 10 credits'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Package Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CREDIT_PACKAGES.map((pkg, index) => (
              <div
                key={index}
                className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedPackage === index
                    ? 'border-[#e9407a] bg-[#e9407a]/10 backdrop-blur-sm'
                    : 'border-white/20 hover:border-[#e9407a]/50 bg-white/5 backdrop-blur-sm'
                }`}
                onClick={() => handlePackageSelect(index)}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-[#e9407a] to-[#ff8a00]">Popular</Badge>
                )}
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#3b82f6]">{pkg.credits.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">credits</div>
                  <div className="text-lg font-semibold mt-2 text-white">{pkg.sei} SEI</div>
                  {pkg.bonus > 0 && <div className="text-sm text-[#10b981] mt-1">+{pkg.bonus} bonus credits</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCustomInput(!showCustomInput);
                setSelectedPackage(null);
              }}
              className={showCustomInput ? 'bg-blue-50 border-blue-500' : ''}
            >
              Custom Amount
            </Button>
            {showCustomInput && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Enter credits amount"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="w-32"
                  min="10"
                />
                <span className="text-sm text-muted-foreground">
                  credits = {isTestnet 
                    ? ((parseInt(customAmount) || 0) * 0.001).toFixed(6) 
                    : ((parseInt(customAmount) || 0) * 0.1).toFixed(2)
                  } SEI
                </span>
              </div>
            )}
          </div>

          {/* Purchase Summary */}
          {canBuy && (
            <Card className="bg-[#3b82f6]/10 border-[#3b82f6]/30 backdrop-blur-sm">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">Purchase Summary</div>
                    <div className="text-sm text-gray-400">
                      {getSelectedCredits().toLocaleString()} credits for {getSelectedSeiAmount()} SEI
                    </div>
                  </div>
                  <Button
                    onClick={handleBuyCredits}
                    disabled={!canBuy}
                    className="bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] hover:from-[#2563eb] hover:to-[#1e40af]"
                  >
                    {isPurchasing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing Transaction...
                      </>
                    ) : !isCorrectNetwork ? (
                      <>
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Switch Network First
                      </>
                    ) : (
                      <>
                        Buy Credits
                        <TrendingUp className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info */}
          <Alert className="border-[#3b82f6]/30 bg-[#3b82f6]/20 text-[#3b82f6]">
            <Activity className="h-4 w-4" />
            <AlertDescription>
              Credits are used for research features: Simple (5), Full (10), Max (20). Credits never expire and can be used
              for any research type.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Wallet Info */}
      {isConnected && (
        <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Wallet className="h-5 w-5 text-[#10b981]" />
              Wallet Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Connected Wallet:</span>
                <span className="font-mono text-sm text-white">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Network:</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={isCorrectNetwork ? "border-green-500 text-green-500" : "border-red-500 text-red-500"}>
                    SEI {isTestnet ? 'Testnet' : 'Network'}
                  </Badge>
                  {isCorrectNetwork && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">SEI Balance:</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{walletState.balance} SEI</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshBalance}
                    disabled={walletState.isLoading}
                    className="h-6 w-6 p-0"
                  >
                    <RefreshCw className={`h-3 w-3 ${walletState.isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
              {isTestnet && (
                <Alert className="border-[#ff8a00]/30 bg-[#ff8a00]/20 text-[#ff8a00]">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You&apos;re using SEI Testnet. Get test SEI from the{' '}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-[#ff8a00] underline"
                      onClick={() => window.open('https://docs.sei.io/learn/faucet', '_blank')}
                    >
                      SEI Faucet
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Modal */}
      {showSuccessModal && successData && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              Credits Purchased Successfully!
            </CardTitle>
            <CardDescription className="text-green-600 dark:text-green-400">
              Your SEI payment has been confirmed and credits have been added to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Credits Added:</span>
                  <span className="font-semibold text-green-600">+{successData.creditsAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">SEI Paid:</span>
                  <span className="font-semibold">{successData.amountSei} SEI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">New Balance:</span>
                  <span className="font-semibold text-blue-600">{successData.newCredits.toLocaleString()} credits</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Transaction Hash</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(successData.transactionHash)}
                  >
                    <Activity className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`${isTestnet ? 'https://seitrace.com/?chain=testnet' : 'https://seitrace.com'}/tx/${successData.transactionHash}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="font-mono text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded">{successData.transactionHash}</div>
            </div>

            <div className="text-center">
              <Button
                onClick={() => {
                  setShowSuccessModal(false);
                  // resetState(); // Removed resetState
                  setSelectedPackage(null);
                  setCustomAmount('');
                  setShowCustomInput(false);
                }}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle className="h-5 w-4" />
              Payment Failed
            </CardTitle>
            <CardDescription className="text-red-600 dark:text-red-400">{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>

            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => {
                  setShowErrorModal(false);
                  clearError();
                }}
                variant="outline"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowErrorModal(false);
                  clearError();
                  // Clear form state for retry
                  setSelectedPackage(null);
                  setCustomAmount('');
                  setShowCustomInput(false);
                }}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
