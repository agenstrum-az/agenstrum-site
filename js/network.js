// Hero neural network: rings of agent nodes that converge on the emblem,
// with signals hopping inward along the connections into the logo.
(function () {
  const canvas = document.querySelector('.hero-art .neural');
  const orbital = document.querySelector('.hero-art .orbital');
  if (!canvas || !orbital || !canvas.getContext) return;

  const ctx = canvas.getContext('2d');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;

  // Ring radius as a multiple of the emblem radius, node count, angular speed (rad/s)
  const RINGS = [
    { k: 1.45, n: 8,  w: 0.06 },
    { k: 1.8,  n: 13, w: -0.035 },
    { k: 2.15, n: 18, w: 0.022 },
    { k: 2.5,  n: 24, w: -0.014 }
  ];
  const DRIFTERS = 22;
  const INTRO = 2.2; // seconds for nodes to converge into their rings

  let W = 0, H = 0, cx = 0, cy = 0, R = 100, dpr = 1;
  let nodes = [], drifters = [], pulses = [], ripples = [];
  let colors = {};
  let start = performance.now(), last = start, running = false, visible = true, raf = 0;
  let nextPulse = 0;
  const pointer = { x: -1e4, y: -1e4, on: false };

  const rand = (a, b) => a + Math.random() * (b - a);
  const easeOut = x => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3);

  function readColors() {
    const cs = getComputedStyle(canvas);
    const v = name => cs.getPropertyValue(name).trim();
    colors = {
      node: v('--net-node') || '#8B949D',
      edge: v('--net-edge') || '#7397CC',
      pulse: v('--net-pulse') || '#1D63D8',
      core: v('--net-core') || '#01265A'
    };
  }

  function build() {
    nodes = [];
    RINGS.forEach((ring, ri) => {
      const offset = rand(0, Math.PI * 2);
      for (let i = 0; i < ring.n; i++) {
        nodes.push({
          ring: ri,
          a0: offset + (i / ring.n) * Math.PI * 2 + rand(-0.12, 0.12),
          wob: rand(0, Math.PI * 2),
          wobF: rand(0.4, 0.9),
          size: ri === 0 ? 2.6 : rand(1.6, 2.4),
          scatter: rand(1.6, 3.2),   // how far out it starts before converging
          delay: rand(0, 0.5) + ri * 0.08,
          glow: 0,
          x: 0, y: 0, alpha: 0
        });
      }
    });
    drifters = Array.from({ length: DRIFTERS }, () => spawnDrifter(true));
  }

  function spawnDrifter(anywhere) {
    return {
      a: rand(0, Math.PI * 2),
      r: anywhere ? rand(2.5, 3.6) : rand(3.3, 3.8),  // in emblem radii
      v: rand(0.08, 0.18),                            // inward speed, radii/s
      spin: rand(-0.25, 0.25),
      size: rand(0.8, 1.6)
    };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W / 2; cy = H / 2;
    R = orbital.getBoundingClientRect().width / 2;
    if (reduceMotion) frame(performance.now());
  }

  function place(t) {
    const elapsed = (t - start) / 1000;
    for (const n of nodes) {
      const ring = RINGS[n.ring];
      const p = reduceMotion ? 1 : easeOut((elapsed - n.delay) / INTRO);
      const a = n.a0 + ring.w * elapsed;
      const wobble = reduceMotion ? 0 : Math.sin(elapsed * n.wobF + n.wob) * 0.05;
      const r = R * (ring.k + wobble) * (1 + (1 - p) * (n.scatter - 1));
      n.x = cx + Math.cos(a) * r;
      n.y = cy + Math.sin(a) * r;
      // Outer rings fade so the network never competes with the hero copy
      n.alpha = p * (1 - n.ring * 0.17);
    }
  }

  function nearestInner(n, count) {
    if (n.ring === 0) return [];
    const inner = nodes.filter(m => m.ring === n.ring - 1);
    inner.sort((a, b) => ((a.x - n.x) ** 2 + (a.y - n.y) ** 2) - ((b.x - n.x) ** 2 + (b.y - n.y) ** 2));
    return inner.slice(0, count);
  }

  function line(x1, y1, x2, y2, color, alpha, width) {
    if (alpha <= 0.003) return;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function dot(x, y, r, color, alpha) {
    if (alpha <= 0.003) return;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Where a node's spoke meets the emblem rim
  function rimPoint(n) {
    const a = Math.atan2(n.y - cy, n.x - cx);
    return { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R };
  }

  function spawnPulse() {
    const outer = nodes.filter(n => n.ring === RINGS.length - 1);
    let n = outer[Math.floor(Math.random() * outer.length)];
    const path = [n];
    while (n.ring > 0) {
      const opts = nearestInner(n, 2);
      n = opts[Math.floor(Math.random() * opts.length)];
      path.push(n);
    }
    path.push('core');
    pulses.push({ path, seg: 0, t: 0 });
  }

  function pathPoint(p, i) {
    const node = p.path[i];
    return node === 'core' ? rimPoint(p.path[i - 1]) : node;
  }

  function frame(t) {
    const dt = Math.min((t - last) / 1000, 0.05);
    last = t;
    place(t);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';

    // Drifting particles spiral inward and are absorbed by the outer ring
    if (!reduceMotion) {
      for (let i = 0; i < drifters.length; i++) {
        const d = drifters[i];
        d.r -= d.v * dt;
        d.a += d.spin * dt;
        if (d.r < RINGS[RINGS.length - 1].k) { drifters[i] = spawnDrifter(false); continue; }
        const fade = Math.min(1, (3.8 - d.r) / 0.6) * Math.min(1, (d.r - RINGS[RINGS.length - 1].k) / 0.4);
        dot(cx + Math.cos(d.a) * d.r * R, cy + Math.sin(d.a) * d.r * R, d.size, colors.node, 0.45 * fade);
      }
    }

    // Edges: spokes from the inner ring into the emblem, links between rings, and along each ring
    for (const n of nodes) {
      if (n.ring === 0) {
        const rp = rimPoint(n);
        line(n.x, n.y, rp.x, rp.y, colors.edge, 0.55 * n.alpha, 1.1);
      } else {
        for (const m of nearestInner(n, 2)) line(n.x, n.y, m.x, m.y, colors.edge, 0.38 * Math.min(n.alpha, m.alpha), 0.9);
      }
    }
    for (let ri = 0; ri < RINGS.length; ri++) {
      const ring = nodes.filter(n => n.ring === ri);
      ring.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
      for (let i = 0; i < ring.length; i += (ri > 1 ? 2 : 1)) {
        const a = ring[i], b = ring[(i + 1) % ring.length];
        line(a.x, a.y, b.x, b.y, colors.edge, 0.16 * Math.min(a.alpha, b.alpha), 0.8);
      }
    }

    // Pointer: nearby nodes reach toward the cursor
    if (pointer.on) {
      for (const n of nodes) {
        const d = Math.hypot(n.x - pointer.x, n.y - pointer.y);
        if (d < 130) {
          const k = 1 - d / 130;
          line(n.x, n.y, pointer.x, pointer.y, colors.pulse, 0.45 * k * n.alpha, 0.9);
          n.glow = Math.max(n.glow, k * 0.8);
        }
      }
      dot(pointer.x, pointer.y, 2.2, colors.pulse, 0.7);
    }

    // Signals travelling inward
    if (!reduceMotion) {
      const elapsed = (t - start) / 1000;
      if (elapsed > INTRO * 0.8 && t > nextPulse) {
        spawnPulse();
        nextPulse = t + rand(260, 620);
      }
      const speed = Math.max(R * 1.6, 140); // px/s
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        const a = pathPoint(p, p.seg), b = pathPoint(p, p.seg + 1);
        const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        p.t += (speed * dt) / len;
        if (p.t >= 1) {
          const reached = p.path[p.seg + 1];
          if (reached === 'core') {
            ripples.push({ a: Math.atan2(b.y - cy, b.x - cx), t: 0 });
            pulses.splice(i, 1);
            continue;
          }
          reached.glow = 1;
          p.seg++; p.t = 0;
          continue;
        }
        const x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
        const tail = Math.max(0, p.t - 0.35);
        line(a.x + (b.x - a.x) * tail, a.y + (b.y - a.y) * tail, x, y, colors.pulse, 0.85, 1.8);
        dot(x, y, 5, colors.pulse, 0.18);
        dot(x, y, 2.2, colors.pulse, 1);
      }
    }

    // Nodes (glowing briefly after a signal passes through)
    for (const n of nodes) {
      if (n.glow > 0.01) dot(n.x, n.y, n.size + 6 * n.glow, colors.pulse, 0.22 * n.glow * n.alpha);
      dot(n.x, n.y, n.size, n.glow > 0.3 ? colors.pulse : colors.node, n.alpha);
      n.glow *= Math.pow(0.12, dt);
    }

    // Arrival ripples on the emblem rim
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.t += dt / 0.9;
      if (r.t >= 1) { ripples.splice(i, 1); continue; }
      const e = easeOut(r.t);
      ctx.globalAlpha = (1 - r.t) * 0.7;
      ctx.strokeStyle = colors.pulse;
      ctx.lineWidth = 2 * (1 - r.t) + 0.5;
      ctx.beginPath();
      ctx.arc(cx, cy, R + 2 + e * 16, r.a - 0.5 - e * 0.6, r.a + 0.5 + e * 0.6);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  function loop(t) {
    frame(t);
    raf = running ? requestAnimationFrame(loop) : 0;
  }

  function play() {
    if (reduceMotion || running || !visible || document.hidden) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function pause() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  // Init
  readColors();
  build();
  resize();
  window.addEventListener('resize', resize);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);

  // Re-read colors when the theme changes
  new MutationObserver(() => { readColors(); if (reduceMotion) frame(performance.now()); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { readColors(); if (reduceMotion) frame(performance.now()); });

  // Only animate while the hero is on screen and the tab is visible
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    visible ? play() : pause();
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => document.hidden ? pause() : play());

  if (finePointer && !reduceMotion) {
    const hero = canvas.closest('.hero');
    hero.addEventListener('pointermove', e => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.on = true;
    });
    hero.addEventListener('pointerleave', () => { pointer.on = false; });
  }

  if (reduceMotion) frame(performance.now());
  else play();
})();
