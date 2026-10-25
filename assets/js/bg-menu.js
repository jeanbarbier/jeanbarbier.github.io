// Header menu choosing the background animation: Turing patterns, neurons, 2D Ising model, or
// none. The choice is stored in localStorage ('bg-anim') and announced with a 'bg-anim-change'
// event, to which turing.js, neurons.js and ising.js react. The round button shows the
// current animation's icon, in the accent colour while one is running.
(function () {
  'use strict';
  var btn = document.querySelector('.anim-toggle'), menu = document.getElementById('bg-menu');
  if (!btn || !menu) return;
  var items = Array.prototype.slice.call(menu.querySelectorAll('[data-mode]'));
  var tempRow = menu.querySelector('.ising-temp'), slider = document.getElementById('ising-t'), out = document.getElementById('ising-t-out');
  var calmMq = window.matchMedia('(prefers-reduced-motion: reduce)');

  function mode() {
    var v = null;
    try { v = localStorage.getItem('bg-anim'); } catch (e) {}
    if (v === 'on' || v === 'turing') return 'turing';
    if (v === 'neurons' || v === 'ising' || v === 'off') return v;
    return calmMq.matches ? 'off' : 'turing';
  }

  function show() {
    var m = mode();
    items.forEach(function (it) { it.setAttribute('aria-checked', it.getAttribute('data-mode') === m ? 'true' : 'false'); });
    var src = menu.querySelector('[data-mode="' + (m === 'off' ? 'turing' : m) + '"] svg');
    if (src) btn.replaceChild(src.cloneNode(true), btn.querySelector('svg'));
    btn.setAttribute('aria-pressed', m === 'off' ? 'false' : 'true');
    if (tempRow) {                      // the temperature slider belongs to the Ising animation
      tempRow.hidden = m !== 'ising';
      var t = NaN;
      try { t = parseFloat(localStorage.getItem('bg-ising-T')); } catch (e) {}
      setTempLabel(t >= 0.5 && t <= 2 ? t : 1.02);
    }
  }

  function setTempLabel(t) {
    slider.value = t;
    out.innerHTML = t.toFixed(2) + ' T<sub>c</sub>';
    slider.setAttribute('aria-valuetext', t.toFixed(2) + ' times the critical temperature');
  }
  if (slider) slider.addEventListener('input', function () {
    var t = parseFloat(slider.value);
    try { localStorage.setItem('bg-ising-T', String(t)); } catch (e) {}
    setTempLabel(t);
    document.dispatchEvent(new Event('bg-ising-temp'));
  });

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
      if (m !== 'ising') close(true);   // Ising keeps the menu open: its temperature slider appears
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
