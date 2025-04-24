// src/components/TerminalFooter.jsx
import React, { useState } from 'react';
import './TerminalFooter.css';
import rickroll from './RickRoll.mp3';  // import MP3 from components folder

// FAQ definitions
const FAQS = [
  { id: 1, command: 'help',        description: 'Show the available commands' },
  { id: 2, command: 'analyze',     description: 'Analyze your wallet: tx count, token & NFT interactions' },
  { id: 3, command: 'check balance <token>', description: 'e.g. check balance mon' },
  { id: 4, command: 'check pnl <token> <amt> to <dest>', description: 'e.g. check pnl mon 1 to usdc' },
  { id: 5, command: 'record stats', description: 'After PnL, run to record stats on-chain' },
  { id: 6, command: 'achievements', description: 'Show all available achievements' },
  { id: 7, command: 'mint <achievement_name>', description: 'e.g. mint profit_initiate' },
  { id: 8, command: 'best price for <token> <amt> to <dest>', description: 'e.g. best price for mon 1 to usdc' },
  { id: 9, command: 'swap <token> <amt> to <token>', description: 'e.g. swap mon 1 to usdt' },
  { id:10, command: 'confirm <type>', description: 'Confirm swap or transfer' },
  { id:11, command: 'show my nfts', description: 'List your NFTs (max 100)' },
  { id:12, command: 'send <amt> <token> to <address>', description: 'e.g. send 1 dak to 0x…' },
  { id:13, command: 'token report <token> <amt> to <dest>', description: 'e.g. token report dak 1 to usdc' },
];

export default function TerminalFooter() {
  const [showFaq, setShowFaq] = useState(false);
  const [robotClicked, setRobotClicked] = useState(false);

  const openX = () => window.open('https://x.com/CryptoModJAO', '_blank');
  const handleRobotClick = () => setRobotClicked(true);

  return (
    <>
      {showFaq && (
        <div className="tf-faq-overlay" onClick={() => setShowFaq(false)}>
          <div className="tf-faq-box" onClick={e => e.stopPropagation()}>
            <h2>Frequently Asked Commands</h2>

            {/* ASCII-art robot samples (uncomment one) */}
            {/*
            <pre className="tf-robot-ascii">
  ▛▀▀▀▜
  ▌ o o▐
  ▌  ∇ ▐
  ▙▄▄▄▟
            </pre>
            */}

            <div className="tf-faq-list">
              {FAQS.map(f => (
                <div key={f.id} className="tf-faq-item">
                  <div className="tf-faq-command">{f.id}. {f.command}</div>
                  <div className="tf-faq-desc">&gt; {f.description}</div>
                </div>
              ))}
            </div>

            <div className="tf-faq-actions">
              <button onClick={() => setShowFaq(false)}>Close</button>
              <div className="tf-faq-robot-btn" onClick={handleRobotClick}>
                {robotClicked ? 'Gotcha!' : '🤖 Click me'}
              </div>
            </div>

            {/* hidden audio element playing RickRoll */}
            {robotClicked && (
              <audio id="rickroll-audio" src={rickroll} preload="auto" autoPlay />
            )}
          </div>
        </div>
      )}

      <div className="tf-footer">
        <div className="tf-btn tf-glitch" onClick={openX} data-text="Build with ❤ – JAO 🌻">
          Build with <span className="tf-heart">❤</span> – JAO 🌻
        </div>

        <div className="tf-btn" onClick={() => setShowFaq(true)}>
          FAQs
        </div>
      </div>
    </>
  );
}