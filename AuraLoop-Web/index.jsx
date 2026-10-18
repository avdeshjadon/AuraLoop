import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { MotionConfig } from 'motion/react';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './emberpost.css';
import { useSiteMeta } from '../../shared/useSiteMeta.js';
import { gsap, useGSAP, MOTION_OK, prefersReducedMotion } from '../../shared/gsap.js';
import Nav from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import PeopleSection from './components/PeopleSection.jsx';
import Features from './components/Features.jsx';
import Workflows from './components/Workflows.jsx';
import Manifesto from './components/Manifesto.jsx';
import Footer from './components/Footer.jsx';
import AuthPage from './components/AuthPage.jsx';

export default function AuraLoopWeb() {
  useSiteMeta({
    title: 'AuraLoop — High-Performance Native Live Wallpapers & Screensavers for macOS',
    description:
      'AuraLoop brings continuous 4K looping video wallpapers, dynamic solar elevation schedules, and ExtensionKit lock screen synchronization to macOS with near-zero CPU overhead.',
    themeColor: '#eeeae4',
    background: '#eeeae4',
    site: 'auraloop',
  });

  const rootRef = useRef(null);

  // Page view state: 'home' | 'auth'
  const [view, setView] = useState('home');
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup' | 'account'

  useEffect(() => {
    const handleRoute = () => {
      try {
        const path = window.location.pathname.toLowerCase();
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');

        if (path === '/login' || action === 'login' || action === 'signin') {
          setAuthMode('signin');
          setView('auth');
        } else if (path === '/signup' || path === '/register' || action === 'signup' || action === 'register') {
          setAuthMode('signup');
          setView('auth');
        } else if (path === '/account' || path === '/upgrade' || action === 'upgrade' || action === 'pro') {
          setAuthMode('account');
          setView('auth');
        } else {
          setView('home');
        }
      } catch {}
    };

    handleRoute();
    window.addEventListener('popstate', handleRoute);
    return () => window.removeEventListener('popstate', handleRoute);
  }, []);

  const navigateToAuth = (mode = 'signin') => {
    setAuthMode(mode);
    setView('auth');
    try {
      const path = mode === 'signup' ? '/signup' : mode === 'account' ? '/account' : '/login';
      window.history.pushState(null, '', path);
    } catch {}
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const navigateToHome = () => {
    setView('home');
    try {
      window.history.pushState(null, '', '/');
    } catch {}
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // In-page anchors scroll smoothly via JS, so programmatic scrolling (tools, hash restore)
  // stays instant. The inline style is restored when the route unmounts.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const prev = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    return () => {
      root.style.scrollBehavior = prev;
    };
  }, []);

  const onAnchorClick = e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href^="#"]');
    const id = a?.getAttribute('href').slice(1);
    const el = id && document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    if (el.tabIndex >= -1 && el.hasAttribute('tabindex')) el.focus({ preventScroll: true });
  };

  // Section reveals. Hidden states are only ever set inside the motion-ok branch.
  useGSAP(
    () => {
      if (view !== 'home') return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.utils.toArray('[data-reveal]').forEach(el => {
          gsap.from(el, {
            y: 32,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          });
        });
      });
    },
    { scope: rootRef, dependencies: [view] }
  );

  if (view === 'auth') {
    return (
      <MotionConfig reducedMotion="user">
        <AuthPage initialMode={authMode} onBackToHome={navigateToHome} />
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="ta" ref={rootRef} onClick={onAnchorClick}>
        <Nav onOpenAuth={navigateToAuth} />
        <main id="main" tabIndex={-1}>
          <Hero />
          <PeopleSection />
          <Features />
          <Workflows />
          <Manifesto />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  );
}
