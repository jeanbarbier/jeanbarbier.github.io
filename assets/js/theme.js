(function () {
  var root = document.documentElement;
  var btn = document.querySelector('.theme-toggle');
  if (!btn) return;
  function current() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function label() {
    btn.setAttribute('aria-pressed', current() === 'dark' ? 'true' : 'false');
  }
  btn.addEventListener('click', function () {
    var next = current() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    label();
  });
  label();
})();

// Group page: "Background" buttons show or hide a member's bio below their links.
(function () {
  var buttons = document.querySelectorAll('.bio-toggle');
  Array.prototype.forEach.call(buttons, function (b) {
    var target = document.getElementById(b.getAttribute('aria-controls'));
    if (!target) return;
    b.addEventListener('click', function () {
      var open = b.getAttribute('aria-expanded') === 'true';
      b.setAttribute('aria-expanded', open ? 'false' : 'true');
      target.classList.toggle('is-open', !open);
    });
  });
})();
