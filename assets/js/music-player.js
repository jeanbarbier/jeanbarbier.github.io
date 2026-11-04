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
  // A compact player, one mix at a time, for the mixes listed in data-mixes (links
  // separated by spaces, from _data/entropie.yml), in that order. "Previous mix",
  // "Next mix" and "Random mix" buttons and a counter ("3 / 15") sit under it; Previous
  // and Next are greyed out at the two ends. When a mix ends the next one starts; after
  // the last, the player goes back to the first mix and stops. Each mix gets a fresh
  // player (the widget API's load() keeps only on/off options, so it would lose the
  // colour); the API is used only to hear when a mix ends. Without it, mixes do not
  // follow on by themselves but the buttons still work.
  var SC_OPTIONS = { visual: false, color: '#2b4796', hide_related: true, show_comments: false, show_reposts: false, show_teaser: false };
  var scSrc = function (url, autoplay) {
    var q = '';
    for (var k in SC_OPTIONS) q += '&' + k + '=' + encodeURIComponent(SC_OPTIONS[k]);
    return 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(url) + '&auto_play=' + (autoplay ? 'true' : 'false') + q;
  };
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
  var ICON_PREV = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3 2.5h2v11H3zM13 2.5v11L5.5 8z" fill="currentColor"/></svg>';
  var ICON_NEXT = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3 2.5v11L10.5 8zM11 2.5h2v11h-2z" fill="currentColor"/></svg>';
  var ICON_RANDOM = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 4.5h2.2c3.6 0 4.6 7 8.2 7h2.6M1.5 11.5h2.2c1.4 0 2.4-1 3.2-2.3M9.1 6.8c.8-1.3 1.8-2.3 3.2-2.3h2.2"/><path d="M12.6 2.4l2.1 2.1-2.1 2.1M12.6 9.4l2.1 2.1-2.1 2.1"/></g></svg>';

  document.querySelectorAll('.sc-player').forEach(function (holder) {
    var link = holder.querySelector('a.play-button');
    if (!link) return;
    var mixes = (holder.getAttribute('data-mixes') || '').split(/\s+/).filter(Boolean);
    if (!mixes.length) mixes = [link.href];
    var box = null;     // the player and its buttons, while shown
    var session = 0;    // a click starts a session; stopping ends it, so late callbacks do nothing

    var makeButton = function (label, icon) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'play-button';
      b.innerHTML = icon + label;
      return b;
    };

    link.addEventListener('click', function (e) {
      if (!plainClick(e)) return;
      e.preventDefault();
      announce('soundcloud');
      link.hidden = true;
      var mine = ++session;
      var pos = 0, frame = null, Widget = null;
      var show = function () {};

      box = document.createElement('div');
      box.className = 'sc-box';
      var frameBox = document.createElement('div');
      frameBox.className = 'sc-frame';
      box.appendChild(frameBox);
      holder.appendChild(box);

      // Move on when the mix in player f ends (if f is still the one shown).
      var watch = function (f) {
        var w = Widget(f);
        w.bind(Widget.Events.FINISH, function () {
          if (f !== frame || mine !== session) return;
          if (pos < mixes.length - 1) place(pos + 1, true);
          else place(0, false);   // all played: back to the first mix, stopped
        });
      };
      var place = function (i, autoplay) {
        pos = i;
        show();
        var f = document.createElement('iframe');
        f.title = 'SoundCloud player: ' + (holder.getAttribute('data-label') || 'mixes');
        f.setAttribute('allow', 'autoplay');
        f.src = scSrc(mixes[i], autoplay);
        frameBox.textContent = '';
        frameBox.appendChild(f);
        frame = f;
        if (Widget) watch(f);
      };

      if (mixes.length > 1) {
        var nav = document.createElement('div');
        nav.className = 'sc-nav';
        var prev = makeButton('Previous mix', ICON_PREV);
        var next = makeButton('Next mix', ICON_NEXT);
        var rand = makeButton('Random mix', ICON_RANDOM);
        var count = document.createElement('span');
        count.className = 'sc-count';
        count.setAttribute('aria-live', 'polite');
        [prev, next, rand, count].forEach(function (el) { nav.appendChild(el); });
        box.appendChild(nav);
        show = function () {
          prev.disabled = pos === 0;
          next.disabled = pos === mixes.length - 1;
          count.textContent = (pos + 1) + ' / ' + mixes.length;
        };
        prev.addEventListener('click', function () { if (pos > 0) place(pos - 1, true); });
        next.addEventListener('click', function () { if (pos < mixes.length - 1) place(pos + 1, true); });
        rand.addEventListener('click', function () {
          var j = Math.floor(Math.random() * (mixes.length - 1));
          place(j >= pos ? j + 1 : j, true);   // any mix but the one shown
        });
      }
      place(0, true);

      loadWidgetApi().then(function (W) {
        if (mine !== session) return;
        Widget = W;
        watch(frame);
      }, function () {});
    });

    document.addEventListener('music:play', function (e) {
      if (e.detail === 'soundcloud' || link.hidden === false) return;
      session++;
      if (box) { box.remove(); box = null; }
      link.hidden = false;
    });
  });
})();
