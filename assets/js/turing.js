// Background animation, every page, on by default (off for visitors whose system asks for
// reduced motion); the round button in the header stops or restarts it (the choice is remembered). A faint Turing pattern (Gray-Scott
// reaction-diffusion) evolves behind the text: deep blue-teal in dark mode, pale orange in
// light mode. Its state is handed from page to page, so moving around the site does not
// restart it. Runs on the GPU (WebGL2) when it can, where it costs almost nothing; otherwise
// on the CPU. The grid is coarse (one cell per ~7 CSS px, stretched by the browser), it runs
// at ~30 frames per second and pauses when the tab is hidden.
(function () {
  'use strict';

  var LOOP = 16000;             // steps for one loop of the slow parameter drift
  var STEPS_PER_FRAME = 10, FRAME_MS = 33, WARMUP = 2500;
  // Random perturbations: every 2 to 6 seconds (uniformly at random), a disc of radius
  // KICK_R cells (plus up to KICK_R_EXTRA) is cleared and reseeded at a random place.
  var KICK_MIN_MS = 2000, KICK_MAX_MS = 6000, KICK_R = 8, KICK_R_EXTRA = 11, KICK_SEED_DENSITY = 0.05;

  // The menu slider picks s in [0, 1] on a path through the Gray-Scott (F, k) plane, checked by
  // simulation: spots (s ~ 0), stripes / labyrinths (s ~ 0.5), holes (s ~ 1). Default 0.45.
  var PATTERN_DEFAULT = 0.45, pattern = PATTERN_DEFAULT;
  function pathFk(s) {
    if (s <= 0.5) return [0.026 + 0.04 * s, 0.0615];
    var b = (s - 0.5) / 0.5;
    return [0.046 - 0.0045 * b, 0.0615 - 0.0023 * b];
  }
  // A small slow drift around that point and the random perturbations keep it from freezing.
  function params(t) {
    var a = (2 * Math.PI * t) / LOOP, b = pathFk(pattern);
    return { f0: b[0] + 0.0015 * Math.sin(a), k0: b[1] + 0.0002 * Math.sin(0.73 * a + 1.3), ph: 0.31 * a };
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

  // Nearest-neighbour resampling of a state onto another grid size.
  function resample(st, cols, rows, c2, r2) {
    var nu = new Float32Array(c2 * r2), nv = new Float32Array(c2 * r2);
    for (var y = 0; y < r2; y++) for (var x = 0; x < c2; x++) {
      var j = Math.floor((y * rows) / r2) * cols + Math.floor((x * cols) / c2);
      nu[y * c2 + x] = st.u[j]; nv[y * c2 + x] = st.v[j];
    }
    return { u: nu, v: nv };
  }

  // ---- CPU simulation (fallback; also loadable in Node for testing) ----
  // Karl Sims' discretisation: Du = 1, Dv = 0.5, dt = 1, 3x3 Laplacian, periodic edges.
  function createSim(cols, rows, rand, start, t0) {
    rand = rand || Math.random;
    var n = cols * rows, st = start || initialState(cols, rows, rand);
    var u = st.u, v = st.v, u2 = new Float32Array(n), v2 = new Float32Array(n);
    var fcol = new Float32Array(cols), kcol = new Float32Array(cols), t = t0 || 0;

    function setParams() {
      var p = params(t);
      for (var x = 0; x < cols; x++) {
        var q = Math.sin((2 * Math.PI * x) / cols + p.ph);
        fcol[x] = p.f0 + 0.0012 * q; kcol[x] = p.k0 - 0.0002 * q;
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
      if (t % 10 === 0) setParams();
    }
    setParams();

    // Random perturbation: clear a disc and plant a few new nuclei in it. The pattern heals
    // by regrowing into it, usually with a different orientation, so it never settles.
    function kick(cx, cy, r, seed) {
      var rr = r * r, h = seed;
      for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > rr) continue;
        var j = ((cy + dy + rows) % rows) * cols + ((cx + dx + cols) % cols);
        h = (h * 16807) % 2147483647;
        if (h / 2147483647 < KICK_SEED_DENSITY) { u[j] = 0.5; v[j] = 0.25; } else { u[j] = 1; v[j] = 0; }
      }
    }

    return {
      cols: cols, rows: rows, step: step, kick: kick,
      resized: function (c2, r2) { return createSim(c2, r2, rand, resample({ u: u, v: v }, cols, rows, c2, r2), t); },
      read: function () { return { u: u, v: v }; },
      v: function () { return v; }, steps: function () { return t; }
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
  var SIM = '#version 300 es\nprecision highp float;uniform sampler2D s;uniform vec2 size;uniform float f0,k0,ph;uniform vec4 kick;out vec4 o;' +
    'vec2 at(vec2 d){return texture(s,(gl_FragCoord.xy+d)/size).xy;}' +
    'float hash(vec2 p){vec3 q=fract(vec3(p.xyx)*0.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}' +
    'void main(){vec2 c=at(vec2(0.0));' +
    'vec2 l=0.2*(at(vec2(1,0))+at(vec2(-1,0))+at(vec2(0,1))+at(vec2(0,-1)))+0.05*(at(vec2(1,1))+at(vec2(1,-1))+at(vec2(-1,1))+at(vec2(-1,-1)))-c;' +
    'float q=sin(6.2831853*(gl_FragCoord.x-0.5)/size.x+ph);float f=f0+0.0012*q,k=k0-0.0002*q;float uvv=c.x*c.y*c.y;' +
    'o=vec4(c.x+l.x-uvv+f*(1.0-c.x),c.y+0.5*l.y+uvv-(k+f)*c.y,0.0,1.0);' +
    // random perturbation (kick.z > 0): clear a disc, with a few new nuclei in it
    'if(kick.z>0.0){vec2 d=abs(gl_FragCoord.xy-0.5-kick.xy);d=min(d,size-d);' +
    'if(dot(d,d)<=kick.z*kick.z){float h=hash(gl_FragCoord.xy+vec2(kick.w,0.0));' +
    'o=h<' + KICK_SEED_DENSITY.toFixed(3) + '?vec4(0.5,0.25,0.0,1.0):vec4(1.0,0.0,0.0,1.0);}}' +
    // safety net: a cell that is not a number or out of range is reset (stops it spreading)
    'if(!(abs(o.x-0.5)<1.0&&abs(o.y-0.5)<1.0))o=vec4(1.0,0.0,0.0,1.0);}';
  var SHOW = '#version 300 es\nprecision highp float;uniform sampler2D s;uniform vec2 size;uniform vec3 lo,hi;uniform float alpha;out vec4 o;' +
    'void main(){float v=texture(s,gl_FragCoord.xy/size).y;float t=smoothstep(0.07,0.33,v);float a=alpha*t;' +
    'o=vec4(mix(lo,hi,t)*a,a);}';
  var COPY = '#version 300 es\nprecision highp float;uniform sampler2D s;uniform vec2 size;out vec4 o;' +
    'void main(){o=texture(s,gl_FragCoord.xy/size);}';

  function createGpu(canvas, cols, rows, start, t0) {
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

    var st = start || initialState(cols, rows, Math.random), data = new Float32Array(cols * rows * 4);
    for (var i = 0; i < cols * rows; i++) { data[4 * i] = st.u[i]; data[4 * i + 1] = st.v[i]; }
    var a = target(cols, rows, data), b = target(cols, rows, null), t = t0 || 0;
    if (!a || !b) return null;
    gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST);

    function pass(prog, src, dst, w, h) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, dst ? dst.fb : null);
      gl.viewport(0, 0, w, h);
      gl.useProgram(prog.p);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, src.tex);
      gl.uniform1i(prog.u.s, 0); gl.uniform2f(prog.u.size, w, h);
    }

    var pendingKick = null;
    var api = {
      cols: cols, rows: rows,
      steps: function () { return t; },
      kick: function (cx, cy, r, seed) { pendingKick = [cx, cy, r, (seed % 1000) / 7.3]; },
      step: function (count) {
        for (var c = 0; c < count; c++) {
          var p = params(t);
          pass(sim, a, b, api.cols, api.rows);
          gl.uniform1f(sim.u.f0, p.f0); gl.uniform1f(sim.u.k0, p.k0); gl.uniform1f(sim.u.ph, p.ph);
          var kk = pendingKick || [0, 0, 0, 0]; pendingKick = null;
          gl.uniform4f(sim.u.kick, kk[0], kk[1], kk[2], kk[3]);
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
      read: function () {               // current state back to the CPU, to hand to the next page
        var n = api.cols * api.rows, buf = new Float32Array(n * 4), u = new Float32Array(n), v = new Float32Array(n);
        gl.bindFramebuffer(gl.FRAMEBUFFER, a.fb);
        gl.readPixels(0, 0, api.cols, api.rows, gl.RGBA, gl.FLOAT, buf);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        for (var i = 0; i < n; i++) { u[i] = buf[4 * i]; v[i] = buf[4 * i + 1]; }
        return { u: u, v: v };
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

  // ---- Handing the state from page to page (sessionStorage, ~0.2 MB) ----
  var KEY_ON = 'bg-anim', KEY_STATE = 'bg-anim-state';

  function saveState(eng) {
    try {
      var st = eng.read(), n = eng.cols * eng.rows, q = new Uint16Array(2 * n);
      for (var i = 0; i < n; i++) {
        q[i] = Math.round(Math.min(1, Math.max(0, st.u[i])) * 65535);
        q[n + i] = Math.round(Math.min(1, Math.max(0, st.v[i])) * 65535);
      }
      var bytes = new Uint8Array(q.buffer), s = '';
      for (var j = 0; j < bytes.length; j += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(j, j + 0x8000));
      sessionStorage.setItem(KEY_STATE, JSON.stringify({ c: eng.cols, r: eng.rows, t: eng.steps(), d: btoa(s) }));
    } catch (e) {}
  }

  // A state is alive if it is all numbers and holds a pattern somewhere.
  function alive(st) {
    var m = 0;
    for (var i = 0; i < st.v.length; i++) { var x = st.v[i]; if (x !== x) return false; if (x > m) m = x; }
    return m > 0.05;
  }

  function loadState(c2, r2) {
    try {
      var o = JSON.parse(sessionStorage.getItem(KEY_STATE) || 'null');
      if (!o) return null;
      var bin = atob(o.d), bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      var q = new Uint16Array(bytes.buffer), n = o.c * o.r;
      if (q.length !== 2 * n) return null;
      var st = { u: new Float32Array(n), v: new Float32Array(n) };
      for (var j = 0; j < n; j++) { st.u[j] = q[j] / 65535; st.v[j] = q[n + j] / 65535; }
      if (!alive(st)) return null;          // empty or broken hand-over: start a fresh pattern
      if (o.c !== c2 || o.r !== r2) st = resample(st, o.c, o.r, c2, r2);
      return { st: st, t: o.t };
    } catch (e) { return null; }
  }

  // ---- Page ----
  var canvas = document.querySelector('.bg-turing');
  if (!canvas) return;
  var root = document.documentElement;
  var darkMq = window.matchMedia('(prefers-color-scheme: dark)');
  var CELL = 7, MAX_CELLS = 60000;
  var engine = null, gpu = false, ctx = null, img = null, lut = null, lutFor = null;
  var running = false, raf = 0, last = 0, warm = false;
  var nextKickAt = 0, nextCheckAt = 0;

  // If the graphics card produces no pattern (some phone GPUs differ), continue on the CPU.
  function switchToCpu() {
    var c = engine.cols, r = engine.rows, fresh = canvas.cloneNode(false);
    fresh.classList.remove('is-ready', 'instant');
    canvas.parentNode.replaceChild(fresh, canvas); canvas = fresh;
    canvas.width = c; canvas.height = r;
    ctx = canvas.getContext('2d');
    gpu = false; warm = false; lutFor = null;
    try { sessionStorage.setItem('bg-anim-cpu', '1'); } catch (e) {}   // later pages go straight to the CPU
    engine = ctx ? createSim(c, r) : null;
    if (engine) img = ctx.createImageData(c, r); else running = false;
  }
  function gpuHealthy() { try { return alive(engine.read()); } catch (e) { return false; } }

  // The background mode is shared with neurons.js, ising.js and bg-menu.js: 'turing' (default,
  // also the old 'on'), 'neurons', 'ising' or 'off'. A visitor's own choice (the header menu)
  // wins; visitors whose system asks for reduced motion start with 'off' and can still choose.
  var calmMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  function mode() {
    var v = null;
    try { v = localStorage.getItem(KEY_ON); } catch (e) {}
    if (v === 'ising' || v === 'off') return v;
    if (v === 'on' || v === 'turing' || v === 'neurons') return 'turing';   // neurons: archived, back to the default
    return calmMq.matches ? 'off' : 'turing';
  }
  function enabled() { return mode() === 'turing'; }
  function storedPattern() {
    var v = NaN;
    try { v = parseFloat(localStorage.getItem('bg-turing-s')); } catch (e) {}
    return v >= 0 && v <= 1 ? v : PATTERN_DEFAULT;
  }
  pattern = storedPattern();
  document.addEventListener('bg-turing-param', function () { pattern = storedPattern(); });   // applies at once

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
    var g = gridSize(), saved = loadState(g[0], g[1]);
    var st = saved ? saved.st : null, t0 = saved ? saved.t : 0;
    canvas.width = g[0]; canvas.height = g[1];
    var cpuOnly = false;
    try { cpuOnly = sessionStorage.getItem('bg-anim-cpu') === '1'; } catch (e) {}
    engine = cpuOnly ? null : createGpu(canvas, g[0], g[1], st, t0);
    if (engine) gpu = true;
    else {
      // No usable WebGL2: a canvas keeps its first context type, so start from a fresh one.
      var fresh = canvas.cloneNode(false); canvas.parentNode.replaceChild(fresh, canvas); canvas = fresh;
      canvas.width = g[0]; canvas.height = g[1];
      ctx = canvas.getContext('2d');
      if (!ctx) { engine = null; return; }
      engine = createSim(g[0], g[1], Math.random, st, t0);
      img = ctx.createImageData(g[0], g[1]);
    }
    if (saved) {                        // coming from another page: show it at once, no fade
      warm = true; draw();
      canvas.classList.add('instant', 'is-ready');
      setTimeout(function () { canvas.classList.remove('instant'); }, 100);
    }
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
    if (!warm) {                         // grow the first pattern off-screen, then fade it in
      var t0 = performance.now();
      while (engine.steps() < WARMUP && performance.now() - t0 < 10) engine.step(gpu ? 250 : 25);
      if (engine.steps() >= WARMUP) {
        if (gpu && !gpuHealthy()) { switchToCpu(); if (running) raf = requestAnimationFrame(frame); return; }
        warm = true; draw(); canvas.classList.add('is-ready'); nextCheckAt = now + 10000;
      }
    } else if (now - last >= FRAME_MS) {
      last = now;
      if (gpu && now >= nextCheckAt) {      // cheap check every 10 s (one small read-back)
        nextCheckAt = now + 10000;
        if (!gpuHealthy()) { switchToCpu(); if (running) raf = requestAnimationFrame(frame); return; }
      }
      if (!nextKickAt) nextKickAt = now + KICK_MIN_MS + Math.random() * (KICK_MAX_MS - KICK_MIN_MS);
      if (now >= nextKickAt) {               // random perturbation, so the pattern never settles
        engine.kick(Math.floor(Math.random() * engine.cols), Math.floor(Math.random() * engine.rows),
          KICK_R + Math.floor(Math.random() * (KICK_R_EXTRA + 1)), 1 + Math.floor(Math.random() * 1e9));
        nextKickAt = now + KICK_MIN_MS + Math.random() * (KICK_MAX_MS - KICK_MIN_MS);
      }
      engine.step(STEPS_PER_FRAME); draw();
    }
    raf = requestAnimationFrame(frame);
  }

  function update() {
    var on = enabled();
    var go = on && !document.hidden;
    if (go && !running) {
      if (!engine) { setup(); if (!engine) return; }
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

  // Hand the current pattern to the next page (navigation) or to a later return to this tab.
  function handOver() { if (engine && warm && enabled()) saveState(engine); }
  window.addEventListener('pagehide', handOver);
  document.addEventListener('visibilitychange', function () { if (document.hidden) handOver(); update(); });

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
  // Switching light/dark recolours the pattern at once.
  function recolour() { if (engine && warm) draw(); }
  new MutationObserver(recolour).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  if (darkMq.addEventListener) darkMq.addEventListener('change', recolour);
  update();
})();
