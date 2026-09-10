# Grindstone Lab · Life & Faith

[Open the grindstone optimizer](https://tomerh2001.github.io/grindstone-of-faith/)

**Enter the grindstone type and its price. Every legal amount ties on average; 20 Faith or 10 Life removes retry risk.** Under GMS v271's linear fees, every legal amount ties for lowest average completion cost. The full amount also guarantees success and removes retry variance.

- Faith, level 5 → 6: total = 20 × (stone price + 1b). At 12b per stone, that is 260b.
- Life, level 4 → 5: total = 10 × (stone price + 0.5b). No Life market price was supplied; enter your own.

The opening has exactly two inputs, followed by the average-cost tie, guaranteed option, near-guarantee tradeoff, observed sample winner, fee breakdown, outcome percentiles, and overspend probability. Exact graphs compare every legal amount. Every legal amount gets 50,000 live simulated upgrades, with observed means and 95% sampling intervals. Four automatic comparisons (maximum, one fewer, half maximum, and one stone) also drive animated upgrades and distribution charts. Simulations populate automatically after input changes and can be stopped or rerun. Links retain the type and price.

Retry calculations assume independent attempts, all stones and fees consumed on failure, unchanged ring eligibility and no pity. The published full-batch guarantee does not depend on retry assumptions. Smaller batches can have lower medians or some lower percentiles without lowering the mean. Sample percentiles may jump by one attempt at exact probability boundaries; the site explains this beside the simulation results.

All 54 screenshot rows and the finite supply calculator remain explicitly **Faith-only**. The site has no external runtime dependencies, analytics or accounts. Original screenshots and account information are not published.

## Independent simulation evidence

A separate Python implementation ran **30 million completed upgrades and 101,273,266 actual random rolls**, covering one million upgrades for every legal amount. It imports no website model and uses a different RNG. [Read the audit](research/independent-monte-carlo.md), [inspect complete counts and seeds](research/independent-monte-carlo.json), or [download CSV](site/independent-monte-carlo.csv). Run `python3 research/independent-monte-carlo.py` to reproduce it. Recorded artifacts preserve the original run's timestamps and script hash.

At 12b per Faith stone, 19-at-a-time averaged 259.996152b over one million completions: 94.9949% finished cheaper than 260b and 5.0051% spent more. Twenty always cost 260b. The guarantee is a variance choice, not a uniquely lower expected cost. The lowest sampled mean may belong to a smaller amount through sampling noise; all results and outliers are retained.

## Evidence

- [Nexon GMS v271 rules](https://www.nexon.com/maplestory/news/update/44597/v-271-maple-story-x-frieren-beyond-journey-s-end-patch-notes#SpecialSkillRingChanges)
- [Full dated research](research/2026/September/10/Grindstone%20of%20Faith%20decision.md)
- [Market data and provenance](site/market.json), [CSV](site/market.csv)
- [Independent exact statistical results](research/statistics-results.json)

The active screenshots contain 71 stones across 18 listings, including 21 stones near 12b. A complete 19-stone lot plus the cheapest single costs **239,999,696,950 mesos**, or **259,999,696,950 including polishing**. This purchase does not depend on partial-stack buying. The unit-by-unit purchase ladder can be one meso cheaper by taking a partial stack and explicitly states that assumption.

Historical screenshots are selected price-sorted pages 1, 2, 6 and 11 of 12. They are not a representative market sample and cannot support a market-wide change estimate or price forecast.

## Reproduce

Requires Node.js 24 and Python 3. The website itself has no runtime dependencies; jsdom is used for interface tests.

```sh
npm ci
npm run check
npm test
python3 research/statistics-verification.py
python3 -m http.server 8000 --directory site
```

JavaScript tests check exact boundaries, all 30 Life/Faith strategies, 54 transcribed rows, supply totals and three million simulated completed upgrades. The Python verifier also compares the production JavaScript against exact fractions for both types. Independent rational arithmetic verifies 4,095 finite attempt sequences, a maximum-success budget recurrence through 80 stones, and adaptive strategy examples.

The tests include interface checks for two-input automatic recommendations, both upgrade types, animated lanes, instant completion, automatic progressive charts, stopping, restarting, input-change cancellation, hidden stale results after invalid input, and Faith market tabs.

GitHub Actions runs these checks and publishes only `site/` to GitHub Pages. Deployments use the configured `github-pages` environment. The browser recomputes exact results locally; simulations illustrate the same model.

The design takes its emphasis on editable assumptions and transparent risk from [Starforce Optimizer](https://github.com/tomerh2001/eternal-starforce-analysis). The underlying model is separate: a geometric distribution rather than a Star Force state-transition model.

Unofficial; not affiliated with Nexon. Research checked September 10, 2026.
