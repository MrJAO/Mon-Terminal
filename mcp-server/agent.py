import sys
import time
import json
import requests
import os

WALLET_ADDRESS = "0xd9F016e453dE48D877e3f199E8FA4aADca2E979C"  # Replace dynamically if needed
_COOLDOWN_FILE = "cooldowns.json"
_COOLDOWN_SECONDS = 24 * 60 * 60
LAST_SWAP_QUOTE = {}
PENDING_SEND = {}
LAST_STAKE_TX = {}

BASE_URL = "https://mon-terminal-production.up.railway.app/api"
DEFAULT_GAS_LIMIT = os.getenv("DEFAULT_GAS_LIMIT", "250000")

# ─── Token symbol to contract address map ───
TOKEN_ADDRESSES = {
    'MON':    "native",
    'USDC':   "0xf817257fed379853cDe0fa4F97AB987181B1e5Ea",
    'USDT':   "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D",
    'DAK':    "0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714",
    'YAKI':   "0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50",
    'CHOG':   "0xE0590015A873bF326bd645c3E1266d4db41C4E6B",
    'WMON':   "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701",
    'WETH':   "0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37",
    'WBTC':   "0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d",
    'WSOL':   "0x5387C85A4965769f6B0Df430638a1388493486F1",
    'BEAN':   "0x268E4E24E0051EC27b3D27A95977E71cE6875a05",
    'shMON':  "0x3a98250F98Dd388C211206983453837C8365BDc1",
    'MAD':    "0xC8527e96c3CB9522f6E35e95C0A28feAb8144f15",
    'sMON':   "0xe1d2439b75fb9746E7Bc6cB777Ae10AA7f7ef9c5",
    'aprMON': "0xb2f82D0f38dc453D596Ad40A37799446Cc89274A",
    'gMON':   "0xaEef2f6B429Cb59C9B2D7bB2141ADa993E8571c3"
}

# Achievement mapping
achievementNames = {
    "green10": "Profit Initiate",
    "red10": "Paperhands",
    "green20": "Bull Rider",
    "red20": "Overtrader",
    "green30": "Momentum Master",
    "red30": "Dip Devotee",
    "green40": "Terminal Trader",
    "red40": "Hopeless Holder",
    "green50": "Ghost of Green",
    "red50": "Ghost of Red",
    "green_hidden": "King of Green Days",
    "red_hidden": "What a Freaking Loser",
}

def _load_cooldowns():
    try:
        with open(_COOLDOWN_FILE, "r") as f:
            return json.load(f)
    except:
        return {}

def _save_cooldowns(data):
    with open(_COOLDOWN_FILE, "w") as f:
        json.dump(data, f)

def print_help():
    return """Available Mon Terminal Commands:
>-------------------------------------------------------------------------------------------------------------------
> help                                          <------ Show command help menu                                     |
>-                                              --------------------------------------------------------------------
> swap <token name> <amount> to <token name>    <------ Quote a token swap (e.g. swap MON 1 to USDC)               |
> confirm <token name> <amount> to <token name>  <------ Execute a quoted swap                                      |
>-                                              --------------------------------------------------------------------
> stake                                         <------ Initiate aPriori Staking process                           |
> confirm-stake                                  <------ To execute your transaction after the wallet confirmation   |
>-                                              --------------------------------------------------------------------
> send <amount> <token name> to <w-address>     <------ Send token to another wallet address                       |
>-                                              --------------------------------------------------------------------
> check pnl <token name> 1 to USDC              <------ View actual PnL from recent token transactions             |
> record stats                                  <------ Record your last PnL on-chain (24h cooldown)               |
>-                                              --------------------------------------------------------------------
> achievements                                  <------ View your unlocked achievements                            |
> mint <achievement_name>                       <------ Mint a soulbound achievement NFT                           |
>-                                              --------------------------------------------------------------------
> analyze                                       <------ Analyze wallet Token and NFT interactions                  |
>-                                              --------------------------------------------------------------------
> check balance <token name>                    <------ View token balance for connected wallet                    |
>-                                              --------------------------------------------------------------------
> show my nfts                                  <------ Show all your owned NFTs (with max limit)                  |
>-                                              --------------------------------------------------------------------
> best price for <token name> 1 to USDC         <------ Compare DEX prices for a token                             |
>-                                              --------------------------------------------------------------------
> token report <token name> 1 to USDC           <------ 7-day price history, % change, sentiment                   |
>-------------------------------------------------------------------------------------------------------------------
"""

