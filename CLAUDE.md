# Conventions for jeanbarbier.github.io

Jean Barbier's personal and Barbier-group website: Jekyll 3.10 on GitHub Pages, no theme
(file map in README.md). Jean also edits the site himself: always `git pull` before
changing anything. A push to `master` is live after about a minute; check the live page.

## Working with Jean
- Ask before design decisions, and before fixing anything that looks inconsistent.
  When he asks for a proposal, propose the wording before pushing.
- Simple and restrained: no animations, banners or decoration.
- American spelling and US date style ("August 31 – September 4, 2026").
- Uniformity first: the same kind of element looks the same on every page. After a
  change, check the whole site for consistency.

## Identity and content
- The group is the "Barbier group". ERC CHORAL (grant 101039794) is presented as a grant,
  not as the group's name; more grants are expected.
- Navigation: Group, Research, Teaching, Events, Misc. The name in the header links home.
- Home: bio without supervisors' names, ICTP/UNESCO mission sentence, text-only CHORAL
  panel linking to CORDIS, News, Selected papers. No GitHub link.
- Research: Highlights, then Selected papers grouped by theme (full list on Google
  Scholar), then For a wider audience. No separate chronological publication page.
- The photo gallery is the last section of the Group page.
- Misc has no ERC funding footer (`funding: false`): music and personal content are not
  ERC-funded.

## Typography and layout
- Self-hosted fonts: Source Serif 4 for headings and titles, Instrument Sans for text.
  Accent deep blue (#2b4796, #93aeef in dark mode). Automatic dark mode plus a toggle.
- One text width (`--measure`, 42rem) for all text. `--wide` (52rem) only for images,
  the gallery and the home intro.
- Home intro: portrait floated top-left, text wrapping around it; centred above on phones.
- Page introduction: one grey sentence under the h1 (`intro:` front matter).
  Section introduction: one plain sentence under the h2.

## Lists
- Lists grouped by topic (papers, highlights, wider audience, teaching, quotes) use the
  `grouped` class: a 2px vertical rule on the left, starting below the section's
  description, thin separators between items, no line above the first or below the last.
- Item titles everywhere: serif, 1.02rem, weight 520, line-height 1.35, text colour,
  underlined on hover. Description line: 0.95rem, grey, starting with a bold label when
  useful ("Lecture notes.", "Video.").
- Papers are always `pubs compact grouped` (home, Research, highlight pages). Group
  members are darker and bold in author lists. Each author name sits in a nowrap span and
  is never split across lines; author lists and paper titles use plain wrapping (full
  lines).
- Dated lists (News, Events, Music): small grey date column on the left with short
  months ("Oct 2026"; event ranges like "Aug 31 – Sep 4, 2026" in a wider column), text
  on the right, horizontal rules, no vertical rule. On phones the date sits above the text.
- The quotes on Misc share a single vertical rule.
- Every paper in `_data/publications.yml` carries a `bibtex` block (from Crossref when it has
  a DOI, from arXiv otherwise), shown by its "Cite" button. Add one with each new paper.
- Group members' names in author lists link to their entry on the Group page (anchors are
  the slugified names, alumni included).

## Small details
- Header curve: on every page load one phase transition is drawn at random from
  `_data/curves.yml` (never the same twice in a row; the 404 keeps its flat line). Without
  JavaScript the page's own `curve:` front matter shows (default BBP). First-order jumps are real breaks with an open dot
  (limit) and a filled dot (value); small jumps may be enlarged, but the hover text stays
  exact and the click opens the paper or notes.
- Home email is a click-to-copy button; the real address only exists in `assets/js/site.js`.
- `site.js` also prints a short note for the curious in the browser console (PhD openings).
- The 404 page speaks the field's language ("Signal-to-noise ratio below threshold") and
  keeps the redirect for old `/jeanbarbier/...` links.

## Line breaks
- At desktop width, no paragraph or text block may end with a last line of one or two
  words. Fix it by rewording (same meaning) and verify by measuring the rendered lines.
  CSS backs this up: `text-wrap: balance` on headings and item titles, `pretty` on text.
- Exception: paper titles keep plain wrapping, even if one or two words carry over.

## Footer and funding
- EU/ERC logo (252px wide) with the funding statement beside it, vertically centred.
  The statement is the EU-mandated wording: do not edit it.

## Privacy and embeds
- No cookies. Visit statistics with GoatCounter (jeanbarbier.goatcounter.com), on the
  published site only.
- Embeds load only when clicked: YouTube (youtube-nocookie) player under the music list,
  SoundCloud player (300px, shows the list of mixes) for "Play Entropie 10". Starting one stops the other.
- Music list (`_data/albums.yml`): newest first; new entries go at the bottom, one month
  further back.
