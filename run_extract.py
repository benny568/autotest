#!/usr/bin/env python3
"""Extract test cases from frontend codebase and write CSV. Updates code via git pull first."""
import argparse
import re
import os
import csv
import subprocess
from pathlib import Path
from collections import defaultdict
from datetime import datetime

CODEBASE_PATH = '/Users/bodaly/sig/reformers.content-manager-client'
MAIN_BRANCH = 'main'
OUTPUT_DIR = '/Users/bodaly/sig/tools/autotest'

parser = argparse.ArgumentParser(description='Extract test cases from codebase')
parser.add_argument('--output-date', metavar='YYYY-MM-DD', help='Use this date for output filename (for re-extracting historical snapshots)')
parser.add_argument('--no-pull', action='store_true', help='Skip git pull (use when codebase is already at desired commit)')
args = parser.parse_args()

if not args.no_pull:
    print("Updating codebase to latest version...")
    try:
        subprocess.run(['git', 'checkout', MAIN_BRANCH], cwd=CODEBASE_PATH, check=False, capture_output=True)
        result = subprocess.run(['git', 'pull'], cwd=CODEBASE_PATH, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✓ Code updated: {result.stdout.strip()}")
        else:
            print(f"⚠ Warning: git pull had issues: {result.stderr.strip()}")
    except Exception as e:
        print(f"⚠ Warning: Could not update codebase: {e}")
        print("Continuing with existing code...")
else:
    print("Skipping git pull (--no-pull)")

def extract_test_cases(file_path):
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
                    test_name = test_name.replace('should ', '').replace('Should ', '')
                    if test_name:
                        test_name = test_name[0].upper() + test_name[1:] if len(test_name) > 1 else test_name.upper()
                    if test_name and len(test_name) > 2:
                        test_cases.append(test_name)
    except Exception:
        pass
    return test_cases

def determine_domain_and_category(file_path):
    path_str = str(file_path).replace('\\', '/')
    filename = os.path.basename(path_str)
    if '/cms-rules/' in path_str:
        if 'auto-calc' in filename: return 'Rules Engine', 'Auto-Calculate Rules'
        elif 'required' in filename and 'engine' in filename: return 'Rules Engine', 'Required Field Rules'
        elif 'visibility' in filename and 'engine' in filename: return 'Rules Engine', 'Visibility Rules'
        elif 'branching' in filename: return 'Rules Engine', 'Branching Rules'
        elif 'conflicts' in filename and 'engine' in filename: return 'Rules Engine', 'Conflict Rules'
        elif 'auto-select' in filename: return 'Rules Engine', 'Auto-Select Rules'
        elif 'copy-answer' in filename: return 'Rules Engine', 'Copy Answer Rules'
        elif 'table-rules' in filename: return 'Rules Engine', 'Table Rules'
        elif 'supplementry' in filename or 'supplementary' in filename: return 'Rules Engine', 'Supplementary Data Rules'
        elif 'Visibility.test' in filename: return 'Rules Engine', 'Visibility Action Handler'
        elif 'Required.test' in filename: return 'Rules Engine', 'Required Action Handler'
        elif 'Conflict.test' in filename: return 'Rules Engine', 'Conflict Action Handler'
        elif 'Answer.test' in filename: return 'Rules Engine', 'Answer Action Handler'
        elif 'ActionHandler.test' in filename: return 'Rules Engine', 'General Action Handler'
        elif 'RuleExecutor' in filename: return 'Rules Engine', 'Rule Executor Utilities'
        elif 'ConflictRuleExecutor' in filename: return 'Rules Engine', 'Conflict Rule Executor'
        elif 'model.test' in filename: return 'Rules Engine', 'Rules Model'
        else: return 'Rules Engine', 'Other Rules'
    elif '/cms-writer/' in path_str:
        if 'Matrix' in path_str: return 'UI Components', 'Matrix Components'
        elif '/Page/' in path_str or 'PageComponent' in filename: return 'UI Components', 'Page Components'
        elif '/Navigation/' in path_str or 'Navigation' in filename: return 'UI Components', 'Navigation Components'
        elif 'DxValidation' in path_str or 'DiagnosisValidation' in path_str or 'RapidValidation' in filename or 'PageAttestation' in filename or 'DiagnosisCardHeader' in filename or 'DateInformation' in filename or 'ClinicalManagement' in filename:
            return 'UI Components', 'Diagnosis Validation Components'
        elif 'EvaluationResolution' in path_str: return 'UI Components', 'Evaluation Resolution'
        elif 'Conflicts' in path_str: return 'UI Components', 'Conflicts & Clarifications'
        elif 'Clarifications' in path_str: return 'UI Components', 'Conflicts & Clarifications'
        elif 'Section' in filename or 'PageLink' in filename or 'ScrollTo' in filename or 'Scroll' in filename or 'Image' in filename or 'ChangeStatusButton' in filename:
            return 'UI Components', 'Other UI Components'
        elif 'ContextWriter' in filename: return 'UI Components', 'Context Writer'
        elif 'PageMetadata' in filename: return 'UI Components', 'Page Metadata'
        elif 'PageNavigationProvider' in filename: return 'UI Components', 'Navigation Components'
        elif 'ExternalEditorProvider' in filename: return 'UI Components', 'External Editor'
        elif 'DocumentMetadataProvider' in filename: return 'UI Components', 'Document Metadata'
        else: return 'UI Components', 'Other UI Components'
    elif '/cms-components/' in path_str:
        return 'UI Components', 'Component Library'
    elif '/cms-context/' in path_str:
        return 'State Management', 'Context Layer Tests'
    elif '/cms-service/' in path_str:
        if 'DocumentsService' in filename: return 'API Services', 'Documents Service'
        elif 'DxService' in filename: return 'API Services', 'Dx Service'
        elif 'GroupsService' in filename: return 'API Services', 'Groups Service'
        else: return 'API Services', 'Other Services'
    elif '/content-weaver-e2e/' in path_str:
        if '/content-writers/' in path_str: return 'Content Management', 'Content Writers'
        elif '/rules/' in path_str or '/writer/rules/' in path_str: return 'Content Management', 'Rules Testing'
        elif '/dfv/' in path_str: return 'Content Management', 'DFV Rules'
        elif '/weaver/content/' in path_str: return 'Content Management', 'Content Management'
        elif '/weaver/document/' in path_str: return 'Content Management', 'Document Management'
        elif '/weaver/groups/' in path_str: return 'Content Management', 'Groups & Structure'
        elif '/weaver/lifecycles/' in path_str or '/lifecycles/' in path_str: return 'Content Management', 'Lifecycle Management'
        elif 'header' in filename or 'pre-pop' in filename: return 'Content Management', 'Other E2E Tests'
        else: return 'Content Management', 'Other E2E Tests'
    elif '/context-writer-e2e/' in path_str:
        return 'Context Writer E2E', 'VIHE Form'
    elif '/cms-common/' in path_str:
        return 'Common', 'Common Utilities'
    return 'Other', 'Uncategorized'

base_path = Path(CODEBASE_PATH)
all_tests = []
domain_counts = defaultdict(int)
category_counts = defaultdict(lambda: defaultdict(int))
test_files = []
# Exclude node_modules, dist, coverage (aligned with sync-tests-to-zephyr.js and TEST_GROWTH_ANALYSIS)
for pattern in ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts']:
    for f in base_path.glob(pattern):
        p = str(f)
        if 'node_modules' not in p and 'dist' not in p and 'coverage' not in p:
            test_files.append(f)
print(f"Found {len(test_files)} test files")

for test_file in test_files:
    domain, category = determine_domain_and_category(test_file)
    for test in extract_test_cases(test_file):
        all_tests.append((domain, category, test))
        domain_counts[domain] += 1
        category_counts[domain][category] += 1

print(f"Total test cases extracted: {len(all_tests)}")
print("Test cases by domain:")
for domain in sorted(domain_counts.keys()):
    print(f"  {domain}: {domain_counts[domain]}")

date_str = args.output_date if args.output_date else datetime.now().strftime("%Y-%m-%d")
output_file = f'{OUTPUT_DIR}/test-cases-spreadsheet-{date_str}.csv'
with open(output_file, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['Domain', 'Category', 'Test'])
    for row in sorted(all_tests):
        writer.writerow(row)
print(f"CSV written to {output_file}")
print("=== COUNTS FOR REPORTS ===")
print(f"TOTAL_TEST_CASES={len(all_tests)}")
print(f"TOTAL_TEST_FILES={len(test_files)}")
for domain in sorted(domain_counts.keys()):
    print(f"{domain.upper().replace(' ', '_')}={domain_counts[domain]}")
