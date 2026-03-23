# Detailed Test Cases Report

## Content Manager Client - Reformers Project

**Report Date:** January 2026  
**Generated:** 2026-01-12 18:46:51  
**Cross-Reference:** See `executive-summary.md` for high-level metrics  
**Project Location:** `/Users/bodaly/sig/tools/tmp/reformers.content-manager-client`

---

## Overview

This report provides a detailed listing of individual test cases organized by business area. It complements the Executive Summary report (`executive-summary.md`) which provides high-level metrics and business impact analysis.

**How to Use This Report:**

- Cross-reference with Executive Summary metrics (test file counts, test case counts)
- Identify specific test coverage for each business area
- Track test case additions/removals over time
- Understand detailed test coverage scope

---

## 1. Rules Engine Tests

**Cross-Reference:** Executive Summary - Rules Engine: 17 files, 152 test cases

### 1.1 Auto-Calculate Rules (`engine.auto-calc.test.tsx`)

**Test Cases:**

- `Ensures BMI answer can be set` - Calculates BMI from height (ft/in) and weight
- `Calculates Depression Subscale Score based on PHQ4 answers` - Calculates PHQ4 depression score from interest and feeling down answers
- `Prevents calculation of Depression Subscale Score when PHQ4 answers are incomplete` - Validates calculation only occurs when all inputs present
- `Calculates Depression Subscale Score as 0 when both inputs are 0` - Edge case handling for zero values
- `Runs auto-calculate on single select using value overrides` - Auto-calculation with value mapping overrides
- `Handles auto-calculate when value overrides are missing for selected answer` - Handles missing override scenarios
- `Calculates years smoked based on age quit smoking less than current age` - Years smoking calculation with quit age
- `Calculates years smoked when age quit smoking is not filled` - Years smoking calculation when quit age not provided
- `Calculates years smoked when age quit smoking is answered but hidden` - Handles hidden content in calculations
- `Calculates lung function score based on age, years smoked, and lung function questions with recalculation support` - Complex multi-input calculation with recalculation

**Coverage Areas:**

- BMI calculations (height/weight)
- PHQ4 depression scoring
- Smoking duration calculations
- Value override mappings
- Result override mappings
- Hidden content handling
- Edge cases (zero values, missing inputs)

### 1.2 Required Field Rules (`engine.required.test.tsx`)

**Test Cases:**

- `Sets question as required when rule condition is true` - Makes question required based on condition
- `Does not set question as required when rule condition is false` - Conditional required logic
- `Clears required status when rule condition becomes false` - Dynamic required state changes
- `Handles required fields with multiple conditions` - Complex conditional required logic
- `Integrates required fields with visibility rules` - Required field and visibility rule interaction

**Coverage Areas:**

- Conditional required field logic
- Required state management
- Integration with visibility rules
- Multi-condition scenarios

### 1.3 Visibility Rules (`engine.visibility.test.tsx`)

**Test Cases:**

- `Shows content when condition is true` - Basic visibility show logic
- `Hides content when condition is false` - Basic visibility hide logic
- `Toggles visibility based on answer changes` - Dynamic visibility changes
- `Handles section visibility` - Section-level visibility rules
- `Handles content list visibility` - Content list visibility rules
- `Handles multi-select visibility rules` - Multi-select condition handling
- `Handles blood pressure visibility rules` - Blood pressure specific visibility
- `Handles diabetes-related visibility rules` - Diabetes condition visibility
- `Handles complex conditional visibility` - Multiple condition combinations
- `Executes medications rule with intersect logic` - Intersection logic for visibility

**Coverage Areas:**

- Show/hide content based on conditions
- Section visibility
- Content list visibility
- Multi-select visibility
- Blood pressure visibility
- Diabetes-related visibility
- Complex conditional visibility
- Intersection logic

### 1.4 Branching Rules (`engine.branching-rules.test.tsx`)

**Test Cases:**

- `Navigates to page based on condition` - Conditional page navigation
- `Handles branching logic execution` - Branching rule execution
- `Handles multiple branching conditions` - Complex branching scenarios
- `Handles nested branching rules` - Nested conditional navigation

**Coverage Areas:**

- Page navigation based on conditions
- Conditional page routing
- Branching logic execution
- Nested branching scenarios

