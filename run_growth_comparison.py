#!/usr/bin/env python3
"""Compare two test-case CSVs using unique test names. Outputs metrics for TEST_GROWTH_ANALYSIS."""
import csv
import sys
from collections import defaultdict
from datetime import datetime

def load_csv(path):
    rows = []
    with open(path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append((row['Domain'], row['Category'], row['Test']))
    return rows

def main():
    if len(sys.argv) >= 3:
        prev_date = sys.argv[1]  # e.g. 2026-01-28
        curr_date = sys.argv[2]  # e.g. 2026-02-13
    else:
        curr_date = datetime.now().strftime("%Y-%m-%d")
        prev_date = "2026-01-28"
    base = "/Users/bodaly/sig/tools/autotest"
    prev_file = f"{base}/test-cases-spreadsheet-{prev_date}.csv"
    curr_file = f"{base}/test-cases-spreadsheet-{curr_date}.csv"

    prev_rows = load_csv(prev_file)
    curr_rows = load_csv(curr_file)

    prev_names = set(r[2] for r in prev_rows)
    curr_names = set(r[2] for r in curr_rows)
    prev_by_name = defaultdict(set)
    curr_by_name = defaultdict(set)
    for d, c, t in prev_rows:
        prev_by_name[t].add((d, c))
    for d, c, t in curr_rows:
        curr_by_name[t].add((d, c))

    prev_domain = defaultdict(int)
    curr_domain = defaultdict(int)
    for d, c, t in prev_rows:
        prev_domain[d] += 1
    for d, c, t in curr_rows:
        curr_domain[d] += 1

    truly_added = curr_names - prev_names
    truly_removed = prev_names - curr_names
    common_names = prev_names & curr_names
    reclassified = sum(1 for n in common_names if prev_by_name[n] != curr_by_name[n])

    days = (datetime.strptime(curr_date, "%Y-%m-%d") - datetime.strptime(prev_date, "%Y-%m-%d")).days
    net = len(curr_names) - len(prev_names)
    pct = (net / len(prev_names) * 100) if prev_names else 0

    print("COMPARISON", prev_date, "->", curr_date)
    print("DAYS", days)
    print("PREV_CSV_ROWS", len(prev_rows))
    print("CURR_CSV_ROWS", len(curr_rows))
    print("PREV_UNIQUE_NAMES", len(prev_names))
    print("CURR_UNIQUE_NAMES", len(curr_names))
    print("TRULY_ADDED", len(truly_added))
    print("TRULY_REMOVED", len(truly_removed))
    print("RECLASSIFIED", reclassified)
    print("NET_GROWTH", net)
    print("GROWTH_PCT", round(pct, 1))
    print("DOMAIN_GROWTH")
    all_domains = sorted(set(prev_domain.keys()) | set(curr_domain.keys()))
    for d in all_domains:
        p, c = prev_domain.get(d, 0), curr_domain.get(d, 0)
        delta = c - p
        pct_d = (delta / p * 100) if p else 0
        print(f"  {d}|{p}|{c}|{delta}|{pct_d:.1f}")

if __name__ == "__main__":
    main()
