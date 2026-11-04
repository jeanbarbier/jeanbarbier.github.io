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
  // The player shows the whole set (data-set) but plays its mixes in our own order,
  // whatever their order on SoundCloud: the mixes of data-first, then the mixes not
  // listed (in the set's order), then those of data-last (links separated by spaces,
  // from _data/entropie.yml). When the order is done it goes back to the first mix and
  // stops. A visitor who picks a mix in the list continues the order from there. Mixes
  // are matched by track id, read from SoundCloud's oEmbed service when Play is clicked,
  // so the data file only needs links. Without data-set, the link plays in its own order.
  var SC_PARAMS = '&visual=false&color=%232b4796&hide_related=true&show_comments=false&show_reposts=false&show_teaser=false';
  var widgetApi = null;
  var loadWidgetApi = function () {
    if (!widgetApi) widgetApi = new Promise(function (resolve, reject) {
      if (window.SC && window.SC.Widget) { resolve(window.SC.Widget); return; }
      var s = document.createElement('script');
      s.src = 'https://w.soundcloud.com/player/api.js';
      s.onload = function () { if (window.SC && window.SC.Widget) resolve(window.SC.Widget); else reject(); };
      s.onerror = function () { widgetApi = null; reject(); };
      document.head.appendChild(s);
    });
    return widgetApi;
  };
  var trackId = function (href) {
    return fetch('https://soundcloud.com/oembed?format=json&url=' + encodeURIComponent(href))
      .then(function (r) { return r.json(); })
      .then(function (j) { var m = /tracks%2F(\d+)/.exec(j.html || ''); return m ? m[1] : null; })
      .catch(function () { return null; });
  };
  var links = function (attr) { return (attr || '').split(/\s+/).filter(Boolean); };

  // Play the set's sounds in the order given by the two lists of track ids.
  var playInOrder = function (Widget, w, firstIds, lastIds) {
    w.getSounds(function (sounds) {
      var ids = sounds.map(function (x) { return String(x.id); });
      var pick = function (list) {
        return list.map(function (id) { return ids.indexOf(id); }).filter(function (i) { return i >= 0; });
      };
      var head = pick(firstIds), tail = pick(lastIds);
      var middle = ids.map(function (_, i) { return i; })
        .filter(function (i) { return head.indexOf(i) < 0 && tail.indexOf(i) < 0; });
      var order = head.concat(middle, tail);
      var current = order[0];   // index of the sound playing, from the last PLAY event
      var started = false;
      var ending = false;       // order done: going back to the first mix, to stop there
      w.bind(Widget.Events.PLAY, function () {
        started = true;
        w.getCurrentSoundIndex(function (k) {
          current = k;
          if (ending && k === order[0]) { ending = false; w.pause(); w.seekTo(0); }
        });
      });
      w.bind(Widget.Events.FINISH, function () {
        var pos = order.indexOf(current);
        if (pos >= 0 && pos + 1 < order.length) { w.skip(order[pos + 1]); return; }
        ending = true;
        w.skip(order[0]);
        setTimeout(function () { if (ending) { ending = false; w.pause(); } }, 4000);
      });
      // Before anything has played, the widget selects a mix it has not loaded yet
      // (beyond the first few of the set) without playing it: nudge it until it starts.
      w.skip(order[0]);
      [800, 2000, 4000].forEach(function (t) {
        setTimeout(function () { if (!started) w.play(); }, t);
      });
    });
  };

  document.querySelectorAll('.sc-player').forEach(function (holder) {
    var link = holder.querySelector('a.play-button');
    if (!link) return;
    var frame = null;
    var session = 0;   // a click starts a session; stopping ends it, so late callbacks do nothing

    var show = function (url, autoplay) {
      frame = document.createElement('iframe');
      frame.title = 'SoundCloud player: ' + (holder.getAttribute('data-label') || 'playlist');
      frame.setAttribute('allow', 'autoplay');
      frame.src = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(url) +
        '&auto_play=' + (autoplay ? 'true' : 'false') + SC_PARAMS;
      holder.appendChild(frame);
      return frame;
    };

    link.addEventListener('click', function (e) {
      if (!plainClick(e)) return;
      e.preventDefault();
      announce('soundcloud');
      link.hidden = true;
      var mine = ++session;
      var setUrl = holder.getAttribute('data-set');
      if (!setUrl) { show(link.href, true); return; }
      var first = links(holder.getAttribute('data-first')), last = links(holder.getAttribute('data-last'));
      var ids = Promise.all(first.concat(last).map(trackId));
      loadWidgetApi().then(function (Widget) {
        if (mine !== session) return;
        var w = Widget(show(setUrl, false));
        w.bind(Widget.Events.READY, function () {
          ids.then(function (all) {
            if (mine !== session) return;
            playInOrder(Widget, w, all.slice(0, first.length), all.slice(first.length));
          });
        });
      }, function () {
        if (mine === session) show(setUrl, true);   // no widget API: play the set in its own order
      });
    });

    document.addEventListener('music:play', function (e) {
      if (e.detail === 'soundcloud' || link.hidden === false) return;
      session++;
      if (frame) { frame.remove(); frame = null; }
      link.hidden = false;
    });
  });
})();
