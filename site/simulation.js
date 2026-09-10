import { strategy, seededRandom, validateBatch, rulesFor } from './model.js?v=4';

export function rollAttempt(type, batch, random = Math.random) {
  validateBatch(type, batch);
  return random() < batch / rulesFor(type).maxStones;
}

export function createUpgrade(type, batch, price) {
  const rule = strategy(type, batch, price);
  return { type, batch, price, attemptCost: rule.attemptCost, attempts: 0, stones: 0, cost: 0, success: false, outcomes: [] };
}

export function advanceUpgrade(run, random = Math.random) {
  if (run.success) return run;
  run.success = rollAttempt(run.type, run.batch, random);
  run.attempts++;
  run.stones = run.attempts * run.batch;
  run.cost = run.attempts * run.attemptCost;
  run.outcomes.push(run.success);
  return run;
}

// Each sample is a completed upgrade. Histograms retain every unlucky outcome.
// Checkpoints are recorded in trial order, before any percentile aggregation.
export class UpgradeExperiment {
  constructor(type, batch, price, trials = 50000, seed = 2712026) {
    const rule = strategy(type, batch, price);
    if (!Number.isInteger(trials) || trials < 1 || trials > 1000000) throw new RangeError('Use 1–1,000,000 completed upgrades.');
    this.type = type;
    this.maxStones = rulesFor(type).maxStones;
    this.batch = batch;
    this.price = price;
    this.target = trials;
    this.seed = seed;
    this.random = seededRandom(seed);
    this.attemptCost = rule.attemptCost;
    this.exactMean = rule.expectedCost;
    this.completed = 0;
    this.mean = 0;
    this.m2 = 0;
    this.counts = [];
    this.checkpoints = [];
    this.checkpointInterval = Math.max(1, Math.floor(trials / 200));
    this.below = 0;
    this.equal = 0;
    this.above = 0;
    this.totalAttempts = 0;
  }
  advance(count = 1000) {
    if (!Number.isInteger(count) || count < 0) throw new RangeError('Sample count must be a nonnegative integer.');
    const end = Math.min(this.target, this.completed + count);
    while (this.completed < end) {
      let attempts = 1;
      while (!rollAttempt(this.type, this.batch, this.random)) attempts++;
      const value = attempts * this.attemptCost;
      this.completed++;
      this.totalAttempts += attempts;
      this.counts[attempts] = (this.counts[attempts] || 0) + 1;
      const delta = value - this.mean;
      this.mean += delta / this.completed;
      this.m2 += delta * (value - this.mean);
      // Integer stone counts avoid price-related floating-point equality errors.
      if (attempts * this.batch < this.maxStones) this.below++;
      else if (attempts * this.batch === this.maxStones) this.equal++;
      else this.above++;
      if (this.completed % this.checkpointInterval === 0 || this.completed === this.target) {
        this.checkpoints.push({ runs: this.completed, mean: this.mean });
      }
    }
    return this;
  }
  quantile(q) {
    if (!(q > 0 && q <= 1)) throw new RangeError('Quantile must be in (0, 1].');
    if (!this.completed) return null;
    const threshold = Math.ceil(this.completed * q);
    let cumulative = 0;
    for (let attempts = 1; attempts < this.counts.length; attempts++) {
      cumulative += this.counts[attempts] || 0;
      if (cumulative >= threshold) return attempts * this.attemptCost;
    }
    throw new Error('Histogram does not account for all completed upgrades.');
  }
  get standardError() {
    return this.completed > 1 ? Math.sqrt(Math.max(0, this.m2 / (this.completed - 1)) / this.completed) : 0;
  }
  get finished() { return this.completed === this.target; }
  histogram(maxBins = 24) {
    if (!this.completed) return [];
    const maxAttempt = this.counts.length - 1;
    const step = Math.max(1, Math.ceil(maxAttempt / maxBins));
    const bins = [];
    for (let from = 1; from <= maxAttempt; from += step) {
      const to = Math.min(from + step - 1, maxAttempt);
      let count = 0;
      for (let n = from; n <= to; n++) count += this.counts[n] || 0;
      bins.push({ from: from * this.attemptCost, to: to * this.attemptCost, count });
    }
    return bins;
  }
}
