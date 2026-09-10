// All costs are billions of mesos. GMS v271, September 9, 2026.
export const RULES = Object.freeze({
  faith: Object.freeze({ name: 'Faith', maxStones: 20, feePerStone: 1, from: 5, to: 6 }),
  life: Object.freeze({ name: 'Life', maxStones: 10, feePerStone: .5, from: 4, to: 5 })
});
export function rulesFor(type) {
  if (!Object.hasOwn(RULES, type)) throw new RangeError('Choose Life or Faith.');
  return RULES[type];
}
export function validateBatch(type, n) {
  const { maxStones } = rulesFor(type);
  if (!Number.isInteger(n) || n < 1 || n > maxStones) throw new RangeError(`Use 1–${maxStones} stones per attempt.`);
}
export function attemptsForConfidence(type, n, confidence) {
  validateBatch(type, n);
  if (!(confidence > 0 && confidence <= 1)) throw new RangeError('Confidence must be in (0, 1].');
  if (n === rulesFor(type).maxStones) return 1;
  if (confidence === 1) return Infinity;
  return Math.max(1, Math.ceil(Math.log1p(-confidence) / Math.log1p(-n / rulesFor(type).maxStones) - 1e-12));
}
export function successWithin(type, n, attempts) {
  validateBatch(type, n);
  const k = Math.max(0, Math.floor(attempts));
  if (!k) return 0;
  if (n === rulesFor(type).maxStones) return 1;
  return -Math.expm1(k * Math.log1p(-n / rulesFor(type).maxStones));
}
export function strategy(type, n, stonePrice, budget) {
  validateBatch(type, n);
  const { maxStones, feePerStone } = rulesFor(type);
  if (!Number.isFinite(stonePrice) || stonePrice < 0) throw new RangeError('Price must be finite and nonnegative.');
  const p = n / maxStones, attemptCost = n * (stonePrice + feePerStone);
  const expectedCost = maxStones * (stonePrice + feePerStone);
  budget ??= expectedCost;
  if (!Number.isFinite(budget) || budget < 0) throw new RangeError('Budget must be finite and nonnegative.');
  const budgetAttempts = Math.max(0, Math.floor(budget / attemptCost + 1e-12));
  const budgetSuccess = successWithin(type, n, budgetAttempts);
  const quantile = q => attemptCost * attemptsForConfidence(type, n, q);
  return { type, n, p, attemptCost, expectedAttempts: 1 / p, expectedStones: maxStones,
    expectedCost, standardDeviation: expectedCost * Math.sqrt(1 - p),
    median: quantile(.5), p90: quantile(.9), p95: quantile(.95), p99: quantile(.99),
    budgetAttempts, budgetSuccess, expectedCappedSpend: expectedCost * budgetSuccess,
    worstCost: n === maxStones ? attemptCost : Infinity };
}
export function analyze(type, price) {
  const rules = rulesFor(type);
  const strategies = Array.from({ length: rules.maxStones }, (_, i) => strategy(type, i + 1, price));
  // All legal batches have exactly the same mean. Break the tie by variance.
  return { rules, strategies, recommended: strategies.at(-1),
    comparisons: [rules.maxStones, rules.maxStones - 1, rules.maxStones / 2, 1].map(n => strategies[n - 1]) };
}
export function formatProbability(value, digits = 2, uncertain = false) {
  const percentage = value * 100, unit = 10 ** -digits;
  const rounded = Number(percentage.toFixed(digits));
  if (rounded >= 100 && (value < 1 || uncertain)) return `>${(100 - unit).toFixed(digits)}%`;
  if (rounded <= 0 && (value > 0 || uncertain)) return `<${unit.toFixed(digits)}%`;
  return `${percentage.toLocaleString('en-US', { maximumFractionDigits: digits })}%`;
}
export function sequenceStats(type, sequence, stonePrice) {
  let remaining = 1, expectedSpend = 0, maxSpend = 0;
  for (const n of sequence) {
    const s = strategy(type, n, stonePrice);
    if (remaining === 0) break;
    expectedSpend += remaining * s.attemptCost;
    maxSpend += s.attemptCost;
    remaining *= 1 - s.p;
  }
  return { success: 1 - remaining, expectedSpend, maxSpend };
}
// Screenshot purchase evidence is Faith only, including its polishing fee.
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
    totalMesos: remaining ? null : total + count * RULES.faith.feePerStone * 1e9 };
}
export function seededRandom(seed = 2712026) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
