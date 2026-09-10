# Grindstone Lab · Life & Faith

[Open the grindstone optimizer](https://tomerh2001.github.io/grindstone-of-faith/)

**Enter the grindstone type and its price. The calculator recommends 20 Faith or 10 Life per attempt automatically.** Under GMS v271's linear fees, every legal amount ties for lowest average completion cost. The full amount also guarantees success and removes retry variance.

- Faith, level 5 → 6: total = 20 × (stone price + 1b). At 12b per stone, that is 260b.
- Life, level 4 → 5: total = 10 × (stone price + 0.5b). No Life market price was supplied; enter your own.

The opening has exactly two inputs, followed by the recommended policy, average cost, fee breakdown, outcome percentiles, and overspend probability. Exact graphs compare every legal amount. Four automatic comparisons (maximum, one fewer, half maximum, and one stone) drive animated upgrades and 50,000 simulations per strategy. Simulations populate automatically after input changes and can be stopped or rerun. Links retain the type and price.

Retry calculations assume independent attempts, all stones and fees consumed on failure, unchanged ring eligibility and no pity. The published full-batch guarantee does not depend on retry assumptions. Smaller batches can have lower medians or some lower percentiles without lowering the mean. Sample percentiles may jump by one attempt at exact probability boundaries; the site explains this beside the simulation results.

All 54 screenshot rows and the finite supply calculator remain explicitly **Faith-only**. The site has no external runtime dependencies, analytics or accounts. Original screenshots and account information are not published.

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

The 22 tests include interface checks for two-input automatic recommendations, both upgrade types, animated lanes, instant completion, automatic progressive charts, stopping, restarting, input-change cancellation, hidden stale results after invalid input, and Faith market tabs.

GitHub Actions runs these checks and publishes only `site/` to GitHub Pages. Deployments use the configured `github-pages` environment. The browser recomputes exact results locally; simulations illustrate the same model.

The design takes its emphasis on editable assumptions and transparent risk from [Starforce Optimizer](https://github.com/tomerh2001/eternal-starforce-analysis). The underlying model is separate: a geometric distribution rather than a Star Force state-transition model.

Unofficial; not affiliated with Nexon. Research checked September 10, 2026.
