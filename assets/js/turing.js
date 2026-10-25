// Misc page: a faint Turing pattern (Gray-Scott reaction-diffusion) slowly evolving behind
// the text: deep blue-teal in dark mode, pale orange in light mode.
// Runs on the GPU (WebGL2) when it can, where it costs almost nothing; otherwise on the CPU.
// Either way the grid is coarse (one cell per ~7 CSS px, stretched by the browser), it runs
// at ~30 frames per second, pauses when the tab is hidden, and visitors who ask for reduced
// motion get one still frame.
(function () {
  'use strict';

  var LOOP = 16000;             // steps for one loop of the slow parameter drift
  var STEPS_PER_FRAME = 10, FRAME_MS = 33, WARMUP = 2500;

  // Feed f and kill k drift along a loop through the maze / spots / dividing-spots region,
  // with a gentle spread across the page, so the pattern never freezes.
  function params(t) {
    var a = (2 * Math.PI * t) / LOOP;
    return { f0: 0.0455 + 0.0085 * Math.sin(a), k0: 0.0627 + 0.0012 * Math.sin(0.73 * a + 1.3), ph: 0.31 * a };
  }

  function initialState(cols, rows, rand) {
    var n = cols * rows, u = new Float32Array(n), v = new Float32Array(n);
    for (var i = 0; i < n; i++) u[i] = 1;
    var count = Math.max(8, Math.round(n / 350));
    for (var s = 0; s < count; s++) {
      var cx = Math.floor(rand() * cols), cy = Math.floor(rand() * rows);
      for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) {
        var j = ((cy + dy + rows) % rows) * cols + ((cx + dx + cols) % cols);
        u[j] = 0.5; v[j] = 0.25 + 0.05 * rand();
      }
    }
    return { u: u, v: v };
  }

  // ---- CPU simulation (fallback; also loadable in Node for testing) ----
  // Karl Sims' discretisation: Du = 1, Dv = 0.5, dt = 1, 3x3 Laplacian, periodic edges.
  function createSim(cols, rows, rand, start) {
    rand = rand || Math.random;
    var n = cols * rows, st = start || initialState(cols, rows, rand);
    var u = st.u, v = st.v, u2 = new Float32Array(n), v2 = new Float32Array(n);
    var fcol = new Float32Array(cols), kcol = new Float32Array(cols), t = 0;

    function setParams() {
      var p = params(t);
      for (var x = 0; x < cols; x++) {
        var q = Math.sin((2 * Math.PI * x) / cols + p.ph);
        fcol[x] = p.f0 + 0.0035 * q; kcol[x] = p.k0 - 0.0006 * q;
      }
    }

    function step(count) {
      for (var c = 0; c < count; c++) {
        if (t % 10 === 0) setParams();
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
      }
    }

    function resized(c2, r2) {
      var nu = new Float32Array(c2 * r2), nv = new Float32Array(c2 * r2);
      for (var y = 0; y < r2; y++) for (var x = 0; x < c2; x++) {
        var j = Math.floor((y * rows) / r2) * cols + Math.floor((x * cols) / c2);
        nu[y * c2 + x] = u[j]; nv[y * c2 + x] = v[j];
      }
      var s = createSim(c2, r2, rand, { u: nu, v: nv }); s.setSteps(t); return s;
    }

    return {
      cols: cols, rows: rows, step: step, resized: resized,
      v: function () { return v; }, steps: function () { return t; }, setSteps: function (s) { t = s; }
    };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createSim: createSim, params: params };
    return;
  }

  // ---- Colours ----
  // Dark: deep blue rising to teal. Light: a much paler version of the header-label orange.
  var PALETTES = {
    dark: { lo: [38, 72, 132], hi: [34, 128, 140], alpha: 0.12 },
    light: { lo: [240, 150, 90], hi: [232, 106, 69], alpha: 0.11 }
  };
  function shade(v) { var s = Math.min(1, Math.max(0, (v - 0.07) / 0.26)); return s * s * (3 - 2 * s); }

  // ---- GPU simulation (WebGL2, float textures) ----
  var VERT = '#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0.0,1.0);}';
  var SIM = '#version 300 es\nprecision highp float;uniform sampler2D s;uniform vec2 size;uniform float f0,k0,ph;out vec4 o;' +
    'vec2 at(vec2 d){return texture(s,(gl_FragCoord.xy+d)/size).xy;}' +
    'void main(){vec2 c=at(vec2(0.0));' +
    'vec2 l=0.2*(at(vec2(1,0))+at(vec2(-1,0))+at(vec2(0,1))+at(vec2(0,-1)))+0.05*(at(vec2(1,1))+at(vec2(1,-1))+at(vec2(-1,1))+at(vec2(-1,-1)))-c;' +
    'float q=sin(6.2831853*(gl_FragCoord.x-0.5)/size.x+ph);float f=f0+0.0035*q,k=k0-0.0006*q;float uvv=c.x*c.y*c.y;' +
    'o=vec4(c.x+l.x-uvv+f*(1.0-c.x),c.y+0.5*l.y+uvv-(k+f)*c.y,0.0,1.0);}';
  var SHOW = '#version 300 es\nprecision highp float;uniform sampler2D s;uniform vec2 size;uniform vec3 lo,hi;uniform float alpha;out vec4 o;' +
    'void main(){float v=texture(s,gl_FragCoord.xy/size).y;float t=smoothstep(0.07,0.33,v);float a=alpha*t;' +
    'o=vec4(mix(lo,hi,t)*a,a);}';
  var COPY = '#version 300 es\nprecision highp float;uniform sampler2D s;uniform vec2 size;out vec4 o;' +
    'void main(){o=texture(s,gl_FragCoord.xy/size);}';

  function createGpu(canvas, cols, rows) {
    var gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false,
      stencil: false, preserveDrawingBuffer: false, powerPreference: 'low-power' });
    if (!gl || !gl.getExtension('EXT_color_buffer_float')) return null;

    function program(fsrc) {
      var p = gl.createProgram();
      [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, fsrc]].forEach(function (sh) {
        var s = gl.createShader(sh[0]); gl.shaderSource(s, sh[1]); gl.compileShader(s); gl.attachShader(p, s);
      });
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
      var u = {}, nu = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (var i = 0; i < nu; i++) { var name = gl.getActiveUniform(p, i).name; u[name] = gl.getUniformLocation(p, name); }
      return { p: p, u: u };
    }
    var sim = program(SIM), show = program(SHOW), copy = program(COPY);
    if (!sim || !show || !copy) return null;

    function target(w, h, data) {
      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w, h, 0, gl.RGBA, gl.FLOAT, data || null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      var fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      var ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return ok ? { tex: tex, fb: fb } : null;
    }

    var st = initialState(cols, rows, Math.random), data = new Float32Array(cols * rows * 4);
    for (var i = 0; i < cols * rows; i++) { data[4 * i] = st.u[i]; data[4 * i + 1] = st.v[i]; }
    var a = target(cols, rows, data), b = target(cols, rows, null), t = 0;
    if (!a || !b) return null;
    gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST);

    function pass(prog, src, dst, w, h) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, dst ? dst.fb : null);
      gl.viewport(0, 0, w, h);
      gl.useProgram(prog.p);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, src.tex);
      gl.uniform1i(prog.u.s, 0); gl.uniform2f(prog.u.size, w, h);
    }

    var api = {
      cols: cols, rows: rows,
      steps: function () { return t; },
      step: function (count) {
        for (var c = 0; c < count; c++) {
          var p = params(t);
          pass(sim, a, b, api.cols, api.rows);
          gl.uniform1f(sim.u.f0, p.f0); gl.uniform1f(sim.u.k0, p.k0); gl.uniform1f(sim.u.ph, p.ph);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          var tmp = a; a = b; b = tmp; t++;
        }
      },
      draw: function (pal) {
        pass(show, a, null, api.cols, api.rows);
        gl.uniform3f(show.u.lo, pal.lo[0] / 255, pal.lo[1] / 255, pal.lo[2] / 255);
        gl.uniform3f(show.u.hi, pal.hi[0] / 255, pal.hi[1] / 255, pal.hi[2] / 255);
        gl.uniform1f(show.u.alpha, pal.alpha);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
      resized: function (c2, r2) {      // resample the current pattern onto the new grid
        var na = target(c2, r2, null), nb = target(c2, r2, null);
        if (!na || !nb) return api;
        pass(copy, a, na, c2, r2); gl.drawArrays(gl.TRIANGLES, 0, 3);
        [a, b].forEach(function (x) { gl.deleteTexture(x.tex); gl.deleteFramebuffer(x.fb); });
        a = na; b = nb; api.cols = c2; api.rows = r2;
        return api;
      }
    };
    return api;
  }

  // ---- Page ----
  var canvas = document.querySelector('.bg-turing');
  if (!canvas) return;
  var root = document.documentElement;
  var darkMq = window.matchMedia('(prefers-color-scheme: dark)');
  var calmMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var CELL = 7, MAX_CELLS = 60000;
  var engine = null, gpu = false, ctx = null, img = null, lut = null, lutFor = null;
  var running = false, raf = 0, last = 0, warm = false;

  function theme() {
    var t = root.getAttribute('data-theme');
    return t ? t : (darkMq.matches ? 'dark' : 'light');
  }

  function gridSize() {
    var w = window.innerWidth, h = window.innerHeight, cell = CELL;
    while (Math.ceil(w / cell) * Math.ceil(h / cell) > MAX_CELLS) cell += 1;
    return [Math.ceil(w / cell), Math.ceil(h / cell)];
  }

  function setup() {
    var g = gridSize();
    canvas.width = g[0]; canvas.height = g[1];
    engine = createGpu(canvas, g[0], g[1]);
    if (engine) { gpu = true; return; }
    // No usable WebGL2: a canvas keeps its first context type, so start from a fresh one.
    var fresh = canvas.cloneNode(false); canvas.parentNode.replaceChild(fresh, canvas); canvas = fresh;
    canvas.width = g[0]; canvas.height = g[1];
    ctx = canvas.getContext('2d');
    if (!ctx) return;
    engine = createSim(g[0], g[1]);
    img = ctx.createImageData(g[0], g[1]);
  }

  function draw() {
    var pal = PALETTES[theme()];
    if (gpu) { engine.draw(pal); return; }
    if (lutFor !== pal) {
      lut = new Uint8ClampedArray(256 * 4); lutFor = pal;
      for (var i = 0; i < 256; i++) {
        var s = shade((i / 255) * 0.5);
        for (var c = 0; c < 3; c++) lut[4 * i + c] = pal.lo[c] + (pal.hi[c] - pal.lo[c]) * s;
        lut[4 * i + 3] = 255 * pal.alpha * s;
      }
    }
    var v = engine.v(), d = img.data;
    for (var j = 0, p = 0; j < v.length; j++, p += 4) {
      var q = v[j] * 510; q = q < 0 ? 0 : q > 255 ? 255 : q | 0; q *= 4;
      d[p] = lut[q]; d[p + 1] = lut[q + 1]; d[p + 2] = lut[q + 2]; d[p + 3] = lut[q + 3];
    }
    ctx.putImageData(img, 0, 0);
  }

  function frame(now) {
    raf = 0;
    if (!running) return;
    if (!warm) {                         // grow the first pattern off-screen
      var t0 = performance.now();
      while (engine.steps() < WARMUP && performance.now() - t0 < 10) engine.step(gpu ? 250 : 25);
      if (engine.steps() >= WARMUP) {
        warm = true; draw(); canvas.classList.add('is-ready');
        if (calmMq.matches) { running = false; return; }   // reduced motion: one still frame
      }
    } else if (now - last >= FRAME_MS) {
      last = now; engine.step(STEPS_PER_FRAME); draw();
    }
    raf = requestAnimationFrame(frame);
  }

  function update() {
    var go = !document.hidden && !(warm && calmMq.matches);
    if (go && !running) {
      if (!engine) { setup(); if (!engine) return; }
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
      if (!engine) return;
      var g = gridSize();
      if (Math.abs(g[0] - engine.cols) / engine.cols > 0.1 || Math.abs(g[1] - engine.rows) / engine.rows > 0.1) {
        canvas.width = g[0]; canvas.height = g[1];
        engine = engine.resized(g[0], g[1]);
        if (!gpu) img = ctx.createImageData(g[0], g[1]);
        if (warm) draw();
      }
    }, 300);
  });
  // Switching light/dark recolours the pattern at once, even while paused.
  function recolour() { if (engine && warm) draw(); }
  new MutationObserver(recolour).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  if (darkMq.addEventListener) darkMq.addEventListener('change', recolour);
  document.addEventListener('visibilitychange', update);
  update();
})();
