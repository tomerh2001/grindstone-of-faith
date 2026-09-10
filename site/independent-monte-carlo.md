# Independent simulation audit — 10 September 2026

This audit ran 1,000,000 completed upgrades for each of all 20 Faith amounts and all 10 Life amounts: **30,000,000 completed upgrades and 101,273,266 random attempt rolls**. It imports no website calculator code. Each attempt uses a fresh Python `random.Random` draw and each failure consumes the full attempt cost before retrying. All seeds were fixed before running. No outlier was discarded or rerun.

Faith uses a 12b stone price plus a 1b fee per stone. Life uses an **illustrative** 2b stone price plus a 0.5b fee; the user supplied no Life market prices. These simulations explore the stated probability and cost model. They are synthetic trials, not measurements of the game servers, and cannot independently verify the stated game probabilities.

## What the actual run shows

The observed averages are close to 260b for Faith and 25b for Life across all amounts. The guaranteed amounts have exactly those costs. Smaller amounts sometimes finish more cheaply, with occasional expensive retries balancing those savings. Therefore the guarantee is a choice that removes spending risk at the same mathematical average, **not a strategy that uniquely minimizes average cost**.

The lowest observed Faith mean belongs to 3 stones (259.510719b), while the lowest observed Life mean belongs to 7 stones (24.991225b). Treating these sample winners as optimal would mistake random estimation error for a real expected-cost advantage. Their theoretical averages remain 260b and 25b.

The 95% intervals below estimate uncertainty in each simulated mean. They do not describe the range in which 95% of individual players finish. They are pointwise intervals, not a simultaneous family: two stochastic batches (Faith 3 and Life 4) miss the theoretical mean, which is unsurprising across 28 stochastic estimates.

## All observed outcomes

Costs are billions of mesos. P95 and P99 are **empirical** spending quantiles, using the first ordered observation at rank `ceil(q × N)`. “Below / equal / above” compares each completed upgrade with its type’s guaranteed cost.

