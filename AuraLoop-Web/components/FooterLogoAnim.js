/**
 * Footer wordmark O-character animation.
 *
 * A looping, scroll-aware GSAP choreography that lives entirely inside the
 * existing footer wordmark. The two lowercase "o" glyphs have permanent eyes
 * (they are never hidden). An independent, continuous eye controller keeps the
 * pupils drifting, glancing up/down and blinking naturally — during both the
 * resting period and the main sequence — without ever fighting the main
 * timeline for control of the same properties.
 *
 * The right "o" periodically wakes up, leaps out of the wordmark and falls into
 * the clear corridor to the right of the tagline, lands smoothly, grows arms
 * and legs, looks around with curiosity, looks up, then jumps back up with a
 * single controlled midair rotation and lands precisely in its original
 * typographic slot. It then rests (default ~10s, eyes still alive) before the
 * whole sequence repeats automatically. There is no rope.
 *
 * Everything is driven by a single plain-object proxy rendered on every flip of
 * any timeline, so playback/resume is deterministic and nothing can desync.
 * All coordinates are measured at runtime from the rendered wordmark (no hard-
 * coded viewport assumptions) and re-measured on resize / font load.
 *
 * Layout constraints handled by construction:
 *  - the tagline text run and the "p" glyph are keep-out regions; the play
 *    corridor lives to the right of the tagline and the exit/return arcs stay
 *    above the "p" while crossing it,
 *  - the footer divider bounds the "floor",
 *  - the character always returns to its exact resting slot (no drift).
 */

import { gsap, ScrollTrigger } from '../../shared/gsap.js';

/* Number of seconds the character rests in its slot between full cycles.
 * Configurable: keep within the required 5–20s window. */
const CYCLE_REST_S = 10;

/* -------------------------------------------------------------------------- */
/* rig geometry (user units of the 1000x1000 rig viewBox)                     */
/* -------------------------------------------------------------------------- */

const RIG_GLYPH_D = 300; // rendered ink diameter of the "o" maps to this many units
const EYE = [
  { ox: 416, oy: 402 },
  { ox: 584, oy: 402 },
];
const PUPIL_AMP = { x: 24, y: 18 };
const SHOULDER = [
  { x: 352, y: 500 },
  { x: 648, y: 500 },
];
const HIP = [
  { x: 434, y: 622 },
  { x: 566, y: 622 },
];
const ARM = { l1: 128, l2: 112 };
const LEG = { l1: 118, l2: 104 };
const BEND = { arm: [-1, 1], leg: [-1, 1] };

const canvas = document.createElement('canvas').getContext('2d');

/* -------------------------------------------------------------------------- */
/* helpers                                                                    */
/* -------------------------------------------------------------------------- */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;

/** two-bone IK; limbs point along +y at rotation 0. returns degrees. */
function solveIK(sx, sy, tx, ty, l1, l2, bend) {
  let dx = tx - sx;
  let dy = ty - sy;
  let d = Math.hypot(dx, dy);
  const maxD = (l1 + l2) * 0.999;
  if (d > maxD) {
    dx *= maxD / d;
    dy *= maxD / d;
    d = maxD;
  }
  if (d < 1e-3) d = 1e-3;
  const a = Math.atan2(dy, dx);
  const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const a1 = a + bend * A;
  const B = Math.acos(clamp((l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2), -1, 1));
  const a2 = -bend * (Math.PI - B);
  return { a1: (a1 * 180) / Math.PI - 90, a2: (a2 * 180) / Math.PI };
}

function fontString(el) {
  const cs = getComputedStyle(el);
  return `${cs.fontStyle} ${cs.fontWeight} ${parseFloat(cs.fontSize)}px ${cs.fontFamily}`;
}

