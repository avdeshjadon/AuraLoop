import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/newsreader';
import './ch.css';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { useSiteMeta } from './shared/useSiteMeta.js';
import { gsap, ScrollTrigger, useGSAP, MOTION_OK, prefersReducedMotion } from './shared/gsap.js';
import { NAV } from './data.js';
import Nav from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import Articles from './components/Articles.jsx';
import Services from './components/Services.jsx';
import Anatomy from './components/Anatomy.jsx';
import Workshops from './components/Workshops.jsx';
import About from './components/About.jsx';
import Contact from './components/Contact.jsx';
import Footer from './components/Footer.jsx';
import Reader from './components/Reader.jsx';
import SearchPalette from './components/SearchPalette.jsx';
import DownloadModal from './components/DownloadModal.jsx';

const isTyping = el => el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

export default function App() {
  useSiteMeta({
    title: 'AuraLoop — High-Performance Native Live Wallpapers & Screensavers for macOS',
    description:
      'Engineered purely in Swift and SwiftUI. Hardware-accelerated 4K looping wallpapers, Apple Aerials, dynamic solar schedules, and ExtensionKit lock screen integration for macOS.',
    themeColor: '#e7e2d8',
    background: '#e7e2d8',
  });

  const root = useRef(null);
  const [reader, setReader] = useState(null);
  const [search, setSearch] = useState(false);
  const [downloadModal, setDownloadModal] = useState(false);
  const [active, setActive] = useState(null);
  const [topic, setTopic] = useState('Feature Request');

  const anyModal = !!reader || search || downloadModal;

  /* Smooth in-page navigation that can also move focus to a field. */
  const goTo = useCallback((id, focusSelector) => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = prefersReducedMotion();
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      if (focusSelector) {
        setTimeout(
          () => document.querySelector(focusSelector)?.focus({ preventScroll: true }),
          reduce ? 0 : 650
        );
      }
    });
  }, []);

  /* "/" or Ctrl/Cmd+K opens search. */
  useEffect(() => {
    const onKey = e => {
      if (anyModal) return;
      const k = e.key.toLowerCase();
      if ((k === '/' && !isTyping(document.activeElement)) || (k === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setSearch(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [anyModal]);

  /* Active nav section tracking via IntersectionObserver. */
  useEffect(() => {
    const ids = NAV.map(n => n.id);
    const seen = new Map();
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => seen.set(e.target.id, e.isIntersecting));
        setActive(ids.find(id => seen.get(id)) || null);
      },
      { rootMargin: '-42% 0px -52% 0px' }
    );
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  /* Section reveals (motion-ok only). */
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, ctx => {
        const blocks = [
          ...gsap.utils.toArray('[data-reveal]', root.current),
          ...gsap.utils.toArray('[data-reveal-stagger]', root.current),
        ];
        const isGroup = el => el.hasAttribute('data-reveal-stagger');
        const targets = el => (isGroup(el) ? [...el.children] : el);
        let engaged = false;
        const engage = () => (engaged = true);
        const evs = ['wheel', 'touchmove', 'keydown', 'pointerdown'];
        evs.forEach(ev => window.addEventListener(ev, engage, { passive: true }));

        const show = new IntersectionObserver(
          entries =>
            entries.forEach(e => {
              if (!e.isIntersecting) return;
              show.unobserve(e.target);
              ctx.add(() =>
                gsap.to(targets(e.target), {
                  y: 0,
                  opacity: 1,
                  duration: 0.9,
                  stagger: isGroup(e.target) ? +e.target.dataset.revealStagger || 0.07 : 0,
                  ease: 'power3.out',
                  overwrite: 'auto',
                })
              );
            }),
          { rootMargin: '0px 0px -8% 0px' }
        );
        const arm = new IntersectionObserver(
          entries =>
            entries.forEach(e => {
              if (!e.isIntersecting || !engaged) return;
              if (e.boundingClientRect.top < window.innerHeight) return;
              arm.unobserve(e.target);
              const y =
                e.target.dataset.revealY !== undefined
                  ? +e.target.dataset.revealY
                  : isGroup(e.target)
                  ? 30
                  : 26;
              ctx.add(() => gsap.set(targets(e.target), { y, opacity: 0 }));
              show.observe(e.target);
            }),
          { rootMargin: '0px 0px 60% 0px' }
        );
        blocks.forEach(el => arm.observe(el));

        let t = 0;
        const ro = new ResizeObserver(() => {
          clearTimeout(t);
          t = setTimeout(() => ScrollTrigger.refresh(), 200);
        });
        ro.observe(root.current);
        return () => {
          evs.forEach(ev => window.removeEventListener(ev, engage));
          arm.disconnect();
          show.disconnect();
          ro.disconnect();
          clearTimeout(t);
        };
      });
    },
    { scope: root }
  );

  const openArticle = useCallback(slug => {
    setSearch(false);
    setReader(slug);
  }, []);

  const startConversation = useCallback(
    featureTitle => {
      setTopic('Feature Request');
      goTo('contact', '#ch-contact-name');
    },
    [goTo]
  );

  return (
    <MotionConfig reducedMotion="never">
      <div className="ch" ref={root}>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div className="ch-frame" id="top">
          <span className="ch-guide ch-guide--l" aria-hidden="true" />
          <span className="ch-guide ch-guide--r" aria-hidden="true" />
          <Nav
            active={active}
            onSearch={() => setSearch(true)}
            onDownload={() => setDownloadModal(true)}
            goTo={goTo}
          />
          <main id="main" tabIndex={-1}>
            <Hero onOpen={openArticle} />
            <Articles onOpen={openArticle} onSearch={() => setSearch(true)} />
            <Services onStart={startConversation} />
            <Anatomy />
            <Workshops />
            <About onDownload={() => setDownloadModal(true)} />
            <Contact topic={topic} setTopic={setTopic} />
          </main>
          <Footer onSearch={() => setSearch(true)} onDownload={() => setDownloadModal(true)} />
        </div>

        <AnimatePresence>
          {search && (
            <SearchPalette
              key="search"
              onClose={() => setSearch(false)}
              onPick={openArticle}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {downloadModal && (
            <DownloadModal
              key="download"
              onClose={() => setDownloadModal(false)}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {reader && (
            <Reader
              key="reader"
              slug={reader}
              onClose={() => setReader(null)}
              onGo={setReader}
              onDownload={() => setDownloadModal(true)}
            />
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
