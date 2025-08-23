'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createConfig, WagmiProvider } from 'wagmi';
import { http } from 'viem';
import { sei, seiTestnet, mainnet } from 'viem/chains';

// Dynamic imports
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { DynamicWagmiConnector } from '@dynamic-labs/wagmi-connector';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';

// Import Sei Global Wallet for EIP-6963 discovery
import '@sei-js/sei-global-wallet/eip6963';

// Import Sei constants
import { SEI_CONSTANTS } from '@/lib/constants';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Set infinite timeout values
      staleTime: Infinity,
      gcTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retryOnMount: false,
      refetchOnMount: false,
    },
    mutations: {
      // Set infinite timeout for mutations as well
      gcTime: Infinity,
    },
  },
});

const wagmiConfig = createConfig({
  chains: [sei, seiTestnet, mainnet],
  transports: {
    [sei.id]: http(SEI_CONSTANTS.RPC_ENDPOINTS.MAINNET),
    [seiTestnet.id]: http(SEI_CONSTANTS.RPC_ENDPOINTS.TESTNET),
    [mainnet.id]: http(SEI_CONSTANTS.RPC_ENDPOINTS.MAINNET)
  }
});

// Validate environment variable
if (!process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID) {
  console.error('NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID is not set. Please add it to your .env.local file.');
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
        walletConnectors: [EthereumWalletConnectors],
        // Disable initial auth flow to prevent storage errors
        initialAuthenticationMode: 'connect-only',
        overrides: {
          evmNetworks: (networks) => {
            // Filter out any existing Sei networks to prevent duplication
            const filteredNetworks = networks.filter(network => 
              network.chainId !== sei.id && network.chainId !== seiTestnet.id
            );
            
            // Add our custom Sei networks
            return [
              ...filteredNetworks,
              {
                blockExplorerUrls: [SEI_CONSTANTS.BLOCK_EXPLORERS.MAINNET],
                chainId: sei.id,
                chainName: 'Sei Network',
                iconUrls: SEI_CONSTANTS.NETWORKS.MAINNET.iconUrls,
                name: 'Sei',
                nativeCurrency: sei.nativeCurrency,
                networkId: sei.id,
                rpcUrls: [SEI_CONSTANTS.RPC_ENDPOINTS.MAINNET],
                vanityName: 'Sei Mainnet'
              },
              {
                blockExplorerUrls: [SEI_CONSTANTS.BLOCK_EXPLORERS.TESTNET],
                chainId: seiTestnet.id,
                chainName: 'Sei Testnet',
                iconUrls: SEI_CONSTANTS.NETWORKS.TESTNET.iconUrls,
                name: 'Sei Testnet',
                nativeCurrency: seiTestnet.nativeCurrency,
                networkId: seiTestnet.id,
                rpcUrls: [SEI_CONSTANTS.RPC_ENDPOINTS.TESTNET],
                vanityName: 'Sei Testnet'
              }
            ];
          }
        }
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>{children}</DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}
