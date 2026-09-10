#!/usr/bin/env python3
"""Independent fixed-seed experiment, with one explicit RNG roll per attempt.

Run: python3 research/independent-monte-carlo.py

This deliberately imports no calculator code. Every allowed batch gets exactly
1,000,000 completed upgrades. Seeds are declared before any experiment starts;
there is no early stopping, favorable-seed selection, or rerunning of outliers.
The script writes JSON (including all attempt-frequency counts) and CSV beside
itself. Costs, moments, and quantiles are calculated from simulated outcomes;
the theoretical answer is computed only afterward for comparison.
"""

from collections import Counter
import csv
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import platform
import random
import time


TRIALS_PER_BATCH = 1_000_000
SCENARIOS = (
    {"type": "faith", "cap": 20, "price_b": 12, "fee_b": 1,
     "price_context": "12b Faith scenario from the supplied active listings"},
    {"type": "life", "cap": 10, "price_b": 2, "fee_b": 0.5,
     "price_context": "Illustrative 2b input only; no Life market sample was supplied"},
)
# A complete fixed list is materialized before any rolls occur.
SEED_SCHEDULE = {
    scenario["type"]: {
        batch: 202609100000 + type_index * 1000 + batch
        for batch in range(1, scenario["cap"] + 1)
    }
    for type_index, scenario in enumerate(SCENARIOS)
}


def observed_quantile(counts, sample_size, q):
    """Left empirical quantile: first sorted observation at ceil(q * N)."""
    rank = math.ceil(q * sample_size)
    cumulative = 0
    for attempts, count in sorted(counts.items()):
        cumulative += count
        if cumulative >= rank:
            return attempts
    raise AssertionError("Frequency table does not contain the requested rank")


def experiment(scenario, batch):
    cap = scenario["cap"]
    chance = batch / cap
    seed = SEED_SCHEDULE[scenario["type"]][batch]
    rng = random.Random(seed)
    counts = Counter()

    # Even a guaranteed attempt gets a real random draw and completion count.
    # This is ordinary Bernoulli trial simulation, not inverse-CDF sampling.
    for _ in range(TRIALS_PER_BATCH):
        attempts = 1
        while rng.random() >= chance:
            attempts += 1
        counts[attempts] += 1

    sample_size = sum(counts.values())
    assert sample_size == TRIALS_PER_BATCH
    total_attempts = sum(attempts * count for attempts, count in counts.items())
    squared_attempts = sum(attempts * attempts * count for attempts, count in counts.items())
    # Currency is accumulated as exact integer mesos before conversion to b.
    attempt_cost_mesos = int(batch * (scenario["price_b"] + scenario["fee_b"]) * 1_000_000_000)
    total_spend_mesos = total_attempts * attempt_cost_mesos
    sample_mean_b = total_spend_mesos / sample_size / 1_000_000_000
    # Exact integer numerator avoids subtraction of near-equal floating values.
    attempts_variance = (
        sample_size * squared_attempts - total_attempts * total_attempts
    ) / (sample_size * (sample_size - 1))
    attempt_cost_b = attempt_cost_mesos / 1_000_000_000
    sample_sd_b = math.sqrt(attempts_variance) * attempt_cost_b
    mean_standard_error_b = sample_sd_b / math.sqrt(sample_size)
    below = sum(count for attempts, count in counts.items() if attempts * batch < cap)
    equal = sum(count for attempts, count in counts.items() if attempts * batch == cap)
    above = sum(count for attempts, count in counts.items() if attempts * batch > cap)
    assert below + equal + above == sample_size

    result = {
        "type": scenario["type"],
        "batch": batch,
        "cap": cap,
        "price_b": scenario["price_b"],
        "fee_per_stone_b": scenario["fee_b"],
        "seed": seed,
        "completed_upgrades": sample_size,
        "rng_draws": total_attempts,
        "successes": sample_size,
        "failures": total_attempts - sample_size,
        "success_chance_per_attempt": chance,
        "attempt_cost_b": attempt_cost_b,
        "observed_mean_b": sample_mean_b,
        "observed_sample_sd_b": sample_sd_b,
        "mean_standard_error_b": mean_standard_error_b,
        "mean_ci95_low_b": sample_mean_b - 1.959963984540054 * mean_standard_error_b,
        "mean_ci95_high_b": sample_mean_b + 1.959963984540054 * mean_standard_error_b,
        "observed_median_b": observed_quantile(counts, sample_size, 0.50) * attempt_cost_b,
        "observed_p95_b": observed_quantile(counts, sample_size, 0.95) * attempt_cost_b,
        "observed_p99_b": observed_quantile(counts, sample_size, 0.99) * attempt_cost_b,
        "observed_max_b": max(counts) * attempt_cost_b,
        "below_guarantee_count": below,
        "equal_guarantee_count": equal,
        "above_guarantee_count": above,
        "below_guarantee_fraction": below / sample_size,
        "equal_guarantee_fraction": equal / sample_size,
        "above_guarantee_fraction": above / sample_size,
        "attempt_frequency": {str(attempts): counts[attempts] for attempts in sorted(counts)},
    }

    # Analytical comparisons are kept separate from the simulated observations.
    analytic_mean_b = cap * (scenario["price_b"] + scenario["fee_b"])
    analytic_sd_b = analytic_mean_b * math.sqrt(1 - chance)
    result.update({
        "analytic_mean_b": analytic_mean_b,
        "analytic_sd_b": analytic_sd_b,
        "sample_mean_minus_analytic_b": sample_mean_b - analytic_mean_b,
        "mean_error_in_sample_standard_errors": (
            (sample_mean_b - analytic_mean_b) / mean_standard_error_b
            if mean_standard_error_b else None
        ),
    })
    return result


