document.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(() => document.body.classList.add('is-ready'));
});
 
const cur    = document.getElementById('cur');
const curIcon = document.getElementById('curIcon');
const redBg  = document.getElementById('redBg');
const layerB = document.getElementById('layerB');
 
let mx = -9999, my = -9999;
let visible = false;
 
document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cur.style.left = mx + 'px'; cur.style.top = my + 'px';
  if (!visible) {
    visible = true;
    redBg.style.opacity = '1';
    // snap all trailing positions straight to the cursor so nothing
    // animates in from the off-screen init position
    cx = mx; cy = my;
    icx = mx; icy = my;
  }
});
 
// ── TEXT REVEAL CIRCLE ──
const R_SMALL = 20, R_BIG = 180;
let cx = mx, cy = my, currentR = R_SMALL, targetR = R_SMALL;
 
function getTextRects() {
  return [...document.querySelectorAll('#layerA .hl, #layerA .name-lbl')]
    .map(el => el.getBoundingClientRect());
}
 
// ── MAGNETIC ICONS ──
// Each icon: track its own offset (tx, ty) from origin
const iconEls = [document.getElementById('icon0'), document.getElementById('icon1'), document.getElementById('navLogo')];
const MAGNET_DIST   = 80;  // attract radius
const MAGNET_STRENGTH = 0.4; // how much it follows (0-1)
 
// per-icon state
const iconState = iconEls.map(() => ({
  ox: 0, oy: 0,   // current offset
  tx: 0, ty: 0,   // target offset
  active: false
}));
 
// smooth trailing position for the red dot (slight delay behind the real cursor)
let icx = mx, icy = my;
 
(function loop() {
  // smooth trailing follow for the red icon-dot — slight delay, feels the same on any screen size
  icx += (mx - icx) * 0.15;
  icy += (my - icy) * 0.15;
  curIcon.style.left = icx + 'px';
  curIcon.style.top  = icy + 'px';
 
  // ── 1. Text reveal ──
  cx += (mx - cx) * 0.1;
  cy += (my - cy) * 0.1;
  let nearText = false;
  for (const r of getTextRects()) {
    const nearX = Math.max(r.left, Math.min(mx, r.right));
    const nearY = Math.max(r.top,  Math.min(my, r.bottom));
    if (Math.hypot(mx - nearX, my - nearY) < 80) { nearText = true; break; }
  }
  targetR = nearText ? R_BIG : R_SMALL;
  currentR += (targetR - currentR) * 0.08;
  const d = currentR * 2;
  redBg.style.width = d + 'px'; redBg.style.height = d + 'px';
  redBg.style.left = cx + 'px'; redBg.style.top = cy + 'px';
  const lbRect = layerB.getBoundingClientRect();
  layerB.style.clipPath = `circle(${currentR}px at ${cx - lbRect.left}px ${cy - lbRect.top}px)`;
 
  // ── 2. Magnetic icon pull ──
  // find distances first, then only let the single nearest icon (within range) activate
  let nearestIdx = -1, nearestDist = Infinity;
  const dists = iconEls.map((el, i) => {
    const st = iconState[i];
    const r  = el.getBoundingClientRect();
    const ecx = r.left + r.width  / 2 - st.ox;
    const ecy = r.top  + r.height / 2 - st.oy;
    const dist = Math.hypot(mx - ecx, my - ecy);
    if (dist < MAGNET_DIST && dist < nearestDist) { nearestDist = dist; nearestIdx = i; }
    return { ecx, ecy, dist };
  });
 
  let anyIconActive = false;
  for (let i = 0; i < iconEls.length; i++) {
    const el = iconEls[i];
    const st = iconState[i];
    const { ecx, ecy } = dists[i];
 
    if (i === nearestIdx) {
      // pull icon toward cursor
      st.tx = (mx - ecx) * MAGNET_STRENGTH;
      st.ty = (my - ecy) * MAGNET_STRENGTH;
      if (!st.active) {
        st.active = true;
        el.classList.add('active');
      }
      anyIconActive = true;
    } else {
      // spring back to origin
      st.tx = 0;
      st.ty = 0;
      if (st.active) {
        st.active = false;
        el.classList.remove('active');
      }
    }
 
    // lerp offset
    st.ox += (st.tx - st.ox) * 0.12;
    st.oy += (st.ty - st.oy) * 0.12;
 
    // apply transform
    el.style.transform = `translate(${st.ox}px, ${st.oy}px)`;
  }
 
  // the red dot fades in near an icon; the regular cursor stays visible underneath it
  curIcon.classList.toggle('show', anyIconActive);
 
  requestAnimationFrame(loop);
})();