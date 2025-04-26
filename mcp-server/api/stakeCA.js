// mcp-server/api/stakeCA.js

/** 
 * Staking contract addresses for Monad Testnet 
 */
export const STAKE_CONTRACT_ADDRESSES = {
    aprMON: '0xb2f82D0f38dc453D596Ad40A37799446Cc89274A',
    gMON:   '0xaEef2f6B429Cb59C9B2D7bB2141ADa993E8571c3',
    sMON:   '0xb091Ecc61b21CA2413C2821aD005DD26321f1183',
  }
  
  /** 
   * Minimal ABI fragments for each stake type 
   */
  export const STAKE_ABIS = {
    aprMON: [
      'function deposit(uint256 assets, address receiver) returns (uint256 shares)',
      'function convertToAssets(uint256 shares) view returns (uint256)',
      'function convertToShares(uint256 assets) view returns (uint256)',
      'function balanceOf(address) view returns (uint256)',
    ],
    gMON: [
      'function stake(uint256 amount)',
      'function balanceOf(address) view returns (uint256)',
    ],
    sMON: [
      'function stake(uint256 amount)',
      'function requestUnlock(uint256 shares)',
      'function redeem()',
      'function redeemWithWithdraw()',
      'function balanceOf(address) view returns (uint256)',
    ],
  }
  
  export const STAKE_DECIMALS = 18
  