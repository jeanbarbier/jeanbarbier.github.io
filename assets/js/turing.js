// Misc page, dark mode only: a dim Turing pattern (Gray-Scott reaction-diffusion) slowly
// evolving behind the text. Kept cheap on purpose: a coarse grid (one cell per ~7 CSS px)
// stretched by the browser, about 20 frames per second, paused when the tab is hidden,
// one still frame for visitors who ask for reduced motion, nothing at all in light mode.
(function () {
  'use strict';

  // ---- Simulation (no DOM; also loadable in Node for testing) ----
  // Gray-Scott with Karl Sims' discretisation: Du = 1, Dv = 0.5, dt = 1, 3x3 Laplacian.
  // Feed f and kill k drift slowly along a loop through the maze / spots / dividing-spots
  // region, with a gentle spread across the page, so the pattern never freezes.
  function createSim(cols, rows, rand) {
    rand = rand || Math.random;
    var n = cols * rows;
    var u = new Float32Array(n), v = new Float32Array(n);
    var u2 = new Float32Array(n), v2 = new Float32Array(n);
    var fcol = new Float32Array(cols), kcol = new Float32Array(cols);
    var t = 0;

    function seed(count) {
      for (var s = 0; s < count; s++) {
        var cx = Math.floor(rand() * cols), cy = Math.floor(rand() * rows);
        for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) {
          var x = (cx + dx + cols) % cols, y = (cy + dy + rows) % rows, i = y * cols + x;
          u[i] = 0.5; v[i] = 0.25 + 0.05 * rand();
        }
      }
    }
    for (var i = 0; i < n; i++) { u[i] = 1; v[i] = 0; }
    seed(Math.max(8, Math.round(n / 350)));

    function params() {
      var a = (2 * Math.PI * t) / 16000;          // one loop every 16000 steps (~4.5 min)
      var f0 = 0.0455 + 0.0085 * Math.sin(a);
      var k0 = 0.0627 + 0.0012 * Math.sin(0.73 * a + 1.3);
      for (var x = 0; x < cols; x++) {
        var s = Math.sin((2 * Math.PI * x) / cols + 0.31 * a);
        fcol[x] = f0 + 0.0035 * s;
        kcol[x] = k0 - 0.0006 * s;
      }
    }

    function step(count) {
      for (var c = 0; c < count; c++) {
        if (t % 50 === 0) params();
        for (var y = 0; y < rows; y++) {
          var up = ((y - 1 + rows) % rows) * cols, mid = y * cols, dn = ((y + 1) % rows) * cols;
          for (var x = 0; x < cols; x++) {
            var l = x === 0 ? cols - 1 : x - 1, r = x === cols - 1 ? 0 : x + 1, i = mid + x;
            var uu = u[i], vv = v[i];
            var lu = 0.2 * (u[up + x] + u[dn + x] + u[mid + l] + u[mid + r]) +
                     0.05 * (u[up + l] + u[up + r] + u[dn + l] + u[dn + r]) - uu;
            var lv = 0.2 * (v[up + x] + v[dn + x] + v[mid + l] + v[mid + r]) +
                     0.05 * (v[up + l] + v[up + r] + v[dn + l] + v[dn + r]) - vv;
            var uvv = uu * vv * vv, f = fcol[x];
            u2[i] = uu + lu - uvv + f * (1 - uu);
            v2[i] = vv + 0.5 * lv + uvv - (kcol[x] + f) * vv;
          }
        }
        var tmp = u; u = u2; u2 = tmp; tmp = v; v = v2; v2 = tmp;
        t++;
        if (t % 400 === 0) {             // if the pattern ever dies out, plant a few new spots
          var m = 0;
          for (var j = 0; j < n; j += 7) m += v[j];
          if (m / (n / 7) < 0.004) seed(Math.max(4, Math.round(n / 1500)));
        }
      }
    }

    // Resample onto a new grid size (nearest neighbour) when the window changes a lot.
    function resized(c2, r2) {
      var s = createSim(c2, r2, rand), su = s._u(), sv = s._v();
      for (var y = 0; y < r2; y++) for (var x = 0; x < c2; x++) {
        var j = Math.floor((y * rows) / r2) * cols + Math.floor((x * cols) / c2);
        su[y * c2 + x] = u[j]; sv[y * c2 + x] = v[j];
      }
      s._setT(t);
      return s;
    }

    return {
      cols: cols, rows: rows, step: step, resized: resized,
      v: function () { return v; }, steps: function () { return t; },
      _u: function () { return u; }, _v: function () { return v; }, _setT: function (s) { t = s; }
    };
  }

  if (typeof module !== 'undefined' && module.exports) { module.exports = { createSim: createSim }; return; }

  // ---- Page ----
  var canvas = document.querySelector('.bg-turing');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d', { alpha: true });
  var root = document.documentElement;
  var darkMq = window.matchMedia('(prefers-color-scheme: dark)');
  var calmMq = window.matchMedia('(prefers-reduced-motion: reduce)');

  var CELL = 7, MAX_CELLS = 60000, WARMUP = 2500, STEPS_PER_FRAME = 3, FRAME_MS = 50;
  var sim = null, img = null, lut = null, running = false, raf = 0, last = 0, warm = false;

  // v -> colour: transparent where there is no pattern, a dim deep blue rising to teal
  // in the spots. Drawn with alpha over the page background, so it stays very faint.
  function buildLut() {
    lut = new Uint8ClampedArray(256 * 4);
    for (var i = 0; i < 256; i++) {
      var v = i / 255 * 0.5;
      var s = Math.min(1, Math.max(0, (v - 0.07) / 0.26));
      s = s * s * (3 - 2 * s);
      lut[4 * i] = 38 + (34 - 38) * s;
      lut[4 * i + 1] = 72 + (128 - 72) * s;
      lut[4 * i + 2] = 132 + (140 - 132) * s;
      lut[4 * i + 3] = 255 * 0.12 * s;
    }
  }

  function gridSize() {
    var w = window.innerWidth, h = window.innerHeight, cell = CELL;
    while (Math.ceil(w / cell) * Math.ceil(h / cell) > MAX_CELLS) cell += 1;
    return [Math.ceil(w / cell), Math.ceil(h / cell)];
  }

  function setup() {
    var g = gridSize();
    sim = sim ? sim.resized(g[0], g[1]) : createSim(g[0], g[1]);
    canvas.width = g[0]; canvas.height = g[1];
    img = ctx.createImageData(g[0], g[1]);
  }

  function draw() {
    var v = sim.v(), d = img.data;
    for (var i = 0, p = 0; i < v.length; i++, p += 4) {
      var q = v[i] * 510; q = q < 0 ? 0 : q > 255 ? 255 : q | 0; q *= 4;
      d[p] = lut[q]; d[p + 1] = lut[q + 1]; d[p + 2] = lut[q + 2]; d[p + 3] = lut[q + 3];
    }
    ctx.putImageData(img, 0, 0);
  }

  function frame(now) {
    raf = 0;
    if (!running) return;
    if (!warm) {                         // grow the first pattern off-screen, ~10 ms per frame
      var t0 = performance.now();
      while (sim.steps() < WARMUP && performance.now() - t0 < 10) sim.step(25);
      if (sim.steps() >= WARMUP) {
        warm = true; draw(); canvas.classList.add('is-ready');
        if (calmMq.matches) { running = false; return; }   // reduced motion: one still frame
      }
    } else if (now - last >= FRAME_MS) {
      last = now; sim.step(STEPS_PER_FRAME); draw();
    }
    raf = requestAnimationFrame(frame);
  }

  function isDark() {
    var t = root.getAttribute('data-theme');
    return t ? t === 'dark' : darkMq.matches;
  }

  function update() {
    var go = isDark() && !document.hidden && !(warm && calmMq.matches);
    if (go && !running) {
      if (!sim) { buildLut(); setup(); }
      running = true;
      if (!raf) raf = requestAnimationFrame(frame);
    } else if (!go && running) {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }
  }

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (!sim) return;
      var g = gridSize();
      if (Math.abs(g[0] - sim.cols) / sim.cols > 0.1 || Math.abs(g[1] - sim.rows) / sim.rows > 0.1) {
        setup(); if (warm) draw();
      }
    }, 300);
  });
  new MutationObserver(update).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  if (darkMq.addEventListener) darkMq.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  update();
})();
