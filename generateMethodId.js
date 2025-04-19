// generateMethodId.js
import { keccak256, toUtf8Bytes } from 'ethers'

const sig = 'swap(address,address,uint256,address,bytes)'
const methodId = keccak256(toUtf8Bytes(sig)).slice(0, 10)
console.log(`Method ID for ${sig}: ${methodId}`)
