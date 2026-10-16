import { NAV } from '../data.js';
import { ArrowUp, SearchIcon, DownloadIcon } from '../icons.jsx';
import Keycap from './Keycap.jsx';
import { Monogram } from './Nav.jsx';

export default function Footer({ onSearch, onDownload }) {
  return (
    <footer className="ch-footer">
      <div className="ch-wrap">
        <p className="ch-footer__big" aria-hidden="true">
          Cinematic motion for <Keycap tone="cream" glyph="apple" className="ch-key--sm" />{' '}
          <em className="ch-footer__em">every display</em>
        </p>

        {/* Large prominent AuraLoop SVG Wordmark */}
        <div className="ch-footer__wordmark-wrap" style={{ textAlign: 'center', margin: '48px 0 36px' }}>
          <img
            src="/assets/svg/auraloop-wordmark-dark.svg"
            alt="AuraLoop"
            style={{
              width: '100%',
              maxWidth: '680px',
              height: 'auto',
              opacity: 0.85,
              display: 'inline-block',
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.06))',
            }}
          />
        </div>

        <div className="ch-footer__grid">
          <div className="ch-footer__brand">
            <span className="ch-brand">
              <Monogram />
              <span className="ch-brand__name">AuraLoop</span>
            </span>
            <p className="ch-footer__disclaimer">
              High-Performance Native Live Wallpapers &amp; Screensavers for macOS. Universal binary for Apple Silicon &amp; Intel.
            </p>
          </div>

          <nav aria-label="Footer" className="ch-footer__nav">
            <p className="ch-kicker">Navigation</p>
            <ul role="list">
              {NAV.map(n => (
                <li key={n.id}>
                  <a href={`#${n.id}`}>{n.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ch-footer__nav">
            <p className="ch-kicker">Quick Actions</p>
            <ul role="list">
              <li>
                <button type="button" onClick={onDownload} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'inherit' }}>
                  <DownloadIcon size={14} /> Download DMG (v6.6.0)
                </button>
              </li>
              <li>
                <button type="button" onClick={onSearch} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'inherit' }}>
                  <SearchIcon size={14} /> Search catalog ( / )
                </button>
              </li>
              <li>
                <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ArrowUp size={14} /> Back to top
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="ch-footer__base">
          <p>© 2026 Avdesh Jadon. All Rights Reserved. Proprietary &amp; Confidential.</p>
          <p>
            Engineered in Swift 5.9, SwiftUI &amp; AVFoundation for macOS Sonoma &amp; Sequoia.
          </p>
          <p>Typography: Plus Jakarta Sans &amp; Newsreader.</p>
        </div>
      </div>
    </footer>
  );
}
