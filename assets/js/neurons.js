// Background animation, alternative to the Turing pattern: a faint network of neurons that fire
// at random. A firing neuron flashes and sends pulses along its fibers; a pulse makes the next
// neuron fire with a probability set so that each firing triggers on average SIGMA others (a
// slightly subcritical branching process), hence cascades of all sizes: neuronal avalanches.
// Colours: calcium-imaging green (pale green in light mode). Chosen with the neuron button in
// the header; the network and its activity are handed from page to page. Plain 2D canvas, ~30
// frames per second, paused when the tab is hidden; nothing runs unless it is chosen.
(function () {
  'use strict';

  var KEY_MODE = 'bg-anim', KEY_STATE = 'bg-neurons-state', KEY_SEED = 'bg-neurons-seed';
  var SPACING = 72;           // CSS px between neighbouring neurons
  var LINKS = 3;              // each neuron links to its 3 nearest neighbours (mean degree ~4)
  var SIGMA = 0.85;           // mean number of neurons each firing sets off
  var SPONTANEOUS = 1 / 200;  // spontaneous firings per second, per neuron
  var SPEED = 220;            // pulse speed along a fiber, CSS px per second
  var REFRACTORY = 1.2, FLASH_TAU = 0.5, FLASH_LIFE = 2;   // seconds
  var MAX_PULSES = 600, FRAME_MS = 33;
  var SPARK_SCALE = 0.5;      // flashes and pulses are drawn at half resolution (soft anyway): ~4x cheaper

  var PALETTES = {
    dark: { fiber: 'rgba(70, 210, 160, 0.07)', soma: 'rgba(90, 230, 170, 0.22)', glow: [110, 255, 190],
            glowAlpha: 0.32, pulse: [150, 255, 210], pulseAlpha: 0.55 },
    light: { fiber: 'rgba(20, 140, 90, 0.08)', soma: 'rgba(20, 150, 95, 0.22)', glow: [30, 170, 100],
             glowAlpha: 0.22, pulse: [20, 150, 90], pulseAlpha: 0.5 }
  };

  var wrap = document.querySelector('.bg-neurons');
  if (!wrap) return;
  var fiberCanvas = wrap.querySelector('.bg-neurons-fibers'), sparkCanvas = wrap.querySelector('.bg-neurons-sparks');
  var fctx = fiberCanvas.getContext('2d'), sctx = sparkCanvas.getContext('2d');
  if (!fctx || !sctx) return;
  var btn = document.querySelector('.neuron-toggle');
  var root = document.documentElement;
  var darkMq = window.matchMedia('(prefers-color-scheme: dark)');
  var calmMq = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Shared with turing.js: 'turing' (default, also the old 'on'), 'neurons' or 'off'.
  function mode() {
    var v = null;
    try { v = localStorage.getItem(KEY_MODE); } catch (e) {}
    if (v === 'on' || v === 'turing') return 'turing';
    if (v === 'neurons' || v === 'off') return v;
    return calmMq.matches ? 'off' : 'turing';
  }
  function theme() { var t = root.getAttribute('data-theme'); return t ? t : (darkMq.matches ? 'dark' : 'light'); }

  function rng(seed) {                  // small seeded generator, so a page change keeps the network
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0; var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function sessionSeed() {
    var s = null;
    try { s = sessionStorage.getItem(KEY_SEED); } catch (e) {}
    if (!s) { s = String(Math.floor(Math.random() * 4294967295)); try { sessionStorage.setItem(KEY_SEED, s); } catch (e) {} }
    return parseInt(s, 10);
  }

  // ---- The network ----
  var W = 0, H = 0, dpr = 1, nx = [], ny = [], edges = [], adj = [], lastFire, refractUntil;
  var pulses = [], clock = 0, sprite = null, spriteFor = null, sparksDrawn = false;

  function build() {
    W = window.innerWidth; H = window.innerHeight; dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rand = rng(sessionSeed() ^ (W * 73856093) ^ (H * 19349663));
    var cols = Math.ceil(W / SPACING) + 1, rows = Math.ceil(H / SPACING) + 1, cell = [];
    nx = []; ny = [];
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {   // one neuron per cell, jittered
      cell.push(nx.length);
      nx.push((c - 0.5 + 0.1 + 0.8 * rand()) * SPACING);
      ny.push((r - 0.5 + 0.1 + 0.8 * rand()) * SPACING);
    }
    var n = nx.length, seen = {};
    edges = []; adj = []; for (var i = 0; i < n; i++) adj.push([]);
    for (i = 0; i < n; i++) {
      var ci = i % cols, ri = Math.floor(i / cols), near = [];
      for (var dr = -2; dr <= 2; dr++) for (var dc = -2; dc <= 2; dc++) {
        var rr = ri + dr, cc = ci + dc;
        if (rr < 0 || cc < 0 || rr >= rows || cc >= cols || (dr === 0 && dc === 0)) continue;
        var j = cell[rr * cols + cc], dx = nx[j] - nx[i], dy = ny[j] - ny[i];
        near.push([dx * dx + dy * dy, j]);
      }
      near.sort(function (p, q) { return p[0] - q[0]; });
      for (var m = 0; m < LINKS && m < near.length; m++) {
        var jj = near[m][1], key = i < jj ? i + ',' + jj : jj + ',' + i;
        if (seen[key]) continue;
        seen[key] = 1;
        var mx = (nx[i] + nx[jj]) / 2, my = (ny[i] + ny[jj]) / 2, ex = nx[jj] - nx[i], ey = ny[jj] - ny[i];
        var bend = (rand() - 0.5) * 0.5, len = Math.sqrt(ex * ex + ey * ey);
        edges.push({ a: i, b: jj, cx: mx - ey * bend, cy: my + ex * bend, T: len * (1 + bend * bend) / SPEED });
        adj[i].push(edges.length - 1); adj[jj].push(edges.length - 1);
      }
    }
    lastFire = new Float64Array(n).fill(-1e9); refractUntil = new Float64Array(n);
    pulses = [];
    fiberCanvas.width = Math.round(W * dpr); fiberCanvas.height = Math.round(H * dpr);
    sparkCanvas.width = Math.round(W * SPARK_SCALE); sparkCanvas.height = Math.round(H * SPARK_SCALE);
    sparksDrawn = false;
    drawFibers();
  }

  function drawFibers() {
    var pal = PALETTES[theme()];
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fctx.clearRect(0, 0, W, H);
    fctx.strokeStyle = pal.fiber; fctx.lineWidth = 1; fctx.beginPath();
    edges.forEach(function (e) { fctx.moveTo(nx[e.a], ny[e.a]); fctx.quadraticCurveTo(e.cx, e.cy, nx[e.b], ny[e.b]); });
    fctx.stroke();
    fctx.fillStyle = pal.soma; fctx.beginPath();
    for (var i = 0; i < nx.length; i++) { fctx.moveTo(nx[i] + 1.8, ny[i]); fctx.arc(nx[i], ny[i], 1.8, 0, 2 * Math.PI); }
    fctx.fill();
    sprite = null;                      // glow colour may have changed
  }

  function glowSprite(pal) {            // soft round glow, drawn once per colour scheme
    if (sprite && spriteFor === pal) return sprite;
    var s = document.createElement('canvas'), R = 32; s.width = s.height = 2 * R;
    var g = s.getContext('2d'), grad = g.createRadialGradient(R, R, 0, R, R, R), c = pal.glow.join(',');
    grad.addColorStop(0, 'rgba(' + c + ',1)'); grad.addColorStop(0.25, 'rgba(' + c + ',0.55)');
    grad.addColorStop(1, 'rgba(' + c + ',0)');
    g.fillStyle = grad; g.fillRect(0, 0, 2 * R, 2 * R);
    sprite = s; spriteFor = pal; return s;
  }

  // ---- Dynamics ----
  function fire(i) {
    if (clock < refractUntil[i]) return;
    lastFire[i] = clock; refractUntil[i] = clock + REFRACTORY;
    var list = adj[i];
    for (var k = 0; k < list.length && pulses.length < MAX_PULSES; k++) {
      var e = edges[list[k]];
      pulses.push({ e: list[k], to: e.a === i ? e.b : e.a, t0: clock, p: SIGMA / list.length });
    }
  }

  function advance(dt) {
    clock += dt;
    var n = nx.length, expected = n * SPONTANEOUS * dt;      // spontaneous firings this frame
    while (expected > 0) { if (Math.random() < Math.min(1, expected)) fire(Math.floor(Math.random() * n)); expected -= 1; }
    var keep = [];
    for (var k = 0; k < pulses.length; k++) {
      var pu = pulses[k];
      if (clock - pu.t0 >= edges[pu.e].T) { if (Math.random() < pu.p) fire(pu.to); }
      else keep.push(pu);
    }
    pulses = keep;
  }

  function drawSparks() {
    var pal = PALETTES[theme()], spr = glowSprite(pal), active = pulses.length > 0;
    for (var a = 0; a < nx.length && !active; a++) active = clock - lastFire[a] <= FLASH_LIFE;
    if (!active && !sparksDrawn) return;                // nothing on screen, nothing to do
    sctx.setTransform(SPARK_SCALE, 0, 0, SPARK_SCALE, 0, 0);
    sctx.clearRect(0, 0, W, H);
    sparksDrawn = active;
    for (var i = 0; i < nx.length; i++) {               // flashes of recently fired neurons
      var age = clock - lastFire[i];
      if (age > FLASH_LIFE) continue;
      sctx.globalAlpha = pal.glowAlpha * Math.exp(-age / FLASH_TAU);
      sctx.drawImage(spr, nx[i] - 20, ny[i] - 20, 40, 40);
    }
    var c = 'rgb(' + pal.pulse.join(',') + ')';
    sctx.fillStyle = c;
    for (var k = 0; k < pulses.length; k++) {           // pulses travelling along the fibers
      var pu = pulses[k], e = edges[pu.e], s = (clock - pu.t0) / e.T;
      var fromA = pu.to === e.b, ax = fromA ? nx[e.a] : nx[e.b], ay = fromA ? ny[e.a] : ny[e.b];
      var bx = fromA ? nx[e.b] : nx[e.a], by = fromA ? ny[e.b] : ny[e.a];
      for (var tr = 0; tr < 3; tr++) {                  // a dot with a short tail
        var u = Math.max(0, s - tr * 0.04), v = 1 - u;
        var x = v * v * ax + 2 * v * u * e.cx + u * u * bx, y = v * v * ay + 2 * v * u * e.cy + u * u * by;
        sctx.globalAlpha = pal.pulseAlpha * (1 - tr * 0.35);
        sctx.beginPath(); sctx.arc(x, y, 1.6 - tr * 0.3, 0, 2 * Math.PI); sctx.fill();
      }
    }
    sctx.globalAlpha = 1;
  }

  // ---- Handing the activity from page to page ----
  function saveState() {
    try {
      var fired = [];
      for (var i = 0; i < nx.length; i++) if (clock - lastFire[i] < FLASH_LIFE) fired.push([i, +(clock - lastFire[i]).toFixed(3)]);
      sessionStorage.setItem(KEY_STATE, JSON.stringify({ W: W, H: H, fired: fired,
        pulses: pulses.map(function (pu) { return [pu.e, pu.to, +(clock - pu.t0).toFixed(3), pu.p]; }) }));
    } catch (e) {}
  }
  function loadState() {
    try {
      var o = JSON.parse(sessionStorage.getItem(KEY_STATE) || 'null');
      if (!o || o.W !== W || o.H !== H) return false;
      o.fired.forEach(function (f) { if (f[0] < nx.length) { lastFire[f[0]] = clock - f[1]; refractUntil[f[0]] = lastFire[f[0]] + REFRACTORY; } });
      pulses = o.pulses.filter(function (p) { return p[0] < edges.length; })
        .map(function (p) { return { e: p[0], to: p[1], t0: clock - p[2], p: p[3] }; });
      return true;
    } catch (e) { return false; }
  }

  // ---- Page ----
  var built = false, running = false, raf = 0, last = 0;

  function frame(now) {
    raf = 0;
    if (!running) return;
    if (now - last >= FRAME_MS) {
      var dt = last ? Math.min(0.1, (now - last) / 1000) : FRAME_MS / 1000;
      last = now; advance(dt); drawSparks();
    }
    raf = requestAnimationFrame(frame);
  }

  function update() {
    var on = mode() === 'neurons';
    if (btn) btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    var go = on && !document.hidden;
    if (go && !running) {
      if (!built) {
        build(); built = true;
        if (loadState()) {                 // coming from another page: show it at once
          wrap.classList.add('instant', 'is-ready');
          setTimeout(function () { wrap.classList.remove('instant'); }, 100);
        }
      }
      wrap.classList.add('is-ready');
      running = true; last = 0;
      if (!raf) raf = requestAnimationFrame(frame);
    } else if (!go && running) {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }
    if (!on) { wrap.classList.remove('is-ready'); try { sessionStorage.removeItem(KEY_STATE); } catch (e) {} }
  }

  if (btn) btn.addEventListener('click', function () {
    try { localStorage.setItem(KEY_MODE, mode() === 'neurons' ? 'off' : 'neurons'); } catch (e) {}
    document.dispatchEvent(new Event('bg-anim-change'));
  });
  document.addEventListener('bg-anim-change', update);
  window.addEventListener('pagehide', function () { if (running || (built && mode() === 'neurons')) saveState(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && built && mode() === 'neurons') saveState(); update(); });

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (!built) return;
      if (Math.abs(window.innerWidth - W) > 40 || Math.abs(window.innerHeight - H) > 120) build();
    }, 300);
  });
  function recolour() { if (built) { drawFibers(); if (running) drawSparks(); } }
  new MutationObserver(recolour).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  if (darkMq.addEventListener) darkMq.addEventListener('change', recolour);
  update();
})();
