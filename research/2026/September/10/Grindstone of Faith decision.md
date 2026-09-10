# Life and Faith grindstones: optimal spending after GMS v271

- Status: current
- Researched and last updated: September 10, 2026
- Canonical journal file path: research/2026/September/10/Grindstone of Faith decision.md
- Scope: one eligible untradable skill ring, GMS Interactive; Life level 4 → 5 or Faith level 5 → 6 separately
- Supersedes: none
- Evidence: primary GMS patch notes, official release announcement, six user-supplied Auction House screenshots

## Automatic recommendation for either type

Choose the grindstone type and enter its unit price. The calculator evaluates every legal amount and recommends **20 Faith or 10 Life together in one attempt**. Every legal amount has the same average completion cost under the fixed-price, linear-fee model. The full amount also guarantees success and has zero cost variance, so it wins the tie.

| Type | Upgrade | Maximum M | Chance per stone | Fee f per stone | Average and guaranteed total |
|---|---|---:|---:|---:|---|
| Life | Level 4 → 5 | 10 | +10 percentage points | 0.5b | 10 × (price + 0.5b) |
| Faith | Level 5 → 6 | 20 | +5 percentage points | 1b | 20 × (price + 1b) |

Both caps, rates and current fees come from [Nexon's v271 Special Skill Ring Changes](https://www.nexon.com/maplestory/news/update/44597/v-271-maple-story-x-frieren-beyond-journey-s-end-patch-notes#SpecialSkillRingChanges). Life's prerequisite level and upgrade are documented in [v246](https://www.nexon.com/maplestory/news/update/5341/v-246-new-age-6th-job-patch-notes#special); Faith's in [v263](https://www.nexon.com/maplestory/news/update/31006/v-263-carcion-octo-fest-patch-notes#BossRewardImprovements). Historical fee schedules are superseded by v271.

For either type, n stones cost C=n(s+f) with success p=n/M. Thus E[total]=C/p=M(s+f), SD[total]=M(s+f)√(1−p), and P(total≤B)=1−(1−p)^floor(B/C). Fixed-size retries follow a geometric distribution under the failure assumptions detailed below. Price changes the bill, not the recommended amount.

At a hypothetical Life price of 2b, use 10 stones for a 25b total: 20b acquisition plus 5b fees. **No Life market sample was supplied.** All screenshot prices and the rest of the market analysis concern Faith. The UI retains the entered price when switching types and tells the user to enter their Life price. It does not reinterpret Faith listings as Life evidence.

The full batch is not the unique mean minimizer and does not minimize every percentile. Faith 19 has exact P95 at 0.95 times the guaranteed cost, but P99 at 1.9 times it. Life 9 has exact P90 at 0.9 times the guaranteed cost, with P95 and P99 at 1.8 times it. These smaller batches can finish cheaply; they do not save on average.

## Faith recommendation at the supplied market prices

**Use 20 Grindstones of Faith together in one attempt. Budget about 260b mesos at the visible 12b asking prices.** This gives 100% success under the published GMS v271 rules. It is the smallest hard budget for a guaranteed upgrade and removes outcome variance without increasing expected cost at a constant stone price.

A concrete purchase from the screenshots is the 19-stone listing at 11,999,999,999 mesos per stone, plus the cheapest single at 11,999,696,969. Those two complete listings cost 239,999,696,950 mesos. Add the 20,000,000,000 polishing fee for **259,999,696,950 mesos total**. This assumes the listings remain available, but does not require buying part of a stack.

If a 5% failure risk is acceptable, 19 stones in one attempt costs about **247b** for **95% success**. The twentieth stone costs about **13b more** to eliminate that risk. A 99% target also requires 20 stones in one attempt because the rate moves in five-percentage-point increments.

Before buying, check the Rewards System for compensation from any affected pre-update polished rings. A qualifying removed level-6 ring returns 20 Faith stones, 10 Life stones and 25b. The screenshots do not establish that the player owns an eligible refund.

## Current rules and source reliability

Nexon's [GMS v271 patch notes, Special Skill Ring Changes](https://www.nexon.com/maplestory/news/update/44597/v-271-maple-story-x-frieren-beyond-journey-s-end-patch-notes#SpecialSkillRingChanges), published September 8 and updated September 9, 2026, directly state a maximum of 20 Faith stones, an extra five percentage points of success per stone, and a 1b fee per stone. Thus p(n)=n/20 and fee(n)=n billion mesos for n=1…20.

Faith upgrades eligible untradable level-5 rings to level 6. After v271, Ring of Restraint and Continuous Ring remain eligible; Weapon Jump S/D/I/L, Risk Taker, Totalling and Critical Damage rings no longer support polishing or polish swaps. Affected pre-maintenance level-5 and level-6 rings revert to level 4. Compensation is claimable until September 8, 2027, 23:59 UTC. Interactive compensation stones are permanent and bound within world. An eligible polish-level swap costs 50m, with removal planned for November 2026. It transfers an upgrade rather than duplicating it. [Current rules and compensation](https://www.nexon.com/maplestory/news/update/44597/v-271-maple-story-x-frieren-beyond-journey-s-end-patch-notes#SpecialSkillRingChanges).

The original [GMS v263 notes](https://www.nexon.com/maplestory/news/update/31006/v-263-carcion-octo-fest-patch-notes#BossRewardImprovements) provide Faith's level-5 to level-6 use and the old five-stone limit. The original [GMS v246 polishing description](https://www.nexon.com/maplestory/news/update/5341/v-246-new-age-6th-job-patch-notes#special) establishes the untradable-ring requirement. Faith does not pay for obtaining the level-5 ring first.

The [official September 9 completed-maintenance announcement](https://steamcommunity.com/gid/103582791433474083/announcements/detail/707782088403716435) confirms the update went live at 13:08 PDT with client v271.1.2. This research therefore uses released GMS rules, not the earlier Korean preview.

| Stones per attempt | Success | Old fee | Current fee |
|---:|---:|---:|---:|
| 1 | 5% | 1b | 1b |
| 2 | 10% | 2b | 2b |
| 3 | 15% | 4b | 3b |
| 4 | 20% | 7b | 4b |
| 5 | 25% | 10b | 5b |
| 10 | 50% | Unavailable | 10b |
| 19 | 95% | Unavailable | 19b |
| 20 | 100% | Unavailable | 20b |

The updated linear fee removes the old extra charge for larger batches. Some recently crawled wiki and guide pages still contain the old cap, fees and eligibility. A recent crawl date does not establish that a page reflects the patch. Current primary notes take precedence.

## Exact statistical model: Faith example

Let n be the stones used in each attempt, s their price in billions of mesos, p=n/20, and C=n(s+1) the cost of one attempt including the polishing fee.

For repeated attempts, assume all selected stones and the fee are spent even on failure, the ring remains level 5 and eligible to retry, attempts are independent, and failures add no pity or accumulated success bonus. The reviewed primary notes do not explicitly spell out every failure detail. These are model assumptions consistent with the fixed-rate system, not quotations from Nexon. **The 20-stone recommendation follows from the single-attempt published rate and does not require any repeat-failure assumption.**

For n<20, the number of attempts K until success has a geometric distribution on 1,2,…:

- P(K=k)=p(1−p)^(k−1).
- E[K]=1/p; expected consumed stones=20.
- E[total cost]=C/p=20(s+1).
- SD(total cost)=20(s+1)√(1−p).
- Success within k attempts=1−(1−p)^k.
- With budget B, at most floor(B/C) attempts are affordable.
- For target probability q<1, the required attempt count is ceil[ln(1−q)/ln(1−p)].

The budget for q is that integer multiplied by C. At n=20, every quantile equals C and the standard deviation is zero. For n<20, no finite budget gives a literal 100% chance. The interface preserves that distinction even when rounding would otherwise display 100%.

These probabilities are exact consequences of the model. A “95% budget” is a quantile of completion cost, not a confidence interval for an estimated game rate. The market screenshots contain no polishing outcomes and cannot validate the game's random number generator.

### Outcomes at 12b per stone

All monetary values are billions of mesos, including fees. Each row repeats its batch until the first success.

| Stones / attempt | Success / attempt | Cost / attempt | Mean total | Median total | 95% budget | 99% budget | Success within 260b |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 5% | 13 | 260 | 182 | 767 | 1,170 | 64.15% |
| 2 | 10% | 26 | 260 | 182 | 754 | 1,144 | 65.13% |
| 5 | 25% | 65 | 260 | 195 | 715 | 1,105 | 68.36% |
| 10 | 50% | 130 | 260 | 130 | 650 | 910 | 75% |
| 15 | 75% | 195 | 260 | 195 | 585 | 780 | 75% |
| 18 | 90% | 234 | 260 | 234 | 468 | 468 | 90% |
| 19 | 95% | 247 | 260 | 247 | 247 | 494 | 95% |
| 20 | 100% | 260 | 260 | 260 | 260 | 260 | 100% |

Ten-stone batches have a lower median than twenty because half succeed at 130b. The other half need retries. Twenty is optimal for certainty and limiting the worst possible bill; it does not minimize every percentile or offer a chance of a cheap lucky success.

### Why spending 20 stones separately does not guarantee success

The game adds the rate contributions within an attempt. Independent attempts multiply failure probabilities. Twenty single-stone attempts succeed with probability 1−0.95^20≈64.15%. Two ten-stone attempts reach 75%. One twenty-stone attempt reaches 100%.

For any sequence of positive batches n₁,…,nₖ whose total S is at most 20, success is 1−Π(1−nᵢ/20)≤S/20. A single batch of S stones reaches that upper bound. Splitting a fixed allowance therefore cannot increase the chance of success. The minimum maximum spend to reach target q is ceil(20q) stones together at the current flat per-stone price.

### Expected spending can hide unfinished upgrades

For any policy that stops at success or gives up, including one that changes batch sizes after failures, constant prices imply:

**E[spending]=20(s+1)×P(eventual success).**

Each reached attempt contributes n(s+1) expected cost conditional on reaching it and n/20 conditional success probability. Success events from separate attempts are disjoint because the plan stops after success. Summing those contributions gives the identity. Any plan that eventually succeeds with probability one averages 20(s+1).

| Plan after earlier failures | Final success | Expected spending | Maximum spending |
|---|---:|---:|---:|
| 19 once, then stop | 95% | 247b | 247b |
| 20 once | 100% | 260b | 260b |
| 18 then 18, then stop | 99% | 257.4b | 468b |
| 19 then 16, then stop | 99% | 257.4b | 455b |
| 19 then 20 | 100% | 260b | 507b |

The 99% plans save only 2.6b in expected spending while allowing a much larger bill and a 1% failure outcome. That does not fit the aim of confidently securing an upgrade without overspending. If 19 fails and the next plan is a guaranteed 20, the completed upgrade can cost 507b.

The independent verification script also implements a finite dynamic program for expected spending under a hard stone cap and target confidence. It confirms the 19→16 example at 99% with a 35-stone cap. At a 20-stone cap and 99% target, the optimal choice is 20 together. At an unusual 91% target, 18→2 attains exactly 91% with a 260b maximum and 236.6b expected spending, while 19 together offers 95% with a lower 247b maximum. The website’s main answer minimizes expected completion cost and explicitly shows the tie across all batch sizes. Its optional one-attempt target minimizes maximum spend for that target rather than capped expected spending at the expense of unfinished upgrades.

## What the screenshots establish

Every visible row was transcribed and its unit price multiplied by quantity to verify the displayed total. Yellow text with Market Price selected is completed-sale history. White text with time remaining is an active asking price.

| Screenshot | Kind | Selected page | Rows | Stones |
|---|---|---:|---:|---:|
| mr337z0.png | Completed sales | 1/12 | 9 | 11 |
| jv9kt40.png | Completed sales | 2/12 | 9 | 9 |
| 899nqp6.png | Completed sales | 6/12 | 9 | 9 |
| kw59hqt.png | Completed sales | 11/12 | 9 | 10 |
| s1bdnh2.png | Active asks | 1/5 | 9 | 27 |
| 1kbts2x.png | Active asks | 2/5 | 9 | 44 |

There are 36 sale rows representing 39 stones, and 18 active listings representing 71 stones. Historical dates span September 4–9, 2026. The screenshot capture time and market world are not supplied; “Current World Only” is unchecked where visible. The data are snapshots, not live inventory.

The first 21 active stones are approximately 12b each. The next visible unit costs approximately 13.5b. A total of 51 visible stones are priced at 14b or less. The unit-by-unit cost ladder is:

| Stones purchased | Acquisition cost, mesos | With fee for every selected stone |
|---:|---:|---:|
| 10 | 119,999,696,959 | 129,999,696,959 |
| 20 | 239,999,696,949 | 259,999,696,949 |
| 21 | 251,999,696,948 | 272,999,696,948 |
| 30 | 376,355,251,600 | 406,355,251,600 |
| 50 | 656,355,251,600 | 706,355,251,600 |

This ladder assumes partial-stack purchases are possible and that all shown offers remain available. Counts above 20 are acquisition totals, not legal single attempts. The whole-lot purchase recommended earlier costs one meso more for 20 stones and avoids the partial-stack assumption. The downloadable JSON also contains whole-lot acquisition bounds.

Visible historical unit prices range from 9,098,888,888 to 14,999,999,999 mesos. Their unweighted row median is 9,667,222,221.5 and their stone-weighted median is 9,444,444,444. The active row median is 13,888,888,888 and the stone-weighted median is 14,000,000,000. These describe only the selected rows.

**Do not treat those medians as market estimates.** The screenshots deliberately select price-sorted history pages 1, 2, 6 and 11 of 12 and active pages 1 and 2 of 5. Missing pages, selected ranks and different dates confound a pooled comparison. We cannot derive an unbiased market-wide trend, a causal update effect, a useful price confidence interval or a forecast from this sample. The observed low asks also do not promise future availability.

For price sensitivity under the new rules, a guaranteed attempt costs 202b at 9.1b per stone, 260b at 12b, 300b at 14b, and 320b at 15b. The 202b scenario applies current rules to a historical price reference; it is not a guarantee that was available under the old five-stone cap. Each 1b movement in unit price changes the guaranteed total by 20b.

With fixed nondecreasing marginal prices, buying beyond the cheap listings makes retries more expensive. Under the stated repeated-attempt model, expected stone consumption remains 20, and a convex cumulative acquisition-cost function G gives E[G(S)]≥G(20). A 20-stone attempt can then improve expected meso cost too. The finite screenshots cannot support an unbounded retry expectation without an explicit assumption about later supply, so the site keeps its flat-price retry scenarios separate from the visible supply ladder.

## Independent Monte Carlo audit

A second implementation, importing no website code and using Python's random.Random generator, completed **30,000,000 upgrades with 101,273,266 random attempt rolls**. It tested one million completions for every legal Faith and Life amount. Seeds were fixed beforehand; every failed attempt was charged, with no budget cap or discarded tail. Faith used 12b per stone, Life an illustrative 2b. [Full audit](./independent-monte-carlo.md), [recorded counts and results](./independent-monte-carlo.json), [CSV](./independent-monte-carlo.csv).

Observed Faith averages were 259.976951b for 1 stone, 260.385450b for 5, 259.938900b for 10, 259.996152b for 19 and exactly 260b for 20. The 19-stone strategy finished below 260b in 94.9949% of runs, with 5.0051% costing more. This supports the distinction between a frequent cheap outcome and a lower average.

The lowest sampled Faith mean was 3 stones at 259.510719b. Picking the minimum among many simulated estimates biases the apparent winner downward. Two of the 28 stochastic strategies had pointwise 95% mean intervals that missed the theoretical mean; they were retained. A pointwise 95% interval is not simultaneous coverage across every strategy. The exact mean identity establishes the tie; simulation independently checks its implementation under the stated rules.

The recommendation is a choice to remove risk, not a claim that 100% uniquely minimizes the average. The updated opening says all amounts tie and presents the maximum-minus-one alternative's frequent saving and occasional larger bill. Its sampled averages are visible near the top, with data for every amount below.

Nexon's rendered v271 notes were rechecked in this audit and still specify the same Life/Faith caps, per-stone rates and linear fees. Simulations are synthetic probability trials, not observations of game-server attempts. They cannot independently establish Nexon's actual RNG behavior or undocumented failure mechanics.

## Verification and scope limits

The JavaScript model is checked against independent fraction arithmetic for all 30 legal Life and Faith strategies: means, standard deviations, median/P90/P95/P99, and success within the guaranteed total. Three million seeded completions across all 30 amounts agree with exact means within six Monte Carlo standard errors and with exact budget success rates.

The page automatically simulates 50,000 completed upgrades for every legal amount: 1,000,000 upgrades for Faith or 500,000 for Life. A measured-mean chart and pointwise 95% sampling intervals expose every result. Four amounts (maximum, one fewer, half maximum, one stone) are also shown in the distribution and running-mean charts. Histograms retain all tail outcomes; running-average checkpoints preserve trial order. Exact calculations establish the mean tie and recommendation. Simulated sample means never choose the strategy. A separate four-lane animation shows attempts until success; changing type or price cancels old runs and restarts the comparison. The only calculator inputs are stone type and price.

Discrete sample percentiles need care at exact probability boundaries. At Faith 19, the true first-attempt CDF is exactly 95%. In a finite random sample, fewer than 95% may succeed immediately, moving the empirical P95 to a second attempt even though the exact P95 is one attempt. Life 9 has the analogous P99 boundary after two tries. The page explains this difference beside its simulated table.

The independent Python verifier enumerates 4,095 finite compositions through 12 stones, checks the expected-cost identity and splitting inequality, solves a maximum-success budget recurrence through 80 Faith stones, verifies adaptive target-confidence examples using rational probabilities, and compares all 30 production Life/Faith strategies against fraction arithmetic. It makes no network calls.

Excluded: buying the prerequisite ring (level 4 for Life or level 5 for Faith), or combining both upgrades; sale taxes and resale friction; future prices; borrowing costs; time value; boss acquisition schedules; personal drop rates; and inventory not shown. Tradable owned stones have a resale opportunity cost. Refunded world-bound stones instead compete with use on other eligible rings or characters. No cooldown or weekly limit on polishing attempts was found in the reviewed notes; none is invented by the model.

## Reusable research findings

Current GMS news uses `www.nexon.com/maplestory`; restricting discovery to `maplestory.nexon.net` misses current posts. Region matters: Korean update and swap-removal dates cannot be imported into GMS. Release completion posts distinguish live changes from previews. Fresh search crawl dates do not supersede a newer primary rule table.

For market screenshots, record tab state, text color, unit price, quantity, selected page and sort direction before doing statistics. Price-sorted slices are not a random sample. Preserve repeated rows and distinguish per-lot totals from unit prices.

For geometric calculators, do not round a nonzero failure probability to a displayed 0% or a finite retry plan to 100%. Preserve whether a guarantee is mathematically possible even after floating-point underflow.

This task uses a public static GitHub Pages deployment as explicitly requested. It requires no hosted backend or separate Sites account. Original screenshots and full publisher-page captures remain outside the public repository; the site publishes paraphrases, source links and the transcribed price evidence.

For visual simulations, record running-average checkpoints in original trial order before aggregating a histogram or sorting for percentiles. Never select an optimum by the smallest simulated sample mean when the exact expectations tie. Keep every tail outcome in costs and bins, label any compressed playback, and cancel pending callbacks when parameters change.

For calculators with an exact mean tie, select a policy using an explicit risk criterion, rather than asking the user to choose the optimization variable. When introducing a new item type, parameterize caps, fees, probabilities, upgrade levels and simulation accounting together. Keep market observations attached to their original item type. In a discrete distribution, empirical quantiles need not converge smoothly at a probability boundary; explain whole-attempt jumps rather than hiding them. Version every changed browser module import when deploying an incompatible interface update.

When a user challenges a simulation-backed conclusion, expose observed results, seeds and sample counts rather than repeating the analytical answer. Independently implement the experiment with a different RNG and retain outliers. Explain the difference between the lowest sampled mean, the lowest true expectation, and a risk-based recommendation. Synthetic trials validate a stated model; they do not independently establish the game's rules.

## Session record

Verified released mechanics against rendered primary sources; transcribed six screenshots; derived and independently checked fixed and adaptive strategies; implemented a static calculator with charts and simulation; configured GitHub Actions to validate and publish the site. No earlier research journal was superseded.

The current revision follows the Star Force calculator’s inputs → automatic policy → result tiles → visual comparisons structure. Type and price are the only calculator inputs. All legal amounts are evaluated automatically; exact mean and P95 curves, probability tables, four-lane animation, and automatic Monte Carlo explain the recommendation. Tests cover both types, invalid input hiding, cancellation, automatic restart, all-amount simulated means and sampling intervals, unchanged Faith market evidence, and integrity of the independent audit records.
