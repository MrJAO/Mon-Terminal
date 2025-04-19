// mon-terminal/src/wagmiConfig.js

import { http, createConfig } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { defineChain } from 'viem/chains'

// Define Monad Testnet Chain
const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_MONAD_RPC_URL], // must be defined in .env
    },
    public: {
      http: [import.meta.env.VITE_MONAD_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://explorer.monad.xyz',
    },
  },
})

// Create wagmi config
export const wagmiConfig = createConfig({
  connectors: [injected()],
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(import.meta.env.VITE_MONAD_RPC_URL),
  },
})
