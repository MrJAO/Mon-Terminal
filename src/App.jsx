import React, { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useBalance, useWriteContract, usePublicClient } from 'wagmi'
import { Typewriter } from 'react-simple-typewriter'
import TOKEN_LIST from './constants/tokenList'
import { MON_TERMINAL_ABI } from './constants/MonTerminalABI'
import ACHIEVEMENT_ABI from './constants/SimpleAchievementNFT.abi.json'
import { useWalletClient } from 'wagmi'
import TerminalFooter from './components/TerminalFooter';
import './App.css'
import './Achievements.css'
import './TokenReport.css'
import './analyzeStyle.css'
import './NFT.css';
import { getWalletClient } from '@wagmi/core'
import { ethers } from 'ethers'
import erc20Abi from './abi/erc20.json'
import { resolveTokenAddress } from '../mcp-server/api/resolveToken.js'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts'

const renderNFTs = (nfts, sortBy) => {
  const processed = nfts
    .filter(nft => nft?.tokenId || nft?.id?.tokenId)
    .map(nft => {
      const rawId = nft.tokenId ?? nft.id?.tokenId ?? null
      const id = rawId ? parseInt(rawId, 16) : 'Unknown'
      return { ...nft, displayId: id }
    })
    .sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
      if (sortBy === 'id') return a.displayId - b.displayId
      return 0
    })

  return (
    <div className="nft-container animate-fadeIn">
      {processed.map(nft => {
        const name = nft.name || nft.metadata?.name || nft.title || `NFT #${nft.displayId}` || 'Unknown'
        const imgUrl = nft.image?.cachedUrl || nft.image?.pngUrl || nft.image?.originalUrl || nft.media?.[0]?.gateway || ''
        return (
          <div className="nft-item pixel-glow" key={`${nft.contract?.address}-${nft.displayId}`}>
            {imgUrl && <img src={imgUrl} alt={name} />}
            <div className="nft-name">{name}</div>
            <div className="nft-divider" />
            <div className="nft-id">ID: {nft.displayId}</div>
            <div className="nft-contract break-all leading-snug text-[10px] tracking-tight text-purple-300">
              {nft.contract?.address}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const MON_TERMINAL_ADDRESS = import.meta.env.VITE_MON_TERMINAL_ADDRESS
const ACHIEVEMENT_ADDRESS = import.meta.env.VITE_ACHIEVEMENT_NFT_ADDRESS
const baseApiUrl = import.meta.env.PROD
  ? 'https://mon-terminal.onrender.com/api'
  : '/api'

function App() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { writeContractAsync } = useWriteContract()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  const [hasTyped, setHasTyped] = useState(false)
  const [terminalLines, setTerminalLines] = useState([])
  const [pnlChartData, setPnlChartData] = useState(null)
  const [currentPnL, setCurrentPnL] = useState(null)
  const [achievements, setAchievements] = useState({})
  const [showAchievementsUI, setShowAchievementsUI] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeProgress, setAnalyzeProgress] = useState('')  
  const [lastSwapQuote, setLastSwapQuote] = useState(null)
  const [isCooldownActive, setIsCooldownActive] = useState(false)
  const [cooldownTimestamp, setCooldownTimestamp] = useState(null)
  const [nftResults, setNftResults] = useState(null)
  const [pendingSend, setPendingSend] = useState(null)

  const achievementNames = {
    green10: "Profit Initiate",
    red10: "Paperhands",
    green20: "Bull Rider",
    red20: "Overtrader",
    green30: "Momentum Master",
    red30: "Dip Devotee",
    green40: "Terminal Trader",
    red40: "Hopeless Holder",
    green50: "Ghost of Green",
    red50: "Ghost of Red",
    green_hidden: "King of Green Days",
    red_hidden: "What a Freaking Loser",
  }

  useEffect(() => {
    const stored = parseInt(localStorage.getItem('mon-terminal-cooldown'), 10)
    if (stored && Date.now() < stored) {
      setCooldownTimestamp(stored)
      setIsCooldownActive(true)
      setTimeout(() => setIsCooldownActive(false), stored - Date.now())
    }
  }, [])

  useEffect(() => {
    if (isConnected) {
      setHasTyped(true)
    }
  }, [isConnected])

  const { data: tokenBalance } = useBalance({
    address,
    chainId: 10143,
    token: undefined,
    enabled: !!address,
    watch: true,
  })

  const handleConnect = () => {
    const injectedConnector = connectors.find((c) => c.id === 'injected')
    if (injectedConnector) {
      connect({ connector: injectedConnector })
    } else {
      alert('No injected wallet found.')
    }
  }

  const handleDisconnect = () => {
    disconnect()
    localStorage.removeItem('mon-terminal-connected')
    localStorage.removeItem('mon-terminal-cooldown')
  }

  const handleRecordStat = async () => {
    if (!address || currentPnL === null) return
    if (cooldownTimestamp && Date.now() < cooldownTimestamp) {
      setTerminalLines(prev => [...prev, '❌ You can only submit stats once every 24 hours.'])
      return
    }

    setIsCooldownActive(true)
    setTerminalLines(prev => [...prev, '> Mon Terminal is thinking...'])

    try {
      const hash = await writeContractAsync({
        abi: MON_TERMINAL_ABI,
        address: MON_TERMINAL_ADDRESS,
        functionName: 'recordStat',
        args: [BigInt(Math.round(currentPnL * 1e6))],
      })

      setTerminalLines(prev => {
        const lines = [...prev]
        if (lines[lines.length - 1] === '> Mon Terminal is thinking...') lines.pop()
        return [...lines, `> ✅ Stat submitted. Tx: ${hash.slice(0, 10)}...`]
      })

      const nextTs = Date.now() + 24 * 60 * 60 * 1000
      setCooldownTimestamp(nextTs)
      localStorage.setItem('mon-terminal-cooldown', nextTs.toString())
      setTimeout(() => setIsCooldownActive(false), 24 * 60 * 60 * 1000)
    } catch (err) {
      console.error(err)
      setTerminalLines(prev => {
        const lines = [...prev]
        if (lines[lines.length - 1] === '> Mon Terminal is thinking...') lines.pop()
        const msg = err.message?.includes('Cooldown active')
          ? '❌ You can only submit stats once every 24 hours.'
          : `❌ Failed to record stat: ${err.message}`
        return [...lines, msg]
      })
      setIsCooldownActive(false)
    }
  }

  const handleMint = async (id, label) => {
    setTerminalLines(prev => [...prev, `> Minting ${label}...`])
    try {
      const hash = await writeContractAsync({
        abi: ACHIEVEMENT_ABI,
        address: ACHIEVEMENT_ADDRESS,
        functionName: 'mint',
        args: [address, id, label],
      })
      setTerminalLines(prev => [...prev, `> ✅ Mint submitted. Tx: ${hash.slice(0,10)}...`])
      setAchievements(prev => ({ ...prev, [id]: false }))
    } catch (err) {
      setTerminalLines(prev => [...prev, `❌ Mint error: ${err.message}`])
    }
  }

  const handleCommandInput = async (e) => {
    if (e.key !== 'Enter') return
  
    const input = e.target.value.trim()
    e.target.value = ''
    if (!input) return
  
    setPnlChartData(null)
    setShowAchievementsUI(false)
    setNftResults(null)
    setTerminalLines(prev => [...prev, `> ${input}`, '> Mon Terminal is thinking...'])
  
    const [cmd, sub, tokenArg, ...rest] = input.split(' ')
  
  // ── PnL ──
  if (cmd === 'check' && sub === 'pnl') {
    const symbol    = tokenArg?.toUpperCase()
    const amount    = rest[0]
    const toKeyword = rest[1]?.toLowerCase()
    const dest      = rest[2]?.toUpperCase()

    if (!symbol || !amount || toKeyword !== 'to' || !dest) {
      setTerminalLines(prev => [
        ...prev,
        '❌ Usage: check pnl <token> <amt> to <dest>'
      ])
      return
    }

    try {
      const res = await fetch(`${baseApiUrl}/pnl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          token: symbol,
          amount: Number(amount),
          to: dest
        })
      })
      const data = await res.json()

      let records = []
      if (data.success) {
        const raw = data.data
        if (Array.isArray(raw)) {
          records = raw
        } else if (typeof raw === 'object') {
          records = [raw]
        }
      }

      if (records.length && !records[0]?.error) {
        const header = `📈 24hrs PnL for ${records[0].symbol} (${amount}→${records[0].to}):`

        const jsxOutput = [
          <div key="pnl-header" className="pnl-output-line">{header}</div>
        ]

        records.forEach((r, i) => {
          const isProfit = r.pnlForAmount >= 0
          const pnlClass = isProfit ? 'pnl-positive' : 'pnl-negative'

          jsxOutput.push(
            <div key={`pnl-r-${i}-received`} className="pnl-output-line">- Received {r.quotedAmount.toFixed(6)} {r.to}</div>,
            <div key={`pnl-r-${i}-cost`} className="pnl-output-line">- Cost ${r.costForAmount.toFixed(6)}</div>,
            <div key={`pnl-r-${i}-pnl`} className={`pnl-output-line ${pnlClass}`}>
              - PnL ${r.pnlForAmount.toFixed(6)} ({r.pnlPercentage.toFixed(2)}%)
            </div>,
            <br key={`pnl-r-${i}-break`} />
          )
        })

        setPnlChartData(records.map(r => ({ label: r.date, value: r.pnlForAmount })))
        setCurrentPnL(records[records.length - 1].pnlForAmount)

        setTerminalLines(prev => {
          const lines = [...prev.slice(0, -1)]
          return [...lines, ...jsxOutput]
        })

      } else {
        const errMsg = data?.data?.error || data?.error || 'Invalid PnL data.'
        setTerminalLines(prev => [
          ...prev.slice(0, -1),
          `❌ ${errMsg}`
        ])
      }

    } catch {
      setTerminalLines(prev => [
        ...prev.slice(0, -1),
        '❌ Mon Terminal is not responding.'
      ])
    }  
  
    } else if ((cmd === 'my' && sub === 'achievements') || cmd === 'achievements') {
      try {
        const res = await fetch(`${baseApiUrl}/achievements/${address}`)
        const data = await res.json()
        if (data.success) {
          setAchievements(data.achievements)
          setShowAchievementsUI(true) // ✅ only show when this command is used
          setTerminalLines(prev => {
            const lines = [...prev]
            if (lines[lines.length - 1] === '> Mon Terminal is thinking...') lines.pop()
            lines.push('Achievement List:')
            return lines
          })
        } else {
          setTerminalLines(prev => {
            const lines = [...prev]
            if (lines[lines.length - 1] === '> Mon Terminal is thinking...') lines.pop()
            lines.push(`❌ ${data.error || 'Failed to load achievements.'}`)
            return lines
          })
        }
      } catch {
        setTerminalLines(prev => {
          const lines = [...prev]
          if (lines[lines.length - 1] === '> Mon Terminal is thinking...') lines.pop()
          lines.push('❌ Achievements fetch error.')
          return lines
        })
      }
    
    } else if (cmd === 'record' && sub === 'stats') {
      if (currentPnL === null) {
        setTerminalLines(prev => [
          ...prev,
          '> No PnL data available. Use "check pnl <token>" first.'
        ])
        return
      }
      await handleRecordStat()
    
    } else if (cmd === 'mint') {
      const label = rest.join(' ').trim()
    
      if (!achievements || Object.keys(achievements).length === 0) {
        setTerminalLines(prev => {
          const lines = [...prev]
          if (lines[lines.length - 1] === '> Mon Terminal is thinking...') lines.pop()
          return [...lines, '❌ Please run the "achievements" command first.']
        })
        return
      }
    
      const entry = Object.entries(achievementNames).find(([id, l]) =>
        l.toLowerCase() === label.toLowerCase() ||
        `mint ${l.toLowerCase()}` === input.toLowerCase()
      )
    
      if (!entry) {
        setTerminalLines(prev => {
          const lines = [...prev]
          if (lines[lines.length - 1] === '> Mon Terminal is thinking...') lines.pop()
          return [...lines, `❌ Unknown achievement "${label}"`]
        })
        return
      }
    
      const [id, matchedLabel] = entry
      if (achievements[id] === 'eligible') {
        await handleMint(id, matchedLabel)
      } else {
        setTerminalLines(prev => {
          const lines = [...prev]
          if (lines[lines.length - 1] === '> Mon Terminal is thinking...') lines.pop()
          return [...lines, `❌ You are not eligible to mint "${matchedLabel}".`]
        })
      }
  
    } else if (cmd === 'analyze') {
      setIsAnalyzing(true)
      setTerminalLines(prev => [...prev, '> Mon Terminal is thinking...'])

      try {
        // 1) Txs
        setAnalyzeProgress('Counting transactions…')
        const txRes = await fetch(`${baseApiUrl}/analyze/tx-count`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address })
        })
        const { totalTxCount } = await txRes.json()

        // compute activity level locally
        let activityLevel = 'Low'
        if (totalTxCount >= 5000) activityLevel = 'High'
        else if (totalTxCount >= 1000) activityLevel = 'Intermediate'
        else if (totalTxCount >= 200)  activityLevel = 'Fair'

        // 2) Tokens
        setAnalyzeProgress('Fetching token interactions…')
        const tokenRes = await fetch(`${baseApiUrl}/analyze/token-stats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address })
        })
        const { tokenStats } = await tokenRes.json()

        // 3) NFTs
        setAnalyzeProgress('Loading NFTs…')
        const nftRes  = await fetch(`${baseApiUrl}/analyze/nft-holdings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address })
        })
        const nftBody = await nftRes.json()
        const { totalNFTCount, groupHoldings } = nftBody.data

        // render
        const styledReport = (
          <div className="analyze-container">
            {/* full-width header */}
            <div className="analyze-header">Mon Terminal Analysis</div>
        
            {/* ─── First panel: TXs, Activity & NFT count ─── */}
            <div className="analyze-section">
              <span className="analyze-label">Total Transactions:</span> {totalTxCount}
              <br />
              <span className="analyze-label">Activity Level:</span> {activityLevel}
              <br />
              <span className="analyze-label">NFT Holdings:</span> {totalNFTCount}
            </div>
        
            {/* ─── Token Interactions ─── */}
            <div className="analyze-section">
              <span className="analyze-label">Token Contract Interactions:</span>
              <ul className="analyze-list">
                {tokenStats.map(({ symbol, count }) => (
                  <li key={symbol}>{symbol}: {count}</li>
                ))}
              </ul>
            </div>
        
            {/* ─── Guaranteed Mainnet Mint (span two columns) ─── */}
            {groupHoldings
              .filter(g => g.groupName === 'Guaranteed Mainnet Mint')
              .map(({ groupName, items }) => (
                <div key={groupName} className="analyze-section span-2">
                  <span className="analyze-subheader">{groupName}</span>
                  <ul className="analyze-list">
                    {items.map(({ name, status }, i) => {
                      const statusClass =
                        status === 'Confirm'      ? 'status-confirm' :
                        status === 'Incomplete'   ? 'status-incomplete' :
                                                   'status-not-holding';
                      return (
                        <li key={i}>
                          {name}:{' '}
                          <span className={`analyze-nft-status ${statusClass}`}>
                            {status}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
            ))}
        
            {/* ─── Other NFT groups ─── */}
            {groupHoldings
              .filter(({ groupName }) =>
                groupName !== 'Featured Testnet NFTs' &&
                groupName !== 'Guaranteed Mainnet Mint'
              )
              .map(({ groupName, items }) => {
                const isFeaturedHeader = groupName === 'Breath of Estova';
        
                return (
                  <React.Fragment key={groupName}>
                    {isFeaturedHeader && (
                      <div className="analyze-section no-panel">
                        <span className="analyze-subheader">
                          Featured Testnet NFTs
                        </span>
                      </div>
                    )}
        
                    {items.length > 0 && (
                      <div className="analyze-section">
                        <span className="analyze-subheader">{groupName}</span>
                        <ul className="analyze-list">
                          {items.map(({ name, status }, i) => {
                            const statusClass =
                              status === 'Confirm'      ? 'status-confirm' :
                              status === 'Incomplete'   ? 'status-incomplete' :
                                                         'status-not-holding';
                            return (
                              <li key={i}>
                                {name}:{' '}
                                <span className={`analyze-nft-status ${statusClass}`}>
                                  {status}
                                </span>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}
                  </React.Fragment>
                )
              })}
          </div>
        )        

        setTerminalLines(prev => {
          const lines = prev.filter(l => l !== '> Mon Terminal is thinking...')
          return [...lines, styledReport]
        })

      } catch {
        setTerminalLines(prev => {
          const lines = prev.filter(l => l !== '> Mon Terminal is thinking...')
          return [...lines, '❌ Mon Terminal is not responding.']
        })
      } finally {
        setIsAnalyzing(false)
        setAnalyzeProgress('')
      }
            
    
    // ── Token Report ──
    } else if (cmd === 'token' && sub === 'report') {
      const symbol    = tokenArg?.toUpperCase()
      const amount    = rest[0]
      const toKeyword = rest[1]?.toLowerCase()
      const dest      = rest[2]?.toUpperCase()

      // 1) Validate syntax
      if (!symbol || !amount || toKeyword !== 'to' || !dest) {
        setTerminalLines(prev => [
          ...prev,
          '❌ Usage: token report <token> <amt> to <dest>'
        ])
        return
      }

      try {
        // 2) Fetch 7-day prices
        const res  = await fetch(`${baseApiUrl}/token-report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ symbol })
        })
        const json = await res.json()

        if (json.success) {
          const prices = json.data   // [{ date, price }, …]

          // 3) Compute change & sentiment
          const first = prices[0].price
          const last  = prices[prices.length - 1].price
          const change = last - first
          const pct    = first ? (change / first) * 100 : 0
          let sentiment = 'neutral'
          if (pct > 5)      sentiment = 'bullish'
          else if (pct < -5) sentiment = 'bearish'

          // 4) Render
          setTerminalLines(prev => {
            const lines = prev.slice(0, -1)
            return [
              ...lines,
              `📊 Token Report for ${symbol} (${amount}→${dest}):`,
              `- 7d Change:    ${pct.toFixed(2)}% (${first.toFixed(4)}→${last.toFixed(4)})`,
              `- Sentiment:    ${sentiment}`,
              'History:'
            ].concat(
              prices.map(p => `  ${p.date}: ${p.price}`)
            )
          })
        } else {
          throw new Error(json.error || 'Unknown error')
        }
      } catch (err) {
        setTerminalLines(prev => [
          ...prev.slice(0, -1),
          `❌ Token report error: ${err.message}`
        ])
      }        

    } else if (cmd === 'best' && sub === 'price' && tokenArg === 'for') {
      // ⬇ destructure the rest array
      const symbol    = rest[0]?.toUpperCase()
      const amount    = rest[1]
      const toKeyword = rest[2]?.toLowerCase()
      const dest      = rest[3]?.toUpperCase()
    
      // full syntax check
      if (!symbol || !amount || toKeyword !== 'to' || !dest) {
        setTerminalLines(prev => [
          ...prev,
          '❌ Usage: best price for <token> <amt> to <dest>'
        ])
        return
      }
    
      try {
        const res = await fetch(`${baseApiUrl}/best-price`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol,
            amount,
            to:      dest,
            sender:  address
          })
        })
        const data = await res.json()
    
        if (data.success) {
          const d = data.data
          const unit = d.pricePerUnit
          const total = unit * Number(amount)
    
          setTerminalLines(prev => {
            const lines = [...prev.slice(0, -1)]
            lines.push(
              `💱 Best Price for ${d.symbol} (${amount}→${d.to}):`,
              `- Unit Price: $${unit.toFixed(6)}`,
              `- Total:      $${total.toFixed(6)}`
            )
            return lines
          })
        } else {
          setTerminalLines(prev => {
            const lines = [...prev.slice(0, -1)]
            lines.push(`❌ ${data.error}`)
            return lines
          })
        }
      } catch {
        setTerminalLines(prev => {
          const lines = [...prev.slice(0, -1)]
          lines.push('❌ Failed to fetch best price.')
          return lines
        })
      }    
    }
      else if (cmd === 'send' && tokenArg && rest[0] === 'to') {
        const amount = sub
        const token  = tokenArg.toUpperCase()
        const to     = rest[1]
    
        setPendingSend({ amount, token, to })
        setTerminalLines(prev => [
          ...prev.slice(0, -1),
          `> Ready to send ${amount} ${token} → ${to}`,
          `> Type: confirm transfer`
        ])
       return
      }
    
    // ── Confirm Transfer ──
    else if (cmd === 'confirm' && sub === 'transfer') {
      if (!pendingSend) {
        setTerminalLines(prev => [
          ...prev.slice(0, -1),
          '❌ No pending transfer. First use: send <amt> <token> to <address>'
        ])
        return
      }
    
      const { amount, token, to } = pendingSend
      setTerminalLines(prev => [...prev.slice(0, -1), '> Executing transfer…'])
    
      try {
        let txHash
        if (token === 'MON') {
          const value = BigInt(Math.floor(Number(amount) * 1e18))
          txHash = await walletClient.sendTransaction({ to, value })
        } else {
          const tokenAddress = await resolveTokenAddress(token)
          if (!tokenAddress) throw new Error(`Unknown token ${token}`)
    
          // ←—— this is the change:
          const decimals = await publicClient.readContract({
            abi:          erc20Abi,
            address:      tokenAddress,
            functionName: 'decimals',
            args:         []
          })
    
          const amt = BigInt(Math.floor(Number(amount) * 10 ** Number(decimals)))
          txHash = await writeContractAsync({
            abi:          erc20Abi,
            address:      tokenAddress,
            functionName: 'transfer',
            args:         [to, amt]
          })
        }
    
        setTerminalLines(prev => [
          ...prev.slice(0, -1),
          `> ✅ Sent ${amount} ${token}. Tx: https://testnet.monadexplorer.com/tx/${txHash}`
        ])
      } catch (err) {
        setTerminalLines(prev => [
          ...prev.slice(0, -1),
          `❌ Transfer failed: ${err.message}`
        ])
      } finally {
        setPendingSend(null)
      }
      return
    }    
    
    // ── Swap Quote ──
    else if (cmd === 'swap' && sub && tokenArg && rest[0] === 'to') {
      const fromSymbol = sub.toUpperCase()
      const amount     = tokenArg
      const toSymbol   = rest[1]?.toUpperCase()

      // find on-chain addresses in your TOKEN_LIST
      const fromInfo = TOKEN_LIST.find(t => t.symbol === fromSymbol)
      const toInfo   = TOKEN_LIST.find(t => t.symbol === toSymbol)

      if (!fromInfo || !toInfo) {
        setTerminalLines(prev => [
          ...prev.slice(0, -1),
          '❌ Usage: swap <FROM> <AMOUNT> to <TO> (unknown token)'
        ])
        return
      }

      const from = fromInfo.address
      const to   = toInfo.address

      // replace the “thinking” line
      setTerminalLines(prev => [
        ...prev.slice(0, -1),
        `> Fetching quote for ${amount} ${fromSymbol} → ${toSymbol}...`
      ])

      try {
        const res = await fetch(`${baseApiUrl}/swap/quote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from, to, amount, sender: address })
        })
        const data = await res.json()

        if (data.success) {
          const q = data.quote
          // stash for confirm
          setLastSwapQuote({ from, to, amount, sender: address })

          setTerminalLines(prev => [
            ...prev.slice(0, -1),
            'Quote:',
            `- You send:       ${q.input_formatted} ${fromSymbol}`,
            `- You’ll receive: ${q.output_formatted} ${toSymbol}`,
            `- Min receive:    ${q.min_output_formatted} ${toSymbol}`,
            `- Price impact:   ${(q.compound_impact * 100).toFixed(2)}%`,
            'Type: confirm'
          ])
        } else {
          setTerminalLines(prev => [
            ...prev.slice(0, -1),
            `❌ ${data.error}`
          ])
        }
      } catch (e) {
        setTerminalLines(prev => [
          ...prev.slice(0, -1),
          '❌ Swap quote failed.'
        ])
      }

      return
    }
    
      // ── Confirm Swap ──
      else if (cmd === 'confirm' && !sub) {
        if (!lastSwapQuote) {
          setTerminalLines(prev => [
            ...prev.slice(0, -1),
            '❌ No swap quote available.'
          ])
          return
        }
        setTerminalLines(prev => [
          ...prev.slice(0, -1),
          '> Executing swap...'
        ])
        try {
          const res = await fetch(`${baseApiUrl}/swap/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lastSwapQuote)
          })
          const data = await res.json()
          if (data.success) {
            const txObj = data.transaction
            if (!walletClient) throw new Error('Wallet not connected')
            const txHash = await walletClient.sendTransaction({
              to: txObj.to,
              data: txObj.data,
              value: txObj.value || '0x0'
            })
            setTerminalLines(prev => [
              ...prev.slice(0, -1),
              `> ✅ Swap sent. Tx: https://testnet.monadexplorer.com/tx/${txHash}`
            ])
          } else {
            setTerminalLines(prev => [
              ...prev.slice(0, -1),
              `❌ ${data.error}`
            ])
          }
        } catch (err) {
          setTerminalLines(prev => [
            ...prev.slice(0, -1),
            `❌ Confirm failed: ${err.message}`
          ])
        }
      }
    
      // ── Show NFTs ──
      else if (cmd === 'show' && sub === 'my' && tokenArg === 'nfts') {
        const sortFlag = rest.find(r => r.startsWith('--sort='))
        const sortBy   = sortFlag?.split('=')[1] || null
        setTerminalLines(['> Fetching your NFTs…'])
        try {
          const res = await fetch(`${baseApiUrl}/checkNFT`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ owner: address, command: 'my nfts', type: 'all' })
          })
          const { nfts, error } = await res.json()
          if (error) throw new Error(error)
          if (!nfts.length) {
            setTerminalLines(prev => [
              ...prev.slice(0, -1),
              '❌ No NFTs found in your wallet.'
            ])
            setNftResults(null)
          } else {
            setTerminalLines(prev => [...prev.slice(0, -1)])
            setNftResults(renderNFTs(nfts, sortBy))
          }
        } catch (e) {
          setTerminalLines(prev => [
            ...prev.slice(0, -1),
            `❌ Unable to fetch NFTs: ${e.message}`
          ])
          setNftResults(null)
        }        

      // ── Fallback Command ──
    } else {
      try {
        const res = await fetch(`${baseApiUrl}/command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: input })
        })
    
        const data = await res.json()
        setTerminalLines(prev => [
          ...prev.slice(0, -1),
          data.data || data.error
        ])
      } catch {
        setTerminalLines(prev => [
          ...prev.slice(0, -1),
          '❌ Mon Terminal is not responding.'
        ])
      }
    }
  }      

  const initialInfo = [
    '> Wallet Connected',
    `> Address: ${address}`,
    tokenBalance ? `> Balance: ${parseFloat(tokenBalance.formatted).toFixed(4)} ${tokenBalance.symbol}` : null,
    '> Mon Terminal is ready for Monad Testnet interaction',
  ].filter(Boolean)  

  return (
    <div className="h-screen w-screen bg-gradient-to-b from-[var(--color-bg-dark)] to-black text-[var(--color-primary)] font-pixel">
      <div className="bezel-frame w-full h-full flex flex-col justify-between px-4 py-6 box-border">
        <div className="header-title text-xl sm:text-2xl tracking-wider text-[var(--color-accent)] font-bold">
          <span className="title-text">MON TERMINAL</span>
          <span className="pixel-chart-wrapper">
            <div className="candle candle-1" />
            <div className="candle candle-2" />
            <div className="candle candle-3" />
            <div className="candle candle-4" />
          </span>
        </div>

        <div className="terminal-screen relative crt-scan flex flex-col justify-start gap-2 overflow-y-auto my-4 flex-grow">
          {!hasTyped ? (
            <Typewriter
              words={['> Connect Wallet to begin using Mon Terminal']}
              loop={1}
              cursor
              cursorStyle="_"
              typeSpeed={40}
              deleteSpeed={0}
              delaySpeed={1000}
              onLoopDone={() => setHasTyped(true)}
            />
          ) : (
            <>
              {isConnected ? (
                <>
                  {initialInfo.map((line, i) => (
                    <p key={`init-${i}`}>{line}</p>
                  ))}

                  {terminalLines.map((line, i) => {
                    if (typeof line === 'string') {
                      const isUserCommand = line.startsWith('>')
                      return isUserCommand ? (
                        <p key={`response-${i}`} className="text-sm">{line}</p>
                      ) : (
                        <div key={`response-${i}`} className="mcp-output-wrapper">
                          <span className="flicker-arrow">&gt;</span>
                          <pre className="mcp-output-box whitespace-pre-wrap text-xs inline-block">{line}</pre>
                        </div>
                      )
                    } else {
                      return <div key={`response-${i}`}>{line}</div>
                    }
                  })}

                  {isAnalyzing && (
                    <div className="analyze-progress text-sm mt-2 italic text-[var(--color-accent)]">
                      {analyzeProgress}
                    </div>
                  )}

                  {showAchievementsUI && Object.keys(achievements).length > 0 && (
                    <div className="achievements-container">
                      <div className="achievement-list">
                      {Object.entries(achievementNames).map(([id, label]) => (
                          <div
                            key={id}
                            className={`achievement-item${achievements[id] === true ? ' minted' : ''}`}
                          >
                            <div className={`badge-icon badge-${id}`} />
                            <div className="label">{label}</div>
                            {achievements[id] === 'eligible' && (
                              <span className="mint-label" onClick={() => handleMint(id, label)}>
                                mint {label}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pnlChartData && (
                    <div className="pnl-chart-box chart-container">
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={pnlChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#7d00b0" />
                          <XAxis dataKey="label" stroke="#e6e6e6" fontSize={10} />
                          <YAxis stroke="#e6e6e6" fontSize={10} />
                          <Tooltip wrapperStyle={{ fontSize: 10 }} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          <Bar dataKey="value" fill="#c200fb" />
                        </BarChart>
                      </ResponsiveContainer>
                      <p className="record-stats-label mt-3"><span className="text-[var(--color-accent)]">Type:</span> record stats to submit your record onchain</p>
                    </div>
                  )}

                  {nftResults && (
                    <div className="nft-results-wrapper">
                      {nftResults}
                    </div>
                  )}

                  <div className="mt-4">
                    <p className="mb-1">&gt; Enter command below:</p>
                    <input
                      type="text"
                      className="w-full px-2 py-1 border border-[var(--color-accent)] bg-black text-[var(--color-primary)] font-pixel text-sm"
                      placeholder="Type: help - to check the command list"
                      onKeyDown={handleCommandInput}
                    />
                  </div>
                </>
              ) : (
                <>
                  <p>&gt; Wallet not connected.</p>
                  <p>&gt; Click "Connect Wallet" to continue.</p>
                </>
              )}
            </>
          )}
        </div>

        <div className="text-center mt-2">
          {!isConnected ? (
            <button
              disabled={isPending}
              onClick={handleConnect}
              className="px-4 py-2 border-2 border-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-black transition-all duration-150"
            >
              {isPending ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 border-2 border-[var(--color-accent)] hover:bg-black hover:text-[var(--color-primary)] transition-all duration-150"
            >
              Disconnect Wallet
            </button>
          )}
        </div>

      {/*  ── our new pixel‐buttons + robot footer ── */}
      <TerminalFooter />
      </div>
    </div>
  )
}

export default App