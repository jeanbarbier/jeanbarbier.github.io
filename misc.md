---
layout: default
title: Miscellaneous
heading: Miscellaneous
permalink: /misc/
funding: false   # no ERC funding statement on this page: nothing here is ERC-funded
---
Outside science I like rock climbing, skiing and freediving. With friends we make electronic music (I am RSB, my wife is Ficus Tabasco): [Entropie Collectif](https://soundcloud.com/entropiecollectif). 

<div class="sc-player" data-label="Entropie 10">
  <a class="play-button" href="https://soundcloud.com/entropiecollectif/sets/entropie-10-2026"><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>Play Entropie 10</a>
</div>

## Music I've been listening to

<ul class="albums">
{%- for al in site.data.albums %}
  <li><span class="album-month">{{ al.month | append: "-01" | date: "%b %Y" }}</span><span class="album-name">{% if al.title and al.title != "" %}<a href="{{ al.url }}" data-play="{{ al.title | append: ' by ' | append: al.artist | escape }}">{{ al.title }}</a> by {{ al.artist }}{% else %}<a href="{{ al.url }}" data-play="{{ al.artist | escape }}">{{ al.artist }}</a>{% endif %}{% for x in al.extra %}, <a href="{{ x.url }}" data-play="{{ x.label | append: ' by ' | append: al.artist | escape }}">{{ x.label }}</a>{% endfor %}{% if al.note and al.note != "" %}. {{ al.note }}{% endif %}</span></li>
{%- endfor %}
</ul>

<div class="player" id="player">
  <p class="player-caption" aria-live="polite">Click an album to play it here.</p>
</div>
<script src="{{ '/assets/js/music-player.js' | relative_url }}" defer></script>

## Worth reading

- [The Future of Research in the Age of AI](https://pierremarion23.github.io/thoughts/2026-10-01.html), by Pierre Marion.
- [A highly relevant viewpoint on science in the age of AI](https://www.linkedin.com/pulse/where-mathematics-headed-age-ai-marc-m%C3%A9zard-vhvce/), by Marc Mézard.

## Quotes I like

<div class="quotes" markdown="1">

> An expert is a person who has found out by his own painful experience all the mistakes that one can make in a very narrow field.
>
> <cite>Niels Bohr, quoted by Edward Teller in LIFE magazine (6 September 1954)</cite>

> Physics is like sex: sure, it may give some practical results, but that's not why we do it.
>
> <cite>Richard Feynman</cite>

> If you can't explain it simply, you don't understand it well enough.
>
> <cite>Attributed to Albert Einstein, [probably based on a quote by Ernest Rutherford](https://en.wikiquote.org/wiki/Albert_Einstein#Misattributed)</cite>

> Everything should be made as simple as possible, but not simpler.
>
> <cite>Attributed to Albert Einstein; [the long story of this quote](https://quoteinvestigator.com/2011/05/13/einstein-simple/)</cite>

</div>
