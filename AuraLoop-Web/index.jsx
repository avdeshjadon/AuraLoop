import { useLayoutEffect, useRef, useState, useEffect, useCallback } from 'react';
import { MotionConfig } from 'motion/react';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './emberpost.css';
import { useSiteMeta } from '../../shared/useSiteMeta.js';
import { gsap, useGSAP, MOTION_OK, prefersReducedMotion } from '../../shared/gsap.js';
import Nav from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import PeopleSection from './components/PeopleSection.jsx';
import PricingSection from './components/PricingSection.jsx';
import DocsPage from './components/DocsPage.jsx';
import Manifesto from './components/Manifesto.jsx';
import Footer from './components/Footer.jsx';
import AuthPage from './components/AuthPage.jsx';
import AccountPage from './components/AccountPage.jsx';
import AdminDashboard from './admin/AdminDashboard.jsx';
import FreePremiumModal from './components/FreePremiumModal.jsx';
import { subscribeAuth, markFreePremiumNotifiedWeb } from './lib/firebase.js';

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

  // User auth state
  const [user, setUser] = useState(null);

  // Page view state: 'home' | 'account' | 'auth' | 'admin' | 'docs'
  const [view, setView] = useState('home');
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup'
  const [docsTab, setDocsTab] = useState('getting-started');

  // Toast notification
  const [toast, setToast] = useState(null);
  const [showRootGiftModal, setShowRootGiftModal] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(current => (current?.message === message ? null : current));
    }, 4500);
  }, []);

  // Listen to Firebase auth state
  useEffect(() => {
    return subscribeAuth(currentUser => {
      setUser(currentUser);
      if (currentUser?.isGiftedPro) {
        const emailKey = currentUser.email ? currentUser.email.toLowerCase() : '';
        const seenEmail = emailKey ? localStorage.getItem(`auraloop_gifted_pro_seen_${emailKey}`) === 'true' : false;
        const seenUid = currentUser.uid ? localStorage.getItem(`auraloop_gifted_pro_seen_${currentUser.uid}`) === 'true' : false;
        if (!seenEmail && !seenUid) {
          setShowRootGiftModal(true);
        }
      }
    });
  }, []);

  const handleRootDismissGiftModal = async () => {
    setShowRootGiftModal(false);
    if (user?.email) {
      localStorage.setItem(`auraloop_gifted_pro_seen_${user.email.toLowerCase()}`, 'true');
    }
    if (user?.uid) {
      localStorage.setItem(`auraloop_gifted_pro_seen_${user.uid}`, 'true');
      await markFreePremiumNotifiedWeb(user.uid);
      setUser(prev => prev ? { ...prev, freePremiumNotifiedWeb: true } : prev);
    }
  };

  const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'theavdeshjadon@gmail.com').toLowerCase();

  useEffect(() => {
    const handleRoute = () => {
      try {
        const path = window.location.pathname.toLowerCase();
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');

        if (path === '/admin' || action === 'admin') {
          const isSessionAuthed = sessionStorage.getItem('auraloop_admin_session') === 'authenticated';
          const isUserAdmin = user?.email?.toLowerCase() === adminEmail;
          if (isSessionAuthed || isUserAdmin) {
            setView('admin');
          } else {
            setAuthMode('signin');
            setView('auth');
            showToast('Please sign in with administrator credentials.', 'error');
          }
        } else if (path === '/account' || path === '/profile' || action === 'account' || action === 'profile' || path === '/upgrade' || action === 'upgrade' || action === 'pro') {
          if (user) {
            setView('account');
          } else {
            setAuthMode('signin');
            setView('auth');
          }
        } else if (path === '/login' || action === 'login' || action === 'signin') {
          if (user) {
            setView('account');
          } else {
            setAuthMode('signin');
            setView('auth');
          }
        } else if (path === '/signup' || path === '/register' || action === 'signup' || action === 'register') {
          if (user) {
            setView('account');
          } else {
            setAuthMode('signup');
            setView('auth');
          }
        } else if (path === '/pricing' || action === 'pricing' || action === 'support' || action === 'donate') {
          setView('home');
          setTimeout(() => {
            const el = document.getElementById('pricing');
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        } else if (path === '/docs' || path === '/manual' || action === 'docs' || action === 'manual') {
          setView('docs');
          setDocsTab('getting-started');
        } else if (path === '/privacy' || path === '/telemetry' || action === 'privacy' || action === 'telemetry') {
          setView('docs');
          setDocsTab('privacy');
        } else {
          setView('home');
        }
      } catch {}
    };

    handleRoute();
    window.addEventListener('popstate', handleRoute);
    return () => window.removeEventListener('popstate', handleRoute);
  }, [user, adminEmail, showToast]);

  const navigateToAuth = (mode = 'signin') => {
    if (user && mode === 'account') {
      navigateToAccount();
      return;
    }
    setAuthMode(mode);
    setView('auth');
    try {
      const path = mode === 'signup' ? '/signup' : '/login';
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

  const navigateToAccount = () => {
    if (user) {
      setView('account');
      try {
        window.history.pushState(null, '', '/account');
      } catch {}
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      navigateToAuth('signin');
    }
  };

  const navigateToAdmin = () => {
    const isSessionAuthed = sessionStorage.getItem('auraloop_admin_session') === 'authenticated';
    const isUserAdmin = user?.email?.toLowerCase() === adminEmail;
    if (isSessionAuthed || isUserAdmin) {
      setView('admin');
      try {
        window.history.pushState(null, '', '/admin');
      } catch {}
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      navigateToAuth('signin');
      showToast('Please sign in with administrator credentials.', 'error');
    }
  };

  const handleAuthSuccess = (authUser, welcomeMsg) => {
    setUser(authUser);
    const isUserAdmin = authUser?.email?.toLowerCase() === adminEmail || sessionStorage.getItem('auraloop_admin_session') === 'authenticated';

    if (isUserAdmin) {
      setView('admin');
      try {
        window.history.pushState(null, '', '/admin');
      } catch {}
    } else {
      setView('home');
      try {
        window.history.pushState(null, '', '/');
      } catch {}
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    showToast(welcomeMsg || `Welcome back, ${authUser?.displayName || 'friend'}!`);
  };

  const handleSignOutSuccess = () => {
    sessionStorage.removeItem('auraloop_admin_session');
    sessionStorage.removeItem('auraloop_admin_email');
    setUser(null);
    setView('home');
    try {
      window.history.pushState(null, '', '/');
    } catch {}
    showToast('Signed out of AuraLoop successfully.', 'info');
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

  // 1. Merged Admin Dashboard Route (/admin)
  if (view === 'admin') {
    return (
      <MotionConfig reducedMotion="user">
        <AdminDashboard
          onBackToSite={navigateToHome}
          currentUser={user}
        />
      </MotionConfig>
    );
  }

  // 2. Separate Detailed Account Page Route (/account)
  if (view === 'account') {
    return (
      <MotionConfig reducedMotion="user">
        <AccountPage
          user={user}
          onBackToHome={navigateToHome}
          onNavigateToAdmin={navigateToAdmin}
          onUserUpdated={setUser}
          onSignOutSuccess={handleSignOutSuccess}
        />
      </MotionConfig>
    );
  }

  // 3. Auth Page Route (/login, /signup)
  if (view === 'auth') {
    return (
      <MotionConfig reducedMotion="user">
        <AuthPage
          initialMode={authMode}
          onBackToHome={navigateToHome}
          onAuthSuccess={handleAuthSuccess}
        />
      </MotionConfig>
    );
  }

  // 4. Standalone Full-Page Docs Route (/docs, /privacy)
  if (view === 'docs') {
    return (
      <MotionConfig reducedMotion="user">
        <DocsPage
          initialTab={docsTab}
          onBack={navigateToHome}
          onNavigateToPricing={() => {
            setView('home');
            try {
              window.history.pushState(null, '', '/#pricing');
            } catch {}
            setTimeout(() => {
              document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
            }, 150);
          }}
        />
      </MotionConfig>
    );
  }

  // 4. Main Home Page Route (/)
  return (
    <MotionConfig reducedMotion="user">
      <div className="ta" ref={rootRef} onClick={onAnchorClick}>
        {/* Free Premium Celebration Popup */}
        <FreePremiumModal
          isOpen={showRootGiftModal}
          onClose={handleRootDismissGiftModal}
          user={user}
        />

        {/* Floating Toast Notification */}
        {toast && (
          <div
            style={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 999999,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 22px',
              borderRadius: '999px',
              background: toast.type === 'error' ? '#991b1b' : '#17130f',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: '600',
              boxShadow: '0 12px 36px -8px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(12px)',
              animation: 'toastSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              pointerEvents: 'auto'
            }}
          >
            <span>{toast.type === 'error' ? '⚠️' : '✨'}</span>
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '0 4px',
                marginLeft: '4px'
              }}
            >
              ✕
            </button>
          </div>
        )}

        <Nav
          user={user}
          onOpenAuth={navigateToAuth}
          onOpenAccount={navigateToAccount}
          onNavigateToAdmin={navigateToAdmin}
          onSignOut={handleSignOutSuccess}
        />

        <main id="main" tabIndex={-1}>
          <Hero />
          <PeopleSection />
          <PricingSection user={user} onOpenAuth={navigateToAuth} onUserUpdated={setUser} />
          <Manifesto />
        </main>
        
        <Footer onNavigateToDocs={(tab) => {
          setDocsTab(tab);
          setView('docs');
          try {
            window.history.pushState(null, '', tab === 'privacy' ? '/privacy' : '/docs');
          } catch {}
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }} />
      </div>
    </MotionConfig>
  );
}
