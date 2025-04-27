# 🤖 MON TERMINAL

A pixel-styled terminal interface for exploring and interacting with the Monad Testnet.

---

## 🚀 How to Use

1. **Connect Wallet**
2. Type any command into the terminal (e.g. `help`, `check pnl MON 1 to USDC`)
3. Check FAQs for more commands and important information 🤖

---

## 🧾 Available Commands

| Command                                           | Description                                 |
|---------------------------------------------------|---------------------------------------------|
| **help**                                          | Show command help menu                      |
| **analyze**                                       | Analyze wallet Token and NFT interactions   |
| **stake**                                         | Initiate aPriori staking process            |
| **stake aprMON <amt>**                            | Input how much MON you want to stake        |
| **confirm-stake**                                 | Execute and finalize staking process        |
| **check balance <token>**                         | View token balance                          |
| **check pnl <token> 1 to USDC**                   | Simulate PnL from recent token performance  |
| **record stats**                                  | Record your last PnL on-chain (24h cooldown)|
| **achievements**                                  | View your unlocked achievements             |
| **mint <achievement_name>**                       | Mint a soulbound achievement NFT            |
| **best price for <token> 1 to USDC**              | Compare DEX prices                          |
| **swap <token> <amt> to <token>**                 | Quote a token swap                          |
| **confirm <token> <amt> to <token>**              | Execute a quoted swap                       |
| **show my nfts**                                  | Display your NFTs                           |
| **send <amt> <token> to <wallet>**                | Send token to another wallet                |
| **token report <token> 1 to USDC**                | View 7-day history and sentiment            |
---------------------------------------------------------------------------------------------------
---

## 📦 Tech Stack

- ⚛️ **Frontend**: React + Vite  
- 🎨 **Styling**: Retro pixel-art CSS (CRT-inspired)  
- 🔐 **Wallet**: wagmi + ethers.js  
- 📊 **Charting**: Recharts  
- 🛠 **Backend**: Node.js + Express (Railway-hosted)  
- 🌐 **APIs**: Alchemy, Monorail, custom integrations  

---

## 🛠 Installation & Local Development

1. **Clone the repo**
    ```bash
    git clone https://github.com/MrJAO/Mon-Terminal.git
    cd Mon-Terminal
    ```

2. **Backend setup** (`mcp-server`)
    ```bash
    cd mcp-server
    npm install
    # create .env with required variables (see below)
    npm run dev   # or `node index.js`
    ```

3. **Frontend setup**
    ```bash
    cd ../src
    npm install
    npm run dev
    ```

4. **Open** `http://localhost:5173` in your browser and interact!  

---

## ⚙️ Environment Variables

### Backend (`mcp-server/.env`)
```env
# Port (default 3001)
PORT=3001

# Contract Addresses for Backend
MON_TERMINAL_ADDRESS=0xD5fC940644e5527D97cAFede0BE9ce78F9067F33 (Record Stats Smart Contract)
ACHIEVEMENT_NFT_ADDRESS=0x1f036DB021e447b083D8F3c9F875464d17fFd18F (Achievements Smart Contract)

# Optional API endpoints
degen
DEGEN_API_URL=https://testnet-bot-api-server.nad.fun

# Alchemy API
ALCHEMY_API_KEY=Your API KEY
ALCHEMY_TESTNET_RPC_URL=Your RPC URL (backup)


# Monorail token resolver
MONORAIL_DATA_API=https://api.monorail.xyz
MONORAIL_API_URL=https://testnet-pathfinder-v2.monorail.xyz
MAX_HOPS=3
SLIPPAGE=100
DEADLINE=60

```  

### Frontend (`.env`)
```env
REACT_APP_BACKEND_URL=YOUR Railyway App link 
MONORAIL_API_URL=https://testnet-pathfinder-v2.monorail.xyz
VITE_MONAD_RPC_UR=https://testnet-rpc.monad.xyz
VITE_MON_TERMINAL_ADDRESS=0xD5fC940644e5527D97cAFede0BE9ce78F9067F33 (Record Stats Smart Contract)
VITE_ACHIEVEMENT_NFT_ADDRESS=0x1f036DB021e447b083D8F3c9F875464d17fFd18F (Achievements Smart Contract)
```

---

## 🚢 Docker & Deployment

### Docker (backend)
```bash
cd mcp-server
Create Dockerfile
Paste these inside your Dockerfile:
FROM node:18

# Create app directory
WORKDIR /app

# Install Python3, venv, and pip
RUN apt-get update && \
    apt-get install -y python3 python3-venv python3-pip && \
    rm -rf /var/lib/apt/lists/*

# Create a virtual environment for Python dependencies
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies inside the venv
RUN pip install --no-cache-dir requests

# Copy package files and install Node dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app code
COPY . ./

# Expose the port your Express app listens on
EXPOSE 3001

# Start the Express server #
CMD ["node", "index.js"]
```

### Deploy to Railway
1. Connect GitHub repo → select the `mcp-server` folder  
2. Choose **Dockerfile** as the builder  
3. Add environment variables in Railway dashboard  
4. Deploy and note the generated domain (e.g. `https://mon-terminal.up.railway.app`)  

### Deploy Frontend to Vercel
- Push `src/` changes to GitHub  
- Vercel will auto-deploy your React app  

---

## 📚 Resources

- [Monad Documentation](https://docs.monad.xyz/)
- [Monorail MCP Server (GitHub)](https://github.com/monorail-xyz/mcp-server)
- [Fast Agent (GitHub)](https://github.com/evalstate/fast-agent)
- [Alchemy Token API Quickstart](https://docs.alchemy.com/reference/token-api-quickstart)
- [Alchemy NFT API Quickstart](https://docs.alchemy.com/reference/nft-api-quickstart)
- [Alchemy Transfers API Quickstart](https://docs.alchemy.com/reference/transfers-api-quickstart)

---

## 🧑‍💻 Maintainer

Made with 💜 by [@CryptoModJAO](https://x.com/CryptoModJAO)  
Feel free to tag me for feedback, suggestions, or bug reports.

---

## 🧪 Try it Live

👉 [mon-terminal.xyz](https://www.mon-terminal.xyz)

