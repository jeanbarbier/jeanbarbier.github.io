---
title: Matrix denoising beyond rotational invariance
date: 2025-05-01
summary: When the factorised structure of a large extensive-rank matrix starts to matter, and a multiscale mean-field theory for the hard phase.
---
Denoising a large matrix modelled as the product of two factors is hard, both algorithmically and for theoretical analysis, especially when its rank is proportional to its dimension. Applications range from signal processing to representation learning, sparse coding, community detection, video processing and recommender systems.

## The problem

A statistician observes *Y*, the product *XX*ᵀ of an *N* × *M* matrix *X* with itself, blurred by additive noise. The goal is to estimate *XX*ᵀ from *Y* and to establish how well this can be done. The minimum mean-square error of this task is tied to the mutual information between the data *Y* and the matrix *XX*ᵀ.

This mutual information was known only in two cases: when *X* has a rotationally invariant prior (its law does not change under conjugation by an orthogonal matrix, as when its entries are i.i.d. Gaussian), or when *M* stays finite. Beyond these settings little was known. The model is neither a usual spin glass, because the rank grows with the dimension, nor a matrix model, because rotational symmetry is lost: it is a hybrid of the two.

## What we found

We study a fully factorised prior on the entries of *X*. Extensive Monte Carlo simulations reveal a region of parameters (α = *M*/*N*, λ) where the mutual information is universal: insensitive to the details of the prior, as if *X* were Gaussian.

We also prove that this universality must break down at large enough signal-to-noise ratio λ. This defines two phases:

- a **denoising phase** (universal), where taking the factorised structure of *XX*ᵀ into account brings no improvement;
- a **factorisation phase**, where that structure matters and the minimum mean-square error drops markedly.

![Qualitative phase diagram with the denoising and factorisation phases in the plane of signal-to-noise ratio and aspect ratio]({{ '/assets/img/highlights/matrix-denoising-phase-diagram.png' | relative_url }}){: width="1200" height="773" loading="lazy"}

We then build a multiscale mean-field theory that combines the cavity and replica methods. It relies on decoupling assumptions typical of mean-field regimes, and it approximates the true minimum mean-square error very well in the factorisation phase, where the model indeed behaves in a mean-field way.

The paper contains much more on the nature of this denoising–factorisation transition. Write to us if you are curious.
