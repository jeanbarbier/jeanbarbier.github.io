---
title: A theory of structured PCA
date: 2023-07-01
summary: What changes in principal component analysis when the noise itself has structure, and an algorithm that reaches the limits.
---
Analytical studies of algorithms for big data have long assumed unstructured noise: whatever is not the interesting signal in a dataset is pure randomness. This is often too simplistic for realistic data. We need to understand the role of the structure of the noise, meaning the correlations and dependencies within it, when extracting a signal from corrupted data.

## The problem

We address this question in a prototypical model: a simple matrix carrying the sought signal is hidden in a complex matrix whose entries have non-trivial statistical dependencies, representing the unwanted noise. Recovering the signal is the task of principal component analysis (PCA), probably the most widely used signal-processing and data-cleaning technique in science for making sense of noisy data.

Concretely, a statistician observes the *N* × *N* matrix *Y* = (λ/*N*) *XX*ᵀ + *Z*, where the vector *X* is the signal, λ the signal-to-noise ratio and *Z* the noise. In the classical spiked Wigner model the entries of *Z* are independent Gaussians. We instead draw *Z* from a rotationally invariant ensemble whose eigenvalues are confined by a quartic potential, so that its entries are correlated. A single parameter moves the noise from the independent case, with the semicircle law, to a strongly structured one whose eigenvalue density has two bumps.

Plain PCA estimates *X* by the top eigenvector of *Y*: above a threshold in λ, the BBP transition, the largest eigenvalue detaches from the bulk and its eigenvector correlates with the signal. The question is whether one can do better by exploiting the structure of the noise.

## What we found

Using the replica method, we compute the Bayes-optimal limits of this problem: the mutual information between signal and data, and the minimum mean-square error. When the signal is itself rotationally invariant, for instance Gaussian, plain PCA turns out to be optimal. For other signals, such as vectors with ±1 entries, both PCA and the approximate message passing algorithms available so far fall short of these limits.

We therefore propose a new message passing algorithm, inspired by the adaptive Thouless–Anderson–Palmer equations, which reaches the optimal error and comes with a rigorous analysis of its performance. Its key ingredient is an optimal pre-processing of the data: a polynomial in the matrix *Y* that pushes the bulk of noise eigenvalues to negative values, while sending the eigenvalue carrying the signal further away from them.

<figure class="figure">
  <img src="{{ '/assets/img/highlights/structured-pca-preprocessing.png' | relative_url }}" alt="Three panels: the eigenvalue histogram of the data with one isolated eigenvalue, the cubic pre-processing function, and the eigenvalue histogram after pre-processing with the bulk pushed to negative values" width="1600" height="333" loading="lazy">
  <figcaption>Strongly structured noise, λ = 5, <em>N</em> = 4000. Left: eigenvalues of the data, with the predicted density (orange) and the isolated eigenvalue carrying the signal. Middle: the optimal pre-processing. Right: eigenvalues after pre-processing.</figcaption>
</figure>

<figure class="figure">
  <img src="{{ '/assets/img/highlights/structured-pca-mse.png' | relative_url }}" alt="Mean-square error against signal-to-noise ratio: the new algorithm follows the Bayes-optimal curve, while earlier message passing algorithms stay above it" width="1000" height="694" loading="lazy">
  <figcaption>Error as a function of the signal-to-noise ratio, for a signal with ±1 entries and strongly structured noise. The new algorithm (red) reaches the Bayes-optimal error predicted by the replica method (black); earlier algorithms (blue, ochre) do not.</figcaption>
</figure>

Although the theory assumes rotationally invariant noise, it predicts how the algorithm performs even when the noise eigenvectors are taken from real datasets, a sign of remarkable universality. The resulting picture is that algorithms should jointly exploit the structure of the signal and that of the noise to clean the data at hand.

More: [Exploiting the structure of noise in big data](https://2022.ictp.it/news/2023/8/exploiting-structure-noise-big-data), ICTP news by Charlotte Philips.
