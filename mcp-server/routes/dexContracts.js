// mon-terminal/mcp-server/routes/dexContracts.js
export default {
  "Bean Exchange": {
    address: "0xCa810D095e90Daae6e867c19DF6D9A8C56db2c89",
    methodIds: [
      "0x18cbafe5", // swapExactTokensForETH
      "0x38ed1739", // swapExactTokensForTokens
      // add other method IDs here as needed
    ]
  },
  "Madness Finance": {
    address: "0x64Aff7245EbdAAECAf266852139c67E4D8DBa4de",
    methodIds: [
      "0x7ff36ab5", // swapExactETHForTokens
      // add other method IDs here
    ]
  },
  "Monorail": {
    address: "0xC995498c22a012353FAE7eCC701810D673E25794",
    methodIds: ["0x96f25cbe"]
  },
  "iZumi Finance": {
    address: "0xF6FFe4f3FdC8BBb7F70FFD48e61f17D1e343dDfD",
    methodIds: ["0xac9650d8"] // multicall
  },
  "Atlantis DEX": {
    address: "0xd5F418017EfE1891127790dFD50394A0c20b0DBF",
    methodIds: ["0x1fff991f"]
  },
  "Clober": {
    address: "0xfD845859628946B317A78A9250DA251114FbD846",
    methodIds: ["0x7e865aa4"] // swap(address,address,uint256,address,bytes)
  },
  "Pandaria": {
    address: "0x45A62B090DF48243F12A21897e7ed91863E2c86b",
    methodIds: ["0xf1910f70"]
  },
  "zkSwap": {
    address: "0x74a116B1Bb7894D3cFbC4B1a12F59ea95f3FFf81",
    methodIds: ["0x3593564c"] // execute
  }
};
