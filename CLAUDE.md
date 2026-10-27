# Conventions for jeanbarbier.github.io

Jean Barbier's personal and Barbier-group website: Jekyll 3.10 on GitHub Pages, no theme
(file map in README.md). Jean also edits the site himself: always `git pull` before
changing anything. A push to `master` is live after about a minute; check the live page.
`SITE_OPTIONS.md` lists every option and default of the site in plain words for Jean. It is
written by `scripts/site_options.py` from the code and data, never by hand: the pre-commit
hook runs it (`git config core.hooksPath .githooks` once per clone) and a GitHub Action runs
it after every push. When adding an option, add it to the script; if the script stops with
"could not find", update its pattern to the new code.

## Working with Jean
- Ask before design decisions, and before fixing anything that looks inconsistent.
  When he asks for a proposal, propose the wording before pushing.
- Simple and restrained: no animations, banners or decoration. One exception, chosen by Jean:
  the faint background animations, the Gray-Scott model (on by default), the 2D Ising model or
  the 2D spin glass, chosen, tuned or stopped from a header menu, and a view mode that shows them
  alone at full strength and lets visitors perturb them by clicking (see Small details).
- American spelling and US date style ("August 31 – September 4, 2026").
- Low cost for visitors' devices: nothing runs when no animation is chosen, and a running
  animation pauses when the tab is hidden or after 6 minutes without interaction (3 was too
  short). Check CPU cost when changing an animation.
- Uniformity first: the same kind of element looks the same on every page. After a
  change, check the whole site for consistency.

## Identity and content
- The group is the "Barbier group". ERC CHORAL (grant 101039794) is presented as a grant,
  not as the group's name; more grants are expected.
- Navigation: Group, Research, Teaching, Events, Misc. The name in the header links home.
- Home: bio without supervisors' names, ICTP/UNESCO mission sentence, text-only CHORAL
  panel linking to CORDIS, News, Selected papers, Trieste, then Quotes I like. No GitHub link.
- Misc: intro "The rest: what I read, what I listen to, and other random things I like
  to share.", then in order: The physics behind the site's animations (`#animations`), Worth
  reading, Outside science (hobbies, Entropie Collectif player), Music I've been listening to,
  Submit your phase transition.
