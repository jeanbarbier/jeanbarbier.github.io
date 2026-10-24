// Small details: a note for the curious in the console, click-to-copy email, BibTeX citations.
(function () {
  try {
    console.log('%cCurious enough to look here?%c\nWe have PhD openings: ' + location.origin + '/group/#join',
      'font: 600 15px Georgia, serif; color: #2b4796', 'font: 13px sans-serif');
  } catch (e) {}

  function fallback(text, done) {
    var t = document.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.position = 'absolute'; t.style.left = '-9999px';
    document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); done(); } catch (e) {}
    t.remove();
  }
  function copy(text, done) {
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, function () { fallback(text, done); });
    else fallback(text, done);
  }
  function flash(el, msg) {
    var old = el.textContent; el.textContent = msg; el.disabled = true;
    setTimeout(function () { el.textContent = old; el.disabled = false; }, 1600);
  }

  // Email: the address is assembled here, never written in the page.
  document.querySelectorAll('button.email[data-u]').forEach(function (b) {
    b.addEventListener('click', function () {
      copy(b.getAttribute('data-u') + '@' + b.getAttribute('data-d'), function () { flash(b, 'Copied to clipboard'); });
    });
  });

  // Cite: show the BibTeX under a paper, with a Copy button.
  document.querySelectorAll('.cite-btn').forEach(function (btn) {
    var box = btn.closest('.pub').querySelector('.bibtex');
    if (!box) return;
    btn.hidden = false;
    btn.addEventListener('click', function () {
      var open = box.hidden; box.hidden = !open; btn.setAttribute('aria-expanded', String(open));
    });
    var cp = box.querySelector('.bib-copy');
    cp.addEventListener('click', function () { copy(box.querySelector('pre').textContent, function () { flash(cp, 'Copied'); }); });
  });
})();