def main():
    output_dir = Path(__file__).resolve().parent
    started = datetime.now(timezone.utc)
    clock_start = time.perf_counter()
    rows = []
    for scenario in SCENARIOS:
        for batch in range(1, scenario["cap"] + 1):
            row = experiment(scenario, batch)
            rows.append(row)
            print(
                f'{row["type"]:5s} {batch:2d}/{row["cap"]}: '
                f'mean {row["observed_mean_b"]:.6f}b; '
                f'95% CI [{row["mean_ci95_low_b"]:.6f}, {row["mean_ci95_high_b"]:.6f}]b; '
                f'{row["rng_draws"]:,} actual rolls',
                flush=True,
            )

    artifact = {
        "schema_version": 1,
        "started_at_utc": started.isoformat(),
        "completed_at_utc": datetime.now(timezone.utc).isoformat(),
        "elapsed_seconds": time.perf_counter() - clock_start,
        "python_version": platform.python_version(),
        "rng": "Python stdlib random.Random (Mersenne Twister), random() < n / cap per attempt",
        "script_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "trials_per_batch": TRIALS_PER_BATCH,
        "total_completed_upgrades": sum(row["completed_upgrades"] for row in rows),
        "total_rng_draws": sum(row["rng_draws"] for row in rows),
        "seed_schedule_predeclared": SEED_SCHEDULE,
        "scenarios": SCENARIOS,
        "assumptions": [
            "Every attempt consumes all stones and the per-stone meso fee, including failures.",
            "A failed attempt leaves the ring at its prior eligible level.",
            "Trials are independent with no pity or hidden changing probability.",
            "Each experiment repeats its fixed batch until success with no budget censoring.",
            "Price per stone is fixed: finite listing depth and future price changes are not modeled.",
        ],
        "interpretation": [
            "95% confidence intervals describe uncertainty in the estimated mean, not a 95% player spending limit.",
            "Reported P95/P99 are empirical spending quantiles, computed directly from the completed-upgrade samples.",
            "All legal batch sizes have the same analytical mean in each scenario; simulated mean rankings are sampling noise.",
            "Selecting the lowest sample mean after comparing many batches creates a winner's-curse bias.",
            "Each mean confidence interval is pointwise. They are not a simultaneous 95% interval family across all 30 batches.",
            "Discrete quantiles can jump by a whole attempt when the population CDF is exactly at a percentile boundary (Faith 19 at P95).",
            "A finite sample maximum is not a worst-case spending bound. Every sub-guarantee batch has an unbounded retry tail.",
            "Maximal batches minimize variance and guarantee success; they do not uniquely minimize expected cost.",
        ],
        "results": rows,
    }
    json_path = output_dir / "independent-monte-carlo.json"
    csv_path = output_dir / "independent-monte-carlo.csv"
    json_path.write_text(json.dumps(artifact, indent=2) + "\n")
    columns = [key for key in rows[0] if key != "attempt_frequency"]
    with csv_path.open("w", newline="") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=columns)
        writer.writeheader()
        writer.writerows({key: row[key] for key in columns} for row in rows)
    print(
        f'Finished {artifact["total_completed_upgrades"]:,} completed upgrades '
        f'and {artifact["total_rng_draws"]:,} actual rolls '
        f'in {artifact["elapsed_seconds"]:.2f}s. Wrote {json_path.name} and {csv_path.name}.',
        flush=True,
    )


if __name__ == "__main__":
    main()
