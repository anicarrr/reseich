import { createPublicClient, http, parseEther, type Address, type PublicClient } from 'viem';
import { SEI_CONSTANTS } from '@/lib/constants';
import type { Transaction } from '@/lib/types';

export interface SEIPaymentRequest {
  amount_sei: string;
  credits_amount: number;
  user_wallet_address: string;
  transaction_hash?: string;
  block_number?: number;
}

export interface SEIPaymentResult {
  success: boolean;
  transactionHash?: string;
  blockNumber?: number;
  error?: string;
}

export interface SEITransactionStatus {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  confirmations: number;
  error?: string;
}

class SEIPaymentService {
  private client: PublicClient;
  private recipientAddress: string;

  constructor() {
    // Get recipient address from environment - this will be set at runtime
    this.recipientAddress = '';

    // Initialize viem client for SEI Network
    // Use testnet by default for development
    const isTestnet = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_TESTNET === 'true';
    const networkConfig = isTestnet ? SEI_CONSTANTS.NETWORKS.TESTNET : SEI_CONSTANTS.NETWORKS.MAINNET;
    const rpcEndpoint = isTestnet ? SEI_CONSTANTS.RPC_ENDPOINTS.TESTNET : SEI_CONSTANTS.RPC_ENDPOINTS.MAINNET;
    const explorerUrl = isTestnet ? SEI_CONSTANTS.BLOCK_EXPLORERS.TESTNET : SEI_CONSTANTS.BLOCK_EXPLORERS.MAINNET;

    this.client = createPublicClient({
      chain: {
        id: networkConfig.chainId,
        name: networkConfig.chainName,
        network: networkConfig.name,
        nativeCurrency: networkConfig.nativeCurrency,
        rpcUrls: {
          default: {
            http: [rpcEndpoint]
          },
          public: {
            http: [rpcEndpoint]
          }
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
  }

  // Set recipient address after initialization
  setRecipientAddress(address: string) {
    if (!address || !this.isValidAddress(address)) {
      throw new Error('Invalid recipient address');
    }
    this.recipientAddress = address;
  }

  /**
   * Get SEI balance for a wallet address
   */
  async getBalance(walletAddress: string): Promise<string> {
    try {
      const balance = await this.client.getBalance({ address: walletAddress as Address });
      return this.formatBalance(balance);
    } catch (error) {
      console.error('Error getting SEI balance:', error);
      throw new Error('Failed to get SEI balance');
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionHash: string): Promise<SEITransactionStatus> {
    try {
      const receipt = await this.client.getTransactionReceipt({ hash: transactionHash as Address });

      if (receipt.status === 'success') {
        return {
          hash: transactionHash,
          status: 'confirmed',
          blockNumber: Number(receipt.blockNumber),
          confirmations: 1 // For now, assume 1 confirmation
        };
      } else {
        return {
          hash: transactionHash,
          status: 'failed',
          confirmations: 0,
          error: 'Transaction failed'
        };
      }
    } catch (error) {
      console.error('Error getting transaction status:', error);
      return {
        hash: transactionHash,
        status: 'pending',
        confirmations: 0
      };
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForConfirmation(transactionHash: string, maxWaitTime = 60000): Promise<SEITransactionStatus> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const status = await this.getTransactionStatus(transactionHash);

        if (status.status === 'confirmed') {
          return status;
        } else if (status.status === 'failed') {
          return status;
        }

        // Wait 2 seconds before checking again
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('Error waiting for confirmation:', error);
        // Continue waiting
      }
    }

    throw new Error('Transaction confirmation timeout');
  }

  /**
   * Validate payment request
   */
  validatePaymentRequest(request: SEIPaymentRequest): { valid: boolean; error?: string } {
    if (!request.amount_sei || parseFloat(request.amount_sei) <= 0) {
      return { valid: false, error: 'Invalid SEI amount' };
    }

    if (!request.user_wallet_address || !this.isValidAddress(request.user_wallet_address)) {
      return { valid: false, error: 'Invalid user wallet address' };
    }

    return { valid: true };
  }

  /**
   * Get estimated gas for SEI transfer
   */
  async estimateGas(amountSei: string): Promise<bigint> {
    try {
      const amountWei = parseEther(amountSei);

      // Estimate gas for a simple SEI transfer
      const gasEstimate = await this.client.estimateGas({
        account: this.recipientAddress as Address,
        to: this.recipientAddress as Address,
        value: amountWei
      });

      // Add some buffer for safety
      return gasEstimate + BigInt(21000);
    } catch (error) {
      console.error('Error estimating gas:', error);
      // Return a safe default
      return BigInt(21000);
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<bigint> {
    try {
      return await this.client.getGasPrice();
    } catch (error) {
      console.error('Error getting gas price:', error);
      // Return a safe default gas price
      return parseEther('0.000000001'); // 1 gwei
    }
  }

  /**
   * Format balance from wei to SEI
   */
  private formatBalance(balanceWei: bigint): string {
    const balanceSei = Number(balanceWei) / Math.pow(10, 18);
    return balanceSei.toFixed(6);
  }

  /**
   * Validate Ethereum address format
   */
  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Get recipient address
   */
  getRecipientAddress(): string {
    return this.recipientAddress;
  }

  /**
   * Get network information
   */
  getNetworkInfo() {
    return {
      chainId: SEI_CONSTANTS.NETWORKS.MAINNET.chainId,
      chainName: SEI_CONSTANTS.NETWORKS.MAINNET.chainName,
      rpcUrl: SEI_CONSTANTS.RPC_ENDPOINTS.MAINNET,
      explorerUrl: SEI_CONSTANTS.BLOCK_EXPLORERS.MAINNET,
      nativeCurrency: SEI_CONSTANTS.NETWORKS.MAINNET.nativeCurrency
    };
  }
}

// Export singleton instance
export const seiPaymentService = new SEIPaymentService();
