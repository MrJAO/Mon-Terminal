// mcp-server/services/dexService.js
import fetch from 'node-fetch'
import { parseEther, Interface } from 'ethers/lib/utils'
import { CONTRACT_ADDRESSES } from '../constants/contractAddresses.js'

// Endpoint to check token listing status
const LISTING_API = 'https://testnet-bot-api-server.nad.fun/token'

// Minimal UniswapV2-style router ABI
const ROUTER_ABI = [
  'function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)',
  'function swapExactNativeForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) payable returns (uint256[] amounts)'
]
const routerIface = new Interface(ROUTER_ABI)

/**
 * Build calldata for buying a token via Uniswap-style DEX.
 * @param {object} publicClient - wagmi publicClient for on-chain reads
 * @param {object} walletClient - wagmi walletClient for sending txns
 * @param {string} tokenAddress - token contract to buy
 * @param {string} monAmount - amount of MON to spend (decimal string)
 * @param {number} slippagePct - allowed slippage in % (default 0.5)
 * @returns {{ to: string, data: string, value: string }}
 */
export async function buildBuyFromDex(
  publicClient,
  walletClient,
  tokenAddress,
  monAmount,
  slippagePct = 0.5
) {
  const routerAddr = CONTRACT_ADDRESSES.INTERNAL_UNISWAP_V2_ROUTER
  const wrappedMon = CONTRACT_ADDRESSES.WRAPPED_MON

  if (!routerAddr || !wrappedMon) {
    throw new Error(
      'Missing INTERNAL_UNISWAP_V2_ROUTER or WRAPPED_MON in CONTRACT_ADDRESSES'
    )
  }

  // 1) Check token listing
  const infoRes = await fetch(`${LISTING_API}/${tokenAddress}`)
  const info    = await infoRes.json()
  if (!infoRes.ok || !info.is_listing) {
    throw new Error('Token is not yet listed on DEX')
  }

  // 2) Parse MON amount to wei
  const valueInWei = parseEther(monAmount)

  // 3) Deadline = now + 20min
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60)

  // 4) Build path [WRAPPED_MON → token]
  const path = [wrappedMon, tokenAddress]

  // 5) Fetch expected output amounts
  const amounts = await publicClient.readContract({
    address: routerAddr,
    abi: ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: [valueInWei, path]
  })
  const expectedOut = BigInt(amounts[1])

  // 6) Calculate minimum output with slippage
  const slippageFactor = 1000n - BigInt(Math.floor(slippagePct * 10))
  const minOut = (expectedOut * slippageFactor) / 1000n

  // 7) Encode the swapExactNativeForTokens call
  const data = routerIface.encodeFunctionData('swapExactNativeForTokens', [
    minOut,
    path,
    walletClient.account.address,
    deadline
  ])

  return {
    to:    routerAddr,
    data,
    value: valueInWei.toHexString()
  }
}
