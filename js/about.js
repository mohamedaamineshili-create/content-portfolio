(() => {
  const wrap = document.querySelector('.about-wrap');
  if (!wrap) return;
  const $ = id => document.getElementById(id);
  const paper = $('aboutPaper'), beam = $('beam'), ambient = $('setAmbient');
  const frame = $('setFrame'), photo = $('setPhoto'), cut = $('setCut'), label = $('setLabel');
  const badge = $('storyBadge'), tag = $('nameTag');
  const chapters = [...document.querySelectorAll('.chapter')];
  const spots = [...document.querySelectorAll('.spot')];
  const cubeBox = $('cubes');

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  // floating dark cubes while I'm still in the dark
  const pos = [[8,18],[18,64],[27,32],[12,82],[72,22],[84,58],[91,30],[78,80],[34,12],[66,10],[5,46],[95,72]];
  const cubes = pos.map(([x, y], i) => {
    const el = document.createElement('span');
    el.className = 'cube';
    el.style.cssText = `left:${x}%;top:${y}%;--s:${8 + (i * 7) % 18}px`;
    cubeBox.appendChild(el);
    return { el, speed: 40 + (i * 37) % 120, rot: (i * 53) % 90 };
  });

  function paperClip(t) {            // 0 = full page, 1 = thin beam
    const side = t * (innerWidth / 2 - 1), bottom = t * innerHeight * 0.38;
    return `inset(0px ${side}px ${bottom}px ${side}px)`;
  }

  let ticking = false;
  function render() {
    ticking = false;
    const r = wrap.getBoundingClientRect();
    const q = clamp(-r.top / (r.height - innerHeight));

    // 1. white page collapses into a beam (and opens again at the end)
    const t = q < 0.5 ? ease(seg(q, 0, 0.08)) : 1 - ease(seg(q, 0.92, 1));
    paper.style.clipPath = paperClip(t);
    paper.style.opacity = t > 0.995 ? 0 : 1;

    // 2. I emerge from the dark under the beam
    const o = ease(seg(q, 0.08, 0.2));
    // 3. lights on: the set opens around me
    const L = ease(seg(q, 0.2, 0.34));
    // 6. dissolve into light
    const out = ease(seg(q, 0.86, 0.93));

    beam.style.transform = `translateX(-50%) scaleY(${t > 0.97 ? 1 : 0})`;
    beam.style.opacity = (1 - L * 0.85).toFixed(3);
    beam.style.setProperty('--glow', (o * (1 - L)).toFixed(3));

    cut.style.opacity = (o * (1 - seg(q, 0.33, 0.37))).toFixed(3);
    cut.style.filter = `brightness(${(0.15 + 0.85 * o).toFixed(2)}) blur(${((1 - o) * 14).toFixed(1)}px)`;
    cut.style.setProperty('--m', `${-18 + o * 118}%`);

    photo.style.clipPath = `circle(${(L * 120).toFixed(2)}% at 50% 24%)`;
    ambient.style.opacity = (L * (1 - out)).toFixed(3);
    frame.style.setProperty('--frame', L.toFixed(3));
    frame.style.setProperty('--s', (1.06 - 0.06 * o + out * 0.05).toFixed(3));
    frame.style.opacity = (1 - out).toFixed(3);
    frame.style.filter = out > 0 ? `brightness(${(1 + out * 2).toFixed(2)})` : '';
    label.style.opacity = (seg(q, 0.3, 0.34) * (1 - seg(q, 0.54, 0.57))).toFixed(3);

    cubes.forEach(c => {
      c.el.style.opacity = (o * (1 - L) * 0.9).toFixed(3);
      c.el.style.transform = `translateY(${(0.5 - q) * c.speed}px) rotate(${c.rot + q * 120}deg)`;
    });

    // 4. setup breakdown: labels pop in one by one
    spots.forEach((s, i) => s.classList.toggle('on', q > 0.37 + i * 0.03 && q < 0.56));

    // 5. my story
    const active = q < 0.58 || q > 0.86 ? -1 : q < 0.68 ? 0 : q < 0.77 ? 1 : 2;
    chapters.forEach((ch, i) => ch.classList.toggle('on', i === active));

    const ui = seg(q, 0.2, 0.26) * (1 - seg(q, 0.85, 0.88));
    badge.style.opacity = ui.toFixed(3);
    tag.style.opacity = ui.toFixed(3);
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(render); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  render();
})();
