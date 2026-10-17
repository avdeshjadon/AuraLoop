import { useEffect, useRef } from 'react';
import { goToWaitlist } from '../lib.js';
import { ArrowUpRight } from '../icons.jsx';
import { initFooterLogoAnimation } from './FooterLogoAnim.js';

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

export default function Footer() {
  const footerRef = useRef(null);

  useEffect(() => initFooterLogoAnimation(footerRef.current), []);

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
