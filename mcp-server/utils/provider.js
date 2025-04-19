import { ethers } from 'ethers'
import dotenv from 'dotenv'
dotenv.config()

export const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_RPC_URL || 'https://testnet-rpc.monad.xyz', {
  chainId: 10143,
  name: 'monad-testnet',
})
