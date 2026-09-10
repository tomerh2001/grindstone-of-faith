import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { RULES, analyze, strategy, attemptsForConfidence, successWithin, sequenceStats, purchaseCost, formatProbability } from '../site/model.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
for(const type of ['faith','life']){
  const {maxStones:M,feePerStone:f}=RULES[type];
  test(`${type}: every legal strategy ties on mean; automatic choice guarantees at zero variance`,()=>{
    for(const price of [0,.00001,1,11.999696969,12,14,1000000]){
      const a=analyze(type,price),G=M*(price+f);
      assert.equal(a.strategies.length,M);assert.equal(a.recommended.n,M);
      assert.equal(a.recommended.p,1);assert.equal(a.recommended.standardDeviation,0);
      assert.equal(a.recommended.expectedCost,G);assert.equal(a.recommended.p99,G);
      for(const s of a.strategies){
        assert.equal(s.expectedCost,G);assert.equal(s.expectedStones,M);
        close(s.p,s.n/M);close(s.attemptCost/s.p,G);
        if(s.n<M){assert.ok(s.standardDeviation>0);assert.equal(s.worstCost,Infinity);assert.ok(s.budgetSuccess<1);}
      }
    }
  });
  test(`${type}: exact quantiles bracket their targets at whole-attempt boundaries`,()=>{
    for(let n=1;n<=M;n++)for(const q of [.5,.9,.95,.99,.999,1]){
      const k=attemptsForConfidence(type,n,q);
      if(!Number.isFinite(k)){assert.equal(q,1);assert.ok(n<M);continue;}
      assert.ok(successWithin(type,n,k)>=q-1e-12);
      assert.ok(successWithin(type,n,k-1)<q);
      const c=strategy(type,n,12).attemptCost;
      close(strategy(type,n,12,k*c).budgetSuccess,successWithin(type,n,k));
      close(strategy(type,n,12,k*c-.000001).budgetSuccess,successWithin(type,n,k-1));
    }
  });
  test(`${type}: capped and adaptive plans do not mistake unfinished upgrades for savings`,()=>{
    const G=M*(12+f);
    const guaranteed=sequenceStats(type,[M-1,M],12);
    close(guaranteed.success,1);close(guaranteed.expectedSpend,G);
    for(let a=1;a<M;a++)for(let b=1;b<M;b++){
      const plan=sequenceStats(type,[a,b],12);close(plan.expectedSpend,G*plan.success);
      if(a+b<=M)assert.ok(plan.success<(a+b)/M);
    }
  });
}
test('known Faith/Life numbers and exact edge percentiles',()=>{
  assert.equal(strategy('faith',19,12).p95,247);assert.equal(strategy('faith',19,12).p99,494);
  assert.equal(strategy('life',9,2).p99,45);assert.equal(strategy('life',9,2).p90,22.5);
  assert.equal(strategy('life',10,2).expectedCost,25);
  assert.equal(strategy('faith',20,12).expectedCost,260);
  assert.equal(attemptsForConfidence('life',9,.99),2);
  assert.equal(attemptsForConfidence('faith',19,.95),1);
  assert.equal(formatProbability(.999999),'>99.99%');
  assert.equal(formatProbability(1,2,true),'>99.99%');
  assert.equal(formatProbability(.0000001),'<0.01%');
  assert.equal(formatProbability(1),'100%');
});
test('Faith market transcription and finite supply are preserved',()=>{
  const market=JSON.parse(fs.readFileSync(new URL('../site/market.json',import.meta.url),'utf8'));
  const asks=market.rows.filter(r=>r.kind==='active_ask').map(r=>({...r,unitPriceMesos:r.unit_price_mesos}));
  assert.equal(market.rows.length,54);assert.equal(asks.length,18);
  assert.equal(asks.reduce((s,r)=>s+r.quantity,0),71);
  assert.equal(market.rows.filter(r=>r.kind==='historical_sale').reduce((s,r)=>s+r.quantity,0),39);
  for(const r of market.rows)assert.equal(r.unit_price_mesos*r.quantity,r.total_price_mesos);
  assert.equal(purchaseCost(asks,20).stoneCostMesos,239999696949);
  assert.equal(purchaseCost(asks,20).totalMesos,259999696949);
  assert.equal(purchaseCost(asks,72).missing,1);assert.equal(purchaseCost(asks,72).totalMesos,null);
});
test('invalid types, prices, amounts and probability targets fail explicitly',()=>{
  for(const type of ['unknown','__proto__',null])assert.throws(()=>analyze(type,12),RangeError);
  for(const price of [-1,NaN,Infinity])assert.throws(()=>analyze('life',price),RangeError);
  for(const n of [0,11,NaN,1.5])assert.throws(()=>strategy('life',n,12),RangeError);
  assert.throws(()=>strategy('faith',21,12),RangeError);
  assert.throws(()=>strategy('life',5,12,-1),RangeError);
  for(const q of [0,-1,1.1,NaN])assert.throws(()=>attemptsForConfidence('faith',5,q),RangeError);
});
