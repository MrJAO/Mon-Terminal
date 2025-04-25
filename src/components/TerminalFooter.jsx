// src/components/TerminalFooter.jsx
import React, { useState } from 'react';
import './TerminalFooter.css';
import rickroll from './RickRoll.mp3';

const FAQS = [
  { id: 1, command: 'help', description: 'Show the available commands' },
  { id: 2, command: 'analyze', description: 'Analyze the user wallets and show the wallet Monad Interactions including Total Transactions, Interactions with known Tokens, NFTs that guarantee a mint on mainnet, and the list of Featured Testnet NFTs that you might want to hold' },
  { id: 3, command: 'check balance <token name>', description: 'e.g. check balance mon' },
  { id: 4, command: 'check pnl <token name> <amount> to <dest>', description: 'e.g. check pnl mon 1 to usdc (simulated result at the moment)' },
  { id: 5, command: 'record stats', description: 'After checking a pnl you can do a follow up command "> record stats" to record your pnl onchain' },
  { id: 6, command: 'achievements', description: 'Will show all the available achievements (soulbound)' },
  { id: 7, command: 'mint <achievement_name>', description: 'Once you are eligible type e.g. "> mint profit initiate", it will mint your achievement and put a record onchain' },
  { id: 8, command: 'best price for <token name> <amount> to <dest>', description: 'e.g. best price for mon 1 to usdc (simulated result at the moment)' },
  { id: 9, command: 'swap <token name> <amount> to <token name>', description: 'e.g. swap mon 1 to usdt' },
  { id: 10, command: 'confirm <token name> <amount> to <token name>', description: 'To execute your swap type "> confirm mon 1 to usdt", a wallet confirmation will appear to finalize your swap' },
  { id: 11, command: 'show my nfts', description: 'Will show all the user owned NFTs but have a maximum limit of 100' },
  { id: 12, command: 'send <amount> <token name> to <w-address>', description: 'e.g. send 1 dak to 0xd9F016e453dE48D877e3f199E8FA4aADca2E979C' },
  { id: 13, command: 'token report <token name> <amount> to <dest>', description: 'e.g. token report dak 1 to usdc, will show a 3–7 days historical report of the token (simulated result at the moment)' },
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

            <div className="tf-faq-list">
              {FAQS.map(f => (
                <div key={f.id} className="tf-faq-item">
                  <div className="tf-faq-command">{f.id}. {f.command}</div>
                  <div className="tf-faq-desc">&gt; {f.description}</div>
                </div>
              ))}

              {/* Important Notes — same style block for consistency */}
              <div className="tf-faq-item important-notes">
                <div className="tf-faq-command neon-red">🛑 Important Notes</div>
                <ul className="tf-important-list">
                  <li>Some of the information might be wrong and if it is kindly inform me using the X account attached on the lower right side of the website. Thank you ❤</li>
                  <li>I'm using a <span className="neon-green">FREE TIER</span> in my Render server so if it's inactive for a few minutes it will take around 1min to activate the server and response to the commands. Use <span className="neon-green">"help"</span> first just to be sure.</li>
                  <li>If <span className="neon-yellow">NETWORK FEE Alert</span> appear cancel the transaction. Your transaction will fail and you will waste around 2.7 MON for the gas fee.</li>
                  <li>After using <span className="neon-green">"SHOW MY NFTs"</span>, use <span className="neon-green">"CLEAR"</span> to clear the terminal.</li>
                  <li><span className="neon-green">Check PnL</span>, <span className="neon-green">Best Price</span>, and <span className="neon-green">Token Report</span> results are currently using a simulated prices because I can't find API that support Monad Testnet token prices at the moment.</li>
                </ul>
              </div>
            </div>

            <div className="tf-faq-actions">
              <button onClick={() => setShowFaq(false)}>Close</button>
              <div className="tf-faq-robot-btn" onClick={handleRobotClick}>
                {robotClicked ? 'Gotcha!' : 'Show Monad Criteria'}
              </div>
            </div>

            {robotClicked && (
              <audio id="rickroll-audio" src={rickroll} preload="auto" autoPlay />
            )}
          </div>
        </div>
      )}

      <div className="tf-footer">
        <div className="tf-btn tf-glitch" onClick={openX} data-text="Building ❤ – JAO 🌻">
          Build with <span className="tf-heart">❤</span> – JAO 🌻
        </div>
        <div className="tf-btn" onClick={() => setShowFaq(true)}>
          FACs
        </div>
      </div>
    </>
  );
}
