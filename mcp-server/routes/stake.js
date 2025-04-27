// mcp-server/routes/stake.js
import express from 'express'
import { ethers } from 'ethers'
import {
  STAKE_CONTRACT_ADDRESSES,
  STAKE_ABIS,
  STAKE_DECIMALS,
} from '../api/stakeCA.js'

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    const { type, amount, receiver, sender } = req.body
    if (!type || !amount || !sender) {
      return res.status(400).json({ success:false, error:'type, amount & sender required' })
    }

    const contractAddress = STAKE_CONTRACT_ADDRESSES[type]
    const abi             = STAKE_ABIS[type]
    if (!contractAddress || !abi) {
      return res.status(400).json({ success:false, error:`Unsupported stake type: ${type}` })
    }

    // 1) parse to base‐units
    const bnAmount = ethers.parseUnits(amount, STAKE_DECIMALS)
    const amtStr   = bnAmount.toString()

    // 2) pick function + args + value
    let functionName, args, value
    switch (type) {
      case 'aprMON':
        functionName = 'deposit'
        args         = [amtStr, receiver ?? sender]
        value        = amtStr
        break
      case 'gMON':
      case 'sMON':
        functionName = 'stake'
        args         = [amtStr]
        value        = 0
        break
    }

    // 3) return ready‐to‐send payload
    return res.json({
      success: true,
      transaction: {
        to:           contractAddress,
        abi,
        functionName,
        args,
        value,                            // front-end can feed this to writeContractAsync
        gasLimit:     process.env.DEFAULT_GAS_LIMIT || '250000',
      }
    })

  } catch (err) {
    console.error(err)
    return res.status(500).json({ success:false, error: err.message })
  }
})

export default router
