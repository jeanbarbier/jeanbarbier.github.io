# jeanbarbier.github.io

Personal and group website of Jean Barbier (ICTP), built with Jekyll and served by GitHub Pages. No theme, no plugins beyond the ones GitHub Pages supports.

## Where things live

| What | File |
|---|---|
| Group members and alumni | `_data/people.yml` |
| Publications | `_data/publications.yml` |
| News (home page shows five at a time, then scrolls) | `_data/news.yml` |
| Events | `_data/events.yml` |
| Teaching material | `_data/teaching.yml` (PDFs in `docs/`) |
| Page text | `index.html`, `research.html`, `group.html`, `about.md`, ... |
| Styles | `assets/css/main.css` |
| Background animations (header menu) | `assets/js/turing.js`, `neurons.js`, `ising.js`, `bg-menu.js` |
| Photos | `assets/img/` (group members: `assets/img/people/`, square, about 400 px) |

To add a paper, copy an entry in `_data/publications.yml`, including its `bibtex` block. Group members are highlighted automatically if their name (or one of their `aliases`) is in `_data/people.yml`.

## Preview locally

```
gem install jekyll -v 3.10.0 jekyll-seo-tag jekyll-sitemap kramdown-parser-gfm webrick
JEKYLL_NO_BUNDLER_REQUIRE=true jekyll serve
```
