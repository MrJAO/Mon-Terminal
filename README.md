# 🤖 MON TERMINAL

A pixel-styled terminal interface for exploring and interacting with the Monad Testnet.

---

## 🚀 How to Use

1. **Connect Wallet**
2. Type any command into the terminal (e.g. `help`, `check pnl MON 1 to USDC`)
3. Check FACs for more command and important informations 🤖

---

## 🧾 Available Commands

| Command                                           | Description                                 |
|--------------------------------------------------|---------------------------------------------|
| **help**                                         | Show command help menu                      |
| **analyze**                                      | Analyze wallet Token and NFT interactions   |
| **check balance <token>**                        | View token balance                          |
| **check pnl <token> 1 to USDC**                  | Simulate PnL from recent token performance  |
| **record stats**                                 | Record your last PnL on-chain (24h cooldown)|
| **achievements**                                 | View your unlocked achievements             |
| **mint <achievement_name>**                      | Mint a soulbound achievement NFT            |
| **best price for <token> 1 to USDC**             | Compare DEX prices                          |
| **swap <token> <amt> to <token>**                | Quote a token swap                          |
| **confirm <token> <amt> to <token>**             | Execute a quoted swap                       |
| **show my nfts**                                 | Display your NFTs                           |
| **send <amt> <token> to <wallet>**               | Send token to another wallet                |
| **token report <token> 1 to USDC**               | View 7-day history and sentiment            |
--------------------------------------------------------------------------------------------------

---

## 📦 Tech Stack

- ⚛️ **Frontend**: React + Vite  
- 🎨 **Styling**: Retro pixel-art CSS (CRT-inspired)  
- 🔐 **Wallet**: wagmi + ethers.js  
- 📊 **Charting**: Recharts  
- 🛠 **Backend**: Node.js + Express (Render-hosted)  
- 🌐 **APIs**: Alchemy, Monorail, custom integrations  

---

## 🧑‍💻 Maintainer

Made with 💜 by [@CryptoModJAO](https://x.com/CryptoModJAO)  
Feel free to tag me for feedback, suggestions, or bug reports.

---

## 🧪 Try it Live

👉 [mon-terminal.xyz](https://www.mon-terminal.xyz)