def simulate_clear():
    return "Terminal cleared."

def analyze_wallet(address):
    try:
        # 1️⃣ Total transactions
        tx_resp = requests.post(
            "https://mon-terminal-production.up.railway.app/api/analyze/tx-count",
            json={"address": address}
        )
        tx_resp.raise_for_status()
        total = tx_resp.json().get("totalTxCount", 0)

        # compute activity level
        if total >= 5000:
            activity = "High"
        elif total >= 1000:
            activity = "Intermediate"
        elif total >= 200:
            activity = "Fair"
        else:
            activity = "Low"

        # 2️⃣ Token interactions
        ts_resp = requests.post(
            "https://mon-terminal-production.up.railway.app/api/analyze/token-stats",
            json={"address": address}
        )
        ts_resp.raise_for_status()
        token_stats = ts_resp.json().get("tokenStats", {})

        # 3️⃣ NFT holdings
        nft_resp = requests.post(
            "https://mon-terminal-production.up.railway.app/api/analyze/nft-holdings",
            json={"address": address}
        )
        nft_resp.raise_for_status()
        nft_data = nft_resp.json().get("data", {})
        total_nfts   = nft_data.get("totalNFTCount", 0)
        group_holdings = nft_data.get("groupHoldings", [])

        # build lines
        lines = [
            f"Mon Terminal Report for Wallet {address}:",
            f"- Total Transactions: {total}",
            f"- Activity Level:     {activity}",
            "- Token Interactions:"
        ]
        for symbol, cnt in token_stats.items():
            lines.append(f"  • {symbol}: {cnt}")

        lines.append(f"- NFT Holdings: {total_nfts}")
        for group in group_holdings:
            lines.append(f"{group['groupName']}:")
            for item in group["items"]:
                lines.append(f"  • {item['name']}: {item['status']} ({item['count']} pcs)")

        return "\n".join(lines)

    except requests.HTTPError as e:
        return f"❌ Failed to analyze wallet: HTTP {e.response.status_code}"
    except Exception as e:
        return f"❌ Mon Terminal backend error: {str(e)}"

def simulate_check_balance(token):
    try:
        response = requests.post("https://mon-terminal-production.up.railway.app/api/balance", json={
            "address": WALLET_ADDRESS,
            "token": token
        })
        data = response.json()
        if data.get("success"):
            return f"Your {token.upper()} balance is {data['balance']['formatted']}"
        else:
            return f"Failed to fetch balance: {data.get('error', 'Unknown error')}"
    except Exception as e:
        return f"Mon Terminal backend error: {str(e)}"

def simulate_check_pnl(token, amount, dest):
    try:
        payload = {
            "address": WALLET_ADDRESS,
            "token": token.upper(),
            "amount": str(amount),
            "to": dest.upper()
        }
        resp = requests.post("https://mon-terminal-production.up.railway.app/api/pnl", json=payload)
        data = resp.json()
        if data.get("success"):
            e = data["data"]
            return (
                f"📈 PnL Report for {e['symbol']} ({amount} → {e['to']}):\n"
                f"- Quoted Amount: {e['quotedAmount']} {e['to']}\n"
                f"- Cost for {amount}: ${e['costForAmount']:.6f}\n"
                f"- PnL: ${e['pnlForAmount']:.6f} ({e['pnlPercentage']:.2f}%)"
            )
        else:
            return f"❌ PnL error: {data.get('error')}"
    except Exception as ex:
        return f"❌ PnL fetch error: {str(ex)}"

