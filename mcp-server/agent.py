import sys
import time
import json
import requests

WALLET_ADDRESS = "0xd9F016e453dE48D877e3f199E8FA4aADca2E979C"  # Replace dynamically if needed
_COOLDOWN_FILE = "cooldowns.json"
_COOLDOWN_SECONDS = 24 * 60 * 60

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
> show my nfts                 List owned NFTs (by value)
> find nft <keyword>           Search NFTs by name
> send <token> to <address>    Send token to address (bulk supported)
> token report <token>         7-day price history, % change, sentiment
"""

def simulate_clear():
    return "Terminal cleared."

def analyze_wallet(address):
    try:
        response = requests.post("http://localhost:3001/api/analyze", json={"address": address})
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
        response = requests.post("http://localhost:3001/api/balance", json={
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
        response = requests.post("http://localhost:3001/api/pnl", json={
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
    cooldowns = _load_cooldowns()
    now = int(time.time())
    last = cooldowns.get(WALLET_ADDRESS, 0)
    if now < last + _COOLDOWN_SECONDS:
        rem = (last + _COOLDOWN_SECONDS) - now
        hrs = rem // 3600
        mins = (rem % 3600) // 60
        return f"❌ You can only record stats once every 24 hours. Try again in {hrs}h {mins}m."
    cooldowns[WALLET_ADDRESS] = now
    _save_cooldowns(cooldowns)
    return "✅ Stat submitted (simulated)."

def simulate_achievements():
    try:
        response = requests.get(f"http://localhost:3001/api/achievements/{WALLET_ADDRESS}")
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
        response = requests.post("http://localhost:3001/api/achievements/mint", json={
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

    else:
        print(f"> {' '.join(args)}\nUnknown command. Type `help` to see available options.")

if __name__ == "__main__":
    main()
