---
title: A theory of structured PCA
date: 2023-07-01
summary: What changes in principal component analysis when the noise itself has structure, and an algorithm that reaches the limits.
---
Analytical studies of algorithms for big data have long assumed unstructured noise: whatever is not the interesting signal in a dataset is pure randomness. This is often too simplistic for realistic data. We need to understand the role of the structure of the noise, meaning the correlations and dependencies within it, when extracting a signal from corrupted data.

We address this question in a prototypical model: a simple matrix carrying the sought signal is hidden in a complex matrix whose entries have non-trivial statistical dependencies, representing the unwanted noise. Recovering the signal is the task of principal component analysis (PCA), probably the most widely used signal-processing and data-cleaning technique across science for making sense of noisy high-dimensional data.

Despite its apparent simplicity, our model of PCA is theoretically challenging, and it captures features observed in real data. We compute its fundamental limits and propose a new algorithm that reaches them by optimally exploiting the statistical correlations in the noise.

The resulting picture is that algorithms should jointly exploit the structure of the signal and that of the noise to clean the data at hand.

More: [Exploiting the structure of noise in big data](https://2022.ictp.it/news/2023/8/exploiting-structure-noise-big-data), ICTP news by Charlotte Philips.