def simulate_record_stats():
    try:
        response = requests.post("https://mon-terminal-production.up.railway.app/api/record-stat", json={
            "address": WALLET_ADDRESS,
            "pnl": 69.42  # You may dynamically get PnL if needed
        })
        data = response.json()
        if data.get("success"):
            return f"✅ Stat recorded on-chain! Tx hash: {data['hash']}"
        else:
            return f"❌ Record stat failed: {data.get('error', 'Unknown error')}"
    except Exception as e:
        return f"❌ Record stat error: {str(e)}"

def simulate_achievements():
    try:
        response = requests.get(f"https://mon-terminal-production.up.railway.app/api/achievements/{WALLET_ADDRESS}")
        data = response.json()
        if data.get("success"):
            unlocked = [achievementNames[id] for id, ok in data["achievements"].items() if ok]
            if not unlocked:
                return "No achievements unlocked yet."
            lines = ["Unlocked Achievements:"]
            lines += [f"- {label}" for label in unlocked]
            lines.append("Type mint <achievement_id> to mint any new achievements.")
            return "\n".join(lines)
        else:
            return f"❌ Failed to fetch achievements: {data.get('error', 'Unknown error')}"
    except Exception as e:
        return f"Mon Terminal backend error: {str(e)}"

def simulate_mint(ach_id):
    label = achievementNames.get(ach_id)
    if not label:
        return f"❌ Unknown achievement ID '{ach_id}'."
    try:
        response = requests.post("https://mon-terminal-production.up.railway.app/api/achievements/mint", json={
            "address": WALLET_ADDRESS,
            "id": ach_id,
            "label": label
        })
        data = response.json()
        if data.get("success"):
            return f"✅ Minted {label}! Tx: {data['hash']}"
        else:
            return f"❌ Mint failed: {data.get('error', 'Unknown error')}"
    except Exception as e:
        return f"❌ Mint error: {str(e)}"

def simulate_token_report(token, amount, dest):
    try:
        resp = requests.post(
            "https://mon-terminal-production.up.railway.app/api/token-report",
            json={"symbol": token.upper()}
        )
        data = resp.json()

        if data.get("success"):
            report = data["data"]
            prices = report.get("prices", [])
            if not prices:
                return f"❌ No price history for {token}"

            first = prices[0]['price']
            last  = prices[-1]['price']
            change = last - first
            pct = (change / first) * 100 if first else 0
            sentiment = 'bullish' if pct > 5 else ('bearish' if pct < -5 else 'neutral')

            lines = [
                f"📊 Token Report for {token.upper()}:",
                f"- 7d Change: {pct:.2f}% ({first:.4f}→{last:.4f})",
                f"- Sentiment: {sentiment}",
                "History:"
            ]
            for p in prices:
                lines.append(f"  {p['date']}: {p['price']}")

            return "\n".join(lines)
        else:
            return f"❌ Report error: {data.get('error')}"

    except Exception as ex:
        return f"❌ Report fetch error: {str(ex)}"

def simulate_best_price(token, amount, dest):
    try:
        payload = {
            "symbol": token.upper(),
            "to": dest.upper(),
            "sender": WALLET_ADDRESS
        }
        resp = requests.post("https://mon-terminal-production.up.railway.app/api/best-price", json=payload)
        data = resp.json()
        if data.get("success"):
            d = data["data"]
            per = d['pricePerUnit']
            total = per * float(amount)
            return (
                f"💱 Best Price for {d['symbol']} ({amount} → {d['to']}):\n"
                f"- Unit Price: ${per:.6f}\n"
                f"- Total:      ${total:.6f}"
            )
        else:
            return f"❌ Best price error: {data.get('error')}"
    except Exception as ex:
        return f"❌ Best price fetch error: {str(ex)}"

