import { Fragment, useRef } from 'react';
import { gsap, useGSAP, MOTION_OK } from '../shared/gsap.js';
import { ARTICLES, FEATURED, PHOTOS } from '../data.js';
import { photoSet, photoSrc } from '../lib.jsx';
import { ArrowRight, SparklesIcon, PapersIcon } from '../icons.jsx';
import Keycap, { pressKey } from './Keycap.jsx';
import NewsletterForm from './NewsletterForm.jsx';

const H1_TEXT = 'Turn your desktop into living cinematic motion';

// Visual headline: lines → groups → tokens. A group never breaks internally, so a keycap
// always stays attached to the word before it.
const KEY_CREAM = { key: 'cream', glyph: 'apple' };
const KEY_SAGE = { key: 'sage', glyph: 'loop' };
const LINES = [
  [['Turn'], ['your', KEY_CREAM], ['desktop'], ['into']],
  [['living'], [{ phrase: 'cinematic motion', key: KEY_SAGE }]],
];

const Chars = ({ text }) =>
  [...text].map((c, i) => (
    <span key={i} className="ch-c" data-tw>
      {c}
    </span>
  ));

const Word = ({ text }) => (
  <span className="ch-w">
    <Chars text={text} />
  </span>
);

function Token({ tok, sageRef }) {
  if (typeof tok === 'string') return <Word text={tok} />;
  if (tok.phrase) {
    const words = tok.phrase.split(' ');
    const last = words.pop();
    return (
      <span className="ch-grad">
        {words.map(w => (
          <Fragment key={w}>
            <Word text={w} />{' '}
          </Fragment>
        ))}
        <span className="ch-nowrap">
          <Word text={last} /> <Token tok={tok.key} sageRef={sageRef} />
        </span>
      </span>
    );
  }
  return <Keycap tone={tok.key} glyph={tok.glyph} data-tw ref={tok.key === 'sage' ? sageRef : undefined} />;
}

function Headline({ sageRef }) {
  return (
    <h1 className="ch-h1" id="ch-hero-title">
      <span className="sr-only">{H1_TEXT}</span>
      <span className="ch-h1__vis" aria-hidden="true">
        {LINES.map((line, li) => (
          <span className="ch-h1__line" key={li}>
            {line.map((group, gi) => (
              <Fragment key={gi}>
                {gi > 0 && ' '}
                {group.length > 1 ? (
                  <span className="ch-nowrap">
                    {group.map((tok, ti) => (
                      <Fragment key={ti}>
                        {ti > 0 && ' '}
                        <Token tok={tok} sageRef={sageRef} />
                      </Fragment>
                    ))}
                  </span>
                ) : (
                  <Token tok={group[0]} sageRef={sageRef} />
                )}
              </Fragment>
            ))}
            {li === 0 && ' '}
          </span>
        ))}
        <span className="ch-caret ch-caret--type" />
      </span>
    </h1>
  );
}

function FeaturedCard({ a, onOpen, i }) {
  const p = PHOTOS[a.photo];
  return (
    <article className="ch-fcard">
      <div className="ch-fcard__media">
        <img
          src={photoSrc(a.photo, 640, 2 / 3)}
          srcSet={photoSet(a.photo, [400, 640, 960], 2 / 3)}
          sizes="(max-width: 700px) 78vw, (max-width: 1100px) 30vw, 300px"
          width="640"
          height="427"
          alt={p?.alt || a.title}
          decoding="async"
          loading={i === 0 ? 'eager' : 'lazy'}
        />
        {a.overlay && (
          <span className="ch-fcard__overlay" aria-hidden="true">
            <span className="ch-fcard__otitle">{a.overlay.title}</span>
            <span className="ch-fcard__oscript">{a.overlay.script}</span>
          </span>
        )}
      </div>
      <div className="ch-fcard__body">
        <p className="ch-meta">
          <span>{a.category}</span>
          <span aria-hidden="true">·</span>
          <span>4K · 60 FPS</span>
        </p>
        <h3 className="ch-fcard__title">
          <button type="button" className="ch-stretch" onClick={() => onOpen(a.slug)}>
            {a.title}
          </button>
        </h3>
      </div>
    </article>
  );
}

