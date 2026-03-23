# Test Report Generation Instructions

## Overview

This document provides step-by-step instructions for regenerating the automated test suite analysis reports from the Content Manager Client codebase.

**Source Codebase:** `/Users/bodaly/sig/tools/tmp/reformers.content-manager-client`  
**Report Output Directory:** `/Users/bodaly/sig/tools/autotest`

---

## Prerequisites

1. **Python 3** (for test case extraction script)
2. **Access to the codebase** at `/Users/bodaly/sig/tools/tmp/reformers.content-manager-client`
3. **Terminal access** with standard Unix tools (`find`, `grep`, `wc`, etc.)

---

## Step 1: Navigate to Report Directory

```bash
cd /Users/bodaly/sig/tools/autotest
```

---

## Step 2: Get Current Date/Time

Get the current timestamp for the report files:

```bash
date +"%Y-%m-%d %H:%M:%S"
```

Example output: `2026-01-12 18:41:41`

Save this timestamp - you'll need it for:

- File naming (format: `YYYY-MM-DD`)
- Internal report timestamps (format: `YYYY-MM-DD HH:MM:SS`)

---

## Step 3: Update Codebase to Latest Version

Before extracting test cases, ensure you're working with the latest code from the main branch:

```bash
cd /Users/bodaly/sig/tools/tmp/reformers.content-manager-client

# Checkout main branch (if not already on it)
git checkout main

# Pull latest changes
git pull
```

**Note:** This ensures your reports reflect the most current state of the codebase.

---

## Step 4: Extract Test Case Data

Run the Python script to extract all test cases and generate the CSV file. The script will automatically pull the latest code before extraction:

