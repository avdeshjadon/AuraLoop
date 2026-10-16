/**
 * Footer wordmark O-character animation.
 *
 * A scroll-triggered GSAP/ScrollTrigger choreography that lives entirely inside
 * the existing footer wordmark. The two lowercase "o" glyphs wake up; the right
 * "o" detaches, leaps and falls into the clear space to the right of the
 * tagline, grows limbs, catches a rope hanging from the "p", climbs it, shimmies
 * over to the "p", then releases and settles back into its exact original
 * typographic position.
 *
 * Everything is driven by a single plain-object proxy rendered on every timeline
 * update, so playback/reversal is fully deterministic and nothing can desync.
 * All coordinates are measured at runtime from the rendered wordmark (no
 * hard-coded viewport assumptions) and re-measured on resize / font load.
 *
 * Layout constraints handled by construction:
 *  - the tagline is an inline text block under the wordmark; a keep-out band is
 *    measured from its text run and the flight/climb path is routed around it,
 *  - the footer divider bounds the "floor",
 *  - the character never covers the "p" or any other glyph.
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
    inkLeft: -m.actualBoundingBoxLeft, // offset from glyph origin to ink's left edge
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
    });

    const a = toStage(gA, oARect);
    const b = toStage(gB, oBRect);
    const p = toStage(gP, pRect);

    const D = (a.inkH + b.inkH) / 2;
    const pxPerUnit = D / RIG_GLYPH_D;
    const rigSize = 1000 * pxPerUnit;
    const r = D / 2;

    // rope is tied to the top of the p's stem (left edge of the p, x-height top)
    const ropeAnchor = {
      x: pRect.x + gP.inkLeft + 0.11 * gP.fs,
      y: p.baseline - 0.97 * gA.inkAsc,
    };
    const pInkRight = pRect.x + gP.inkRight;

    /* ---- keep-out band: the tagline's text run (inflated a little) ---- */
    const keep = {
      x0: -1e4,
      x1: tag.right + 10,
      y0: tag.y - 6,
      y1: tag.bottom + 6,
    };

    /* ---- landing spot: clear corridor to the right of the tagline ---- */
    const feetExt = 0.72 * D; // feet below body centre when standing
    const maxY = bot.y - 8 - feetExt; // feet must stay above the divider
    const minY = Math.max(tag.bottom + r + 8, keep.y1 + r + 4); // glyph top below text
    let landY = clamp(minY, minY, Math.max(minY, maxY));
    const tooTight = maxY < minY;
    if (tooTight) landY = minY - 2; // extremely short footers: stay as high as possible
    let landX = Math.max(tag.right + 2.7 * r, wm.right + 2.1 * r);
    landX = Math.min(landX, brandW - r - 6);
    if (landX < pInkRight + r + 8) landX = Math.min(pInkRight + r + 8, brandW - r - 6);
    const floorY = landY + feetExt;

    /* ---- climb destination: hanging beside the p at x-height ---- */
    const destX = Math.min(pInkRight + r + 12, brandW - r - 8);
    const destY = p.baseline - 0.5 * gA.inkAsc;

    geo = {
      brandW,
      wm,
      tag,
      keep,
      D,
      r,
      pxPerUnit,
      a: { ...a, origin: `${gA.inkCx}px ${gA.inkCy}px` },
      b: { ...b, origin: `${gB.inkCx}px ${gB.inkCy}px`, pxPerUnit },
      p,
      pInkRight,
      ropeAnchor,
      landX,
      landY,
      landYFloor: floorY,
      floorY,
      destX,
      destY,
      tooTight,
      feetExt,
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
    floorLine.setAttribute('x1', landX - 0.9 * D);
    floorLine.setAttribute('x2', landX + 0.9 * D);
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
      rope: { op: 0, dash: 1, swing: 0, tailLen: 0.42 * geo.D },
      limbs: {
        armOp: { l: 0, r: 0 },
        legOp: { l: 0, r: 0 },
        hOff: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
        fOff: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
        hAbs: [
          { x: 0, y: 0, w: 0 },
          { x: 0, y: 0, w: 0 },
        ],
        fAbs: [
          { x: 0, y: 0, w: 0 },
          { x: 0, y: 0, w: 0 },
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
    const armOp = [L.armOp.l, L.armOp.r];
    const legOp = [L.legOp.l, L.legOp.r];
    const limbs = rig.querySelectorAll('.ta-rig-limb');

    for (let i = 0; i < 2; i++) {
      const arm = limbs[i];
      const leg = limbs[i + 2];
      arm.style.opacity = armOp[i];
      leg.style.opacity = legOp[i];

      const blend = (off, abs) => ({
        x: cx + off.x + (abs.x - (cx + off.x)) * abs.w,
        y: cy + off.y + (abs.y - (cy + off.y)) * abs.w,
      });
      const h = blend(L.hOff[i], L.hAbs[i]);
      const f = blend(L.fOff[i], L.fAbs[i]);

      const hr = stageToRig(h.x, h.y);
      const fr = stageToRig(f.x, f.y);
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
   * Rope model: tied at the p's stem top, straight (taut) to the highest active
   * hand grip, then hanging straight down below the lowest active grip.
   * When nothing is held it's a short tail hanging from the anchor.
   */
  function renderRope() {
    const A = geo.ropeAnchor;
    const L = s.limbs;
    const D = geo.D;
    const cx = geo.b.cx + s.b.x;
    const cy = geo.b.cy + s.b.y;

    ropePath.style.opacity = s.rope.op;
    ropePath.style.strokeDashoffset = s.rope.dash;

    const grips = [];
    for (let i = 0; i < 2; i++) {
      const h = L.hAbs[i];
      if (h.w > 0.02) {
        grips.push({
          x: cx + L.hOff[i].x + (h.x - (cx + L.hOff[i].x)) * h.w,
          y: cy + L.hOff[i].y + (h.y - (cy + L.hOff[i].y)) * h.w,
          w: h.w,
        });
      }
    }
    grips.sort((p, q) => p.y - q.y);

    const tailLen = s.rope.tailLen;
    const swing = s.rope.swing;

    let d;
    if (grips.length) {
      const low = grips[grips.length - 1];
      const end = { x: low.x + swing, y: low.y + tailLen };
      const nodes = [A, ...grips, end];
      d = `M ${A.x.toFixed(1)} ${A.y.toFixed(1)}`;
      for (let i = 0; i < nodes.length - 1; i++) {
        const p0 = nodes[i];
        const p1 = nodes[i + 1];
        if (p0.w !== undefined && p0.w < 0.98) {
          // blend an inactive grip back onto the straight A -> end line
          const t = clamp((p0.y - A.y) / Math.max(1, end.y - A.y), 0, 1);
          p0.x = lerp(lerp(A.x, end.x, t), p0.x, p0.w);
          p0.y = lerp(lerp(A.y, end.y, t), p0.y, p0.w);
        }
        d += ` L ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
      }
    } else {
      const ex = A.x + swing;
      const ey = A.y + tailLen;
      const mx = (A.x + ex) / 2 + swing * 0.5;
      const my = lerp(A.y, ey, 0.55);
      d = `M ${A.x.toFixed(1)} ${A.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
    }
    void D;
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
    const A = geo.ropeAnchor;
    const restCX = geo.b.cx;
    const restCY = geo.b.cy;
    const landX = geo.landX;
    const landY = geo.landY;
    const floorY = geo.floorY;
    const destX = geo.destX;
    const destY = geo.destY;
    const offX = v => v - restCX;
    const offY = v => v - restCY;

    // climb geometry
    const climbDist = landY - destY; // px the body rises
    const step = Math.max(D * 0.5, 1);
    const cycles = clamp(Math.round(climbDist / step), 1, 5);
    const stepY = climbDist / (cycles + 0.35);
    const L = s.limbs;

    const pose = {
      hL: { x: -0.7 * D, y: 0.3 * D },
      hR: { x: 0.7 * D, y: 0.3 * D },
      fL: { x: -0.34 * D, y: geo.feetExt },
      fR: { x: 0.34 * D, y: geo.feetExt },
    };
    L.hOff[0] = { ...pose.hL };
    L.hOff[1] = { ...pose.hR };
    L.fOff[0] = { ...pose.fL };
    L.fOff[1] = { ...pose.fR };

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
    tl.to(s.a, { px: 0, py: 0, duration: 0.25, ease: 'power1.inOut' }, 2.45);
    tl.to(s.b, { px: -0.6, py: 0.2, duration: 0.3, ease: 'power2.out' }, 2.0);
    tl.to(s.b, { px: 0.1, py: -0.2, duration: 0.25, ease: 'power1.inOut' }, 2.3);

    tl.to(s.a, { y: -5, duration: 0.18, ease: 'power2.out' }, 2.35);
    tl.to(s.a, { y: 0, duration: 0.22, ease: 'power2.in' }, 2.53);
    tl.to(s.b, { y: -6, duration: 0.2, ease: 'power2.out' }, 2.45);
    tl.to(s.b, { y: 0, duration: 0.24, ease: 'power2.in' }, 2.65);
    tl.to(s.b, { sy: 0.92, sx: 1.06, y: 3, duration: 0.15, ease: 'power2.out' }, 2.88);
    tl.to(s.b, { sy: 1, sx: 1, y: 0, duration: 0.3, ease: 'back.out(2)' }, 3.03);

    tl.to(s.a, { px: 0.95, py: 0.1, duration: 0.32, ease: 'power2.out' }, 3.15);
    tl.to(s.b, { px: -0.95, py: 0.1, duration: 0.32, ease: 'power2.out' }, 3.29);
    blink(s.b, 3.75, 0.3);
    blink(s.b, 4.0, 0.28);

    /* ---------------- Scene B: detach, leap, fall ------------------------- */

    const tB = 4.35;
    const apexY = restCY - 1.08 * D; // clears the p's ink while flying over it
    const apexX = lerp(restCX, landX, 0.62);

    tl.to(s.b, { sy: 0.8, sx: 1.14, y: 7, duration: 0.3, ease: 'power2.out' }, tB);
    tl.to(s.a, { px: 0.5, py: -0.4, eyeW: 1.12, duration: 0.3, ease: 'power1.out' }, tB + 0.05);
    // leap up and outward
    tl.to(s.b, { sy: 1.1, sx: 0.93, y: offY(apexY), duration: 0.34, ease: 'power2.out' }, tB + 0.3);
    tl.to(s.b, { x: offX(apexX), rot: -12, duration: 0.34, ease: 'power1.out' }, tB + 0.3);
    tl.to(s.b, { eyeW: 1.28, duration: 0.2 }, tB + 0.32);
    // gravity
    tl.to(s.b, {
      y: offY(landY),
      x: offX(landX),
      rot: 16,
      sy: 1.06,
      sx: 0.97,
      duration: 0.6,
      ease: 'power2.in',
    }, tB + 0.64);
    tl.to(s.a, { px: 0.85, py: 0.75, duration: 0.6, ease: 'power1.inOut' }, tB + 0.64);
    tl.to(s.floor, { op: 1, duration: 0.3 }, tB + 0.8);
    tl.to(s.b, { eyeW: 1.05, duration: 0.1 }, tB + 1.14);

    // impact + bounce
    const tI = tB + 1.24;
    const sq = 0.5 * D * (1 - 0.6);
    tl.to(s.b, { sy: 0.6, sx: 1.32, y: `+=${sq}`, duration: 0.12, ease: 'power3.out' }, tI);
    tl.to(s.b, { eyeW: 1.2, duration: 0.08 }, tI);
    blink(s.b, tI, 0.26);
    blink(s.a, tI + 0.06, 0.3);
    tl.to(s.b, { eyeW: 1, duration: 0.3 }, tI + 0.2);
    tl.to(s.b, { sy: 1.06, sx: 0.96, y: `-=${0.4 * D}`, rot: 6, duration: 0.26, ease: 'power2.out' }, tI + 0.12);
    tl.to(s.b, { y: `+=${0.4 * D}`, duration: 0.24, ease: 'power2.in' }, tI + 0.38);
    tl.to(s.b, { sy: 0.82, sx: 1.14, y: `+=${0.5 * D * 0.18}`, duration: 0.1, ease: 'power2.out' }, tI + 0.62);
    tl.to(s.b, { sy: 1, sx: 1, y: `-=${0.5 * D * 0.18}`, rot: 0, duration: 0.42, ease: 'back.out(2.6)' }, tI + 0.74);
    tl.to(s.a, { px: 0.3, py: 0.15, eyeW: 1, duration: 0.5, ease: 'power1.inOut' }, tI + 0.5);

    /* ---------------- Scene C: limbs emerge ------------------------------- */

    const tC = tI + 1.25;
    tl.to(s.b, { rot: -5, duration: 0.22, ease: 'power1.inOut' }, tC);
    tl.to(s.b, { rot: 4, duration: 0.24, ease: 'power1.inOut' }, tC + 0.22);
    tl.to(s.b, { rot: 0, duration: 0.3, ease: 'power1.inOut' }, tC + 0.46);

    tl.to(L.armOp, { l: 1, duration: 0.4, ease: 'power1.out' }, tC + 0.1);
    tl.to(L.armOp, { r: 1, duration: 0.4, ease: 'power1.out' }, tC + 0.22);
    tl.to(L.legOp, { l: 1, duration: 0.4, ease: 'power1.out' }, tC + 0.42);
    tl.to(L.legOp, { r: 1, duration: 0.4, ease: 'power1.out' }, tC + 0.52);
    // stand taller as the feet plant
    tl.to(s.b, { y: `-=${geo.feetExt - 0.5 * D}`, duration: 0.55, ease: 'power2.out' }, tC + 0.45);
    tl.to(s.b, { x: `+=${0.1 * D}`, duration: 0.22, ease: 'power2.out' }, tC + 0.8);
    tl.to(s.b, { x: `-=${0.1 * D}`, duration: 0.3, ease: 'power2.inOut' }, tC + 1.02);
    blink(s.b, tC + 1.35);

    // look around, then notice the rope up to the left
    const tL = tC + 1.55;
    tl.to(s.b, { px: 0.85, py: 0.1, duration: 0.3, ease: 'power2.out' }, tL);
    tl.to(s.b, { px: -0.5, duration: 0.3, ease: 'power1.inOut' }, tL + 0.34);
    tl.to(s.b, { px: -0.5, py: -0.92, eyeW: 1.14, duration: 0.36, ease: 'power2.out' }, tL + 0.7);
    tl.to(s.b, { rot: 3, duration: 0.4, ease: 'power1.inOut' }, tL + 0.75);
    blink(s.a, tL + 0.6);
    blink(s.b, tL + 1.25);

    /* ---------------- Scene D: rope + grab -------------------------------- */

    const standY = landY - (geo.feetExt - 0.5 * D); // body centre once standing
    const grabY = standY - 0.86 * D; // hands reach to here on the rope
    const grabX = landX;

    const tD = tL + 1.6;
    L.hAbs[1].x = grabX;
    L.hAbs[1].y = grabY;
    L.hAbs[0].x = grabX;
    L.hAbs[0].y = grabY + 0.42 * D;
    tl.to(s.rope, { op: 1, duration: 0.2 }, tD);
    tl.to(L.hAbs[1], { w: 1, duration: 0.5, ease: 'power2.out' }, tD + 0.35);
    tl.to(s.rope, { dash: 0, duration: 0.8, ease: 'power2.inOut' }, tD + 0.35);
    tl.to(L.hAbs[0], { w: 1, duration: 0.45, ease: 'power2.out' }, tD + 0.85);
    // weight shifts onto the rope
    tl.to(s.b, { x: `+=${-0.05 * D}`, rot: -4, duration: 0.5, ease: 'power2.inOut' }, tD + 0.95);
    tl.to(s.b, { y: `-=${0.28 * D}`, duration: 0.5, ease: 'power2.inOut' }, tD + 1.05);
    tl.to(s.b, { rot: 0, duration: 0.4, ease: 'power1.inOut' }, tD + 1.45);
    tl.to(s.rope, { tailLen: 0.55 * D, duration: 0.5, ease: 'power2.out' }, tD + 1.0);

    /* ---------------- Scene E: the climb ---------------------------------- */

    let t = tD + 1.7;
    let bodyY = standY - 0.28 * D;
    let bodyX = landX - 0.05 * D;

    for (let i = 0; i < cycles; i++) {
      const lead = i % 2 === 0 ? 1 : 0;
      const stay = 1 - lead;
      const tCyc = t;
      const ncy = bodyY - stepY;
      const ncx = bodyX + (i % 2 === 0 ? 1 : -1) * 0.06 * D;

      // lead hand releases, swings up, re-grips higher
      tl.to(L.hAbs[lead], { w: 0, duration: 0.12, ease: 'power1.in' }, tCyc);
      tl.to(L.hAbs[lead], { x: ncx, y: ncy - 1.05 * D, duration: 0.26, ease: 'power1.inOut' }, tCyc + 0.1);
      tl.to(L.hAbs[lead], { w: 1, duration: 0.16, ease: 'power2.out' }, tCyc + 0.36);
      // rope tension pulse
      tl.to(s.rope, { swing: 0.05 * D, duration: 0.16, ease: 'power2.out' }, tCyc + 0.36);
      tl.to(s.rope, { swing: -0.03 * D, duration: 0.5, ease: 'power2.out' }, tCyc + 0.52);

      // pull: the body rises toward the new grip, the stay hand holds fast
      const rise = tCyc + 0.44;
      tl.to(s.b, { y: `-=${stepY}`, duration: 0.5, ease: 'power2.inOut' }, rise);
      tl.to(s.b, { x: `+=${ncx - bodyX}`, duration: 0.5, ease: 'power1.inOut' }, rise);
      tl.to(s.b, { rot: i % 2 === 0 ? 4 : -4, duration: 0.4, ease: 'power1.inOut' }, rise);
      // legs brace against the rope below
      tl.to(L.fAbs[0], { x: bodyX - 0.16 * D, y: bodyY + 0.52 * D, w: 0.85, duration: 0.26, ease: 'power2.out' }, rise - 0.14);
      tl.to(L.fAbs[1], { x: bodyX + 0.16 * D, y: bodyY + 0.6 * D, w: 0.85, duration: 0.26, ease: 'power2.out' }, rise - 0.06);
      tl.to(L.fAbs[0], { y: `-=${stepY * 0.85}`, duration: 0.42, ease: 'power1.inOut' }, rise + 0.24);
      tl.to(L.fAbs[1], { y: `-=${stepY * 0.85}`, duration: 0.42, ease: 'power1.inOut' }, rise + 0.3);
      // stay hand follows the body up
      tl.to(L.hAbs[stay], { x: ncx, y: ncy - 0.55 * D, duration: 0.45, ease: 'power2.inOut' }, rise + 0.1);

      // brief settle
      tl.to(s.b, { rot: 0, duration: 0.3, ease: 'power1.inOut' }, tCyc + 0.98);
      tl.to(s.b, { px: -0.6, py: -0.7, duration: 0.4 }, tCyc + 0.5);

      bodyY = ncy;
      bodyX = ncx;
      t = tCyc + 1.2;
      if (i === Math.floor(cycles / 2) - 1) blink(s.b, tCyc + 1.0, 0.32);
    }

    // shimmy left along the rope to hang beside the p
    const tS = t;
    const shimmy = 0.85;
    tl.to(s.b, { x: offX(destX), y: offY(destY), rot: -3, duration: shimmy, ease: 'power1.inOut' }, tS);
    tl.to(L.hAbs[1], { x: destX + 0.06 * D, y: destY - 1.02 * D, w: 1, duration: shimmy, ease: 'power1.inOut' }, tS);
    tl.to(L.hAbs[0], { x: destX - 0.06 * D, y: destY - 0.6 * D, w: 1, duration: shimmy, ease: 'power1.inOut' }, tS + 0.08);
    tl.to(L.fAbs[0], { x: destX - 0.12 * D, y: destY + 0.5 * D, w: 0.8, duration: shimmy }, tS + 0.05);
    tl.to(L.fAbs[1], { x: destX + 0.14 * D, y: destY + 0.56 * D, w: 0.8, duration: shimmy }, tS + 0.12);
    blink(s.b, tS + 0.55, 0.3);

    /* ---------------- Scene F: destination + release ---------------------- */

    const tF = tS + shimmy + 0.25;
    tl.to(s.b, { px: -0.8, py: -0.25, duration: 0.35, ease: 'power2.out' }, tF);
    blink(s.b, tF + 0.4, 0.5);
    tl.to(s.b, { rot: -5, duration: 0.32, ease: 'sine.inOut' }, tF + 0.35);
    tl.to(s.b, { rot: -2, duration: 0.35, ease: 'sine.inOut' }, tF + 0.67);

    const tRel = tF + 1.1;
    tl.to(L.hAbs[1], { w: 0, duration: 0.16, ease: 'power1.in' }, tRel);
    tl.to(L.hAbs[0], { w: 0, duration: 0.18, ease: 'power1.in' }, tRel + 0.1);
    tl.to(L.fAbs[0], { w: 0, duration: 0.3, ease: 'power1.in' }, tRel);
    tl.to(L.fAbs[1], { w: 0, duration: 0.3, ease: 'power1.in' }, tRel + 0.08);
    // rope recoils upward and fades
    tl.to(s.rope, { tailLen: 0.4 * D, swing: 0.14 * D, duration: 0.35, ease: 'power2.out' }, tRel + 0.05);
    tl.to(s.rope, { swing: -0.08 * D, duration: 0.5, ease: 'sine.inOut' }, tRel + 0.4);
    tl.to(s.rope, { dash: 1, duration: 0.5, ease: 'power2.inOut' }, tRel + 0.5);
    tl.to(s.rope, { op: 0, duration: 0.4, ease: 'power1.inOut' }, tRel + 0.75);

    // hop back over the p into the original slot
    const tBk = tRel + 0.3;
    const backApexY = restCY - 1.14 * D;
    tl.to(s.b, { y: offY(backApexY), x: offX(lerp(destX, restCX, 0.55)), duration: 0.42, ease: 'power2.out' }, tBk);
    tl.to(s.b, { rot: 7, duration: 0.4, ease: 'power1.inOut' }, tBk);
    tl.to(s.b, { y: offY(restCY), x: 0, rot: -5, duration: 0.6, ease: 'power2.in' }, tBk + 0.42);
    tl.to(s.b, { rot: 0, duration: 0.3, ease: 'power1.inOut' }, tBk + 0.9);
    // limbs trail in the air
    tl.to(L.hOff[0], { x: -1.0 * D, y: -0.42 * D, duration: 0.4, ease: 'power2.out' }, tBk + 0.1);
    tl.to(L.hOff[1], { x: 0.95 * D, y: -0.5 * D, duration: 0.4, ease: 'power2.out' }, tBk + 0.16);
    tl.to(L.fOff[0], { x: -0.5 * D, y: 0.46 * D, duration: 0.4, ease: 'power2.out' }, tBk + 0.14);
    tl.to(L.fOff[1], { x: 0.56 * D, y: 0.4 * D, duration: 0.4, ease: 'power2.out' }, tBk + 0.2);

    /* ---------------- Scene G: restoration ------------------------------- */

    const tG = tBk + 1.05;
    const landSquash = 0.5 * D * (1 - 0.88);
    tl.to(s.b, { sy: 0.88, sx: 1.1, y: landSquash, duration: 0.12, ease: 'power2.out' }, tG);
    tl.to(s.b, { sy: 1, sx: 1, y: 0, duration: 0.45, ease: 'back.out(2.8)' }, tG + 0.12);
    blink(s.b, tG + 0.1, 0.3);
    tl.to(s.floor, { op: 0, duration: 0.5, ease: 'power1.inOut' }, tG - 0.2);

    // limbs retract behind the body
    tl.to(L.hOff[0], { x: 0, y: 0, duration: 0.4, ease: 'power2.inOut' }, tG + 0.45);
    tl.to(L.hOff[1], { x: 0, y: 0, duration: 0.4, ease: 'power2.inOut' }, tG + 0.5);
    tl.to(L.fOff[0], { x: 0, y: 0.1 * D, duration: 0.4, ease: 'power2.inOut' }, tG + 0.5);
    tl.to(L.fOff[1], { x: 0, y: 0.1 * D, duration: 0.4, ease: 'power2.inOut' }, tG + 0.55);
    tl.to(L.armOp, { l: 0, duration: 0.35, ease: 'power1.in' }, tG + 0.7);
    tl.to(L.armOp, { r: 0, duration: 0.35, ease: 'power1.in' }, tG + 0.76);
    tl.to(L.legOp, { l: 0, duration: 0.35, ease: 'power1.in' }, tG + 0.82);
    tl.to(L.legOp, { r: 0, duration: 0.35, ease: 'power1.in' }, tG + 0.88);

    // faces return to neutral and dissolve back into the glyphs
    tl.to(s.b, { px: 0, py: 0, eyeW: 1, duration: 0.35, ease: 'power1.inOut' }, tG + 0.6);
    blink(s.b, tG + 1.05, 0.4);
    tl.to(s.b, { face: 0, duration: 0.4, ease: 'power1.inOut' }, tG + 1.35);
    tl.to(s.a, { px: 0, py: 0, eyeW: 1, duration: 0.4, ease: 'power1.inOut' }, tG + 1.1);
    blink(s.a, tG + 1.25, 0.4);
    tl.to(s.a, { face: 0, duration: 0.4, ease: 'power1.inOut' }, tG + 1.55);

    // guarantee the exact resting state
    tl.to(s.b, { x: 0, y: 0, rot: 0, sx: 1, sy: 1, duration: 0.3, ease: 'power1.out' }, tG + 1.7);
    tl.to(s.a, { x: 0, y: 0, rot: 0, sx: 1, sy: 1, duration: 0.3, ease: 'power1.out' }, tG + 1.7);
    tl.to(s.limbs.hAbs[0], { w: 0, duration: 0.01 }, tG + 1.95);
    tl.to(s.limbs.hAbs[1], { w: 0, duration: 0.01 }, tG + 1.95);
    tl.to(s.limbs.fAbs[0], { w: 0, duration: 0.01 }, tG + 1.95);
    tl.to(s.limbs.fAbs[1], { w: 0, duration: 0.01 }, tG + 1.95);
    tl.to(s.rope, { dash: 1, op: 0, swing: 0, tailLen: 0.42 * D, duration: 0.01 }, tG + 1.95);

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
    ropePath.style.strokeDashoffset = '1';
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
          // if we're already past the start when (re)built — e.g. a deep link or a
          // resize rebuild while the footer is on screen — kick off playback.
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
