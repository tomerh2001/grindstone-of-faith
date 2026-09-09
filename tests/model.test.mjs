import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { attemptsForConfidence, successWithin, strategy, recommendedBatch, sequenceStats, purchaseCost, simulate, formatProbability } from '../site/model.js';
const close = (a, b, tolerance = 1e-9) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const market = JSON.parse(fs.readFileSync(new URL('../site/market.json', import.meta.url)));
const independent = JSON.parse(fs.readFileSync(new URL('../research/statistics-results.json', import.meta.url)));
const asks = market.rows.filter(r => r.kind === 'active_ask').map(r => ({ ...r, unitPriceMesos: r.unit_price_mesos }));

test('reference strategies match independent results and all 20 satisfy exact quantiles', () => {
  assert.equal(independent.fixed_batch_table.length, 20);
  for (const row of independent.fixed_batch_table) {
    const s = strategy(row.batch);
    close(s.expectedCost, row.expected_cost_b);
    close(s.standardDeviation, row.standard_deviation_cost_b);
    close(s.budgetSuccess, row.p_success_with_260b_budget);
    assert.equal(s.median, row.p50_cost_b);
    assert.equal(s.p95, row.p95_cost_b);
    assert.equal(s.p99, row.p99_cost_b);
  }
  // Independent rational arithmetic and geometric quantiles are checked in Python as well.
  const known = [[1,182,767,1170],[2,182,754,1144],[5,195,715,1105],[10,130,650,910],[15,195,585,780],[18,234,468,468],[19,247,247,494],[20,260,260,260]];
  for (const [n, median, p95, p99] of known) {
    const s = strategy(n);
    assert.equal(s.expectedCost, 260); assert.equal(s.median, median);
    assert.equal(s.p95, p95); assert.equal(s.p99, p99);
  }
  for (let n = 1; n <= 20; n++) {
    for (const price of [0, 9.1, 11.999696969, 12, 14, 1000]) {
      const s = strategy(n, price, 260);
      close(s.expectedCost, 20 * (price + 1));
      for (const q of [0.5, 0.9, 0.95, 0.99, 0.999]) {
        const k = attemptsForConfidence(n, q);
        assert.ok(successWithin(n, k) >= q - 1e-12);
        assert.ok(successWithin(n, k - 1) < q);
      }
    }
  }
});
test('certainty, exact quantile and budget boundaries', () => {
  assert.equal(attemptsForConfidence(19, .95), 1);
  assert.equal(attemptsForConfidence(18, .99), 2);
  assert.equal(attemptsForConfidence(20, 1), 1);
  assert.equal(attemptsForConfidence(19, 1), Infinity);
  assert.equal(strategy(20, 12, 259.999).budgetSuccess, 0);
  assert.equal(strategy(20, 12, 260).budgetSuccess, 1);
  assert.equal(strategy(5, 12, 64.99).budgetSuccess, 0);
  close(strategy(5, 12, 65).budgetSuccess, .25);
  assert.equal(strategy(1, 12, 0).budgetAttempts, 0);
  assert.equal(strategy(20).standardDeviation, 0);
  close(strategy(1).budgetSuccess, .641514077591458);
  close(strategy(10).budgetSuccess, .75);
});
test('display never implies certainty for finite sub-20 retry plans', () => {
  const nearCertain = strategy(19, 12, 988);
  assert.equal(formatProbability(nearCertain.budgetSuccess, 2, true), '>99.99%');
  assert.equal(formatProbability(1 - nearCertain.budgetSuccess, 2, true), '<0.01%');
  const roundedToOne = strategy(1, 12, 13000);
  assert.equal(formatProbability(roundedToOne.budgetSuccess, 2, true), '>99.99%');
  assert.equal(formatProbability(1 - roundedToOne.budgetSuccess, 2, true), '<0.01%');
  assert.equal(formatProbability(1), '100%'); assert.equal(formatProbability(0), '0%');
});
test('confidence target returns minimum single batch including rounding boundaries', () => {
  assert.equal(recommendedBatch(.95), 19); assert.equal(recommendedBatch(.99), 20);
  assert.equal(recommendedBatch(1), 20); assert.equal(recommendedBatch(.05), 1);
  for (let q = 1; q <= 100; q++) {
    const n = recommendedBatch(q / 100);
    assert.ok(n / 20 >= q / 100 - 1e-12);
    assert.ok((n - 1) / 20 < q / 100);
  }
});
test('adaptive and capped policies count unspent reserves correctly', () => {
  const s = sequenceStats([19, 20]);
  close(s.success, 1); close(s.expectedSpend, 260); assert.equal(s.maxSpend, 507);
  const capped = sequenceStats([19, 16]);
  close(capped.success, .99); close(capped.expectedSpend, 257.4); assert.equal(capped.maxSpend, 455);
  for (let a = 1; a < 20; a++) for (let b = 1; b < 20; b++) {
    const plan = sequenceStats([a, b]);
    close(plan.expectedSpend, 260 * plan.success);
    if (a + b <= 20) assert.ok(plan.success < (a + b) / 20);
  }
});
test('market transcription preserves all quantities, categories and exact totals', () => {
  assert.equal(market.rows.length, 54); assert.equal(asks.length, 18);
  assert.equal(asks.reduce((s, r) => s + r.quantity, 0), 71);
  assert.equal(market.rows.filter(r => r.kind === 'historical_sale').reduce((s, r) => s + r.quantity, 0), 39);
  for (const row of market.rows) assert.equal(row.unit_price_mesos * row.quantity, row.total_price_mesos);
  assert.equal(purchaseCost(asks, 20).stoneCostMesos, 239999696949);
  assert.equal(purchaseCost(asks, 20).totalMesos, 259999696949);
  assert.equal(purchaseCost(asks, 21).stoneCostMesos, 251999696948);
  assert.equal(purchaseCost(asks, 22).stoneCostMesos - purchaseCost(asks, 21).stoneCostMesos, 13499999999);
  assert.equal(purchaseCost(asks, 72).totalMesos, null);
  assert.equal(purchaseCost(asks, 72).missing, 1);
  assert.equal(purchaseCost(asks, 0).totalMesos, 0);
});
test('simulation independently approaches exact means and budgets', () => {
  for (let n = 1; n <= 20; n++) {
    const result = simulate(n, 12, 100000), exact = strategy(n);
    assert.ok(Math.abs(result.mean - exact.expectedCost) <= 6 * result.standardError + 1e-8);
    const success = result.values.filter(v => v <= 260).length / result.trials;
    assert.ok(Math.abs(success - exact.budgetSuccess) < .007);
    assert.equal(result.trials, 100000);
  }
});
test('invalid model inputs fail explicitly', () => {
  for (const n of [0, 21, -1, 1.5, NaN, Infinity]) assert.throws(() => strategy(n), RangeError);
  for (const q of [0, -1, 1.1, NaN]) assert.throws(() => recommendedBatch(q), RangeError);
  for (const price of [-1, NaN, Infinity]) assert.throws(() => strategy(5, price), RangeError);
  assert.throws(() => strategy(5, 12, -1), RangeError);
});
