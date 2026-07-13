document.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(() => document.body.classList.add('is-ready'));
});
 
const cur    = document.getElementById('cur');
const redBg  = document.getElementById('redBg');
const layerB = document.getElementById('layerB');
 
const R_SMALL = 20;   // default small radius
const R_BIG   = 180;  // expanded radius near text
 
let mx = window.innerWidth  / 2;
let my = window.innerHeight / 2;
let cx = mx, cy = my;
let currentR = R_SMALL;
let targetR  = R_SMALL;
let visible  = false;
 
// collect all text bounding boxes
function getTextRects() {
  return [...document.querySelectorAll('#layerA .hl, #layerA .name-lbl')]
    .map(el => el.getBoundingClientRect());
}
 
document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cur.style.left = mx + 'px';
  cur.style.top  = my + 'px';
  if (!visible) { visible = true; redBg.style.opacity = '1'; }
});
 
(function loop() {
  // lerp circle position
  cx += (mx - cx) * 0.1;
  cy += (my - cy) * 0.1;
 
  // check distance from cursor to any text element
  const rects = getTextRects();
  let nearText = false;
  for (const r of rects) {
    const nearX = Math.max(r.left, Math.min(mx, r.right));
    const nearY = Math.max(r.top,  Math.min(my, r.bottom));
    const dist  = Math.hypot(mx - nearX, my - nearY);
    if (dist < 80) { nearText = true; break; }
  }
  targetR = nearText ? R_BIG : R_SMALL;
 
  // smooth radius lerp
  currentR += (targetR - currentR) * 0.08;
 
  // size the red div
  const d = currentR * 2;
  redBg.style.width  = d + 'px';
  redBg.style.height = d + 'px';
 
  // position
  redBg.style.left = cx + 'px';
  redBg.style.top  = cy + 'px';
 
  // clip layer-b
  const rect = layerB.getBoundingClientRect();
  const relX = cx - rect.left;
  const relY = cy - rect.top;
  layerB.style.clipPath = `circle(${currentR}px at ${relX}px ${relY}px)`;
 
  requestAnimationFrame(loop);
})();