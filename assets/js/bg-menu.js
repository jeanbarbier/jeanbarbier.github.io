// Header menu choosing the background animation: Gray-Scott model, 2D Ising model, or none.
// The choice is stored in localStorage ('bg-anim') and announced with a 'bg-anim-change'
// event, to which turing.js and ising.js react. The round button shows the current
// animation's icon, in the accent colour while one is running. Under the running animation's
// item, a slider sets its parameter: the Gray-Scott pattern (spots - stripes - holes) or the Ising
// temperature; each value is stored and announced with its own event.
(function () {
  'use strict';
  var btn = document.querySelector('.anim-toggle'), menu = document.getElementById('bg-menu');
  if (!btn || !menu) return;
  var items = Array.prototype.slice.call(menu.querySelectorAll('[data-mode]'));
  var rows = Array.prototype.slice.call(menu.querySelectorAll('.anim-param'));
  function pathFk(s) {                  // same path as in turing.js
    if (s <= 0.5) return [0.026 + 0.04 * s, 0.0615];
    var b = (s - 0.5) / 0.5;
    return [0.046 - 0.0045 * b, 0.0615 - 0.0023 * b];
  }
  var SLIDERS = [
    { id: 'turing-s', key: 'bg-turing-s', event: 'bg-turing-param', def: 0.25, min: 0, max: 1,
      label: function (v) { var fk = pathFk(v); return 'F ' + fk[0].toFixed(3) + ', k ' + fk[1].toFixed(4); },
      spoken: function (v) { return v < 0.25 ? 'spots' : v < 0.4 ? 'spots and stripes' : v < 0.65 ? 'stripes' : v < 0.85 ? 'stripes and holes' : 'holes'; } },
    { id: 'ising-t', key: 'bg-ising-T', event: 'bg-ising-temp', def: 0.8, min: 0.5, max: 2,
      label: function (v) { return v.toFixed(2) + ' T<sub>c</sub>'; },
      spoken: function (v) { return v.toFixed(2) + ' times the critical temperature'; } }
  ];
  SLIDERS.forEach(function (c) {
    c.input = document.getElementById(c.id); c.out = document.getElementById(c.id + '-out');
    if (!c.input) return;
    c.input.addEventListener('input', function () {
      var v = parseFloat(c.input.value);
      try { localStorage.setItem(c.key, String(v)); } catch (e) {}
      setLabel(c, v);
      document.dispatchEvent(new Event(c.event));
    });
  });
  function stored(c) {
    var v = NaN;
    try { v = parseFloat(localStorage.getItem(c.key)); } catch (e) {}
    return v >= c.min && v <= c.max ? v : c.def;
  }
  function setLabel(c, v) {
    c.input.value = v; c.out.innerHTML = c.label(v);
    c.input.setAttribute('aria-valuetext', c.spoken(v));
  }
  var calmMq = window.matchMedia('(prefers-reduced-motion: reduce)');

  function mode() {
    var v = null;
    try { v = localStorage.getItem('bg-anim'); } catch (e) {}
    if (v === 'ising' || v === 'off') return v;
    if (v === 'on' || v === 'turing' || v === 'neurons') return 'turing';   // neurons: archived, back to the default
    return calmMq.matches ? 'off' : 'turing';
  }

  function show() {
    var m = mode();
    items.forEach(function (it) { it.setAttribute('aria-checked', it.getAttribute('data-mode') === m ? 'true' : 'false'); });
    var src = menu.querySelector('[data-mode="' + (m === 'off' ? 'turing' : m) + '"] svg');
    if (src) btn.replaceChild(src.cloneNode(true), btn.querySelector('svg'));
    btn.setAttribute('aria-pressed', m === 'off' ? 'false' : 'true');
    rows.forEach(function (row) { row.hidden = row.getAttribute('data-for') !== m; });   // slider of the running animation
    SLIDERS.forEach(function (c) { if (c.input) setLabel(c, stored(c)); });
  }

  function open(focusFirst) {
    menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
    var cur = menu.querySelector('[aria-checked="true"]') || items[0];
    if (focusFirst) cur.focus();
  }
  function close(refocus) {
    if (menu.hidden) return;
    menu.hidden = true; btn.setAttribute('aria-expanded', 'false');
    if (refocus) btn.focus();
  }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (menu.hidden) open(e.detail === 0); else close(false);   // keyboard opens with focus inside
  });
  items.forEach(function (it, k) {
    it.addEventListener('click', function () {
      var m = it.getAttribute('data-mode');
      try { localStorage.setItem('bg-anim', m); } catch (e) {}
      document.dispatchEvent(new Event('bg-anim-change'));
      if (!menu.querySelector('.anim-param[data-for="' + m + '"]')) close(true);   // with a slider, the menu stays open to show it
    });
    it.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        items[(k + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus();
      }
    });
  });
  document.addEventListener('click', function (e) { if (!menu.contains(e.target)) close(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(true); });
  document.addEventListener('bg-anim-change', show);
  show();
})();
