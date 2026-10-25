# Neuron background animation (archived)

A faint culture of neurons drawn like a calcium-imaging recording, with branching dendrites,
meandering axons, axon-proximity synapses, short-term synaptic depression and network bursts.
It was one of the background animations (October 2026) and was taken out of the menu. The
whole site as it was then is on the branch `archive/neurons-animation`.

Jekyll does not publish folders starting with an underscore, so nothing here is on the site.

## To bring it back

1. Move `neurons.js` back to `assets/js/neurons.js`.
2. In `_layouts/default.html`, next to the other background canvases and scripts, add:

```html
<div class="bg-neurons" aria-hidden="true"><canvas class="bg-neurons-fibers"></canvas><canvas class="bg-neurons-sparks"></canvas></div>
<script src="{{ '/assets/js/neurons.js' | relative_url }}" defer></script>
```

3. In `_includes/header.html`, add this item to the animation menu (`#bg-menu`):

```html
<button type="button" role="menuitemradio" aria-checked="false" data-mode="neurons"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" stroke-width="1.5"/><g fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="M10 10 6.4 6.6M10 10l3.7-3.2M10 10l-3.2 3.6M10 10l3.9 3.1M6.4 6.6l-.3 1.9M13.7 6.8l1.6.6"/></g><circle cx="10" cy="10" r="1.9" fill="currentColor"/></svg><span>Neurons</span></button>
```

4. Add to `assets/css/main.css`:

```css
/* Alternative background: a faint network of firing neurons (assets/js/neurons.js), same behaviour */
.bg-neurons {
  position: fixed; inset: 0; z-index: -1; pointer-events: none; opacity: 0; transition: opacity 1.2s ease;
}
.bg-neurons canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.bg-neurons.is-ready { opacity: 1; transition-duration: 2s; }
.bg-neurons.instant { transition: none; }
```

5. In `turing.js`, `ising.js` and `bg-menu.js`, let `mode()` return `'neurons'` again
   (it is currently mapped to the default).
