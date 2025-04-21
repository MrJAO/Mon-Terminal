// NFTContracts.js
// Central registry of your NFT collections, mapping human‑readable names to contract addresses.
// Force Rebuild

// TODO: Populate with your actual NFT names and addresses
const NFT_CONTRACTS = {
    "Lil Chogstars": "0x26c86f2835c114571df2b6ce9ba52296cc0fa6bb",
    "Mystery Token": "0xff59f1e14c4f5522158a0cf029f94475ba469458",
    "TheDaks": "0x78ed9a576519024357ab06d9834266a04c9634b7",
    "JikuPass": "0x66bfe7c5c2dc052492938a9f7d50251a47b375ef",
    "Legacy Eggs": "0xa980f072bc06d67faec2b03a8ada0d6c9d0da9f8",
    "Mintpad x Monad Early Supporters": "0xaaf8eb9dfea66a941dbf7322856f228464c88d86",
    "Wonad Soil Card": "0x33cafd437816eb5aafe2b2e7bedf82a3d8d226e7",
    "The10kSquad": "0x3a9454c1b4c84d1861bb1209a647c834d137b442",
    "Beannad": "0xb03b60818fd7f391e2e02c2c41a61cff86e4f3f5",
    "DRIPSTER DISC PASS": "0x6c84c9d9e06002776b3cd87f54f915b5ae2be439",
    "MONUKI": "0x490df01fff290f816e0bf8a1c38bc50a9448ef95",
    "overnads": "0x66b655de495268eb4c7b70bf4ac1ab4094589f93",
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
  