### 1.5 Conflict Rules (`engine.conflicts.test.tsx`)

**Test Cases:**

- `Detects conflicts between answers` - Conflict detection logic
- `Resolves conflicts when conditions change` - Conflict resolution
- `Executes conflict rules` - Conflict rule execution
- `Handles multiple conflicts` - Multiple conflict scenarios

**Coverage Areas:**

- Conflict detection
- Conflict resolution
- Conflict rule execution
- Multiple conflict handling

### 1.6 Auto-Select Rules (`engine.auto-select.test.tsx`)

**Test Cases:**

- `Automatically selects answer based on condition` - Auto-selection logic
- `Handles conditional auto-selection` - Conditional auto-select
- `Clears auto-selected answer when condition changes` - Dynamic auto-selection

**Coverage Areas:**

- Automatic answer selection
- Conditional auto-selection
- Dynamic selection changes

### 1.7 Copy Answer Rules (`engine.copy-answer.test.tsx`)

**Test Cases:**

- `Copies answer between fields` - Answer copying functionality
- `Handles conditional answer copying` - Conditional copy logic
- `Updates copied answer when source changes` - Dynamic answer copying

**Coverage Areas:**

- Answer copying between fields
- Conditional answer copying
- Dynamic copy updates

### 1.8 Table Rules (`engine.table-rules.test.tsx`)

**Test Cases:**

- `Executes table-specific rules` - Table rule execution
- `Handles table row operations` - Row-level rule operations
- `Handles table cell operations` - Cell-level rule operations

**Coverage Areas:**

- Table-specific rule execution
- Table row operations
- Table cell operations

### 1.9 Supplementary Data Rules (`engine.supplementry-data.test.tsx`)

**Test Cases:**

- `Handles supplementary data` - Supplementary data processing
- `Enriches data with supplementary information` - Data enrichment rules

**Coverage Areas:**

- Supplementary data handling
- Data enrichment rules

### 1.10 Action Handlers

#### Visibility Action Handler (`Visibility.test.ts`)

- `Handles show action` - Show action execution
- `Handles hide action` - Hide action execution
- `Handles toggle action` - Toggle visibility action
- `Handles multiple visibility actions` - Multiple action handling
- `Handles section visibility actions` - Section-level actions
- `Handles content list visibility actions` - Content list actions
- `Handles edge cases in visibility actions` - Edge case handling
- Additional test cases for visibility action handlers

#### Required Action Handler (`Required.test.ts`)

- `Handles set required action` - Set required action
- `Handles clear required action` - Clear required action
- `Handles conditional required actions` - Conditional required actions
- `Handles multiple required actions` - Multiple action handling
- `Handles required fields with visibility integration` - Integration scenarios
- Additional test cases for required field handlers

#### Conflict Action Handler (`Conflict.test.ts`)

- `Handles conflict detection action` - Conflict detection
- `Handles conflict resolution action` - Conflict resolution
- `Handles multiple conflict actions` - Multiple conflict handling
- Additional test cases for conflict handlers

#### Answer Action Handler (`Answer.test.ts`)

- `Handles answer manipulation actions` - Answer manipulation
- `Handles answer copying actions` - Answer copying
- `Handles answer clearing actions` - Answer clearing
- Additional test cases for answer manipulation

#### General Action Handler (`ActionHandler.test.ts`)

- `Executes actions in correct order` - Action execution order
- `Handles action dependencies` - Action dependencies
- `Handles action errors` - Error handling
- `Handles action rollback` - Rollback scenarios
- Additional test cases for general action handling

### 1.11 Rule Executors

#### Rule Executor Utilities (`RuleExecutor.utils.test.ts`)

- `Parses rule conditions` - Condition parsing
- `Evaluates rule conditions` - Condition evaluation
- `Executes rule actions` - Action execution
- `Handles rule dependencies` - Dependency handling
- `Optimizes rule execution` - Performance optimization
- Additional test cases for rule execution utilities

#### Conflict Rule Executor (`ConflictRuleExecutor.test.ts`)

- `Executes conflict rules` - Conflict rule execution
- `Handles conflict detection` - Conflict detection
- `Handles conflict resolution` - Conflict resolution
- Additional test cases for conflict rule execution

