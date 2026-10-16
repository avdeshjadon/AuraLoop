import { useEffect, useRef, useState } from 'react';
import { useEscape, useFocusTrap, useScrollLock } from '../../../shared/a11y.js';
import { prefersReducedMotion } from '../../../shared/gsap.js';
import { goToWaitlist, useMedia } from '../lib.js';
import { Bolt, Close, Menu, ArrowRight } from '../icons.jsx';

const MENU = [
  { href: '#wallpapers', label: '4K Wallpapers' },
  { href: '#features', label: 'Engine' },
  { href: '#workflows', label: 'Automation' },
  { href: '#manifesto', label: 'Architecture' },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const ringRef = useRef(null);
  const desktop = useMedia('(min-width: 860px)', true);

  useEscape(open, () => setOpen(false));
  useFocusTrap(ringRef, open);
  useScrollLock(open);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  useEffect(() => {
    if (desktop) setOpen(false);
  }, [desktop]);

  // Menu links: close first (releases the scroll lock), then move to the section.
  const go = href => e => {
    e.preventDefault();
    setOpen(false);
    requestAnimationFrame(() => {
      const el = document.querySelector(href);
      el?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
      el?.focus?.({ preventScroll: true });
    });
  };

  const early = e => {
    e.preventDefault();
    setOpen(false);
    requestAnimationFrame(() => goToWaitlist());
  };

  return (
    <header className={`ta-nav${scrolled ? ' is-scrolled' : ''}${open ? ' is-open' : ''}`}>
      <div className="ta-nav__ring" ref={ringRef}>
        <div className="ta-nav__bar">
          <a href="#top" className="ta-wordmark" aria-label="AuraLoop, back to top" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <svg
              width="130"
              height="24"
              viewBox="0 0 1200 220"
              role="img"
              aria-label="AuraLoop"
              style={{ display: 'block', height: '24px', width: 'auto' }}
            >
              <g fill="#0A0C10" fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif" fontSize="128" fontWeight="700" letterSpacing="0.08em" textAnchor="middle">
                <text x="110" y="152">A</text>
                <text x="240" y="152">U</text>
                <text x="360" y="152">R</text>
                <text x="480" y="152">A</text>
                <text x="605" y="152">L</text>
                <text x="1015" y="152">P</text>
              </g>
              <path
                d="M 695,111 C 728,58 768,58 807,111 C 846,164 886,164 919,111 C 886,58 846,58 807,111 C 768,164 728,164 695,111 Z"
                fill="none"
                stroke="#0A0C10"
                strokeWidth="26"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <nav className="ta-nav__links" aria-label="Primary">
            <a href="#wallpapers">Wallpapers</a>
            <a href="#features">Engine</a>
            <a href="#workflows">Automation</a>
            <a href="#manifesto">Architecture</a>
          </nav>
          <a
            href="#waitlist"
            className="ta-btn ta-btn--ink ta-nav__cta"
            onClick={early}
            style={{
              color: '#ffffff',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            }}
          >
            <span className="ta-nav__cta-long" style={{ color: '#ffffff' }}>Download .DMG</span>
            <span className="ta-nav__cta-short" style={{ color: '#ffffff' }}>Download</span>
            <Bolt size={13} style={{ color: '#ffffff' }} />
          </a>
          <button
            type="button"
            className="ta-nav__menu"
            aria-expanded={open}
            aria-controls="ta-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen(o => !o)}
          >
            {open ? <Close size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <div id="ta-menu" className="ta-menu" hidden={!open}>
          <nav aria-label="Menu">
            <ul role="list">
              {MENU.map((m, i) => (
                <li key={m.href}>
                  <a href={m.href} onClick={go(m.href)} data-autofocus={i === 0 ? '' : undefined}>
                    <span>{m.label}</span>
                    <ArrowRight size={16} />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <a href="#waitlist" className="ta-btn ta-btn--ember ta-menu__cta" onClick={early}>
            Download .DMG (v6.6.0) <Bolt size={14} />
          </a>
        </div>
      </div>
    </header>
  );
}
