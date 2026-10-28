// Players on the Misc page. Nothing is loaded from YouTube or SoundCloud
// until a visitor clicks; starting one player stops the other.
(function () {
  function plainClick(e) { return !(e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0); }
  function announce(who) { document.dispatchEvent(new CustomEvent('music:play', { detail: who })); }

  // ---- YouTube: albums list ----
  var list = document.querySelector('.albums');
  var player = document.getElementById('player');
  if (list && player) {
    var box = null;

    var embedUrl = function (href) {
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
    };
    var clearCurrent = function () {
      var prev = list.querySelector('a.is-playing');
      if (prev) { prev.classList.remove('is-playing'); prev.removeAttribute('aria-current'); }
    };

    list.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-play]');
      if (!a || !plainClick(e)) return;
      var src = embedUrl(a.href);
      if (!src) return;
      e.preventDefault();
      announce('youtube');

      if (!box) {
        box = document.createElement('div');
        box.className = 'player-frame';
        var frame = document.createElement('iframe');
        frame.title = 'YouTube player';
        frame.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
        frame.setAttribute('allowfullscreen', '');
        frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        box.appendChild(frame);
        player.appendChild(box);
      }
      box.firstChild.src = src;
      box.firstChild.title = 'YouTube player: ' + a.getAttribute('data-play');

      clearCurrent();
      a.classList.add('is-playing');
      a.setAttribute('aria-current', 'true');


      var r = player.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) {
        var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        player.scrollIntoView({ block: 'nearest', behavior: still ? 'auto' : 'smooth' });
      }
    });

    document.addEventListener('music:play', function (e) {
      if (e.detail === 'youtube' || !box) return;
      box.remove(); box = null;
      clearCurrent();
    });
  }

  // ---- SoundCloud: Entropie Collectif ----
  document.querySelectorAll('.sc-player').forEach(function (holder) {
    var link = holder.querySelector('a.play-button');
    if (!link) return;
    var frame = null;

    link.addEventListener('click', function (e) {
      if (!plainClick(e)) return;
      e.preventDefault();
      announce('soundcloud');
      frame = document.createElement('iframe');
      frame.title = 'SoundCloud player: ' + (holder.getAttribute('data-label') || 'playlist');
      frame.setAttribute('allow', 'autoplay');
      frame.src = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(link.href) +
        '&auto_play=true&visual=false&color=%232b4796&hide_related=true&show_comments=false&show_reposts=false&show_teaser=false';
      link.hidden = true;
      holder.appendChild(frame);
    });

    document.addEventListener('music:play', function (e) {
      if (e.detail === 'soundcloud' || !frame) return;
      frame.remove(); frame = null;
      link.hidden = false;
    });
  });
})();
