import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import * as model from '../site/model.js';
import * as simulation from '../site/simulation.js';

async function boot() {
  const read = file => fs.readFileSync(new URL(`../site/${file}`, import.meta.url), 'utf8');
  const dom = new JSDOM(read('index.html'), { url: 'https://example.test/grindstone-of-faith/', runScripts: 'outside-only' });
  const w = dom.window;
  w.__model = model; w.__simulation = simulation;
  w.fetch = async () => ({ ok: true, json: async () => JSON.parse(read('market.json')) });
  const timers = new Map(); let timerId = 0;
  w.setTimeout = fn => { const id = ++timerId; timers.set(id, fn); return id; };
  w.clearTimeout = id => timers.delete(id);
  const rewriteImports = source => source.replace(/import \{([^}]+)\} from '\.\/([^']+)';/g, (_, names, path) => `const {${names}} = window.${path === 'model.js' ? '__model' : path === 'simulation.js' ? '__simulation' : '__view'};`);
  w.eval(rewriteImports(read('simulation-view.js')).replace('export class SimulationView', 'class SimulationView') + '\nwindow.__view = { SimulationView };');
  await w.eval(`(async () => { ${rewriteImports(read('app.js'))} })()`);
  const $ = id => w.document.getElementById(id);
  const input = (id, value) => { $(id).value = String(value); $(id).dispatchEvent(new w.Event('input', { bubbles: true })); };
  const tick = () => { const item = timers.entries().next().value; if (item) { timers.delete(item[0]); item[1](); } };
  const flush = () => { let limit = 10000; while (timers.size && limit--) tick(); assert.ok(limit > 0, 'Simulation timers did not terminate.'); };
  return { dom, $, input, tick, flush, timers, w };
}

test('price-first answer exposes average ties and keeps confidence secondary', async () => {
  const { dom, $, input } = await boot();
  try {
    assert.equal($('bestAverage').textContent, '260b');
    assert.match($('averageVerdict').textContent, /All 1–20 batch sizes tie/);
    input('price', 14); assert.equal($('bestAverage').textContent, '300b');
    for (const n of [1, 5, 10, 19, 20]) {
      input('batch', n); assert.equal($('bestAverage').textContent, '300b');
      assert.match($('selectedSummary').textContent, new RegExp(`^${n} `));
    }
    input('confidence', 95); assert.match($('targetAnswer').textContent, /19 stones/);
    assert.equal($('bestAverage').textContent, '300b');
    input('price', 0); assert.equal($('bestAverage').textContent, '20b');
    input('batch', 0); assert.ok($('inputError').textContent);
    assert.equal($('simulate').disabled, true); assert.equal($('watchOne').disabled, true);
    input('batch', 5); assert.equal($('inputError').textContent, '');
    input('price', 12); input('budget', 988); input('batch', 19);
    assert.equal($('budgetChance').textContent, '>99.99%');
  } finally { dom.window.close(); }
});

test('single upgrade animates, finishes instantly, and changing inputs cancels pending taps', async () => {
  const { dom, $, input, tick, flush, timers } = await boot();
  try {
    input('batch', 20); $('watchOne').click(); assert.equal($('runAttempts').textContent, '0');
    tick(); assert.equal($('runAttempts').textContent, '1');
    assert.equal($('runCost').textContent, '260b'); assert.match($('runStatus').textContent, /Level 6/);
    assert.equal(timers.size, 0);
    input('batch', 1); $('watchOne').click(); $('finishOne').click();
    assert.match($('runStatus').textContent, /Level 6/); assert.equal(timers.size, 0);
    assert.equal(Number($('runStones').textContent), Number($('runAttempts').textContent));
    $('watchOne').click(); assert.equal(timers.size, 1);
    input('price', 14); assert.equal(timers.size, 0); flush();
    assert.equal($('runAttempts').textContent, '0'); assert.equal($('runCost').textContent, '0b');
    assert.equal($('guaranteeReference').textContent, '300b');
  } finally { dom.window.close(); }
});

test('many-upgrade charts update progressively, include all runs, stop and reset without stale callbacks', async () => {
  const { dom, $, input, tick, flush, timers, w } = await boot();
  try {
    input('trials', 10000); $('simulate').click(); tick();
    assert.notEqual($('experimentCount').textContent, '0 / 10,000');
    assert.ok($('histogramChart').querySelector('svg')); assert.ok($('runningMeanChart').querySelector('svg'));
    $('stopSimulation').click(); const stopped = $('experimentCount').textContent;
    flush(); assert.equal($('experimentCount').textContent, stopped); assert.match($('simulationResult').textContent, /Stopped/);
    $('simulate').click(); tick(); input('price', 14);
    assert.equal(timers.size, 0); flush(); assert.equal($('experimentCount').textContent, '0 / 10,000');
    input('batch', 20); $('simulate').click(); flush();
    assert.equal($('experimentCount').textContent, '10,000 / 10,000');
    assert.equal($('experimentMean').textContent, '300b'); assert.equal($('experimentP95').textContent, '300b');
    assert.match($('outcomeShares').textContent, /100% spent the same/);
    assert.match($('simulationResult').textContent, /Finished 10,000/);
    const previousSeed = $('simulationResult').textContent.match(/Seed (\d+)/)[1];
    $('simulate').click(); flush(); assert.notEqual($('simulationResult').textContent.match(/Seed (\d+)/)[1], previousSeed);
    $('simulate').click(); $('stopSimulation').click();
    assert.equal($('histogramChart').querySelector('svg'), null);
    assert.equal($('runningMeanChart').querySelector('svg'), null);
    assert.equal($('outcomeShares').textContent, '');
    assert.match($('simulationResult').textContent, /Stopped before any/);
    input('batch', 1); $('simulate').click(); flush();
    assert.equal($('experimentCount').textContent, '10,000 / 10,000');
    for (const path of w.document.querySelectorAll('svg path')) assert.ok(!/NaN|undefined|Infinity/.test(path.getAttribute('d')));
    w.document.querySelector('[data-market="history"]').click(); assert.equal($('marketTable').children.length, 36);
    w.document.querySelector('[data-market="active"]').click(); assert.equal($('marketTable').children.length, 18);
    input('purchaseCount', 20); assert.match($('purchaseAnswer').textContent, /259,999,696,949/);
  } finally { dom.window.close(); }
});
