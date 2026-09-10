#!/usr/bin/env python3
"""Exact analysis conditional on verified GMS Faith n/20 success and per-stone fee.

No network; Fraction is used for finite strategies and optimization. Prices in mesos.
Run: python3 statistics-verification.py
"""
from fractions import Fraction
from functools import lru_cache
from math import ceil, log1p, sqrt, isclose
import json
import subprocess
from pathlib import Path

N = 20
BILLION = 10**9

def quantile_attempts(n, confidence):
    if not (1 <= n <= N and 0 < confidence <= 1):
        raise ValueError('n must be 1..20; confidence must be (0, 1]')
    if n == N:
        return 1
    if confidence == 1:
        return float('inf')
    # Correct candidate using Fraction so exact thresholds such as 95% at n=19
    # do not accidentally require an extra attempt through floating rounding.
    q = Fraction(str(confidence))
    r = Fraction(N-n, N)
    k = max(1, ceil(log1p(-confidence) / log1p(-n/N)))
    while k > 1 and 1-r**(k-1) >= q:
        k -= 1
    while 1-r**k < q:
        k += 1
    return k

def finite_plan(batch_sizes, per_stone_cost=13*BILLION):
    """Stop on first success; stop without success after the final listed batch."""
    survive, expected, maximum = Fraction(1), Fraction(0), 0
    for n in batch_sizes:
        if not 1 <= n <= N:
            raise ValueError('batch must be 1..20')
        if survive == 0:
            break
        cost = n * per_stone_cost
        expected += survive * cost
        maximum += cost
        survive *= Fraction(N-n, N)
    return {'success': 1-survive, 'expected': expected, 'maximum': maximum}

def exact_optimizer(marginal_costs, confidence):
    """Minimize expected spend for deterministic stop-on-success plans.

    marginal_costs is a finite purchase ladder INCLUDING per-stone fee; its full
    sum is the hard budget. Stones are bought in ascending prefix order just in
    time. All listed stock must be available at the modeled price when needed.
    Priority: expected spend, then hard maximum spend, then number of batches.
    Finite stock means this never assumes unobserved infinite supply.
    """
    target_failure = 1-Fraction(str(confidence))
    if not 0 <= target_failure < 1:
        raise ValueError('confidence must be (0,1]')
    if any(c < 0 for c in marginal_costs):
        raise ValueError('negative costs unsupported')
    prefix = [0]
    for c in marginal_costs:
        prefix.append(prefix[-1]+c)
    capacity = len(marginal_costs)

    @lru_cache(None)
    def solve(used, failure_allowance):
        if failure_allowance >= 1:
            return (Fraction(0), 0, ())
        available = capacity-used
        # At most available/20 success is attainable when fewer than20 remain.
        if available == 0 or failure_allowance < max(Fraction(0), 1-Fraction(available,N)):
            return None
        best = None
        for n in range(min(N, available), 0, -1):
            block = prefix[used+n]-prefix[used]
            r = Fraction(N-n,N)
            if r == 0:
                candidate = (Fraction(block), block, (n,))
            else:
                tail = solve(used+n, failure_allowance/r)
                if tail is None:
                    continue
                candidate = (block+r*tail[0], block+tail[1], (n,)+tail[2])
            key = lambda x: (x[0], x[1], len(x[2]), tuple(-n for n in x[2]))
            if best is None or key(candidate) < key(best):
                best = candidate
        return best

    result = solve(0,target_failure)
    if result is None:
        return None
    expected, maximum, batches = result
    success = 1
    for n in batches:
        success *= Fraction(N-n,N)
    return {'batches':batches, 'success':1-success, 'expected':expected,
            'maximum':maximum, 'states':solve.cache_info().currsize}


def verify():
    # Independent exact dynamic program for best success under a total-stone cap.
    confidence = [Fraction(0)]
    for capacity in range(1, 81):
        confidence.append(max(Fraction(n,N)+Fraction(N-n,N)*confidence[capacity-n]
                              for n in range(1,min(N,capacity)+1)))
        assert confidence[-1] == min(Fraction(capacity,N), Fraction(1))

    # Enumerate every plan with exactly <=12 total stones (all compositions).
    # Check the fundamental cost/success identity, and same-budget splitting bound.
    plans_checked = 0
    def visit(plan, capacity):
        nonlocal plans_checked
        if plan:
            result = finite_plan(plan)
            assert result['expected'] == N*13*BILLION*result['success']
            assert result['success'] <= Fraction(sum(plan),N)
            plans_checked += 1
        for n in range(1, capacity+1):
            visit(plan+(n,),capacity-n)
    visit((),12)
    assert quantile_attempts(19,.95) == 1
    assert quantile_attempts(18,.99) == 2
    assert quantile_attempts(1,.95) == 59
    assert quantile_attempts(1,1) == float('inf')
    assert quantile_attempts(20,1) == 1

    optimizer_results = []
    for capacity,q in [(19,.95),(20,.91),(20,.99),(35,.99),(20,1)]:
        result = exact_optimizer([13*BILLION]*capacity,q)
        assert result is not None
        assert result['success'] >= Fraction(str(q))
        assert result['expected'] == N*13*BILLION*result['success']
        assert result['maximum'] <= capacity*13*BILLION
        optimizer_results.append({'stone_capacity':capacity,'target':q,**result})
    assert optimizer_results[0]['batches'] == (19,)
    assert optimizer_results[1]['expected'] == Fraction(182,10)*13*BILLION
    assert optimizer_results[2]['batches'] == (20,)
    assert optimizer_results[3]['expected'] == Fraction(198,10)*13*BILLION
    assert optimizer_results[4]['batches'] == (20,)
    # Rising cost ladder: a guaranteed20 is no more expensive than any tested
    # adaptive guaranteed plan (one initial batch then a guaranteed20 fallback).
    ladder = [13*BILLION]*20+[15*BILLION]*20
    for first in range(1,20):
        cost = first*13*BILLION + Fraction(20-first,20)*sum(ladder[first:first+20])
        assert cost >= sum(ladder[:20])
    return plans_checked, optimizer_results