---

## 2. UI Components Tests

**Cross-Reference:** Executive Summary - UI Components: 105+ files, 632 test cases

### 2.1 Matrix Components (`packages/cms-writer/src/lib/components/Matrix/`)

#### MatrixComponent (`MatrixComponent.test.tsx`)

- `Renders default matrix` - Default matrix rendering
- `Renders dx validation display type` - DX validation display
- `Adds new row` - Adding new matrix rows
- `Cancels new row addition` - Cancel row addition
- `Allows deletion when editing` - Delete row functionality
- `Prevents deletion when adding` - Delete button state on add

#### MatrixRow (`MatrixRow.test.tsx`)

- `Renders matrix row` - Row rendering
- `Handles row interactions` - Row interaction handling
- `Handles row editing` - Row editing functionality

#### MatrixModal (`MatrixModal.test.tsx`)

- `Opens modal for new row` - Modal opening
- `Opens modal for editing row` - Edit modal
- `Validates modal inputs` - Input validation
- `Saves row from modal` - Save functionality
- `Cancels modal changes` - Cancel functionality
- Additional test cases for matrix modal interactions

#### MatrixField (`MatrixField.test.tsx`)

- `Renders matrix field` - Field rendering
- `Handles field input` - Input handling
- `Validates field values` - Field validation
- `Handles field errors` - Error handling
- Additional test cases for matrix field operations

#### MatrixHeader (`MatrixHeader.test.tsx`)

- `Renders matrix header` - Header rendering
- `Handles header interactions` - Header interactions

#### MatrixBody (`MatrixBody.test.tsx`)

- `Renders matrix body` - Body rendering
- `Handles body interactions` - Body interactions

#### FormattedMatrix (`FormattedMatrix.test.ts`)

- `Formats matrix data` - Data formatting
- `Handles formatting errors` - Error handling
- `Applies formatting rules` - Formatting rules
- Additional test cases for matrix formatting

#### DefaultMatrixComponent (`DefaultMatrixComponent.test.tsx`)

- `Renders default matrix` - Default rendering
- `Handles default matrix interactions` - Default interactions
- Additional test cases for default matrix rendering

#### DeleteMatrixRowConfirmationModal (`DeleteMatrixRowConfirmationModal.test.tsx`)

- `Shows delete confirmation` - Confirmation display
- `Confirms row deletion` - Deletion confirmation
- `Cancels row deletion` - Deletion cancellation
- Additional test cases for row deletion confirmation

### 2.2 Page Components (`packages/cms-writer/src/lib/components/Page/`)

#### PageComponent (`PageComponent.test.tsx`)

- `Renders page component` - Basic page rendering
- `Renders evaluation resolution center on last page when required questions exist` - Evaluation center display
- `Does not render evaluation resolution center on last page when no required questions` - Conditional evaluation center

#### Header (`Header.test.tsx`)

- `Renders page header` - Header rendering
- `Handles header interactions` - Header interactions
- Additional test cases for page header functionality

#### Footer (`Footer.test.tsx`)

- `Renders page footer` - Footer rendering
- `Handles footer interactions` - Footer interactions
- Additional test cases for page footer functionality

#### PageToolbar (`PageToolbar.test.tsx`)

- `Renders toolbar` - Toolbar rendering
- `Handles toolbar actions` - Toolbar actions
- `Handles toolbar state` - Toolbar state management
- Additional test cases for toolbar interactions

#### PageNotesCapture (`PageNotesCapture.test.tsx`)

- `Captures page notes` - Notes capture
- `Saves page notes` - Notes saving
- `Validates page notes` - Notes validation
- Additional test cases for notes capture functionality

### 2.3 Navigation Components (`packages/cms-writer/src/lib/components/Navigation/`)

#### Navigation (`Navigation.test.tsx`)

- `Renders navigation` - Navigation rendering
- `Handles navigation clicks` - Navigation interactions
- `Highlights active page` - Active page highlighting
- Additional test cases for main navigation

#### PageNavigation (`PageNavigation.test.tsx`)

- `Renders page navigation` - Page navigation rendering
- `Handles page navigation` - Page navigation handling

#### PageGroupNavigation (`PageGroupNavigation.test.tsx`)