/** Ink metrics of a span's text, in px relative to its border-box top-left. */
function measureTextSpan(el) {
  const cs = getComputedStyle(el);
  const fs = parseFloat(cs.fontSize);
  canvas.font = fontString(el);
  const text = (el.firstChild && el.firstChild.textContent) || el.textContent.trim();
  const m = canvas.measureText(text);
  const rect = el.getBoundingClientRect();
  const fa = m.fontBoundingBoxAscent || fs * 0.8;
  const fd = m.fontBoundingBoxDescent || fs * 0.2;
  const halfLead = (rect.height - (fa + fd)) / 2;
  const baseline = halfLead + fa;
  const inkAsc = m.actualBoundingBoxAscent || fs * 0.5;
  const inkDesc = Math.abs(m.actualBoundingBoxDescent || fs * 0.06);
  const inkH = inkAsc + inkDesc;
  const inkCx = (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2 || rect.width / 2;
  return {
    rect,
    fs,
    baseline,
    inkH,
    inkCx,
    inkCy: baseline - (inkAsc - inkDesc) / 2,
    inkAsc,
    inkLeft: -m.actualBoundingBoxLeft,
    inkRight: m.actualBoundingBoxRight,
  };
}

function relRect(el, base) {
  const r = el.getBoundingClientRect();
  const b = base.getBoundingClientRect();
  return {
    x: r.left - b.left,
    y: r.top - b.top,
    w: r.width,
    h: r.height,
    right: r.right - b.left,
    bottom: r.bottom - b.top,
  };
}

/** Bounding box of an element's text run (not its block box). */
function textRunRect(el, base) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const r = range.getBoundingClientRect();
  const b = base.getBoundingClientRect();
  return {
    x: r.left - b.left,
    y: r.top - b.top,
    w: r.width,
    h: r.height,
    right: r.right - b.left,
    bottom: r.bottom - b.top,
  };
}

/* -------------------------------------------------------------------------- */
/* init                                                                       */
/* -------------------------------------------------------------------------- */

