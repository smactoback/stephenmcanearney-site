---
title: What shipping a neural interface teaches you about product
description: Notes on building hardware where the user's own nervous system is part of the spec.
pubDate: 2026-03-12
tags:
  - hardware
  - product
  - neural interfaces
---

_Placeholder draft — replace this with the real essay._

When the input device is the human body, the usual product instincts stop
working. You cannot A/B test a tendon. You cannot ship a hotfix to someone's
proprioception. The interface has to be right on the first try, for a range of
bodies you will never personally meet, and it has to feel right before the user
can tell you why.

## Latency is a feeling, not a number

The hardest lessons were rarely in the data. A gesture pipeline that looked fine
on a dashboard could still feel wrong on the wrist, and the gap between those two
states is where most of the work lived.

```ts
// The number that mattered was never the mean.
function feelsInstant(samples: number[]): boolean {
  const p99 = percentile(samples, 0.99);
  return p99 < 50; // milliseconds, tail-to-tip
}
```

Optimising the average bought us nothing. Optimising the tail bought us the
illusion of a direct connection between intent and action — which, for this
class of product, _is_ the product.

## Treat the body as a co-author

The takeaway I keep returning to: stop treating the user as someone you design
for, and start treating their nervous system as something you design _with_. It
sets the spec. You are only ever negotiating with it.
