import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import InboxWindow from './InboxWindow.jsx';
import { useInbox } from './useInbox.js';
import { INCOMING, PEOPLE } from '../data.js';
import { face, goToWaitlist, useMedia } from '../lib.js';
import { Bolt } from '../icons.jsx';
import { gsap, useGSAP, MOTION_OK } from '../../../shared/gsap.js';

function Tile({ side, person, tileRef, onOpen }) {
  const p = PEOPLE[person] || PEOPLE.snowfall;
  const { src, srcSet } = face(p.photo, 124);
  return (
    <button
      type="button"
      ref={tileRef}
      className={`ta-ftile ta-ftile--${side}`}
      onClick={() => onOpen(person)}
      aria-label={`Inspect ${p.name}`}
    >
      <span className="ta-ftile__par">
        <span className="ta-ftile__float">
          <span className="ta-ftile__tilt">
            <span className="ta-ftile__card">
              <img src={src} srcSet={srcSet} width="124" height="124" alt="" decoding="async" fetchPriority="high" />
            </span>
          </span>
        </span>
      </span>
    </button>
  );
}

export default function Hero() {
  const [inbox, dispatch] = useInbox();
  const reduced = useMedia('(prefers-reduced-motion: reduce)');

  const heroRef = useRef(null);
  const stageRef = useRef(null);
  const regionRef = useRef(null);
  const tileL = useRef(null);
  const tileR = useRef(null);

  const [paths, setPaths] = useState({ l: '', r: '' });
  const [paused, setPaused] = useState(false);
  const [fed, setFed] = useState(0);
  const [announce, setAnnounce] = useState('');

  /* ---- curved connector lines: measured from layout boxes */
  const measure = useCallback(() => {
    const a = tileL.current;
    const b = tileR.current;
    const win = regionRef.current;
    if (!a || !b || !win || a.offsetParent === null) {
      setPaths({ l: '', r: '' });
      return;
    }
    const wl = win.offsetLeft;
    const wt = win.offsetTop;
    const W = win.offsetWidth;
    const ax = a.offsetLeft + a.offsetWidth / 2;
    const ay = a.offsetTop + a.offsetHeight / 2;
    const bx = b.offsetLeft + b.offsetWidth / 2;
    const by = b.offsetTop + b.offsetHeight / 2;
    const le = { x: wl + 16, y: wt + 92 };
    const re = { x: wl + W - 16, y: wt + 184 };
    const dl = le.y - ay;
    const dr = re.y - by;
    const side = stageRef.current.getBoundingClientRect().left + wl;
    const k = Math.max(0.25, Math.min(1, side / 150));
    const f = n => Math.round(n * 10) / 10;
    setPaths({
      l: `M${f(ax)},${f(ay)} C${f(ax + 62 * k)},${f(ay + dl * 0.46)} ${f(le.x - 88 * k)},${f(le.y - dl * 0.2)} ${f(le.x)},${f(le.y)}`,
      r: `M${f(bx)},${f(by)} C${f(bx - 44 * k)},${f(by + dr * 0.5)} ${f(re.x + 104 * k)},${f(re.y - dr * 0.26)} ${f(re.x)},${f(re.y)}`,
    });
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, [measure]);

  const openConvo = id => {
    dispatch({ type: 'select', id });
    regionRef.current?.focus({ preventScroll: true });
  };

  /* ---- motion: entrance, ambient float, pointer parallax */
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
        tl.from('.ta-badge', { y: 14, opacity: 0, duration: 0.9 }, 0.1)
          .from('.ta-h1__w', { yPercent: 50, opacity: 0, filter: 'blur(10px)', duration: 1.1, stagger: 0.07 }, 0.18)
          .from('.ta-mailtile', { scale: 0.35, opacity: 0, rotate: -20, duration: 1.1 }, 0.62)
          .from('.ta-hero__sub', { y: 16, opacity: 0, duration: 0.9 }, 0.5)
          .from('.ta-hero__cta', { y: 16, opacity: 0, duration: 0.9 }, 0.6)
          .from('.ta-win', { y: 80, opacity: 0, duration: 1.3 }, 0.7)
          .from('.ta-ftile__card, .ta-mtile img', { scale: 0.7, opacity: 0, duration: 1, stagger: 0.12 }, 0.95)
          .from('.ta-curves path', { strokeDashoffset: 1, duration: 1.5, ease: 'power2.inOut', stagger: 0.1 }, 1.15);

        gsap.to('.ta-ftile__float', {
          y: -7,
          duration: 3.6,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          stagger: { each: 1.3 },
        });
      });

      mm.add(`${MOTION_OK} and (hover: hover) and (pointer: fine)`, () => {
        const hero = heroRef.current;
        const items = gsap.utils.toArray('.ta-ftile__par');
        const setters = items.map((el, i) => ({
          x: gsap.quickTo(el, 'x', { duration: 1, ease: 'power3.out' }),
          y: gsap.quickTo(el, 'y', { duration: 1, ease: 'power3.out' }),
          depth: i === 0 ? 16 : 22,
        }));
        const onMove = e => {
          const r = hero.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / r.height - 0.5;
          setters.forEach(s => {
            s.x(nx * s.depth);
            s.y(ny * s.depth);
          });
        };
        hero.addEventListener('pointermove', onMove);
        return () => hero.removeEventListener('pointermove', onMove);
      });
    },
    { scope: heroRef }
  );

  const left = PEOPLE.snowfall;
  const right = PEOPLE.aurora;
  const ml = face(left.photo, 64);
  const mr = face(right.photo, 64);

  return (
    <section className="ta-hero" id="top" ref={heroRef} aria-labelledby="ta-hero-title">
      <div className="ta-hero__grid" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>

      <div className="ta-hero__copy">
        <span className="ta-mtile ta-mtile--l" aria-hidden="true">
          <img src={ml.src} srcSet={ml.srcSet} width="64" height="64" alt="" decoding="async" />
        </span>
        <span className="ta-mtile ta-mtile--r" aria-hidden="true">
          <img src={mr.src} srcSet={mr.srcSet} width="64" height="64" alt="" decoding="async" />
        </span>


        <h1 id="ta-hero-title" className="ta-h1">
          <span className="ta-h1__line">
            <span className="ta-h1__w">Live</span>{' '}
            <span className="ta-mailtile" aria-hidden="true" style={{ background: '#b5482a', color: '#fff' }}>
              <Bolt size={18} />
            </span>{' '}
            <span className="ta-h1__w">in</span> <span className="ta-h1__w">motion,</span>
          </span>
          <span className="ta-h1__line">
            <span className="ta-h1__w">not</span> <span className="ta-h1__w">in</span>{' '}
            <span className="ta-h1__w">static</span> <span className="ta-h1__w">frozen</span>{' '}
            <span className="ta-h1__w">pixels.</span>
          </span>
        </h1>
        <p className="ta-hero__sub">
          AuraLoop renders continuous 4K looping wallpapers and ExtensionKit lock screen synchronization on macOS with near-zero CPU footprint and whisper-quiet fans.
        </p>
        <a href="#waitlist" className="ta-btn ta-btn--ember ta-hero__cta" onClick={goToWaitlist}>
          Download .DMG (v6.6.0) <Bolt size={14} />
        </a>
      </div>

      <div className="ta-stage" ref={stageRef}>
        <svg className="ta-curves" aria-hidden="true" focusable="false">
          <path d={paths.l || 'M0,0'} pathLength="1" className={paths.l ? '' : 'is-empty'} />
          <path d={paths.r || 'M0,0'} pathLength="1" className={paths.r ? '' : 'is-empty'} />
        </svg>
        <Tile side="l" person="snowfall" tileRef={tileL} onOpen={openConvo} />
        <Tile side="r" person="aurora" tileRef={tileR} onOpen={openConvo} />

        <InboxWindow
          inbox={inbox}
          dispatch={dispatch}
          regionRef={regionRef}
          reduced={reduced}
          live={{
            show: !reduced,
            paused,
            finished: fed >= INCOMING.length,
            onToggle: () => setPaused(p => !p),
          }}
        />
        <p className="sr-only" aria-live="polite">
          {announce}
        </p>
      </div>
    </section>
  );
}
