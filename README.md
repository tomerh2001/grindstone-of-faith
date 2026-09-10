# Faith Lab

[Open the Grindstone of Faith planner](https://tomerh2001.github.io/grindstone-of-faith/)

**All batch sizes from 1 to 20 tie for lowest average spending when repeated until success. Use 20 per attempt as the practical recommendation: it achieves that average with no retry risk.** At approximately 12b per stone, every batch averages 240b in stones plus 20b in polishing fees, or 260b total. This uses the GMS v271 rules released September 9, 2026, for eligible untradable level-5 Rings of Restraint and Continuous Rings.

Nineteen stones cost about 247b for 95% success. Smaller batches repeated until success have the same 260b expected cost at a constant stone price, but substantially larger unlucky costs. Repeat calculations assume independent outcomes, full material and fee consumption on failure, no pity, and an unchanged level-5 ring. The published 20-stone guarantee needs no assumptions about repeat failures.

The opening has simple price, comparison-batch and simulation-size inputs, followed by the average-cost answer. Watch one upgrade attempt by attempt, or run 10,000, 50,000 or 200,000 complete upgrades while the histogram and chronological running mean fill in. Simulation results never choose the optimal batch; the exact mean establishes the tie. The site also retains all 20 strategies, optional budget and confidence targets, a finite supply calculator, all 54 screenshot rows and linked research. It uses no external runtime dependencies, analytics or accounts. The original screenshots and account information are not published.

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

JavaScript tests check exact boundaries, all 20 strategies, 54 transcribed rows, supply totals and two million simulated completed upgrades. Independent rational arithmetic verifies 4,095 finite attempt sequences, a maximum-success budget recurrence through 80 stones, and adaptive strategy examples.

Interface tests also verify animated attempts, instant completion, live histogram and running-mean updates, stopping, restarting, input-change cancellation and market tabs.

GitHub Actions runs these checks and publishes only `site/` to GitHub Pages. Deployments use the configured `github-pages` environment. The browser recomputes exact results locally; simulations illustrate the same model.

The design takes its emphasis on editable assumptions and transparent risk from [Starforce Optimizer](https://github.com/tomerh2001/eternal-starforce-analysis). The underlying model is separate: a geometric distribution rather than a Star Force state-transition model.

Unofficial; not affiliated with Nexon. Research checked September 10, 2026.
