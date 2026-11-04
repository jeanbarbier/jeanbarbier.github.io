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
  // A compact player (one mix at a time, no list) for the set in data-set, played in our
  // own order whatever the set's order on SoundCloud: the mixes of data-first, then the
  // mixes not listed (in the set's order), then those of data-last (links separated by
  // spaces, from _data/entropie.yml). "Previous mix" / "Next mix" buttons and a counter
  // ("3 / 10") under the player follow the same order; the buttons are greyed out at the
  // two ends. When the last mix ends it goes back to the first mix and stops. Mixes are
  // matched by track id, read from SoundCloud's oEmbed service when Play is clicked, so
  // the data file only needs links. The player stays hidden until the first mix plays,
  // so the set's own first mix never flashes. Without data-set, the link plays as is.
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

  var ICON_PREV = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3 2.5h2v11H3zM13 2.5v11L5.5 8z" fill="currentColor"/></svg>';
  var ICON_NEXT = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3 2.5v11L10.5 8zM11 2.5h2v11h-2z" fill="currentColor"/></svg>';

  // Drive widget w through the set in the order given by the two lists of track ids.
  // ui: { reveal(), update(pos, count) } and the nav buttons call the returned step().
  var playInOrder = function (Widget, w, firstIds, lastIds, ui) {
    var order = [], current = -1, ending = false, lastPlay = 0;
    // Jump to the sound with set index i and make sure it plays: before anything has
    // played, or while paused, the widget may select a mix it has not loaded yet
    // (beyond the first few of the set) without playing it, so nudge it.
    var go = function (i) {
      var asked = Date.now();
      w.skip(i);
      [800, 2000, 4000].forEach(function (t) {
        setTimeout(function () { if (lastPlay < asked && !ending) w.play(); }, t);
      });
    };
    var show = function () { ui.update(order.indexOf(current), order.length); };
    w.getSounds(function (sounds) {
      var ids = sounds.map(function (x) { return String(x.id); });
      var pick = function (list) {
        return list.map(function (id) { return ids.indexOf(id); }).filter(function (i) { return i >= 0; });
      };
      var head = pick(firstIds), tail = pick(lastIds);
      var middle = ids.map(function (_, i) { return i; })
        .filter(function (i) { return head.indexOf(i) < 0 && tail.indexOf(i) < 0; });
      order = head.concat(middle, tail);
      current = order[0];
      w.bind(Widget.Events.PLAY, function () {
        lastPlay = Date.now();
        w.getCurrentSoundIndex(function (k) {
          current = k;
          ui.reveal();
          show();
          if (ending && k === order[0]) { ending = false; w.pause(); w.seekTo(0); }
        });
      });
      w.bind(Widget.Events.FINISH, function () {
        var pos = order.indexOf(current);
        if (pos >= 0 && pos + 1 < order.length) { go(order[pos + 1]); return; }
        ending = true;
        w.skip(order[0]);
        setTimeout(function () { if (ending) { ending = false; w.pause(); ui.reveal(); show(); } }, 4000);
      });
      show();
      go(order[0]);
    });
    // Previous (-1) or next (+1) mix in the order, from the one playing.
    return function (d) {
      var pos = order.indexOf(current) + d;
      if (!order.length || pos < 0 || pos >= order.length) return;
      ending = false;
      current = order[pos];
      show();
      go(order[pos]);
    };
  };

  document.querySelectorAll('.sc-player').forEach(function (holder) {
    var link = holder.querySelector('a.play-button');
    if (!link) return;
    var box = null;     // the player and its buttons, while shown
    var session = 0;    // a click starts a session; stopping ends it, so late callbacks do nothing

    var makeFrame = function (url, autoplay) {
      var frame = document.createElement('iframe');
      frame.title = 'SoundCloud player: ' + (holder.getAttribute('data-label') || 'playlist');
      frame.setAttribute('allow', 'autoplay');
      frame.src = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(url) +
        '&auto_play=' + (autoplay ? 'true' : 'false') + SC_PARAMS;
      return frame;
    };
    var makeButton = function (label, icon) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'play-button';
      b.disabled = true;
      b.innerHTML = icon + label;
      return b;
    };

    link.addEventListener('click', function (e) {
      if (!plainClick(e)) return;
      e.preventDefault();
      announce('soundcloud');
      link.hidden = true;
      var mine = ++session;
      box = document.createElement('div');
      box.className = 'sc-box';
      holder.appendChild(box);
      var setUrl = holder.getAttribute('data-set');
      if (!setUrl) { box.appendChild(makeFrame(link.href, true)); return; }

      var frameBox = document.createElement('div');
      frameBox.className = 'sc-frame is-loading';
      box.appendChild(frameBox);
      var nav = document.createElement('div');
      nav.className = 'sc-nav';
      var prev = makeButton('Previous mix', ICON_PREV);
      var next = makeButton('Next mix', ICON_NEXT);
      var count = document.createElement('span');
      count.className = 'sc-count';
      count.setAttribute('aria-live', 'polite');
      nav.appendChild(prev); nav.appendChild(next); nav.appendChild(count);
      box.appendChild(nav);
      var reveal = function () { frameBox.classList.remove('is-loading'); };
      var ui = {
        reveal: reveal,
        update: function (pos, n) {
          if (pos < 0 || !n) return;
          prev.disabled = pos === 0;
          next.disabled = pos === n - 1;
          count.textContent = (pos + 1) + ' / ' + n;
        }
      };

      var first = links(holder.getAttribute('data-first')), last = links(holder.getAttribute('data-last'));
      var ids = Promise.all(first.concat(last).map(trackId));
      loadWidgetApi().then(function (Widget) {
        if (mine !== session) return;
        var frame = makeFrame(setUrl, false);
        frameBox.appendChild(frame);
        setTimeout(reveal, 10000);   // never leave the player hidden if something is slow
        var w = Widget(frame);
        w.bind(Widget.Events.READY, function () {
          ids.then(function (all) {
            if (mine !== session) return;
            var step = playInOrder(Widget, w, all.slice(0, first.length), all.slice(first.length), ui);
            prev.addEventListener('click', function () { step(-1); });
            next.addEventListener('click', function () { step(1); });
          });
        });
      }, function () {
        if (mine !== session) return;   // no widget API: plain player, the set in its own order
        frameBox.appendChild(makeFrame(setUrl, true));
        reveal();
        nav.remove();
      });
    });

    document.addEventListener('music:play', function (e) {
      if (e.detail === 'soundcloud' || link.hidden === false) return;
      session++;
      if (box) { box.remove(); box = null; }
      link.hidden = false;
    });
  });
})();
