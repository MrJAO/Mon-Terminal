import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useBalance, useWriteContract, useSendTransaction } from 'wagmi'
import { Typewriter } from 'react-simple-typewriter'
import TOKEN_LIST from './constants/tokenList'
import { MON_TERMINAL_ABI } from './constants/MonTerminalABI'
import ACHIEVEMENT_ABI from './constants/SimpleAchievementNFT.abi.json'
import './App.css'
import './Achievements.css'
import './TokenReport.css'
import { getWalletClient } from '@wagmi/core'
import { hexlify } from 'ethers'
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
  const { sendTransaction } = useSendTransaction()

  const [hasTyped, setHasTyped] = useState(false)
  const [terminalLines, setTerminalLines] = useState([])
  const [pnlChartData, setPnlChartData] = useState(null)
  const [currentPnL, setCurrentPnL] = useState(null)
  const [isCooldownActive, setIsCooldownActive] = useState(false)
  const [cooldownTimestamp, setCooldownTimestamp] = useState(null)

  const [achievements, setAchievements] = useState({})
  const [showAchievementsUI, setShowAchievementsUI] = useState(false) // ✅ Add this line
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeProgress, setAnalyzeProgress] = useState('')  

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
    if (e.key === 'Enter') {
      const input = e.target.value.trim()
      e.target.value = ''
      if (!input) return
  
      setPnlChartData(null)
      setShowAchievementsUI(false) // 🧠 hide achievements section by default
  
      setTerminalLines(prev => [...prev, `> ${input}`, '> Mon Terminal is thinking...'])
  
      const [cmd, ...rest] = input.split(' ')
      const sub = rest[0]
      const tokenArg = rest[1]
  
      // ───── PnL ─────
      if (cmd === 'check' && sub === 'pnl') {
        const token = tokenArg?.toUpperCase()
        if (!token) {
          setTerminalLines(prev => [...prev, '> Please specify a token symbol for PnL (e.g., check pnl DAK)'])
          return
        }
        try {
          const res = await fetch(`${baseApiUrl}/pnl`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, token })
          })
          const data = await res.json()
          if (data.success && data.pnl?.[0] && !data.pnl[0].error) {
            const entry = data.pnl[0]
            const output = [
              `PNL Report for ${entry.symbol}`,
              `- Average Buy Price: $${entry.averageBuyPrice.toFixed(4)}`,
              `- Current Price:     $${entry.currentPrice.toFixed(4)}`,
              `- Current Balance:   ${entry.currentBalance.toFixed(6)} ${entry.symbol}`,
              `- Current Value:     $${entry.currentValue.toFixed(2)}`,
              `- Total Cost:        $${entry.totalCost.toFixed(2)}`,
              `- PnL:               $${entry.pnl.toFixed(2)}`
            ].join('\n')
  
            setCurrentPnL(parseFloat(entry.pnl.toFixed(6)))
            setPnlChartData([
              { label: 'Buy', value: parseFloat(entry.totalCost.toFixed(2)) },
              { label: 'Now', value: parseFloat(entry.currentValue.toFixed(2)) },
              { label: 'PnL', value: parseFloat(entry.pnl.toFixed(2)) }
            ])
  
            setTerminalLines(prev => {
              const newLines = [...prev]
              newLines.pop()
              return [...newLines, output]
            })
          } else {
            setPnlChartData(null)
            setCurrentPnL(null)
            const errorMsg = data.pnl?.[0]?.error || data.error || 'Unable to fetch PnL data.'
            setTerminalLines(prev => {
              const newLines = [...prev]
              newLines.pop()
              return [...newLines, `❌ ${errorMsg}`]
            })
          }
        } catch (err) {
          setPnlChartData(null)
          setCurrentPnL(null)
          setTerminalLines(prev => [...prev, '❌ Mon Terminal is not responding.'])
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
          setTerminalLines(prev => [...prev, '> No PnL data available. Use "check pnl <token>" first.'])
          return
        }
        await handleRecordStat()
  
      }  else if (cmd === 'mint') {
        const label = rest.join(' ').trim()
  
        if (!achievements || Object.keys(achievements).length === 0) {
          setTerminalLines(prev => {
            const lines = [...prev]
            if (lines[lines.length - 1] === '> Mon Terminal is thinking...') lines.pop()
            return [...lines, `❌ Please run the "achievements" command first.`]
          })
          return
        }
  
        const entry = Object.entries(achievementNames).find(([id, l]) =>
          l.toLowerCase() === label.toLowerCase() || `mint ${l}`.toLowerCase() === input.toLowerCase()
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
        setAnalyzeProgress('Initializing analysis...')
  
        const progressInterval = setInterval(() => {
          setAnalyzeProgress(prev => {
            if (prev.includes('...')) return 'Analyzing'
            return prev + '.'
          })
        }, 800)
  
        try {
          const res = await fetch(`${baseApiUrl}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address })
          })
          const data = await res.json()
  
          clearInterval(progressInterval)
          setIsAnalyzing(false)
          setAnalyzeProgress('')
  
          if (data.success) {
            const result = data.data
            const dexLines = Object.entries(result.dexSummary.interactions)
              .map(([dex, count]) => `  -> ${dex}: ${count} interactions`)
              .join('\n')
  
            const nftInfo = result.nftHoldings
            const nftSummary = `- NFTs: ${nftInfo.total} total (${nftInfo.verified} verified, ${nftInfo.unverified} unverified)`
  
            const output = [
              `Mon Terminal Report for Wallet ${address}`,
              `- Activity Level: ${result.activityLevel}`,
              `- Total Transactions: ${result.transactionCount}`,
              `${nftSummary}`,
              `- DEX Interactions (last 12 hours):\n${dexLines}`,
              `Disclaimer: ${result.disclaimer}`
            ].join('\n')
  
            setTerminalLines(prev => {
              const newLines = [...prev]
              if (newLines[newLines.length - 1] === '> Mon Terminal is thinking...') newLines.pop()
              return [...newLines, output]
            })
          } else {
            setTerminalLines(prev => {
              const newLines = [...prev]
              if (newLines[newLines.length - 1] === '> Mon Terminal is thinking...') newLines.pop()
              return [...newLines, `❌ ${data.message || 'Unable to analyze wallet.'}`]
            })
          }
        } catch (err) {
          clearInterval(progressInterval)
          setIsAnalyzing(false)
          setAnalyzeProgress('')
          setTerminalLines(prev => {
            const newLines = [...prev]
            if (newLines[newLines.length - 1] === '> Mon Terminal is thinking...') newLines.pop()
            return [...newLines, '❌ Mon Terminal is not responding.']
          })
        }

      // ───── Token Report ─────
    } else if (cmd === 'token' && sub === 'report') {
      const symbol = tokenArg?.toUpperCase()
      if (!symbol) {
        setTerminalLines(prev => [...prev, `❌ Please specify a token (e.g. token report MON)`])
        return
      }

      try {
        const res = await fetch(`${baseApiUrl}/token-report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol })
        })
        const data = await res.json()

        if (data.success) {
          const r = data.report
          setTerminalLines(prev => {
            const lines = [...prev]
            lines.pop()
            return [
              ...lines,
              <div className="token-report-box">
                <p>📊 <strong>Token Report for {symbol}</strong></p>
                <p>- 7d Price Change: <span className="highlight-green">{r.priceChangePercent}%</span></p>
                <p>- Sentiment: <span className={`sentiment ${r.sentiment.toLowerCase()}`}>{r.sentiment}</span></p>
                <p>- Chart: <a href={r.chartLink} target="_blank" className="token-link">View Chart</a></p>
              </div>
            ]
          })
          
        } else {
          setTerminalLines(prev => {
            const lines = [...prev]; lines.pop()
            return [...lines, `❌ Token report error: ${data.error || 'Unknown error'}`]
          })
        }
      } catch (err) {
        setTerminalLines(prev => {
          const lines = [...prev]; lines.pop()
          return [...lines, `❌ Token report fetch failed.`]
        })
      }     

    } else if (cmd === 'best' && sub === 'price' && rest[0] === 'for') {
      const token = rest[1]?.toUpperCase()
      if (!token) {
        setTerminalLines(prev => [...prev, '❌ Please specify a token (e.g. best price for MON)'])
        return
      }
    
      try {
        const res = await fetch(`${baseApiUrl}/best-price`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: token })
        })
        const data = await res.json()
    
        if (data.success) {
          setTerminalLines(prev => {
            const lines = [...prev]
            lines.pop()
            return [...lines, `💱 Best Price for ${token}: $${data.price} (via ${data.source})`]
          })
        } else {
          setTerminalLines(prev => {
            const lines = [...prev]
            lines.pop()
            return [...lines, `❌ ${data.error}`]
          })
        }
      } catch (err) {
        setTerminalLines(prev => {
          const lines = [...prev]
          lines.pop()
          return [...lines, '❌ Failed to fetch best price.']
        })
      }    

  // ───── Swap Quote ─────
} else if (cmd === 'swap' && sub !== 'confirm' && rest[2] === 'to') {
  const fromSymbol = sub.toUpperCase()
  const amount     = rest[1]
  const toSymbol   = rest[3].toUpperCase()

  const fromInfo = TOKEN_LIST.find(t => t.symbol === fromSymbol)
  const toInfo   = TOKEN_LIST.find(t => t.symbol === toSymbol)
  if (!fromInfo || !toInfo) {
    setTerminalLines(prev => {
      const lines = [...prev]; lines.pop()
      const bad = !fromInfo ? fromSymbol : toSymbol
      return [...lines, `❌ Unknown token symbol: ${bad}`]
    })
    return
  }
  const fromAddr = fromInfo.address
  const toAddr   = toInfo.address

  setTerminalLines(prev => [...prev, `> Fetching quote for ${amount} ${fromSymbol} → ${toSymbol}...`])
  try {
    const res = await fetch(`${baseApiUrl}/swap/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:   fromAddr,
        to:     toAddr,
        amount,
        sender: address
      })
    })
    const data = await res.json()
    if (data.success) {
      const q = data.quote
      setTerminalLines(prev => {
        const lines = [...prev]; lines.pop()
        return [
          ...lines,
          `Quote:`,
          `- You send:       ${q.input_formatted} ${fromSymbol}`,
          `- You’ll receive: ${q.output_formatted} ${toSymbol}`,
          `- Min receive:    ${q.min_output_formatted} ${toSymbol}`,
          `- Price impact:   ${(Number(q.compound_impact) * 100).toFixed(2)}%`,
          `Type: confirm ${fromSymbol} ${amount} to ${toSymbol}`
        ]
      })
    } else {
      setTerminalLines(prev => {
        const lines = [...prev]; lines.pop()
        return [...lines, `❌ ${data.error}`]
      })
    }
  } catch {
    setTerminalLines(prev => {
      const lines = [...prev]; lines.pop()
      return [...lines, '❌ Swap quote failed.']
    })
  }

    // ───── Swap Execute ─────
  } else if (cmd === 'confirm') {
    setTerminalLines(prev => [...prev, `> Sending last swap…`])
    try {
      const res = await fetch(`${baseApiUrl}/swap/confirm/last`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: address })
      })
      const data = await res.json()

      if (!data.success) {
        setTerminalLines(prev => {
          const lines = [...prev]; lines.pop()
          return [...lines, `❌ ${data.error}`]
        })
        return
      }

      const txObj = data.transaction
      if (!txObj?.to || !txObj?.data) {
        setTerminalLines(prev => {
          const lines = [...prev]; lines.pop()
          return [...lines, `❌ Invalid transaction object.`]
        })
        return
      }

      const walletClient = await getWalletClient()
      if (!walletClient) throw new Error('Wallet client not available.')

      const txHash = await walletClient.sendRawTransaction({
        serializedTransaction: txObj.rawTransaction
      })

      setTerminalLines(prev => {
        const lines = [...prev]; lines.pop()
        return [...lines, `> ✅ Swap sent. Tx: https://testnet.monadexplorer.com/tx/${txHash}`]
      })
    } catch (err) {
      console.error("❌ Confirm error:", err)
      setTerminalLines(prev => {
        const lines = [...prev]; lines.pop()
        return [...lines, `❌ Confirm failed: ${err.message}`]
      })
    }

    } else {
      try {
        const res = await fetch(`${baseApiUrl}/command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: input })
        })
        const data = await res.json()
        setTerminalLines(prev => {
          const lines = [...prev]
          if (lines[lines.length - 1] === '> Mon Terminal is thinking...') lines.pop()
          return [...lines, data.response]
        })
      } catch {
        setTerminalLines(prev => {
          const lines = [...prev]
          if (lines[lines.length - 1] === '> Mon Terminal is thinking...') lines.pop()
          return [...lines, '> Unknown command.']
        })
      }
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

        <div className="terminal-screen flex flex-col justify-start gap-2 overflow-y-auto my-4 flex-grow">
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
                      return <div key={`response-${i}`}>{line}</div> // render JSX safely
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
                          <div key={id} className={`achievement-item${achievements[id] === true ? ' minted' : ''}`}>
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
      </div>
    </div>
  )
}

export default App
