#!/usr/bin/env python3
"""Write SITE_OPTIONS.md: every option of the site in plain words, read from the code and data.

Run from the repository root:  python3 scripts/site_options.py
It runs by itself before every commit (git hook in .githooks/) and after every push to master
(GitHub Action in .github/workflows/), so SITE_OPTIONS.md always describes the site as it is.
If a value can no longer be found (the code was reorganized), the script stops with an error
naming it: update the pattern below. To document a new option, add it to the text at the end.
No dependencies beyond Python 3 (standard library only).
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'SITE_OPTIONS.md')


def read(path):
    with open(os.path.join(ROOT, path), encoding='utf-8') as f:
        return f.read()


def find(path, pattern, what, group=1, flags=0):
    """First match of pattern in file, or stop with a clear message."""
    m = re.search(pattern, read(path), flags)
    if not m:
        sys.exit(f'site_options.py: could not find {what} in {path} (pattern {pattern!r})')
    return m.group(group)


def num(path, name):
    """Value of a numeric constant `NAME = value` in a JS file."""
    return find(path, r'\b' + re.escape(name) + r'\s*=\s*([-0-9.]+)', f'the constant {name}')


def fmt(x):
    x = float(x)
    return str(int(x)) if x == int(x) else ('%g' % x)


def op(a):
    return '%.2f' % float(a)


def rgb(s):
    return 'rgb(' + ', '.join(p.strip() for p in s.split(',')) + ')'


def count(path, pattern, flags=re.M):
    return len(re.findall(pattern, read(path), flags))


# ---------------------------------------------------------------------------------------------
# Values read from the site
# ---------------------------------------------------------------------------------------------
TUR, ISI, SG, SITE, MENU = ('assets/js/turing.js', 'assets/js/ising.js', 'assets/js/spinglass.js',
                            'assets/js/site.js', 'assets/js/bg-menu.js')
VIEW = 'assets/js/bg-view.js'

# Default theme (inline script in the head, before first paint)
theme_default = find('_includes/head.html', r"var t = '(dark|light)';", 'the default theme')

# Default animation, and what reduced motion does (same logic in every animation script)
default_mode = find(TUR, r"return calmMq\.matches \? '(\w+)' : '(\w+)';", 'the default animation', 2)
calm_mode = find(TUR, r"return calmMq\.matches \? '(\w+)' : '(\w+)';", 'the reduced-motion choice', 1)
NAMES = {'turing': 'the Gray-Scott model', 'ising': 'the 2D Ising model', 'spinglass': 'the 2D spin glass',
         'off': 'no animation'}

idle_ms = 1
for factor in find(SITE, r'IDLE_MS\s*=\s*([0-9 *]+),', 'the idle delay').split('*'):
    idle_ms *= float(factor)
idle_min = fmt(idle_ms / 60000)

# Gray-Scott
t_def = float(num(TUR, 'PATTERN_DEFAULT'))
path_a = find(TUR, r'if \(s <= 0\.5\) return \[([0-9.]+) \+ ([0-9.]+) \* s, ([0-9.]+)\];', 'the spots-stripes path', 0)
fa, fslope, k1 = [float(v) for v in re.findall(r'[0-9.]+', path_a)[1:4]]
path_b = find(TUR, r'return \[([0-9.]+) - ([0-9.]+) \* b, ([0-9.]+) - ([0-9.]+) \* b\];', 'the stripes-holes path', 0)
fb, fdrop, kb, kdrop = [float(v) for v in re.findall(r'[0-9.]+', path_b)]


def path_fk(s):
    if s <= 0.5:
        return fa + fslope * s, k1
    b = (s - 0.5) / 0.5
    return fb - fdrop * b, kb - kdrop * b


f_def, k_def = path_fk(t_def)
f_spots, k_spots = path_fk(0)
f_stripes, k_stripes = path_fk(0.5)
f_holes, k_holes = path_fk(1)
drift_f = find(TUR, r'f0: b\[0\] \+ ([0-9.]+) \* Math\.sin', 'the drift in F')
drift_k = find(TUR, r'k0: b\[1\] \+ ([0-9.]+) \* Math\.sin', 'the drift in k')
spread_f, spread_k = re.search(r'float f=f0\+([0-9.]+)\*q,k=k0-([0-9.]+)\*q', read(TUR)).groups()
tur_pal = {m: re.search(m + r': \{ lo: \[([^\]]+)\], hi: \[([^\]]+)\], alpha: ([0-9.]+) \}', read(TUR)).groups()
           for m in ('dark', 'light')}
tur_cell, tur_steps, tur_frame, tur_warm = (num(TUR, 'CELL'), num(TUR, 'STEPS_PER_FRAME'), num(TUR, 'FRAME_MS'),
                                            num(TUR, 'WARMUP'))
kick_min, kick_max, kick_r, kick_extra = (num(TUR, 'KICK_MIN_MS'), num(TUR, 'KICK_MAX_MS'), num(TUR, 'KICK_R'),
                                          num(TUR, 'KICK_R_EXTRA'))
gpu_check_s = fmt(float(find(TUR, r'nextCheckAt = now \+ (\d+);', 'the GPU check interval')) / 1000)
tur_drop_r, tur_erase_r, tur_drag, tur_hold = (num(TUR, 'DROP_R_PX'), num(TUR, 'ERASE_R_PX'), num(TUR, 'DRAG_PX'),
                                               num(TUR, 'HOLD_MS'))

# View mode
view_fade = num(VIEW, 'FADE_MS')

# Ising
isi_def, isi_min, isi_max = num(ISI, 'T_DEFAULT'), num(ISI, 'T_MIN'), num(ISI, 'T_MAX')
isi_cell, isi_max_spins = num(ISI, 'CELL'), num(ISI, 'MAX_SPINS')
isi_frame, isi_sweeps, isi_warm = num(ISI, 'FRAME_MS'), num(ISI, 'SWEEPS_PER_FRAME'), num(ISI, 'WARMUP')
isi_field_r, isi_field_h, isi_field_after = num(ISI, 'FIELD_R_PX'), num(ISI, 'FIELD_H'), num(ISI, 'FIELD_AFTER_MS')
isi_pal = {m: re.search(m + r': \{ up: \[([^\]]+)\], down: \[([^\]]+)\], alpha: ([0-9.]+) \}', read(ISI)).groups()
           for m in ('dark', 'light')}

# Spin glass
sg_def, sg_min, sg_max = num(SG, 'T_DEFAULT'), num(SG, 'T_MIN'), num(SG, 'T_MAX')
sg_cell, sg_frame, sg_rate, sg_zero = num(SG, 'CELL'), num(SG, 'FRAME_MS'), num(SG, 'RATE'), num(SG, 'ZERO')
sg_fade, sg_warm, sg_anneal = num(SG, 'FADE'), num(SG, 'WARMUP'), num(SG, 'T_ANNEAL')
sg_levels, sg_full, sg_line = num(SG, 'LEVELS'), num(SG, 'FULL_LIMIT'), num(SG, 'LINE')
sg_droplet = num(SG, 'DROPLET_R_PX')
sg_pal = {m: re.search(m + r': \{ string: \[([^\]]+)\], stringAlpha: ([0-9.]+), dot: \[([^\]]+)\], dotAlpha: ([0-9.]+) \}',
                       read(SG)).groups() for m in ('dark', 'light')}

# Scrolling lists: default count in site.js, data-show on the page
show_default = find(SITE, r"parseInt\(ul\.getAttribute\('data-show'\), 10\) \|\| (\d+)", 'the default list length')
scroll_lists = []
for page, label in (('index.html', 'Home'), ('events.html', 'Events'), ('research.html', 'Research'),
                    ('misc.md', 'Misc')):
    for m in re.finditer(r'<ul class="[^"]*scroll-list[^"]*"([^>]*)>', read(page)):
        attrs = m.group(1)
        name = re.search(r'aria-label="([^"]+)"', attrs).group(1)
        shown = re.search(r'data-show="(\d+)"', attrs)
        scroll_lists.append((label, name, shown.group(1) if shown else show_default))

# Header curves
curves = re.findall(r'^([a-z_0-9]+):\n((?:  .*\n?)*)', read('_data/curves.yml'), re.M)
curve_rows = []
for key, body in curves:
    if key == 'flat':
        continue
    label = re.search(r'^  label: "?(.*?)"?$', body, re.M).group(1)
    curve_rows.append((label, 'invented' in body and 'invented: true' in body))
n_inv = sum(1 for _, inv in curve_rows if inv)

# Pages and their sections, in order
def sections(path):
    text = read(path)
    found = re.findall(r'<h2>([^<{]+)</h2>|^## ([^{\n]+?)(?:\s*\{#[^}]*\})?$', text, re.M)
    return [a or b for a, b in found]


def front(path, key):
    m = re.search(r'^' + key + r':\s*"?(.*?)"?\s*(?:#.*)?$', read(path), re.M)
    return m.group(1) if m else ''


themes = re.findall(r'aria-label="Selected papers: ([^"]+)"', read('research.html'))
physics = []
for f in sorted(os.listdir(os.path.join(ROOT, 'physics'))):
    if f.endswith('.md'):
        p = 'physics/' + f
        wiki = re.findall(r'\[([^\]]+)\]\((https://en\.wikipedia\.org/[^)]+)\)', read(p))
        physics.append((front(p, 'title'), front(p, 'permalink'), front(p, 'mode'), wiki,
                        count(p, r'^  - title:')))

# Look
accent_light = find('assets/css/main.css', r'--accent:\s*(#[0-9a-fA-F]{6})', 'the light accent colour')
accent_dark = find('assets/css/main.css', r'\[data-theme="dark"\][^{]*\{[^}]*?--accent:\s*(#[0-9a-fA-F]{6})',
                   'the dark accent colour', flags=re.S)
measure = find('assets/css/main.css', r'--measure:\s*([0-9.]+rem)', 'the text width')
wide = find('assets/css/main.css', r'--wide:\s*([0-9.]+rem)', 'the wide width')
emojis = [(front(p, 'title'), front(p, 'emoji'), front(p, 'emoji_scale'))
          for p in ('group.html', 'research.html', 'teaching.html', 'events.html', 'misc.md')]
nav = re.findall(r'\{ title: ([^,]+), url: ([^ }]+) \}', read('_config.yml'))
tagline = find('_config.yml', r'^tagline:\s*(.+)$', 'the tagline', flags=re.M)

# Content counts
people = read('_data/people.yml')
def people_in(section):
    m = re.search(r'^' + section + r':\n((?:[ #].*\n?|\n)*)', people, re.M)
    return len(re.findall(r'^  - ', m.group(1), re.M)) if m else 0


counts = [
    ('News items', count('_data/news.yml', r'^- date:')),
    ('Publications', count('_data/publications.yml', r'^- title:')),
    ('of which on the home page (selected)', count('_data/publications.yml', r'^  selected: true')),
    ('Highlight articles', len([f for f in os.listdir(os.path.join(ROOT, '_highlights')) if f.endswith('.md')])),
    ('Events', count('_data/events.yml', r'^- name:')),
    ('Teaching items', count('_data/teaching.yml', r'^- title:')),
    ('Albums in the music list', count('_data/albums.yml', r'^- ')),
    ('Postdocs / PhD students / former members', '%d / %d / %d' % (people_in('postdocs'), people_in('phd'),
                                                                   people_in('alumni'))),
    ('Header curves (from papers + invented)', '%d + %d' % (len(curve_rows) - n_inv, n_inv)),
]

# ---------------------------------------------------------------------------------------------
# The document
# ---------------------------------------------------------------------------------------------
L = []
w = L.append
w('# Site options')
w('')
w('Everything a visitor gets by default, what they can change, and every setting of the site, in '
  'plain words. **This file is written by `scripts/site_options.py` from the code and data**, '
  'before every commit and after every push, so it always matches the site. Do not edit it by '
  'hand: change the site, and this page follows. The design rules behind these choices are in '
  '`CLAUDE.md`.')
w('')
w('## A new visitor')
w('')
w('| What | Default |')
w('|---|---|')
w('| Theme | %s mode, whatever the system setting (without JavaScript: the system setting) |'
  % theme_default.capitalize())
w('| Background animation | %s; %s if the system asks for reduced motion |'
  % (NAMES[default_mode][0].upper() + NAMES[default_mode][1:], NAMES[calm_mode]))
w('| Gray-Scott pattern | %s on the spots - stripes - holes slider (F %.3f, k %.4f), between spots and stripes |'
  % (fmt(t_def), f_def, k_def))
w('| Ising temperature, when chosen | %s T<sub>c</sub> |' % ('%.2f' % float(isi_def)))
w('| Spin-glass temperature, when chosen | %s J |' % ('%.2f' % float(sg_def)))
w('| Header curve | one of %d phase transitions at random, never the same twice in a row |' % len(curve_rows))
w('| Cookies | none |')
w('| Visit statistics | GoatCounter (jeanbarbier.goatcounter.com), on the published site only |')
w('')
w('## What visitors can change, and what is remembered')
w('')
w('Remembered by the browser across visits (localStorage):')
w('')
w('- light or dark theme (`theme`), from the round half-moon button;')
w('- the background animation (`bg-anim`: `turing`, `ising`, `spinglass` or `off`), from the round '
  'animation button;')
w('- the slider of each animation: Gray-Scott pattern (`bg-turing-s`), Ising temperature (`bg-ising-T`), '
  'spin-glass temperature (`bg-sg-T`).')
w('')
w('Kept only while the tab is open (sessionStorage):')
w('')
w('- the running animation, handed from page to page so that moving around the site does not '
  'restart it (`bg-anim-state`, `bg-ising-state`, `bg-sg-state`);')
w('- the random couplings of the spin glass (`bg-sg-seed`), so they stay the same during a visit;')
w('- the last header curve (`curve`), so the next page draws a different one;')
w('- `bg-anim-cpu`, set if the graphics card failed the Gray-Scott check (the visit continues on the CPU).')
w('')
w('## Background animations')
w('')
w('### All of them')
w('')
w('- Chosen from the round button left of the theme button, at the right of the name. The menu lists '
  'Gray-Scott model, 2D Ising model, 2D spin glass and No animation; the running one is ticked and '
  'its slider shows under it.')
w('- Nothing runs when No animation is chosen.')
w('- They pause when the tab is hidden (another tab, window minimized, phone locked or in another app), '
  'and after **%s minutes** without any interaction with the page (mouse, touch, keyboard, wheel, '
  'scroll). The picture stays frozen and starts again at the first interaction. Nothing runs while '
  'paused.' % idle_min)
w('- Each physics page on Misc has a "Run it in the background" button for its animation.')
w('- **View mode** (round eye button, between the animation button and the theme button): the page '
  'fades out, the three round buttons stay at the top right, and the animation shows at full strength '
  '(it gets there in %s s). The page neither scrolls nor zooms. Clicks and taps on the animation perturb '
  'it (see each animation below). Leave with the same button or Escape. Entering with No animation '
  'starts %s; choosing No animation leaves view mode. Not remembered from page to page.'
  % (fmt(float(view_fade) / 1000), NAMES['turing']))
w('')
w('### Gray-Scott model (`assets/js/turing.js`)')
w('')
w('| Setting | Value |')
w('|---|---|')
w('| Colors, dark mode | from %s to %s, opacity %s |' % (rgb(tur_pal['dark'][0]), rgb(tur_pal['dark'][1]),
                                                        op(tur_pal['dark'][2])))
w('| Colors, light mode | from %s to %s, opacity %s |' % (rgb(tur_pal['light'][0]), rgb(tur_pal['light'][1]),
                                                         op(tur_pal['light'][2])))
w('| Slider "Pattern" | 0 to 1: spots (F %.3f, k %.4f), stripes at 0.5 (F %.3f, k %.4f), holes at 1 '
  '(F %.4f, k %.4f); default %s |' % (f_spots, k_spots, f_stripes, k_stripes, f_holes, k_holes, fmt(t_def)))
w('| Slow drift around the chosen point | ±%s in F, ±%s in k; spread across the page ±%s in F, ∓%s in k |'
  % (drift_f, drift_k, spread_f, spread_k))
w('| Random kicks | every %s to %s s, a disc of radius %s to %s cells is wiped and reseeded |'
  % (fmt(float(kick_min) / 1000), fmt(float(kick_max) / 1000), kick_r, fmt(float(kick_r) + float(kick_extra))))
w('| Grid | one cell per %s px, stretched by the browser |' % tur_cell)
w('| Speed | %s steps every %s ms, about %d steps per second |'
  % (tur_steps, tur_frame, round(float(tur_steps) * 1000 / float(tur_frame), -1)))
w('| Warm-up | %s steps off-screen, then it fades in |' % tur_warm)
w('| Hardware | graphics card (WebGL2) when possible, checked after warm-up and every %s s; '
  'otherwise the CPU |' % gpu_check_s)
w('| Clicks in view mode | a tap drops a disc of V of radius %s px (it flashes, then collapses into a ring of '
  'spots), renewed every %s ms while held; moving more than %s px erases a path of radius %s px |'
  % (tur_drop_r, tur_hold, tur_drag, tur_erase_r))
w('')
w('### 2D Ising model (`assets/js/ising.js`)')
w('')
w('| Setting | Value |')
w('|---|---|')
w('| Colors, dark mode | up spins %s, down spins %s, opacity %s |' % (rgb(isi_pal['dark'][0]),
                                                                    rgb(isi_pal['dark'][1]), op(isi_pal['dark'][2])))
w('| Colors, light mode | up spins %s, down spins %s, opacity %s |' % (rgb(isi_pal['light'][0]),
                                                                     rgb(isi_pal['light'][1]), op(isi_pal['light'][2])))
w('| Slider "Temperature" | %s to %s T<sub>c</sub> (T<sub>c</sub> marked), default %s T<sub>c</sub> |'
  % (fmt(isi_min), fmt(isi_max), fmt(isi_def)))
w('| Grid | one spin per %s px (at most %s spins), kept crisp |' % (isi_cell, isi_max_spins))
w('| Speed | %s sweeps every %s ms, %d sweeps per second |'
  % (isi_sweeps, isi_frame, round(float(isi_sweeps) * 1000 / float(isi_frame))))
w('| Warm-up | %s sweeps from random spins, then it fades in |' % isi_warm)
w('| Clicks in view mode | a magnetic field h = %s J on a disc of radius %s px, against the majority of its '
  'spins (it paints the other color); it follows a drag and stays %s s after release |'
  % (isi_field_h, isi_field_r, fmt(float(isi_field_after) / 1000)))
w('')
w('### 2D spin glass (`assets/js/spinglass.js`)')
w('')
w('| Setting | Value |')
w('|---|---|')
w('| Colors, dark mode | strings (unsatisfied bonds) %s, opacity %s; dots (frustrated plaquettes) %s, opacity %s |'
  % (rgb(sg_pal['dark'][0]), op(sg_pal['dark'][1]), rgb(sg_pal['dark'][2]), op(sg_pal['dark'][3])))
w('| Colors, light mode | strings %s, opacity %s; dots %s, opacity %s |'
  % (rgb(sg_pal['light'][0]), op(sg_pal['light'][1]), rgb(sg_pal['light'][2]), op(sg_pal['light'][3])))
w('| Slider "Temperature" | %s to %s J, default %s J |' % (fmt(sg_min), fmt(sg_max), fmt(sg_def)))
w('| Grid | one spin every %s px; lines %s px |' % (sg_cell, sg_line))
w('| Dynamics | %s flip attempts per spin per second at random sites; flips that cost no energy accepted '
  'with probability %s |' % (sg_rate, sg_zero))
w('| Drawing | %d frames per second; each segment fades in or out in %s steps (easing %s per frame); only '
  'changed cells are redrawn, the whole layer above %s changes |'
  % (round(1000 / float(sg_frame)), sg_levels, sg_fade, sg_full))
w('| Warm-up | %s sweeps, cooling from T = %s J, then it fades in |' % (sg_warm, fmt(sg_anneal)))
w('| Disorder | new random couplings for each visit, kept from page to page |')
w('| Clicks in view mode | flips every spin within %s px (a droplet): a ring of strings appears on its '
  'boundary and relaxes; a drag flips a new droplet every %s px |' % (sg_droplet, sg_droplet))
w('')
w('## Lists that scroll')
w('')
w('| Page | List | Items shown before scrolling |')
w('|---|---|---|')
for page, name, shown in scroll_lists:
    w('| %s | %s | %s |' % (page, name, shown))
w('')
w('Other lists (highlights, teaching, quotes, the physics pages, events to come) show everything. '
  'While more is below, the bottom of a list fades.')
w('')
w('## Pages and sections')
w('')
w('Top bar: **%s** (the name links home), tagline "%s".' % (', '.join(t for t, _ in nav),
                                                          tagline.strip()))
w('')
for path, title in (('index.html', 'Home'), ('group.html', 'Group'), ('research.html', 'Research'),
                    ('teaching.html', 'Teaching'), ('events.html', 'Events'), ('misc.md', 'Misc')):
    secs = sections(path)
    intro = front(path, 'intro')
    if path == 'teaching.html':
        w('- **Teaching**: one item per subject, without sections; under each title, one line per document, '
          'starting with its kind as the link ("Lecture notes", "Slides", ...).')
        continue
    w('- **%s**: %s.' % (title, ', '.join(secs)))
    if path == 'research.html':
        w('  Selected papers by theme: ' + '; '.join(themes) + '.')
    if path == 'events.html':
        w('  An event moves from Upcoming to Past by itself once its end date has passed.')
w('')
w('Pages on the physics of the animations (linked from Misc):')
w('')
for title, link, mode, wiki, nrefs in physics:
    w('- [%s](https://jeanbarbier.github.io%s) (animation `%s`): Wikipedia %s; %d references.'
      % (title, link, mode, ', '.join('[%s](%s)' % (t, u) for t, u in wiki), nrefs))
w('')
w('Header curves, drawn at random on each page load (%d real ones, from papers and notes, and %d invented for fun):' %
  (len(curve_rows) - n_inv, n_inv))
w('')
w(', '.join(('*%s*' % lab if inv else lab) for lab, inv in curve_rows) + ' (invented ones in italics).')
w('')
w('## Look')
w('')
w('| What | Setting |')
w('|---|---|')
w('| Fonts | Source Serif 4 (titles), Instrument Sans (text), served by the site |')
w('| Accent color | %s in light mode, %s in dark mode |' % (accent_light, accent_dark))
w('| Text width | %s; images, gallery and home intro %s |' % (measure, wide))
w('| Page-title emojis | %s |' % ', '.join('%s %s%s' % (t, e, ' (%d%% size)' % round(float(s) * 100) if s else '')
                                         for t, e, s in emojis))
w('| Link previews (Slack, email, ...) | the site logo, the BBP curve (`assets/img/og-image.png`) |')
no_funding = []
for dirpath, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if not d.startswith(('.', '_site', 'vendor', 'node_modules'))]
    for f in files:
        if f.endswith(('.md', '.html')) and f not in ('README.md', 'CLAUDE.md', 'SITE_OPTIONS.md'):
            rel = os.path.relpath(os.path.join(dirpath, f), ROOT)
            if re.search(r'^funding:\s*false', read(rel), re.M):
                no_funding.append(front(rel, 'title') or rel)
w('| ERC funding statement | footer of every page except: %s |' % ', '.join(sorted(no_funding)))
w('')
w('## Privacy and outside services')
w('')
w('- No cookies. Visit statistics: GoatCounter, published site only.')
w('- The email address is never written in the page: the "Mail" link assembles and copies it.')
w('- YouTube (privacy-enhanced youtube-nocookie) and SoundCloud players load only when clicked; '
  'starting one stops the other.')
w('- "Submit your phase transition" (Misc) is sent through Web3Forms; anonymous unless the visitor '
  'adds a name or email.')
w('')
w('## Content')
w('')
w('| What | Number |')
w('|---|---|')
for what, n in counts:
    w('| %s | %s |' % (what, n))
w('')
w('## Where to change things')
w('')
w('| To change | Edit |')
w('|---|---|')
w('| News, events, publications, teaching, music, people | `_data/*.yml` |')
w('| Header curves | `_data/curves.yml` |')
w('| Page text | `index.html`, `group.html`, `research.html`, `teaching.html`, `events.html`, `misc.md`, `physics/*.md` |')
w('| Default theme | `_includes/head.html` |')
w('| Animations: colors, speed, defaults | constants at the top of `assets/js/turing.js`, `ising.js`, `spinglass.js` (slider ranges also in `_includes/header.html` and `assets/js/bg-menu.js`) |')
w('| Pause after inactivity | `IDLE_MS` in `assets/js/site.js` |')
w('| Items shown in a scrolling list | `data-show` on the list (default %s in `assets/js/site.js`) |' % show_default)
w('| Colors, fonts, widths | `assets/css/main.css` |')
w('')

text = '\n'.join(L)
old = open(OUT, encoding='utf-8').read() if os.path.exists(OUT) else None
if text != old:
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(text)
    print('SITE_OPTIONS.md updated')
else:
    print('SITE_OPTIONS.md already up to date')
