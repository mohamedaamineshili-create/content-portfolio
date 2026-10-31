(() => {
  const wrap = document.querySelector('.about-wrap');
  if (!wrap) return;
  const paper = document.getElementById('aboutPaper');
  const beam = document.getElementById('beam');
  const portrait = document.getElementById('portrait');
  const img = portrait.querySelector('img');
  const badge = document.getElementById('storyBadge');
  const tag = document.getElementById('nameTag');
  const chapters = [...document.querySelectorAll('.chapter')];
  const cubeBox = document.getElementById('cubes');

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  // floating dark cubes, kept away from the face
  const spots = [[8,18],[18,64],[27,32],[12,82],[72,22],[84,58],[91,30],[78,80],[34,12],[66,10],[5,46],[95,72]];
  const cubes = spots.map(([x, y], i) => {
    const el = document.createElement('span');
    el.className = 'cube';
    const s = 8 + (i * 7) % 18;
    el.style.cssText = `left:${x}%;top:${y}%;--s:${s}px`;
    cubeBox.appendChild(el);
    return { el, speed: 40 + (i * 37) % 120, rot: (i * 53) % 90 };
  });

  // CSS can't target the paper edges by percentage minus a pixel, so compute in px
  function paperClip(t) {           // t: 0 = full page, 1 = thin beam
    const W = innerWidth, H = innerHeight;
    const side = t * (W / 2 - 1);
    const bottom = t * H * 0.38;
    return `inset(0px ${side}px ${bottom}px ${side}px)`;
  }

  let ticking = false;
  function render() {
    ticking = false;
    const r = wrap.getBoundingClientRect();
    const q = clamp(-r.top / (r.height - innerHeight));

    // paper -> beam, and beam -> paper at the end
    const close = ease(seg(q, 0.0, 0.12));
    const open = ease(seg(q, 0.9, 1));
    const t = q < 0.5 ? close : 1 - open;
    paper.style.clipPath = paperClip(t);
    paper.style.opacity = t > 0.995 ? 0 : 1;
    beam.style.transform = `translateX(-50%) scaleY(${t > 0.97 ? 1 : 0})`;

    // emerge from the dark under the beam
    const o = ease(seg(q, 0.12, 0.3));
    const out = ease(seg(q, 0.84, 0.92));        // dissolve into light
    const bright = 0.15 + 0.85 * o + out * 2.2;
    portrait.style.opacity = (o * (1 - out)).toFixed(3);
    portrait.style.filter = `brightness(${bright.toFixed(2)}) blur(${((1 - o) * 14 + out * 10).toFixed(1)}px)`;
    portrait.style.transform = `translateX(-50%) translateY(${(1 - o) * 4}%) scale(${(1.08 - 0.08 * o + out * 0.04).toFixed(3)})`;
    img.style.setProperty('--m', `${-18 + o * 118}%`);
    beam.style.setProperty('--glow', (o * (1 - out) + out).toFixed(3));

    cubes.forEach(c => {
      c.el.style.opacity = (o * (1 - out) * 0.9).toFixed(3);
      c.el.style.transform = `translateY(${(0.5 - q) * c.speed}px) rotate(${c.rot + q * 120}deg)`;
    });

    // story chapters
    const active = q < 0.32 || q > 0.86 ? -1 : q < 0.5 ? 0 : q < 0.68 ? 1 : 2;
    chapters.forEach((ch, i) => ch.classList.toggle('on', i === active));

    const ui = seg(q, 0.28, 0.34) * (1 - seg(q, 0.84, 0.88));
    badge.style.opacity = ui.toFixed(3);
    tag.style.opacity = ui.toFixed(3);
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(render); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  render();
})();
