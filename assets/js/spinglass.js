// Background animation, third choice: a 2D spin glass, the +-J Edwards-Anderson model on a square
// lattice (each coupling J = +1 or -1 at random, periodic edges, energy E = -sum J s s). The
// spins themselves look like noise, so what is drawn is the frustration. A plaquette whose four
// couplings multiply to -1 is frustrated: no choice of its four spins satisfies all four bonds.
// Frustrated plaquettes are drawn as fixed orange dots; the currently unsatisfied bonds are drawn
// in blue as segments of the dual lattice, crossing the bond. Every frustrated plaquette ends an
// odd number of such segments and every other plaquette an even number, so the segments form
// strings that pair frustrated plaquettes; a ground state is a pairing of minimum total length
// (a minimum-weight matching). Dynamics: Metropolis single-spin flips at random sites, at
// temperature T in units of J (slider in the animation menu, default 0.8 J; in 2D the spin-glass
// transition is at T = 0, so at any T > 0 the system is in its paramagnetic phase, but
// relaxation becomes very slow at low T). Low T: short strings, mostly neighbouring pairs, which
// keep rearranging through zero-energy flips; high T: the strings lengthen and tangle. Segments
// fade in and out rather than blink. The couplings come from a per-visit seed and the spins are
// handed from page to page. Plain 2D canvas, 20 frames per second, redrawing only the cells that
// change; paused when the tab is hidden; nothing runs unless it is chosen.
(function () {
  'use strict';

  var KEY_MODE = 'bg-anim', KEY_STATE = 'bg-sg-state', KEY_SEED = 'bg-sg-seed';
  var KEY_T = 'bg-sg-T', T_DEFAULT = 0.8, T_MIN = 0.2, T_MAX = 2.5;   // temperature in units of J
  var CELL = 26;                       // CSS px between neighbouring spins
  var FRAME_MS = 50;                   // 20 frames per second
  var RATE = 1.5;                      // flip attempts per spin per second
  var ZERO = 0.12;                     // acceptance of zero-energy flips (any value keeps detailed balance; small = calm)
  var FADE = 0.25;                     // per-frame easing of each segment's opacity (about half a second)
  var WARMUP = 500, T_ANNEAL = 2.5;    // sweeps of annealing from T_ANNEAL down to T before showing

  var PALETTES = {
    dark: { string: [147, 174, 239], stringAlpha: 0.24, dot: [255, 149, 117], dotAlpha: 0.32 },
    light: { string: [43, 71, 150], stringAlpha: 0.17, dot: [232, 106, 69], dotAlpha: 0.24 }
  };

  var wrap = document.querySelector('.bg-sg');
  if (!wrap) return;
  var dotCanvas = wrap.querySelector('.bg-sg-dots'), strCanvas = wrap.querySelector('.bg-sg-strings');
  if (!dotCanvas || !strCanvas || !dotCanvas.getContext) return;
  var dctx = dotCanvas.getContext('2d'), sctx = strCanvas.getContext('2d');
  if (!dctx || !sctx) return;
  var root = document.documentElement;
  var darkMq = window.matchMedia('(prefers-color-scheme: dark)');
  var calmMq = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Shared with turing.js, ising.js and bg-menu.js.
  function mode() {
    var v = null;
    try { v = localStorage.getItem(KEY_MODE); } catch (e) {}
    if (v === 'ising' || v === 'spinglass' || v === 'off') return v;
    if (v === 'on' || v === 'turing' || v === 'neurons') return 'turing';   // neurons: archived, back to the default
    return calmMq.matches ? 'off' : 'turing';
  }
  function theme() { var t = root.getAttribute('data-theme'); return t ? t : (darkMq.matches ? 'dark' : 'light'); }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')'; }

  function rng(seed) {                   // mulberry32: the couplings are reproducible from the seed
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0; var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function sessionSeed() {               // one disorder realisation per visit, kept from page to page
    var s = null;
    try { s = sessionStorage.getItem(KEY_SEED); } catch (e) {}
    if (!s) { s = String(Math.floor(Math.random() * 4294967295)); try { sessionStorage.setItem(KEY_SEED, s); } catch (e) {} }
    return parseInt(s, 10) >>> 0;
  }

  // ---- Temperature ----
  var T = T_DEFAULT, ACC4, ACC8, warm = false;   // Metropolis acceptance for dE = 4, 8
  function storedT() {
    var v = NaN;
    try { v = parseFloat(localStorage.getItem(KEY_T)); } catch (e) {}
    return v >= T_MIN && v <= T_MAX ? v : T_DEFAULT;
  }
  function setAcc(t) { ACC4 = Math.exp(-4 / t); ACC8 = Math.exp(-8 / t); }
  function setTemperature() { T = storedT(); if (warm) setAcc(T); }

  // ---- Lattice: spin (x, y) at (x, y) * CELL; Jx couples it to (x+1, y), Jy to (x, y+1) ----
  var W = 0, H = 0, dpr = 1, cols = 0, rows = 0, n = 0;
  var spin, Jx, Jy, frus, aX, aY, sweeps = 0;

  function gridSize() {                  // margins keep the periodic seam off-screen (and absorb a phone's toolbar)
    return [Math.ceil(window.innerWidth / CELL) + 2, Math.ceil((window.innerHeight + 120) / CELL) + 1];
  }
  function sizeCanvases() {
    W = window.innerWidth; H = window.innerHeight; dpr = Math.min(window.devicePixelRatio || 1, 2);
    dotCanvas.width = strCanvas.width = Math.round(W * dpr);
    dotCanvas.height = strCanvas.height = Math.round(H * dpr);
  }

  function build(saved) {
    var g = gridSize(); cols = g[0]; rows = g[1]; n = cols * rows;
    var rand = rng(sessionSeed() ^ Math.imul(cols, 73856093) ^ Math.imul(rows, 19349663));
    Jx = new Int8Array(n); Jy = new Int8Array(n); spin = new Int8Array(n);
    for (var i = 0; i < n; i++) { Jx[i] = rand() < 0.5 ? 1 : -1; Jy[i] = rand() < 0.5 ? 1 : -1; }
    if (saved && saved.c === cols && saved.r === rows) spin.set(saved.s);
    else for (i = 0; i < n; i++) spin[i] = Math.random() < 0.5 ? 1 : -1;
    // Plaquette (x, y) has spin (x, y) at its top-left corner; its bonds are Jx(x, y), Jy(x+1, y),
    // Jx(x, y+1) and Jy(x, y).
    frus = new Uint8Array(n);
    for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
      var j = y * cols + x, r = y * cols + (x + 1) % cols, d = ((y + 1) % rows) * cols + x;
      frus[j] = Jx[j] * Jy[r] * Jx[d] * Jy[j] < 0 ? 1 : 0;
    }
    aX = new Float32Array(n); aY = new Float32Array(n); lvX = new Uint8Array(n); lvY = new Uint8Array(n);
    inAct = new Uint8Array(n); act.length = 0;
    sweeps = 0;
    sizeCanvases(); drawDots();
  }

  function dE(i) {                       // energy change of flipping spin i
    var x = i % cols, mid = i - x, y = mid / cols;
    var l = mid + (x === 0 ? cols - 1 : x - 1), r = mid + (x === cols - 1 ? 0 : x + 1);
    var u = (y === 0 ? rows - 1 : y - 1) * cols + x, d = (y === rows - 1 ? 0 : y + 1) * cols + x;
    return 2 * spin[i] * (Jx[i] * spin[r] + Jx[l] * spin[l] + Jy[i] * spin[d] + Jy[u] * spin[u]);
  }
  function accept(e, zero) { return e < 0 || (e === 0 ? Math.random() < zero : e === 4 ? Math.random() < ACC4 : Math.random() < ACC8); }

  function sweep() {                     // warm-up: one ordered sweep, zero-energy flips always accepted
    for (var i = 0; i < n; i++) if (accept(dE(i), 1)) spin[i] = -spin[i];
    sweeps++;
  }
  function attempts(k) {                 // running: k flip attempts at random sites
    for (var a = 0; a < k; a++) {
      var i = (Math.random() * n) | 0;
      if (!accept(dE(i), ZERO)) continue;
      spin[i] = -spin[i];
      // its four bonds start fading: they belong to spin i (right and down) and to its left and upper neighbors
      var x = i % cols, mid = i - x;
      activate(i); activate(mid + (x === 0 ? cols - 1 : x - 1)); activate((mid === 0 ? n : mid) - cols + x);
    }
  }
  var act = [], inAct;                   // spins whose bonds are fading
  function activate(j) { if (!inAct[j]) { inAct[j] = 1; act.push(j); } }

  // ---- Drawing ----
  function drawDots() {                  // frustrated plaquettes: fixed by the couplings, drawn once
    var pal = PALETTES[theme()], rad = 1.7;
    dctx.setTransform(dpr, 0, 0, dpr, 0, 0); dctx.clearRect(0, 0, W, H);
    dctx.fillStyle = rgba(pal.dot, pal.dotAlpha); dctx.beginPath();
    for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
      if (!frus[y * cols + x]) continue;
      var px = (x + 0.5) * CELL, py = (y + 0.5) * CELL;
      if (px > W + rad || py > H + rad) continue;
      dctx.moveTo(px + rad, py); dctx.arc(px, py, rad, 0, 2 * Math.PI);
    }
    dctx.fill();
  }

  // Unsatisfied bond (x, y)-(x+1, y): vertical segment at x + 1/2 from y - 1/2 to y + 1/2 (it joins
  // plaquettes (x, y-1) and (x, y)). Unsatisfied bond (x, y)-(x, y+1): horizontal segment at y + 1/2
  // from x - 1/2 to x + 1/2. So the two bonds of spin (x, y) are the right and bottom edges of the
  // square of side CELL centred on it. Each bond's opacity is eased towards 0 or 1 and shown in
  // LEVELS steps (lvX, lvY), one path per step. Only the squares whose bonds changed step are
  // redrawn, unless many changed at once (high temperature): then the whole layer is redrawn.
  var LEVELS = 6, SNAP = 0.5 / LEVELS, FULL_LIMIT = 300, LINE = 1.3;
  var bins = [], dirty = [], tx = 0, ty = 0, lvX, lvY;
  for (var q = 0; q <= LEVELS; q++) bins.push([]);
  function target(i) {                   // sets tx, ty: is each of the two bonds of spin i unsatisfied?
    var x = i % cols, mid = i - x, y = mid / cols;
    var r = mid + (x === cols - 1 ? 0 : x + 1), d = (y === rows - 1 ? 0 : y + 1) * cols + x;
    tx = Jx[i] * spin[i] * spin[r] < 0 ? 1 : 0; ty = Jy[i] * spin[i] * spin[d] < 0 ? 1 : 0;
  }
  function settle() {                    // no fading: every bond at its current state
    for (var i = 0; i < n; i++) { target(i); aX[i] = tx; aY[i] = ty; lvX[i] = tx * LEVELS; lvY[i] = ty * LEVELS; inAct[i] = 0; }
    act.length = 0;
  }
  function ease() {                      // one frame of fading; fills `dirty` with squares to redraw
    dirty.length = 0;
    for (var k = act.length - 1; k >= 0; k--) {
      var j = act[k]; target(j);
      var ax = aX[j] + (tx - aX[j]) * FADE, ay = aY[j] + (ty - aY[j]) * FADE;
      if (Math.abs(tx - ax) < SNAP) ax = tx;
      if (Math.abs(ty - ay) < SNAP) ay = ty;
      aX[j] = ax; aY[j] = ay;
      var qx = Math.round(ax * LEVELS), qy = Math.round(ay * LEVELS);
      if (qx !== lvX[j] || qy !== lvY[j]) { lvX[j] = qx; lvY[j] = qy; dirty.push(j); }
      if (ax === tx && ay === ty) { inAct[j] = 0; act[k] = act[act.length - 1]; act.pop(); }
    }
  }
  function push(j, cx, cy) {             // the two bonds of spin j, drawn around (cx, cy)
    var h = CELL / 2;
    if (lvX[j]) bins[lvX[j]].push(cx + h, cy - h, cx + h, cy + h);
    if (lvY[j]) bins[lvY[j]].push(cx - h, cy + h, cx + h, cy + h);
  }
  function strokeBins(pal) {
    sctx.lineWidth = LINE; sctx.lineCap = 'round';
    for (var q = 1; q <= LEVELS; q++) {
      var p = bins[q]; if (!p.length) continue;
      sctx.strokeStyle = rgba(pal.string, pal.stringAlpha * q / LEVELS);
      sctx.beginPath();
      for (var k = 0; k < p.length; k += 4) { sctx.moveTo(p[k], p[k + 1]); sctx.lineTo(p[k + 2], p[k + 3]); }
      sctx.stroke(); p.length = 0;
    }
  }
  function drawAll() {
    var pal = PALETTES[theme()], h = CELL / 2;
    for (var y = 0; y < rows && y * CELL - h <= H; y++)
      for (var x = 0; x < cols && x * CELL - h <= W; x++) push(y * cols + x, x * CELL, y * CELL);
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0); sctx.clearRect(0, 0, W, H);
    strokeBins(pal);
  }
  function drawSquares(list) {           // clear each square (pixel-aligned) and redraw everything that crosses it
    var pal = PALETTES[theme()], h = CELL / 2 + LINE + 1;
    for (var k = 0; k < list.length; k++) {
      var j = list[k], x = j % cols, y = (j - x) / cols, cx = x * CELL, cy = y * CELL;
      if (cx - h > W || cy - h > H) continue;
      var x0 = Math.floor((cx - h) * dpr), y0 = Math.floor((cy - h) * dpr);
      var w = Math.ceil((cx + h) * dpr) - x0, hh = Math.ceil((cy + h) * dpr) - y0;
      sctx.save();
      sctx.setTransform(1, 0, 0, 1, 0, 0);
      sctx.beginPath(); sctx.rect(x0, y0, w, hh); sctx.clip(); sctx.clearRect(x0, y0, w, hh);
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        var xx = (x + dx + cols) % cols, yy = (y + dy + rows) % rows;
        push(yy * cols + xx, (x + dx) * CELL, (y + dy) * CELL);
      }
      strokeBins(pal);
      sctx.restore();
    }
  }
  function drawStrings() {               // one frame
    ease();
    if (dirty.length > FULL_LIMIT) drawAll(); else if (dirty.length) drawSquares(dirty);
  }

  // ---- Handing the spins from page to page (one bit per spin; the couplings come from the seed) ----
  function saveState() {
    try {
      var bytes = new Uint8Array(Math.ceil(n / 8)), s = '';
      for (var i = 0; i < n; i++) if (spin[i] > 0) bytes[i >> 3] |= 1 << (i & 7);
      for (var j = 0; j < bytes.length; j += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(j, j + 0x8000));
      sessionStorage.setItem(KEY_STATE, JSON.stringify({ c: cols, r: rows, d: btoa(s) }));
    } catch (e) {}
  }
  function loadState() {
    try {
      var o = JSON.parse(sessionStorage.getItem(KEY_STATE) || 'null');
      if (!o) return null;
      var bin = atob(o.d), m = o.c * o.r, s = new Int8Array(m);
      if (bin.length !== Math.ceil(m / 8)) return null;
      for (var i = 0; i < m; i++) s[i] = (bin.charCodeAt(i >> 3) >> (i & 7)) & 1 ? 1 : -1;
      return { c: o.c, r: o.r, s: s };
    } catch (e) { return null; }
  }

  // ---- Page ----
  var built = false, running = false, raf = 0, last = 0, carry = 0;

  function frame(now) {
    raf = 0;
    if (!running) return;
    if (!warm) {                         // anneal off-screen, then fade in
      var t0 = performance.now();
      while (sweeps < WARMUP && performance.now() - t0 < 10) {
        setAcc(T_ANNEAL + (T - T_ANNEAL) * Math.min(1, sweeps / (0.8 * WARMUP)));
        sweep();
      }
      if (sweeps >= WARMUP) { warm = true; setAcc(T); settle(); drawAll(); wrap.classList.add('is-ready'); last = now; }
    } else if (now - last >= FRAME_MS) {
      var dt = Math.min(now - last, 200); last = now;
      carry += n * RATE * dt / 1000;
      var k = carry | 0; carry -= k;
      attempts(k);
      drawStrings();
    }
    raf = requestAnimationFrame(frame);
  }

  function update() {
    var on = mode() === 'spinglass', go = on && !document.hidden && !window.bgIdle;   // paused when hidden or idle (site.js)
    if (go && !running) {
      if (!built) {
        T = storedT();
        var saved = loadState();
        build(saved); built = true;
        if (saved && saved.c === cols && saved.r === rows) {   // coming from another page: show it at once
          warm = true; setAcc(T); settle(); drawAll();
          wrap.classList.add('instant', 'is-ready');
          setTimeout(function () { wrap.classList.remove('instant'); }, 100);
        }
      }
      if (warm) wrap.classList.add('is-ready');
      running = true; last = performance.now();
      if (!raf) raf = requestAnimationFrame(frame);
    } else if (!go && running) {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }
    if (!on) { wrap.classList.remove('is-ready'); try { sessionStorage.removeItem(KEY_STATE); } catch (e) {} }
  }

  document.addEventListener('bg-anim-change', update);
  document.addEventListener('bg-idle-change', update);
  document.addEventListener('bg-sg-temp', setTemperature);   // the slider applies at once
  window.addEventListener('pagehide', function () { if (built && warm && mode() === 'spinglass') saveState(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && built && warm && mode() === 'spinglass') saveState(); update(); });

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (!built) return;
      var g = gridSize();
      if (g[0] > cols || g[1] > rows || g[0] < 0.8 * cols || g[1] < 0.8 * rows) {   // a new lattice
        build(null); warm = false; wrap.classList.remove('is-ready');
      } else {                           // the lattice still covers the window: just redraw
        sizeCanvases(); drawDots(); if (warm) drawAll();
      }
    }, 300);
  });
  function recolour() { if (built) { drawDots(); if (warm) drawAll(); } }
  new MutationObserver(recolour).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  if (darkMq.addEventListener) darkMq.addEventListener('change', recolour);
  update();
})();
