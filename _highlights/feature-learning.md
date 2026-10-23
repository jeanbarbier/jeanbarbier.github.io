---
title: A theory of feature learning in deep neural networks
date: 2026-07-01
summary: Bayes-optimal learning curves for deep networks whose width and data grow with the input dimension, and the layer-by-layer way in which they learn features.
---
We provide an analytic theory of feature learning in deep neural networks of linear width: the width scales like the input dimension, and the model size and the number of training samples grow proportionally. In this regime the network is highly expressive, yet it is constrained parameter-wise with respect to the amount of data it is trained on. It is therefore forced to be "smart" to solve the task, that is, to learn task-relevant features, which is the crux of deep learning.

## Setting

We study supervised learning of a multi-layer perceptron (MLP) in the matched teacher–student framework. Inputs of dimension *d* are fed to a teacher network of depth *L* that produces noisy outputs; a student MLP with the same architecture observes *n* training pairs and tries to learn the teacher's rule. The teacher's weights are drawn independently from a generic prior and are unknown to the student. Both the input dimension and the width of each hidden layer grow proportionally, while the sample size scales as *d*². The number of data points is then proportional to the number of trainable parameters, and learning is controlled by a sampling ratio α = *n*/*d*². We characterize the Bayes-optimal performance of the student in this regime.

![The teacher–student setting with two hidden layers]({{ '/assets/img/highlights/feature-learning-setup.png' | relative_url }}){: width="1400" height="272" loading="lazy"}

Previous theories either focused on very narrow networks (committee machines), which have limited expressive power, or on ultra-wide limits (neural tangent kernel and random features), where features do not move and the network is a kernel machine. Special cases such as quadratic networks also collapse to kernel machines. These simplifications are instructive, but they miss the combined effect of proportional width, depth and nonlinearity that gives rise to strong feature learning and rich learning transitions.

## Method and results

The paper develops a toolbox that blends the replica method with Harish-Chandra–Itzykson–Zuber (HCIZ) integrals, which handles MLPs whose matrix degrees of freedom have high rank. It gives replica-symmetric formulas for the free entropy and explicit order-parameter equations, and with them Bayes-optimal learning curves for deep networks in the strong feature-learning regime.

The theory predicts two qualitatively different regimes:

- a **universal phase**, independent of the prior, where the network effectively performs a kernel-like polynomial approximation;
- a **specialization phase**, where individual hidden units align with the teacher's features.

Specialization is inhomogeneous. It typically starts in the inner layers, close to the input, and propagates outwards, and it can occur unevenly across neurons of the same layer, which produces a rich sequence of learning transitions.

Extensive numerical experiments agree quantitatively with the theory and show metastability, partial specialization and the layer-by-layer emergence of feature learning. Practical training and sampling procedures are often trapped in these metastable states and would need exponentially long times to reach the fully specialized, Bayes-optimal solution.

The theory resolves feature learning almost at the level of individual weights. The figure compares theory (left) with experiments (right) for a network with two hidden layers. Each heat map shows, for the weights connecting pairs of neurons, whether they have learned the teacher's features (yellow) or not yet (blue), as the training set grows from top to bottom.

<figure class="figure">
  <img src="{{ '/assets/img/highlights/feature-learning-heatmaps.png' | relative_url }}" alt="Heat maps of the overlap between student and teacher weights, theory on the left and experiments on the right, for sampling ratios 1.75, 2.75 and 3.75" width="1080" height="1476" loading="lazy">
  <figcaption>Theory (left) and experiments with <em>d</em> = 200 (right), for α = 1.75, 2.75 and 3.75 from top to bottom. Yellow: specialized weights; blue: not yet specialized.</figcaption>
</figure>

This is only part of the results; the paper has the full analysis. Get in touch if you would like to know more.
