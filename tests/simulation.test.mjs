import test from 'node:test';
import assert from 'node:assert/strict';
import { createUpgrade, advanceUpgrade, UpgradeExperiment } from '../site/simulation.js';

test('one-upgrade playback charges failures and stops charging at success', () => {
  const run = createUpgrade(5, 12), rolls = [.9, .5, .1];
  let cursor = 0;
  const random = () => rolls[cursor++];
  advanceUpgrade(run, random); assert.equal(run.cost, 65); assert.equal(run.success, false);
  advanceUpgrade(run, random); assert.equal(run.cost, 130);
  advanceUpgrade(run, random); assert.equal(run.cost, 195); assert.equal(run.success, true);
  advanceUpgrade(run, random); assert.equal(run.cost, 195); assert.equal(cursor, 3);
  assert.equal(run.stones, 15); assert.deepEqual(run.outcomes, [false, false, true]);
});
test('twenty-stone visual experiment always lands exactly on the guarantee', () => {
  const e = new UpgradeExperiment(20, 12, 1000).advance(10000);
  assert.equal(e.completed, 1000); assert.equal(e.totalAttempts, 1000);
  assert.equal(e.mean, 260); assert.equal(e.standardError, 0);
  assert.equal(e.quantile(.95), 260); assert.equal(e.quantile(.99), 260);
  assert.equal(e.equal, 1000); assert.equal(e.below, 0); assert.equal(e.above, 0);
  assert.ok(e.checkpoints.every(p => p.mean === 260));
});
test('progressive experiments preserve chronological averages and every histogram outcome', () => {
  for (const n of [1, 5, 10, 19, 20]) {
    const stepped = new UpgradeExperiment(n, 11.99, 12500, 2026);
    stepped.advance(103); assert.equal(stepped.completed, 103);
    stepped.advance(711); assert.equal(stepped.completed, 814);
    stepped.advance(99999);
    const whole = new UpgradeExperiment(n, 11.99, 12500, 2026).advance(12500);
    assert.equal(stepped.mean, whole.mean);
    assert.deepEqual(stepped.checkpoints, whole.checkpoints);
    assert.equal(stepped.checkpoints.at(-1).mean, stepped.mean);
    assert.equal(stepped.checkpoints.at(-1).runs, stepped.completed);
    assert.equal(stepped.histogram().reduce((s, b) => s + b.count, 0), stepped.completed);
    assert.equal(stepped.below + stepped.equal + stepped.above, stepped.completed);
    const weighted = stepped.counts.reduce((s, c, i) => s + c * i * stepped.attemptCost, 0) / stepped.completed;
    assert.ok(Math.abs(weighted - stepped.mean) < 1e-8);
    assert.ok(Math.abs(stepped.mean - stepped.exactMean) <= 6 * stepped.standardError + 1e-8);
    assert.ok(stepped.checkpoints.every((p, i, all) => i === 0 || all[i - 1].runs < p.runs));
  }
});
test('zero-price, empty, single-sample and invalid experiments have defined behavior', () => {
  const e = new UpgradeExperiment(20, 0, 1);
  assert.equal(e.quantile(.95), null); assert.deepEqual(e.histogram(), []);
  e.advance(1); assert.equal(e.mean, 20); assert.equal(e.standardError, 0);
  for (const trials of [0, -1, 1.5, NaN, Infinity, 1000001]) assert.throws(() => new UpgradeExperiment(5, 12, trials), RangeError);
  for (const price of [-1, NaN, Infinity]) assert.throws(() => new UpgradeExperiment(5, price), RangeError);
  for (const batch of [0, 21, 1.5]) assert.throws(() => createUpgrade(batch, 12), RangeError);
  assert.throws(() => e.advance(-1), RangeError);
});
