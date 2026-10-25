---
layout: default
title: Miscellaneous
heading: Miscellaneous
emoji: "🎲"   # shown right after the page title (not in the top bar)
emoji_scale: 0.9   # the dice is drawn as a solid shape, so it is set 10% smaller to look the same size as the others
permalink: /misc/
intro: "The rest: what I read, what I listen to, and other random things I like to share."
funding: false   # no ERC funding statement on this page: nothing here is ERC-funded
---
## Worth reading

- [A highly relevant viewpoint on science in the age of AI](https://www.linkedin.com/pulse/where-mathematics-headed-age-ai-marc-m%C3%A9zard-vhvce/), by Marc Mézard.
- [The future of research in the age of AI](https://pierremarion23.github.io/thoughts/2026-10-01.html), by Pierre Marion.

## Outside science

I like rock climbing, skiing and freediving. With friends we make electronic music (I am RSB, my wife is Ficus Tabasco): [Entropie Collectif](https://soundcloud.com/entropiecollectif). 

<div class="sc-player" data-label="Entropie 10">
  <a class="play-button" href="https://soundcloud.com/entropiecollectif/sets/entropie-10-2026"><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>Play Entropie 10</a>
</div>

## Music I've been listening to

<ul class="albums scroll-list" tabindex="0" aria-label="Music I've been listening to">
{%- for al in site.data.albums %}
  <li><span class="album-month">{{ al.month | append: "-01" | date: "%b %Y" }}</span><span class="album-name">{% if al.title and al.title != "" %}<a href="{{ al.url }}" data-play="{{ al.title | append: ' by ' | append: al.artist | escape }}">{{ al.title }}</a> by {{ al.artist }}{% else %}<a href="{{ al.url }}" data-play="{{ al.artist | escape }}">{{ al.artist }}</a>{% endif %}{% for x in al.extra %}, <a href="{{ x.url }}" data-play="{{ x.label | append: ' by ' | append: al.artist | escape }}">{{ x.label }}</a>{% endfor %}{% if al.note and al.note != "" %}. {{ al.note }}{% endif %}</span></li>
{%- endfor %}
</ul>

<div class="player" id="player">
  <p class="player-caption" aria-live="polite">Click an album to play it here.</p>
</div>
<script src="{{ '/assets/js/music-player.js' | relative_url }}" defer></script>

## Submit your phase transition

Spotted a phase transition in the wild or your imagination? Describe it below and it comes straight to my inbox. The best ones will be added to the site :)

<form class="transition-form" id="submit" action="https://api.web3forms.com/submit" method="POST">
  <input type="hidden" name="access_key" value="{{ site.web3forms_key }}">
  <input type="hidden" name="subject" value="New phase transition from jeanbarbier.github.io">
  <input type="hidden" name="from_name" value="jeanbarbier.github.io">
  <input type="hidden" name="redirect" value="{{ '/misc/?sent=1#submit' | absolute_url }}">
  <input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
  <label for="tf-message">Your transition</label>
  <textarea id="tf-message" name="message" rows="3" maxlength="3000" required placeholder="What changes, what drives it, and is it continuous or first order?"></textarea>
  <div class="tf-row">
    <div><label for="tf-name">Name <span class="opt">(optional)</span></label><input id="tf-name" name="name" type="text" autocomplete="name"></div>
    <div><label for="tf-email">Email <span class="opt">(optional, for a reply)</span></label><input id="tf-email" name="email" type="email" autocomplete="email"></div>
    <button type="submit" class="form-button">Send</button>
  </div>
  <p class="tf-status" role="status" aria-live="polite"></p>
  <p class="tf-note">Leave the name and email empty to stay anonymous. Messages are delivered by Web3Forms.</p>
</form>
