// All monetary values in this module are billions of mesos.
export const RULES = Object.freeze({ maxStones: 20, probabilityPerStone: 0.05, feePerStone: 1 });
export function validateBatch(n) {
  if (!Number.isInteger(n) || n < 1 || n > 20) throw new RangeError('Use 1–20 stones per attempt.');
}
export function attemptsForConfidence(n, confidence) {
  validateBatch(n);
  if (!(confidence > 0 && confidence <= 1)) throw new RangeError('Confidence must be in (0, 1].');
  if (n === 20) return 1;
  if (confidence === 1) return Infinity;
  return Math.max(1, Math.ceil(Math.log1p(-confidence) / Math.log1p(-n / 20) - 1e-12));
}
export function successWithin(n, attempts) {
  validateBatch(n);
  const k = Math.max(0, Math.floor(attempts));
  if (!k) return 0;
  if (n === 20) return 1;
  return -Math.expm1(k * Math.log1p(-n / 20));
}
export function strategy(n, stonePrice = 12, budget = 260) {
  validateBatch(n);
  if (!Number.isFinite(stonePrice) || stonePrice < 0 || !Number.isFinite(budget) || budget < 0) throw new RangeError('Prices and budgets must be finite and nonnegative.');
  const p = n / 20, attemptCost = n * (stonePrice + RULES.feePerStone);
  const budgetAttempts = Math.max(0, Math.floor(budget / attemptCost + 1e-12));
  const budgetSuccess = successWithin(n, budgetAttempts);
  const expectedCost = 20 * (stonePrice + RULES.feePerStone);
  return { n, p, attemptCost, expectedAttempts: 1 / p, expectedStones: 20,
    expectedCost, standardDeviation: expectedCost * Math.sqrt(1 - p),
    median: attemptCost * attemptsForConfidence(n, 0.5),
    p95: attemptCost * attemptsForConfidence(n, 0.95),
    p99: attemptCost * attemptsForConfidence(n, 0.99),
    budgetAttempts, budgetSuccess, expectedCappedSpend: expectedCost * budgetSuccess,
    worstCost: n === 20 ? attemptCost : Infinity };
}
export function recommendedBatch(confidence) {
  if (!(confidence > 0 && confidence <= 1)) throw new RangeError('Confidence must be in (0, 1].');
  return Math.max(1, Math.ceil(20 * confidence - 1e-12));
}
// Preserve mathematical uncertainty even when floating-point rounding yields 0 or 1.
export function formatProbability(value, digits = 2, uncertain = false) {
  const percentage = value * 100, unit = 10 ** -digits;
  const rounded = Number(percentage.toFixed(digits));
  if (rounded >= 100 && (value < 1 || uncertain)) return `>${(100 - unit).toFixed(digits)}%`;
  if (rounded <= 0 && (value > 0 || uncertain)) return `<${unit.toFixed(digits)}%`;
  return `${percentage.toLocaleString('en-US', { maximumFractionDigits: digits })}%`;
}
export function sequenceStats(sequence, stonePrice = 12) {
  let remaining = 1, expectedSpend = 0, maxSpend = 0;
  for (const n of sequence) {
    validateBatch(n);
    if (remaining === 0) break;
    const cost = n * (stonePrice + 1);
    expectedSpend += remaining * cost;
    maxSpend += cost;
    remaining *= 1 - n / 20;
  }
  return { success: 1 - remaining, expectedSpend, maxSpend };
}
export function purchaseCost(rows, count) {
  if (!Number.isInteger(count) || count < 0) throw new RangeError('Stone count must be a nonnegative integer.');
  let remaining = count, total = 0;
  for (const row of [...rows].sort((a, b) => a.unitPriceMesos - b.unitPriceMesos)) {
    const take = Math.min(remaining, row.quantity);
    total += take * row.unitPriceMesos;
    remaining -= take;
    if (!remaining) break;
  }
  return { filled: count - remaining, missing: remaining, stoneCostMesos: total,
    totalMesos: remaining ? null : total + count * 1e9 };
}
export function seededRandom(seed = 2712026) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function simulate(n, stonePrice = 12, trials = 50000, seed = 2712026) {
  validateBatch(n);
  const random = seededRandom(seed), p = n / 20, cost = n * (stonePrice + 1);
  const values = new Float64Array(trials);
  let sum = 0, sumSquared = 0;
  for (let i = 0; i < trials; i++) {
    let attempts = 1;
    while (random() >= p) attempts++;
    const value = attempts * cost;
    values[i] = value; sum += value; sumSquared += value * value;
  }
  values.sort();
  const mean = sum / trials;
  const standardError = Math.sqrt(Math.max(0, (sumSquared - trials * mean * mean) / (trials - 1)) / trials);
  return { trials, mean, standardError, p95: values[Math.ceil(trials * 0.95) - 1],
    p99: values[Math.ceil(trials * 0.99) - 1], min: values[0], max: values[trials - 1], values };
}
