import { useMemo, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { ARTICLES, CATEGORIES, PHOTOS } from '../data.js';
import { photoSet, photoSrc, useReduced } from '../lib.jsx';
import { ArrowUpRight, PapersIcon, SearchIcon } from '../icons.jsx';

function ArticleCard({ a, lead, onOpen }) {
  const ratio = lead ? 5 / 4 : 3 / 4;
  const p = PHOTOS[a.photo];
  return (
    <article className={`ch-acard ${lead ? 'is-lead' : 'ch-acard--wide'}`}>
      <div className="ch-acard__media">
        <img
          src={photoSrc(a.photo, lead ? 760 : 720, ratio)}
          srcSet={photoSet(a.photo, lead ? [480, 760, 1100] : [420, 720, 960], ratio)}
          sizes={lead ? '(max-width: 760px) 92vw, 360px' : '(max-width: 760px) 92vw, (max-width: 1100px) 45vw, 310px'}
          width={lead ? 760 : 720}
          height={Math.round((lead ? 760 : 720) * ratio)}
          alt={p?.alt || a.title}
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="ch-acard__body">
        <p className="ch-meta">
          <span>{a.category}</span>
          <span aria-hidden="true">·</span>
          <span>4K · 60 FPS</span>
        </p>
        <h3 className="ch-acard__title">
          <button type="button" className="ch-stretch" onClick={() => onOpen(a.slug)}>
            <span className="ch-uline">{a.title}</span>
          </button>
        </h3>
        <p className="ch-acard__dek">{a.dek}</p>
        <span className="ch-acard__go" aria-hidden="true">
          Preview <ArrowUpRight size={14} />
        </span>
      </div>
    </article>
  );
}

export default function Articles({ onOpen, onSearch }) {
  const [cat, setCat] = useState('All');
  const reduce = useReduced();
  const list = useMemo(() => (cat === 'All' ? ARTICLES : ARTICLES.filter(a => a.category === cat)), [cat]);
  const count = c => (c === 'All' ? ARTICLES.length : ARTICLES.filter(a => a.category === c).length);
  const t = reduce ? { duration: 0 } : { duration: 0.45, ease: [0.2, 0.7, 0.2, 1] };

  return (
    <section className="ch-section ch-articles" id="wallpapers" aria-labelledby="ch-articles-title">
      <div className="ch-wrap">
        <header className="ch-shead ch-shead--split" data-reveal>
          <div>
            <p className="ch-label">
              <PapersIcon size={15} /> Catalog
            </p>
            <h2 className="ch-h2" id="ch-articles-title">
              Curated 4K Apple Aerials &amp; Dynamic Solar.
            </h2>
          </div>
          <div className="ch-shead__aside">
            <p className="ch-lede">
              Browse cinematic landscape flyovers, orbital views, and 24-hour astronomical transitions designed for Pro Display XDR and Retina screens.
            </p>
            <button type="button" className="ch-searchhint" onClick={onSearch}>
              <SearchIcon size={16} />
              Search catalog
              <kbd>/</kbd>
            </button>
          </div>
        </header>

        <LayoutGroup id="ch-filters">
          <div className="ch-chips" role="group" aria-label="Filter wallpapers by theme" data-reveal>
            {CATEGORIES.map(c => {
              const on = c === cat;
              return (
                <button
                  key={c}
                  type="button"
                  className={`ch-chip ${on ? 'is-on' : ''}`}
                  aria-pressed={on}
                  onClick={() => setCat(c)}
                >
                  {on && (
                    <motion.span
                      layoutId="ch-chip-bg"
                      className="ch-chip__bg"
                      transition={
                        reduce
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 420, damping: 36 }
                      }
                    />
                  )}
                  <span className="ch-chip__label">{c}</span>
                  <span className="ch-chip__count">{count(c)}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
        <p className="sr-only" aria-live="polite">
          {cat === 'All' ? `Showing all ${list.length} wallpapers` : `Showing ${list.length} wallpapers in ${cat}`}
        </p>

        <div className="ch-agrid" data-reveal>
          <AnimatePresence mode="popLayout" initial={false}>
            {list.map((a, i) => (
              <motion.div
                key={a.slug}
                layout={reduce ? false : 'position'}
                className={`ch-agrid__cell ${i === 0 ? 'is-lead' : ''} ${
                  i > 0 && i === list.length - 1 && (list.length - 1) % 2 === 1 ? 'is-tail' : ''
                }`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={t}
              >
                <ArticleCard a={a} lead={i === 0} onOpen={onOpen} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