```bash
cd /Users/bodaly/sig/tools/tmp/reformers.content-manager-client && python3 << 'PYTHON_SCRIPT'
import re
import os
import csv
import subprocess
from pathlib import Path
from collections import defaultdict

# Pull latest code before extraction
CODEBASE_PATH = '/Users/bodaly/sig/tools/tmp/reformers.content-manager-client'
MAIN_BRANCH = 'main'

print("Updating codebase to latest version...")
try:
    # Checkout main branch
    subprocess.run(['git', 'checkout', MAIN_BRANCH], cwd=CODEBASE_PATH, check=False, capture_output=True)
    # Pull latest changes
    result = subprocess.run(['git', 'pull'], cwd=CODEBASE_PATH, capture_output=True, text=True)
    if result.returncode == 0:
        print(f"✓ Code updated: {result.stdout.strip()}")
    else:
        print(f"⚠ Warning: git pull had issues: {result.stderr.strip()}")
except Exception as e:
    print(f"⚠ Warning: Could not update codebase: {e}")
    print("Continuing with existing code...")

def extract_test_cases(file_path):
    """Extract test case names from a test file"""
    test_cases = []
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            patterns = [
                r'it\s*\(\s*["\']([^"\']+)["\']',
                r'test\s*\(\s*["\']([^"\']+)["\']',
                r'it\s*\(\s*`([^`]+)`',
                r'test\s*\(\s*`([^`]+)`',
            ]
            for pattern in patterns:
                matches = re.findall(pattern, content)
                for match in matches:
                    test_name = match.strip()
                    test_name = test_name.replace('should ', '')
                    test_name = test_name.replace('Should ', '')
                    if test_name:
                        test_name = test_name[0].upper() + test_name[1:] if len(test_name) > 1 else test_name.upper()
                    if test_name and len(test_name) > 2:
                        test_cases.append(test_name)
    except Exception as e:
        pass
    return test_cases

def determine_domain_and_category(file_path):
    """Determine domain and category based on file path"""
    path_str = str(file_path).replace('\\', '/')
    filename = os.path.basename(path_str)

    if '/cms-rules/' in path_str:
        if 'auto-calc' in filename:
            return 'Rules Engine', 'Auto-Calculate Rules'
        elif 'required' in filename and 'engine' in filename:
            return 'Rules Engine', 'Required Field Rules'
        elif 'visibility' in filename and 'engine' in filename:
            return 'Rules Engine', 'Visibility Rules'
        elif 'branching' in filename:
            return 'Rules Engine', 'Branching Rules'
        elif 'conflicts' in filename and 'engine' in filename:
            return 'Rules Engine', 'Conflict Rules'
        elif 'auto-select' in filename:
            return 'Rules Engine', 'Auto-Select Rules'
        elif 'copy-answer' in filename:
            return 'Rules Engine', 'Copy Answer Rules'
        elif 'table-rules' in filename:
            return 'Rules Engine', 'Table Rules'
        elif 'supplementry' in filename or 'supplementary' in filename:
            return 'Rules Engine', 'Supplementary Data Rules'
        elif 'Visibility.test' in filename:
            return 'Rules Engine', 'Visibility Action Handler'
        elif 'Required.test' in filename:
            return 'Rules Engine', 'Required Action Handler'
        elif 'Conflict.test' in filename:
            return 'Rules Engine', 'Conflict Action Handler'
        elif 'Answer.test' in filename:
            return 'Rules Engine', 'Answer Action Handler'
        elif 'ActionHandler.test' in filename:
            return 'Rules Engine', 'General Action Handler'
        elif 'RuleExecutor' in filename:
            return 'Rules Engine', 'Rule Executor Utilities'
        elif 'ConflictRuleExecutor' in filename:
            return 'Rules Engine', 'Conflict Rule Executor'
        elif 'model.test' in filename:
            return 'Rules Engine', 'Rules Model'
        else:
            return 'Rules Engine', 'Other Rules'

    elif '/cms-writer/' in path_str:
        if 'Matrix' in path_str:
            return 'UI Components', 'Matrix Components'
        elif '/Page/' in path_str or 'PageComponent' in filename:
            return 'UI Components', 'Page Components'
        elif '/Navigation/' in path_str or 'Navigation' in filename:
            return 'UI Components', 'Navigation Components'
        elif 'DxValidation' in path_str or 'DiagnosisValidation' in path_str or 'RapidValidation' in filename or 'PageAttestation' in filename or 'DiagnosisCardHeader' in filename or 'DateInformation' in filename or 'ClinicalManagement' in filename:
            return 'UI Components', 'Diagnosis Validation Components'
        elif 'EvaluationResolution' in path_str:
            return 'UI Components', 'Evaluation Resolution'
        elif 'Conflicts' in path_str:
            return 'UI Components', 'Conflicts & Clarifications'
        elif 'Clarifications' in path_str:
            return 'UI Components', 'Conflicts & Clarifications'
        elif 'Section' in filename:
            return 'UI Components', 'Other UI Components'
        elif 'PageLink' in filename:
            return 'UI Components', 'Other UI Components'
        elif 'ScrollTo' in filename or 'Scroll' in filename:
            return 'UI Components', 'Other UI Components'
        elif 'Image' in filename:
            return 'UI Components', 'Other UI Components'
        elif 'ChangeStatusButton' in filename:
            return 'UI Components', 'Other UI Components'
        elif 'ContextWriter' in filename:
            return 'UI Components', 'Context Writer'
        elif 'PageMetadata' in filename:
            return 'UI Components', 'Page Metadata'
        elif 'PageNavigationProvider' in filename:
            return 'UI Components', 'Navigation Components'
        elif 'ExternalEditorProvider' in filename:
            return 'UI Components', 'External Editor'
        elif 'DocumentMetadataProvider' in filename:
            return 'UI Components', 'Document Metadata'
        else:
            return 'UI Components', 'Other UI Components'

    elif '/cms-components/' in path_str:
        return 'UI Components', 'Component Library'

    elif '/cms-context/' in path_str:
        return 'State Management', 'Context Layer Tests'

    elif '/cms-service/' in path_str:
        if 'DocumentsService' in filename:
            return 'API Services', 'Documents Service'
        elif 'DxService' in filename:
            return 'API Services', 'Dx Service'
        elif 'GroupsService' in filename:
            return 'API Services', 'Groups Service'
        else:
            return 'API Services', 'Other Services'

    elif '/content-weaver-e2e/' in path_str:
        if '/content-writers/' in path_str:
            return 'Content Management', 'Content Writers'
        elif '/rules/' in path_str or '/writer/rules/' in path_str:
            return 'Content Management', 'Rules Testing'
        elif '/dfv/' in path_str:
            return 'Content Management', 'DFV Rules'
        elif '/weaver/content/' in path_str:
            return 'Content Management', 'Content Management'
        elif '/weaver/document/' in path_str:
            return 'Content Management', 'Document Management'
        elif '/weaver/groups/' in path_str:
            return 'Content Management', 'Groups & Structure'
        elif '/weaver/lifecycles/' in path_str or '/lifecycles/' in path_str:
            return 'Content Management', 'Lifecycle Management'
        elif 'header' in filename:
            return 'Content Management', 'Other E2E Tests'
        elif 'pre-pop' in filename:
            return 'Content Management', 'Other E2E Tests'
        else:
            return 'Content Management', 'Other E2E Tests'

    elif '/context-writer-e2e/' in path_str:
        return 'Context Writer E2E', 'VIHE Form'

    elif '/cms-common/' in path_str:
        return 'Common', 'Common Utilities'

    return 'Other', 'Uncategorized'

base_path = Path(CODEBASE_PATH)
all_tests = []
domain_counts = defaultdict(int)
category_counts = defaultdict(lambda: defaultdict(int))

# Find all test files
test_files = []
for pattern in ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts']:
    test_files.extend(base_path.glob(pattern))

print(f"Found {len(test_files)} test files")

for test_file in test_files:
    domain, category = determine_domain_and_category(test_file)
    tests = extract_test_cases(test_file)
    for test in tests:
        all_tests.append((domain, category, test))
        domain_counts[domain] += 1
        category_counts[domain][category] += 1

print(f"\nTotal test cases extracted: {len(all_tests)}")
print("\nTest cases by domain:")
for domain in sorted(domain_counts.keys()):
    print(f"  {domain}: {domain_counts[domain]}")

# Get date for filename
from datetime import datetime
date_str = datetime.now().strftime("%Y-%m-%d")

# Write to CSV
output_file = f'/Users/bodaly/sig/tools/autotest/test-cases-spreadsheet-{date_str}.csv'
with open(output_file, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['Domain', 'Category', 'Test'])
    for domain, category, test in sorted(all_tests):
        writer.writerow([domain, category, test])

print(f"\nCSV written to {output_file}")

# Print summary for reports
print("\n=== COUNTS FOR REPORTS ===")
print(f"TOTAL_TEST_CASES={len(all_tests)}")
print(f"TOTAL_TEST_FILES={len(test_files)}")
for domain in sorted(domain_counts.keys()):
    print(f"{domain.upper().replace(' ', '_')}={domain_counts[domain]}")
PYTHON_SCRIPT
```

**Expected Output:**

- Total test files count
- Total test cases count
- Breakdown by domain
- CSV file path

**Save the output** - you'll need these counts for the reports.

---

## Step 5: Get Test File Counts by Package

Get detailed breakdowns for the reports:

```bash
cd /Users/bodaly/sig/tools/tmp/reformers.content-manager-client

# Count unit test files by package
echo "Unit Test Files by Package:"
for pkg in cms-writer cms-components cms-rules cms-context cms-common cms-service; do
    count=$(find packages/$pkg -type f \( -name "*.test.ts" -o -name "*.test.tsx" \) | wc -l | tr -d ' ')
    echo "  $pkg: $count"
done

# Count E2E test files
echo -e "\nE2E Test Files:"
echo "  content-weaver-e2e: $(find apps/content-weaver-e2e -type f -name "*.spec.ts" | wc -l | tr -d ' ')"
echo "  context-writer-e2e: $(find apps/context-writer-e2e -type f -name "*.spec.ts" | wc -l | tr -d ' ')"
```

---

## Step 6: Generate Reports

### 5.1 Executive Summary

1. **Copy the template** (or use existing as base):

   ```bash
   cd /Users/bodaly/sig/tools/autotest
   cp executive-summary.md executive-summary-YYYY-MM-DD.md
   ```

   Replace `YYYY-MM-DD` with the date from Step 2.

2. **Update the following in the file:**
   - **Line 5-6:** Update date and generated timestamp
     ```markdown
     **Date:** [Month] [Year]
     **Generated:** [YYYY-MM-DD HH:MM:SS]
     ```
   - **Line 22-23:** Update test case counts from Step 4 output
   - **Line 66-69:** Update test case counts in the "High Coverage Areas" table
   - **Line 75-76:** Update test case counts in the "Areas with Growth Opportunity" table
   - **Line 89:** Update current test case count
   - **Line 137:** Update test case count in Business Value section
   - **Line 237:** Update test case count in Conclusion
   - **Line 246:** Update report generated timestamp

### 5.2 Test Analysis Report

1. **Copy the template:**

   ```bash
   cp test-analysis-report.md test-analysis-report-YYYY-MM-DD.md
   ```

2. **Update the following:**
   - **Line 5:** Update analysis date timestamp
   - **Line 16-22:** Update test file and test case counts from Step 4
   - **Line 36-41:** Update package test file counts from Step 5
   - **Line 45-48:** Update E2E test file counts from Step 5
   - **Line 502:** Update test case count in Conclusion
   - **Line 568:** Update report generated timestamp

### 5.3 Test Cases Detailed Report

1. **Copy the template:**

   ```bash
   cp test-cases-detailed-report.md test-cases-detailed-report-YYYY-MM-DD.md
   ```

2. **Update the following:**
   - **Line 5-6:** Update report date and generated timestamp
   - **Line 27:** Update Rules Engine test case count
   - **Line 249:** Update UI Components test case count
   - **Line 471:** Update Content Management test case count
   - **Line 813:** Update State Management test case count
   - **Line 857:** Update API Services test case count
   - **Line 904:** Update Context Writer E2E test case count
   - **Line 922-932:** Update the summary table with all counts
   - **Line 953:** Update report generated timestamp

---

## Step 7: Verify Reports

1. **Check file sizes** (should be similar to previous versions):

   ```bash
   ls -lh *-YYYY-MM-DD.{md,csv}
   ```

2. **Verify timestamps** are correct in all files:

   ```bash
   grep -h "Generated:\|Analysis Date:\|Report Generated:" *-YYYY-MM-DD.md
   ```

3. **Verify test case counts** match across all reports:
   ```bash
   grep -h "2,002\|Total Test Cases" *-YYYY-MM-DD.md
   ```

---

## File Naming Convention

- **Format:** `[report-name]-YYYY-MM-DD.[extension]`
- **Examples:**
  - `executive-summary-2026-01-12.md`
  - `test-analysis-report-2026-01-12.md`
  - `test-cases-detailed-report-2026-01-12.md`
  - `test-cases-spreadsheet-2026-01-12.csv`

---

## Quick Reference: Key Metrics Locations

### Executive Summary

- Total test files: Line 22
- Total test cases: Line 23
- Domain test cases: Lines 66-69, 75-76

### Test Analysis Report

- Total test files: Line 16
- Total test cases: Line 22
- Package breakdowns: Lines 36-41, 45-48

### Test Cases Detailed Report

- Summary table: Lines 922-932
- Domain-specific counts: Throughout document

---

## Troubleshooting

### Issue: Python script fails

- **Solution:** Ensure Python 3 is installed: `python3 --version`
- Check file paths are correct
- Verify codebase exists at specified location

### Issue: Test counts don't match

- **Solution:** Re-run Step 4 extraction script
- Verify no test files were excluded (check for hidden files)
- Ensure all test file patterns are included (`.test.ts`, `.test.tsx`, `.spec.ts`)

### Issue: Reports have wrong dates

- **Solution:** Double-check the date format in Step 2
- Ensure timestamps are updated in both header and footer sections

---

## Notes

1. **Test Case Extraction:** The script extracts test cases from `it()` and `test()` statements. Nested `describe()` blocks are not counted as individual test cases.

2. **Categorization:** The domain/category assignment is based on file paths and filenames. If new test files are added in new locations, the categorization logic may need to be updated.

3. **Report Consistency:** Always verify that test case counts match across all three reports and the CSV file.

4. **Historical Reports:** Keep previous dated reports for comparison and trend analysis.

---

## Automation Script (Optional)

For future automation, you can create a shell script that combines all steps:

```bash
#!/bin/bash
# regenerate-reports.sh

DATE=$(date +"%Y-%m-%d")
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

echo "Generating reports for $DATE..."

# Run extraction (Step 4)
# ... (include Python script here)

# Generate reports (Step 6)
# ... (include report generation logic)

echo "Reports generated successfully!"
```

---

---

## Step 8: Generate Test Growth Comparison Analysis

This step compares test suites from different dates to show growth over time.

### 8.1 Run the Comparison Script

Run the Python script to compare two CSV files and generate a growth analysis:

```bash
cd /Users/bodaly/sig/tools/autotest && python3 << 'PYTHON_SCRIPT'
import csv
from collections import defaultdict
from datetime import datetime

# Get the dates to compare
# For first comparison, use the baseline date
baseline_date = "2025-12-01"  # Change this to your baseline date
current_date = datetime.now().strftime("%Y-%m-%d")  # Current date

baseline_file = f'test-cases-spreadsheet-{baseline_date}.csv'
current_file = f'test-cases-spreadsheet-{current_date}.csv'

# Read baseline data
baseline_tests = set()
baseline_by_domain = defaultdict(int)
baseline_by_category = defaultdict(int)

with open(baseline_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        test_key = (row['Domain'], row['Category'], row['Test'])
        baseline_tests.add(test_key)
        baseline_by_domain[row['Domain']] += 1
        baseline_by_category[(row['Domain'], row['Category'])] += 1

# Read current data
current_tests = set()
current_by_domain = defaultdict(int)
current_by_category = defaultdict(int)

with open(current_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        test_key = (row['Domain'], row['Category'], row['Test'])
        current_tests.add(test_key)
        current_by_domain[row['Domain']] += 1
        current_by_category[(row['Domain'], row['Category'])] += 1

# Find new and removed tests
new_tests = current_tests - baseline_tests
removed_tests = baseline_tests - current_tests

# Calculate days between dates
from datetime import datetime
date1 = datetime.strptime(baseline_date, "%Y-%m-%d")
date2 = datetime.strptime(current_date, "%Y-%m-%d")
days_diff = (date2 - date1).days

print("=" * 80)
print("TEST SUITE GROWTH ANALYSIS")
print("=" * 80)
print(f"\nBaseline ({baseline_date}): {len(baseline_tests):,} test cases")
print(f"Current ({current_date}): {len(current_tests):,} test cases")
print(f"Time Period: {days_diff} days")
print(f"\nNet Growth: {len(current_tests) - len(baseline_tests):,} test cases")
print(f"New Tests Added: {len(new_tests):,}")
print(f"Tests Removed: {len(removed_tests):,}")

print("\n" + "=" * 80)
print("GROWTH BY DOMAIN")
print("=" * 80)
print(f"{'Domain':<30} {'Baseline':<12} {'Current':<12} {'Added':<12} {'Growth %':<12}")
print("-" * 80)

all_domains = set(baseline_by_domain.keys()) | set(current_by_domain.keys())
for domain in sorted(all_domains):
    baseline_count = baseline_by_domain.get(domain, 0)
    current_count = current_by_domain.get(domain, 0)
    added = current_count - baseline_count
    growth_pct = (added / baseline_count * 100) if baseline_count > 0 else 0
    print(f"{domain:<30} {baseline_count:<12,} {current_count:<12,} {added:<12,} {growth_pct:>10.1f}%")

print("\n" + "=" * 80)
print("GROWTH BY CATEGORY (Top 20 by growth)")
print("=" * 80)

category_growth = []
all_categories = set(baseline_by_category.keys()) | set(current_by_category.keys())
for cat in all_categories:
    baseline_count = baseline_by_category.get(cat, 0)
    current_count = current_by_category.get(cat, 0)
    added = current_count - baseline_count
    if added > 0:
        category_growth.append((cat, baseline_count, current_count, added))

category_growth.sort(key=lambda x: x[3], reverse=True)

print(f"{'Domain':<25} {'Category':<35} {'Baseline':<10} {'Current':<10} {'Added':<10}")
print("-" * 100)
for (domain, category), baseline_count, current_count, added in category_growth[:20]:
    print(f"{domain:<25} {category:<35} {baseline_count:<10,} {current_count:<10,} {added:<10,}")

print("\n" + "=" * 80)
print("NEW TEST CASES BY CATEGORY")
print("=" * 80)

new_by_category = defaultdict(list)
for domain, category, test in new_tests:
    new_by_category[(domain, category)].append(test)

print(f"\nTotal new test cases: {len(new_tests):,}")
print("\nBreakdown by category:\n")
for (domain, category), tests in sorted(new_by_category.items(), key=lambda x: len(x[1]), reverse=True):
    print(f"{domain} - {category}: {len(tests)} new tests")
    if len(tests) <= 10:
        for test in tests[:10]:
            print(f"  - {test}")
    else:
        for test in tests[:5]:
            print(f"  - {test}")
        print(f"  ... and {len(tests) - 5} more")
    print()
PYTHON_SCRIPT
```

### 8.2 Generate the Growth Analysis Report

Create or update the `TEST_GROWTH_ANALYSIS.md` file with the comparison results:

1. **If this is the first comparison:**

   - Create a new `TEST_GROWTH_ANALYSIS.md` file
   - Use the template structure from the existing analysis
   - Include baseline date and current date in the header

2. **If adding to an existing comparison:**
   - Read the existing `TEST_GROWTH_ANALYSIS.md`
   - Add a new section for the new comparison period
   - Update the summary table to include the new period
   - Maintain historical comparisons

### 8.3 Template Structure for Growth Analysis

The growth analysis report should include:

```markdown
# Test Suite Growth Analysis

## [Baseline Date] → [Current Date]

**Analysis Date:** [Current Date]  
**Comparison Period:** [Number] days

---

## Executive Summary

| Metric               | [Baseline Date] | [Current Date] | Change         |
| -------------------- | --------------- | -------------- | -------------- |
| **Total Test Files** | [count]         | [count]        | [+/-count]     |
| **Total Test Cases** | [count]         | [count]        | [+/-count]     |
| **New Tests Added**  | -               | -              | [count]        |
| **Tests Removed**    | -               | -              | [count]        |
| **Net Growth**       | -               | -              | **[+/-count]** |

---

## Growth by Domain

[Table showing growth by domain]

---

## Growth by Category (Top 15)

[Table showing top categories by growth]

---

## Detailed Breakdown by Category

[Detailed analysis of each category with significant growth]

---

## Test Removal Analysis

[Analysis of removed tests]

---

## Recommendations

[Recommendations based on the growth analysis]

---

## Historical Comparison

[If this is not the first comparison, include a table showing growth across all periods]

| Period                     | Days   | Test Cases        | Growth     | Growth % |
| -------------------------- | ------ | ----------------- | ---------- | -------- |
| Dec 1, 2025 → Jan 12, 2026 | 42     | 1,598 → 1,922     | +324       | +20.3%   |
| [Next period]              | [days] | [count] → [count] | [+/-count] | [+/-%]   |

---

## Conclusion

[Summary of findings]
```

### 8.4 Adding to Existing Comparison

When adding a new comparison period to an existing analysis:

1. **Read the existing file:**

   ```bash
   cat TEST_GROWTH_ANALYSIS.md
   ```

2. **Add a new section** after the existing comparison:

   ```markdown
   ---

   ## [Previous Date] → [New Date]

   [New comparison data]
   ```

3. **Update the Historical Comparison table** to include the new period

4. **Update the conclusion** to reflect cumulative growth

### 8.5 Quick Reference: Comparison Dates

Keep track of comparison dates used:

- **Baseline:** December 1, 2025
- **First Comparison:** January 12, 2026 (42 days, +324 tests)

When running future comparisons:

- Use the most recent date as the new baseline, OR
- Always compare against the original baseline (December 1, 2025) to show cumulative growth

### 8.6 Automation Script (Optional)

For future automation, create a script that:

1. Takes two dates as parameters
2. Runs the comparison
3. Updates or creates the growth analysis report
4. Maintains historical comparisons

```bash
#!/bin/bash
# compare-tests.sh

BASELINE_DATE=$1
CURRENT_DATE=$2

if [ -z "$BASELINE_DATE" ] || [ -z "$CURRENT_DATE" ]; then
    echo "Usage: ./compare-tests.sh YYYY-MM-DD YYYY-MM-DD"
    echo "Example: ./compare-tests.sh 2025-12-01 2026-01-12"
    exit 1
fi

# Run comparison and generate report
# ... (include Python script here)
```

---

**Last Updated:** 2026-01-12  
**Maintained By:** Development Team
