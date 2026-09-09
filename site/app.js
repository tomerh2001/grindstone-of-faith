import { strategy, successWithin, recommendedBatch, purchaseCost, simulate, formatProbability } from './model.js';

const $ = id => document.getElementById(id);
const money = (v, digits = 1) => Number.isFinite(v) ? `${v.toLocaleString('en-US', { maximumFractionDigits: digits })}b` : 'No finite limit';
const pct = formatProbability;
const integer = v => v.toLocaleString('en-US');
const state = { price: 12, confidence: 100, budget: 260, batch: 5, purchaseCount: 20, market: 'active' };
let market = null;
const COLORS = { custom: '#b9a1ff', nineteen: '#f3cc84', guarantee: '#74eed0' };

function frame(label, width = 720, height = 320) {
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}"><title>${label}</title>`;
}
function cdfChart() {
  const custom = strategy(state.batch, state.price, state.budget), mean = custom.expectedCost;
  const xmax = Math.max(mean * 1.35, Math.min(Math.max(custom.p99, state.budget), mean * 4.5));
  const W = 720, H = 320, left = 52, right = 18, top = 22, bottom = 53;
  const X = v => left + v / xmax * (W - left - right), Y = v => H - bottom - v * (H - top - bottom);
  let svg = frame('Cumulative probability of success versus total budget, comparing your selected batch, 19 stones, and 20 stones');
  for (const p of [0, .25, .5, .75, 1]) {
    svg += `<line class="grid" x1="${left}" x2="${W - right}" y1="${Y(p)}" y2="${Y(p)}"/><text x="${left - 8}" y="${Y(p) + 5}" text-anchor="end">${pct(p, 0)}</text>`;
  }
  for (let i = 0; i <= 4; i++) {
    const cost = xmax * i / 4;
    svg += `<text x="${X(cost)}" y="${H - 28}" text-anchor="${i === 4 ? 'end' : 'middle'}">${money(cost, 0)}</text>`;
  }
  svg += `<text x="${W / 2}" y="${H - 3}" text-anchor="middle">Available spending · billions of mesos</text>`;
  for (const [n, color, name] of [[state.batch, COLORS.custom, 'Selected batch'], [19, COLORS.nineteen, '19 stones'], [20, COLORS.guarantee, '20 stones']]) {
    const s = strategy(n, state.price, state.budget);
    let d = `M ${X(0)} ${Y(0)}`;
    const maxAttempts = Math.floor(xmax / s.attemptCost);
    for (let k = 1; k <= maxAttempts; k++) {
      d += ` H ${X(k * s.attemptCost)} V ${Y(successWithin(n, k))}`;
      if (n === 20) break;
    }
    d += ` H ${X(xmax)}`;
    svg += `<path class="line" stroke="${color}" ${n === 19 ? 'stroke-dasharray="6 4"' : ''} d="${d}"><title>${name}: ${pct(s.p)} per attempt, ${money(s.attemptCost)} per attempt</title></path>`;
  }
  if (state.budget <= xmax) {
    const x = X(state.budget);
    svg += `<line x1="${x}" x2="${x}" y1="${top}" y2="${H - bottom}" stroke="#9baac0" stroke-dasharray="3 6"/><text x="${Math.min(x + 7, W - 120)}" y="${top + 15}">Your limit</text>`;
  }
  $('cdfChart').innerHTML = svg + '</svg>';
  $('customLegend').textContent = `${state.batch} per attempt`;
}

