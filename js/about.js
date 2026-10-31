(() => {
  const wrap = document.querySelector('.about-wrap');
  if (!wrap) return;
  const $ = id => document.getElementById(id);
  const stage = $('aboutStage'), end = $('aboutEnd'), ambient = $('ambientWrap');
  const frame = $('setFrame'), label = $('setLabel');
  const bts = $('setBts'), btsLabel = $('btsLabel');
  const badge = $('storyBadge'), tag = $('nameTag');
  const chapters = [...document.querySelectorAll('.chapter')];
  const spots = [...document.querySelectorAll('.spot')];

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  let shot = false, btsPlaying = false, ticking = false;

  function render() {
    ticking = false;
    const r = wrap.getBoundingClientRect();
    const q = clamp(-r.top / (r.height - innerHeight));

    // 1. the camera takes the shot (time-based, fires once; re-arms at the very top)
    if (!shot && q > 0.03) { shot = true; stage.classList.add('shot'); }
    else if (shot && q < 0.01) { shot = false; stage.classList.remove('shot'); }

    // 2. setup breakdown
    label.style.opacity = (seg(q, 0.1, 0.14) * (1 - seg(q, 0.42, 0.45))).toFixed(3);
    spots.forEach((s, i) => s.classList.toggle('on', q > 0.18 + i * 0.035 && q < 0.44));

    // 3. my story, with behind-the-scenes during "The Work"
    const active = q < 0.48 || q > 0.86 ? -1 : q < 0.61 ? 0 : q < 0.73 ? 1 : 2;
    chapters.forEach((ch, i) => ch.classList.toggle('on', i === active));

    const B = ease(seg(q, 0.73, 0.77));
    bts.style.clipPath = `inset(${((1 - B) * 100).toFixed(2)}% 0 0 0)`;
    btsLabel.style.opacity = (seg(q, 0.76, 0.79) * (1 - seg(q, 0.85, 0.87))).toFixed(3);
    if (q > 0.55 && bts.preload === 'none') bts.preload = 'auto';
    const wantBts = B > 0 && q < 0.95;
    if (wantBts !== btsPlaying) {
      btsPlaying = wantBts;
      if (wantBts) bts.play().catch(() => {}); else bts.pause();
    }

    // 4. gentle fade out, then the page turns white for "Trusted by"
    const out = ease(seg(q, 0.86, 0.94));
    frame.style.opacity = (1 - out).toFixed(3);
    frame.style.setProperty('--s', (1 - out * 0.04).toFixed(3));
    ambient.style.opacity = (1 - out).toFixed(3);
    end.style.opacity = ease(seg(q, 0.9, 1)).toFixed(3);

    const ui = seg(q, 0.08, 0.12) * (1 - seg(q, 0.85, 0.88));
    badge.style.opacity = ui.toFixed(3);
    tag.style.opacity = ui.toFixed(3);
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(render); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  render();
})();