| Type | Stones | Observed mean | 95% CI for mean | Median | P95 | P99 | Below / equal / above guarantee |
|---|---:|---:|---|---:|---:|---:|---|
| Faith | 1 | 259.976951 | 259.480057–260.473845 | 182 | 767 | 1170 | 62.2747% / 1.8897% / 35.8356% |
| Faith | 2 | 260.214526 | 259.730454–260.698598 | 182 | 754 | 1144 | 61.2053% / 3.8765% / 34.9182% |
| Faith | 3 | 259.510719 | 259.042555–259.978883 | 195 | 741 | 1131 | 62.3532% / 0.0000% / 37.6468% |
| Faith | 4 | 259.939160 | 259.484661–260.393659 | 208 | 728 | 1092 | 59.0003% / 8.2100% / 32.7897% |
| Faith | 5 | 260.385450 | 259.943717–260.827183 | 195 | 715 | 1040 | 57.7050% / 10.5433% / 31.7517% |
| Faith | 6 | 259.999662 | 259.573671–260.425653 | 156 | 702 | 1014 | 65.6646% / 0.0000% / 34.3354% |
| Faith | 7 | 260.350545 | 259.939179–260.761911 | 182 | 637 | 1001 | 57.6875% / 0.0000% / 42.3125% |
| Faith | 8 | 260.234000 | 259.838316–260.629684 | 208 | 624 | 1040 | 63.9242% / 0.0000% / 36.0758% |
| Faith | 9 | 260.154297 | 259.775893–260.532701 | 234 | 702 | 936 | 69.7138% / 0.0000% / 30.2862% |
| Faith | 10 | 259.938900 | 259.578791–260.299009 | 260 | 650 | 910 | 49.9968% / 25.0008% / 25.0024% |
| Faith | 11 | 260.262717 | 259.920649–260.604785 | 143 | 572 | 858 | 54.8951% / 0.0000% / 45.1049% |
| Faith | 12 | 260.125944 | 259.803564–260.448324 | 156 | 624 | 936 | 59.9592% / 0.0000% / 40.0408% |
| Faith | 13 | 260.184119 | 259.881942–260.486296 | 169 | 507 | 845 | 65.0057% / 0.0000% / 34.9943% |
| Faith | 14 | 259.989912 | 259.711183–260.268641 | 182 | 546 | 728 | 69.9728% / 0.0000% / 30.0272% |
| Faith | 15 | 260.104260 | 259.848996–260.359524 | 195 | 585 | 780 | 74.9947% / 0.0000% / 25.0053% |
| Faith | 16 | 260.186160 | 259.958220–260.414100 | 208 | 416 | 624 | 79.9179% / 0.0000% / 20.0821% |
| Faith | 17 | 260.151255 | 259.953034–260.349476 | 221 | 442 | 663 | 84.9692% / 0.0000% / 15.0308% |
| Faith | 18 | 259.892334 | 259.731584–260.053084 | 234 | 468 | 468 | 90.0349% / 0.0000% / 9.9651% |
| Faith | 19 | 259.996152 | 259.882336–260.109968 | 247 | 494 | 494 | 94.9949% / 0.0000% / 5.0051% |
| Faith | 20 | 260.000000 | 260.000000–260.000000 | 260 | 260 | 260 | 0.0000% / 100.0000% / 0.0000% |
| Life | 1 | 25.001125 | 24.954675–25.047575 | 17.5 | 72.5 | 110 | 61.2295% / 3.8897% / 34.8808% |
| Life | 2 | 25.033960 | 24.989982–25.077938 | 20 | 70 | 105 | 59.0648% / 8.1723% / 32.7629% |
| Life | 3 | 25.032682 | 24.991667–25.073698 | 15 | 67.5 | 97.5 | 65.6627% / 0.0000% / 34.3373% |
| Life | 4 | 25.046030 | 25.007974–25.084086 | 20 | 60 | 100 | 63.9286% / 0.0000% / 36.0714% |
| Life | 5 | 25.020725 | 24.986069–25.055381 | 25 | 62.5 | 87.5 | 49.9561% / 24.9768% / 25.0671% |
| Life | 6 | 24.998130 | 24.967169–25.029091 | 15 | 60 | 90 | 60.0073% / 0.0000% / 39.9927% |
| Life | 7 | 24.991225 | 24.964360–25.018090 | 17.5 | 52.5 | 70 | 70.0696% / 0.0000% / 29.9304% |
| Life | 8 | 25.010240 | 24.988311–25.032169 | 20 | 40 | 60 | 79.9616% / 0.0000% / 20.0384% |
| Life | 9 | 25.001977 | 24.986501–25.017454 | 22.5 | 45 | 45 | 89.9736% / 0.0000% / 10.0264% |
| Life | 10 | 25.000000 | 25.000000–25.000000 | 25 | 25 | 25 | 0.0000% / 100.0000% / 0.0000% |

## Why some simulated quantiles differ from the exact quantile

For 19 Faith stones, exactly 95% of attempts succeed in the stated model. The population P95 is therefore one attempt, 247b. This run happened to have 949,949 first-attempt successes out of one million (94.9949%). Its empirical P95 is consequently two attempts, 494b. This is a quantile-boundary effect; the observed 5.0051% retry rate is entirely consistent with 5%. The raw empirical result is retained.

Likewise, Faith 10 has a population median of one attempt (130b) because its chance is exactly 50%. This sample had 499,968 first-attempt successes, so its empirical median is two attempts (260b). Life 5 has the same boundary issue: its population median is 12.5b and the observed median is 25b. Near such boundaries, reporting only a percentile can create an exaggerated impression of disagreement. The observed success fraction and the full attempt-frequency table show what actually happened.

## Reproduce and inspect

- Run `python3 research/independent-monte-carlo.py` from the repository root.
- `independent-monte-carlo.json` includes every seed, the script hash, runtime, all 30 complete attempt-frequency tables, means, sample standard deviations, standard errors, quantiles, and observed tail fractions.
- `independent-monte-carlo.csv` contains all numerical summaries for spreadsheet analysis.
- A post-run verification checked every frequency total, recorded random-draw count, computed mean, spending classification total, deterministic guarantee, and script hash.

Assumptions: fixed per-stone prices; all stones and fees consumed on failure; failures retain the ring’s prior eligible level; independent attempts with no pity; retry until success without a budget cap. A finite sample maximum does not bound possible spending for a sub-guarantee amount. The data remain conditional on those assumptions.
