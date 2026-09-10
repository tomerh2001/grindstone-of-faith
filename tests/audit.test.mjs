import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

test('independent recorded simulation preserves every outcome and derives statistics from actual counts',()=>{
  const root=new URL('../',import.meta.url);
  const read=p=>fs.readFileSync(new URL(p,root));
  const audit=JSON.parse(read('research/independent-monte-carlo.json'));
  assert.equal(audit.script_sha256,crypto.createHash('sha256').update(read('research/independent-monte-carlo.py')).digest('hex'));
  for(const ext of ['json','csv','md'])assert.deepEqual(read(`site/independent-monte-carlo.${ext}`),read(`research/independent-monte-carlo.${ext}`));
  assert.equal(audit.results.length,30);
  let completed=0,draws=0;
  const unique=new Set();
  for(const r of audit.results){
    unique.add(`${r.type}/${r.batch}`);
    assert.equal(r.completed_upgrades,1000000);
    const pairs=Object.entries(r.attempt_frequency).map(([n,count])=>[Number(n),count]).sort((a,b)=>a[0]-b[0]);
    assert.ok(pairs.every(([n,count])=>Number.isInteger(n)&&n>=1&&Number.isInteger(count)&&count>0));
    const count=pairs.reduce((s,[,c])=>s+c,0),rolls=pairs.reduce((s,[n,c])=>s+n*c,0);
    assert.equal(count,r.completed_upgrades);assert.equal(rolls,r.rng_draws);
    assert.ok(Math.abs(rolls*r.attempt_cost_b/count-r.observed_mean_b)<1e-9);
    const below=pairs.filter(([n])=>n*r.batch<r.cap).reduce((s,[,c])=>s+c,0);
    const above=pairs.filter(([n])=>n*r.batch>r.cap).reduce((s,[,c])=>s+c,0);
    assert.equal(below,r.below_guarantee_count);assert.equal(above,r.above_guarantee_count);
    assert.equal(count-below-above,r.equal_guarantee_count);
    for(const [q,key] of [[.5,'observed_median_b'],[.95,'observed_p95_b'],[.99,'observed_p99_b']]){
      let cumulative=0;
      const hit=pairs.find(([,c])=>(cumulative+=c)>=Math.ceil(q*count));
      assert.equal(hit[0]*r.attempt_cost_b,r[key]);
    }
    if(r.batch===r.cap){assert.equal(pairs.length,1);assert.equal(r.mean_standard_error_b,0);}
    completed+=count;draws+=rolls;
  }
  assert.equal(unique.size,30);assert.equal(completed,30000000);
  assert.equal(completed,audit.total_completed_upgrades);assert.equal(draws,audit.total_rng_draws);
});
