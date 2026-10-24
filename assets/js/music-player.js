// Plays the albums of the Misc page in an embedded YouTube player.
// Nothing is loaded from YouTube until a visitor clicks an album.
(function () {
  var list = document.querySelector('.albums');
  var player = document.getElementById('player');
  if (!list || !player) return;
  var caption = player.querySelector('.player-caption');
  var frame = null;

  function embedUrl(href) {
    var u;
    try { u = new URL(href); } catch (e) { return null; }
    var host = u.hostname.replace(/^www\.|^m\.|^music\./, '');
    var v = null, l = u.searchParams.get('list');
    if (host === 'youtube.com') v = u.searchParams.get('v');
    else if (host === 'youtu.be') v = u.pathname.slice(1);
    else return null;
    var base = 'https://www.youtube-nocookie.com/embed/';
    if (v) return base + encodeURIComponent(v) + '?autoplay=1&rel=0' + (l ? '&list=' + encodeURIComponent(l) : '');
    if (l) return base + 'videoseries?list=' + encodeURIComponent(l) + '&autoplay=1&rel=0';
    return null;
  }

  list.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-play]');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
    var src = embedUrl(a.href);
    if (!src) return;
    e.preventDefault();

    if (!frame) {
      var box = document.createElement('div');
      box.className = 'player-frame';
      frame = document.createElement('iframe');
      frame.title = 'YouTube player';
      frame.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
      frame.setAttribute('allowfullscreen', '');
      frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      box.appendChild(frame);
      player.insertBefore(box, caption);
    }
    frame.src = src;

    var prev = list.querySelector('a.is-playing');
    if (prev) { prev.classList.remove('is-playing'); prev.removeAttribute('aria-current'); }
    a.classList.add('is-playing');
    a.setAttribute('aria-current', 'true');

    caption.textContent = 'Now playing: ' + a.getAttribute('data-play') + '. ';
    var out = document.createElement('a');
    out.href = a.href;
    out.textContent = 'Open on YouTube';
    caption.appendChild(out);

    var r = player.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) {
      var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      player.scrollIntoView({ block: 'nearest', behavior: still ? 'auto' : 'smooth' });
    }
  });
})();
