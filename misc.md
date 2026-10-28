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
## The physics behind the site's animations {#animations}

The faint animations in the background of every page are live simulations of three classic models of statistical physics.

<ul class="notes compact grouped">
  <li class="note">
    <h3 class="note-title"><a href="{{ '/misc/gray-scott/' | relative_url }}">The Gray-Scott model</a></h3>
    <p class="note-context">Two chemicals that react and diffuse, and the spots, stripes and holes they draw.</p>
  </li>
  <li class="note">
    <h3 class="note-title"><a href="{{ '/misc/ising/' | relative_url }}">The 2D Ising model</a></h3>
    <p class="note-context">The simplest model of a magnet, and its phase transition between order and disorder.</p>
  </li>
  <li class="note">
    <h3 class="note-title"><a href="{{ '/misc/spin-glass/' | relative_url }}">The 2D spin glass</a></h3>
    <p class="note-context">Random couplings, frustration, and the strings that pair frustrated plaquettes.</p>
  </li>
</ul>

## Worth reading

<ul class="notes compact grouped scroll-list" data-show="3" tabindex="0" aria-label="Worth reading">
  <li class="note">
    <h3 class="note-title"><a href="https://www.linkedin.com/pulse/where-mathematics-headed-age-ai-marc-m%C3%A9zard-vhvce/">A highly relevant viewpoint on science in the age of AI</a></h3>
    <p class="note-context">By Marc Mézard.</p>
  </li>
  <li class="note">
    <h3 class="note-title"><a href="https://pierremarion23.github.io/thoughts/2026-10-01.html">The future of research in the age of AI</a></h3>
    <p class="note-context">By Pierre Marion.</p>
  </li>
  <li class="note">
    <h3 class="note-title"><a href="https://www.slow-science.com/index.html">The slow science movement</a></h3>
    <p class="note-context">It challenges the “publish or perish” culture: science needs time to read, think and check results, and should be judged on quality rather than on publication counts.</p>
  </li>
  <li class="note">
    <h3 class="note-title"><a href="https://www.change.org/p/a-manifesto-for-the-creation-of-a-european-center-for-ai">A manifesto for the creation of a European center for AI</a></h3>
    <p class="note-context">It grew out of a <a href="https://site.unibo.it/hard-sciences-for-ai/en/roundtable">round table in Bologna</a> chaired by Pierluigi Contucci and Giorgio Parisi in October 2025, and calls for an independent, non-profit research center built on the theoretical foundations of AI, its risks and its safety; anyone can sign it.</p>
  </li>
</ul>

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

Seen a phase transition in the wild or dreamt one up? Describe it to add it to the site&nbsp;:)

<form class="transition-form" id="submit" action="https://api.web3forms.com/submit" method="POST">
  <input type="hidden" name="access_key" value="{{ site.web3forms_key }}">
  <input type="hidden" name="subject" value="New phase transition from jeanbarbier.github.io">
  <input type="hidden" name="from_name" value="jeanbarbier.github.io">
  <input type="hidden" name="redirect" value="{{ '/misc/?sent=1#submit' | absolute_url }}">
  <input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
  <label for="tf-message">Your transition</label>
  <textarea id="tf-message" name="message" rows="3" maxlength="3000" required placeholder="What changes, what drives it, and is it continuous or first order? Optional: leave your mail and name if you want to receive an answer."></textarea>
  <button type="submit" class="form-button">Send</button>
  <p class="tf-status" role="status" aria-live="polite"></p>
</form>
