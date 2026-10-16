import { goToWaitlist } from '../lib.js';
import { ArrowUpRight } from '../icons.jsx';

const COLS = [
  {
    title: 'Engine',
    links: [
      { href: '#wallpapers', label: 'Curated 4K' },
      { href: '#features', label: 'Subsystems' },
      { href: '#top', label: 'Interactive Player' },
    ],
  },
  {
    title: 'AuraLoop',
    links: [
      { href: '#manifesto', label: 'Philosophy' },
      { href: '#workflows', label: 'Hardware Profiles' },
      { href: '#waitlist', label: 'Download .DMG', waitlist: true },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="ta-footer">
      <div className="ta-wrap">
        <div className="ta-footer__top">
          <div className="ta-footer__brand">
            <a href="#top" className="ta-wordmark ta-wordmark--lg" aria-label="AuraLoop, back to top">
              auraloop
            </a>
            <p>High-performance native live wallpapers & screensavers for macOS.</p>
          </div>
          <div className="ta-footer__cols">
            {COLS.map(col => (
              <nav key={col.title} aria-label={`${col.title} links`}>
                <p className="ta-footer__h">{col.title}</p>
                <ul role="list">
                  {col.links.map(l => (
                    <li key={l.href}>
                      <a href={l.href} onClick={l.waitlist ? goToWaitlist : undefined}>
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
            <nav aria-label="Open Source">
              <p className="ta-footer__h">Project</p>
              <ul role="list">
                <li>
                  <a href="https://github.com/avdeshjadon/AuraLoop" target="_blank" rel="noreferrer" className="ta-footer__back">
                    GitHub Repo <ArrowUpRight size={13} />
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        <div className="ta-footer__bottom">
          <p>© 2026 AuraLoop. Built with AVFoundation, Metal, and ExtensionKit for macOS Sequoia & Sonoma.</p>
          <p>Curated 4K Aerials & Masters · Zero Telemetry · Offline Solar Ephemeris</p>
        </div>
      </div>
    </footer>
  );
}
