const cur    = document.getElementById('cur');
const circle = document.getElementById('redCircle');
let mx=0, my=0, lcx=0, lcy=0;
 
document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cur.style.left = mx+'px'; cur.style.top = my+'px';
});
 
// lagged circle
(function loop() {
  lcx += (mx-lcx)*.13; lcy += (my-lcy)*.13;
  circle.style.left = lcx+'px'; circle.style.top = lcy+'px';
  requestAnimationFrame(loop);
})();
 
// ── HOVER LOGIC ──
let anyHovered = false;
 
function attachHover(el) {
  el.addEventListener('mouseenter', () => {
    el.classList.add('hovered');
    circle.classList.add('visible');
    anyHovered = true;
  });
  el.addEventListener('mouseleave', () => {
    el.classList.remove('hovered');
    anyHovered = false;
    setTimeout(() => { if (!anyHovered) circle.classList.remove('visible'); }, 80);
  });
}
 
// attach to name + all 3 word rows
attachHover(document.getElementById('nameEl'));
['w1','w2','w3'].forEach(id => attachHover(document.getElementById(id)));