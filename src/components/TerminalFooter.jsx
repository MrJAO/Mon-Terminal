// src/components/TerminalFooter.jsx
import React, { useState } from 'react';
import './TerminalFooter.css';

export default function TerminalFooter() {
  const [showFaq, setShowFaq] = useState(false);
  const [robotClicked, setRobotClicked] = useState(false);

  const openX = () => {
    window.open('https://x.com/CryptoModJAO', '_blank');
  };

  const handleRobot = () => {
    if (!robotClicked) {
      setRobotClicked(true);
      document.getElementById('rickroll-audio').play();
    }
  };

  return (
    <>
      {/* FAQ Popup */}
      {showFaq && (
        <div className="tf-faq-overlay" onClick={() => setShowFaq(false)}>
          <div className="tf-faq-box" onClick={e => e.stopPropagation()}>
            <h2>Frequently Asked Commands</h2>
            <pre>
{`1. help
 > Show the available commands

2. analyze
 > Analyze the user wallets and show ... Featured Testnet NFTs

3. check balance <token>
 > e.g. check balance mon

4. check pnl <token> <amt> to <dest>
 > e.g. check pnl mon 1 to usdc

5. record stats
 > Records your last PnL on-chain

6. achievements
 > Show all available achievements

7. mint <achievement_name>
 > e.g. mint profit_initiate

8. best price for <token> <amt> to <dest>
 > e.g. best price for mon 1 to usdc

9. swap <token> <amt> to <token>
 > e.g. swap mon 1 to usdt

10. confirm <token> <amt> to <token>
 > Finalize your swap

11. show my nfts
 > List your NFTs (up to 100)

12. send <amt> <token> to <address>
 > e.g. send 1 dak to 0x…

13. token report <token> <amt> to <dest>
 > e.g. token report dak 1 to usdc`}
            </pre>
            <button onClick={() => setShowFaq(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Footer Buttons + Robot */}
      <div className="tf-footer">
        <div className="tf-btn tf-glitch" onClick={openX}>
          Build with <span className="tf-heart">❤</span> – JAO 🌻
        </div>

        <div className="tf-btn" onClick={() => setShowFaq(true)}>
          FAQs
        </div>

        <div className="tf-robot" onClick={handleRobot}>
          <img src="/robot.png" alt="pixel-robot" />
          <div className="tf-robot-dialog">
            {robotClicked ? 'Gotcha' : 'Click me to check the Monad Criteria'}
          </div>
        </div>

        {/* hidden audio element */}
        <audio id="rickroll-audio" src="/rickroll.mp3" preload="auto" />
      </div>
    </>
  );
}
