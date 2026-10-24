---
layout: default
title: Miscellaneous
heading: Miscellaneous
permalink: /misc/
---
Outside science I like rock climbing, skiing and freediving. With friends we make electronic music: [Entropie Collectif](https://soundcloud.com/entropiecollectif). 

## Music I've been listening to

<ul class="albums">
{%- for al in site.data.albums %}
  <li><span class="album-month">{{ al.month | append: "-01" | date: "%B %Y" }}</span><span class="album-name"><a href="{{ al.url }}">{{ al.title }}</a> by {{ al.artist }}{% if al.note and al.note != "" %}. {{ al.note }}{% endif %}</span></li>
{%- endfor %}
</ul>

## Gallery

<div class="gallery">
  {%- for g in site.data.gallery %}
  <figure>
    <a href="{{ '/assets/img/gallery/' | append: g.file | append: '.jpg' | relative_url }}"><img src="{{ '/assets/img/gallery/' | append: g.file | append: '-small.jpg' | relative_url }}" alt="{{ g.alt }}" width="{{ g.w }}" height="{{ g.h }}" loading="lazy"></a>
    {%- if g.caption != "" %}<figcaption>{{ g.caption }}</figcaption>{% endif %}
  </figure>
  {%- endfor %}
</div>

## Worth reading

- [A highly relevant viewpoint on science in the age of AI](https://www.linkedin.com/pulse/where-mathematics-headed-age-ai-marc-m%C3%A9zard-vhvce/), by Marc Mézard.

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
