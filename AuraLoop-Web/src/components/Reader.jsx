import { Fragment, useEffect, useLayoutEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ARTICLES, PHOTOS } from '../data.js';
import { photoSet, photoSrc, useDialog, useReduced } from '../lib.jsx';
import { ArrowLeft, ArrowRight, CloseIcon, DownloadIcon } from '../icons.jsx';

export default function Reader({ slug, onClose, onGo, onDownload }) {
  const ref = useRef(null);
  const scroller = useRef(null);
  const bar = useRef(null);
  const titleRef = useRef(null);
  const first = useRef(true);
  const reduce = useReduced();
  useDialog(ref, onClose);

  const a = ARTICLES.find(x => x.slug === slug) || ARTICLES[0];
  const n = ARTICLES.length;
  const prev = ARTICLES[(a.index - 1 + n) % n];
  const next = ARTICLES[(a.index + 1) % n];

  const progress = () => {
    const el = scroller.current;
    if (!el || !bar.current) return;
    const max = el.scrollHeight - el.clientHeight;
    bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, el.scrollTop / max) : 0})`;
  };

  useLayoutEffect(() => {
    if (scroller.current) scroller.current.scrollTop = 0;
    progress();
  }, [slug]);

  // When moving between wallpapers, focus on the new title so it is announced.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => titleRef.current?.focus({ preventScroll: true }), reduce ? 0 : 260);
    return () => clearTimeout(t);
  }, [slug, reduce]);

  const p = PHOTOS[a.photo];

  return (
    <>
      <motion.div
        className="ch-scrim ch-scrim--reader"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      />
      <motion.div
        ref={ref}
        className="ch-reader"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ch-reader-title"
        initial={reduce ? { opacity: 0 } : { opacity: 0, x: 48 }}
        animate={{ opacity: 1, x: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, x: 36 }}
        transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <div className="ch-reader__bar">
          <span className="ch-reader__sample">4K Wallpaper Specification &amp; Playback Profile</span>
          <button
            type="button"
            className="ch-iconbtn ch-iconbtn--soft"
            onClick={onClose}
            aria-label="Close wallpaper inspection"
          >
            <CloseIcon size={18} />
          </button>
          <span className="ch-reader__progress" aria-hidden="true">
            <span ref={bar} />
          </span>
        </div>

        <div className="ch-reader__scroll" ref={scroller} onScroll={progress} tabIndex={-1} data-autofocus>
          <AnimatePresence mode="wait" initial={false}>
            <motion.article
              key={a.slug}
              className="ch-reader__article"
              initial={{ opacity: 0, y: reduce ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <header className="ch-reader__head">
                <p className="ch-meta">
                  <span>{a.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>3840×2160 UHD</span>
                  <span aria-hidden="true">·</span>
                  <span>60 FPS</span>
                  <span aria-hidden="true">·</span>
                  <span>10-bit P3 HDR</span>
                </p>
                <h2 className="ch-reader__title" id="ch-reader-title" ref={titleRef} tabIndex={-1}>
                  {a.title}
                </h2>
                <p className="ch-reader__dek">{a.dek}</p>
                <div style={{ marginTop: 16 }}>
                  <button
                    type="button"
                    className="ch-btn ch-btn--dark"
                    onClick={() => {
                      onClose();
                      onDownload?.();
                    }}
                  >
                    <DownloadIcon size={15} style={{ marginRight: 6 }} /> Get this in AuraLoop (.DMG)
                  </button>
                </div>
              </header>

              <figure className="ch-reader__fig">
                <img
                  src={photoSrc(a.photo, 1200, 0.5)}
                  srcSet={photoSet(a.photo, [640, 1000, 1400], 0.5)}
                  sizes="(max-width: 800px) 100vw, 720px"
                  width="1200"
                  height="600"
                  alt={p?.alt || a.title}
                  decoding="async"
                />
                <figcaption>Master preview calibrated for Liquid Retina XDR &amp; Studio Display.</figcaption>
              </figure>

              <div className="ch-prose">
                {a.sections.map((s, i) => (
                  <Fragment key={s.h}>
                    <h3>{s.h}</h3>
                    {s.p.map(t => (
                      <p key={t.slice(0, 24)}>{t}</p>
                    ))}
                    {i === a.quoteAfter - 1 && (
                      <blockquote className="ch-pull">
                        <p>{a.quote}</p>
                      </blockquote>
                    )}
                  </Fragment>
                ))}
              </div>

              <p className="ch-reader__end">
                Seamless looping master with ExtensionKit integration. Runs natively on macOS Sonoma &amp; Sequoia.
              </p>

              <nav className="ch-reader__pn" aria-label="More wallpapers">
                <button type="button" className="ch-pn" onClick={() => onGo(prev.slug)}>
                  <span className="ch-pn__dir">
                    <ArrowLeft size={15} /> Previous wallpaper
                  </span>
                  <span className="ch-pn__title">{prev.title}</span>
                </button>
                <button type="button" className="ch-pn ch-pn--next" onClick={() => onGo(next.slug)}>
                  <span className="ch-pn__dir">
                    Next wallpaper <ArrowRight size={15} />
                  </span>
                  <span className="ch-pn__title">{next.title}</span>
                </button>
              </nav>
            </motion.article>
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
