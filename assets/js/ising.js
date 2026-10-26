// Background animation, second choice: the 2D Ising model, by default at its critical temperature
// (T = Tc, Tc = 2 / ln(1 + sqrt 2) in units J = k_B = 1; visitors can set T
// from 0.5 to 2 Tc with the slider in the animation menu), seen as a faint lattice of up and
// down spins. Metropolis dynamics on a checkerboard, periodic edges. Close to Tc the
// correlation length is a few dozen spins, so clusters of all sizes form, merge and break up.
// Colours: up spins in the site's blue, down spins in the orange of the curve labels. Chosen
// from the animation menu in the header; the spins are handed from page to page. Plain 2D
// canvas at one pixel per spin, stretched by the browser; ~20 sweeps per second shown 10 times a
// second, paused when
// the tab is hidden; nothing runs unless it is chosen.
(function () {
  'use strict';

  var KEY_MODE = 'bg-anim', KEY_STATE = 'bg-ising-state';
  var KEY_T = 'bg-ising-T', T_DEFAULT = 1, T_MIN = 0.5, T_MAX = 2;   // temperature in units of Tc, set from the menu slider
  var TC = 2 / Math.log(1 + Math.SQRT2), T = T_DEFAULT * TC;
  var CELL = 5, MAX_SPINS = 80000;     // CSS px per spin; cap on the lattice size
  var FRAME_MS = 100, SWEEPS_PER_FRAME = 2, WARMUP = 600;   // ~20 sweeps/s drawn 10 times a second; sweeps before showing

  var PALETTES = {
    dark: { up: [90, 130, 230], down: [255, 149, 117], alpha: 0.13 },
    light: { up: [43, 71, 150], down: [232, 106, 69], alpha: 0.08 }
  };

  var canvas = document.querySelector('.bg-ising');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;
  var root = document.documentElement;
  var darkMq = window.matchMedia('(prefers-color-scheme: dark)');
  var calmMq = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Shared with turing.js, spinglass.js and bg-menu.js: 'turing' (default; also the old 'on' and
  // the archived 'neurons'), 'ising', 'spinglass' or 'off'.
  function mode() {
    var v = null;
    try { v = localStorage.getItem(KEY_MODE); } catch (e) {}
    if (v === 'ising' || v === 'spinglass' || v === 'off') return v;
    if (v === 'on' || v === 'turing' || v === 'neurons') return 'turing';   // neurons: archived, back to the default
    return calmMq.matches ? 'off' : 'turing';
  }
  function theme() { var t = root.getAttribute('data-theme'); return t ? t : (darkMq.matches ? 'dark' : 'light'); }

  // ---- The lattice ----
  var cols = 0, rows = 0, spin = null, sweeps = 0, img = null, words = null, colourFor = null;
  var ACC4, ACC8;                       // Metropolis acceptance for dE = 4, 8
  function storedT() {
    var v = NaN;
    try { v = parseFloat(localStorage.getItem(KEY_T)); } catch (e) {}
    return v >= T_MIN && v <= T_MAX ? v : T_DEFAULT;
  }
  function setTemperature() { T = storedT() * TC; ACC4 = Math.exp(-4 / T); ACC8 = Math.exp(-8 / T); }
  setTemperature();

  function gridSize() {
    var w = window.innerWidth, h = window.innerHeight, cell = CELL;
    while (Math.ceil(w / cell) * Math.ceil(h / cell) > MAX_SPINS) cell += 1;
    return [Math.ceil(w / cell), Math.ceil(h / cell)];
  }

  function setup(start) {
    var g = gridSize();
    var old = spin, oc = cols, or = rows;
    cols = g[0]; rows = g[1];
    spin = new Int8Array(cols * rows);
    if (start && start.c === cols && start.r === rows) spin.set(start.s);
    else if (old) {                      // resample the current configuration
      for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++)
        spin[y * cols + x] = old[Math.floor(y * or / rows) * oc + Math.floor(x * oc / cols)];
    } else {
      for (var i = 0; i < spin.length; i++) spin[i] = Math.random() < 0.5 ? 1 : -1;
    }
    canvas.width = cols; canvas.height = rows;
    img = ctx.createImageData(cols, rows);
    words = new Uint32Array(img.data.buffer);
    colourFor = null;
  }

  function sweep() {                     // one Metropolis sweep: both sublattices of the checkerboard
    for (var parity = 0; parity < 2; parity++) {
      for (var y = 0; y < rows; y++) {
        var up = (y === 0 ? rows - 1 : y - 1) * cols, mid = y * cols, dn = (y === rows - 1 ? 0 : y + 1) * cols;
        for (var x = (y + parity) & 1; x < cols; x += 2) {
          var i = mid + x, s = spin[i];
          var nb = spin[up + x] + spin[dn + x] + spin[mid + (x === 0 ? cols - 1 : x - 1)] + spin[mid + (x === cols - 1 ? 0 : x + 1)];
          var dE = 2 * s * nb;          // energy change of flipping s (J = 1)
          if (dE <= 0 || (dE === 4 ? Math.random() < ACC4 : Math.random() < ACC8)) spin[i] = -s;
        }
      }
    }
    sweeps++;
  }

  function draw() {
    var pal = PALETTES[theme()];
    if (colourFor !== pal) {
      // Uint32 pixel words (little-endian RGBA), non-premultiplied alpha
      var a = Math.round(255 * pal.alpha), le = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
      var pack = function (c) { return le ? ((a << 24) | (c[2] << 16) | (c[1] << 8) | c[0]) >>> 0 : ((c[0] << 24) | (c[1] << 16) | (c[2] << 8) | a) >>> 0; };
      pal.upWord = pack(pal.up); pal.downWord = pack(pal.down); colourFor = pal;
    }
    var u = pal.upWord, d = pal.downWord;
    for (var i = 0; i < spin.length; i++) words[i] = spin[i] > 0 ? u : d;
    ctx.putImageData(img, 0, 0);
  }

  // ---- Handing the spins from page to page (one bit per spin) ----
  function saveState() {
    try {
      var bytes = new Uint8Array(Math.ceil(spin.length / 8)), s = '';
      for (var i = 0; i < spin.length; i++) if (spin[i] > 0) bytes[i >> 3] |= 1 << (i & 7);
      for (var j = 0; j < bytes.length; j += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(j, j + 0x8000));
      sessionStorage.setItem(KEY_STATE, JSON.stringify({ c: cols, r: rows, d: btoa(s) }));
    } catch (e) {}
  }
  function loadState() {
    try {
      var o = JSON.parse(sessionStorage.getItem(KEY_STATE) || 'null');
      if (!o) return null;
      var bin = atob(o.d), n = o.c * o.r, s = new Int8Array(n);
      if (bin.length !== Math.ceil(n / 8)) return null;
      for (var i = 0; i < n; i++) s[i] = (bin.charCodeAt(i >> 3) >> (i & 7)) & 1 ? 1 : -1;
      return { c: o.c, r: o.r, s: s };
    } catch (e) { return null; }
  }

  // ---- Page ----
  var running = false, raf = 0, last = 0, warm = false;

  function frame(now) {
    raf = 0;
    if (!running) return;
    if (!warm) {                         // let the clusters grow off-screen, then fade in
      var t0 = performance.now();
      while (sweeps < WARMUP && performance.now() - t0 < 10) sweep();
      if (sweeps >= WARMUP) { warm = true; draw(); canvas.classList.add('is-ready'); }
    } else if (now - last >= FRAME_MS) {
      last = now; for (var k = 0; k < SWEEPS_PER_FRAME; k++) sweep(); draw();
    }
    raf = requestAnimationFrame(frame);
  }

  function update() {
    var on = mode() === 'ising', go = on && !document.hidden && !window.bgIdle;   // paused when hidden or idle (site.js)
    if (go && !running) {
      if (!spin) {
        var saved = loadState();
        setup(saved);
        if (saved && saved.c === cols && saved.r === rows) {   // coming from another page: show it at once
          warm = true; draw();
          canvas.classList.add('instant', 'is-ready');
          setTimeout(function () { canvas.classList.remove('instant'); }, 100);
        }
      }
      if (warm) canvas.classList.add('is-ready');
      running = true;
      if (!raf) raf = requestAnimationFrame(frame);
    } else if (!go && running) {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }
    if (!on) { canvas.classList.remove('is-ready'); try { sessionStorage.removeItem(KEY_STATE); } catch (e) {} }
  }

  document.addEventListener('bg-anim-change', update);
  document.addEventListener('bg-idle-change', update);
  document.addEventListener('bg-ising-temp', setTemperature);   // the slider applies at once
  window.addEventListener('pagehide', function () { if (spin && warm && mode() === 'ising') saveState(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && spin && warm && mode() === 'ising') saveState(); update(); });

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (!spin) return;
      var g = gridSize();
      if (Math.abs(g[0] - cols) / cols > 0.1 || Math.abs(g[1] - rows) / rows > 0.1) { setup(null); if (warm) draw(); }
    }, 300);
  });
  function recolour() { if (spin && warm) draw(); }
  new MutationObserver(recolour).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  if (darkMq.addEventListener) darkMq.addEventListener('change', recolour);
  update();
})();