def verify_current_types():
    """Compare the production JavaScript against exact fractions for both types."""
    script = """import { analyze } from './site/model.js';
    console.log(JSON.stringify(['faith','life'].map(type => {
      const price = type === 'faith' ? 12 : 2;
      return { type, price, ...analyze(type,price) };
    })));"""
    actual = json.loads(subprocess.check_output(
        ['node', '--input-type=module', '-e', script],
        cwd=Path(__file__).resolve().parent.parent, text=True))
    records = []
    for scenario in actual:
        maximum = 20 if scenario['type'] == 'faith' else 10
        fee = Fraction(1) if maximum == 20 else Fraction(1,2)
        price = Fraction(scenario['price'])
        total = maximum * (price + fee)
        for row in scenario['strategies']:
            n = row['n']
            p = Fraction(n, maximum)
            failure = 1-p
            cost = n*(price+fee)
            assert row['expectedCost'] == float(total)
            assert row['attemptCost'] == float(cost)
            assert isclose(row['budgetSuccess'], float(1-failure**(maximum//n)), abs_tol=1e-12)
            assert isclose(row['standardDeviation'], float(total)*sqrt(float(failure)), abs_tol=1e-10)
            for key,q in [('median',Fraction(1,2)),('p90',Fraction(9,10)),('p95',Fraction(19,20)),('p99',Fraction(99,100))]:
                k = 1
                while 1-failure**k < q:
                    k += 1
                assert row[key] == float(k*cost), (scenario['type'],n,key)
        assert scenario['recommended']['n'] == maximum
        records.append({'type':scenario['type'], 'price_b':float(price),
                        'price_context':'Faith screenshot scenario' if maximum == 20 else 'illustrative user-input scenario; no Life market sample',
                        'max_stones':maximum, 'fee_per_stone_b':float(fee),
                        'rows':scenario['strategies']})
    return records

if __name__ == '__main__':
    plans_checked, optimizer_results = verify()
    current_types = verify_current_types()
    table=[]
    for n in range(1, 21):
        r = Fraction(N-n,N)
        entry = {'batch':n,'attempt_success':n/N,'attempt_cost_b':n*13,
                 'expected_attempts':N/n,'expected_stones':N,'expected_cost_b':260,
                 'standard_deviation_cost_b':13*sqrt(400-20*n),
                 'p_success_with_260b_budget':float(1-r**(20//n))}
        for q in [.50,.90,.95,.99]:
            entry[f'p{round(q*100)}_attempts']=quantile_attempts(n,q)
            entry[f'p{round(q*100)}_cost_b']=n*13*quantile_attempts(n,q)
        table.append(entry)
    output = {'assumptions':{'stone_price_b':12,'fee_per_stone_b':1,
                            'max_batch':20,'p_success':'n / 20',
                            'consumed_on_failure':'model assumption; not explicitly described in reviewed primary notes',
                            'independent_attempts':True,
                            'no_pity':'model assumption',
                            'ring_after_failure':'assumed unchanged and eligible to retry'},
              'fixed_batch_table':table,
              'current_type_tables':current_types,
              'verification':{'all_compositions_up_to_12_stones':plans_checked,
                              'confidence_budget_dp_cap':80,'production_strategies_verified_with_fractions':30,'status':'passed'},
              'exact_optimization_examples':optimizer_results}
    def encode(x):
        if isinstance(x,Fraction):
            return {'exact':str(x),'value':float(x)}
        raise TypeError(type(x))
    dest = Path(__file__).with_name('statistics-results.json')
    dest.write_text(json.dumps(output,indent=2,default=encode)+'\n')
    print(json.dumps({'verification':output['verification'],
                      'optimizer':optimizer_results,'output':str(dest)},indent=2,default=encode))