def fetch_nfts(identifier='all'):
    """
    Fetch NFTs for the wallet. identifier can be 'all', a contract address, or an NFT name.
    Returns dict: {'nfts': List, 'error': None or str}
    """
    try:
        resp = requests.post(
            "https://mon-terminal-production.up.railway.app/api/checkNFT",
            json={"owner": WALLET_ADDRESS, "command": "my nfts", "type": identifier}
        )
        if resp.status_code != 200:
            return {"nfts": [], "error": f"API returned status {resp.status_code}"}
        data = resp.json()
        return {"nfts": data.get('nfts', []), "error": None}
    except Exception as e:
        return {"nfts": [], "error": str(e)}


def simulate_nft_list(sort_by=None):
    result = fetch_nfts('all')
    if result['error']:
        return f"❌ Error fetching NFTs: {result['error']}"
    nfts = result['nfts']
    if not nfts:
        return "No NFTs found."
    items = []
    for nft in nfts:
        contract = nft.get('contract', {}).get('address', '')
        metadata = nft.get('metadata', {}) or {}
        name = metadata.get('name') or nft.get('title') or ''
        token_id_raw = nft.get('id', {}).get('tokenId', '')
        try:
            token_id = int(token_id_raw, 16)
        except:
            token_id = token_id_raw
        items.append({"name": name, "contract": contract, "id": token_id})
    if sort_by == 'name':
        items.sort(key=lambda x: x['name'].lower())
    elif sort_by == 'id':
        try:
            items.sort(key=lambda x: int(x['id']))
        except:
            pass
    lines = ["Your NFTs:"]
    for item in items:
        lines.append(f"- {item['name']} (Contract: {item['contract']}, ID: {item['id']})")
    return "\n".join(lines)


def simulate_nft_search(keyword):
    direct = fetch_nfts(keyword)
    if direct['error']:
        return f"❌ Error fetching NFTs for '{keyword}': {direct['error']}"
    nfts = direct['nfts']
    if nfts:
        lines = [f"NFTs for '{keyword}':"]
        for nft in nfts:
            metadata = nft.get('metadata', {}) or {}
            name = metadata.get('name') or nft.get('title') or ''
            token_id_raw = nft.get('id', {}).get('tokenId', '')
            try:
                token_id = int(token_id_raw, 16)
            except:
                token_id = token_id_raw
            lines.append(f"- {name} (ID: {token_id})")
        return "\n".join(lines)
    all_result = fetch_nfts('all')
    if all_result['error']:
        return f"❌ Error fetching all NFTs: {all_result['error']}"
    matches = []
    for nft in all_result['nfts']:
        metadata = nft.get('metadata', {}) or {}
        name = metadata.get('name') or ''
        if keyword.lower() in name.lower():
            contract = nft.get('contract', {}).get('address', '')
            token_id_raw = nft.get('id', {}).get('tokenId', '')
            try:
                token_id = int(token_id_raw, 16)
            except:
                token_id = token_id_raw
            matches.append({"name": name, "contract": contract, "id": token_id})
    if not matches:
        return f"No NFTs matching '{keyword}' found."
    lines = [f"NFTs matching '{keyword}':"]
    for m in matches:
        lines.append(f"- {m['name']} (Contract: {m['contract']}, ID: {m['id']})")
    return "\n".join(lines)

def simulate_stake(type, amount, receiver):
    resp = requests.post(f"{BASE_URL}/stake", json={
        "type": type,
        "amount": amount,
        "sender": WALLET_ADDRESS,
        "receiver": receiver
    })
    data = resp.json()
    if data.get("success"):
        tx = data["transaction"]
        return f"Built stake payload: {tx}"
    else:
        return f"❌ Stake error: {data.get('error')}"

