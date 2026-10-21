/* ================= D2 · Landing page clips: play when visible, pause on request, still frame for reduced motion ================= */
let MKV_IO = null;
const mkReduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
function mkVideoMount() {
  if (MKV_IO) MKV_IO.disconnect();
  const vs = $$('video.sa-video'); if (!vs.length) return;
  vs.forEach(v => { v.muted = true; v._userPaused = mkReduced(); mkVideoBtn(v); });
  if (!('IntersectionObserver' in window)) return;
  MKV_IO = new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting && !v._userPaused) { const p = v.play(); p && p.catch(() => {}); } else v.pause(); }), { threshold: 0.35 });
  vs.forEach(v => MKV_IO.observe(v));
}
function mkVideoBtn(v) { const b = document.querySelector(`[data-test="mkv-${v.dataset.mkv}"]`); if (!b) return; const paused = v._userPaused; b.innerHTML = ic(paused ? 'play' : 'pause'); b.setAttribute('aria-label', paused ? 'Play video' : 'Pause video'); }
ACT.mkVideoToggle = i => { const v = document.querySelector(`video[data-mkv="${i}"]`); if (!v) return; v._userPaused = !v._userPaused; if (v._userPaused) v.pause(); else { const p = v.play(); p && p.catch(() => {}); } mkVideoBtn(v); };