function render() {
  const n = recommendedBatch(state.confidence / 100), selected = strategy(state.batch, state.price, state.budget);
  const recommendation = strategy(n, state.price, state.budget), gap = recommendation.attemptCost - state.budget;
  $('confidenceValue').textContent = `${state.confidence}%`;
  $('batchValue').textContent = `${state.batch} stones · ${pct(selected.p)}`;
  $('recommendedN').textContent = n;
  $('recommendedCost').textContent = money(recommendation.attemptCost, 2);
  $('recommendedChance').textContent = pct(recommendation.p);
  $('recommendedFailure').textContent = pct(1 - recommendation.p);
  $('decisionBadge').textContent = n === 20 ? 'Guaranteed' : `${pct(1 - recommendation.p)} failure risk`;
  $('stoneMeter').innerHTML = Array.from({ length: 20 }, (_, i) => `<span class="${i < n ? 'on' : ''}"></span>`).join('');
  $('verdict').textContent = n === 20
    ? 'Use 20 together. This guarantees success and removes the chance of paying for retries.'
    : `Use ${n} together for ${pct(recommendation.p)} success. This is the smallest upfront budget that meets your ${state.confidence}% target, with a ${pct(1 - recommendation.p)} risk of an unsuccessful attempt.`;
  $('budgetStatus').classList.toggle('warn', gap > 1e-9);
  const affordable = Math.max(0, Math.min(20, Math.floor(state.budget / (state.price + 1) + 1e-12)));
  $('budgetStatus').textContent = gap > 1e-9
    ? `Your limit is ${money(gap, 2)} short. It currently funds ${affordable} stones together for ${pct(affordable / 20)} success. Save the shortfall to reach your target.`
    : `Fits your spending limit${Math.abs(gap) < 1e-9 ? ' exactly' : ` with ${money(-gap, 2)} to spare`}. ${money(n * state.price, 2)} in stones + ${money(n)} in fees.`;
  $('nineteenTradeoff').textContent = `The closest tradeoff: 19 stones cost ${money(19 * (state.price + 1), 2)} for 95%. The twentieth costs ${money(state.price + 1, 2)} more to remove that final 5% risk.`;
  $('meanStrip').textContent = money(selected.expectedCost, 2);
  $('attemptCost').textContent = money(selected.attemptCost, 2);
  $('expectedCost').textContent = money(selected.expectedCost, 2);
  $('p95Cost').textContent = money(selected.p95, 2);
  $('p99Cost').textContent = money(selected.p99, 2);
  $('budgetLabel').textContent = money(state.budget, 2);
  const uncertain = selected.n < 20 && selected.budgetAttempts > 0;
  $('budgetChance').textContent = pct(selected.budgetSuccess, 2, uncertain);
  $('budgetProgress').style.width = `${selected.budgetSuccess * 100}%`;
  $('budgetExplanation').textContent = `${integer(selected.budgetAttempts)} affordable attempt${selected.budgetAttempts === 1 ? '' : 's'}, stopping at success. ${pct(1 - selected.budgetSuccess, 2, uncertain)} chance of stopping without the upgrade after all affordable attempts.${state.batch === 20 && selected.budgetAttempts > 0 ? ' Only one attempt is needed.' : ''}`;
  $('strategyTable').innerHTML = Array.from({ length: 20 }, (_, i) => strategy(i + 1, state.price, state.budget)).map(s =>
    `<tr class="${s.n === 20 ? 'guarantee' : s.n === state.batch ? 'selected' : ''}"><td><button data-batch="${s.n}" aria-label="Explore ${s.n} stones per attempt" aria-pressed="${s.n === state.batch}">${s.n}${s.n === 20 ? ' · guarantee' : ''}</button></td><td>${pct(s.p)}</td><td>${money(s.attemptCost, 2)}</td><td>${money(s.expectedCost, 2)}</td><td>${money(s.median, 2)}</td><td>${money(s.p95, 2)}</td><td>${money(s.p99, 2)}</td><td>${pct(s.budgetSuccess, 2, s.n < 20 && s.budgetAttempts > 0)}</td></tr>`).join('');
  $('cappedExplanation').textContent = `For your selected ${state.batch}-stone batch and ${money(state.budget)} cap, expected spending before success or stopping is ${money(selected.expectedCappedSpend, 2)}, with ${pct(selected.budgetSuccess, 2, uncertain)} final success. This lower capped average must not be confused with the ${money(selected.expectedCost, 2)} average needed to finish when continuing until success.`;
  document.querySelectorAll('[data-price]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.price) === state.price));
  document.querySelectorAll('[data-confidence]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.confidence) === state.confidence));
  $('simulationResult').textContent = 'Uses a fixed random seed so the same settings reproduce the same result.';
  cdfChart();
}

function activeRows() {
  return market.rows.filter(r => r.kind === 'active_ask').map(r => ({ ...r, unitPriceMesos: r.unit_price_mesos }));
}
function renderPurchase() {
  if (!market) return;
  const rows = activeRows(), n = state.purchaseCount, result = purchaseCost(rows, n);
  const max = rows.reduce((sum, r) => sum + r.quantity, 0);
  $('purchaseCount').max = max;
  $('purchaseValue').textContent = integer(n);
  const costs = Array.from({ length: max + 1 }, (_, i) => purchaseCost(rows, i).stoneCostMesos / 1e9);
  const W = 640, H = 270, left = 57, right = 20, top = 22, bottom = 46;
  const xmax = max, ymax = Math.ceil(costs[max] / 100) * 100;
  const X = v => left + v / xmax * (W - left - right), Y = v => H - bottom - v / ymax * (H - top - bottom);
  let svg = frame('Cumulative cost of acquiring the cheapest stones from the visible current listings, excluding polishing fees', W, H);
  for (let i = 0; i <= 4; i++) {
    const value = i * ymax / 4;
    svg += `<line class="grid" x1="${left}" x2="${W - right}" y1="${Y(value)}" y2="${Y(value)}"/><text x="${left - 8}" y="${Y(value) + 5}" text-anchor="end">${money(value, 0)}</text>`;
  }
  for (const i of [0, 20, 40, 60, max]) svg += `<text x="${X(i)}" y="${H - 23}" text-anchor="middle">${i}</text>`;
  svg += `<text x="${W / 2}" y="${H - 1}" text-anchor="middle">Stones purchased · acquisition cost only</text>`;
  const d = costs.map((c, i) => `${i ? 'L' : 'M'} ${X(i)} ${Y(c)}`).join(' ');
  svg += `<path d="${d}" class="line" stroke="${COLORS.guarantee}"/><line x1="${X(n)}" x2="${X(n)}" y1="${top}" y2="${H - bottom}" stroke="${COLORS.custom}" stroke-dasharray="4 4"/><circle cx="${X(n)}" cy="${Y(costs[n])}" r="5" fill="${COLORS.custom}"/>`;
  $('supplyChart').innerHTML = svg + '</svg>';
  $('purchaseAnswer').innerHTML = `${money(result.stoneCostMesos / 1e9, 3)} in stones + ${money(n)} in fees = ${money(result.totalMesos / 1e9, 3)}<br><span class="small">Exact total: ${integer(result.totalMesos)} mesos.${n > 20 ? ' More than 20 stones require multiple attempts or rings.' : ` A single ${n}-stone attempt has ${pct(n / 20)} success.`}</span>`;
}
function renderMarket() {
  if (!market) return;
  const kind = state.market === 'active' ? 'active_ask' : 'historical_sale';
  const rows = market.rows.filter(r => r.kind === kind);
  $('marketTable').innerHTML = rows.map(r => `<tr><td>${r.page} / ${r.pages}</td><td>${r.row}</td><td>${r.quantity}</td><td>${integer(r.unit_price_mesos)}</td><td>${integer(r.total_price_mesos)}</td><td>${r.sale_date || r.time_left}</td></tr>`).join('');
  $('evidenceCaption').textContent = state.market === 'active' ? '18 visible current asks · 71 stones · screenshot-time offers' : '36 visible completed-sale rows · 39 stones · selected price-sorted pages';
  document.querySelectorAll('[data-market]').forEach(b => b.setAttribute('aria-pressed', b.dataset.market === state.market));
}

function renderSources() {
  const current = 'https://www.nexon.com/maplestory/news/update/44597/v-271-maple-story-x-frieren-beyond-journey-s-end-patch-notes#SpecialSkillRingChanges';
  const old = 'https://www.nexon.com/maplestory/news/update/31006/v-263-carcion-octo-fest-patch-notes#BossRewardImprovements';
  $('mechanicsEvidence').innerHTML = `<p class="eyebrow muted">VERIFIED AGAINST NEXON’S CURRENT GMS NOTES</p><h3>One eligible level-5 ring. Up to 20 stones.</h3><p>Faith polishes an untradable level-5 <strong>Ring of Restraint or Continuous Ring</strong> to level 6. The September 9 update raised the cap from 5 stones to 20 and made the polishing fee linear. Each stone contributes 5 percentage points and costs 1b in fees. <a href="${current}">GMS v271 ↗</a></p><div class="table-scroll mechanics-table"><table><caption class="sr-only">Changes to the Faith polishing fee</caption><thead><tr><th>Stones</th><th>Success</th><th>Old fee</th><th>Current fee</th></tr></thead><tbody>${[[1,1],[2,2],[3,4],[4,7],[5,10],[10,null],[19,null],[20,null]].map(([n,oldFee]) => `<tr><td>${n}</td><td>${n * 5}%</td><td>${oldFee === null ? 'Unavailable' : money(oldFee)}</td><td>${money(n)}</td></tr>`).join('')}</tbody></table></div><p class="small">The old fee schedule comes from <a href="${old}">GMS v263</a>. Recently crawled wiki pages can still show that obsolete table.</p><h3>Check compensation before buying.</h3><p>The patch removed polishing for Weapon Jump S/D/I/L, Risk Taker, Totalling, and Critical Damage rings. Qualifying pre-update level-6 rings receive <strong>20 Faith + 10 Life + 25b</strong> after being reduced to level 4; level-5 rings receive 10 Life + 5b. Claim through the Rewards System by September 8, 2027, 23:59 UTC. Interactive refund stones are permanent and bound within world. <a href="${current}">Eligibility and refunds ↗</a></p><p>For an existing eligible polished ring, a polish-level swap costs 50m until its planned removal in November 2026. A swap moves the upgrade; it does not create another one. <a href="${current}">Swap change ↗</a></p>`;
  const sources = [
    [current, 'Nexon · GMS v271 patch notes', 'Published September 8; updated September 9, 2026. Current cap, rate, fee, eligibility, compensation and swap changes.'],
    [old, 'Nexon · GMS v263 patch notes', 'Historical primary source. Faith’s original level-5 to level-6 upgrade and superseded five-stone fee table.'],
    ['https://www.nexon.com/maplestory/news/update/5341/v-246-new-age-6th-job-patch-notes#special', 'Nexon · GMS v246 patch notes', 'Original untradable-ring polishing requirement. Its old costs are not used for the current calculator.'],
    ['https://steamcommunity.com/gid/103582791433474083/announcements/detail/707782088403716435', 'Nexon · September 9 maintenance completed', 'Official publisher announcement confirms the update went live, with client v271.1.2.'],
    ['./market.json', 'Your six Auction House screenshots · transcribed data', 'All 54 visible rows, quantities, unit prices, dates, page numbers and limitations. Original account screenshots remain private.'],
    ['https://github.com/tomerh2001/grindstone-of-faith/tree/main/research', 'Reproducible statistical analysis', 'Analytic distributions, independent exact-arithmetic verification, simulation checks and the dated research record.']
  ];
  $('sources').innerHTML = sources.map(([url, title, detail]) => `<div class="source"><a href="${url}">${title} ↗</a><p>${detail}</p></div>`).join('');
}

function updateInputs() {
  const names = ['price', 'confidence', 'budget', 'batch'];
  if (names.some(id => $(id).value === '' || !$(id).checkValidity() || !Number.isFinite($(id).valueAsNumber))) {
    $('inputError').textContent = 'Enter a valid price (0–1,000b) and budget (0–1,000,000b). Results retain the last valid settings.';
    $('simulate').disabled = true;
    return;
  }
  names.forEach(id => { state[id] = $(id).valueAsNumber; });
  $('simulate').disabled = false;
  $('inputError').textContent = '';
  render();
}
for (const id of ['price', 'confidence', 'budget', 'batch']) $(id).addEventListener('input', updateInputs);
document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  for (const key of ['price', 'confidence', 'batch']) {
    if (button.dataset[key] !== undefined) {
      $(key).value = Number(button.dataset[key]);
      updateInputs(); return;
    }
  }
  if (button.dataset.market) { state.market = button.dataset.market; renderMarket(); }
});
$('purchaseCount').addEventListener('input', e => { state.purchaseCount = e.target.valueAsNumber; renderPurchase(); });
$('simulate').addEventListener('click', () => {
  const n = state.batch, price = state.price;
  const result = simulate(n, price);
  $('simulationResult').textContent = `${integer(result.trials)} runs using ${n} stones per attempt: mean ${money(result.mean, 2)} (exact ${money(20 * (price + 1), 2)}), 95th percentile ${money(result.p95)}, 99th percentile ${money(result.p99)}. Approximate 95% Monte Carlo interval for the mean: ${money(result.mean - 1.96 * result.standardError, 2)}–${money(result.mean + 1.96 * result.standardError, 2)}. This interval describes simulation noise, not uncertainty in the published rate.`;
});
renderSources();
render();
try {
  const response = await fetch('./market.json');
  if (!response.ok) throw new Error(`Market data unavailable (${response.status})`);
  market = await response.json();
  const asks = activeRows(), historical = market.rows.filter(r => r.kind === 'historical_sale');
  const low = Math.min(...asks.map(r => r.unitPriceMesos)), countLow = asks.filter(r => r.unitPriceMesos <= 12e9).reduce((s, r) => s + r.quantity, 0);
  const stats = [['Lowest visible ask', money(low / 1e9, 3), '11,999,696,969 mesos'], ['Supply at ≈12b', `${countLow} stones`, 'Enough for one guaranteed attempt'], ['All visible asks', `${asks.reduce((s, r) => s + r.quantity, 0)} stones`, `${asks.length} listings across 2 pages`], ['Recorded sales', `${historical.length} rows`, '39 stones · September 4–9']];
  $('marketSummary').innerHTML = stats.map(([label, value, note]) => `<div class="market-stat"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`).join('');
  renderPurchase(); renderMarket();
} catch (error) {
  $('marketSummary').textContent = 'The screenshot data could not be loaded. The flat-price calculator still works. Reload to retry.';
  $('marketTable').innerHTML = '<tr><td colspan="6">Market evidence unavailable.</td></tr>';
  $('purchaseCount').disabled = true;
  console.error(error);
}
