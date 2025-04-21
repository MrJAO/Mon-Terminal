// NFTContracts.js
// Central registry of your NFT collections, mapping human‑readable names to contract addresses.
// Force Rebuild

// TODO: Populate with your actual NFT names and addresses
const NFT_CONTRACTS = {
    "CoolArtNFT": "0x78ed9a576519024357ab06d9834266a04c9634b7",
    "MetaMonkeys": "0x1234567890abcdef1234567890abcdef12345678",
    // Add more entries below:
    // "MyNFTName": "0xYourContractAddressHere",
  };
  
  // Build reverse lookup: address (lowercased) to name
  const ADDRESS_TO_NAME = Object.fromEntries(
    Object.entries(NFT_CONTRACTS).map(([name, address]) => [address.toLowerCase(), name])
  );
  
  /**
   * Get the contract address for a given identifier (name or address).
   * @param {string} identifier - NFT name or contract address
   * @returns {string|null} Contract address if found, otherwise null
   */
  function getContractAddress(identifier) {
    if (!identifier) return null;
    const key = identifier.trim();
    // If it's a mapped name, return its address
    if (NFT_CONTRACTS[key]) {
      return NFT_CONTRACTS[key];
    }
    // If it's already a known address, normalize and return
    const lower = key.toLowerCase();
    if (ADDRESS_TO_NAME[lower]) {
      return lower;
    }
    return null;
  }
  
  /**
   * Get the NFT name for a given identifier (name or address).
   * @param {string} identifier - NFT name or contract address
   * @returns {string|null} NFT name if found, otherwise null
   */
  function getNFTName(identifier) {
    if (!identifier) return null;
    const key = identifier.trim();
    // If it's a known name, return it
    if (NFT_CONTRACTS[key]) {
      return key;
    }
    // If it's a known address, look up its name
    const lower = key.toLowerCase();
    return ADDRESS_TO_NAME[lower] || null;
  }
  
  export { NFT_CONTRACTS, getContractAddress, getNFTName };
  export default NFT_CONTRACTS;
  