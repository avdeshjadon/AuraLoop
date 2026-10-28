import { useEffect, useRef, useState } from 'react';
import { useEscape, useFocusTrap, useScrollLock } from '../../../shared/a11y.js';
import { prefersReducedMotion } from '../../../shared/gsap.js';
import { goToWaitlist, useMedia } from '../lib.js';
import { Bolt, Close, Menu, ArrowRight } from '../icons.jsx';
import { subscribeAuth, signOutUser } from '../lib/firebase.js';
import { usePricing } from '../lib/pricingService.js';

const MENU = [
  { href: '#wallpapers', label: 'Wallpapers' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#manifesto', label: 'Manifesto' },
];

export default function Nav({ user: propUser, onOpenAuth, onOpenAccount, onNavigateToAdmin, onSignOut }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [localUser, setLocalUser] = useState(null);
  const ringRef = useRef(null);
  const desktop = useMedia('(min-width: 860px)', true);

  const user = propUser !== undefined ? propUser : localUser;
  const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'theavdeshjadon@gmail.com').toLowerCase();
  const isAdmin = user?.email?.toLowerCase() === adminEmail || sessionStorage.getItem('auraloop_admin_session') === 'authenticated';
  const pricing = usePricing();

  useEffect(() => {
    if (propUser === undefined) {
      return subscribeAuth(setLocalUser);
    }
  }, [propUser]);



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
            <a href="#pricing">Pricing</a>
            <a href="#manifesto">Manifesto</a>
          </nav>

          <div className="ta-nav__actions">
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={onNavigateToAdmin}
                    style={{
                      height: '36px',
                      padding: '0 16px',
                      borderRadius: '999px',
                      background: '#17130f',
                      border: '1px solid rgba(23, 19, 15, 0.2)',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#2a241f')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#17130f')}
                  >
                    Admin
                  </button>
                )}

                {user.proTier === 'none' && (
                  <button
                    type="button"
                    onClick={onOpenAccount}
                    style={{
                      height: '36px',
                      padding: '0 16px',
                      borderRadius: '999px',
                      background: 'linear-gradient(135deg, #e4572e 0%, #b93c18 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(228,87,46,0.3)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.08)')}
                    onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
                  >
                    <span>✦</span>
                    <span>Upgrade {pricing.currency}{pricing.price}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onOpenAccount}
                  title="My Account"
                  style={{
                    height: '36px',
                    padding: '0 14px 0 4px',
                    borderRadius: '999px',
                    background: 'rgba(23, 19, 15, 0.06)',
                    border: '1px solid rgba(23, 19, 15, 0.12)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(23, 19, 15, 0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(23, 19, 15, 0.06)')}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: user.proTier !== 'none'
                        ? 'linear-gradient(135deg, #e4572e 0%, #b93c18 100%)'
                        : '#17130f',
                      color: '#ffffff',
                      fontWeight: '700',
                      fontSize: '12.5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {user.displayName ? user.displayName[0].toUpperCase() : 'A'}
                  </div>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#17130f',
                      maxWidth: '110px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {user.displayName ? user.displayName.split(' ')[0] : 'Account'}
                  </span>
                  {user.proTier !== 'none' && (
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#e4572e',
                        boxShadow: '0 0 6px #e4572e',
                        display: 'inline-block'
                      }}
                      title="Lifetime VIP"
                    />
                  )}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => onOpenAuth?.('signin')}
                  style={{
                    height: '36px',
                    padding: '0 16px',
                    borderRadius: '999px',
                    background: 'transparent',
                    border: '1px solid rgba(23, 19, 15, 0.14)',
                    color: '#17130f',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(23, 19, 15, 0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth?.('signup')}
                  style={{
                    height: '36px',
                    padding: '0 16px',
                    borderRadius: '999px',
                    background: 'linear-gradient(135deg, #e4572e 0%, #b93c18 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(228,87,46,0.3)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.08)')}
                  onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    background: 'rgba(23, 19, 15, 0.04)',
                    borderRadius: '12px',
                    border: '1px solid rgba(23, 19, 15, 0.08)'
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: user.proTier !== 'none'
                        ? 'linear-gradient(135deg, #e4572e 0%, #b93c18 100%)'
                        : '#17130f',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '14px'
                    }}
                  >
                    {user.displayName ? user.displayName[0].toUpperCase() : 'A'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#17130f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.displayName || 'AuraLoop User'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6e655d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    className="ta-btn"
                    style={{
                      width: '100%',
                      padding: '11px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #17130f 0%, #2f2721 100%)',
                      border: '1px solid rgba(228,87,46,0.4)',
                      color: '#ffffff',
                      fontSize: '13.5px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onClick={() => {
                      setOpen(false);
                      onNavigateToAdmin?.();
                    }}
                  >
                    <span>⚡️</span>
                    <span>Admin Dashboard (/admin)</span>
                  </button>
                )}

                <button
                  type="button"
                  className="ta-btn ta-btn--ember"
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: '600' }}
                  onClick={() => {
                    setOpen(false);
                    onOpenAccount?.();
                  }}
                >
                  👤 My Profile & Account Settings
                </button>

                {user.proTier === 'none' && (
                  <button
                    type="button"
                    className="ta-btn"
                    style={{
                      width: '100%',
                      padding: '11px',
                      borderRadius: '12px',
                      border: '1.5px solid #e4572e',
                      background: '#fff',
                      color: '#e4572e',
                      fontSize: '14px',
                      fontWeight: '700'
                    }}
                    onClick={() => {
                      setOpen(false);
                      onOpenAccount?.();
                    }}
                  >
                    ✦ Upgrade to Lifetime Pro ({pricing.currency}{pricing.price})
                  </button>
                )}

                <button
                  type="button"
                  className="ta-btn"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '12px',
                    border: '1px solid rgba(239,68,68,0.2)',
                    background: 'rgba(239,68,68,0.06)',
                    color: '#b91c1c',
                    fontSize: '13.5px',
                    fontWeight: '600'
                  }}
                  onClick={async () => {
                    setOpen(false);
                    await signOutUser();
                    if (onSignOut) onSignOut();
                  }}
                >
                  Sign Out
                </button>
              </div>
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
