import { analyze, strategy, successWithin, purchaseCost, formatProbability } from './model.js?v=4';
import { SimulationView } from './simulation-view.js?v=4';

const $ = id => document.getElementById(id);
const money = (v, digits = 1) => Number.isFinite(v) ? `${v.toLocaleString('en-US', { maximumFractionDigits: digits })}b` : 'No finite limit';
const pct = formatProbability;
const integer = v => v.toLocaleString('en-US');
const state = { type: 'faith', price: 12, purchaseCount: 20, market: 'active' };
const params = new URLSearchParams(location.search);
if (['faith', 'life'].includes(params.get('type'))) state.type = params.get('type');
if (params.has('price') && params.get('price').trim() && Number.isFinite(Number(params.get('price'))) && Number(params.get('price')) >= 0 && Number(params.get('price')) <= 1e6) state.price = Number(params.get('price'));
$('type').value = state.type; $('price').value = state.price;
let market = null, result = analyze(state.type, state.price);
const simulations = new SimulationView(() => ({ ...state, analysis: result }));
const PALETTE = ['#74eed0', '#f3cc84', '#b9a1ff', '#76b9f7'];
const COLORS = { custom: PALETTE[2], guarantee: PALETTE[0] };
function frame(label, width = 720, height = 320) {
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}"><title>${label}</title>`;
}
function chartSize(id) { return Math.max(340, Math.round($(id).clientWidth || 900)); }
function legend() {
  return result.comparisons.map((s, i) => `<span style="--key:${PALETTE[i]}">${s.n} / attempt${i === 0 ? ' · recommended' : ''}</span>`).join('');
}
function efficiencyChart() {
  const { strategies, recommended, rules } = result;
  const W = chartSize('efficiencyChart'), H = 300, left = 65, right = 23, top = 25, bottom = 52;
  const ymax = Math.max(...strategies.map(s => s.p95)) * 1.13;
  const X = n => left + (n - 1) / (rules.maxStones - 1) * (W - left - right);
  const Y = v => H - bottom - v / ymax * (H - top - bottom);
  let svg = frame('Exact mean and 95th percentile of total upgrade cost for every legal stone amount', W, H);
  for (let i = 0; i <= 3; i++) {
    const v = ymax * i / 3;
    svg += `<line class="grid" x1="${left}" x2="${W-right}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${left-8}" y="${Y(v)+4}" text-anchor="end">${money(v, 0)}</text>`;
  }
  for (const [key, color] of [['p95', PALETTE[1]], ['expectedCost', PALETTE[0]]]) {
    svg += `<path class="line" stroke="${color}" d="${strategies.map((s, i) => `${i ? 'L' : 'M'} ${X(s.n)} ${Y(s[key])}`).join(' ')}"/>`;
    for (const s of strategies) svg += `<circle cx="${X(s.n)}" cy="${Y(s[key])}" r="${s.n === rules.maxStones ? 6 : 4}" fill="${color}" tabindex="0"><title>${s.n} stones: average ${money(s.expectedCost, 3)}, P95 ${money(s.p95, 3)}, success per attempt ${pct(s.p)}</title></circle>`;
  }
  const ticks = W < 550 ? [1, rules.maxStones/2, rules.maxStones] : strategies.map(s => s.n);
  for (const n of ticks) svg += `<text x="${X(n)}" y="${H-28}" text-anchor="middle">${n}</text>`;
  svg += `<text x="${W/2}" y="${H-4}" text-anchor="middle">Stones per attempt · total cost in b mesos</text></svg>`;
  $('efficiencyChart').innerHTML = svg;
  $('efficiencyNote').textContent = `The average stays at ${money(recommended.expectedCost, 2)} for every amount. ${rules.maxStones} stones also has zero spread. ${state.type === 'faith' ? '19 Faith has a lower P95 because 95% of attempts succeed immediately; its 5% retry risk keeps the average unchanged.' : 'Some smaller amounts have cheaper lucky outcomes; their retry tails keep the average unchanged.'}`;
}
function cdfChart() {
  const G = result.recommended.expectedCost, W = chartSize('cdfChart'), H = 300;
  const left = 60, right = 24, top = 20, bottom = 52, xmax = G * 3;
  const X = v => left + v/xmax*(W-left-right), Y = p => H-bottom-p*(H-top-bottom);
  let svg = frame('Probability of finishing within a total spending amount for four automatically compared strategies', W, H);
  for (const p of [0,.25,.5,.75,1]) svg += `<line class="grid" x1="${left}" x2="${W-right}" y1="${Y(p)}" y2="${Y(p)}"/><text x="${left-8}" y="${Y(p)+4}" text-anchor="end">${pct(p,0)}</text>`;
  for (let i=0;i<=3;i++) svg += `<text x="${X(i*G)}" y="${H-28}" text-anchor="${i===3?'end':'middle'}">${money(i*G,1)}</text>`;
  // Draw guarantee last so its 100% jump remains visible.
  for (const s of [...result.comparisons].reverse()) {
    const index = result.comparisons.indexOf(s);
    let d = `M ${X(0)} ${Y(0)}`;
    for (let k=1;k<=Math.floor(xmax/s.attemptCost+1e-12);k++) {
      d += ` H ${X(k*s.attemptCost)} V ${Y(successWithin(state.type,s.n,k))}`;
      if (s.p===1) break;
    }
    svg += `<path class="line" stroke="${PALETTE[index]}" d="${d} H ${X(xmax)}"><title>${s.n} stones per attempt</title></path>`;
  }
  svg += `<text x="${W/2}" y="${H-3}" text-anchor="middle">Total spending available · billions of mesos</text></svg>`;
  $('cdfChart').innerHTML = svg;
  $('cdfLegend').innerHTML = legend();
}
function render() {
  result = analyze(state.type, state.price);
  const { rules: r, recommended: best, strategies } = result, M = r.maxStones, G = best.expectedCost;
  $('feeNote').textContent = `Fee: +${money(r.feePerStone)} per stone · included automatically · level ${r.from} → ${r.to} only`;
  $('priceNote').textContent = state.type === 'life' ? 'Enter your Life price. The price field is retained when switching types; no Life market sample was supplied.' : 'Faith screenshot reference: roughly 12b per stone. Enter your actual purchase price.';
  $('averageVerdict').textContent = `All 1–${M} amounts tie on average.`;
  $('averageExplanation').textContent = `Every amount averages ${money(G, 3)} to finish. Use ${M} ${r.name} together if you want to lock in that cost with 100% success.`;
  $('bestAverage').textContent = money(G, 3);
  $('averageBreakdown').textContent = `${money(M*state.price, 3)} in stones + ${money(M*r.feePerStone)} in fees`;
  $('bestBatch').innerHTML = `${M} <em>per attempt</em>`;
  $('bestPercentiles').textContent = money(G, 3);
  $('tieExplanation').textContent = `All amounts from 1 to ${M} tie at ${money(G, 3)} on average when repeated until success. The full amount wins the tie on certainty: no retry, no overspend. Changing the price changes the total, not the recommended amount.`;
  $('riskAlternativeTitle').textContent = `Prefer a chance to finish cheaper? ${M-1} ${r.name} gives ${pct((M-1)/M)}.`;
  const near = strategies[M-2];
  $('riskAlternative').textContent = `${pct(near.p)} finish for ${money(near.attemptCost,3)} on the first try. The remaining ${pct(1-near.p)} spend at least ${money(2*near.attemptCost,3)} if they continue with the same amount. Its average is still ${money(G,3)}. This is a tradeoff between frequent savings and occasional bigger bills.`;
  $('policyFrom').textContent = `Level ${r.from}`;
  $('policyTo').textContent = `Level ${r.to}`;
  $('policyAction').textContent = `${M} ${r.name} · 100% success`;
  $('stoneMeter').style.gridTemplateColumns = `repeat(${M},1fr)`;
  $('stoneMeter').innerHTML = '<span class="on"></span>'.repeat(M);
  $('formula').innerHTML = `Cost per try = n × (${money(state.price,3)} + ${money(r.feePerStone)})<br>Success per try = n / ${M}<br>Average = cost ÷ success = ${money(G,3)}`;
  $('formulaExplanation').textContent = `The amount n cancels out. Every strategy averages ${M} ${r.name} and ${money(M*r.feePerStone)} in fees per completed upgrade.`;
  $('splitComparison').innerHTML = [[1,M],[2,M/2],[M,1]].map(([tries,n]) => `<div><b>${tries} × ${n} stones</b><strong>${pct(successWithin(state.type,n,tries))}</strong><span>Within ${M} stones spent</span></div>`).join('');
  $('strategyTable').innerHTML = strategies.map(s => `<tr class="${s.n===M?'guarantee':''}"><td>${s.n}${s.n===M?' · recommended':''}</td><td>${pct(s.p)}</td><td>${money(s.attemptCost,3)}</td><td>${money(s.expectedCost,3)}</td><td>${money(s.median,3)}</td><td>${money(s.p95,3)}</td><td>${money(s.p99,3)}</td><td>${pct(1-s.budgetSuccess)}</td></tr>`).join('');
  const budgets = [.5,1,1.5,2].map(mult => G*mult);
  $('probabilityCaption').textContent = 'P(total cost ≤ amount) when retrying until success';
  $('probabilityHead').innerHTML = `<tr><th>Stones / attempt</th>${budgets.map(b=>`<th>≤ ${money(b,3)}</th>`).join('')}</tr>`;
  $('probabilityTable').innerHTML = result.comparisons.map(s=>`<tr class="${s.n===M?'guarantee':''}"><td>${s.n}${s.n===M?' · recommended':''}</td>${budgets.map(b=>{const t=strategy(state.type,s.n,state.price,b);return `<td>${pct(t.budgetSuccess,2,t.p<1&&t.budgetAttempts>0)}</td>`;}).join('')}</tr>`).join('');
  efficiencyChart(); cdfChart();
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

function updateInputs() {
  const price = $('price').valueAsNumber;
  if ($('price').value === '' || !$('price').checkValidity() || !Number.isFinite(price) || !['faith','life'].includes($('type').value)) {
    $('inputError').textContent = 'Enter a price from 0 to 1,000,000b to calculate.';
    $('price').setAttribute('aria-invalid','true');
    $('results').hidden = true; $('analysisContent').hidden = true;
    simulations.reset(false);
    return;
  }
  state.type = $('type').value; state.price = price;
  $('inputError').textContent = ''; $('price').removeAttribute('aria-invalid');
  $('results').hidden = false; $('analysisContent').hidden = false;
  render(); simulations.reset();
  const url = new URL(location.href); url.searchParams.set('type',state.type); url.searchParams.set('price',state.price);
  history.replaceState(null,'',url);
}
for (const id of ['type','price']) $(id).addEventListener('input', updateInputs);
document.addEventListener('click', e=>{ const b=e.target.closest('[data-market]'); if(b){ state.market=b.dataset.market;renderMarket(); } });
$('purchaseCount').addEventListener('input',e=>{state.purchaseCount=e.target.valueAsNumber;renderPurchase();});
window.addEventListener('resize',()=>{if(!$('analysisContent').hidden){efficiencyChart();cdfChart();} if(market)renderPurchase();});
render(); simulations.reset();
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

try {
  const response=await fetch('./independent-monte-carlo.json');
  if(!response.ok)throw new Error('Audit data unavailable');
  const audit=await response.json();
  $('auditFinding').textContent=`Recorded audit: ${integer(audit.total_completed_upgrades)} completed upgrades and ${integer(audit.total_rng_draws)} random attempt rolls. Faith price: 12b; Life price: illustrative 2b. This table retains those fixed audit prices when you change the calculator inputs.`;
  $('auditTable').innerHTML=audit.results.map(r=>`<tr class="${r.batch===r.cap?'guarantee':''}"><td>${r.type==='faith'?'Faith':'Life'} · ${r.batch}</td><td>${money(r.observed_mean_b,3)}</td><td>${money(r.mean_ci95_low_b,3)}–${money(r.mean_ci95_high_b,3)}</td><td>${pct(r.below_guarantee_fraction,3)}</td><td>${pct(r.above_guarantee_fraction,3)}</td></tr>`).join('');
} catch {
  $('auditFinding').textContent='The independent audit table could not load. Use the downloadable results or simulator source links below.';
}