- `Renders page group navigation` - Group navigation rendering
- `Handles group navigation` - Group navigation handling
- Additional test cases for page group navigation

#### AccordionPageNavigation (`AccordionPageNavigation.test.tsx`)

- `Renders accordion navigation` - Accordion rendering
- `Expands and collapses accordion` - Accordion interactions
- Additional test cases for accordion navigation

#### AccordionUtils (`AccordionUtils.test.ts`)

- `Calculates accordion state` - State calculation
- `Handles accordion transitions` - Transition handling
- `Manages accordion items` - Item management
- Additional test cases for accordion utility functions (45+ test cases)

### 2.4 Diagnosis Validation Components (`packages/cms-writer/src/lib/components/DxValidation/`)

#### DiagnosisValidationComponent (`DiagnosisValidationComponent.test.tsx`)

- `Renders diagnosis validation` - Validation rendering
- `Handles validation interactions` - Validation interactions
- Additional test cases for diagnosis validation

#### RapidValidation (`RapidValidation.test.tsx`)

- `Performs rapid validation` - Rapid validation execution
- `Handles validation results` - Result handling
- `Displays validation errors` - Error display
- Additional test cases for rapid validation functionality

#### PageAttestation (`PageAttestation.test.tsx`)

- `Renders nothing when there are no attestations` - Empty state handling
- `Renders header and a PageLink for each attestation` - Attestation rendering
- `Renders label and "Manually added" when addedByUser and no attestations` - Manual addition display

#### DiagnosisCardHeader (`DiagnosisCardHeader.test.tsx`)

- `Renders diagnosis card header` - Header rendering
- `Handles header interactions` - Header interactions
- Additional test cases for diagnosis card header

#### DateInformation (`DateInformation.test.tsx`)

- `Renders date information` - Date display
- `Formats dates correctly` - Date formatting
- `Handles date validation` - Date validation
- Additional test cases for date information display

#### ClinicalManagementDetails (`ClinicalManagementDetails.test.tsx`)

- `Renders clinical management details` - Details rendering
- `Handles details interactions` - Details interactions
- Additional test cases for clinical management details

### 2.5 Other UI Components

#### Section (`Section.test.tsx`)

- `Renders section` - Section rendering
- `Handles section interactions` - Section interactions
- Additional test cases for section component

#### PageLink (`PageLink.test.tsx`)

- `Renders page link` - Link rendering
- `Handles link clicks` - Link interactions
- Additional test cases for page link functionality

#### ScrollTo (`ScrollTo.test.tsx`)

- `Scrolls to anchor` - Scroll functionality
- `Handles scroll events` - Scroll event handling
- Additional test cases for scroll to anchor

#### Image (`Image.test.tsx`)

- `Renders image` - Image rendering
- `Handles image loading` - Image loading
- Additional test cases for image component

#### ChangeStatusButton (`ChangeStatusButton.test.tsx`)

- `Renders status button` - Button rendering
- `Handles status changes` - Status change handling
- `Validates status transitions` - Status validation
- Additional test cases for status change button

### 2.6 Component Library Tests (`packages/cms-components/`)

**Note:** 59 test files covering reusable UI components including:

- Form input components (text boxes, numeric inputs, selects)
- Content type components
- Validation components
- Display components
- Interactive components

_Detailed test case listings available in individual test files within `packages/cms-components/src/`_

---

## 3. Content Management Tests (E2E)

**Cross-Reference:** Executive Summary - Content Management: 24+ E2E files, 292 test cases

### 3.1 Content Writers (`apps/content-weaver-e2e/src/tests/writer/content-writers/`)

#### Matrix Writer (`matrix-writer.spec.ts`)

- `Adds new row` - Adding new matrix rows
- `Removes newly added row on cancel` - Cancel row addition
- `Edits existing row` - Editing matrix rows
- `Deletes existing row` - Deleting matrix rows
- `Cancels deleting existing row` - Cancel deletion
- Additional test cases for matrix writer functionality

#### Yes/No Writer (`yes-no-writer.spec.ts`)

- Test cases for Yes/No question writer functionality
- Answer selection and validation
- Conditional logic handling

#### Text Box Writer (`text-box-writer.spec.ts`)

