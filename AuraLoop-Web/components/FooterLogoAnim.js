/**
 * Footer wordmark O-character animation.
 *
 * A scroll-triggered GSAP/ScrollTrigger choreography that lives entirely inside
 * the existing footer wordmark. The two lowercase "o" glyphs wake up; the right
 * "o" leaps out of the wordmark (vaulting over the "p"), falls into the clear
 * corridor to the right of the tagline, grows arms and legs, spins a rope above
 * its head like a whip and throws it upward — the rope's top end shoots to the
 * top of the stage and anchors there. The character then grabs the rope, climbs
 * it hand-over-hand, and at the top vaults back over the "p" to land precisely in
 * its original typographic slot, settling perfectly into place.
 *
 * Everything is driven by a single plain-object proxy rendered on every timeline
 * update, so playback/reversal is fully deterministic and nothing can desync.
 * All coordinates are measured at runtime from the rendered wordmark (no hard-
 * coded viewport assumptions) and re-measured on resize / font load.
 *
 * Layout constraints handled by construction:
 *  - the tagline text run and the "p" glyph are keep-out regions; the climb and
 *    the play corridor live to the right of the tagline, and the exit/return
 *    vault over the "p" while staying above it,
 *  - the footer divider bounds the "floor",
 *  - the character never rests on top of another glyph.
 */

import { gsap, ScrollTrigger, prefersReducedMotion } from '../../shared/gsap.js';

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
const ROPE_N = 30; // points sampled along the rope each frame

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

