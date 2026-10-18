import { useEffect, useRef, useState } from 'react';
import { useEscape, useFocusTrap, useScrollLock } from '../../../shared/a11y.js';
import { prefersReducedMotion } from '../../../shared/gsap.js';
import { goToWaitlist, useMedia } from '../lib.js';
import { Bolt, Close, Menu, ArrowRight } from '../icons.jsx';
import { onAuthStateChanged } from '../lib/auth.js';

const MENU = [
  { href: '#wallpapers', label: '4K Wallpapers' },
  { href: '#features', label: 'Engine' },
  { href: '#workflows', label: 'Automation' },
  { href: '#manifesto', label: 'Architecture' },
];

export default function Nav({ onOpenAuth }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const ringRef = useRef(null);
  const desktop = useMedia('(min-width: 860px)', true);

  useEffect(() => onAuthStateChanged(setUser), []);

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

          <div className="ta-nav__actions">
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="ta-btn"
                  onClick={() => onOpenAuth?.('account')}
                  style={{
                    background: user.proTier !== 'none'
                      ? 'linear-gradient(135deg, #e4572e 0%, #b93c18 100%)'
                      : 'rgba(23, 19, 15, 0.06)',
                    border: user.proTier !== 'none' ? 'none' : '1px solid rgba(23, 19, 15, 0.12)',
                    borderRadius: '999px',
                    padding: '7px 15px',
                    color: user.proTier !== 'none' ? '#ffffff' : '#17130f',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  {user.proTier !== 'none' ? '✦ Lifetime VIP' : '✦ Upgrade to Pro'}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth?.('account')}
                  title="My Account"
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: '#17130f',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  {user.displayName ? user.displayName[0].toUpperCase() : 'A'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="ta-btn"
                  onClick={() => onOpenAuth?.('signin')}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(23, 19, 15, 0.14)',
                    borderRadius: '999px',
                    padding: '7px 14px',
                    color: '#17130f',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className="ta-btn ta-btn--ember"
                  onClick={() => onOpenAuth?.('signup')}
                  style={{
                    borderRadius: '999px',
                    padding: '7px 16px',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer'
                  }}
                >
                  <span>Sign Up</span>
                  <span style={{ fontSize: '11px' }}>↗</span>
                </button>
              </div>
            )}

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            {user ? (
              <button
                type="button"
                className="ta-btn ta-btn--ember"
                style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: '600' }}
                onClick={() => { setOpen(false); onOpenAuth?.('account'); }}
              >
                {user.proTier !== 'none' ? '✦ Lifetime VIP Member' : '✦ Upgrade to Pro'}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="ta-btn ta-btn--ember"
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: '600' }}
                  onClick={() => { setOpen(false); onOpenAuth?.('signup'); }}
                >
                  Create AuraLoop Account ↗
                </button>
                <button
                  type="button"
                  className="ta-btn"
                  style={{ width: '100%', padding: '11px', borderRadius: '12px', border: '1px solid rgba(23,19,15,0.12)', background: '#fff', fontSize: '14px', fontWeight: '600' }}
                  onClick={() => { setOpen(false); onOpenAuth?.('signin'); }}
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
