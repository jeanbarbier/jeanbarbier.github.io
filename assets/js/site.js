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
      copy(b.getAttribute('data-u') + '@' + b.getAttribute('data-d'), function () { flash(b, 'Address copied'); });
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

  // Misc: "Submit your phase transition" form, sent without leaving the page.
  var form = document.querySelector('.transition-form');
  if (form) {
    var status = form.querySelector('.tf-status'), btn = form.querySelector('button[type="submit"]');
    var area = form.querySelector('textarea');
    var grow = function () { area.style.height = 'auto'; area.style.height = (area.scrollHeight + 2) + 'px'; };
    area.addEventListener('input', grow);
    if (/[?&]sent=1/.test(location.search)) status.textContent = 'Sent, thank you!';
    form.addEventListener('submit', function (e) {
      if (!window.fetch || !window.FormData) return;
      e.preventDefault();
      btn.disabled = true; status.textContent = 'Sending…';
      fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d && d.success) { form.reset(); area.style.height = ''; status.textContent = 'Sent, thank you!'; }
          else status.textContent = 'Could not send it. Please try again later.';
        })
        .catch(function () { status.textContent = 'Could not send it. Please try again later.'; })
        .then(function () { btn.disabled = false; });
    });
  }
})();

// Dated lists with class "scroll-list" (home News, past Events, Music): show five items, then
// scroll. The height is fitted to the first five items; the bottom fades while more is below.
(function () {
  var lists = document.querySelectorAll('.scroll-list');
  if (!lists.length) return;
  function edge(ul) {
    ul.classList.toggle('has-more', ul.scrollTop + ul.clientHeight < ul.scrollHeight - 2);
  }
  function fit() {
    Array.prototype.forEach.call(lists, function (ul) {
      var items = ul.children;
      if (items.length > 5) {
        var fifth = items[4];
        ul.style.maxHeight = (fifth.offsetTop + fifth.offsetHeight) + 'px';
      } else {
        ul.style.maxHeight = 'none';
      }
      edge(ul);
    });
  }
  Array.prototype.forEach.call(lists, function (ul) {
    ul.addEventListener('scroll', function () { edge(ul); }, { passive: true });
  });
  var timer = 0;
  window.addEventListener('resize', function () { clearTimeout(timer); timer = setTimeout(fit, 150); });
  fit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
})();