/** Resample a polyline to N points evenly spaced by arc length. */
function resample(points, N) {
  if (points.length === 1) return Array.from({ length: N }, () => ({ ...points[0] }));
  const segs = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const d = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
    segs.push(d);
    total += d;
  }
  const out = [];
  for (let k = 0; k < N; k++) {
    const target = total === 0 ? 0 : (k / (N - 1)) * total;
    let acc = 0;
    for (let i = 0; i < segs.length; i++) {
      if (acc + segs[i] >= target || i === segs.length - 1) {
        const t = segs[i] > 0 ? clamp((target - acc) / segs[i], 0, 1) : 0;
        out.push({ x: lerp(points[i].x, points[i + 1].x, t), y: lerp(points[i].y, points[i + 1].y, t) });
        break;
      }
      acc += segs[i];
    }
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* init                                                                       */
/* -------------------------------------------------------------------------- */

export function initFooterLogoAnimation(footer) {
  if (!footer || prefersReducedMotion()) return () => {};

  const brand = footer.querySelector('.ta-footer__brand');
  const wordmark = brand && brand.querySelector('.ta-wordmark');
  const oEls = brand ? Array.from(brand.querySelectorAll('.ta-o')) : [];
  const pEl = brand && brand.querySelector('.ta-p');
  const tagline = brand && brand.querySelector('p');
  const ropePath = brand && brand.querySelector('.ta-rope');
  const floorLine = brand && brand.querySelector('.ta-floor');
  const footerBottom = footer.querySelector('.ta-footer__bottom');
  if (!brand || !wordmark || !pEl || !tagline || !ropePath || !floorLine || oEls.length !== 2) {
    return () => {};
  }

  const rigs = oEls.map(el => el.querySelector('.ta-o__rig'));

  let tl = null;
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
    const whipR = 1.15 * D;

    // climb / play corridor: right of BOTH the tagline and the p, with room for the whip loop
    const corridorX = clamp(
      Math.max(tag.right + whipR + 12, pRect.right + whipR + 16),
      r + 8,
      brandW - r - 8
    );

    // rope anchor: top of the designated area (the stage), directly over the corridor
    const attachY = 6;
    const attach = { x: corridorX, y: attachY };

    // floor + standing position, below the tagline and above the divider
    const floorY = clamp(tag.bottom + (bot.y - tag.bottom) * 0.5, tag.bottom + 24, bot.y - 14);
    const landCY = floorY - feetExt;

    // where the climb ends: high enough that the top hand reaches the anchor
    const climbEndCY = attachY + 0.95 * D;

    // keep-out band: the tagline text run (inflated a little)
    const keep = { x0: -1e4, x1: tag.right + 8, y0: tag.y - 6, y1: tag.bottom + 6 };

    geo = {
      brandW,
      wm,
      tag,
      keep,
      D,
      r,
      pxPerUnit,
      feetExt,
      whipR,
      a: { ...a, origin: `${gA.inkCx}px ${gA.inkCy}px` },
      b: { ...b, origin: `${gB.inkCx}px ${gB.inkCy}px`, pxPerUnit },
      p,
      pRect,
      pInkTop: p.inkTop,
      oSlot: { x: b.cx, y: b.cy },
      corridorX,
      attach,
      attachY,
      floorY,
      landCY,
      climbEndCY,
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

    ropePath.style.strokeWidth = `${clamp(b.fs * 0.05, 2, 5)}px`;
    floorLine.setAttribute('x1', corridorX - 0.9 * D);
    floorLine.setAttribute('x2', corridorX + 0.9 * D);
    floorLine.setAttribute('y1', floorY);
    floorLine.setAttribute('y2', floorY);
    floorLine.style.strokeWidth = `${clamp(b.fs * 0.018, 1, 1.6)}px`;
  }

  /* ------------------------------- state --------------------------------- */

  function makeState() {
    return {
      a: { x: 0, y: 0, rot: 0, sx: 1, sy: 1, face: 0, blink: 1, eyeW: 1, px: 0, py: 0 },
      b: { x: 0, y: 0, rot: 0, sx: 1, sy: 1, face: 0, blink: 1, eyeW: 1, px: 0, py: 0 },
      floor: { op: 0 },
      rope: {
        op: 0,
        whip: 0, // 0 = rope not spinning, 1 = fully spinning overhead
        spin: 0, // accumulated spin angle (radians)
        throw: 0, // 0 = hand-held, 1 = anchored at the top
        swing: 0,
        tailLen: 0.4 * geo.D,
        grip: [0, 0], // how firmly each hand holds the rope (for rope routing)
      },
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
    const st = s.b;
    const ox = geo.b.cx + st.x;
    const oy = geo.b.cy + st.y;
    const dx = px - ox;
    const dy = py - oy;
    const th = (st.rot * Math.PI) / 180;
    const c = Math.cos(th);
    const sn = Math.sin(th);
    const ux = (c * dx + sn * dy) / st.sx;
    const uy = (-sn * dx + c * dy) / st.sy;
    return { x: 500 + ux / geo.b.pxPerUnit, y: 500 + uy / geo.b.pxPerUnit };
  }

  function renderFace(idx) {
    const st = idx === 0 ? s.a : s.b;
    const rig = rigs[idx];
    if (!rig) return;
    rig.querySelector('.ta-rig-face').style.opacity = st.face;
    const eyes = rig.querySelectorAll('.ta-rig-eye');
    eyes.forEach((eye, i) => {
      gsap.set(eye, {
        scaleX: st.eyeW,
        scaleY: st.eyeW * st.blink,
        svgOrigin: `${EYE[i].ox} ${EYE[i].oy}`,
      });
      gsap.set(eye.querySelector('.ta-rig-pupil'), {
        x: st.px * PUPIL_AMP.x,
        y: st.py * PUPIL_AMP.y,
      });
    });
  }

  function renderLimbs() {
    const rig = rigs[1];
    if (!rig) return;
    const L = s.limbs;
    const cx = geo.b.cx + s.b.x;
    const cy = geo.b.cy + s.b.y;

    for (let i = 0; i < 2; i++) {
      hand[i].x = cx + L.handOff[i].x;
      hand[i].y = cy + L.handOff[i].y;
      foot[i].x = cx + L.footOff[i].x;
      foot[i].y = cy + L.footOff[i].y;
    }

    const limbs = rig.querySelectorAll('.ta-rig-limb');
    for (let i = 0; i < 2; i++) {
      const arm = limbs[i];
      const leg = limbs[i + 2];
      arm.style.opacity = L.armOp[i];
      leg.style.opacity = L.legOp[i];

      const hr = stageToRig(hand[i].x, hand[i].y);
      const fr = stageToRig(foot[i].x, foot[i].y);
      const armIK = solveIK(SHOULDER[i].x, SHOULDER[i].y, hr.x, hr.y, ARM.l1, ARM.l2, BEND.arm[i]);
      const legIK = solveIK(HIP[i].x, HIP[i].y, fr.x, fr.y, LEG.l1, LEG.l2, BEND.leg[i]);

      gsap.set(arm.querySelector('.ta-rig-limb-u'), {
        x: SHOULDER[i].x,
        y: SHOULDER[i].y,
        rotation: armIK.a1,
      });
      gsap.set(arm.querySelector('.ta-rig-limb-f'), { rotation: armIK.a2 });
      gsap.set(leg.querySelector('.ta-rig-limb-u'), {
        x: HIP[i].x,
        y: HIP[i].y,
        rotation: legIK.a1,
      });
      gsap.set(leg.querySelector('.ta-rig-limb-f'), { rotation: legIK.a2 });
    }
  }

  /**
   * Rope model.
   *
   *  - whip:  a spinning loop held in the character's hand (a rotating arc),
   *  - throw: that loop morphs into a straight line that races up to the anchor
   *           and hangs down to the free end,
   *  - hang:  a straight line from the anchor through the gripping hands to a
   *           dangling tail below the lowest grip,
   *  - release: the anchor holds while the free end recoils, then it fades.
   */
  function computeRopePoints() {
    const R = s.rope;
    const A = geo.attach;

    // anchor end
    const anchored = R.throw;
    const topX = lerp(hand[1].x, A.x, anchored);
    const topY = lerp(hand[1].y, A.y, anchored);

    // gripping hands (highest first)
    const grips = [];
    for (let i = 0; i < 2; i++) {
      if (R.grip[i] > 0.5) grips.push({ x: hand[i].x, y: hand[i].y });
    }
    grips.sort((p, q) => p.y - q.y);

    // bottom / free end
    const lowest = grips.length ? grips[grips.length - 1] : { x: topX, y: topY };
    const endX = lowest.x + R.swing;
    const endY = lowest.y + R.tailLen;

    const hang = resample([{ x: topX, y: topY }, ...grips, { x: endX, y: endY }], ROPE_N);

    // spinning loop held in the right hand
    const wr = geo.whipR;
    const h = hand[1];
    const cx = h.x;
    const cy = h.y - wr * 0.3;
    const arcSpan = Math.PI * 1.75;
    const M = 18;
    const loop = [];
    for (let i = 0; i < M; i++) {
      const ang = R.spin - arcSpan * (i / (M - 1));
      loop.push({ x: cx + wr * Math.cos(ang), y: cy + wr * Math.sin(ang) * 0.72 });
    }
    const spin = resample([{ x: h.x, y: h.y }, ...loop], ROPE_N);

    if (anchored <= 0.001) return R.whip > 0.001 ? spin : hang;
    if (anchored >= 0.999) return hang;

    // blend the spinning loop into the hanging rope as the throw travels up
    const t = anchored;
    const pts = [];
    for (let i = 0; i < ROPE_N; i++) {
      pts.push({ x: lerp(spin[i].x, hang[i].x, t), y: lerp(spin[i].y, hang[i].y, t) });
    }
    return pts;
  }

  function renderRope() {
    const R = s.rope;
    ropePath.style.opacity = R.op;
    const pts = computeRopePoints();
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
    ropePath.setAttribute('d', d);
  }

  function render() {
    gsap.set(oEls[0], {
      x: s.a.x,
      y: s.a.y,
      rotation: s.a.rot,
      scaleX: s.a.sx,
      scaleY: s.a.sy,
      transformOrigin: geo.a.origin,
    });
    gsap.set(oEls[1], {
      x: s.b.x,
      y: s.b.y,
      rotation: s.b.rot,
      scaleX: s.b.sx,
      scaleY: s.b.sy,
      transformOrigin: geo.b.origin,
    });
    floorLine.style.opacity = s.floor.op;
    renderFace(0);
    renderFace(1);
    renderLimbs();
    renderRope();
  }

  /* --------------------------- choreography ------------------------------ */

  function buildTimeline() {
    const D = geo.D;
    const A = geo.attach;
    const oSlot = geo.oSlot;
    const corridorX = geo.corridorX;
    const landCY = geo.landCY;
    const climbEndCY = geo.climbEndCY;
    const floorY = geo.floorY;
    const feetExt = geo.feetExt;
    const pTop = Math.min(geo.pInkTop, oSlot.y);

    const restCX = geo.b.cx;
    const restCY = geo.b.cy;
    const toX = v => v - restCX; // stage x -> body x offset
    const toY = v => v - restCY;

    const L = s.limbs;

    // body position helper: move the body to a stage coordinate
    const at = (px, py) => ({ x: toX(px), y: toY(py) });

    // vault apex above the p so the body clears its ink
    const apexY = pTop - 0.62 * D;

    const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' }, onUpdate: render });

    const blink = (target, t, dur = 0.36) => {
      tl.to(target, { blink: 0.04, duration: dur * 0.3, ease: 'power1.in' }, t);
      tl.to(target, { blink: 1, duration: dur * 0.7, ease: 'power1.out' }, t + dur * 0.3);
    };

    /* ---------------- Scene A: wake-up ------------------------------------ */

    tl.to(s.a, { sy: 0.93, sx: 1.05, y: 2, duration: 0.3, ease: 'power2.out' }, 0);
    tl.to(s.b, { sy: 0.93, sx: 1.05, y: 2, duration: 0.3, ease: 'power2.out' }, 0.06);
    tl.to(s.a, { sy: 1.07, sx: 0.96, y: -4, duration: 0.34 }, 0.34);
    tl.to(s.b, { sy: 1.07, sx: 0.96, y: -4, duration: 0.34 }, 0.42);
    tl.to(s.a, { sy: 1, sx: 1, y: 0, duration: 0.5, ease: 'back.out(1.8)' }, 0.7);
    tl.to(s.b, { sy: 1, sx: 1, y: 0, duration: 0.5, ease: 'back.out(1.8)' }, 0.78);

    tl.to(s.a, { face: 1, duration: 0.55, ease: 'power1.out' }, 0.62);
    tl.to(s.b, { face: 1, duration: 0.55, ease: 'power1.out' }, 0.74);

    blink(s.a, 1.25);
    blink(s.b, 1.5, 0.4);

    tl.to(s.a, { px: 0.7, py: -0.35, duration: 0.3, ease: 'power2.out' }, 1.9);
    tl.to(s.a, { px: -0.2, py: 0.3, duration: 0.28, ease: 'power1.inOut' }, 2.2);
    tl.to(s.b, { px: -0.6, py: 0.2, duration: 0.3, ease: 'power2.out' }, 2.0);
    tl.to(s.b, { px: 0.1, py: -0.2, duration: 0.25, ease: 'power1.inOut' }, 2.3);
    blink(s.b, 2.7, 0.3);

    tl.to(s.a, { px: 0.95, py: 0.1, duration: 0.32, ease: 'power2.out' }, 3.05);
    tl.to(s.b, { px: -0.95, py: 0.1, duration: 0.32, ease: 'power2.out' }, 3.19);
    blink(s.a, 3.6, 0.3);

    /* ---------------- Scene B: detach, vault out, fall -------------------- */

    const tB = 3.9;
    // anticipation squash
    tl.to(s.b, { sy: 0.8, sx: 1.14, y: 7, duration: 0.28, ease: 'power2.out' }, tB);
    tl.to(s.a, { px: 0.5, py: -0.4, eyeW: 1.12, duration: 0.3, ease: 'power1.out' }, tB + 0.04);
    // rise straight up out of the slot
    tl.to(s.b, { sy: 1.12, sx: 0.92, ...at(oSlot.x, apexY + 0.2 * D), duration: 0.34, ease: 'power2.out' }, tB + 0.28);
    tl.to(s.b, { eyeW: 1.28, duration: 0.2 }, tB + 0.3);
    // vault right over the p
    tl.to(s.b, { ...at(lerp(oSlot.x, corridorX, 0.55), apexY), rot: 12, duration: 0.34, ease: 'power1.out' }, tB + 0.62);
    tl.to(s.b, { ...at(corridorX, apexY + 0.25 * D), rot: 18, duration: 0.3, ease: 'power1.in' }, tB + 0.96);
    // gravity: fall into the corridor
    tl.to(s.b, { ...at(corridorX, landCY), rot: 6, sy: 1.06, sx: 0.97, duration: 0.6, ease: 'power2.in' }, tB + 1.26);
    tl.to(s.floor, { op: 1, duration: 0.3 }, tB + 1.4);
    tl.to(s.b, { eyeW: 1.05, duration: 0.1 }, tB + 1.76);

    // impact squash + settle (net vertical offset stays zero so the body rests at landCY)
    const tI = tB + 1.86;
    const sq = 0.18 * D;
    const bounce = 0.12 * D;
    tl.to(s.b, { sy: 0.58, sx: 1.34, y: `+=${sq}`, rot: 8, duration: 0.12, ease: 'power3.out' }, tI);
    tl.to(s.b, { eyeW: 1.2, duration: 0.08 }, tI);
    blink(s.b, tI, 0.26);
    blink(s.a, tI + 0.06, 0.3);
    tl.to(s.b, { eyeW: 1, duration: 0.3 }, tI + 0.2);
    tl.to(s.b, { sy: 1.07, sx: 0.95, y: `-=${sq + bounce}`, rot: -4, duration: 0.26, ease: 'power2.out' }, tI + 0.14);
    tl.to(s.b, { sy: 1, sx: 1, y: `+=${bounce}`, rot: 0, duration: 0.5, ease: 'back.out(2.6)' }, tI + 0.4);
    tl.to(s.a, { px: 0.3, py: 0.15, eyeW: 1, duration: 0.5, ease: 'power1.inOut' }, tI + 0.5);

    /* ---------------- Scene C: limbs emerge ------------------------------- */

    const tC = tI + 1.25;
    // arms
    tl.to(L.armOp, { 0: 1, duration: 0.4, ease: 'power1.out' }, tC + 0.05);
    tl.to(L.armOp, { 1: 1, duration: 0.4, ease: 'power1.out' }, tC + 0.17);
    // legs plant
    tl.to(L.legOp, { 0: 1, duration: 0.4, ease: 'power1.out' }, tC + 0.37);
    tl.to(L.legOp, { 1: 1, duration: 0.4, ease: 'power1.out' }, tC + 0.47);
    // stand taller as the feet take weight; arms come to the sides
    tl.to(L.handOff[0], { x: -0.55 * D, y: 0.12 * D, duration: 0.5, ease: 'power2.out' }, tC + 0.3);
    tl.to(L.handOff[1], { x: 0.55 * D, y: 0.12 * D, duration: 0.5, ease: 'power2.out' }, tC + 0.36);
    tl.to(L.footOff[0], { x: -0.3 * D, y: feetExt, duration: 0.5, ease: 'power2.out' }, tC + 0.4);
    tl.to(L.footOff[1], { x: 0.3 * D, y: feetExt, duration: 0.5, ease: 'power2.out' }, tC + 0.46);
    // little weight shift
    tl.to(s.b, { x: `+=${0.12 * D}`, duration: 0.24, ease: 'power2.out' }, tC + 0.85);
    tl.to(s.b, { x: `-=${0.12 * D}`, duration: 0.3, ease: 'power2.inOut' }, tC + 1.09);
    blink(s.b, tC + 1.3);

    // look up, notice the space above, ready the rope
    const tL = tC + 1.5;
    tl.to(s.b, { px: 0.4, py: -0.9, eyeW: 1.14, duration: 0.36, ease: 'power2.out' }, tL);
    tl.to(s.b, { rot: -3, duration: 0.4, ease: 'power1.inOut' }, tL + 0.1);
    blink(s.a, tL + 0.5);

    /* ---------------- Scene D: whip + throw ------------------------------- */

    const tD = tL + 0.9;
    // reach both hands overhead to ready the rope
    tl.to(L.handOff[0], { x: -0.16 * D, y: -0.86 * D, duration: 0.42, ease: 'power2.out' }, tD);
    tl.to(L.handOff[1], { x: 0.16 * D, y: -0.9 * D, duration: 0.42, ease: 'power2.out' }, tD + 0.06);
    tl.to(s.b, { sy: 1.05, duration: 0.3, ease: 'power2.out' }, tD);
    // rope appears in hand and begins to spin, accelerating
    tl.to(s.rope, { op: 1, whip: 1, duration: 0.3, ease: 'power1.out' }, tD + 0.3);
    tl.to(s.rope, { tailLen: 0.28 * D, duration: 0.3 }, tD + 0.3);
    tl.to(s.rope, { spin: Math.PI * 15, duration: 2.4, ease: 'power2.in' }, tD + 0.3);
    // a little crouch and stretch as it winds up
    tl.to(s.b, { sy: 0.94, duration: 0.5, ease: 'power2.inOut' }, tD + 0.6);
    tl.to(s.b, { sy: 1.02, duration: 0.5, ease: 'power2.inOut' }, tD + 1.1);
    tl.to(s.b, { sy: 0.96, duration: 0.4, ease: 'power2.inOut' }, tD + 1.6);
    blink(s.b, tD + 1.2, 0.3);

    // the throw: launch the rope upward, it races to the anchor and hangs
    const tT = tD + 2.75;
    tl.to(s.b, { sy: 1.1, sx: 0.94, duration: 0.18, ease: 'power2.out' }, tT);
    tl.to(L.handOff[1], { x: 0.05 * D, y: -1.02 * D, duration: 0.3, ease: 'power2.out' }, tT);
    tl.to(s.rope, { throw: 1, duration: 0.42, ease: 'power2.out' }, tT + 0.04);
    tl.to(s.rope, { whip: 0, duration: 0.4, ease: 'power1.inOut' }, tT + 0.06);
    tl.to(s.b, { sy: 1, sx: 1, duration: 0.3, ease: 'power2.inOut' }, tT + 0.2);
    // rope settles into a hanging line with a light sway and a dangling tail
    tl.to(s.rope, { tailLen: 0.55 * D, duration: 0.5, ease: 'power2.out' }, tT + 0.4);
    tl.to(s.rope, { swing: 0.06 * D, duration: 0.4, ease: 'sine.inOut' }, tT + 0.5);
    tl.to(s.rope, { swing: -0.04 * D, duration: 0.6, ease: 'sine.inOut' }, tT + 0.9);
    tl.to(s.b, { px: -0.3, py: -0.85, duration: 0.4, ease: 'power2.out' }, tT + 0.3);
    blink(s.a, tT + 0.6, 0.3);

    /* ---------------- Scene E: grab + climb ------------------------------- */

    const tG = tT + 1.55;
    // reach up and take hold
    tl.to(L.handOff[1], { x: 0.02 * D, y: -0.92 * D, duration: 0.3, ease: 'power2.out' }, tG);
    tl.to(s.rope.grip, { 1: 1, duration: 0.25, ease: 'power2.out' }, tG + 0.1);
    // weight shifts onto the rope; feet leave the floor
    tl.to(s.b, { y: `-=${0.24 * D}`, duration: 0.5, ease: 'power2.inOut' }, tG + 0.3);
    tl.to(L.footOff[0], { x: -0.18 * D, y: 0.5 * D, duration: 0.4, ease: 'power2.out' }, tG + 0.35);
    tl.to(L.footOff[1], { x: 0.16 * D, y: 0.58 * D, duration: 0.4, ease: 'power2.out' }, tG + 0.42);
    tl.to(L.handOff[0], { x: -0.02 * D, y: -0.5 * D, duration: 0.4, ease: 'power2.out' }, tG + 0.4);
    tl.to(s.rope.grip, { 0: 1, duration: 0.25, ease: 'power2.out' }, tG + 0.5);
    tl.to(s.rope, { tailLen: 0.5 * D, duration: 0.5 }, tG + 0.4);

    // hand-over-hand climb: body rises, hands alternate reaching up the rope
    const climbDist = landCY - 0.24 * D - climbEndCY;
    const cycles = clamp(Math.round(climbDist / (0.55 * D)), 2, 5);
    const stepY = climbDist / cycles;
    let cy = landCY - 0.24 * D;
    let t = tG + 0.95;

    for (let i = 0; i < cycles; i++) {
      const lead = i % 2;
      const stay = 1 - lead;
      const nextY = cy - stepY;
      // lead hand releases and reaches higher
      tl.to(s.rope.grip, { [lead]: 0, duration: 0.1, ease: 'power1.in' }, t);
      tl.to(L.handOff[lead], { x: (lead === 0 ? -0.02 : 0.02) * D, y: -1.0 * D, duration: 0.24, ease: 'power1.inOut' }, t + 0.08);
      tl.to(s.rope.grip, { [lead]: 1, duration: 0.14, ease: 'power2.out' }, t + 0.32);
      // pull: body rises toward the new grip
      tl.to(s.b, { y: `-=${stepY}`, duration: 0.42, ease: 'power2.inOut' }, t + 0.4);
      tl.to(s.b, { rot: lead === 0 ? 4 : -4, duration: 0.36, ease: 'power1.inOut' }, t + 0.4);
      // stay hand slides up to follow
      tl.to(L.handOff[stay], { x: (stay === 0 ? -0.02 : 0.02) * D, y: -0.66 * D, duration: 0.4, ease: 'power2.inOut' }, t + 0.5);
      // legs brace and trail against the rope
      tl.to(L.footOff[0], { x: -0.16 * D, y: 0.52 * D, duration: 0.3, ease: 'power1.inOut' }, t + 0.34);
      tl.to(L.footOff[1], { x: 0.14 * D, y: 0.6 * D, duration: 0.3, ease: 'power1.inOut' }, t + 0.4);
      tl.to(s.rope, { swing: (i % 2 ? 1 : -1) * 0.03 * D, duration: 0.4, ease: 'sine.inOut' }, t + 0.4);
      if (i === Math.floor(cycles / 2)) blink(s.b, t + 0.7, 0.3);
      cy = nextY;
      t += 1.0;
    }

    // settle near the top, hanging just below the anchor
    const tTop = t;
    tl.to(s.b, { rot: 0, duration: 0.3, ease: 'power1.inOut' }, tTop);
    tl.to(s.b, { px: -0.5, py: -0.7, duration: 0.35 }, tTop);
    blink(s.b, tTop + 0.25, 0.32);

    /* ---------------- Scene F: vault back into the slot ------------------- */

    const tV = tTop + 0.7;
    // crouch on the rope, then release and vault up over the p
    tl.to(s.rope.grip, { 1: 0, duration: 0.14, ease: 'power1.in' }, tV);
    tl.to(s.rope.grip, { 0: 0, duration: 0.16, ease: 'power1.in' }, tV + 0.08);
    tl.to(s.b, { sy: 0.86, sx: 1.1, duration: 0.16, ease: 'power2.out' }, tV);
    // up and over toward the slot
    tl.to(s.b, { sy: 1.12, sx: 0.93, ...at(lerp(corridorX, oSlot.x, 0.55), apexY), rot: -10, duration: 0.42, ease: 'power2.out' }, tV + 0.16);
    tl.to(s.b, { ...at(oSlot.x, apexY + 0.15 * D), rot: -6, duration: 0.32, ease: 'power1.inOut' }, tV + 0.58);
    // limbs trail during the flight
    tl.to(L.handOff[0], { x: -0.85 * D, y: -0.35 * D, duration: 0.4, ease: 'power2.out' }, tV + 0.2);
    tl.to(L.handOff[1], { x: 0.8 * D, y: -0.42 * D, duration: 0.4, ease: 'power2.out' }, tV + 0.24);
    tl.to(L.footOff[0], { x: -0.42 * D, y: 0.4 * D, duration: 0.4, ease: 'power2.out' }, tV + 0.22);
    tl.to(L.footOff[1], { x: 0.46 * D, y: 0.36 * D, duration: 0.4, ease: 'power2.out' }, tV + 0.26);
    // rope recoils upward and fades once released
    tl.to(s.rope, { tailLen: 0.35 * D, swing: 0.12 * D, duration: 0.35, ease: 'power2.out' }, tV + 0.05);
    tl.to(s.rope, { op: 0, duration: 0.45, ease: 'power1.inOut' }, tV + 0.35);

    // drop precisely into the slot
    tl.to(s.b, { ...at(oSlot.x, oSlot.y), rot: -3, sy: 1.02, sx: 0.99, duration: 0.5, ease: 'power2.in' }, tV + 0.9);
    tl.to(s.floor, { op: 0, duration: 0.4, ease: 'power1.inOut' }, tV + 0.7);

    /* ---------------- Scene G: restoration ------------------------------- */

    const tG2 = tV + 1.4;
    tl.to(s.b, { sy: 0.88, sx: 1.1, y: `+=${0.5 * D * 0.12}`, duration: 0.12, ease: 'power2.out' }, tG2);
    tl.to(s.b, { sy: 1, sx: 1, y: `-=${0.5 * D * 0.12}`, duration: 0.45, ease: 'back.out(2.8)' }, tG2 + 0.12);
    blink(s.b, tG2 + 0.1, 0.3);
    // limbs retract behind the body
    tl.to(L.handOff[0], { x: 0, y: 0, duration: 0.4, ease: 'power2.inOut' }, tG2 + 0.4);
    tl.to(L.handOff[1], { x: 0, y: 0, duration: 0.4, ease: 'power2.inOut' }, tG2 + 0.45);
    tl.to(L.footOff[0], { x: 0, y: 0.1 * D, duration: 0.4, ease: 'power2.inOut' }, tG2 + 0.45);
    tl.to(L.footOff[1], { x: 0, y: 0.1 * D, duration: 0.4, ease: 'power2.inOut' }, tG2 + 0.5);
    tl.to(L.armOp, { 0: 0, duration: 0.35, ease: 'power1.in' }, tG2 + 0.7);
    tl.to(L.armOp, { 1: 0, duration: 0.35, ease: 'power1.in' }, tG2 + 0.76);
    tl.to(L.legOp, { 0: 0, duration: 0.35, ease: 'power1.in' }, tG2 + 0.82);
    tl.to(L.legOp, { 1: 0, duration: 0.35, ease: 'power1.in' }, tG2 + 0.88);
    // faces return to neutral and dissolve back into the glyphs
    tl.to(s.b, { px: 0, py: 0, eyeW: 1, duration: 0.35, ease: 'power1.inOut' }, tG2 + 0.55);
    blink(s.b, tG2 + 1.0, 0.4);
    tl.to(s.b, { face: 0, duration: 0.4, ease: 'power1.inOut' }, tG2 + 1.3);
    tl.to(s.a, { px: 0, py: 0, eyeW: 1, duration: 0.4, ease: 'power1.inOut' }, tG2 + 1.05);
    blink(s.a, tG2 + 1.2, 0.4);
    tl.to(s.a, { face: 0, duration: 0.4, ease: 'power1.inOut' }, tG2 + 1.5);

    // guarantee the exact resting state
    tl.to(s.b, { x: 0, y: 0, rot: 0, sx: 1, sy: 1, duration: 0.3, ease: 'power1.out' }, tG2 + 1.7);
    tl.to(s.a, { x: 0, y: 0, rot: 0, sx: 1, sy: 1, duration: 0.3, ease: 'power1.out' }, tG2 + 1.7);
    tl.to(s.rope, { op: 0, whip: 0, throw: 0, swing: 0, tailLen: 0.4 * geo.D, duration: 0.01 }, tG2 + 1.95);
    tl.to(s.rope.grip, { 0: 0, 1: 0, duration: 0.01 }, tG2 + 1.95);

    return tl;
  }

  /* ------------------------------ lifecycle ------------------------------- */

  function teardownInternal() {
    if (mm) {
      mm.revert();
      mm = null;
    }
    if (tl) {
      if (tl.scrollTrigger) tl.scrollTrigger.kill();
      tl.kill();
      tl = null;
    }
  }

  function resetDom() {
    gsap.set(oEls, { clearProps: 'transform' });
    rigs.forEach(rig => {
      if (!rig) return;
      rig.querySelector('.ta-rig-face').style.opacity = '0';
      rig.querySelectorAll('.ta-rig-limb').forEach(l => {
        l.style.opacity = '0';
      });
      rig.querySelectorAll('.ta-rig-eye').forEach((eye, i) => {
        gsap.set(eye, { clearProps: 'transform', svgOrigin: `${EYE[i].ox} ${EYE[i].oy}` });
        gsap.set(eye.querySelector('.ta-rig-pupil'), { clearProps: 'transform' });
      });
    });
    ropePath.style.opacity = '0';
    ropePath.setAttribute('d', 'M 0 0');
    floorLine.style.opacity = '0';
  }

  function build() {
    if (disposed) return;
    teardownInternal();
    resetDom();
    measure();
    s = makeState();
    render();

    mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      tl = buildTimeline();
      ScrollTrigger.create({
        trigger: brand,
        start: 'top 72%',
        once: false,
        onRefresh(self) {
          if (self.isActive && tl && tl.progress() === 0) {
            tl.timeScale(1);
            tl.play();
          }
        },
        onEnter: () => {
          tl.timeScale(1);
          tl.play();
        },
        onEnterBack: () => {
          tl.timeScale(1);
          tl.play();
        },
        onLeaveBack: () => {
          tl.timeScale(2.6); // unwind quickly when the footer scrolls away
          tl.reverse();
        },
      });
      return () => {
        if (tl) {
          if (tl.scrollTrigger) tl.scrollTrigger.kill();
          tl.kill();
          tl = null;
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
