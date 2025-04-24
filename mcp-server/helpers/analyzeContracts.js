// analyzeContracts.js

export const tokenContracts = [
    { symbol: 'USDC', address: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea', decimals: 6 },
    { symbol: 'USDT', address: '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D', decimals: 6 },
    { symbol: 'DAK',  address: '0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714', decimals: 18 },
    { symbol: 'YAKI', address: '0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50', decimals: 18 },
    { symbol: 'CHOG', address: '0xE0590015A873bF326bd645c3E1266d4db41C4E6B', decimals: 18 },
    { symbol: 'WMON', address: '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701', decimals: 18 },
    { symbol: 'WETH', address: '0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37', decimals: 18 },
    { symbol: 'WBTC', address: '0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d', decimals: 8 },
    { symbol: 'WSOL', address: '0x5387C85A4965769f6B0Df430638a1388493486F1', decimals: 9 },
    { symbol: 'BEAN', address: '0x268E4E24E0051EC27b3D27A95977E71cE6875a05', decimals: 18 },
    { symbol: 'shMON', address: '0x3a98250F98Dd388C211206983453837C8365BDc1', decimals: 18 },
    { symbol: 'MAD', address: '0xC8527e96c3CB9522f6E35e95C0A28feAb8144f15', decimals: 18 },
    { symbol: 'sMON', address: '0xe1d2439b75fb9746E7Bc6cB777Ae10AA7f7ef9c5', decimals: 18 },
    { symbol: 'aprMON', address: '0xb2f82D0f38dc453D596Ad40A37799446Cc89274A', decimals: 18 },
    { symbol: 'gMON', address: '0xaEef2f6B429Cb59C9B2D7bB2141ADa993E8571c3', decimals: 18 },
  ];
  
  export const nftContracts = {
    "Lil Chogstars Mint Pass": "0x26c86f2835c114571df2b6ce9ba52296cc0fa6bb",
    "Molandak Mint Pass": "0x6341c537a6fc563029d8e8caa87da37f227358f4",
    "Meowwnads": { address: "0xa568cabe34c8ca0d2a8671009ae0f6486a314425", threshold: 3 },
    "Mutated Monadsters": "0x7ea266cf2db3422298e28b1c73ca19475b0ad345",
    "DRIPSTER DISC PASS": "0x6c84c9d9e06002776b3cd87f54f915b5ae2be439",
    "Sealuminati Testnetooor": { address: "0x4870e911b1986c6822a171cdf91806c3d44ce235", threshold: 10 },
  
    "Legacy Egg": "0xa980f072bc06d67faec2b03a8ada0d6c9d0da9f8",
    "Mystery Token": "0xff59f1e14c4f5522158a0cf029f94475ba469458",
  
    "Chewy": "0x88bbcba96a52f310497774e7fd5ebadf0ece21fb",
    "Mecha Box Mint Pass": "0x88bbcba96a52f310497774e7fd5ebadf0ece21fb",
  
    "Chogs Mystery Chest": "0xe6b5427b174344fd5cb1e3d5550306b0055473c6",
    "Monad Nomads": "0x9ac5998884cf59d8a87dfc157560c1f0e1672e04",
  
    "Monadverse Chapter 1": "0xe25c57ff3eea05d0f8be9aaae3f522ddc803ca4e",
    "Monadverse Chapter 2": "0x3a9acc3be6e9678fa5d23810488c37a3192aaf75",
    "Monadverse Chapter 3": "0xcab08943346761701ec9757befe79ea88dd67670",
    "Monadverse Chapter 4": "0xba838e4cca4b852e1aebd32f248967ad98c3aa45",
    "Monadverse Chapter 5": "0x5d2a7412872f9dc5371d0cb54274fdb241171b95",
    "Monadverse Chapter 6": "0x813fa68dd98f1e152f956ba004eb2413fcfa7a7d",
    "Monadverse Chapter 7": "0xc29b98dca561295bd18ac269d3d9ffdfcc8ad426",
  
    "Monshape Hopium": "0x69f2688abe5dcde0e2413f77b80efcc16361a56e",
    "Monshape x Fantasy WL Pass": "0x977b9b652dcd87e5fbdb849b12ab63a6bb01ac05",
  
    "Overnads Open Edition": "0x66b655de495268eb4c7b70bf4ac1ab4094589f93",
    "Overnads Whitelist Pass": "0x49d54cd9ca8c5ecadbb346dc6b4e31549f34e405",
  
    "Skrumpeys": "0xe8f0635591190fb626f9d13c49b60626561ed145",
    "SLMND Genesis": "0xf7b984c089534ff656097e8c6838b04c5652c947",
  
    "Spike it Up (Open Edition)": "0x9e4339d4d36bac6747e4e42e85e39cd1e2c58a1f",
    "Spikes": "0x87e1f1824c9356733a25d6bed6b9c87a3b31e107",
    "SpiKeys": "0xbb406139138401f4475ca5cf2d7152847159eb7a",
  
    "The 10k Squad": "0x3a9454c1b4c84d1861bb1209a647c834d137b442",
    "The Daks": "0x78ed9a576519024357ab06d9834266a04c9634b7",
  
    "Wonad Genesis Planter Card": "0x9a452f1ae5c1927259dacfa3fd58ede9679c61d0",
    "Wonad Soil Card": "0x33cafd437816eb5aafe2b2e7bedf82a3d8d226e7",
    "Wonad Seed Card": "0x6b5bf2a49d18d2d7f628415060bd1ec11464595d",
    "Wonad Shover Card": "0x5af1e57d7d1c8a83d5dd244de71227caa2d69b31",
    "Wonad Water Card": "0x2577a6bf5ea12b5e2b53bc7bd3fc93a529434d11",
    "Wonad Sun Card": "0x2eFe558C1b4636144D32127E9C12E36508350a02",
  
    "BlockNads": "0x6ed438b2a8eff227e7e54b5324926941b140eea0",
    "Le Mouch": "0x800f8cacc990dda9f4b3f1386c84983ffb65ce94",
    "Mongang": "0x209fb14943e9412354e982c4784bf89df760bf8f"
  };
  