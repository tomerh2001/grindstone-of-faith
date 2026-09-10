import test from 'node:test';
import assert from 'node:assert/strict';
import { createUpgrade, advanceUpgrade, UpgradeExperiment } from '../site/simulation.js';
import { RULES, strategy } from '../site/model.js';
for(const type of ['faith','life']){
  const {maxStones:M}=RULES[type];
  test(`${type}: playback charges failures and stops charging at success`,()=>{
    const run=createUpgrade(type,M/2,12),rolls=[.9,.8,.1];let cursor=0;
    const random=()=>rolls[cursor++];
    advanceUpgrade(run,random);assert.equal(run.success,false);
    advanceUpgrade(run,random);advanceUpgrade(run,random);advanceUpgrade(run,random);
    assert.equal(cursor,3);assert.equal(run.attempts,3);assert.equal(run.stones,3*M/2);
    assert.equal(run.cost,run.attemptCost*3);assert.deepEqual(run.outcomes,[false,false,true]);
  });
  test(`${type}: full batch simulation has no cost spread`,()=>{
    const e=new UpgradeExperiment(type,M,12,1000).advance(10000);
    assert.equal(e.completed,1000);assert.equal(e.totalAttempts,1000);
    assert.equal(e.mean,strategy(type,M,12).expectedCost);assert.equal(e.standardError,0);
    assert.equal(e.equal,1000);assert.equal(e.below+e.above,0);
    assert.ok(e.checkpoints.every(p=>p.mean===e.mean));
  });
  test(`${type}: all strategies converge to exact means and success probabilities`,()=>{
    for(let n=1;n<=M;n++){
      const e=new UpgradeExperiment(type,n,12,100000,2026+n).advance(100000);
      const exact=strategy(type,n,12);
      assert.ok(Math.abs(e.mean-exact.expectedCost)<=6*e.standardError+1e-8);
      assert.ok(Math.abs((e.below+e.equal)/e.completed-exact.budgetSuccess)<.007);
      assert.equal(e.histogram().reduce((s,b)=>s+b.count,0),e.completed);
      assert.equal(e.below+e.equal+e.above,e.completed);
    }
  });
  test(`${type}: chunked simulation preserves chronology and all unlucky outcomes`,()=>{
    for(const n of [1,M/2,M-1,M]){
      const stepped=new UpgradeExperiment(type,n,11.99,12500,2026);
      stepped.advance(103);stepped.advance(711);stepped.advance(99999);
      const whole=new UpgradeExperiment(type,n,11.99,12500,2026).advance(12500);
      assert.equal(stepped.mean,whole.mean);assert.deepEqual(stepped.checkpoints,whole.checkpoints);
      assert.equal(stepped.checkpoints.at(-1).mean,stepped.mean);
      assert.ok(stepped.checkpoints.every((p,i,all)=>!i||all[i-1].runs<p.runs));
      const weighted=stepped.counts.reduce((s,c,i)=>s+c*i*stepped.attemptCost,0)/stepped.completed;
      assert.ok(Math.abs(weighted-stepped.mean)<1e-8);
      assert.equal(stepped.histogram().reduce((s,b)=>s+b.count,0),stepped.completed);
    }
  });
}
test('simulation inputs and zero acquisition cost',()=>{
  assert.throws(()=>new UpgradeExperiment('life',11,12),RangeError);
  assert.throws(()=>new UpgradeExperiment('faith',1,12,0),RangeError);
  assert.throws(()=>new UpgradeExperiment('faith',1,12,1e6+1),RangeError);
  assert.equal(new UpgradeExperiment('life',10,0,1).advance().mean,5);
  assert.equal(new UpgradeExperiment('faith',20,0,1).advance().mean,20);
});