export function initFooterLogoAnimation(footer) {
  if (!footer) return () => {};

  const brand = footer.querySelector('.ta-footer__brand');
  const wordmark = brand && brand.querySelector('.ta-wordmark');
  const oEls = brand ? Array.from(brand.querySelectorAll('.ta-o')) : [];
  const pEl = brand && brand.querySelector('.ta-p');
  const tagline = brand && brand.querySelector('p');
  const floorLine = brand && brand.querySelector('.ta-floor');
  const footerBottom = footer.querySelector('.ta-footer__bottom');
  if (!brand || !wordmark || !pEl || !tagline || !floorLine || oEls.length !== 2) {
    return () => {};
  }

  const rigs = oEls.map(el => el.querySelector('.ta-o__rig'));

  // Cache every animated node once (the DOM is static across rebuilds) so the
  // per-frame render never has to query the tree.
  const faces = rigs.map(r => (r ? r.querySelector('.ta-rig-face') : null));
  const eyeGroups = rigs.map(r => (r ? Array.from(r.querySelectorAll('.ta-rig-eye')) : []));
  const pupils = eyeGroups.map(g => g.map(e => e.querySelector('.ta-rig-pupil')));
  const armEls = rigs[1] ? Array.from(rigs[1].querySelectorAll('.ta-rig-limb--arm')) : [];
  const legEls = rigs[1] ? Array.from(rigs[1].querySelectorAll('.ta-rig-limb--leg')) : [];
  const armU = armEls.map(a => a.querySelector('.ta-rig-limb-u'));
  const armF = armEls.map(a => a.querySelector('.ta-rig-limb-f'));
  const legU = legEls.map(l => l.querySelector('.ta-rig-limb-u'));
  const legF = legEls.map(l => l.querySelector('.ta-rig-limb-f'));

  let active = false;
  let tickerFn = null;

  let master = null; // main character choreography (loops)
  let idle = null; // continuous eye controller (independent)
  let st = null; // ScrollTrigger visibility manager
  let mm = null;
  let ro = null;
  let disposed = false;
  let resizeTimer = 0;
  let roPrimed = false;

  let geo = null;
  let s = null;

  // stage-space positions of the character's hands/feet, refreshed each frame
  const hand = [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ];
  const foot = [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ];

  /* ---------------------------- measurement ------------------------------ */

  function measure() {
    const gA = measureTextSpan(oEls[0]);
    const gB = measureTextSpan(oEls[1]);
    const gP = measureTextSpan(pEl);
    const bRect = brand.getBoundingClientRect();
    const brandW = bRect.width;
    const wm = relRect(wordmark, brand);
    const tag = textRunRect(tagline, brand);
    const bot = relRect(footerBottom, brand);

    const oARect = relRect(oEls[0], brand);
    const oBRect = relRect(oEls[1], brand);
    const pRect = relRect(pEl, brand);

    const toStage = (g, rect) => ({
      cx: rect.x + g.inkCx,
      cy: rect.y + g.inkCy,
      baseline: rect.y + g.baseline,
      inkH: g.inkH,
      fs: g.fs,
      inkTop: rect.y + g.baseline - g.inkAsc,
      inkBottom: rect.y + g.baseline + g.inkDesc,
    });

    const a = toStage(gA, oARect);
    const b = toStage(gB, oBRect);
    const p = toStage(gP, pRect);

    const D = (a.inkH + b.inkH) / 2;
    const pxPerUnit = D / RIG_GLYPH_D;
    const rigSize = 1000 * pxPerUnit;
    const r = D / 2;

    const feetExt = 0.66 * D;

    // play corridor: right of BOTH the tagline and the p. The character rotates
    // in the corridor, so reserve the glyph box's rotated half-diagonal (not the
    // ink radius) to guarantee the spinning body can never reach the tagline.
    const halfDiag = Math.hypot(oBRect.w, oBRect.h) / 2;
    const corridorX = clamp(
      Math.max(tag.right, pRect.right) + halfDiag + 10,
      r + 8,
      brandW - r - 8
    );

    // floor + standing position, below the tagline and above the divider
    const floorY = clamp(tag.bottom + (bot.y - tag.bottom) * 0.5, tag.bottom + 24, bot.y - 14);
    const landCY = floorY - feetExt;

    // apex for the exit vault over the p
    const pTop = Math.min(p.inkTop, b.cy);
    const vaultY = pTop - 0.62 * D;
    // apex for the return jump: high enough to clear the whole wordmark
    const jumpY = Math.min(vaultY, b.inkTop - r - 0.12 * D);

    geo = {
      brandW,
      wm,
      tag,
      D,
      r,
      pxPerUnit,
      feetExt,
      a: { ...a, origin: `${gA.inkCx}px ${gA.inkCy}px` },
      b: { ...b, origin: `${gB.inkCx}px ${gB.inkCy}px`, pxPerUnit },
      p,
      pRect,
      oSlot: { x: b.cx, y: b.cy },
      corridorX,
      floorY,
      landCY,
      vaultY,
      jumpY,
    };

    // align rig overlays exactly over each glyph's ink box
    oEls.forEach((el, i) => {
      const g = i === 0 ? gA : gB;
      const rig = rigs[i];
      if (!rig) return;
      rig.style.left = `${g.inkCx}px`;
      rig.style.top = `${g.inkCy}px`;
      rig.style.width = `${rigSize}px`;
      rig.style.height = `${rigSize}px`;
    });

    floorLine.setAttribute('x1', corridorX - 0.9 * D);
    floorLine.setAttribute('x2', corridorX + 0.9 * D);
    floorLine.setAttribute('y1', floorY);
    floorLine.setAttribute('y2', floorY);
    floorLine.style.strokeWidth = `${clamp(b.fs * 0.018, 1, 1.6)}px`;
  }

  /* ------------------------------- state --------------------------------- */

  function makeState() {
    return {
      a: { x: 0, y: 0, rot: 0, sx: 1, sy: 1 },
      b: { x: 0, y: 0, rot: 0, sx: 1, sy: 1 },
      floor: { op: 0 },
      // independent continuous eye motion (per character)
      eye: {
        a: { px: 0, py: 0, blink: 1 },
        b: { px: 0, py: 0, blink: 1 },
      },
      // choreography gaze override for the acting character (w blends it in)
      cue: { px: 0, py: 0, w: 0 },
      limbs: {
        armOp: [0, 0],
        legOp: [0, 0],
        handOff: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
        footOff: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
      },
    };
  }

  /* ------------------------------- render -------------------------------- */

  function stageToRig(px, py) {
    const bst = s.b;
    const ox = geo.b.cx + bst.x;
    const oy = geo.b.cy + bst.y;
    const dx = px - ox;
    const dy = py - oy;
    const th = (bst.rot * Math.PI) / 180;
    const c = Math.cos(th);
    const sn = Math.sin(th);
    const ux = (c * dx + sn * dy) / bst.sx;
    const uy = (-sn * dx + c * dy) / bst.sy;
    return { x: 500 + ux / geo.b.pxPerUnit, y: 500 + uy / geo.b.pxPerUnit };
  }

  // The face is a permanent feature: it is never faded out. Only the pupils and
  // the eyelid (a vertical squish of the eye group) move.
  function renderFace(idx) {
    const face = faces[idx];
    if (!face) return;
    const e = idx === 0 ? s.eye.a : s.eye.b;
    let px = e.px;
    let py = e.py;
    if (idx === 1) {
      const c = s.cue;
      px = lerp(px, c.px, c.w);
      py = lerp(py, c.py, c.w);
    }
    face.style.opacity = '1';
    const eyes = eyeGroups[idx];
    const ps = pupils[idx];
    for (let i = 0; i < eyes.length; i++) {
      // svgOrigin is set once (setOrigins); only the scalars change here.
      gsap.set(eyes[i], { scaleX: 1, scaleY: e.blink });
      gsap.set(ps[i], { x: px * PUPIL_AMP.x, y: py * PUPIL_AMP.y });
    }
  }

  function renderLimbs() {
    const L = s.limbs;
    const cx = geo.b.cx + s.b.x;
    const cy = geo.b.cy + s.b.y;

    for (let i = 0; i < 2; i++) {
      hand[i].x = cx + L.handOff[i].x;
      hand[i].y = cy + L.handOff[i].y;
      foot[i].x = cx + L.footOff[i].x;
      foot[i].y = cy + L.footOff[i].y;
    }

    for (let i = 0; i < 2; i++) {
      if (!armEls[i]) continue;
      armEls[i].style.opacity = L.armOp[i];
      legEls[i].style.opacity = L.legOp[i];

      const hr = stageToRig(hand[i].x, hand[i].y);
      const fr = stageToRig(foot[i].x, foot[i].y);
      const armIK = solveIK(SHOULDER[i].x, SHOULDER[i].y, hr.x, hr.y, ARM.l1, ARM.l2, BEND.arm[i]);
      const legIK = solveIK(HIP[i].x, HIP[i].y, fr.x, fr.y, LEG.l1, LEG.l2, BEND.leg[i]);

      gsap.set(armU[i], { x: SHOULDER[i].x, y: SHOULDER[i].y, rotation: armIK.a1 });
      gsap.set(armF[i], { rotation: armIK.a2 });
      gsap.set(legU[i], { x: HIP[i].x, y: HIP[i].y, rotation: legIK.a1 });
      gsap.set(legF[i], { rotation: legIK.a2 });
    }
  }

  function render() {
    gsap.set(oEls[0], { x: s.a.x, y: s.a.y, rotation: s.a.rot, scaleX: s.a.sx, scaleY: s.a.sy });
    gsap.set(oEls[1], { x: s.b.x, y: s.b.y, rotation: s.b.rot, scaleX: s.b.sx, scaleY: s.b.sy });
    floorLine.style.opacity = s.floor.op;
    renderFace(0);
    renderFace(1);
    renderLimbs();
  }

  /** Set transform pivots once so the per-frame render stays allocation-free. */
  function setOrigins() {
    gsap.set(oEls[0], { transformOrigin: geo.a.origin });
    gsap.set(oEls[1], { transformOrigin: geo.b.origin });
    eyeGroups.forEach(eyes => {
      eyes.forEach((eye, i) => gsap.set(eye, { svgOrigin: `${EYE[i].ox} ${EYE[i].oy}` }));
    });
  }

  /* ------------------------- idle eye controller ------------------------- */

  /**
   * Independent, lightweight eye animation. A single repeating timeline drives
   * the pupils (varied, randomised gazes — using repeatRefresh so each loop is
   * different) and blinks. It only ever touches `s.eye.*`, so it can never
   * conflict with the main timeline (which touches `s.b`, `s.cue`, `s.limbs`).
   */
  function buildIdle() {
    const R = gsap.utils.random;
    const tl = gsap.timeline({
      repeat: -1,
      repeatRefresh: true,
      defaults: { ease: 'sine.inOut' },
    });

    const gaze = (which, t, dur, kind) => {
      const px = () => R(-0.85, 0.85);
      const py =
        kind === 'up'
          ? () => R(-0.78, -0.42)
          : kind === 'down'
            ? () => R(0.34, 0.62)
            : () => R(-0.6, 0.55);
      tl.to(s.eye[which], { px, py, duration: dur }, t);
    };

    // varied segment durations so the rhythm never feels metronomic
    const plan = [
      ['side', 1.3],
      ['side', 2.1],
      ['up', 0.9],
      ['down', 1.6],
      ['side', 2.6],
      ['up', 1.1],
      ['side', 2.2],
      ['down', 1.4],
      ['side', 2.9],
      ['up', 1.2],
    ];

    for (const which of ['a', 'b']) {
      const offset = which === 'b' ? 0.6 : 0;
      let t = offset;
      plan.forEach(([kind, dur], i) => {
        const k = kind === 'side' && i % 3 === 0 ? 'up' : kind;
        gaze(which, t, dur, k);
        t += dur;
      });
    }

    // occasional natural blinks, at irregular offsets, one character at a time
    const blinks = [1.2, 4.4, 7.1, 9.8, 12.6, 15.3, 18.0, 20.4];
    blinks.forEach((bt, i) => {
      const which = i % 2 ? 'a' : 'b';
      const dur = 0.26 + (i % 3) * 0.06;
      tl.to(s.eye[which], { blink: 0.12, duration: dur * 0.4, ease: 'power1.in' }, bt);
      tl.to(s.eye[which], { blink: 1, duration: dur * 0.6, ease: 'power1.out' }, bt + dur * 0.4);
    });

    return tl;
  }

  /* --------------------------- choreography ------------------------------ */

  function buildMaster() {
    const D = geo.D;
    const oSlot = geo.oSlot;
    const corridorX = geo.corridorX;
    const landCY = geo.landCY;
    const feetExt = geo.feetExt;
    const vaultY = geo.vaultY;
    const jumpY = geo.jumpY;

    const restCX = geo.b.cx;
    const restCY = geo.b.cy;
    const toX = v => v - restCX; // stage x -> body x offset
    const toY = v => v - restCY;

    const L = s.limbs;
    const at = (px, py) => ({ x: toX(px), y: toY(py) });

    const rest = clamp(CYCLE_REST_S, 5, 20);
    const tl = gsap.timeline({
      paused: true,
      repeat: -1,
      repeatDelay: rest,
      defaults: { ease: 'power2.inOut' },
    });

    /* ---------------- Scene A: wake-up in place ---------------------------- */

    tl.to(s.b, { sy: 0.9, sx: 1.08, y: 3, duration: 0.3, ease: 'power2.out' }, 0.5);
    tl.to(s.b, { sy: 1.06, sx: 0.96, y: -3, duration: 0.32 }, 0.8);
    tl.to(s.b, { sy: 1, sx: 1, y: 0, duration: 0.5, ease: 'back.out(1.4)' }, 1.12);

    /* ---------------- Scene B: detach, vault out, fall -------------------- */

    const tB = 1.35;
    tl.to(s.b, { sy: 0.8, sx: 1.14, y: 7, duration: 0.28, ease: 'power2.out' }, tB);
    tl.to(s.b, { sy: 1.12, sx: 0.92, ...at(oSlot.x, vaultY + 0.2 * D), duration: 0.34, ease: 'power2.out' }, tB + 0.28);
    tl.to(s.b, { ...at(lerp(oSlot.x, corridorX, 0.55), vaultY), rot: 12, duration: 0.34, ease: 'power1.out' }, tB + 0.62);
    tl.to(s.b, { ...at(corridorX, vaultY + 0.25 * D), rot: 18, duration: 0.3, ease: 'power1.in' }, tB + 0.96);
    tl.to(s.b, { ...at(corridorX, landCY), rot: 6, sy: 1.06, sx: 0.97, duration: 0.6, ease: 'power2.in' }, tB + 1.26);
    tl.to(s.floor, { op: 1, duration: 0.3 }, tB + 1.4);

    // impact squash + settle (net vertical offset stays zero so the body rests at landCY)
    const tI = tB + 1.86;
    const sq = 0.18 * D;
    const bounce = 0.12 * D;
    tl.to(s.b, { sy: 0.58, sx: 1.34, y: `+=${sq}`, rot: 8, duration: 0.12, ease: 'power3.out' }, tI);
    tl.to(s.b, { sy: 1.07, sx: 0.95, y: `-=${sq + bounce}`, rot: -4, duration: 0.26, ease: 'power2.out' }, tI + 0.14);
    tl.to(s.b, { sy: 1, sx: 1, y: `+=${bounce}`, rot: 0, duration: 0.5, ease: 'back.out(2.6)' }, tI + 0.4);

    /* ---------------- Scene C: limbs emerge ------------------------------- */

    const tC = tI + 1.25;
    tl.to(L.armOp, { 0: 1, duration: 0.4, ease: 'power1.out' }, tC + 0.05);
    tl.to(L.armOp, { 1: 1, duration: 0.4, ease: 'power1.out' }, tC + 0.17);
    tl.to(L.legOp, { 0: 1, duration: 0.4, ease: 'power1.out' }, tC + 0.37);
    tl.to(L.legOp, { 1: 1, duration: 0.4, ease: 'power1.out' }, tC + 0.47);
    tl.to(L.handOff[0], { x: -0.55 * D, y: 0.12 * D, duration: 0.5, ease: 'power2.out' }, tC + 0.3);
    tl.to(L.handOff[1], { x: 0.55 * D, y: 0.12 * D, duration: 0.5, ease: 'power2.out' }, tC + 0.36);
    tl.to(L.footOff[0], { x: -0.3 * D, y: feetExt, duration: 0.5, ease: 'power2.out' }, tC + 0.4);
    tl.to(L.footOff[1], { x: 0.3 * D, y: feetExt, duration: 0.5, ease: 'power2.out' }, tC + 0.46);
    tl.to(s.b, { x: `+=${0.1 * D}`, duration: 0.24, ease: 'power2.out' }, tC + 0.85);
    tl.to(s.b, { x: `-=${0.1 * D}`, duration: 0.3, ease: 'power2.inOut' }, tC + 1.09);

    /* ---------------- Scene D: look around + look up ---------------------- */

    const tD = tC + 1.5;
    tl.to(s.cue, { w: 1, duration: 0.3, ease: 'power1.out' }, tD);
    tl.to(s.cue, { px: 0.9, py: 0.15, duration: 0.5, ease: 'sine.inOut' }, tD + 0.1);
    tl.to(s.b, { rot: 3, duration: 0.5, ease: 'sine.inOut' }, tD + 0.1);
    tl.to(s.cue, { px: -0.95, py: 0.1, duration: 0.6, ease: 'sine.inOut' }, tD + 0.72);
    tl.to(s.b, { rot: -3, duration: 0.6, ease: 'sine.inOut' }, tD + 0.72);
    tl.to(s.cue, { px: 0.08, py: -1, duration: 0.55, ease: 'sine.inOut' }, tD + 1.42);
    tl.to(s.b, { rot: -1, duration: 0.55, ease: 'sine.inOut' }, tD + 1.42);

    /* ---------------- Scene E: crouch + jump + one flip ------------------- */

    const tJ = tD + 2.15;
    // crouch
    tl.to(s.b, { sy: 0.82, sx: 1.16, duration: 0.22, ease: 'power2.out' }, tJ);
    tl.to(L.footOff[0], { y: feetExt * 1.05, duration: 0.2, ease: 'power2.out' }, tJ);
    tl.to(L.footOff[1], { y: feetExt * 1.05, duration: 0.2, ease: 'power2.out' }, tJ);
    tl.to(L.handOff[0], { x: -0.32 * D, y: 0.34 * D, duration: 0.22, ease: 'power2.out' }, tJ);
    tl.to(L.handOff[1], { x: 0.32 * D, y: 0.34 * D, duration: 0.22, ease: 'power2.out' }, tJ);

    // launch: rise straight up, spinning begins
    const tLp = tJ + 0.22;
    tl.to(s.b, { sy: 1.14, sx: 0.9, ...at(corridorX, jumpY), rot: 130, duration: 0.55, ease: 'power2.out' }, tLp);
    tl.to(L.handOff[0], { x: -0.14 * D, y: -0.7 * D, duration: 0.5, ease: 'power2.out' }, tLp);
    tl.to(L.handOff[1], { x: 0.2 * D, y: -0.74 * D, duration: 0.5, ease: 'power2.out' }, tLp);
    tl.to(L.footOff[0], { x: -0.12 * D, y: 0.56 * D, duration: 0.45, ease: 'power2.out' }, tLp + 0.05);
    tl.to(L.footOff[1], { x: 0.14 * D, y: 0.6 * D, duration: 0.45, ease: 'power2.out' }, tLp + 0.05);

    // glide across (staying above the whole wordmark) toward the slot
    const tTr = tLp + 0.55;
    tl.to(s.b, { ...at(oSlot.x, jumpY), rot: 250, duration: 0.62, ease: 'sine.inOut' }, tTr);

    // descend straight into the slot
    const tDe = tTr + 0.62;
    tl.to(s.b, { ...at(oSlot.x, oSlot.y), rot: 360, sy: 1.04, sx: 0.98, duration: 0.5, ease: 'power2.in' }, tDe);
    tl.to(L.footOff[0], { x: -0.26 * D, y: feetExt, duration: 0.4, ease: 'power2.out' }, tDe + 0.1);
    tl.to(L.footOff[1], { x: 0.26 * D, y: feetExt, duration: 0.4, ease: 'power2.out' }, tDe + 0.12);
    tl.to(L.handOff[0], { x: -0.5 * D, y: 0.1 * D, duration: 0.4, ease: 'power2.out' }, tDe + 0.15);
    tl.to(L.handOff[1], { x: 0.5 * D, y: 0.1 * D, duration: 0.4, ease: 'power2.out' }, tDe + 0.18);

    // land squash in the slot; cue blends back out so idle gaze resumes
    const tLs = tDe + 0.5;
    tl.to(s.b, { sy: 0.86, sx: 1.12, y: `+=${0.06 * D}`, rot: 360, duration: 0.12, ease: 'power2.out' }, tLs);
    tl.to(s.b, { sy: 1, sx: 1, y: `-=${0.06 * D}`, rot: 360, duration: 0.45, ease: 'back.out(2.8)' }, tLs + 0.12);
    tl.set(s.b, { rot: 0 }, tLs + 0.6); // 360 == 0; normalise without spinning back
    tl.to(s.cue, { w: 0, duration: 0.45, ease: 'power1.inOut' }, tLs + 0.25);

    /* ---------------- Scene F: settle + retract --------------------------- */

    const tF = tLs + 0.65;
    tl.to(s.floor, { op: 0, duration: 0.4, ease: 'power1.inOut' }, tF);
    tl.to(L.handOff[0], { x: 0, y: 0, duration: 0.4, ease: 'power2.inOut' }, tF + 0.1);
    tl.to(L.handOff[1], { x: 0, y: 0, duration: 0.4, ease: 'power2.inOut' }, tF + 0.15);
    tl.to(L.footOff[0], { x: 0, y: 0.1 * D, duration: 0.4, ease: 'power2.inOut' }, tF + 0.15);
    tl.to(L.footOff[1], { x: 0, y: 0.1 * D, duration: 0.4, ease: 'power2.inOut' }, tF + 0.2);
    tl.to(L.armOp, { 0: 0, duration: 0.35, ease: 'power1.in' }, tF + 0.35);
    tl.to(L.armOp, { 1: 0, duration: 0.35, ease: 'power1.in' }, tF + 0.4);
    tl.to(L.legOp, { 0: 0, duration: 0.35, ease: 'power1.in' }, tF + 0.45);
    tl.to(L.legOp, { 1: 0, duration: 0.35, ease: 'power1.in' }, tF + 0.5);

    // guarantee the exact resting state (no drift, exact slot position)
    tl.to(s.b, { x: 0, y: 0, rot: 0, sx: 1, sy: 1, duration: 0.35, ease: 'power1.out' }, tF + 0.75);

    return tl;
  }

  /* ------------------------------ lifecycle ------------------------------- */

  function teardownInternal() {
    active = false;
    if (tickerFn) {
      gsap.ticker.remove(tickerFn);
      tickerFn = null;
    }
    if (mm) {
      mm.revert();
      mm = null;
    }
    if (master) {
      master.kill();
      master = null;
    }
    if (idle) {
      idle.kill();
      idle = null;
    }
    if (st) {
      st.kill();
      st = null;
    }
  }

  function resetDom() {
    gsap.set(oEls, { clearProps: 'transform' });
    // faces stay visible; only limbs are hidden at rest
    faces.forEach(f => {
      if (f) f.style.opacity = '1';
    });
    armEls.concat(legEls).forEach(l => {
      l.style.opacity = '0';
    });
    eyeGroups.forEach(eyes => eyes.forEach(eye => gsap.set(eye, { clearProps: 'transform' })));
    pupils.forEach(ps => ps.forEach(p => p && gsap.set(p, { clearProps: 'transform' })));
    floorLine.style.opacity = '0';
  }

  function build() {
    if (disposed) return;
    teardownInternal();
    resetDom();
    measure();
    s = makeState();
    setOrigins();
    render();

    mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      idle = buildIdle();
      master = buildMaster();

      // A single ticker drives the DOM once per frame, in sync with GSAP's
      // own update — no matter how many timelines are playing.
      tickerFn = () => {
        if (active) render();
      };
      gsap.ticker.add(tickerFn);

      st = ScrollTrigger.create({
        trigger: brand,
        start: 'top 92%',
        end: 'bottom top',
        onToggle: self => {
          active = self.isActive;
          if (self.isActive) {
            master.play();
            idle.play();
          } else {
            master.pause();
            idle.pause();
          }
        },
      });
      active = st.isActive;
      if (st.isActive) {
        master.play();
        idle.play();
      }

      return () => {
        active = false;
        if (tickerFn) {
          gsap.ticker.remove(tickerFn);
          tickerFn = null;
        }
        if (st) {
          st.kill();
          st = null;
        }
        if (master) {
          master.kill();
          master = null;
        }
        if (idle) {
          idle.kill();
          idle = null;
        }
      };
    });
  }

  build();

  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (disposed || document.hidden) return;
      build();
      ScrollTrigger.refresh();
    }, 220);
  };
  window.addEventListener('resize', onResize);

  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => {
      if (!roPrimed) {
        roPrimed = true;
        return;
      }
      onResize();
    });
    ro.observe(brand);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (disposed) return;
      build();
      ScrollTrigger.refresh();
    });
  }

  return () => {
    disposed = true;
    clearTimeout(resizeTimer);
    window.removeEventListener('resize', onResize);
    if (ro) ro.disconnect();
    teardownInternal();
    resetDom();
  };
}
