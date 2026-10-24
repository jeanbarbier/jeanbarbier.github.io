---
title: How gradient descent finds features in wide networks
date: 2026-10-16
summary: Learning in two-layer networks whose width grows with the input dimension, from a collective, Gaussian stage to the discovery of individual features.
---
How does stochastic gradient descent (SGD) learn internal representations in a wide neural network trained on a rich target function? We study this in two-layer networks that learn a target given by a network of the same architecture, with an arbitrary nonlinearity, when the width *k* and the input dimension *d* grow proportionally.

## Too many order parameters

Since the work of Saad and Solla in the 1990s, the standard way to describe SGD in two-layer networks is to follow a few macroscopic order parameters, the overlaps between the weights of the student network and those of the teacher. For narrow networks there are only a handful of them, and they obey closed equations. At extensive width there are of order *k*² overlaps, and no obvious way to reduce them to a few. The two classical alternatives do not help here: the lazy (neural tangent kernel) limit does not learn features, and the mean-field limit describes the neurons by a distribution that lives in a space whose dimension grows with *d*.

## A mesoscopic description

Instead of tracking every overlap, we track their *distribution*. Expanding the activation function in Hermite polynomials organizes the order parameters into a hierarchy, one level per Hermite mode of the target. Learning then goes through four stages.

![Schematic of the four stages of learning: initialization, Gaussian closure, specialization and refinement, with the generalization error decreasing over training]({{ '/assets/img/highlights/mesoscopic-dynamics-stages.png' | relative_url }}){: width="1800" height="512" loading="lazy"}

- **Gaussian closure.** Early on, the student learns only the linear and quadratic components of the target: it recovers the teacher's weights up to a rotation, while every individual teacher–student overlap stays small, of order *d*<sup>−1/2</sup>. Treating these overlaps as jointly Gaussian closes the dynamics on a few collective variables, whose equations predict the test loss over this whole stage.
- **Specialization.** Gaussian closure then breaks down: a finite fraction of student neurons become strongly correlated with individual teacher neurons, and the overlap distribution splits into a Gaussian bulk and outliers. We estimate when this happens: the time scales as *k*<sup>*r*</sup>/(log *k*)<sup>*r*−2</sup>, where *r* is the lowest Hermite degree above two present in the activation. Specialization is sped up, by a constant factor that depends on the activation, through *quadratic shielding*: having learned the linear and quadratic components of the target filters out gradient fluctuations.
- **Refinement.** Once each student neuron is matched to a teacher neuron, we derive the dynamics of the matched overlaps and their fixed points.

The activation function shapes how specialization looks. With ReLU, some student neurons align with a teacher neuron and others anti-align with it; with ELU or tanh all matches are positive.

<figure class="figure">
  <img src="{{ '/assets/img/highlights/mesoscopic-dynamics-overlaps.png' | relative_url }}" alt="Histograms of teacher–student overlaps at four training times for ReLU, ELU and tanh: a Gaussian bulk early on, then outliers near plus or minus one" width="752" height="552" loading="lazy">
  <figcaption>Teacher–student overlaps during training. The bulk (blue) stays Gaussian; specialized neurons (red) appear as outliers.</figcaption>
</figure>

## Why it matters

Collective learning comes first and gives way to the discovery of individual features, and the paper says when a simple statistical description of learning holds. It complements our [Bayes-optimal theory of feature learning]({{ '/highlights/feature-learning/' | relative_url }}), which describes the same specialization from the point of view of optimal performance rather than of training.
