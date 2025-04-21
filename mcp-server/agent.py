import sys
import time
import json
import requests

WALLET_ADDRESS = "0xd9F016e453dE48D877e3f199E8FA4aADca2E979C"  # Replace dynamically if needed
_COOLDOWN_FILE = "cooldowns.json"
_COOLDOWN_SECONDS = 24 * 60 * 60
LAST_SWAP_QUOTE = {}

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
> help                         Show this help menu
> clear                        Clear the terminal
> analyze                      Analyze wallet and suggest testnet tasks
> check balance <token>        View token balance for connected wallet
> check pnl <token>            View actual PnL from recent token transactions
> record stats                 Record your last PnL on-chain (24h cooldown)
> achievements                 View your unlocked achievements
> mint <achievement_name>      Mint a soulbound achievement NFT
> best price for <token>       Compare DEX prices for a token
> swap <from> <amount> to <to>    Quote a token swap (e.g. swap MON 1 to USDC)
> confirm <from> <amount> to <to> Execute a quoted swap
> show my nfts                 List owned NFTs (by value)
> find nft <keyword>           Search NFTs by name
> send <token> to <address>    Send token to address (bulk supported)
> token report <token>         7-day price history, % change, sentiment
"""

def simulate_clear():
    return "Terminal cleared."

def analyze_wallet(address):
    try:
        response = requests.post("https://mon-terminal.onrender.com/api/analyze", json={"address": address})
        data = response.json()

        if data.get("success"):
            result = data["data"]
            dex_interactions = result['dexSummary']['interactions']
            dex_lines = "\n".join([f"  -> {dex}: {count} interactions" for dex, count in dex_interactions.items()])

            nft_info = result['nftHoldings']
            nft_summary = (f"- NFTs: {nft_info['total']} total ({nft_info['verified']} verified, "
                           f"{nft_info['unverified']} unverified)")

            return (f"Mon Terminal Report for Wallet {address}:\n"
                    f"- Activity Level: {result['activityLevel']}\n"
                    f"- Total Transactions: {result['transactionCount']}\n"
                    f"{nft_summary}\n"
                    f"- DEX Interactions (last 3 days):\n{dex_lines}\n"
                    f"Disclaimer: {result['disclaimer']}")

        else:
            return f"❌ Failed to analyze wallet: {data.get('message', 'Unknown error')}"

    except Exception as e:
        return f"❌ Mon Terminal backend error: {str(e)}"

def simulate_check_balance(token):
    try:
        response = requests.post("https://mon-terminal.onrender.com/api/balance", json={
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

def simulate_check_pnl(token):
    try:
        response = requests.post("https://mon-terminal.onrender.com/api/pnl", json={
            "address": WALLET_ADDRESS,
            "token": token
        })
        data = response.json()
        if data.get("success") and data.get("pnl"):
            entry = data["pnl"][0]
            if "error" in entry:
                return f"PnL Error ({token.upper()}): {entry['error']}"

            return (
                f"PnL Report for {entry['symbol']}:\n"
                f"- Average Buy Price: ${round(entry['averageBuyPrice'], 4)}\n"
                f"- Current Price:     ${round(entry['currentPrice'], 4)}\n"
                f"- Current Balance:   {round(entry['currentBalance'], 6)} {entry['symbol']}\n"
                f"- Current Value:     ${round(entry['currentValue'], 2)}\n"
                f"- Total Cost:        ${round(entry['totalCost'], 2)}\n"
                f"- PnL:               ${round(entry['pnl'], 2)}"
            )
        else:
            return f"Failed to fetch PnL: {data.get('error', 'Unknown error')}"
    except Exception as e:
        return f"Mon Terminal backend error: {str(e)}"

def simulate_record_stats():
    try:
        response = requests.post("https://mon-terminal.onrender.com/api/record-stat", json={
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
        response = requests.get(f"https://mon-terminal.onrender.com/api/achievements/{WALLET_ADDRESS}")
        data = response.json()
        if data.get("success"):
            unlocked = [achievementNames[id] for id, ok in data["achievements"].items() if ok]
            if not unlocked:
                return "No achievements unlocked yet."
            lines = ["Unlocked Achievements:"]
            lines += [f"- {label}" for label in unlocked]
            lines.append("Type `mint <achievement_id>` to mint any new achievements.")
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
        response = requests.post("https://mon-terminal.onrender.com/api/achievements/mint", json={
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

def simulate_token_report(token):
    try:
        response = requests.post(
            "https://mon-terminal.onrender.com/api/token-report",
            json={"symbol": token}
        )
        data = response.json()
        if data.get("success"):
            # updated key for report data
            info = data.get("data", {})
            return (
                f"📊 Token Report for {token.upper()}:\n"
                f"- 7d Price Change: {info.get('percentChange', '0.00')}%\n"
                f"- Sentiment:       {info.get('sentiment', 'neutral')}"
            )
        else:
            return f"❌ Token report error: {data.get('error', 'Unknown error')}"
    except Exception as e:
        return f"❌ Token report error: {str(e)}"

def simulate_best_price(token):
    try:
        response = requests.post("https://mon-terminal.onrender.com/api/best-price", json={
            "symbol": token
        })
        data = response.json()

        if data.get("success"):
            return f"💱 Best Price for {token.upper()}: ${data['price']} (via {data['source']})"
        else:
            return f"❌ {data.get('error', 'Unknown error')}"
    except Exception as e:
        return f"❌ Best price fetch error: {str(e)}"

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

    elif command == "check" and len(args) > 1:
        sub_cmd = args[1]
        if sub_cmd == "balance" and len(args) > 2:
            print(simulate_check_balance(args[2]))
        elif sub_cmd == "pnl":
            if len(args) > 2:
                print(simulate_check_pnl(args[2]))
            else:
                print("❌ Please specify a token for PnL check (e.g., check pnl MON)")

    elif command == "record" and len(args) > 1 and args[1] == "stats":
        print(simulate_record_stats())

    elif command in ("achievements", "my") and len(args) > 1 and args[1] == "achievements":
        print(simulate_achievements())

    elif command == "mint" and len(args) > 1:
        print(simulate_mint(args[1]))

    elif command == "best" and len(args) > 2 and args[1] == "price" and args[2] == "for":
        token = args[3] if len(args) > 3 else "?"
        print(simulate_best_price(token))

    elif command == "show" and len(args) > 2 and args[1] == "my" and args[2] == "nfts":
        print(simulate_nft_list())

    elif command == "find" and len(args) > 1 and args[1] == "nft":
        keyword = args[2] if len(args) > 2 else "???"
        print(simulate_nft_search(keyword))

    elif command == "send" and len(args) > 3 and args[2] == "to":
        print(simulate_send_token(args[1], args[3]))

    elif command == "token" and len(args) > 2 and args[1] == "report":
        print(simulate_token_report(args[2]))

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
            resp = requests.post("https://mon-terminal.onrender.com/api/swap/quote", json={
                "from":   from_token,
                "to":     to_token,
                "amount": amount,
                "sender": WALLET_ADDRESS
            })
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
                # 🧠 Store last swap
                global LAST_SWAP_QUOTE
                LAST_SWAP_QUOTE = {
                    "from": from_token,
                    "to": to_token,
                    "amount": amount,
                    "sender": WALLET_ADDRESS
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
            resp = requests.post("https://mon-terminal.onrender.com/api/swap/confirm", json=LAST_SWAP_QUOTE)
            data = resp.json()
            if data.get("success") and data.get("transaction"):
                tx = data["transaction"]
                print("🚀 Raw swap transaction object (pass this to your front‑end for signing):")
                print(json.dumps(tx, indent=2))
            else:
                print(f"❌ Swap confirm error: {data.get('error', 'Missing transaction data')}")
        except Exception as e:
            print(f"❌ Swap confirm error: {e}")

    else:
        print(f"> {' '.join(args)}\nUnknown command. Type `help` to see available options.")

if __name__ == "__main__":
    main()
