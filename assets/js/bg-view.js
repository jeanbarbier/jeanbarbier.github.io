// View mode (the eye button in the header): the page fades out, only the round buttons stay, and
// the background animation shows at full strength. Clicks and taps on it are passed to the running
// animation as 'bg-poke' events (detail: phase 'start' | 'move' | 'end', x, y in CSS px), which
// turing.js, ising.js and spinglass.js turn into a local perturbation. Leave with the same button
// or Escape. If no animation runs, entering starts the default one. While the strength changes,
// window.bgViewMix goes from 0 to 1 (or back) and 'bg-view-mix' is fired at every frame, so the
// animations redraw with the new opacity.
(function () {
  'use strict';
  var FADE_MS = 600;                    // the animation reaches full strength in this time
  var btn = document.querySelector('.view-toggle'), root = document.documentElement;
  if (!btn) return;
  var menu = document.getElementById('bg-menu'), buttons = document.querySelector('.header-buttons');
  var calmMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  window.bgViewMix = 0;

  function mode() {                     // same rule as in the animation scripts
    var v = null;
    try { v = localStorage.getItem('bg-anim'); } catch (e) {}
    if (v === 'ising' || v === 'spinglass' || v === 'off') return v;
    if (v === 'on' || v === 'turing' || v === 'neurons') return 'turing';
    return calmMq.matches ? 'off' : 'turing';
  }
  function on() { return root.classList.contains('bg-view'); }

  var tween = 0;
  function fadeTo(target) {             // eases window.bgViewMix towards 0 or 1
    cancelAnimationFrame(tween);
    var from = window.bgViewMix, t0 = performance.now();
    (function step(now) {
      var s = Math.min(1, (now - t0) / FADE_MS);
      window.bgViewMix = from + (target - from) * s * s * (3 - 2 * s);
      document.dispatchEvent(new Event('bg-view-mix'));
      if (s < 1) tween = requestAnimationFrame(step);
    })(t0);
  }

  function set(v) {
    if (v === on()) return;
    if (v && mode() === 'off') {        // nothing to look at: start the default animation
      try { localStorage.setItem('bg-anim', 'turing'); } catch (e) {}
      document.dispatchEvent(new Event('bg-anim-change'));
    }
    root.classList.toggle('bg-view', v);
    btn.setAttribute('aria-pressed', v ? 'true' : 'false');
    fadeTo(v ? 1 : 0);
  }
  btn.addEventListener('click', function () { set(!on()); });
  // Escape leaves view mode, unless it is closing the animation menu (window capture runs first)
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && on() && (!menu || menu.hidden)) set(false);
  }, true);
  document.addEventListener('bg-anim-change', function () { if (on() && mode() === 'off') set(false); });

  // ---- Clicks and taps on the animation ----
  var active = null;                    // pointer id of the current gesture
  function poke(phase, e) {
    document.dispatchEvent(new CustomEvent('bg-poke', { detail: { phase: phase, x: e.clientX, y: e.clientY } }));
  }
  window.addEventListener('pointerdown', function (e) {
    if (!on() || active !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if (buttons && buttons.contains(e.target)) return;          // the round buttons and the menu
    if (menu && !menu.hidden) return;                           // this click only closes the menu
    e.preventDefault();
    active = e.pointerId;
    poke('start', e);
  });
  window.addEventListener('pointermove', function (e) { if (e.pointerId === active) poke('move', e); });
  function end(e) { if (e.pointerId === active) { active = null; poke('end', e); } }
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
})();