- Physics pages (`physics/*.md`, layout `physics`): /misc/gray-scott/, /misc/ising/,
  /misc/spin-glass/, one per background animation, linked from the first Misc section (a
  `notes compact grouped` list). Each has a crumb back to Misc, the title, a grey `description`,
  a "Run it in the background" button (`data-bg-run`, handled by bg-menu.js; "Stop the
  animation" while it runs), medium-level text with display equations (`<p class="eq">`), a
  "More" list with the Wikipedia link(s), then References from the `refs:` front matter, shown
  as papers (`pubs compact grouped` via `_includes/pub.html`, initials for given names, no Cite
  button; `link_label: Book` for a book). `funding: false`, like Misc. The text must match
  what the simulations actually do (parameters, rates): update both together.
- Worth reading is a `notes compact grouped` list like the quotes: the link is the item title
  (serif), the author or a sentence or two the grey description line; three shown, then
  scroll (`scroll-list`, `data-show="3"`). Titles
  are in sentence case (capital on the first
  letter only; acronyms such as AI and proper names keep theirs), even when the original title
  is capitalized.
- Research: Highlights, then For a wider audience (talk, perspective, press coverage), then
  Selected papers grouped by theme (full list on Scholar). No separate chronological
  publication page. Press coverage of one paper is one item: the title links to the main
  article (ICTP news), the grey line starts with "Press coverage." and links the paper and
  the other outlets (language noted, e.g. "both in Italian"); the matching home News item lists
  the same outlets. Newspaper clippings are cropped to our article only and saved as JPEG
  (about 200 dpi) in `assets/img/press/`.
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
- Sections that are natural subsections of another are presented as such, everywhere on the
  site: h3 under their h2 (serif, `--step-1`), like the themes under Selected papers on Research
  and the subsections of "In more detail" on the physics pages (`.prose h3`).

## Lists
- Lists grouped by topic (papers, highlights, wider audience, teaching, quotes, Worth reading,
  the physics pages on Misc) use the
  `grouped` class: a 2px vertical rule on the left, starting below the section's
  description, thin separators between items, no line above the first or below the last.
- Item titles everywhere: serif, 1.02rem, weight 520, line-height 1.35, text colour,
  underlined on hover. Description line: 0.95rem, grey, starting with a bold label when
  useful ("Lecture notes.", "Video.").
- Papers are always `pubs compact grouped` (home, Research, highlight pages, physics pages). Group
  members are darker and bold in author lists. Each author name sits in a nowrap span and
  is never split across lines; author lists and paper titles use plain wrapping (full
  lines).
- Dated lists (News, Events, Music): small grey date column on the left with short
  months ("Oct 2026"; event ranges like "Aug 31 – Sep 4, 2026" in a wider column), text
  on the right, horizontal rules, no vertical rule. On phones the date sits above the text.
- Home News, past Events and Music show five items, then scroll; the Selected papers lists
  (home, and each theme on Research) and Worth reading show three (`data-show="3"`). Class `scroll-list`:
  site.js fits the height to the first items and refits when one changes size (an opened
  citation); the bottom fades while more is below. Highlights and other lists do not scroll.
- Teaching items (`_data/teaching.yml`): a title without link, then one grey line per document
  (`parts:`) starting with its kind as a bold link to the file ("Lecture notes", "Slides",
  "Crash course"), so the link sits at the same place on every item. Documents close in subject
  share one item.
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
  vertical middle as the curve allows; when the curve crosses it anyway, the plain text is
  written over the curve, never on a background patch (the animation must show through); the
  longer `title` stays on hover.
- Home: a "Mail" link (styled like the others) copies the address on click; the address is
  never written in the page, only assembled in `assets/js/site.js`, against scraping.
- `site.js` also prints a short note for the curious in the browser console (PhD openings).
- Background animation (`assets/js/turing.js`, canvas in the default layout, every page):
  an evolving Gray-Scott Turing pattern, very faint: deep blue-teal in dark mode (alpha
  0.12), pale version of the header-label orange in light mode (alpha 0.11); switching theme
  recolours it at once. On by default (off for visitors whose system asks for reduced
  motion). The background mode, remembered in localStorage (`bg-anim`: `turing`, `ising`,
  `spinglass` or `off`; an old `neurons` value counts as the default), is chosen from the animation menu
  (`assets/js/bg-menu.js`): one round button left of the light/dark one, showing the current
  animation's icon (accent colour while one runs), opening a small card with Gray-Scott
  model, 2D Ising model, 2D spin glass and No animation (current one ticked; closes on outside click or
  Escape, and on choosing No animation; choosing an animation keeps it open so its slider
  shows). Turing slider "Pattern": s from 0 to 1 along a path in the (F, k) plane checked by
  simulation, spots (F 0.026, k 0.0615) to stripes (F 0.046, k 0.0615) to holes (F 0.0415,
  k 0.0592); default 0.25, between spots and stripes; value shown as "F 0.036, k 0.0615", scale spots / stripes / holes;
  remembered (localStorage `bg-turing-s`). A slow drift of ±0.0015 in F and ±0.0002 in k
  around that point, and a small spread across the page, keep it moving. The pattern is handed from page to page (sessionStorage `bg-anim-state`,
  ~0.2 MB, saved on pagehide), so moving around the site does not restart it. Random
  perturbations keep it from settling: every 2 to 6 s (uniform) a disc of 8–19 cells somewhere
  is cleared and reseeded with a few nuclei, and the pattern regrows into it. 300 simulation
  steps/s (10 per frame at ~30 frames/s); runs on the GPU (WebGL2 float textures) with a CPU
  fallback, ~7 px cells stretched by the browser, paused when the tab is hidden. Safety
  nets: the GPU result is checked after warm-up and every 10 s (one small read-back); if it
  holds no pattern the visit continues on the CPU (sessionStorage `bg-anim-cpu`). The shader
  resets any non-number cell, and a handed-over state without a pattern is ignored.
- The neuron animation (a calcium-imaging-like neuron culture) was removed from the menu; its
  code and restore steps are in `_archive/neurons/` (not published) and the whole site as it
  was is on the branch `archive/neurons-animation`.
- Ising animation (`assets/js/ising.js`, canvas `.bg-ising`): the 2D Ising model, by default
  at T = Tc; a temperature slider (0.5 to 2 Tc, Tc marked, value shown as "1.00 Tc")
  sits under the Ising item of the animation menu while Ising runs, applies at once and is remembered (localStorage `bg-ising-T`).
  One pixel per spin (5 CSS px, kept crisp with `image-rendering: pixelated`),
  Metropolis dynamics on a checkerboard with periodic edges, ~20 sweeps/s drawn 10 times a
  second, 600 sweeps of warm-up before fading in. Up spins in the site blue, down spins in
  the curve-label orange, alpha 0.14 (0.12 light). Spins handed from page to page (one bit
  each, sessionStorage `bg-ising-state`).
- Spin-glass animation (`assets/js/spinglass.js`, two canvases in `.bg-sg`): the 2D ±J
  Edwards-Anderson model (couplings ±1, periodic edges, one spin every 26 CSS px), drawn as its
  frustration: frustrated plaquettes as fixed orange dots (curve-label orange, alpha 0.32 dark,
  0.24 light), unsatisfied bonds as blue dual-lattice segments (site blue, alpha 0.24 dark, 0.17
  light, line 1.3 px), which form strings pairing the dots. Metropolis flips at random sites,
  1.5 attempts per spin per second, zero-energy flips accepted with probability 0.12 (calm;
  detailed balance kept); 500 sweeps annealed from T = 2.5 before fading in. Segments fade over
  about half a second in 6 opacity steps; only the cells that change step are redrawn (the whole
  layer when more than 300 change in a frame). Temperature slider under the menu item, 0.2 to 2.5
  (in units of J, shown as "0.80 J"), default 0.8, remembered (localStorage `bg-sg-T`, event
  `bg-sg-temp`). Couplings from a per-visit seed (sessionStorage `bg-sg-seed`), spins handed
  from page to page (sessionStorage `bg-sg-state`). 20 frames per second, paused when hidden.
- All background animations pause when the tab is hidden, and after 6 minutes without any
  interaction with the page (mouse, touch, keyboard, wheel, scroll; `site.js` sets
  `window.bgIdle` and fires `bg-idle-change`). The picture stays frozen and resumes at the
  first interaction. Nothing runs on a timer while paused.
- View mode (eye button, `assets/js/bg-view.js`, between the animation menu and light/dark):
  the page fades out (0.5 s), the three round buttons stay fixed at the top right with an opaque
  background, the animation goes to full strength (opacity 1, eased over 0.6 s: `window.bgViewMix`
  and `bg-view-mix` events), and the page neither scrolls nor zooms. Leave with the same button or
  Escape (Escape first closes the menu if open); entering with No animation starts the Gray-Scott
  model; choosing No animation leaves view mode; not remembered between pages. Clicks and taps
  (not on the buttons, not while the menu is open) are sent as `bg-poke` events: Gray-Scott, a tap
  drops a disc of V (u = 1, v ≈ 0.5, radius 63 px), renewed every 150 ms while held, and moving
  more than 10 px turns the gesture into an eraser (u = 1, v = 0, radius 35 px) along the path;
  Ising, a field h = 20 J against the majority of a 50 px disc, following a drag and staying 0.4 s
  after release; spin glass, a droplet of radius 120 px is flipped (its boundary ring shows at once,
  then relaxes), and a drag flips a new one every 120 px. The physics pages describe this in their
  "On this site" sections: keep both in step.
- The three round buttons (animation menu, view mode, light/dark) sit at the right edge of the
  header, level with the name, on every screen size (slightly smaller below 23rem), so the page
  links keep one row.
- Logo (`favicon.svg`, browser tab) and link previews (Slack, email, social media): a
  first-order transition, the sparse spiked Wigner overlap of `_data/curves.yml` (flat at zero,
  then a jump marked by an open dot at the limit and a filled dot at the value, as in the header
  curves), white on #2e3b6f. Every page shares it as `assets/img/og-image.png` (1200x1200, square
  corners) in a small square card (front-matter defaults in `_config.yml`, rendered by
  jekyll-seo-tag).
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
  `web3forms_key` in `_config.yml`, public by design). A single 3-line text box that grows
  with the text (no Name or Email fields: its placeholder ends "Optional: leave your mail and
  name if you want to receive an answer."), then Send below it at the left. The note under
  the form names the service (needed for transparency).