- Test cases for text box writer functionality
- Text input and validation
- Character limits and formatting

#### Numeric Text Box Writer (`numeric-text-box-writer.spec.ts`)

- Test cases for numeric text box writer
- Number input and validation
- Range validation

#### Single Select Writer (`single-select-writer.spec.ts`)

- Test cases for single select writer
- Option selection
- Dropdown interactions

#### Multi-Select Writer (`multi-select-writer.spec.ts`)

- Test cases for multi-select writer
- Multiple option selection
- Selection management

#### Switch Writer (`switch-writer.spec.ts`)

- Test cases for switch writer
- Toggle functionality
- State management

#### Date Writer (`date-writer.spec.ts`)

- Test cases for date writer
- Date selection
- Date validation

#### Signature Writer (`signature-writer.spec.ts`)

- Test cases for signature writer
- Signature capture
- Signature validation

#### Barcode Writer (`barcode-writer.spec.ts`)

- Test cases for barcode writer
- Barcode scanning
- Barcode validation

#### Blood Pressure Writer (`blood-pressure.spec.ts`)

- Test cases for blood pressure writer
- Blood pressure input
- Blood pressure validation

#### Content List Writer (`content-list-writer.spec.ts`)

- Test cases for content list writer
- List management
- List item operations

#### Clarifications Writer (`clarifications-writer.spec.ts`)

- Test cases for clarifications writer
- Clarification capture
- Clarification management

#### PCP Lookup Writer (`pcp-lookup-writer.spec.ts`)

- Test cases for PCP lookup writer
- Provider lookup
- Provider selection

#### Table Writer (`table-writer.spec.ts`)

- Test cases for table writer
- Table row operations
- Table cell operations

### 3.2 Rules Testing (`apps/content-weaver-e2e/src/tests/writer/rules/`)

#### Required Rules (`required-rules.spec.ts`)

- `Creates simple required rule with two conditions` - Required rule creation
- Additional test cases for required field rules

#### Visibility Rules (`visibility-rules.spec.ts`)

- Test cases for visibility rule actions
- Show/hide functionality
- Conditional visibility

#### Branching Rules (`branching-rules.spec.ts`)

- Test cases for branching rules
- Page navigation
- Conditional routing

#### Conflict Rules (`conflict-rules.spec.ts`)

- Test cases for conflict rules
- Conflict detection
- Conflict resolution

#### Editing Rules (`editing-rules.spec.ts`)

- Test cases for rule editing
- Rule modification
- Rule validation

#### Creating Rules (`creating-rules.spec.ts`)

- Test cases for rule creation
- Rule builder functionality
- Rule validation

#### Rules Library (`rules-library.spec.ts`)

- Test cases for rules library
- Rule management
- Rule organization

#### Else Condition Rules (`else-condition-rules.spec.ts`)

- Test cases for else condition rules
- Else clause handling
- Conditional logic

#### Concurrent Users (`concurrent-users.spec.ts`)

- Test cases for concurrent user scenarios
- Multi-user interactions
- Conflict handling

#### Blood Pressure Rules (`blood-pressure-rules.spec.ts`)

- Test cases for blood pressure specific rules
- BP calculation rules
- BP validation rules

### 3.3 DFV (Diagnosis Form Validation) Rules (`apps/content-weaver-e2e/src/tests/writer/dfv/`)

#### Validations (`validations.spec.ts`)

- Test cases for general validations
- Validation rules
- Validation errors

#### Visibility Rules (`visibility-rules.spec.ts`)

- Test cases for DFV visibility rules
- DFV show/hide logic

#### Show Abnormal Ocular Finding Rule (`show-abnormal-ocular-finding-rule.spec.ts`)

- Test cases for ocular finding rules
- Ocular condition handling

#### KED Rules (`ked-rules.spec.ts`)

- Test cases for KED rules
- KED-specific logic

#### Diabetes Rules (`diabetes-rules.spec.ts`)

- Test cases for diabetes-specific rules
- Diabetes condition handling

#### BMI Auto-Calc Rule (`bmi-autocalc-rule.spec.ts`)

- Test cases for BMI auto-calculation
- BMI calculation rules

#### Blood Sugar Rules (`blood-sugar-rules.spec.ts`)

- Test cases for blood sugar rules
- Blood sugar validation

