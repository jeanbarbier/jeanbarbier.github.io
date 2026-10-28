---
layout: physics
title: The 2D spin glass
description: "Random couplings, frustration, and the strings that pair frustrated plaquettes."
permalink: /misc/spin-glass/
mode: spinglass
funding: false
refs:
  - title: "Magnetic ordering in gold-iron alloys"
    authors: [V. Cannella, J. A. Mydosh]
    venue: "Physical Review B 6"
    year: 1972
    doi: "10.1103/PhysRevB.6.4220"
  - title: "Theory of spin glasses"
    authors: [S. F. Edwards, P. W. Anderson]
    venue: "Journal of Physics F: Metal Physics 5"
    year: 1975
    doi: "10.1088/0305-4608/5/5/017"
  - title: "Theory of the frustration effect in spin glasses: I"
    authors: [G. Toulouse]
    venue: "Communications on Physics 2"
    year: 1977
  - title: "On the ground states of the frustration model of a spin glass by a matching method of graph theory"
    authors: [L. Bieche, J. P. Uhry, R. Maynard, R. Rammal]
    venue: "Journal of Physics A: Mathematical and General 13"
    year: 1980
    doi: "10.1088/0305-4470/13/8/005"
  - title: "On the computational complexity of Ising spin glass models"
    authors: [F. Barahona]
    venue: "Journal of Physics A: Mathematical and General 15"
    year: 1982
    doi: "10.1088/0305-4470/15/10/028"
  - title: "Equilibrium behavior of the spin-glass ordered phase"
    authors: [D. S. Fisher, D. A. Huse]
    venue: "Physical Review B 38"
    year: 1988
    doi: "10.1103/PhysRevB.38.386"
  - title: "Exact ground states of two-dimensional ±J Ising spin glasses"
    authors: [C. De Simone, M. Diehl, M. Jünger, P. Mutzel, G. Reinelt, G. Rinaldi]
    venue: "Journal of Statistical Physics 84"
    year: 1996
    doi: "10.1007/BF02174135"
  - title: "Spin glass theory and beyond"
    authors: [M. Mézard, G. Parisi, M. A. Virasoro]
    venue: "World Scientific"
    year: 1987
    doi: "10.1142/0271"
    link_label: Book
---
Imagine compass needles that do not all want to agree. For each pair of neighbors, a coin toss decided once and for all whether they prefer to point the same way or opposite ways. Look at four needles around a small square: if an odd number of the four pairs want to disagree, no arrangement makes all four pairs happy, and at least one pair always ends up unhappy. Physicists call such a square frustrated.

With frustration everywhere, there is no perfect arrangement, only a huge number of compromises. Some metal alloys behave like this: when cooled, their needles freeze while pointing in random-looking directions, like the atoms of a window glass that froze before they could line up into a crystal. The mathematics invented to understand them now helps with hard optimization problems and with machine learning. The background draws the frustration rather than the needles: orange dots mark the frustrated squares, and blue segments mark the unhappy pairs, joining up into strings that connect the dots two by two.

## In more detail

Spin glasses were first seen in alloys such as gold with a little iron, or copper with a little manganese. The magnetic atoms sit at random places, and the interaction between two of them, carried by the conduction electrons, is ferromagnetic or antiferromagnetic depending on their distance. In 1972 Cannella and Mydosh found a sharp cusp in the magnetic susceptibility of such an alloy: below a freezing temperature, the spins freeze in random-looking directions. There is no magnetization, as in a paramagnet, but no motion either, as in a magnet: disorder frozen in place, like the atoms of a glass.

### The Edwards–Anderson model

In 1975 Sam Edwards and Philip Anderson proposed a minimal model: Ising spins *s<sub>i</sub>* = ±1 on a lattice, with random couplings *J<sub>ij</sub>* between neighbors and energy

<p class="eq"><i>E</i> = −∑<sub>⟨<i>ij</i>⟩</sub> <i>J<sub>ij</sub> s<sub>i</sub> s<sub>j</sub></i>.</p>

Here the lattice is a square grid covering the screen, and each coupling is +1 (the two spins prefer to agree) or −1 (they prefer to disagree) with equal probability. The couplings are drawn once and then stay fixed: the disorder is quenched.

### Frustration

Take four spins around a square, with three couplings +1 and one −1. Satisfying the three positive bonds forces the four spins to be equal, and then the negative bond is unsatisfied. Whatever you try, an odd number of the four bonds stays unsatisfied. Gérard Toulouse called such a square, or plaquette, frustrated (1977): this happens exactly when the product of its four couplings is −1, so about half of the plaquettes of the grid are frustrated.

### Strings

The background draws the frustration rather than the spins. Orange dots mark the frustrated plaquettes, and each unsatisfied bond is drawn in blue as a short segment that crosses it, joining the centers of the two plaquettes on either side. By the parity rule, an odd number of segments meet at each frustrated plaquette and an even number at every other one: the segments form strings that start and end on orange dots, plus closed loops. Flipping a spin toggles its four bonds and moves the strings, but never their ends, which are fixed by the couplings.

An unsatisfied bond costs 2 more than a satisfied one, so up to a constant the energy is twice the total length of the strings. A ground state thus pairs up the frustrated plaquettes with strings of minimum total length. On a planar lattice this is a minimum-weight perfect matching problem, solved by efficient (polynomial-time) algorithms, as shown by Bieche, Uhry, Maynard and Rammal in 1980; in three dimensions, finding a ground state is NP-hard (Barahona, 1982). Even in the best configuration about 15% of the bonds stay unsatisfied, since the ground-state energy is about −1.40 per spin, and a huge number of ground states share that energy.

### On this site

At low temperature the strings are short, mostly joining neighboring dots, and they keep rearranging: a spin with two satisfied and two unsatisfied bonds can flip at no cost, which moves strings from one optimal pairing to another. When the temperature rises (slider of the animation menu, in units of *J*, from 0.2 to 2.5, by default 0.8), thermal excitations lengthen the strings into a tangle. There is no sharp transition along the way: in two dimensions the spin-glass phase only exists at zero temperature, although relaxation becomes extremely slow at low temperature. In three dimensions the spin-glass phase survives up to a finite temperature.

One spin every 26 pixels. The dynamics is Metropolis at random sites, about 1.5 attempts per spin per second; to keep the motion calm, zero-cost flips are accepted only 12% of the time, which does not change the equilibrium distribution. Before it appears, the system is slowly cooled from *T* = 2.5. The couplings are drawn once per visit and kept from page to page.

The eye button in the header hides the text and shows the strings at full strength. There, a click flips every spin within 120 pixels of it, a droplet in the picture of Daniel Fisher and David Huse. The bonds inside the droplet keep their state, while those crossing its boundary are toggled: a ring of strings appears around it, then relaxes, not always back to the pairing it had before. Dragging flips a new droplet every 120 pixels.

### Why it matters

The theory of spin glasses, in particular Giorgio Parisi's solution of the mean-field Sherrington–Kirkpatrick model with replica symmetry breaking (Nobel Prize in Physics 2021), became a toolbox used far beyond magnetism: for hard optimization problems, error-correcting codes, neural networks, and the high-dimensional inference and learning problems [our group works on]({{ '/research/' | relative_url }}).

## More

- [Spin glass](https://en.wikipedia.org/wiki/Spin_glass) and [Geometrical frustration](https://en.wikipedia.org/wiki/Geometrical_frustration), on Wikipedia.
