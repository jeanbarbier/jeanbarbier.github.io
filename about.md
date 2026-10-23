---
layout: default
title: About
heading: About
permalink: /about/
---
ICTP is a [UNESCO](https://www.unesco.org/en) institute whose mission combines research with teaching and scientific capacity building for the developing world. It is a special place to do research and have an impact beyond it.

ICTP and SISSA are in Trieste, a city on the Adriatic with a long scientific tradition. ICTP sits by the sea, below Miramare castle: going for a swim at lunchtime is easy.

![Aerial view of the ICTP campus and Miramare on the Gulf of Trieste]({{ '/assets/img/ictp-miramare.jpg' | relative_url }}){: .wide-img width="1024" height="682" loading="lazy"}

Outside science I make electronic music (mine and my friends' is on [Entropie Collectif](https://soundcloud.com/entropiecollectif)), and I like rock climbing, skiing and freediving.

## Albums I've been listening to

<ul class="albums">
{%- for al in site.data.albums %}
  <li><span class="album-month">{{ al.month | append: "-01" | date: "%B %Y" }}</span><span class="album-name"><a href="{{ al.url }}">{{ al.title }}</a> by {{ al.artist }}{% if al.note and al.note != "" %}. {{ al.note }}{% endif %}</span></li>
{%- endfor %}
</ul>

## Quotes I like

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