export default function Hero({ onOpen }) {
  const root = useRef(null);
  const sageRef = useRef(null);
  const restCaret = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        const vis = root.current.querySelector('.ch-h1__vis');
        if (!vis) return;
        const caret = vis.querySelector('.ch-caret--type');
        const seq = gsap.utils.toArray('[data-tw]', vis);
        const firstLine = vis.querySelector('.ch-h1__line');
        const endOfLine1 = firstLine ? [...firstLine.querySelectorAll('[data-tw]')].pop() : null;

        const place = el => {
          if (!caret || !el) return;
          const h = caret.offsetHeight;
          gsap.set(caret, {
            x: el.offsetLeft + el.offsetWidth + 2,
            y: el.offsetTop + (el.offsetHeight - h) / 2,
          });
        };

        gsap.set(seq, { autoAlpha: 0 });
        if (restCaret.current) gsap.set(restCaret.current, { autoAlpha: 0 });

        const tl = gsap.timeline({ delay: 0.2, defaults: { ease: 'power3.out' } });
        tl.from(document.querySelectorAll('[data-hero-in]'), { y: -10, autoAlpha: 0, duration: 0.8, stagger: 0.07 }, 0);
        tl.from('.ch-eyebrow', { y: 8, autoAlpha: 0, duration: 0.6 }, 0.12);

        let t = 0.4;
        if (caret && seq.length) {
          tl.set(caret, { autoAlpha: 1 }, t - 0.05);
          tl.call(() => gsap.set(caret, { x: 0, y: seq[0].offsetTop + (seq[0].offsetHeight - caret.offsetHeight) / 2 }), null, t - 0.05);
          seq.forEach((el, i) => {
            if (el.classList.contains('ch-key')) {
              tl.fromTo(el, { autoAlpha: 0, y: -14, scale: 0.82 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.3 }, t);
              tl.call(place, [el], t + 0.02);
              tl.call(pressKey, [el, 150], t + 0.2);
              t += 0.15;
            } else {
              tl.set(el, { autoAlpha: 1 }, t);
              tl.call(place, [el], t);
              const c = el.textContent;
              t += 0.012 + ((i * 37) % 5) * 0.003 + (c === ':' ? 0.08 : 0);
            }
            if (el === endOfLine1) t += 0.07;
          });
          tl.set(caret, { autoAlpha: 0 }, t + 0.2);
        }
        if (restCaret.current) {
          tl.set(restCaret.current, { autoAlpha: 1 }, t + 0.2);
        }
        tl.from('[data-hero-fade]', { y: 14, autoAlpha: 0, duration: 0.9, stagger: 0.08 }, t - 0.35);
        tl.from('.ch-featured', { y: 34, autoAlpha: 0, duration: 1.1, ease: 'expo.out' }, t - 0.15);
      });

      // Keycaps lean gently toward the pointer (fine pointers only).
      mm.add(`${MOTION_OK} and (hover: hover) and (pointer: fine)`, () => {
        const floats = gsap.utils.toArray('.ch-key__float', root.current);
        const tos = floats.map(f => ({
          rx: gsap.quickTo(f, 'rotationX', { duration: 0.6, ease: 'power3.out' }),
          ry: gsap.quickTo(f, 'rotationY', { duration: 0.6, ease: 'power3.out' }),
          y: gsap.quickTo(f, 'y', { duration: 0.6, ease: 'power3.out' }),
        }));
        gsap.set(floats, { transformPerspective: 500 });
        const onMove = e => {
          const r = root.current.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / Math.min(r.height, 700) - 0.5;
          tos.forEach((q, i) => {
            const k = i ? 1.15 : 1;
            q.ry(nx * 16 * k);
            q.rx(-ny * 12 * k);
            q.y(ny * 3);
          });
        };
        const el = root.current;
        el.addEventListener('pointermove', onMove);
        return () => el.removeEventListener('pointermove', onMove);
      });
    },
    { scope: root }
  );

  const featured = FEATURED.map(s => ARTICLES.find(a => a.slug === s)).filter(Boolean);

  return (
    <section className="ch-hero" ref={root} aria-labelledby="ch-hero-title">
      <div className="ch-wrap">
        <p className="ch-eyebrow">
          <SparklesIcon size={15} />
          macOS 14+ Sonoma &amp; Sequoia · Universal Binary
        </p>
        <Headline sageRef={sageRef} />
        <span className="ch-caret ch-caret--rest" ref={restCaret} aria-hidden="true" />

        <div className="ch-hero__row">
          <p className="ch-hero__intro" data-hero-fade>
            AuraLoop is a native macOS application engineered in Swift and SwiftUI. It delivers ultra-smooth 4K looping wallpapers and ExtensionKit lock screen integration with near-zero CPU and memory overhead.
          </p>
          <NewsletterForm onKeystroke={() => pressKey(sageRef.current, 110)} />
        </div>

        <section className="ch-featured" aria-labelledby="ch-featured-title">
          <div className="ch-featured__head">
            <h2 className="ch-label" id="ch-featured-title">
              <PapersIcon size={15} />
              Featured 4K Masters
            </h2>
            <a className="ch-textlink" href="#wallpapers">
              Explore catalog <ArrowRight size={14} />
            </a>
          </div>
          <div className="ch-tray">
            <div className="ch-tray__track" role="list">
              {featured.map((a, i) => (
                <div role="listitem" key={a.slug} className="ch-tray__item">
                  <FeaturedCard a={a} i={i} onOpen={onOpen} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
