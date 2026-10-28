import { useEffect, useRef } from 'react';
import { goToWaitlist, LATEST_DMG_URL } from '../lib.js';
import { ArrowUpRight } from '../icons.jsx';
import { initFooterLogoAnimation } from './FooterLogoAnim.js';

function OGlyph() {
  return (
    <svg className="ta-o__rig" viewBox="0 0 1000 1000" aria-hidden="true" focusable="false">
      <g className="ta-rig-face">
        <g className="ta-rig-eye">
          <circle className="ta-rig-sclera" cx="416" cy="402" r="74" />
          <circle className="ta-rig-pupil" cx="416" cy="408" r="32" />
        </g>
        <g className="ta-rig-eye">
          <circle className="ta-rig-sclera" cx="584" cy="402" r="74" />
          <circle className="ta-rig-pupil" cx="584" cy="408" r="32" />
        </g>
      </g>
    </svg>
  );
}

export default function Footer({ onOpenDocs, onNavigateToDocs, onOpenPricing }) {
  const footerRef = useRef(null);

  useEffect(() => initFooterLogoAnimation(footerRef.current), []);

  const handleOpenDocs = (tab) => {
    if (onNavigateToDocs) {
      onNavigateToDocs(tab);
    } else if (onOpenDocs) {
      onOpenDocs();
    }
  };

  return (
    <footer className="ta-footer" ref={footerRef}>
      <div className="ta-wrap">
        <div className="ta-footer__top">
          <div className="ta-footer__brand">
            <a href="#top" className="ta-wordmark ta-wordmark--lg" aria-label="AuraLoop, back to top">
              aural
              <span className="ta-o">
                o
                <OGlyph />
              </span>
              <span className="ta-o">
                o
                <OGlyph />
              </span>
              <span className="ta-p">p</span>
            </a>
            <p>High-performance native live wallpapers & screensavers for macOS.</p>
            <svg className="ta-footer__stage" aria-hidden="true" focusable="false">
              <line className="ta-floor" x1="0" y1="0" x2="0" y2="0" />
            </svg>
          </div>
          
          <div className="ta-footer__cols">
            <nav aria-label="Engine links">
              <p className="ta-footer__h">Engine</p>
              <ul role="list">
                <li><a href="#wallpapers">Curated 4K</a></li>
                <li><a href="#top">Interactive Player</a></li>
              </ul>
            </nav>

            <nav aria-label="Platform links">
              <p className="ta-footer__h">AuraLoop</p>
              <ul role="list">
                <li><a href="#pricing">Pricing & Support</a></li>
                <li><a href="#manifesto">Philosophy</a></li>
                <li><a href={LATEST_DMG_URL} onClick={goToWaitlist}>Download</a></li>
              </ul>
            </nav>

            <nav aria-label="Resources & Docs">
              <p className="ta-footer__h">Resources</p>
              <ul role="list">
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenDocs('getting-started')}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      font: 'inherit',
                      color: 'inherit',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>Documentation & Manual</span>
                    <ArrowUpRight size={13} />
                  </button>
                </li>
                <li>
                  <a href="#pricing">
                    Voluntary Contributions
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenDocs('privacy')}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      font: 'inherit',
                      color: 'inherit',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    Zero Telemetry Policy
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="ta-footer__bottom">
          <p>© 2026 AuraLoop. Proprietary native software for macOS Sequoia & Sonoma by Avdesh Jadon.</p>
          <p>Curated 4K Aerials & Masters · Zero Telemetry · Offline Solar Ephemeris</p>
        </div>
      </div>
    </footer>
  );
}
