import { createUpgrade, advanceUpgrade, UpgradeExperiment } from './simulation.js';
import { seededRandom, formatProbability } from './model.js';

const $ = id => document.getElementById(id);
const money = (n, digits = 1) => `${n.toLocaleString('en-US', { maximumFractionDigits: digits })}b`;
const count = n => n.toLocaleString('en-US');
const svgOpen = (label, width) => `<svg viewBox="0 0 ${width} 270" role="img" aria-label="${label}"><title>${label}</title>`;

export class SimulationView {
  constructor(settings) {
    this.settings = settings;
    this.seed = 2712026;
    this.oneTimer = null;
    this.manyTimer = null;
    this.run = null;
    this.experiment = null;
    $('watchOne').addEventListener('click', () => this.watchOne());
    $('finishOne').addEventListener('click', () => this.finishOne());
    $('simulate').addEventListener('click', () => this.startMany());
    $('stopSimulation').addEventListener('click', () => this.stopMany());
    window.addEventListener('resize', () => { if (this.experiment?.completed) this.renderMany(); });
  }
  stopTimers() {
    clearTimeout(this.oneTimer); clearTimeout(this.manyTimer);
    this.oneTimer = this.manyTimer = null;
  }
  setValid(valid) {
    if (!valid) this.stopTimers();
    $('watchOne').disabled = !valid;
    $('simulate').disabled = !valid;
    $('finishOne').disabled = !valid || !this.run || this.run.success || this.oneTimer === null;
    $('stopSimulation').disabled = !valid || this.manyTimer === null;
  }
  reset() {
    this.stopTimers();
    this.run = null; this.experiment = null;
    const { price, batch, trials } = this.settings();
    const mean = 20 * (price + 1);
    $('oneSettings').textContent = `${batch} stones per attempt · ${money(batch * (price + 1), 2)} each try · ${formatProbability(batch / 20)} success`;
    $('guaranteeReference').textContent = money(mean, 2);
    $('runStatus').textContent = 'Level 5';
    $('runStatus').classList.remove('success');
    $('runAttempts').textContent = '0'; $('runStones').textContent = '0'; $('runCost').textContent = '0b';
    $('runCostProgress').style.width = '0%'; $('runCostProgress').classList.remove('over');
    $('attemptTrack').innerHTML = '<span class="small">Start a run to see each failed attempt and the final success.</span>';
    $('runLog').textContent = 'The colored bar compares this run’s spending with a guaranteed 20-stone attempt.';
    $('watchOne').textContent = '▶ Simulate one upgrade'; $('finishOne').disabled = true;
    $('simulate').textContent = `▶ Simulate ${count(trials)} upgrades`; $('stopSimulation').disabled = true;
    $('experimentCount').textContent = `0 / ${count(trials)}`;
    $('experimentMean').textContent = '—'; $('experimentP95').textContent = '—';
    $('experimentExact').textContent = money(mean, 2); $('experimentProgress').style.width = '0%';
    $('histogramChart').innerHTML = '<p class="chart-empty">Run a simulation to build the cost distribution.</p>';
    $('runningMeanChart').innerHTML = '<p class="chart-empty">The running average appears here as the simulation progresses.</p>';
    $('outcomeShares').textContent = '';
    $('simulationResult').textContent = 'A smaller simulated average in one experiment is random variation. It does not make that batch cheaper on average.';
  }
  watchOne() {
    clearTimeout(this.oneTimer);
    const { batch, price } = this.settings();
    this.run = createUpgrade(batch, price);
    this.oneRandom = seededRandom(++this.seed);
    $('finishOne').disabled = false;
    $('watchOne').textContent = '↻ Restart upgrade';
    this.renderOne();
    const step = () => {
      advanceUpgrade(this.run, this.oneRandom);
      this.renderOne();
      if (!this.run.success) this.oneTimer = setTimeout(step, Number($('speed').value));
      else this.oneTimer = null;
    };
    if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) this.finishOne();
    else this.oneTimer = setTimeout(step, Number($('speed').value));
  }
  finishOne() {
    clearTimeout(this.oneTimer); this.oneTimer = null;
    if (!this.run || this.run.success) return;
    while (!this.run.success) advanceUpgrade(this.run, this.oneRandom);
    this.renderOne();
  }
  renderOne() {
    const r = this.run, guaranteed = 20 * (r.price + 1);
    $('runAttempts').textContent = count(r.attempts);
    $('runStones').textContent = count(r.stones);
    $('runCost').textContent = money(r.cost, 2);
    $('runStatus').textContent = r.success ? 'Level 6 · success' : 'Level 5';
    $('runStatus').classList.toggle('success', r.success);
    $('runCostProgress').style.width = `${Math.min(100, r.cost / guaranteed * 100)}%`;
    $('runCostProgress').classList.toggle('over', r.cost > guaranteed + 1e-9);
    const displayed = r.outcomes.slice(-40), offset = r.outcomes.length - displayed.length;
    $('attemptTrack').innerHTML = (offset ? `<span class="small earlier-attempts">${offset} earlier failed attempts<br>All costs included</span>` : '') + displayed.map((success, i) => `<div class="attempt-chip ${success ? 'success' : 'failure'}"><span>Attempt ${offset + i + 1}</span><strong>${success ? '✓ Success' : '× Failed'}</strong><span>${money((offset + i + 1) * r.attemptCost)} total</span></div>`).join('');
    if (!r.attempts) $('attemptTrack').innerHTML = '<span class="small">Polishing…</span>';
    $('attemptTrack').scrollLeft = $('attemptTrack').scrollWidth;
    const difference = r.cost - guaranteed;
    const comparison = Math.abs(difference) < 1e-9 ? 'exactly the guaranteed cost' : `${money(Math.abs(difference), 2)} ${difference < 0 ? 'less' : 'more'} than the 20-stone guarantee`;
    $('runLog').textContent = r.success
      ? `Level 6 reached in ${count(r.attempts)} attempt${r.attempts === 1 ? '' : 's'} for ${money(r.cost, 2)}: ${comparison}. One run can be lucky or unlucky; the exact average remains ${money(guaranteed, 2)}.`
      : r.attempts ? `Attempt ${r.attempts} failed. Paid ${money(r.attemptCost, 2)}; running total ${money(r.cost, 2)}. Retrying with the same ${formatProbability(r.batch / 20)} chance.${difference > 1e-9 ? ` Already ${money(difference, 2)} over the guaranteed cost.` : ''}` : 'Preparing the first attempt.';
    $('finishOne').disabled = r.success;
    if (r.success) $('watchOne').textContent = '↻ Simulate another upgrade';
  }
  startMany() {
    clearTimeout(this.manyTimer);
    const { batch, price, trials } = this.settings();
    this.experiment = new UpgradeExperiment(batch, price, trials, ++this.seed);
    $('simulate').textContent = '↻ Restart simulation';
    $('stopSimulation').disabled = false;
    $('simulationResult').textContent = `Simulating ${count(trials)} complete upgrades using ${batch} stones per attempt…`;
    this.renderMany();
    const chunk = () => {
      this.experiment.advance(Math.max(100, Math.ceil(trials / 80)));
      this.renderMany();
      if (!this.experiment.finished) this.manyTimer = setTimeout(chunk, 24);
      else {
        this.manyTimer = null;
        this.finishMany(false);
      }
    };
    this.manyTimer = setTimeout(chunk, 0);
  }
  stopMany() {
    clearTimeout(this.manyTimer); this.manyTimer = null;
    if (this.experiment) this.finishMany(true);
  }
  finishMany(stopped) {
    const e = this.experiment;
    $('stopSimulation').disabled = true;
    $('simulate').textContent = `↻ Simulate another ${count(e.target)}`;
    if (!e.completed) {
      $('simulationResult').textContent = 'Stopped before any upgrades completed.';
      return;
    }
    $('simulationResult').textContent = `${stopped ? 'Stopped after' : 'Finished'} ${count(e.completed)} completed upgrades. Sample mean ${money(e.mean, 2)} versus exact ${money(e.exactMean, 2)}. Approximate 95% interval for simulation mean noise: ${money(Math.max(0, e.mean - 1.96 * e.standardError), 2)} to ${money(e.mean + 1.96 * e.standardError, 2)}. Every unlucky outcome is included. Seed ${e.seed}; each new simulation uses a new seed.`;
  }
  renderMany() {
    const e = this.experiment;
    $('experimentCount').textContent = `${count(e.completed)} / ${count(e.target)}`;
    $('experimentMean').textContent = e.completed ? money(e.mean, 2) : '—';
    $('experimentP95').textContent = e.completed ? money(e.quantile(.95), 2) : '—';
    $('experimentProgress').style.width = `${e.completed / e.target * 100}%`;
    if (!e.completed) {
      $('histogramChart').innerHTML = '<p class="chart-empty">No completed upgrades yet.</p>';
      $('runningMeanChart').innerHTML = '<p class="chart-empty">No completed upgrades yet.</p>';
      $('outcomeShares').textContent = '';
      return;
    }
    $('outcomeShares').innerHTML = `<span><b>${formatProbability(e.below / e.completed)}</b> spent less than 20 at once</span><span><b>${formatProbability(e.equal / e.completed)}</b> spent the same</span><span><b>${formatProbability(e.above / e.completed)}</b> spent more</span>`;
    this.drawHistogram(); this.drawMean();
  }
  drawHistogram() {
    const e = this.experiment, bins = e.histogram(24);
    const left = 56, right = 18, top = 22, bottom = 224;
    const W = Math.max(320, $('histogramChart').clientWidth || 640);
    const ymax = Math.min(1, Math.max(.05, ...bins.map(b => b.count / e.completed)) * 1.1);
    const Y = v => bottom - v / ymax * (bottom - top), slot = (W - left - right) / bins.length;
    let svg = svgOpen('Histogram of total costs for simulated completed upgrades, including all outcomes', W);
    for (let i = 0; i <= 4; i++) {
      const v = ymax * i / 4;
      svg += `<line class="grid" x1="${left}" x2="${W-right}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${left-8}" y="${Y(v)+5}" text-anchor="end">${formatProbability(v, 0)}</text>`;
    }
    bins.forEach((b, i) => {
      const share = b.count / e.completed, width = Math.min(140, slot * .82), x = left + (i + .5) * slot;
      svg += `<rect x="${x - width / 2}" y="${Y(share)}" width="${width}" height="${bottom-Y(share)}" rx="2" fill="#b9a1ff"><title>${money(b.from, 2)}${b.to !== b.from ? ` to ${money(b.to, 2)}` : ''}: ${count(b.count)} upgrades (${formatProbability(share)})</title></rect>`;
      const labels = W < 480 ? [0, Math.round((bins.length - 1) / 2), bins.length - 1] : [0, Math.round((bins.length - 1) / 3), Math.round(2 * (bins.length - 1) / 3), bins.length - 1];
      if (labels.includes(i)) {
        svg += `<text x="${x}" y="249" text-anchor="middle">${money(b.from, 0)}</text>`;
      }
    });
    $('histogramChart').innerHTML = svg + `<text x="${W / 2}" y="269" text-anchor="middle">Total cost including fees</text></svg>`;
  }
  drawMean() {
    const e = this.experiment;
    const points = [...e.checkpoints];
    if (!points.length || points.at(-1).runs !== e.completed) points.push({ runs: e.completed, mean: e.mean });
    const left = 65, right = 18, top = 22, bottom = 224;
    const W = Math.max(320, $('runningMeanChart').clientWidth || 640);
    // A fixed ±50% context avoids visually exaggerating tiny sampling differences.
    const ymin = Math.min(e.exactMean * .5, ...points.map(p => p.mean * .95));
    const ymax = Math.max(e.exactMean * 1.5, ...points.map(p => p.mean * 1.05));
    const Y = v => bottom - (v - ymin) / (ymax - ymin) * (bottom - top);
    const X = v => left + v / e.target * (W - left - right);
    let svg = svgOpen('Running sample mean in trial order compared with the exact expected cost', W);
    for (let i = 0; i <= 4; i++) {
      const v = ymin + (ymax - ymin) * i / 4;
      svg += `<line class="grid" x1="${left}" x2="${W-right}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${left-8}" y="${Y(v)+5}" text-anchor="end">${money(v, 0)}</text>`;
      if (W >= 480 || i % 2 === 0) svg += `<text x="${X(e.target * i / 4)}" y="249" text-anchor="${i === 4 ? 'end' : 'middle'}">${count(e.target * i / 4)}</text>`;
    }
    const d = points.map((p, i) => `${i ? 'L' : 'M'} ${X(p.runs)} ${Y(p.mean)}`).join(' ');
    svg += `<line x1="${left}" x2="${W-right}" y1="${Y(e.exactMean)}" y2="${Y(e.exactMean)}" stroke="#74eed0" stroke-width="2" stroke-dasharray="6 5"/><path d="${d}" class="line" stroke="#b9a1ff"/><circle cx="${X(e.completed)}" cy="${Y(e.mean)}" r="4" fill="#b9a1ff"/><text x="${W / 2}" y="269" text-anchor="middle">Completed upgrades</text></svg>`;
    $('runningMeanChart').innerHTML = svg;
  }
}
