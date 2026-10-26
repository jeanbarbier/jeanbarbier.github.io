---
layout: physics
title: The 2D Ising model
description: "The simplest model of a magnet, and its phase transition between order and disorder."
permalink: /misc/ising/
mode: ising
funding: false
refs:
  - title: "Beitrag zur Theorie des Ferromagnetismus"
    authors: [E. Ising]
    venue: "Zeitschrift für Physik 31"
    year: 1925
    doi: "10.1007/BF02980577"
  - title: "On Ising's model of ferromagnetism"
    authors: [R. Peierls]
    venue: "Proceedings of the Cambridge Philosophical Society 32"
    year: 1936
    doi: "10.1017/S0305004100019174"
  - title: "Crystal statistics. I. A two-dimensional model with an order-disorder transition"
    authors: [L. Onsager]
    venue: "Physical Review 65"
    year: 1944
    doi: "10.1103/PhysRev.65.117"
  - title: "The spontaneous magnetization of a two-dimensional Ising model"
    authors: [C. N. Yang]
    venue: "Physical Review 85"
    year: 1952
    doi: "10.1103/PhysRev.85.808"
  - title: "Equation of state calculations by fast computing machines"
    authors: [N. Metropolis, A. W. Rosenbluth, M. N. Rosenbluth, A. H. Teller, E. Teller]
    venue: "The Journal of Chemical Physics 21"
    year: 1953
    doi: "10.1063/1.1699114"
---
Picture a piece of iron as a huge collection of tiny compass needles, the magnetic moments of its atoms. In this simplest model, each needle can only point up or down, and it would like to point the same way as its neighbors. When most needles agree, their small effects add up and the material is a magnet. Heat works against this: it shakes the needles and flips them at random.

At low temperature, agreement wins and large regions point the same way. At high temperature, the shaking wins and the needles point every which way, so the magnetism disappears: this is why a magnet heated above a certain temperature, about 770 °C for iron, stops being one. In between, at a precise critical temperature, the two effects balance each other, and patches of all sizes, from a few needles to the whole screen, keep forming and dissolving. In the background, blue squares are needles pointing up and orange squares needles pointing down. By default it sits at the critical temperature, and the slider in the animation menu heats or cools it.

## In more detail

In this background, each small square is a tiny magnet, a spin *s* that points up (*s* = +1, blue) or down (*s* = −1, orange). The spins sit on a square grid and each one interacts with its four neighbors. The energy of a configuration is

<p class="eq"><i>E</i> = −<i>J</i> ∑<sub>⟨<i>ij</i>⟩</sub> <i>s<sub>i</sub> s<sub>j</sub></i>,</p>

where the sum runs over pairs of neighbors and *J* > 0, so that aligned neighbors lower the energy. At temperature *T*, a configuration appears with the Boltzmann probability, proportional to e<sup>−*E*/*T*</sup> (with Boltzmann's constant set to 1). Energy favors order, temperature favors disorder, and their competition produces a phase transition.

## The phase transition

Wilhelm Lenz proposed the model in 1920 and gave it to his student Ernst Ising, who solved it in one dimension in 1925. Finding no transition there, Ising wrongly concluded that there was none in any dimension. In 1936 Rudolf Peierls proved that in two dimensions the model orders at low temperature, and in 1944 Lars Onsager solved it exactly, a landmark of statistical physics. The transition takes place at the temperature

<p class="eq"><i>T</i><sub>c</sub> = 2<i>J</i> / ln(1 + √2) ≈ 2.269 <i>J</i>.</p>

Below *T*<sub>c</sub>, most spins agree: the system has a spontaneous magnetization, which vanishes as *T* approaches *T*<sub>c</sub>, like (*T*<sub>c</sub> − *T*)<sup>1/8</sup>. Above *T*<sub>c</sub>, up and down spins mix in clusters that shrink as the temperature rises. At *T*<sub>c</sub> clusters of all sizes coexist, and the picture looks statistically the same at every scale: correlations between distant spins decay as a power of the distance instead of exponentially.

## The dynamics

The background is simulated with the Metropolis algorithm (1953): pick a spin, compute the energy change Δ*E* that flipping it would cause, and flip it if Δ*E* ≤ 0, or otherwise with probability e<sup>−Δ*E*/*T*</sup>. On the square grid, Δ*E* only takes the values 0, ±4*J* and ±8*J*. These rules satisfy detailed balance, so that after many steps the configurations are sampled from the Boltzmann distribution. To update many spins at once, the grid is colored like a checkerboard: the neighbors of a black square are all white, so all black spins can be updated together, then all white ones.

## On this site

One spin every 5 pixels, about 20 sweeps of the whole grid per second. By default the temperature is *T*<sub>c</sub> itself. The simulation starts from random spins, and the clusters keep growing for a long while: close to *T*<sub>c</sub> the dynamics becomes very slow (critical slowing down). The temperature slider of the animation menu goes from 0.5 to 2 *T*<sub>c</sub>. Below *T*<sub>c</sub>, domains of both colors grow as their boundaries straighten and shrink, and over minutes one color tends to take over; at 2 *T*<sub>c</sub> the clusters are small and flicker. The grid is finite, so clusters cannot outgrow the screen, which smooths the transition a little.

## More

- [Ising model](https://en.wikipedia.org/wiki/Ising_model) and [Square-lattice Ising model](https://en.wikipedia.org/wiki/Square-lattice_Ising_model), on Wikipedia.
