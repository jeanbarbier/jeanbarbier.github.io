// Background animation, alternative to the Turing pattern: a faint culture of neurons, drawn
// like a fluorescence (calcium-imaging) recording. Each neuron has its own morphology: an
// irregular soma, tapering dendritic trees that branch as they grow, and one long meandering
// axon with a few collaterals. A neuron's outgoing synapses are the neurons its axon passes
// close to. Neurons fire at random; a firing neuron lights up as a whole (fast rise, slow
// calcium-like decay), an action potential runs down its axon, and each synapse it reaches
// fires its target with a probability set so that every firing sets off SIGMA others on
// average (a slightly subcritical branching process): cascades of all sizes, neuronal
// avalanches. Calcium-imaging green (pale green in light mode). Chosen with the neuron button
// in the header; the network and its activity are handed from page to page. Plain 2D canvas:
// the morphology is drawn once, each neuron's lit image is prepared once, and a frame only
// blends a few small images; ~30 frames per second, paused when the tab is hidden; nothing
// runs unless it is chosen.
(function () {
  'use strict';

  var KEY_MODE = 'bg-anim', KEY_STATE = 'bg-neurons-state', KEY_SEED = 'bg-neurons-seed';
  var SPACING = 120;          // mean distance between neurons, CSS px
  var SYNAPSE_REACH = 40;     // an axon passing this close to a soma makes a synapse
  var SIGMA = 0.9;            // mean number of neurons each firing sets off
  var SPONTANEOUS = 1 / 70;   // spontaneous firings per second, per neuron
  var SPEED = 260;            // action-potential speed along the axon, CSS px per second (slowed down to be seen)
  var REFRACTORY = 1.5, RISE = 0.06, DECAY = 0.9, LIT_LIFE = 3.5;   // seconds
  var SPRITE_SCALE = 0.5;     // lit images and the activity layer are drawn at half resolution
  var FRAME_MS = 33;

  var PALETTES = {
    dark: { process: [80, 220, 160], processAlpha: 0.075, halo: 0.025, soma: 0.24,
            lit: [140, 255, 195], litAlpha: 0.55, spike: [170, 255, 215], spikeAlpha: 0.5 },
    light: { process: [20, 135, 85], processAlpha: 0.09, halo: 0.03, soma: 0.26,
             lit: [25, 160, 95], litAlpha: 0.42, spike: [20, 150, 90], spikeAlpha: 0.45 }
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
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

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

  // ---- Morphology ----
  // A process is a polyline {pts: [x0, y0, x1, y1, ...], w: width}. Growth is a persistent
  // random walk; dendrites branch in two and thin out, the axon is long and meanders.
  function walk(rand, x, y, ang, len, step, wiggle) {
    var pts = [x, y], n = Math.max(2, Math.round(len / step)), drift = (rand() - 0.5) * wiggle * 0.3;
    for (var k = 0; k < n; k++) {
      ang += drift + (rand() - 0.5) * wiggle;
      x += Math.cos(ang) * step; y += Math.sin(ang) * step; pts.push(x, y);
    }
    return { pts: pts, ang: ang };
  }
  function dendrite(rand, x, y, ang, w, depth, out) {
    var seg = walk(rand, x, y, ang, (depth ? 9 : 14) + rand() * (depth ? 14 : 18), 3.5, 0.55);
    out.push({ pts: seg.pts, w: w });
    var n = seg.pts.length, ex = seg.pts[n - 2], ey = seg.pts[n - 1];
    if (depth >= 3) return;
    if (rand() < (depth === 0 ? 0.9 : 0.65)) {           // fork
      var spread = 0.3 + rand() * 0.5;
      dendrite(rand, ex, ey, seg.ang - spread, w * 0.72, depth + 1, out);
      dendrite(rand, ex, ey, seg.ang + spread, w * 0.72, depth + 1, out);
    } else if (rand() < 0.5) {
      dendrite(rand, ex, ey, seg.ang, w * 0.85, depth + 1, out);
    }
  }
  function makeNeuron(rand, x, y) {
    var nrn = { x: x, y: y, r: 2.6 + rand() * 2.2, rot: rand() * Math.PI, elong: 1 + rand() * 0.6,
                gain: 0.6 + rand() * 0.6, dend: [], axon: null, coll: [] };
    var nd = 3 + Math.floor(rand() * 4), a0 = rand() * 2 * Math.PI;
    for (var k = 0; k < nd; k++) {
      var a = a0 + (k + (rand() - 0.5) * 0.6) * 2 * Math.PI / nd;
      dendrite(rand, x + Math.cos(a) * nrn.r, y + Math.sin(a) * nrn.r, a, 1.5 + rand() * 0.5, 0, nrn.dend);
    }
    var aa = a0 + Math.PI / nd + (rand() - 0.5);              // axon leaves between two dendrites
    var ax = walk(rand, x + Math.cos(aa) * nrn.r, y + Math.sin(aa) * nrn.r, aa, 170 + rand() * 230, 4, 0.22);
    nrn.axon = { pts: ax.pts, w: 0.7 };
    var nc = 1 + Math.floor(rand() * 3), m = ax.pts.length / 2;
    for (var c = 0; c < nc; c++) {                            // collaterals branch off the axon
      var at = Math.floor(m * (0.3 + 0.6 * rand())), bx = ax.pts[2 * at], by = ax.pts[2 * at + 1];
      var dx = ax.pts[2 * at + 2] - bx, dy = ax.pts[2 * at + 3] - by;
      var ca = Math.atan2(dy, dx) + (rand() < 0.5 ? -1 : 1) * (0.6 + rand() * 0.7);
      nrn.coll.push({ pts: walk(rand, bx, by, ca, 40 + rand() * 80, 4, 0.3).pts, w: 0.5, at: at * 4 });
    }
    return nrn;
  }

  function strokeProcess(g, p) {
    g.beginPath(); g.moveTo(p.pts[0], p.pts[1]);
    for (var k = 2; k < p.pts.length; k += 2) g.lineTo(p.pts[k], p.pts[k + 1]);
    g.stroke();
  }
  function fillSoma(g, n) {
    g.beginPath(); g.ellipse(n.x, n.y, n.r * n.elong, n.r, n.rot, 0, 2 * Math.PI); g.fill();
  }

  // ---- The network ----
  var W = 0, H = 0, dpr = 1, neurons = [], lastFire, refractUntil, spikes = [], clock = 0;
  var spriteFor = null, spikeSprite = null, sparksDrawn = false;

  function build() {
    W = window.innerWidth; H = window.innerHeight; dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rand = rng(sessionSeed() ^ (W * 73856093) ^ (H * 19349663)), m = 160;
    // Somata scattered with a minimum distance (dart throwing), a little beyond the edges.
    var target = Math.round((W + 2 * m) * (H + 2 * m) / (SPACING * SPACING)), minD = SPACING * 0.62, tries = 0;
    neurons = [];
    while (neurons.length < target && tries++ < target * 40) {
      var x = -m + rand() * (W + 2 * m), y = -m + rand() * (H + 2 * m), ok = true;
      for (var i = 0; i < neurons.length && ok; i++) {
        var dx = neurons[i].x - x, dy = neurons[i].y - y; ok = dx * dx + dy * dy > minD * minD;
      }
      if (ok) neurons.push(makeNeuron(rand, x, y));
    }
    // Synapses: where an axon (or collateral) passes close to another soma, with its delay.
    neurons.forEach(function (nrn, i) {
      var best = {}, paths = [{ pts: nrn.axon.pts, s0: 0 }];
      nrn.coll.forEach(function (c) { paths.push({ pts: c.pts, s0: c.at }); });
      paths.forEach(function (p) {
        for (var k = 0; k < p.pts.length; k += 2) {
          var px = p.pts[k], py = p.pts[k + 1], s = p.s0 + k * 2;
          for (var j = 0; j < neurons.length; j++) {
            if (j === i) continue;
            var dx = neurons[j].x - px, dy = neurons[j].y - py;
            if (dx * dx + dy * dy < SYNAPSE_REACH * SYNAPSE_REACH && (!(j in best) || s < best[j])) best[j] = s;
          }
        }
      });
      nrn.syn = Object.keys(best).map(function (j) { return { to: +j, delay: best[j] / SPEED }; })
        .sort(function (a, b) { return a.delay - b.delay; });
      nrn.p = nrn.syn.length ? SIGMA / nrn.syn.length : 0;
      var len = 0, ap = nrn.axon.pts;                         // axon arc length, for the spike
      for (var k = 2; k < ap.length; k += 2) len += Math.hypot(ap[k] - ap[k - 2], ap[k + 1] - ap[k - 1]);
      nrn.axonLen = len;
    });
    lastFire = new Float64Array(neurons.length).fill(-1e9); refractUntil = new Float64Array(neurons.length);
    spikes = [];
    fiberCanvas.width = Math.round(W * dpr); fiberCanvas.height = Math.round(H * dpr);
    sparkCanvas.width = Math.round(W * SPRITE_SCALE); sparkCanvas.height = Math.round(H * SPRITE_SCALE);
    sparksDrawn = false; spriteFor = null;
    drawNetwork();
  }

  // The resting culture: faint processes with a soft halo, somata a little brighter.
  function drawNetwork() {
    var pal = PALETTES[theme()], g = fctx;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    g.lineCap = 'round'; g.lineJoin = 'round';
    neurons.forEach(function (n) {
      var procs = n.dend.concat([n.axon], n.coll), a = pal.processAlpha * (0.7 + 0.5 * n.gain);
      procs.forEach(function (p) {
        g.strokeStyle = rgba(pal.process, pal.halo); g.lineWidth = p.w * 3.2; strokeProcess(g, p);
        g.strokeStyle = rgba(pal.process, a); g.lineWidth = p.w; strokeProcess(g, p);
      });
      g.fillStyle = rgba(pal.process, pal.soma * (0.7 + 0.5 * n.gain)); fillSoma(g, n);
    });
  }

  // Each neuron's lit image (soma, dendrites, start of the axon), prepared once per colour scheme.
  function prepareSprites(pal) {
    if (spriteFor === pal) return;
    neurons.forEach(function (n) {
      var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, procs = n.dend.slice();
      procs.push({ pts: n.axon.pts.slice(0, 24), w: n.axon.w });
      procs.forEach(function (p) {
        for (var k = 0; k < p.pts.length; k += 2) {
          x0 = Math.min(x0, p.pts[k]); x1 = Math.max(x1, p.pts[k]); y0 = Math.min(y0, p.pts[k + 1]); y1 = Math.max(y1, p.pts[k + 1]);
        }
      });
      var pad = 14, s = SPRITE_SCALE, cv = document.createElement('canvas');
      cv.width = Math.ceil((x1 - x0 + 2 * pad) * s); cv.height = Math.ceil((y1 - y0 + 2 * pad) * s);
      var g = cv.getContext('2d');
      g.setTransform(s, 0, 0, s, (pad - x0) * s, (pad - y0) * s);
      g.lineCap = 'round'; g.lineJoin = 'round';
      procs.forEach(function (p) {
        g.strokeStyle = rgba(pal.lit, 0.35); g.lineWidth = p.w * 3; strokeProcess(g, p);
        g.strokeStyle = rgba(pal.lit, 1); g.lineWidth = p.w * 1.1; strokeProcess(g, p);
      });
      var glow = g.createRadialGradient(n.x, n.y, 0, n.x, n.y, 12);
      glow.addColorStop(0, rgba(pal.lit, 0.9)); glow.addColorStop(1, rgba(pal.lit, 0));
      g.fillStyle = glow; g.fillRect(n.x - 12, n.y - 12, 24, 24);
      g.fillStyle = rgba(pal.lit, 1); fillSoma(g, n);
      n.sprite = cv; n.sx = x0 - pad; n.sy = y0 - pad;
    });
    var sp = document.createElement('canvas'), R = 16; sp.width = sp.height = 2 * R;
    var sg = sp.getContext('2d'), grad = sg.createRadialGradient(R, R, 0, R, R, R);
    grad.addColorStop(0, rgba(pal.spike, 1)); grad.addColorStop(0.3, rgba(pal.spike, 0.5)); grad.addColorStop(1, rgba(pal.spike, 0));
    sg.fillStyle = grad; sg.fillRect(0, 0, 2 * R, 2 * R);
    spikeSprite = sp; spriteFor = pal;
  }

  // ---- Dynamics ----
  function fire(i) {
    if (clock < refractUntil[i]) return;
    lastFire[i] = clock; refractUntil[i] = clock + REFRACTORY;
    spikes.push({ i: i, t0: clock, next: 0 });
  }
  function calcium(age) { return age < 0 ? 0 : age < RISE ? age / RISE : Math.exp(-(age - RISE) / DECAY); }

  function advance(dt) {
    clock += dt;
    var n = neurons.length, expected = n * SPONTANEOUS * dt;
    while (expected > 0) { if (Math.random() < Math.min(1, expected)) fire(Math.floor(Math.random() * n)); expected -= 1; }
    var keep = [];
    for (var k = 0; k < spikes.length; k++) {
      var sp = spikes[k], nrn = neurons[sp.i], age = clock - sp.t0;
      while (sp.next < nrn.syn.length && nrn.syn[sp.next].delay <= age) {
        if (Math.random() < nrn.p) fire(nrn.syn[sp.next].to);
        sp.next++;
      }
      if (sp.next < nrn.syn.length || age * SPEED < nrn.axonLen) keep.push(sp);
    }
    spikes = keep;
  }

  function drawActivity() {
    var pal = PALETTES[theme()], active = spikes.length > 0;
    for (var a = 0; a < neurons.length && !active; a++) active = clock - lastFire[a] < LIT_LIFE;
    if (!active && !sparksDrawn) return;                // nothing lit, nothing to do
    prepareSprites(pal);
    var g = sctx, s = SPRITE_SCALE;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, sparkCanvas.width, sparkCanvas.height);
    sparksDrawn = active;
    for (var i = 0; i < neurons.length; i++) {          // neurons lighting up
      var c = calcium(clock - lastFire[i]);
      if (c < 0.01) continue;
      var n = neurons[i];
      g.globalAlpha = pal.litAlpha * n.gain * c;
      g.drawImage(n.sprite, n.sx * s, n.sy * s);
    }
    for (var k = 0; k < spikes.length; k++) {           // action potentials running down the axons
      var sp = spikes[k], nn = neurons[sp.i], d = (clock - sp.t0) * SPEED;
      if (d >= nn.axonLen) continue;
      var pts = nn.axon.pts, acc = 0, x = pts[0], y = pts[1];
      for (var q = 2; q < pts.length; q += 2) {
        var l = Math.hypot(pts[q] - pts[q - 2], pts[q + 1] - pts[q - 1]);
        if (acc + l >= d) { var f = (d - acc) / l; x = pts[q - 2] + f * (pts[q] - pts[q - 2]); y = pts[q - 1] + f * (pts[q + 1] - pts[q - 1]); break; }
        acc += l;
      }
      g.globalAlpha = pal.spikeAlpha * (1 - 0.6 * d / nn.axonLen);
      g.drawImage(spikeSprite, (x - 8) * s, (y - 8) * s, 16 * s, 16 * s);
    }
    g.globalAlpha = 1;
  }

  // ---- Handing the activity from page to page ----
  function saveState() {
    try {
      var fired = [];
      for (var i = 0; i < neurons.length; i++) if (clock - lastFire[i] < LIT_LIFE) fired.push([i, +(clock - lastFire[i]).toFixed(3)]);
      sessionStorage.setItem(KEY_STATE, JSON.stringify({ W: W, H: H, fired: fired,
        spikes: spikes.map(function (sp) { return [sp.i, +(clock - sp.t0).toFixed(3), sp.next]; }) }));
    } catch (e) {}
  }
  function loadState() {
    try {
      var o = JSON.parse(sessionStorage.getItem(KEY_STATE) || 'null');
      if (!o || o.W !== W || o.H !== H || !o.spikes) return false;
      o.fired.forEach(function (f) { if (f[0] < neurons.length) { lastFire[f[0]] = clock - f[1]; refractUntil[f[0]] = lastFire[f[0]] + REFRACTORY; } });
      spikes = o.spikes.filter(function (p) { return p[0] < neurons.length; })
        .map(function (p) { return { i: p[0], t0: clock - p[1], next: p[2] }; });
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
      last = now; advance(dt); drawActivity();
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
  window.addEventListener('pagehide', function () { if (built && mode() === 'neurons') saveState(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && built && mode() === 'neurons') saveState(); update(); });

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (!built) return;
      if (Math.abs(window.innerWidth - W) > 40 || Math.abs(window.innerHeight - H) > 120) build();
    }, 300);
  });
  function recolour() { if (built) { drawNetwork(); sparksDrawn = true; if (running) drawActivity(); } }
  new MutationObserver(recolour).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  if (darkMq.addEventListener) darkMq.addEventListener('change', recolour);
  update();
})();
