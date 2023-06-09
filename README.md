# SamIam lib

SamIam lib is an inference library port the [Automated Reasoning group at UCLA](http://reasoning.cs.ucla.edu/)'s [SamIam software](http://reasoning.cs.ucla.edu/samiam). The original SamIam software is split into SamIam web and SamIam lib and rewritten in TypeScript and React. SamIam web is a cloud front-end that uses SamIam lib as its inference engine.

# SamIam web

SamIam web is a cloud port of the [Automated Reasoning group at UCLA](http://reasoning.cs.ucla.edu/)'s original [SamIam software](http://reasoning.cs.ucla.edu/samiam). This front-end for SamIam lib is now available at https://samiam.ai.

# Status

Tentative roadmap:

## Version 1

Features:

- Shenoy-Shafer algorithm
  - Probability of evidence
  - Single variable prior and posterior marginals
  - MPE
  - MAP
  - Sensitivity analysis
- Interventional causal queries

## Version 2

Complete port of [SamIam](https://github.com/uclareasoning/SamIam) with the addition of:

- Multiple variable prior and posterior marginals
- Reorder node parents
- Reorder node values

## Version 3

Features:

- Counterfactual causal queries
- Server side inference
- Collaboration
- Export R code