def main():
    args = sys.argv[1:]
    if not args:
        return print("Mon Terminal: Awaiting your command. Try 'help'.")

    command = args[0].lower()

    if command == "help":
        print(print_help())

    elif command == "clear":
        print(simulate_clear())

    elif command == "analyze" and len(args) > 1:
        print(analyze_wallet(args[1]))

    elif command == 'check' and len(args) > 1:
        if args[1] == 'balance' and len(args) > 2:
             print(simulate_check_balance(args[2]))
        elif args[1] == 'pnl' and len(args) >= 6 and args[4].lower() == 'to':
             print(simulate_check_pnl(args[2], args[3], args[5]))
        else:
             print("❌ Usage: check pnl <token> <amt> to <dest>")

    elif command == "record" and len(args) > 1 and args[1] == "stats":
        print(simulate_record_stats())

    elif command in ("achievements", "my") and len(args) > 1 and args[1] == "achievements":
        print(simulate_achievements())

    elif command == "mint" and len(args) > 1:
        print(simulate_mint(args[1]))

    elif command == 'best' and len(args) > 2 and args[1] == 'price' and args[2] == 'for':
        if len(args) >= 7 and args[5].lower() == 'to':
             print(simulate_best_price(args[3], args[4], args[6]))
        else:
             print("❌ Usage: best price for <token> <amt> to <dest>")

    # ── Token Report ──
    elif command == 'token' and len(args) > 2 and args[1].lower() == 'report':
        if len(args) >= 6 and args[4].lower() == 'to':
             print(simulate_token_report(args[2], args[3], args[5]))
        else:
             print("❌ Usage: token report <token> <amt> to <dest>")

    # ── Send / Transfer ──
    elif command == "send" and len(args) > 3 and args[2].lower() == "to":
        # Usage: send <amount> <token> to <address>
        amount  = args[1]
        token   = args[2].upper()
        to_addr = args[3]

        global PENDING_SEND
        PENDING_SEND = { "amount": amount, "token": token, "to": to_addr }

        print(f"> Ready to send {amount} {token} → {to_addr}")
        print("> Type: confirm transfer")
        return

    # ── Confirm Transfer ──
    elif command == "confirm" and len(args) > 1 and args[1].lower() == "transfer":
        if not PENDING_SEND:
            print("❌ No pending transfer. First use: send <amt> <token> to <address>")
            return

        amt = PENDING_SEND["amount"]
        tok = PENDING_SEND["token"]
        toa = PENDING_SEND["to"]

        try:
            # TODO: wire up your real RPC / backend call here
            print(f"🚀 Sent {amt} {tok}! (simulated)")
        except Exception as e:
            print(f"❌ Transfer failed: {str(e)}")
        finally:
            PENDING_SEND = {}
        return

    # ────────── Stake ──────────
    elif command == "stake" and len(args) >= 3:
        # args: [ "stake", "<aprMON|gMON|sMON>", "<amount>", "[receiver]" ]
        token_key = args[1]    # aprMON, gMON or sMON
        amount    = args[2]    # human amount, e.g. "1.5"
        receiver  = args[3] if len(args) > 3 else WALLET_ADDRESS

        # build the transaction via your backend
        try:
            resp = requests.post(f"{BASE_URL}/stake", json={
                "type":     token_key,
                "amount":   amount,
                "sender":   WALLET_ADDRESS,
                "receiver": receiver
            })
            data = resp.json()
            if not data.get("success"):
                print(f"❌ Stake error: {data.get('error')}")
                return

            tx = data["transaction"]
            global LAST_STAKE_TX
            LAST_STAKE_TX = tx

            print("🚀 Stake transaction built:")
            print(f"- To:            {tx['to']}")
            print(f"- Function:      {tx['functionName']}")
            print(f"- Args:          {tx['args']}")
            print(f"- Value (wei):   {tx.get('value', '0')}")
            print(f"- GasLimit:      {tx['gasLimit']}")
            print("\nType `confirm-stake` to broadcast this transaction.")
        except Exception as e:
            print(f"❌ Failed to build stake tx: {str(e)}")
        return

    # ────────── Confirm Stake ──────────
    elif command == "confirm-stake":
        if not LAST_STAKE_TX:
            print("❌ No stake ready. First run: stake <token> <amount> [receiver]")
            return

        # Echo the saved transaction payload for the Wagmi front-end
        print("🚀 Stake ready to send. Payload:")
        print(json.dumps(LAST_STAKE_TX, indent=2))
        print("\nNow switch to the web UI and type `confirm-stake` there to open your wallet and broadcast.")
        LAST_STAKE_TX = {}
        return 

    # ────────── Swap Quote ──────────
    elif command == "swap" and len(args) >= 5 and args[3].lower() == "to":
        sym_from = args[1].upper()
        amount   = args[2]
        sym_to   = args[4].upper()

        from_token = TOKEN_ADDRESSES.get(sym_from)
        to_token   = TOKEN_ADDRESSES.get(sym_to)

        if not from_token or not to_token:
            bad = sym_from if not from_token else sym_to
            print(f"❌ Unknown token symbol: {bad}")
            return

        try:
            resp = requests.post(
                f"{BASE_URL}/swap/quote",
                json={
                    "from":     from_token,
                    "to":       to_token,
                    "amount":   amount,
                    "sender":   WALLET_ADDRESS,           # ← note trailing comma
                    "gasLimit": DEFAULT_GAS_LIMIT
                }
            )
            data = resp.json()
            if data.get("success"):
                q = data["quote"]
                print(
                    f"📊 Quote for swapping {amount} {sym_from} → {sym_to}:\n"
                    f"- You send:       {q['input_formatted']} {sym_from}\n"
                    f"- You’ll receive: {q['output_formatted']} {sym_to}\n"
                    f"- Min receive:    {q['min_output_formatted']} {sym_to}\n"
                    f"- Price impact:   {float(q['compound_impact'])*100:.2f}%\n\n"
                    f"Type: confirm"
                )

                # store for confirm
                global LAST_SWAP_QUOTE
                LAST_SWAP_QUOTE = {
                    "from":     from_token,
                    "to":       to_token,
                    "amount":   amount,
                    "sender":   WALLET_ADDRESS,          # ← and here
                    "gasLimit": DEFAULT_GAS_LIMIT
                }
            else:
                print(f"❌ Swap quote error: {data.get('error')}")
        except Exception as e:
            print(f"❌ Swap quote error: {e}")

    # ────────── Swap Confirm (Simple) ──────────
    elif command == "confirm":
        if not LAST_SWAP_QUOTE:
            print("❌ No swap quote found. Use 'swap <from> <amount> to <to>' first.")
            return

        try:
            resp = requests.post(f"{BASE_URL}/swap/confirm", json=LAST_SWAP_QUOTE)
            data = resp.json()
            if data.get("success") and "transaction" in data:
                tx = data["transaction"]
                if "rawTransaction" in tx:
                    print("🚀 Raw transaction (legacy Monorail response):")
                    print(tx["rawTransaction"])
                else:
                    print("🚀 Structured transaction object:")
                    print(f"- To:    {tx['to']}")
                    print(f"- Data:  {tx['data']}")
                    print(f"- Value: {tx.get('value', '0x0')}")
            else:
                print(f"❌ Swap confirm error: {data.get('error', 'Missing transaction data')}")
        except Exception as e:
            print(f"❌ Swap confirm error: {e}")

    elif command == "show" and len(args) > 2 and args[1] == "my" and args[2] == "nfts":
        sort_by = None
        if len(args) > 3 and args[3].startswith('--sort='):
            sort_by = args[3].split('=', 1)[1]
        print(simulate_nft_list(sort_by))
    elif command == "find" and len(args) > 1 and args[1] == "nft":
        keyword = args[2] if len(args) > 2 else ""
        print(simulate_nft_search(keyword))

    else:
        print(f"> {' '.join(args)}\nUnknown command. Type help to see available options.")

if __name__ == "__main__":
    main()