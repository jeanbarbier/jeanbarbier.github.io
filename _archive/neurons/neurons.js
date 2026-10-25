// Background animation, alternative to the Turing pattern: a faint culture of neurons, drawn
// like a fluorescence (calcium-imaging) recording. Each neuron has its own morphology,
// pyramidal (one long apical dendrite with a tuft, short basal dendrites) or multipolar,
// with tapering dendrites that fork as they grow and one long meandering axon with a few
// collaterals; some lie slightly out of focus. A neuron's outgoing synapses are the neurons
// whose dendritic field its axon crosses. Neurons fire at random; a firing neuron lights up
// as a whole (fast rise, slow calcium-like decay, the nucleus staying darker), and its
// spike reaches its targets within a fraction of a second. Each target fires with
// probability SIGMA x R / out-degree, where R is the neuron's synaptic resources, depleted by
// firing and slowly recovered (short-term depression): mostly sparse activity and small
// avalanches, with occasional network bursts that die out as resources run low. Calcium-imaging green (pale green in light mode). Chosen from the animation menu
// in the header; the network and its activity are handed from page to page. Plain 2D canvas:
// the morphology is drawn once, each neuron's lit image is prepared once, and a frame only
// blends a few small images; ~30 frames per second, paused when the tab is hidden; nothing
// runs unless it is chosen.
(function () {
  'use strict';

  var KEY_MODE = 'bg-anim', KEY_STATE = 'bg-neurons-state', KEY_SEED = 'bg-neurons-seed';
  var SPACING = 120;          // mean distance between neurons, CSS px
  var SYNAPSE_REACH = 70;     // an axon passing this close to a soma (its dendritic field) makes a synapse
  var SIGMA = 1.4;            // neurons set off per firing when synaptic resources are full
  var DEPLETION = 0.5, RECOVERY = 6;   // fraction of resources used per firing; recovery time, s
  var SPONTANEOUS = 1 / 120;  // spontaneous firings per second, per neuron
  var SPEED = 1500, SYNAPTIC_DELAY = 0.015;   // spike speed along the axon, CSS px/s; delay at the synapse, s
  var REFRACTORY = 1.5, RISE = 0.07, DECAY = 0.85, LIT_LIFE = 4.5;   // seconds
  var SPRITE_SCALE = 0.5;     // lit images and the activity layer are drawn at half resolution
  var FRAME_MS = 33;

  var PALETTES = {
    dark: { process: [80, 220, 160], processAlpha: 0.05, halo: 0.015, soma: 0.16,
            lit: [140, 255, 195], litAlpha: 0.38 },
    light: { process: [20, 135, 85], processAlpha: 0.065, halo: 0.02, soma: 0.18,
             lit: [25, 160, 95], litAlpha: 0.3 }
  };

  var wrap = document.querySelector('.bg-neurons');
  if (!wrap) return;
  var fiberCanvas = wrap.querySelector('.bg-neurons-fibers'), sparkCanvas = wrap.querySelector('.bg-neurons-sparks');
  var fctx = fiberCanvas.getContext('2d'), sctx = sparkCanvas.getContext('2d');
  if (!fctx || !sctx) return;
  var root = document.documentElement;
  var darkMq = window.matchMedia('(prefers-color-scheme: dark)');
  var calmMq = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Shared with turing.js, ising.js and bg-menu.js: 'turing' (default, also the old 'on'),
  // 'neurons', 'ising' or 'off'.
  function mode() {
    var v = null;
    try { v = localStorage.getItem(KEY_MODE); } catch (e) {}
    if (v === 'on' || v === 'turing') return 'turing';
    if (v === 'neurons' || v === 'ising' || v === 'off') return v;
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
  function apical(rand, x, y, ang, out) {               // long trunk with oblique branches and a tuft
    var w = 2 + rand() * 0.5, len = 55 + rand() * 55, seg = walk(rand, x, y, ang, len, 3.5, 0.25);
    out.push({ pts: seg.pts, w: w });
    var n = seg.pts.length / 2;
    for (var k = 3; k < n - 3; k += 3 + Math.floor(rand() * 3)) {   // obliques
      if (rand() < 0.55) dendrite(rand, seg.pts[2 * k], seg.pts[2 * k + 1], seg.ang + (rand() < 0.5 ? -1 : 1) * (0.7 + rand() * 0.6), w * 0.5, 2, out);
    }
    var ex = seg.pts[seg.pts.length - 2], ey = seg.pts[seg.pts.length - 1];
    for (var t = 0; t < 3; t++) dendrite(rand, ex, ey, seg.ang + (t - 1) * (0.5 + rand() * 0.4), w * 0.6, 1, out);
  }
  function makeNeuron(rand, x, y) {
    var pyramidal = rand() < 0.6;
    var nrn = { x: x, y: y, r: 2.8 + rand() * 2.2, rot: rand() * Math.PI, elong: pyramidal ? 1.4 + rand() * 0.4 : 1 + rand() * 0.4,
                gain: 0.6 + rand() * 0.6, depth: rand(), decay: DECAY * (0.8 + rand() * 0.5), dend: [], axon: null, coll: [] };
    var a0 = rand() * 2 * Math.PI, nd;
    if (pyramidal) {
      nrn.rot = a0;                                          // soma elongated along the apical trunk
      apical(rand, x + Math.cos(a0) * nrn.r * nrn.elong, y + Math.sin(a0) * nrn.r * nrn.elong, a0, nrn.dend);
      nd = 3 + Math.floor(rand() * 3);
      for (var b = 0; b < nd; b++) {                          // short basal dendrites on the other side
        var ab = a0 + Math.PI + (b - (nd - 1) / 2) * (1.9 / nd) + (rand() - 0.5) * 0.3;
        var basal = [];
        dendrite(rand, x + Math.cos(ab) * nrn.r, y + Math.sin(ab) * nrn.r, ab, 1.2 + rand() * 0.3, 1, basal);
        nrn.dend = nrn.dend.concat(basal);
      }
    } else {
      nd = 3 + Math.floor(rand() * 4);
      for (var k = 0; k < nd; k++) {
        var a = a0 + (k + (rand() - 0.5) * 0.6) * 2 * Math.PI / nd;
        dendrite(rand, x + Math.cos(a) * nrn.r, y + Math.sin(a) * nrn.r, a, 1.5 + rand() * 0.5, 0, nrn.dend);
      }
    }
    var aa = pyramidal ? a0 + Math.PI + (rand() - 0.5) * 0.8 : a0 + Math.PI / nd + (rand() - 0.5);  // axon leaves from the base
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
  var spriteFor = null, sparksDrawn = false, res;

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
      nrn.syn = Object.keys(best).map(function (j) { return { to: +j, delay: best[j] / SPEED + SYNAPTIC_DELAY }; })
        .sort(function (a, b) { return a.delay - b.delay; });
      nrn.p = nrn.syn.length ? SIGMA / nrn.syn.length : 0;   // scaled by the resources at firing time
      var len = 0, ap = nrn.axon.pts;                         // axon arc length, for the spike
      for (var k = 2; k < ap.length; k += 2) len += Math.hypot(ap[k] - ap[k - 2], ap[k + 1] - ap[k - 1]);
      nrn.axonLen = len;
    });
    lastFire = new Float64Array(neurons.length).fill(-1e9); refractUntil = new Float64Array(neurons.length);
    res = new Float64Array(neurons.length).fill(1);
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
      var procs = n.dend.concat([n.axon], n.coll), blur = n.depth > 0.65 ? (n.depth - 0.65) / 0.35 : 0;
      var a = pal.processAlpha * (0.7 + 0.5 * n.gain) * (1 - 0.55 * blur);
      procs.forEach(function (p) {
        g.strokeStyle = rgba(pal.process, pal.halo * (1 + blur)); g.lineWidth = p.w * (3.2 + 4 * blur); strokeProcess(g, p);
        g.strokeStyle = rgba(pal.process, a); g.lineWidth = p.w * (1 + blur); strokeProcess(g, p);
      });
      g.fillStyle = rgba(pal.process, pal.soma * (0.7 + 0.5 * n.gain) * (1 - 0.4 * blur)); fillSoma(g, n);
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
      var blur = n.depth > 0.65 ? (n.depth - 0.65) / 0.35 : 0;
      procs.forEach(function (p, idx) {
        var axonPart = idx === procs.length - 1, k = axonPart ? 0.35 : 0.65;
        g.strokeStyle = rgba(pal.lit, 0.16 * k); g.lineWidth = p.w * (2 + 1.5 * blur); strokeProcess(g, p);
        g.strokeStyle = rgba(pal.lit, k * (1 - 0.4 * blur)); g.lineWidth = p.w * (0.85 + 0.5 * blur); strokeProcess(g, p);
      });
      var gr = 7 + 5 * blur, glow = g.createRadialGradient(n.x, n.y, 0, n.x, n.y, gr);
      glow.addColorStop(0, rgba(pal.lit, 0.6)); glow.addColorStop(1, rgba(pal.lit, 0));
      g.fillStyle = glow; g.fillRect(n.x - gr, n.y - gr, 2 * gr, 2 * gr);
      g.fillStyle = rgba(pal.lit, 1); fillSoma(g, n);
      g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = 'rgba(0,0,0,0.5)';   // the nucleus stays darker
      g.beginPath(); g.ellipse(n.x, n.y, n.r * n.elong * 0.55, n.r * 0.55, n.rot, 0, 2 * Math.PI); g.fill(); g.restore();
      n.sprite = cv; n.sx = x0 - pad; n.sy = y0 - pad;
    });
    spriteFor = pal;
  }

  // ---- Dynamics ----
  function fire(i) {
    if (clock < refractUntil[i]) return;
    lastFire[i] = clock; refractUntil[i] = clock + REFRACTORY;
    spikes.push({ i: i, t0: clock, next: 0, p: Math.min(1, neurons[i].p * res[i]) });
    res[i] -= DEPLETION * res[i];                            // short-term synaptic depression
  }
  function calcium(age, decay) { return age < 0 ? 0 : age < RISE ? age / RISE : Math.exp(-(age - RISE) / decay); }

  function advance(dt) {
    clock += dt;
    var n = neurons.length, expected = n * SPONTANEOUS * dt, rec = dt / RECOVERY;
    for (var r = 0; r < n; r++) res[r] += (1 - res[r]) * rec;
    while (expected > 0) { if (Math.random() < Math.min(1, expected)) fire(Math.floor(Math.random() * n)); expected -= 1; }
    var keep = [];
    for (var k = 0; k < spikes.length; k++) {
      var sp = spikes[k], nrn = neurons[sp.i], age = clock - sp.t0;
      while (sp.next < nrn.syn.length && nrn.syn[sp.next].delay <= age) {
        if (Math.random() < sp.p) fire(nrn.syn[sp.next].to);
        sp.next++;
      }
      if (sp.next < nrn.syn.length) keep.push(sp);
    }
    spikes = keep;
  }

  function drawActivity() {
    var pal = PALETTES[theme()], active = false;
    for (var a = 0; a < neurons.length && !active; a++) active = clock - lastFire[a] < LIT_LIFE;
    if (!active && !sparksDrawn) return;                // nothing lit, nothing to do
    prepareSprites(pal);
    var g = sctx, s = SPRITE_SCALE;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, sparkCanvas.width, sparkCanvas.height);
    sparksDrawn = active;
    for (var i = 0; i < neurons.length; i++) {          // neurons lighting up
      var c = calcium(clock - lastFire[i], neurons[i].decay);
      if (c < 0.01) continue;
      var n = neurons[i];
      g.globalAlpha = pal.litAlpha * n.gain * c;
      g.drawImage(n.sprite, n.sx * s, n.sy * s);
    }
    g.globalAlpha = 1;
  }

  // ---- Handing the activity from page to page ----
  function saveState() {
    try {
      var fired = [];
      for (var i = 0; i < neurons.length; i++) if (clock - lastFire[i] < LIT_LIFE) fired.push([i, +(clock - lastFire[i]).toFixed(3)]);
      sessionStorage.setItem(KEY_STATE, JSON.stringify({ W: W, H: H, fired: fired,
        res: Array.prototype.map.call(res, function (x) { return +x.toFixed(3); }),
        spikes: spikes.map(function (sp) { return [sp.i, +(clock - sp.t0).toFixed(3), sp.next, +sp.p.toFixed(3)]; }) }));
    } catch (e) {}
  }
  function loadState() {
    try {
      var o = JSON.parse(sessionStorage.getItem(KEY_STATE) || 'null');
      if (!o || o.W !== W || o.H !== H || !o.spikes || !o.res || o.res.length !== neurons.length) return false;
      for (var r = 0; r < neurons.length; r++) res[r] = o.res[r];
      o.fired.forEach(function (f) { if (f[0] < neurons.length) { lastFire[f[0]] = clock - f[1]; refractUntil[f[0]] = lastFire[f[0]] + REFRACTORY; } });
      spikes = o.spikes.filter(function (p) { return p[0] < neurons.length; })
        .map(function (p) { return { i: p[0], t0: clock - p[1], next: p[2], p: p[3] }; });
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
