// Sei Network Constants
export const SEI_CONSTANTS = {
  // RPC Endpoints
  RPC_ENDPOINTS: {
    MAINNET: 'https://evm-rpc.sei-apis.com',
    TESTNET: 'https://evm-rpc-testnet.sei-apis.com'
  },

  // Block Explorer URLs
  BLOCK_EXPLORERS: {
    MAINNET: 'https://seitrace.com',
    TESTNET: 'https://seitrace.com/?chain=testnet'
  },

  // Network Configuration
  NETWORKS: {
    MAINNET: {
      chainId: 1329,
      chainName: 'Sei Network',
      name: 'Sei',
      networkId: 1329,
      vanityName: 'Sei Mainnet',
      nativeCurrency: {
        decimals: 18,
        name: 'Sei',
        symbol: 'SEI'
      },
      iconUrls: ['https://app.dynamic.xyz/assets/networks/sei.svg']
    },
    TESTNET: {
      chainId: 1328,
      chainName: 'Sei Testnet',
      name: 'Sei Testnet',
      networkId: 1328,
      vanityName: 'Sei Testnet',
      nativeCurrency: {
        decimals: 18,
        name: 'Sei',
        symbol: 'SEI'
      },
      iconUrls: ['https://app.dynamic.xyz/assets/networks/sei.svg']
    }
  },

  // webhook url
  WEBHOOK_URL: process.env.NEXT_PUBLIC_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL || 'https://lms8yvbk.rcsrv.com/webhook/9d9713a3-1409-427e-bcde-552f8dbbf3fa',

  // active webbook tool
  USE_WEBHOOK_TOOL: process.env.NEXT_PUBLIC_USE_WEBHOOK_TOOL === 'true',

  // default webhook debug data
  DEFAULT_WEBHOOK_DEBUG_DATA: {
    key: 'form-id',
    value: 'chat',
    enabled: true
  }
};