### 3.4 Content Management (`apps/content-weaver-e2e/src/tests/weaver/content/`)

#### Yes/No Content (`yes-no-content.spec.ts`)

- Test cases for Yes/No content management
- Content creation and editing

#### Text Box Content (`text-box-content.spec.ts`)

- Test cases for text box content
- Content operations

#### Numeric Text Box (`numeric-text-box.spec.ts`)

- Test cases for numeric text box content
- Numeric content handling

#### Single Select (`single-select.spec.ts`)

- Test cases for single select content
- Select content management

#### Multi-Select Content (`multi-select-content.spec.ts`)

- Test cases for multi-select content
- Multi-select operations

#### Switch Content (`switch-content.spec.ts`)

- Test cases for switch content
- Switch content management

#### Date Content (`date-content.spec.ts`)

- Test cases for date content
- Date content operations

#### Signature Content (`signature-content.spec.ts`)

- Test cases for signature content
- Signature content management

#### Barcode Content (`barcode-content.spec.ts`)

- Test cases for barcode content
- Barcode content operations

#### Blood Pressure Content (`blood-pressure-content.spec.ts`)

- Test cases for blood pressure content
- BP content management

#### Table Content (`table-content.spec.ts`)

- Test cases for table content
- Table content operations

#### Content Library (`content-library.spec.ts`)

- Test cases for content library
- Library management
- Content organization

#### Concurrent Users (`concurrent-users.spec.ts`)

- Test cases for concurrent user scenarios
- Multi-user content operations

### 3.5 Document Management (`apps/content-weaver-e2e/src/tests/weaver/document/`)

#### Document (`document.spec.ts`)

- Test cases for document operations
- Document creation
- Document editing

#### Document Library (`document-library.spec.ts`)

- Test cases for document library
- Library management
- Document organization

#### Concurrent Users (`concurrent-users.spec.ts`)

- Test cases for concurrent document operations
- Multi-user document handling

### 3.6 Groups & Structure (`apps/content-weaver-e2e/src/tests/weaver/groups/`)

#### Page (`page.spec.ts`)

- Test cases for page management
- Page operations
- Page organization

#### Page Group (`pagegroup.spec.ts`)

- Test cases for page group management
- Group operations
- Group organization

#### Section Group (`section-group.spec.ts`)

- Test cases for section group management
- Section operations
- Section organization

#### Concurrent Users (`concurrent-users.spec.ts`)

- Test cases for concurrent group operations
- Multi-user group handling

### 3.7 Lifecycle Management (`apps/content-weaver-e2e/src/tests/weaver/lifecycles/`)

#### Document Lifecycle (`document-lifecycle.spec.ts`)

- Test cases for document lifecycle
- Status transitions
- Lifecycle management

#### Content Lifecycle (`content-lifecycle.spec.ts`)

- Test cases for content lifecycle
- Content status management

#### Rule Lifecycle (`rule-lifecycle.spec.ts`)

- Test cases for rule lifecycle
- Rule status management

### 3.8 Other E2E Tests

#### Header (`header.spec.ts`)

- Test cases for header functionality
- Header interactions

#### Pre-Population (`pre-pop.spec.ts`)

- Test cases for pre-population functionality
- Pre-population rules

---

## 4. State Management Tests

**Cross-Reference:** Executive Summary - State Management: 20+ files, 232 test cases

### 4.1 Context Layer Tests (`packages/cms-context/`)

#### View Metadata Layer (`ViewMetadataLayer.test.tsx`)

- `Manages view metadata state` - State management
- `Updates view metadata` - State updates
- `Handles view metadata errors` - Error handling

#### Unanswered Required Questions (`useUnansweredRequiredQuestions.test.tsx`)

- `Identifies unanswered required questions` - Question identification
- `Tracks required question status` - Status tracking
- `Updates on answer changes` - Dynamic updates
- Additional test cases for unanswered required questions hook (18+ test cases)

#### Diagnosis Provider (`DiagnosisProvider.test.tsx`)

- `Provides diagnosis context` - Context provision
- `Manages diagnosis state` - State management
- `Handles diagnosis updates` - Update handling
- Additional test cases for diagnosis provider (35+ test cases)

