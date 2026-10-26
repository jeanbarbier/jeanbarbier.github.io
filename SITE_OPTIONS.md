# Site options

Everything a visitor gets by default, what they can change, and every setting of the site, in plain words. **This file is written by `scripts/site_options.py` from the code and data**, before every commit and after every push, so it always matches the site. Do not edit it by hand: change the site, and this page follows. The design rules behind these choices are in `CLAUDE.md`.

## A new visitor

| What | Default |
|---|---|
| Theme | Dark mode, whatever the system setting (without JavaScript: the system setting) |
| Background animation | The Gray-Scott model; no animation if the system asks for reduced motion |
| Gray-Scott pattern | 0.25 on the spots - stripes - holes slider (F 0.036, k 0.0615), between spots and stripes |
| Ising temperature, when chosen | 1.00 T<sub>c</sub> |
| Spin-glass temperature, when chosen | 0.80 J |
| Header curve | one of 15 phase transitions at random, never the same twice in a row |
| Cookies | none |
| Visit statistics | GoatCounter (jeanbarbier.goatcounter.com), on the published site only |

## What visitors can change, and what is remembered

Remembered by the browser across visits (localStorage):

- light or dark theme (`theme`), from the round half-moon button;
- the background animation (`bg-anim`: `turing`, `ising`, `spinglass` or `off`), from the round animation button;
- the slider of each animation: Gray-Scott pattern (`bg-turing-s`), Ising temperature (`bg-ising-T`), spin-glass temperature (`bg-sg-T`).

Kept only while the tab is open (sessionStorage):

- the running animation, handed from page to page so that moving around the site does not restart it (`bg-anim-state`, `bg-ising-state`, `bg-sg-state`);
- the random couplings of the spin glass (`bg-sg-seed`), so they stay the same during a visit;
- the last header curve (`curve`), so the next page draws a different one;
- `bg-anim-cpu`, set if the graphics card failed the Gray-Scott check (the visit continues on the CPU).

## Background animations

### All of them

- Chosen from the round button left of the theme button, at the right of the name. The menu lists Gray-Scott model, 2D Ising model, 2D spin glass and No animation; the running one is ticked and its slider shows under it.
- Nothing runs when No animation is chosen.
- They pause when the tab is hidden (another tab, window minimized, phone locked or in another app), and after **6 minutes** without any interaction with the page (mouse, touch, keyboard, wheel, scroll). The picture stays frozen and starts again at the first interaction. Nothing runs while paused.
- Each physics page on Misc has a "Run it in the background" button for its animation.

### Gray-Scott model (`assets/js/turing.js`)

| Setting | Value |
|---|---|
| Colors, dark mode | from rgb(38, 72, 132) to rgb(34, 128, 140), opacity 0.12 |
| Colors, light mode | from rgb(240, 150, 90) to rgb(232, 106, 69), opacity 0.11 |
| Slider "Pattern" | 0 to 1: spots (F 0.026, k 0.0615), stripes at 0.5 (F 0.046, k 0.0615), holes at 1 (F 0.0415, k 0.0592); default 0.25 |
| Slow drift around the chosen point | ±0.0015 in F, ±0.0002 in k; spread across the page ±0.0012 in F, ∓0.0002 in k |
| Random kicks | every 2 to 6 s, a disc of radius 8 to 19 cells is wiped and reseeded |
| Grid | one cell per 7 px, stretched by the browser |
| Speed | 10 steps every 33 ms, about 300 steps per second |
| Warm-up | 2500 steps off-screen, then it fades in |
| Hardware | graphics card (WebGL2) when possible, checked after warm-up and every 10 s; otherwise the CPU |

### 2D Ising model (`assets/js/ising.js`)

| Setting | Value |
|---|---|
| Colors, dark mode | up spins rgb(90, 130, 230), down spins rgb(255, 149, 117), opacity 0.15 |
| Colors, light mode | up spins rgb(43, 71, 150), down spins rgb(232, 106, 69), opacity 0.10 |
| Slider "Temperature" | 0.5 to 2 T<sub>c</sub> (T<sub>c</sub> marked), default 1 T<sub>c</sub> |
| Grid | one spin per 5 px (at most 80000 spins), kept crisp |
| Speed | 2 sweeps every 100 ms, 20 sweeps per second |
| Warm-up | 600 sweeps from random spins, then it fades in |

### 2D spin glass (`assets/js/spinglass.js`)

| Setting | Value |
|---|---|
| Colors, dark mode | strings (unsatisfied bonds) rgb(147, 174, 239), opacity 0.24; dots (frustrated plaquettes) rgb(255, 149, 117), opacity 0.32 |
| Colors, light mode | strings rgb(43, 71, 150), opacity 0.17; dots rgb(232, 106, 69), opacity 0.24 |
| Slider "Temperature" | 0.2 to 2.5 J, default 0.8 J |
| Grid | one spin every 26 px; lines 1.3 px |
| Dynamics | 1.5 flip attempts per spin per second at random sites; flips that cost no energy accepted with probability 0.12 |
| Drawing | 20 frames per second; each segment fades in or out in 6 steps (easing 0.25 per frame); only changed cells are redrawn, the whole layer above 300 changes |
| Warm-up | 500 sweeps, cooling from T = 2.5 J, then it fades in |
| Disorder | new random couplings for each visit, kept from page to page |

## Lists that scroll

