(() => {
  const WORKS = window.WORKS || [];
  const wrap = document.querySelector('.stage-wrap');
  const world = document.getElementById('world');
  const light = document.getElementById('lightLayer');
  const intro = document.getElementById('intro');
  const l1 = document.getElementById('introL1');
  const l2 = document.getElementById('introL2');
  const capRibbon = document.getElementById('capRibbon');
  const capGrid = document.getElementById('capGrid');
  const capSphere = document.getElementById('capSphere');

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = innerWidth, H = innerHeight, mobile = W < 768;

  // ---------- build cards ----------
  const N = mobile ? 15 : 21;
  const cards = [];
  for (let i = 0; i < N; i++) {
    const cols0 = mobile ? 5 : 7;
    const w = WORKS[(i + Math.floor(i / cols0)) % WORKS.length];
    const el = document.createElement('button');
    el.className = 'card' + (w.thumb ? '' : ' soon');
    el.setAttribute('aria-label', `${w.title} — ${w.brand}, ${w.type}`);
    el.innerHTML =
      (w.thumb ? `<img src="${w.thumb}" alt="" loading="${i < 6 ? 'eager' : 'lazy'}" decoding="async">`
               : `<span class="soon-title">${w.title}</span>`) +
      (w.preview && !mobile ? `<video muted loop playsinline preload="none" src="${w.preview}"></video>` : '') +
      `<span class="card-meta"><b>${w.title}</b><i>${w.brand} · ${w.type}</i></span>`;
    el.addEventListener('click', () => openModal(w));
    world.appendChild(el);
    cards.push({ el, video: el.querySelector('video'), playing: false });
  }

  // ---------- helpers ----------
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const mix = (A, B, t) => {
    const o = {};
    for (const k in A) o[k] = lerp(A[k], B[k], t);
    return o;
  };

  // ---------- sizes ----------
  let cw, ch, sphere = [];
  function measure() {
    W = innerWidth; H = innerHeight;
    cw = mobile ? Math.min(W * 0.36, H * 0.42 * 0.5625) : Math.min(W * 0.14, H * 0.5 * 0.5625);
    ch = cw * 16 / 9;
    document.documentElement.style.setProperty('--w', cw + 'px');
    document.documentElement.style.setProperty('--h', ch + 'px');
    // fibonacci sphere points
    sphere = [];
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      sphere.push({ lat: Math.asin(y), lon: i * ga });
    }
  }

  // ---------- states ----------
  function ribbon(i, off) {
    const R = mobile ? W * 1.1 : Math.max(W * 0.5, 640);
    const step = (cw * 1.1) / R;
    const th = (i - (N - 1) / 2) * step + off;
    return {
      x: R * Math.sin(th),
      y: Math.sin(th * 1.6 + off) * ch * 0.16,
      z: R * Math.cos(th) - R,
      ry: th * 180 / Math.PI, rx: 0, s: 1,
      o: clamp(Math.cos(th) * 2.2),
    };
  }
  function grid(i) {
    const cols = mobile ? 5 : 7, rows = Math.ceil(N / cols);
    const gap = 1.08;
    const s = Math.min((W * (mobile ? .94 : .86)) / (cols * cw * gap), (H * (mobile ? .58 : .62)) / (rows * ch * gap));
    const c = i % cols, r = Math.floor(i / cols);
    return {
      x: (c - (cols - 1) / 2) * cw * gap * s,
      y: (r - (rows - 1) / 2) * ch * gap * s + H * 0.08,
      z: 0, ry: 0, rx: 0, s, o: 1,
    };
  }
  function ball(i, spin) {
    const R = Math.min(W, H) * (mobile ? .32 : .3);
    const pt = sphere[i];
    const lon = pt.lon + spin, lat = pt.lat;
    const tilt = -0.25;
    let x = R * Math.cos(lat) * Math.sin(lon);
    let y = -R * Math.sin(lat);
    let z = R * Math.cos(lat) * Math.cos(lon);
    // tilt whole sphere around X
    const y2 = y * Math.cos(tilt) - z * Math.sin(tilt);
    const z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
    return {
      x: x + (mobile ? 0 : W * 0.25),
      y: y2 + (mobile ? -H * 0.14 : 0),
      z: z2,
      ry: lon * 180 / Math.PI,
      rx: (lat - tilt) * 180 / Math.PI,
      s: mobile ? .42 : .55,
      o: z2 > -R * 0.15 ? 1 : 0.55,
    };
  }

  // ---------- render ----------
  function render(p) {
    const off = lerp(2.8, -0.5, seg(p, 0.02, 0.5));
    const m1 = ease(seg(p, 0.42, 0.56));      // ribbon -> grid
    const m2 = ease(seg(p, 0.68, 0.82));      // grid -> sphere
    const spin = p * 7;
    const enter = ease(seg(p, 0.0, 0.1));

    cards.forEach((c, i) => {
      let st = ribbon(i, off);
      st.o *= enter;
      if (m1 > 0) st = mix(st, grid(i), m1);
      if (m2 > 0) st = mix(st, ball(i, spin), m2);
      c.el.style.transform =
        `translate3d(${st.x}px,${st.y}px,${st.z}px) rotateY(${st.ry}deg) rotateX(${st.rx}deg) scale(${st.s})`;
      c.el.style.opacity = st.o.toFixed(3);
      c.el.style.backfaceVisibility = m2 > 0.5 ? 'visible' : 'hidden';
      c.el.style.zIndex = Math.round(1000 + st.z);
      c.el.style.pointerEvents = st.o > 0.5 ? 'auto' : 'none';
      // play previews only where they're big and facing us
      const front = (m1 > 0.9 && m2 < 0.2) || (m1 < 0.1 && st.o > 0.9 && Math.abs(st.ry) < 25 && p > 0.08);
      setPlaying(c, front);
    });

    // world tilt for the ribbon
    const tilt = (1 - m1);
    world.style.transform = `rotateZ(${-6 * tilt}deg) rotateX(${8 * tilt}deg)`;

    // intro text splits apart and fades
    const t = seg(p, 0.02, 0.16);
    l1.style.transform = `translateX(${-t * 30}vw)`;
    l2.style.transform = `translateX(${t * 30}vw)`;
    intro.style.opacity = 1 - t;

    capRibbon.style.opacity = (seg(p, 0.12, 0.18) * (1 - seg(p, 0.38, 0.44))).toFixed(3);
    capGrid.style.opacity = (seg(p, 0.52, 0.58) * (1 - seg(p, 0.64, 0.68))).toFixed(3);

    // light wipe from bottom
    const lw = ease(seg(p, 0.62, 0.72));
    light.style.clipPath = `inset(${(1 - lw) * 100}% 0 0 0)`;
    capSphere.style.opacity = seg(p, 0.8, 0.88).toFixed(3);
  }

  function setPlaying(c, on) {
    if (!c.video || c.playing === on) return;
    c.playing = on;
    if (on) {
      if (c.video.preload === 'none') c.video.preload = 'auto';
      c.video.play().then(() => c.el.classList.add('playing')).catch(() => {});
    } else {
      c.video.pause();
      c.el.classList.remove('playing');
    }
  }

  // ---------- scroll loop ----------
  let target = 0, current = 0, raf = null;
  function readScroll() {
    const r = wrap.getBoundingClientRect();
    target = clamp(-r.top / (r.height - H));
  }
  function tick() {
    current += (target - current) * 0.1;
    if (Math.abs(target - current) < 0.0004) current = target;
    render(current);
    raf = current === target ? null : requestAnimationFrame(tick);
  }
  function kick() { readScroll(); if (!raf) raf = requestAnimationFrame(tick); }

  measure();
  if (reduced) {
    // no motion: show the grid and let people scroll past
    wrap.style.height = '100vh';
    render(0.6);
  } else {
    readScroll(); current = target; render(current);
    addEventListener('scroll', kick, { passive: true });
  }
  addEventListener('resize', () => {
    const wasMobile = mobile;
    mobile = innerWidth < 768;
    if (wasMobile !== mobile) location.reload();
    measure(); render(reduced ? 0.6 : current);
  });

  // ---------- modal ----------
  const modal = document.getElementById('modal');
  const frame = document.getElementById('modalFrame');
  function openModal(w) {
    frame.src = w.url.replace(/\/?$/, '/') + 'embed';
    document.getElementById('modalLink').href = w.url;
    document.getElementById('modalTitle').textContent = `${w.title} · ${w.brand}`;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    frame.src = 'about:blank';
    document.body.style.overflow = '';
  }
  modal.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeModal(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
})();