#### Diagnosis Hooks (`DiagnosisHooks.test.tsx`)

- `Uses diagnosis data` - Data access
- `Updates diagnosis data` - Data updates
- `Handles diagnosis errors` - Error handling
- Additional test cases for diagnosis hooks (12+ test cases)

#### Answer Management

- Test cases for answer context and state management
- Answer layer operations
- Answer validation
- Answer synchronization

_Additional test cases available in individual test files within `packages/cms-context/src/`_

---

## 5. API Services Tests

**Cross-Reference:** Executive Summary - API Services: 3 test files, 18 test cases

### 5.1 Documents Service (`DocumentsService.test.tsx`)

**Test Cases:**

- `Returns documents from useQueryDocuments` - Document querying
- `Returns undefined and does not send request when no documentId is passed for useDocumentQuery` - Edge case handling
- `Returns null from useQueryDocumentLifecycleNotes when no documentId is passed` - Null handling
- `Returns notes from useQueryDocumentLifecycleNotes` - Lifecycle notes retrieval
- `Returns document from useQueryDocument with documentId param` - Single document retrieval
- `Returns validation result as failed from useQueryDocumentValidations` - Validation result handling
- `Changes document lifecycle using useEditDocumentLifecycle` - Lifecycle editing
- `Returns undefined from useQueryPreviouslyPublishedVersion when no documentId is passed` - Edge case handling
- `Returns republish version from useQueryPreviouslyPublishedVersion with documentId param` - Republish version retrieval

**Coverage Areas:**

- Document querying
- Single document retrieval
- Document lifecycle notes
- Document validation
- Document lifecycle editing
- Previously published version queries
- Error handling and edge cases

### 5.2 Dx Service (`DxService.test.tsx`)

**Test Cases:**

- Test cases for diagnosis-related service operations
- Diagnosis data retrieval
- Diagnosis data updates

### 5.3 Groups Service (`GroupsService.test.tsx`)

**Test Cases:**

- Test cases for group management service operations
- Group data retrieval
- Group data updates
- Group organization

---

## 6. Context Writer E2E Tests

**Cross-Reference:** Executive Summary - Context Writer E2E: 1 test file, 8 test cases

### 6.1 VIHE Form (`apps/context-writer-e2e/src/tests/vihe-form.spec.ts`)

**Test Cases:**

- Test cases for VIHE form interactions
- Form field interactions
- Form validation
- Form submission
- Form state management

_Detailed test case listings available in `apps/context-writer-e2e/src/tests/vihe-form.spec.ts`_

---

## Test Case Count Summary

| Business Area                | Test Files | Test Cases | Status           |
| ---------------------------- | ---------- | ---------- | ---------------- |
| **Rules Engine**             | 17         | 152        | ✅ Comprehensive |
| **UI Components**            | 105+       | 632        | ✅ Comprehensive |
| **Content Management (E2E)** | 24+        | 292        | ✅ Comprehensive |
| **State Management**         | 20+        | 232        | ✅ Good          |
| **API Services**             | 3          | 18         | ⚠️ Limited       |
| **Context Writer E2E**       | 1          | 8          | ⚠️ Limited       |
| **Common**                   | 20         | 50         | ✅ Good          |
| **Other**                    | Various    | 618        | ⚠️ Needs Review  |
| **TOTAL**                    | **323**    | **2,002**  | ✅ Excellent     |

---

## Notes

1. **Test Case Extraction:** Test case names are extracted from test files using `it()`, `test()`, and `describe()` statements. Some test cases may be nested within describe blocks.

2. **Coverage Completeness:** This report provides representative test cases for each business area. For complete listings, refer to individual test files in the codebase.

3. **Test Case Counts:** Test case counts are based on direct extraction of `it()` and `test()` statements from test files. The total of 2,002 test cases represents individual test assertions.

4. **Cross-Referencing:** Use the Executive Summary (`executive-summary.md`) for high-level metrics and business impact. Use this report for detailed test case listings.

5. **Future Updates:** This report should be updated when:
   - New test files are added
   - Test cases are significantly modified
   - Business areas are restructured

---

**Report Generated:** 2026-01-12 18:46:51  
**Next Review Date:** **\*\***\_\_\_**\*\***  
**Maintained By:** Development Team
