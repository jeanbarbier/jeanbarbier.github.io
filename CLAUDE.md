# Conventions for jeanbarbier.github.io

Jean Barbier's personal and Barbier-group website: Jekyll 3.10 on GitHub Pages, no theme
(file map in README.md). Jean also edits the site himself: always `git pull` before
changing anything. A push to `master` is live after about a minute; check the live page.

## Working with Jean
- Ask before design decisions, and before fixing anything that looks inconsistent.
  When he asks for a proposal, propose the wording before pushing.
- Simple and restrained: no animations, banners or decoration. One exception, chosen by Jean:
  the faint background animations, a Turing pattern (on by default) or a network of firing
  neurons, chosen or stopped with header buttons (see Small details).
- American spelling and US date style ("August 31 – September 4, 2026").
- Uniformity first: the same kind of element looks the same on every page. After a
  change, check the whole site for consistency.

## Identity and content
- The group is the "Barbier group". ERC CHORAL (grant 101039794) is presented as a grant,
  not as the group's name; more grants are expected.
- Navigation: Group, Research, Teaching, Events, Misc. The name in the header links home.
- Home: bio without supervisors' names, ICTP/UNESCO mission sentence, text-only CHORAL
  panel linking to CORDIS, News, Selected papers, Trieste, then Quotes I like. No GitHub link.
- Misc: intro "The rest: what I read, what I listen to, and other random things I like
  to share.", then in order: Worth reading, Outside science (hobbies, Entropie Collectif player),
  Music I've been listening to, Submit your phase transition.
- Worth reading links are in sentence case (capital on the first letter only; acronyms such
  as AI and proper names keep theirs), even when the original title is capitalized.
- Research: Highlights, then Selected papers grouped by theme (full list on
  Scholar), then For a wider audience. No separate chronological publication page.
- The photo gallery is the last section of the Group page.
- Misc has no ERC funding footer (`funding: false`): music and personal content are not
  ERC-funded.

## Typography and layout
- Self-hosted fonts: Source Serif 4 for headings and titles, Instrument Sans for text.
  Accent deep blue (#2b4796, #93aeef in dark mode). Dark mode by default for visitors who
  have not chosen (set before first paint in `_includes/head.html`; without JavaScript the
  system setting applies); the light/dark button switches and remembers the choice.
- One text width (`--measure`, 42rem) for all text. `--wide` (52rem) only for images,
  the gallery and the home intro.
- Home intro: portrait floated top-left, text wrapping around it; centred above on phones.
- Page titles carry one emoji right after them (`emoji:` front matter; not in the top bar):
  Group 🤝, Research 🔬, Teaching 🎓, Events 📅, Misc 🎲. The calendar and dice are solid
  shapes, so they are set 10% smaller (`emoji_scale: 0.9`) to look the same size as the others.
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
- Home News, past Events and Music show five items, then scroll; the Selected papers lists
  (home, and each theme on Research) show three (`data-show="3"`). Class `scroll-list`:
  site.js fits the height to the first items and refits when one changes size (an opened
  citation); the bottom fades while more is below. Highlights and other lists do not scroll.
- The quotes (end of the home page) are a `notes compact grouped` list like the others: the
  quote is the item title (serif), the attribution the grey description line.
- Every paper in `_data/publications.yml` carries a `bibtex` block (from Crossref when it has
  a DOI, from arXiv otherwise), shown by its "Cite" button. Add one with each new paper.
- Group members' names in author lists link to their entry on the Group page (anchors are
  the slugified names, alumni included).

## Small details
- Header curve: on every page load one phase transition is drawn at random from
  `_data/curves.yml` (never the same twice in a row; the 404 keeps its flat line). Without
  JavaScript the page's own `curve:` front matter shows (default BBP). First-order jumps are real breaks with an open dot
  (limit) and a filled dot (value); small jumps may be enlarged, but the hover text stays
  exact and the click opens the paper or notes. Eleven invented, just-for-fun transitions
  (`invented: true`) are in the same pool, each with a playful hover text; they link to Misc
  or to the Trieste section of the home page. Each curve also has a short `label`
  written at its left, small and light red-orange (`--curve-note`), placed as close to the
  vertical middle as the curve allows; the longer `title` stays on hover.
- Home: a "Mail" link (styled like the others) copies the address on click; the address is
  never written in the page, only assembled in `assets/js/site.js`, against scraping.
- `site.js` also prints a short note for the curious in the browser console (PhD openings).
- Background animation (`assets/js/turing.js`, canvas in the default layout, every page):
  an evolving Gray-Scott Turing pattern, very faint: deep blue-teal in dark mode (alpha
  0.12), pale version of the header-label orange in light mode (alpha 0.11); switching theme
  recolours it at once. On by default (off for visitors whose system asks for reduced
  motion). The background mode, remembered in localStorage (`bg-anim`: `turing`, `neurons`
  or `off`), is shared by two round buttons left of the light/dark one (accent colour when
  on): spotted icon for the Turing pattern, neuron icon for the neurons. Choosing one stops
  the other; tapping the active one turns animation off. The pattern is handed from page to page (sessionStorage `bg-anim-state`,
  ~0.2 MB, saved on pagehide), so moving around the site does not restart it. Random
  perturbations keep it from settling: every 2 to 6 s (uniform) a disc of 8–19 cells somewhere
  is cleared and reseeded with a few nuclei, and the pattern regrows into it. 300 simulation
  steps/s (10 per frame at ~30 frames/s); runs on the GPU (WebGL2 float textures) with a CPU
  fallback, ~7 px cells stretched by the browser, paused when the tab is hidden. Safety
  nets: the GPU result is checked after warm-up and every 10 s (one small read-back); if it
  holds no pattern the visit continues on the CPU (sessionStorage `bg-anim-cpu`). The shader
  resets any non-number cell, and a handed-over state without a pattern is ignored.
- Neuron animation (`assets/js/neurons.js`, two canvases in `.bg-neurons`): a faint neuron
  culture drawn like a calcium-imaging recording. One neuron per ~120 px (minimum spacing,
  also just beyond the edges), each with its own morphology: irregular soma, 3–6 tapering
  dendritic trees that fork as they grow, one long meandering axon with 1–3 collaterals.
  Synapses: where an axon passes within 40 px of another soma, delay = distance / speed.
  Random firing; a firing neuron lights up whole (fast rise, ~0.9 s calcium-like decay), a
  spike runs down its axon, and each synapse reached fires its target with probability
  0.9/out-degree (slightly subcritical branching): avalanches of all sizes. Green (pale green
  in light mode). Per-visit seed; activity handed from page to page (sessionStorage
  `bg-neurons-state`). 2D canvas: morphology drawn once, each neuron's lit image prepared
  once at half resolution, a frame only blends a few images; ~30 frames/s, paused when hidden.
- The three round buttons (Turing, neurons, light/dark) sit at the right edge of the header,
  level with the name, on every screen size (slightly smaller below 23rem), so the page links
  keep one row.
- Link previews (Slack, email, social media): every page shares the site logo, the BBP curve
  of `favicon.svg`, as `assets/img/og-image.png` (1200x1200, square corners) in a small
  square card (front-matter defaults in `_config.yml`, rendered by jekyll-seo-tag).
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
- Misc ends with "Submit your phase transition": a form sent through Web3Forms (access key
  `web3forms_key` in `_config.yml`, public by design). Anonymous unless the visitor adds a
  name or email; the note under the form names the service (needed for transparency).
  Layout: a 3-line text box that grows with the text, then Name, Email and Send on one row
  (stacked on phones).
