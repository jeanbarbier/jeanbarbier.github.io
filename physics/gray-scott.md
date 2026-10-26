---
layout: physics
title: The Gray-Scott model
description: "Two chemicals that react and diffuse, and the spots, stripes and holes they draw."
permalink: /misc/gray-scott/
mode: turing
funding: false
refs:
  - title: "The chemical basis of morphogenesis"
    authors: [A. M. Turing]
    venue: "Philosophical Transactions of the Royal Society of London B 237"
    year: 1952
    doi: "10.1098/rstb.1952.0012"
  - title: "Autocatalytic reactions in the isothermal, continuous stirred tank reactor: oscillations and instabilities in the system A + 2B → 3B; B → C"
    authors: [P. Gray, S. K. Scott]
    venue: "Chemical Engineering Science 39"
    year: 1984
    doi: "10.1016/0009-2509(84)87017-7"
  - title: "Complex patterns in a simple system"
    authors: [J. E. Pearson]
    venue: "Science 261"
    year: 1993
    doi: "10.1126/science.261.5118.189"
  - title: "Experimental observation of self-replicating spots in a reaction–diffusion system"
    authors: [K.-J. Lee, W. D. McCormick, J. E. Pearson, H. L. Swinney]
    venue: "Nature 369"
    year: 1994
    doi: "10.1038/369215a0"
---
Picture a thin layer of liquid holding two chemicals. The first one is food, poured in steadily everywhere. The second one eats the food to make more copies of itself, and it also slowly breaks down. Both spread through the liquid, like a drop of ink in water, but the food spreads twice as fast.

This small difference is enough to draw patterns. Where the second chemical is plentiful, it multiplies and eats up the food over a wide area around it, so that a little further away it cannot grow: the patches settle at regular distances from each other, as spots or stripes. In 1952 Alan Turing proposed that such a mechanism could explain how a uniform embryo develops structure, and it has since been used to explain patterns such as the spots and stripes of animal coats. The background shows where the second chemical is. The slider in the animation menu changes how fast the food comes in and how fast the second chemical breaks down, and with them the pattern.

## In more detail

The default background of the site is a reaction–diffusion system: two chemical species, U and V, spread over a surface and react with each other. Their concentrations *u* and *v* evolve as

<p class="eq">∂<i>u</i>/∂<i>t</i> = <i>D<sub>u</sub></i> ∇²<i>u</i> − <i>uv</i>² + <i>F</i> (1 − <i>u</i>),<br>∂<i>v</i>/∂<i>t</i> = <i>D<sub>v</sub></i> ∇²<i>v</i> + <i>uv</i>² − (<i>F</i> + <i>k</i>) <i>v</i>.</p>

## The reaction

The term *uv*² is the reaction U + 2V → 3V: V is autocatalytic, it uses U to make more of itself. U is fed in at rate *F*, which pulls *u* back toward 1, and V is removed at rate *F* + *k*, where the "kill rate" *k* stands for its decay into an inert product. Peter Gray and Stephen Scott introduced this scheme in the 1980s for autocatalytic reactions in a continuously fed, well-stirred tank. Even without diffusion, the reaction alone has several stable states and oscillations.

## Diffusion and patterns

The Laplacian terms ∇² make each species spread to its neighbors, U twice as fast as V. Diffusion usually smooths things out, but in 1952 Alan Turing showed that two species diffusing at different rates can do the opposite: destabilize a uniform state and create a pattern with a typical length scale. He proposed it as the chemical basis of morphogenesis, the way an initially uniform embryo develops structure. The intuition is local activation and long-range inhibition. A spot rich in V grows by consuming U, and since U diffuses fast, the spot depletes it over a region wider than itself, which starves would-be neighbors: spots, or stripes, settle at a typical distance from each other.

With the default parameters, the only uniform state is the one without V (*u* = 1, *v* = 0), and it is stable. Patterns therefore do not grow out of tiny fluctuations, as in Turing's original scenario: they grow from a finite seed of V and invade the empty space. In 1993 John Pearson mapped this behavior across the (*F*, *k*) plane and found a whole zoo of patterns: spots, stripes, labyrinths, holes, spots that keep dividing like cells, and chaotic mixtures. A year later, Harry Swinney's group observed such self-replicating spots in a real chemical reaction.

## On this site

The background shows *v*, computed on a coarse grid (one cell is about 7 pixels) with the discretization popularized by Karl Sims, in units where the time step and the grid spacing are 1, *D<sub>u</sub>* = 1 and *D<sub>v</sub>* = 0.5. It runs at 300 time steps per second, on your graphics card when possible. The Pattern slider of the animation menu moves (*F*, *k*) along a path from spots (*F* = 0.026, *k* = 0.0615) to stripes (*F* = 0.046, same *k*), then to holes (*F* = 0.0415, *k* = 0.0592). To keep the pattern alive, *F* and *k* drift slowly and vary a little across the page, and every few seconds a small disc is wiped and reseeded: watch the pattern grow back into it.

The eye button in the header hides the text and shows the pattern at full strength. There, a tap drops a disc of V, 63 pixels in radius, with *u* = 1 and *v* ≈ 0.5: it flashes, then collapses into a dark hole ringed by new spots, which the pattern soon fills again. Holding keeps the disc full, and dragging wipes a path clean (*u* = 1, *v* = 0) that the pattern grows back into.

## More

- [Reaction–diffusion system](https://en.wikipedia.org/wiki/Reaction%E2%80%93diffusion_system) and [Turing pattern](https://en.wikipedia.org/wiki/Turing_pattern), on Wikipedia.
- [Pearson's parametrization](https://mrob.com/pub/comp/xmorphia/), an illustrated map of the patterns by Robert Munafo.
- [Reaction-diffusion tutorial](https://www.karlsims.com/rd.html), by Karl Sims.
