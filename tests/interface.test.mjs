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
  const rewriteImports = source => source.replace(/import \{([^}]+)\} from '\.\/([^']+)';/g, (_, names, path) => `const {${names}} = window.${path.split('?')[0] === 'model.js' ? '__model' : path.split('?')[0] === 'simulation.js' ? '__simulation' : '__view'};`);
  w.eval(rewriteImports(read('simulation-view.js')).replace('export class SimulationView', 'class SimulationView') + '\nwindow.__view = { SimulationView };');
  await w.eval(`(async () => { ${rewriteImports(read('app.js'))} })()`);
  const $ = id => w.document.getElementById(id);
  const input = (id, value) => { $(id).value = String(value); $(id).dispatchEvent(new w.Event('input', { bubbles: true })); };
  const tick = () => { const item = timers.entries().next().value; if (item) { timers.delete(item[0]); item[1](); } };
  const flush = () => { let limit = 10000; while (timers.size && limit--) tick(); assert.ok(limit > 0, 'Simulation timers did not terminate.'); };
  return { dom, $, input, tick, flush, timers, w };
}

test('only type and price are inputs; both types automatically recommend the guaranteed mean-optimal amount',async()=>{
  const {dom,$,input,w}=await boot();
  try{
    assert.deepEqual([...w.document.querySelectorAll('#calculator input,#calculator select')].map(e=>e.id),['type','price']);
    assert.equal($('bestAverage').textContent,'260b');assert.match($('averageVerdict').textContent,/Use 20 Faith/);
    assert.equal($('strategyTable').children.length,20);assert.match($('tieExplanation').textContent,/All amounts from 1 to 20 tie/);
    input('price',14);assert.equal($('bestAverage').textContent,'300b');
    input('type','life');assert.match($('averageVerdict').textContent,/Use 10 Life/);
    assert.equal($('price').value,'14');assert.equal($('bestAverage').textContent,'145b');
    assert.match($('priceNote').textContent,/no Life market sample/);assert.equal($('strategyTable').children.length,10);
    assert.match($('feeNote').textContent,/0.5b/);assert.match($('feeNote').textContent,/4 → 5/);
    input('price',2);assert.equal($('bestAverage').textContent,'25b');assert.equal($('bestPercentiles').textContent,'25b');
    assert.match($('averageBreakdown').textContent,/20b in stones \+ 5b in fees/);
    assert.equal(new URL(w.location.href).searchParams.get('type'),'life');
    input('price',0);assert.equal($('bestAverage').textContent,'5b');
    input('type','faith');assert.equal($('bestAverage').textContent,'20b');
  }finally{dom.window.close();}
});
test('invalid input hides stale results, cancels simulation, and restores only valid results',async()=>{
  const {dom,$,input,flush,timers}=await boot();
  try{
    for(const invalid of ['',-1,1000001]){
      input('price',invalid);assert.ok($('inputError').textContent);assert.equal($('results').hidden,true);
      assert.equal($('analysisContent').hidden,true);assert.equal(timers.size,0);assert.equal($('watchOne').disabled,true);
      flush();input('price',12);assert.equal($('inputError').textContent,'');assert.equal($('results').hidden,false);
    }
  }finally{dom.window.close();}
});
test('four automatic single-run lanes animate and finish; changing type cancels old runs',async()=>{
  const {dom,$,input,tick,timers}=await boot();
  try{
    $('stopSimulation').click();$('watchOne').click();tick();
    assert.equal($('runLanes').children.length,4);
    assert.match($('runLanes').children[0].textContent,/20 \/ attempt · recommended.*1 attempt · 260b · level 6/s);
    $('finishOne').click();assert.equal(timers.size,0);assert.match($('runLog').textContent,/All four upgrades finished/);
    assert.ok([...$('runLanes').children].every(r=>r.textContent.includes('level 6 ✓')));
    $('watchOne').click();input('type','life');
    assert.equal($('runLanes').children.length,4);assert.match($('runLanes').textContent,/10 \/ attempt · recommended/);
    assert.doesNotMatch($('runLanes').textContent,/Failed|level 6/);
    $('stopSimulation').click();$('watchOne').click();$('finishOne').click();
    assert.ok([...$('runLanes').children].every(r=>r.textContent.includes('level 5 ✓')));
  }finally{dom.window.close();}
});
test('automatic Monte Carlo fills all comparisons, stops, restarts and clears old-type data',async()=>{
  const {dom,$,input,tick,flush,w}=await boot();
  try{
    tick();tick();assert.notEqual($('experimentCount').textContent,'0 / 50,000 per strategy');
    assert.ok($('histogramChart').querySelector('svg'));assert.ok($('runningMeanChart').querySelector('svg'));
    $('stopSimulation').click();const count=$('experimentCount').textContent;flush();assert.equal($('experimentCount').textContent,count);
    assert.match($('simulationResult').textContent,/Stopped/);
    $('simulate').click();flush();assert.equal($('experimentCount').textContent,'50,000 / 50,000 per strategy');
    assert.equal($('experimentTable').children.length,4);assert.match($('experimentTable').children[0].textContent,/260b260b260b0%100%0%/);
    input('type','life');input('price',2);assert.equal($('experimentTable').children.length,0);
    assert.equal($('histogramChart').querySelector('svg'),null);flush();
    assert.match($('experimentTable').children[0].textContent,/10 · recommended25b25b25b0%100%0%/);
    assert.match($('simulationResult').textContent,/Exact mean: 25b/);
    $('simulate').click();$('stopSimulation').click();assert.equal($('experimentTable').children.length,0);
    assert.equal($('histogramChart').querySelector('svg'),null);assert.match($('simulationResult').textContent,/Stopped before any/);
    for(const path of w.document.querySelectorAll('svg path'))assert.ok(!/NaN|undefined|Infinity/.test(path.getAttribute('d')));
    w.document.querySelector('[data-market="history"]').click();assert.equal($('marketTable').children.length,36);
    w.document.querySelector('[data-market="active"]').click();assert.equal($('marketTable').children.length,18);
    input('purchaseCount',20);assert.match($('purchaseAnswer').textContent,/259,999,696,949/);
    assert.match($('market').textContent,/Faith only/);
  }finally{dom.window.close();}
});