| Page | List | Items shown before scrolling |
|---|---|---|
| Home | News | 5 |
| Home | Selected papers | 3 |
| Events | Past events | 5 |
| Research | Selected papers: Deep neural networks beyond the linear regime | 3 |
| Research | Selected papers: Training, fine-tuning and representations | 3 |
| Research | Selected papers: Matrix inference and random matrices | 3 |
| Research | Selected papers: Rigorous foundations of high-dimensional inference | 3 |
| Research | Selected papers: Coding and communication | 3 |
| Research | Selected papers: Combinatorial optimization | 3 |
| Misc | Worth reading | 3 |
| Misc | Music I've been listening to | 5 |

Other lists (highlights, teaching, quotes, the physics pages, events to come) show everything. While more is below, the bottom of a list fades.

## Pages and sections

Top bar: **Group, Research, Teaching, Events, Misc** (the name links home), tagline "Physics of learning + Maths of high dimensions".

- **Home**: News, Selected papers, Trieste, Quotes I like.
- **Group**: Principal investigator, Postdocs, PhD students, Former members, Join us, Gallery.
- **Research**: Highlights, For a wider audience, Selected papers.
  Selected papers by theme: Deep neural networks beyond the linear regime; Training, fine-tuning and representations; Matrix inference and random matrices; Rigorous foundations of high-dimensional inference; Coding and communication; Combinatorial optimization.
- **Teaching**: one item per subject, without sections; under each title, one line per document, starting with its kind as the link ("Lecture notes", "Slides", ...).
- **Events**: Upcoming, Past.
  An event moves from Upcoming to Past by itself once its end date has passed.
- **Misc**: The physics behind the site's animations, Worth reading, Outside science, Music I've been listening to, Submit your phase transition.

Pages on the physics of the animations (linked from Misc):

- [The Gray-Scott model](https://jeanbarbier.github.io/misc/gray-scott/) (animation `turing`): Wikipedia [Reaction–diffusion system](https://en.wikipedia.org/wiki/Reaction%E2%80%93diffusion_system), [Turing pattern](https://en.wikipedia.org/wiki/Turing_pattern); 4 references.
- [The 2D Ising model](https://jeanbarbier.github.io/misc/ising/) (animation `ising`): Wikipedia [Ising model](https://en.wikipedia.org/wiki/Ising_model), [Square-lattice Ising model](https://en.wikipedia.org/wiki/Square-lattice_Ising_model); 5 references.
- [The 2D spin glass](https://jeanbarbier.github.io/misc/spin-glass/) (animation `spinglass`): Wikipedia [Spin glass](https://en.wikipedia.org/wiki/Spin_glass), [Geometrical frustration](https://en.wikipedia.org/wiki/Geometrical_frustration); 7 references.

Header curves, drawn at random on each page load (4 real ones, from papers and notes, and 11 invented for fun):

BBP transition, Specialization in deep networks, Denoising–factorization transition, Sparse spiked Wigner model, *Theorems vs. espressos*, *Double first-order transition*, *Re-entrant transition*, *Hysteresis loop*, *Devil's staircase*, *Infinite-order transition*, *ICTP in the sea vs. time of day*, *Hats flying in Trieste vs. Bora*, *Grokking*, *Productivity vs. time*, *Techno: the drop* (invented ones in italics).

## Look

| What | Setting |
|---|---|
| Fonts | Source Serif 4 (titles), Instrument Sans (text), served by the site |
| Accent color | #2b4796 in light mode, #93aeef in dark mode |
| Text width | 42rem; images, gallery and home intro 52rem |
| Page-title emojis | Group 🤝, Research 🔬, Teaching 🎓, Events 📅 (90% size), Miscellaneous 🎲 (90% size) |
| Link previews (Slack, email, ...) | the site logo, the BBP curve (`assets/img/og-image.png`) |
| ERC funding statement | footer of every page except: Miscellaneous, The 2D Ising model, The 2D spin glass, The Gray-Scott model |

## Privacy and outside services

- No cookies. Visit statistics: GoatCounter, published site only.
- The email address is never written in the page: the "Mail" link assembles and copies it.
- YouTube (privacy-enhanced youtube-nocookie) and SoundCloud players load only when clicked; starting one stops the other.
- "Submit your phase transition" (Misc) is sent through Web3Forms; anonymous unless the visitor adds a name or email.

## Content

| What | Number |
|---|---|
| News items | 6 |
| Publications | 29 |
| of which on the home page (selected) | 6 |
| Highlight articles | 4 |
| Events | 10 |
| Teaching items | 3 |
| Albums in the music list | 9 |
| Postdocs / PhD students / former members | 3 / 4 / 12 |
| Header curves (from papers + invented) | 4 + 11 |

## Where to change things

| To change | Edit |
|---|---|
| News, events, publications, teaching, music, people | `_data/*.yml` |
| Header curves | `_data/curves.yml` |
| Page text | `index.html`, `group.html`, `research.html`, `teaching.html`, `events.html`, `misc.md`, `physics/*.md` |
| Default theme | `_includes/head.html` |
| Animations: colors, speed, defaults | constants at the top of `assets/js/turing.js`, `ising.js`, `spinglass.js` (slider ranges also in `_includes/header.html` and `assets/js/bg-menu.js`) |
| Pause after inactivity | `IDLE_MS` in `assets/js/site.js` |
| Items shown in a scrolling list | `data-show` on the list (default 5 in `assets/js/site.js`) |
| Colors, fonts, widths | `assets/css/main.css` |
