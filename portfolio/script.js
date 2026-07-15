document.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(() => document.body.classList.add('is-ready'));
});
 
const cur    = document.getElementById('cur');
const curIcon = document.getElementById('curIcon');
 
let mx = -9999, my = -9999;
let visible = false;
 
const R_SMALL = 20, R_BIG = 180;
 
const reveals = [
  {
    root: document.getElementById('hero'),
    textEls: () => document.querySelectorAll('#layerA .hl, #layerA .name-lbl'),
    layerB: document.getElementById('layerB'),
    redBg: document.getElementById('redBg'),
    cx: 0, cy: 0, currentR: R_SMALL, targetR: R_SMALL
  },
  {
    root: document.getElementById('about'),
    textEls: () => document.querySelectorAll('#aboutA .about-ln, .about-wrap .name-lbl'),
    layerB: document.getElementById('aboutB'),
    redBg: document.getElementById('redBg2'),
    cx: 0, cy: 0, currentR: R_SMALL, targetR: R_SMALL
  }
];
 
let icx = mx, icy = my;
 
document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cur.style.left = mx + 'px'; cur.style.top = my + 'px';
  if (!visible) {
    visible = true;
    icx = mx; icy = my;
    reveals.forEach(rv => { rv.cx = mx; rv.cy = my; });
  }
});
 
const iconEls = [document.getElementById('icon0'), document.getElementById('icon1'), document.getElementById('navLogo')];
const MAGNET_DIST   = 80;
const MAGNET_STRENGTH = 0.4;
 
const iconState = iconEls.map(() => ({
  ox: 0, oy: 0,
  tx: 0, ty: 0,
  active: false
}));
 
(function loop() {
  icx += (mx - icx) * 0.1;
  icy += (my - icy) * 0.1;
  curIcon.style.left = icx + 'px';
  curIcon.style.top  = icy + 'px';
 
  reveals.forEach(rv => {
    const rect = rv.root.getBoundingClientRect();
    const inSection = my >= rect.top && my <= rect.bottom;
 
    rv.cx += (mx - rv.cx) * 0.07;
    rv.cy += (my - rv.cy) * 0.07;
 
    let nearText = false;
    if (inSection) {
      for (const el of rv.textEls()) {
        const r = el.getBoundingClientRect();
        const nearX = Math.max(r.left, Math.min(mx, r.right));
        const nearY = Math.max(r.top,  Math.min(my, r.bottom));
        if (Math.hypot(mx - nearX, my - nearY) < 80) { nearText = true; break; }
      }
    }
 
    rv.targetR = nearText ? R_BIG : R_SMALL;
    rv.currentR += (rv.targetR - rv.currentR) * 0.06;
 
    const d = rv.currentR * 2;
    rv.redBg.style.width = d + 'px'; rv.redBg.style.height = d + 'px';
    rv.redBg.style.left = rv.cx + 'px'; rv.redBg.style.top = rv.cy + 'px';
    rv.redBg.style.opacity = inSection ? '1' : '0';
 
    const lbRect = rv.layerB.getBoundingClientRect();
    rv.layerB.style.clipPath = `circle(${rv.currentR}px at ${rv.cx - lbRect.left}px ${rv.cy - lbRect.top}px)`;
  });
 
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
      st.tx = (mx - ecx) * MAGNET_STRENGTH;
      st.ty = (my - ecy) * MAGNET_STRENGTH;
      if (!st.active) {
        st.active = true;
        el.classList.add('active');
      }
      anyIconActive = true;
    } else {
      st.tx = 0;
      st.ty = 0;
      if (st.active) {
        st.active = false;
        el.classList.remove('active');
      }
    }
 
    st.ox += (st.tx - st.ox) * 0.1;
    st.oy += (st.ty - st.oy) * 0.1;
 
    el.style.transform = `translate(${st.ox}px, ${st.oy}px)`;
  }
 
  curIcon.classList.toggle('show', anyIconActive);
 
  requestAnimationFrame(loop);
})();
 
function wrapWords(container) {
  const accentEls = new Set(container.querySelectorAll('.hl-red-inline'));
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let n;
  while ((n = walker.nextNode())) textNodes.push(n);
 
  const STEP_MS = 28;
  const MAX_MS  = 320;
  let wordIndex = 0;
 
  textNodes.forEach(node => {
    const isAccent = accentEls.has(node.parentElement);
    const parts = node.textContent.split(/(\s+)/);
    const frag = document.createDocumentFragment();
    parts.forEach(part => {
      if (part.trim() === '') {
        frag.appendChild(document.createTextNode(part));
      } else {
        const span = document.createElement('span');
        span.className = 'word' + (isAccent ? ' accent' : '');
        span.textContent = part;
        const delay = Math.min(wordIndex * STEP_MS, MAX_MS);
        span.style.setProperty('--word-delay', delay + 'ms');
        wordIndex++;
        frag.appendChild(span);
      }
    });
    node.parentNode.replaceChild(frag, node);
  });
}
 
document.querySelectorAll('[data-reveal]').forEach(wrapWords);
const revealParas = Array.from(document.querySelectorAll('[data-reveal]')).map(p => ({
  el: p,
  words: p.querySelectorAll('.word'),
  smoothed: 0
}));
 
const REVEAL_END_FRACTION = 0.5;
const REVEAL_SMOOTHING = 0.05;
 
function revealLoop() {
  const vh = window.innerHeight;
 
  revealParas.forEach(para => {
    const r = para.el.getBoundingClientRect();
    const start = vh;
    const end   = vh * REVEAL_END_FRACTION;
    let target = (start - r.top) / (start - end);
    target = Math.max(0, Math.min(1, target));
 
    para.smoothed += (target - para.smoothed) * REVEAL_SMOOTHING;
    if (Math.abs(target - para.smoothed) < 0.0005) para.smoothed = target;
 
    const revealCount = para.smoothed * para.words.length;
    para.words.forEach((w, i) => w.classList.toggle('lit', i < revealCount));
  });
 
  requestAnimationFrame(revealLoop);
}
requestAnimationFrame(revealLoop);