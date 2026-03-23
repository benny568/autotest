# Automated Test Report: reformers.content-manager-client

**Generated:** March 3, 2025  
**Repository:** `/Users/bodaly/sig/fixes/reformers.content-manager-client`

---

## Executive Summary

This report catalogs all automated tests in the reformers.content-manager-client repository, organized by **category/feature** and then by **test name**. The codebase contains:

- **Unit tests** (Jest): `*.test.ts`, `*.test.tsx` in `apps/` and `packages/`
- **E2E tests** (Playwright): `*.spec.ts` in `apps/content-weaver-e2e/` and `apps/context-writer-e2e/`

---

## 1. E2E Tests – Content Weaver (apps/content-weaver-e2e)

### 1.1 Content Library & Content Types

| File | Test Names |
|------|------------|
| `barcode-content.spec.ts` | should create a barcode question; should edit a barcode question; should edit a barcode question with old validation format |
| `blood-pressure-content.spec.ts` | should create a blood pressure question; should show preview when required fields are filled in; should show error when systolic/diastolic min ≥ max (create/edit); should show error in preview when values out of range; should show required star when Required enabled; should hide SYS/DIA inputs when Read Only; should edit and save as draft; should update after draft save |
| `content-library.spec.ts` | should load content library when no content; should load with contents; should search content library; should render hierarchy link (section > page > pagegroup > document); should render missing location with no hierarchy link |
| `date-content.spec.ts` | should create date question with 1/2 answer ids; should create with MM/YYYY format; should create with "more than" validation; should edit; should edit with unknown answer |
| `multi-select-content.spec.ts` | should create with multi/single column display; should create with Other and None answers; should add diagnoses to answers; should add/remove diagnoses; should edit with diagnoses/other option |
| `numeric-text-box.spec.ts` | should create; should edit |
| `signature-content.spec.ts` | should create; should edit |
| `single-select.spec.ts` | Create Single Select; Create with diagnoses; Add and remove diagnoses; Edit; Edit with diagnoses; Edit: Segmented controls; Edit: Clear answers |
| `switch-content.spec.ts` | should create; should create with diagnosis; should add/remove diagnosis; should edit; should edit with diagnosis |
| `table-content.spec.ts` | should create; should edit to add column |
| `text-box-content.spec.ts` | should create; should edit |
| `yes-no-content.spec.ts` | should create; should create with diagnosis; should add/remove diagnosis; should edit; should edit diagnoses; should preview |

### 1.2 Document Library & Documents

| File | Test Names |
|------|------------|
| `document-library.spec.ts` | should load when no documents; should load with documents; should load filtered by search |
| `document.spec.ts` | should add page group; should delete page group |
| `concurrent-users.spec.ts` (document) | should display concurrent user error for the document |

### 1.3 Groups (Sections, Pages, Page Groups)

| File | Test Names |
|------|------------|
| `page.spec.ts` | should create a page; should save with PageGroup > Document hierarchy (draft/ready); should display location tab; should save with one hierarchy; should display missing location; should disable content tab for disable tags |
| `pagegroup.spec.ts` | should display missing location; should display location tab; should edit with/without parents; should set document lifecycle status |
| `section-group.spec.ts` | should create section; should add contentlist/matrix; should edit and reorder; should save with partial/full hierarchy; should display location tab; should display hierarchy links; should disable edit for ResolutionCenter/ConflictResolutionCenter |
| `concurrent-users.spec.ts` (groups) | should display concurrent user error for the group |

### 1.4 Rules

| File | Test Names |
|------|------------|
| `blood-pressure-rules.spec.ts` | should create and preview using greater than/less than/is answered; should edit and preview |
| `branching-rules.spec.ts` | should create auto-select with fallback; should edit to add/remove fallback |
| `conflict-rules.spec.ts` | should create simple conflict rule with two conditions |
| `creating-rules.spec.ts` | should create auto-select/visibility rule; should create against supplementary data/table; should create using text box/is answered |
| `editing-rules.spec.ts` | should edit to add condition (AND/OR); should remove condition/action; should add nested condition |
| `else-condition-rules.spec.ts` | should create with else-if and else; should allow removing else-if but not final else |
| `required-rules.spec.ts` | should create simple required rule with two conditions |
| `rules-library.spec.ts` | should load when no rules; should load with rules; should load filtered by search |
| `visibility-rule-actions.spec.ts` | should create rule to show/hide content, content list, section |
| `concurrent-users.spec.ts` (rules) | should display concurrent user error for the rule |

### 1.5 Lifecycles

| File | Test Names |
|------|------------|
| `content-lifecycle.spec.ts` | should create as draft; should edit draft and save as draft/ready; should edit ready and save as draft/ready; should handle autopush fail with retry |
| `document-lifecycle.spec.ts` | should move document draft→test, test→published; should fail validation (draft content, missing rule reference, duplicate IDs) |
| `rule-lifecycle.spec.ts` | should create as draft/ready; should edit draft/ready and save as draft/ready |

### 1.6 Header & Navigation

| File | Test Names |
|------|------------|
| `header.spec.ts` | should navigate to home, content library, preview, history, admin |

---

## 2. E2E Tests – Writer (apps/content-weaver-e2e)

### 2.1 Content Writers

| File | Test Names |
|------|------------|
| `barcode-writer.spec.ts` | Should render with scan button; Should show text input when scan clicked; Should allow direct entry; Should validate barcode length; Should accept valid lengths; Should clear on clear icon; Should show barcode icon when valid; Edge cases (9 chars, 10 chars); Should handle rapid input |
| `blood-pressure.spec.ts` | Should render; Should show error for systolic/diastolic min/max; Should show error when diastolic > systolic; Should accept valid values; Should show error for 0 values |
| `clarifications-writer.spec.ts` | Should render when provider present; Should dispatch events; Should handle form state changes |
| `content-list-writer.spec.ts` | Should render with unknown checkbox; Should check/uncheck unknown; Should disable items when unknown checked; Should not render unknown when not present |
| `date-writer.spec.ts` | Should validate present date; Should render and accept MM/YYYY, MM/DD/YYYY; Should validate past date; Should allow unknown/uncertain |
| `matrix-writer.spec.ts` | should add new row; should remove on cancel; should edit/delete row; should cancel delete; should undo edits on cancel; should not add row when readonly |
| `multi-select-writer.spec.ts` | Should render with answers and other; Should select/deselect; Should select other/none; Should display/clear validation errors |
| `numeric-text-box-writer.spec.ts` | Should render; Should type with Whole number/Decimal; Should handle validations |
| `pcp-lookup-writer.spec.ts` | Should render; Should display hint/headers; Should allow clicking; Should verify helper methods |
| `signature-writer.spec.ts` | should render; should clear signature |
| `single-select-writer.spec.ts` | Should render; Should select/deselect; Should select other; Should display/clear validation errors |
| `switch-writer.spec.ts` | Should render; Should turn switch on/off |
| `table-writer.spec.ts` | Should render with headings; Should add/edit/delete content |
| `text-box-writer.spec.ts` | Should render; Should type; Text box should grow with long text |
| `yes-no-writer.spec.ts` | Should render; Should select/deselect yes/no/unknown |

### 2.2 DFV (Domain-Specific) Rules

| File | Test Names |
|------|------------|
| `blood-sugar-rules.spec.ts` | If member has glucometer, show blood sugars; Select Urgent case management if blood sugar below 60/above 400 |
| `bmi-autocalc-rule.spec.ts` | Auto calc BMI when temp/height/weight answered; Should remove BMI when unanswered |
| `diabetes-rules.spec.ts` | when med with diabetes marked in use, select yes; If diabetes type secondary, show cause; If member has diabetes, ask type/management; if not managed, ask if advised |
| `ked-rules.spec.ts` | ECGR product code applied, KED available; Can both tests be performed YES/NO; uACR/eGFR performed today NO |
| `show-abnormal-ocular-finding-rule.spec.ts` | Show/hide abnormal ocular finding |
| `validations.spec.ts` | Show glucometer questions and stop/allow navigation on invalid/valid date |
| `visibility-rules.spec.ts` | Show questions for blood test performed; Show reason/provider notes/refused |

### 2.3 Pre-pop & Required Rules

| File | Test Names |
|------|------------|
| `pre-pop.spec.ts` | should have pre populated answers for exam/member/pcp/diagnosis/medication sections |
| `required-rules.spec.ts` | should set question as required; should unset question as required |

---

## 3. E2E Tests – Context Writer (apps/context-writer-e2e)

| File | Test Names |
|------|------------|
| `clarifications.spec.ts` | should display clarification reason for invalid email |
| `pcp-lookup.spec.ts` | should populate PCP fields from mocked external editor |
| `prepop.spec.ts` | should prepop correct answers |
| `cancellation-flow.spec.ts` | should answer questions, stop with cancellation, and finalize |
| `vihe-form.spec.ts` | should answer question (dynamic); matrix group question Cancel/Done; should all answers be answered; should answer diagnosis assessment; finalize it |

---

## 4. Unit Tests – Content Weaver App (apps/content-weaver)

### 4.1 App & Routing

| File | Test Names |
|------|------------|
| `App.test.tsx` | should initialize mixpanel; should not initialize if token not provided |
| `ContentRouter.test.tsx` | should redirect root to questions; should render library (questions/sections/pages); route configuration; should render all main/item routes; should pass correct group type |

### 4.2 Common Components & Hooks

| File | Test Names |
|------|------------|
| `HoverdAnswerIdsProvider.test.tsx` | should provide initial state; should set/clear hoveredAnswerIds; should handle multiple calls |
| `DebouncedButton.test.tsx` | should call onClick after debounce; should prevent rapid clicks; should use custom delay; should handle undefined onClick |
| `LinkButton.test.tsx` | renders children; calls onClick; does not call when disabled; applies className; has default classes |
| `ModalProvider.test.tsx` | should render without modal; should show UnsavedChangesModal/DefaultErrorModal; should hide; should handle addActions; should throw for invalid type; should cleanup on unmount |
| `DiagnosesSearchModal.test.tsx` | renders modal; calls onClose/onAdd; debounces search |
| `ContentCreatedTooltip.test.tsx` | renders info icon; displays creation/update date; handles missing data/IDs |
| `useNavigationBlocker.test.tsx` | should not show modal when no unsaved changes; should show when blocked; should handle continue/close; should add/not add reset action |
| `ExpandedChildItems.test.tsx` | should track expanded items |

### 4.3 Compare Feature

| File | Test Names |
|------|------------|
| `Compare.model.test.ts` | AnswerDiff (create, detect changes, handle added/removed); ComparisonResult; getChangeType; getChangeTypeBadgeColor; getChangeTypeBackground; getTagType |
| `Compare.test.tsx` | should render with toolbar; should pass callbacks; should update on selection; should update showUnchanged; should render/hide Comparison |
| `Compare.utils.test.ts` | compareDocuments; detect name/version changes; compare nested children |
| `CompareToolbar.test.tsx` | should render; should call showUnchangedChanged; should query forms; should handle loading/empty |
| `Comparison.test.tsx` | should render header/tag; should expand/collapse; should display metrics; should hide/show unchanged; should render answers/children; should apply change type styling |
| `FieldDiffDisplay.test.tsx` | should render field/values; should render change type styling; should display indicators; should handle undefined; should truncate |

### 4.4 Library – Common

| File | Test Names |
|------|------------|
| `ErrorNotification.test.tsx` | should render rule conflict errors; should render default/concurrent edit errors; refresh functionality |
| `LibraryToolbar.test.tsx` | Add Question Header; Set params; search input; Question/Rules count; filter dropdown |
| `LocationPath.test.tsx` | renders full hierarchy; renders only section; renders Missing Location; renders links |
| `AddItemsSection.test.tsx` | should add content/section/page; should add matrix and content list; add button disabled/enabled; should disable already added |
| `ItemsTab.test.tsx` | should show add items section; should show sortable list; remove and undo; should handle loading/error/refetch |
| `ChildResourcesSummary.test.tsx` | should render Questions/Sections/Child questions counts |
| `ResourceSummary.test.tsx` | should render for content/section/page; Expanded answers; Compound list type |

### 4.5 Library – Documents

| File | Test Names |
|------|------------|
| `DocumentCard.test.tsx` | should render card |
| `DocumentCreator.test.tsx` | should render Form Name when type is Form |
| `DocumentCreatorForm.test.tsx` | should render Form Name; should render tabs |
| `DocumentDetails.test.tsx` | should render details |
| `DocumentSidebar.test.tsx` | Edit Form Header; should save on edit |

### 4.6 Library – Groups

| File | Test Names |
|------|------------|
| `GroupCard.test.tsx` | should render for section/page/pagegroup; should display hierarchy; should disable edit for ResolutionCenter/ConflictResolutionCenter |
| `GroupCreator.test.tsx` | should render Section/Page/PageGroup Name |
| `GroupCreatorForm.test.tsx` | should render and submit Section/Page/PageGroup; should render tabs; should disable content tab |
| `LocationTab.test.tsx` | renders hierarchy; Partial Hierarchy; Missing Location |
| `TextNoteTab.test.tsx` | should render hint and notes |
| `GroupDetails.test.tsx` | should render details for section |
| `GroupSidebar.test.tsx` | should close; should save new group type; should save section on edit |
| `PageGroupCreator.test.tsx` | should save as draft; should edit with parents |
| `PageCreator.test.tsx` | should save; should edit with parents |
| `SectionCreator.test.tsx` | should save; should edit with parents; should edit with partial hierarchy |

### 4.7 Library – Questions & Content Creators

| File | Test Names |
|------|------------|
| `ContentCard.test.tsx` | should display hierarchy; should display missing location |
| `AddDiagnosisButtons.test.tsx` | when diagnosis present/not present; when missing required fields; removeDiagnosis signature; diagnosis value handling |
| `BarcodeCreator.test.tsx` | renders form; renders with initial values; shows validation error |
| `BarcodeValidations.test.tsx` | renders; accepts valid input; shows error for invalid format; clears on clear; migrates legacy |
| `BloodPressureCreator.test.tsx` | renders fields; handles systolic/diastolic validation; submits form |
| `ContentCreator.test.tsx` | should render yes no/table creator; should not render for unknown type |
| `ContentCreatorForm.test.tsx` | should render form [Date]; should enable save as ready; should render diagnoses; should highlight/remove diagnosis |
| `DisplaySettings.test.tsx` | should render display setting; should render add row button for Table |
| `SortOrderList.test.tsx` | renders add sort rule button; adds sort order row |
| `DateCreator.test.tsx` | create/Date: render, submit, validation; edit: show values, error for no legacy |
| `DateValidations.test.tsx` | renders radio options; handles ranged offset; clears when switching; initializes with values |
| `NumericTextBoxCreator.test.tsx` | should render and save; should render and edit |
| `SelectCreator.test.tsx` | create SingleSelect/MultiSelect; edit; should show diagnosis; should remove/update diagnosis |
| `SignatureCreator.test.tsx` | should render and save/edit |
| `SwitchCreator.test.tsx` | should render and save/edit; with diagnosis; should remove diagnosis |
| `ColumnCreator.test.tsx` | should add/remove column; Date Format Handling; Drag and Drop |
| `TableCreator.test.tsx` | should render initial state |
| `TextBoxOrTextListCreator.test.tsx` | should render and save/edit TextBox |
| `YesNoCreator.test.tsx` | should render and save; should set disabled when other toggled; should add/remove diagnosis |
| `ContentDetails.test.tsx` | should display with required/read only; should use lifecycle changed date |
| `ContentPreview.test.tsx` | should display warning when undefined; should display preview and clear |
| `BloodPressureSummary.test.tsx` | should render answer labels/suffix |
| `ContentSummary.test.tsx` | should render yes/no, key value, date content summary |
| `DefaultSummary.test.tsx` | should render answer labels for yes no, switch, text box, numeric, barcode, signature, images, single/multi select, blood pressure |
| `TableContentSummary.test.tsx` | renders no columns; renders up to 4 columns; expands; shows required label |
| `SelectQuestionType.test.tsx` | Checked enabled/disabled; Will enable Table when feature flag; column-major ordering; UI elements (OK button, Enter/Space key) |

### 4.8 Library – Rules

| File | Test Names |
|------|------------|
| `RuleCard.test.tsx` | should render edit button enabled/disabled; should render hierarchy/missing location |
| `ActionCreator.test.tsx` | action cannot be removed if canRemove false; can add/remove action; should render visibility/auto select; disables add for Conflict |
| `ActionCreator.utils.test.ts` | getRuleTypeActions (Visibility, AutoSelect, Conflict, Required, Edge Cases); getAllRuleActions (recursive, invert, preserve) |
| `AutoSelectActionCreator.test.tsx` | should render populated/empty; updates on action ID change; should switch SetAnswerId/UnsetAnswerId for MultiSelect |
| `RequiredActionCreator.test.tsx` | should render populated/empty |
| `VisibilityActionCreator.test.tsx` | should render populated for content/section/content list; should render empty |
| `GroupSelector.test.tsx` | Types not supported get disabled |
| `ConditionalOperandCreator.test.tsx` | should auto-select question type; should select supplementary data type |
| `DataTypeDropdown.test.tsx` | renders with filtered options for Conflict; renders all for non-Conflict |
| `BloodPressureOperandCreator.test.tsx` | reference operand; is answered operand |
| `ColumnOperand.test.tsx` | should render column dropdown; should allow operator selection |
| `QuestionOperandCreator.test.tsx` | operand with reference; should render table operand; blood pressure rule; useEffect hooks |
| `TableQuestionOperand.test.tsx` | should render column dropdown; should show disabled for unsupported; should allow operator; should render complex/nested; add/remove/nest |
| `ProductCodesSelect.test.tsx` | should render selected; should select/unselect; should clear all; should constrain width |
| `SupplementaryOperandCreator.test.tsx` | should prefill; should select operator and product codes |
| `ConstantValueCreator.test.tsx` | constant value can be set (numeric only, general) |
| `OperandControls.test.tsx` | should render add only on single layer; should render all on multi; add/remove/nest; disables for Conflict |
| `RefAnswerIdCreator.test.tsx` | dropdown renders answers for YesNo/Switch |
| `SubOperandCreator.test.tsx` | should render separator; should add/nest/remove; bracket visibility; "All of the following" for Conflict |
| `RootRuleStatement.test.tsx` | Single Statement; Multiple Statements with Fallbacks; Add Else If Button; Separator Types; Edge Cases |
| `RuleFormUtils.test.ts` | initialValues; buildNewAction; buildNewConflictAction; buildNewCombinedOperand; buildNewConditionOperand; createElseStatement; buildNewStatement; buildNewSupplementaryDataOperand; buildNewTableOperand; actionsContainsReference; logicContainsReference; addMissingElseCondition; getConditions |
| `RuleScopes.test.tsx` | should render dropdown with one/multiple selected |
| `RuleSection.test.tsx` | should render when/then/else; should remove section; should render without separator |
| `RuleSidebar.test.tsx` | Create/Edit Rule Header; should render multiple actions |
| `RuleStatement.test.tsx` | renders RuleSection with SubOperandCreator; renders RuleActions |
| `RuleValidation.test.ts` | must have rule name, type, logic, actions; operand/operand validation; action validation; scopes; supplementary data; set/column operators; fallback validation |
| `Rules.test.tsx` | should render correctly; should render after/without search |

### 4.9 Preview & Publish

| File | Test Names |
|------|------------|
| `Preview.test.tsx` | should render toolbar with ContextWriter; should pass selected document |
| `IssueCsvConverter.test.ts` | should convert NotReady/MissingReference/DuplicateQuestionId/DuplicateAnswerId/Missing Tag; should generate links for Content/Document/Rule/Section/Page/PageGroup |
| `PublishDocument.test.tsx` | should render modal (Test/Publish); should render spinner; should show error/issues; should show downloadable file; should submit for Test/Publish/Recall |
| `DocumentNotes.test.tsx` | renders when expanded; hides when collapsed |
| `PreviewToolbar.test.tsx` | renders document dropdown for Draft/Test state |

### 4.10 Create Resource & Breadcrumbs

| File | Test Names |
|------|------------|
| `CreateResource.test.tsx` | should load children; should call create/edit on save; should only call edit once; should show error on failure |
| `Breadcrumbs.test.tsx` | returns correct breadcrumbs for add/edit content [Date] |

---

## 5. Unit Tests – Context Writer App (apps/context-writer)

### 5.1 App & Services

| File | Test Names |
|------|------------|
| `RegisterSW.test.ts` | Workbox initialization; pwaUpdate query handling; activated/waiting/installing event listeners; edge cases |
| `App.test.tsx` | should render with ContextWriter/iOS; should move started→stopped→finalized |
| `errors.test.tsx` | fallBack; logError; integration (try catch, error boundary) |
| `ContentWriterWrapper.test.tsx` | onAnswer - source passing (Clinician, rule, PrePop, batch, clarifications) |
| `web-to-native.api.test.ts` | should publish Init App, Error, Update Complete/Failed, Attempt to Change Status, Status Changed, Question Request, Answers, Clarification Skip Reason, Page Flag/Reviewed, Analytics, Close |
| `answer.utils.test.ts` | send answers to native (various types); bind answers |
| `data.utils.test.ts` | process data |
| `sw.test.ts` | Service Worker initialization; GetVersion message handling; Multiple messages; Edge cases; Service Worker globals |

---

## 6. Unit Tests – Packages

### 6.1 cms-common

| File | Test Names |
|------|------------|
| `logger.test.ts` | Should display error/debug/info/warn; Should publish log events |
| `Address.test.ts` | should convert to address content; should return possible answers |
| `Barcode.test.ts` | should convert to barcode content |
| `BloodPressure.test.ts` | should convert to blood pressure content |
| `ContentUtils.test.ts` | should not convert unknown; should convert all |
| `DataSearch.test.ts` | getPossibleAnswers; dataBindings property |
| `Date.test.ts` | should convert to date content; should return possible answers |
| `Images.test.ts` | should convert to images content |
| `Medications.test.ts` | should convert to medications content |
| `NumericTextBox.test.ts` | should convert to NumericTextBox content |
| `Select.test.ts` | SingleSelect/MultiSelect: initialize, convert, return possible answers |
| `Signature.test.ts` | should convert to signature content |
| `Switch.test.ts` | should convert to switch content |
| `Table.test.ts` | should get possible answers for table |
| `TextBox.test.ts` | should convert to text box content |
| `TextList.test.ts` | getPossibleAnswers structure |
| `YesNo.test.ts` | should convert to yesNo content |
| `Document.test.ts` | should create document instance |
| `MedicationsDTO.test.ts` | should convert dto to medications; should convert medication to dto |
| `ImagesUtils.test.ts` | should add/remove mime type; should return undefined |

### 6.2 cms-components

| File | Test Names |
|------|------------|
| `AccordionItem.test.tsx` | renders; collapses/expands; can be collapsed by default; does not collapse if canCollapse false; renders icon |
| `AnalyticsProvider.test.tsx` | Should log event; Should send with default attributes |
| `Bracket.test.tsx` | should render bracket |
| `HighlightCard.test.tsx` | should render children |
| `HintText.test.tsx` | Should render with/without border |
| `useExternalEditor.test.tsx` | should process answer with matching eventId; should ignore different eventId |
| `useOrientation.test.ts` | Use Orientation for desktop/mobile: portrait, landscape, resize |
| `IconButton.test.tsx` | should handle onClick; should not be clickable when disabled |
| `RadioButton.test.tsx` | should display; should disable one |
| `AutoLinkPlugin.test.tsx` | URL matching; Email matching; Edge cases |
| `RichTextEditor.test.tsx` | renders with initial value; calls onChange |
| `RichTextEditorField.test.tsx` | renders; displays error |
| `LinkFormatButton.test.tsx` | Button rendering; Link removal; URL validation |
| `ListFormatButton.test.tsx` | Button rendering; List removal; Active state |
| `TextFormatButton.test.tsx` | Button rendering; Active state |
| `ToolbarPlugin.test.tsx` | Toolbar rendering |
| `SegmentedControl.test.tsx` | should render; should display selected; should select on click; should render disabled |
| `SwitchInput.test.tsx` | should display and emit when changed |
| `TextAreaInputField.test.tsx` | should display and handle edit |
| `TextArea.test.tsx` | renders; show clear button |
| `TextInput.test.tsx` | renders; show clear button; should sanitize whole/decimal number |
| `TextInputField.test.tsx` | should display and handle edit |
| `KeyValuePair.test.tsx` | should display Key and value for text/react node |
| `Search.test.tsx` | search results; single/multi select; pre-selected; disabled; spinner; trim; disabled prop |
| `PlatformUtils.test.ts` | should return true/false for context writer user agent |
| `ValidationLayer.test.tsx` | useValidation; usePageErrors |
| `ContentListWriter.test.tsx` | should render PCP Lookup/ContentList; Required asterisk; Unknown option checkbox |
| `BarcodeCapture.test.tsx` | should not render if no barcode detector; Barcode Detector api tests |
| `BarcodeValidation.test.ts` | validation using old/new style |
| `BarcodeWriter.test.tsx` | should display button; disabled; existing value; validation errors; clear; scan; external editor |
| `BloodPressureWriter.test.tsx` | should display; disabled; save; clear; load; error messages |
| `CogComponent.test.tsx` | should expose launchEditor; should call onResultChange; should call launchCogEditor |
| `LaunchClinicalTestWriter.test.tsx` | should call launchEditor for Spirometry; should display Re-launch; should render cogGrade/cogScore |
| `SpirometryComponent.test.tsx` | should expose launchEditor; should call onResultChange; should call launchSpirometryEditor |
| `ContentWriter.test.tsx` | should render read-only content with value |
| `DataSearchWriter.test.tsx` | should render values; should handle numeric/boolean |
| `SearchBar.test.tsx` | renders; filtered results; onSelect; clear; maxResults; disabled; className; case-insensitive |
| `DateInput.test.tsx` | renders; displays error; applies disabled; className |
| `DateValidationUtils.test.ts` | formatDateISOString; validateDate with RangedOffset |
| `DateWriter.test.tsx` | should display; save; disable; render full answer; clear; error messages |
| `ImagesWriter.test.tsx` | should display launch button; existing answers; disabled; external editor |
| `MedicationDiagnoses.test.tsx` | should render as required/not required; should render diagnoses |
| `MedicationsWriter.test.tsx` | should render; should launch editor; should handle stillInUse; prescriber |
| `MultiSelectWriter.test.tsx` | should display; should set/clear; noneOption functionality; validation |
| `NumericTextBoxWriter.test.tsx` | should display; save; validate; clear |
| `PCPLookupWriter.test.tsx` | should render; should add row; should select provider |
| `SignatureCapture.test.tsx` | should show modal; should call on modal button clicks |
| `SignatureWriter.test.tsx` | should display; disabled; popup; save |
| `SelectValidation.test.ts` | validateSelect for other option |
| `SingleSelectWriter.test.tsx` | should display; should set/clear; segmented buttons; validation |
| `SwitchWriter.test.tsx` | should display; disabled; save |
| `TableEditorModal.test.tsx` | renders modal; column answers; save button; required columns |
| `TableWriter.test.tsx` | renders table; sort; column types; TextList; date formats; Clinicians data; Add row button label |
| `TextBoxWriter.test.tsx` | should display; save; clear |
| `YesNoWriter.test.tsx` | should display; disabled; save; clear |
| `useCog.test.ts` | exposes launchCogEditor/clearCog; launches; derives; writes; clears |
| `usePCP.test.ts` | returns setPCP/clearAnswer; clears; returns answers; sets partial |
| `useSpirometry.test.ts` | launches; writes; sets; clears |
| `useStringifiedAnswer.test.ts` | should stringify undefined; should stringify using firstAnswer/answersByAnswerId |

### 6.3 cms-context

| File | Test Names |
|------|------------|
| `ContextProvider.test.tsx` | ContextProvider component; useDocument; useTags; DocumentContext defaults; ParsedContentDocument; Redux store; ViewMetadata |
| `DataSourceProvider.test.tsx` | provides diagnosisValidation/supplementaryData; useDataSearch (Diagnosis, non-Diagnosis, memoization, without provider) |
| `document.utils.test.ts` | should parse document; should map unknownOption; should parse eval answers; should preserve source |
| `useClinicians.test.ts` | returns clinicians; returns empty when not found |
| `useHiddenContent.test.tsx` | should clear answers for hidden questions/sections |
| `useMedication.test.tsx` | useMedications; useMedication |
| `useMember.test.ts` | should return member with null/undefined; should return first/last name |
| `useProvider.test.ts` | should return provider; should return name and degree |
| `AnswerLayer.test.tsx` | actions and selectors; Error handling |
| `useAnswer.test.tsx` | should return typed answer; should upsert/clear/remove; should not update when missing; should track previous |
| `useAnswers.test.tsx` | useAnswers; setRowAnswers; clearEntireAnswers; clearAnswers; source handling |
| `useContentAnswer.test.tsx` | should return initial/existing; should upsert/clear; should include rowId; should track previous |
| `useMatrixAnswers.test.tsx` | should return matrix answers; should upsert/remove row |
| `useMultiRowAnswer.test.ts` | basic functionality; setRow; removeRow; removeRows; getAnswer; overwriteAnswer; clearAnswer; edge cases; memoization |
| `ConflictLayer.test.tsx` | useConflicts; ConflictLayer actions; onConflictsCountChange |
| `DiagnosisConflicts.test.tsx` | Component Rendering; Medication-Related; Diagnosis Content; Conflicting Diagnosis Sets; Conflict Updates; Unconfirmed |
| `DiagnosisHooks.test.tsx` | useDiagnosisContent; useDiagnosisFromAnswers; useMedicationDiagnoses |
| `DiagnosisProvider.test.tsx` | useDiagnosisContent; useDiagnoses; DiagnosisProvider; useContentDiagnosisTrigger; useMedicationDiagnoses; useDiagnosisConflicts; Risk Adjustable; ViewMetadata updates |
| `ViewMetadataLayer.test.tsx` | should return methods to hide, show, set required, set optional, reset required |
| `useUnansweredRequiredQuestions.test.tsx` | Common Layer; useUnansweredRequiredMatrixContent |

### 6.4 cms-rules

| File | Test Names |
|------|------------|
| `ConflictRuleExecutor.test.ts` | adds answers; does not add duplicate; does not add missing id; returns ResolveConflict/ShowConflict; filters answers |
| `RuleExecutor.utils.test.ts` | getRuleInfo (simple statements, nested operands, fallbacks, mixed types, existing RuleInfo, edge cases) |
| `ActionHandler.test.ts` | createOrUpdateMetadata; processActions (visibility, answer, required, conflict, multiple, rowId, MultiSelect, conflict consolidation) |
| `Answer.test.ts` | setAnswerActionHandler; unsetAnswerActionHandler |
| `Conflict.test.ts` | showConflictActionHandler; resolveConflictActionHandler; Conflict workflow |
| `Required.test.ts` | setRequiredActionHandler; unsetRequiredActionHandler; Required state transitions |
| `Visibility.test.ts` | setVisibleActionHandler; setHiddenActionHandler |
| `model.test.ts` | createAnswer for YesNo, MultiSelect, Switch, NumericTextBox, Images; does not include source |
| `engine.auto-calc.test.tsx` | should set BMI; should calculate Depression Subscale Score; years smoked; result overrides |
| `engine.auto-select.test.tsx` | should set/unset answer id; should set multiple on MultiSelect; should merge from multiple rules; Urgent CM |
| `engine.branching-rules.test.tsx` | should run fallback if logic false; nested fallback |
| `engine.conflicts.test.tsx` | should show conflict; should resolve conflict |
| `engine.copy-answer.test.tsx` | should copy answer |
| `engine.required.test.tsx` | should set/unset question as required |
| `engine.supplementry-data.test.tsx` | should set question visible/hidden based on product code |
| `engine.table-rules.test.tsx` | medications rule (intersect, union, simple, complex); clinicians; complex table rule with AND |
| `engine.visibility.test.tsx` | should set question/section/content list visible/hidden; should allow equals on MultiSelect; textbox; blood pressure |

### 6.5 cms-service

| File | Test Names |
|------|------------|
| `DocumentsService.test.tsx` | useQueryDocuments; useDocumentQuery; useQueryDocumentLifecycleNotes; useQueryDocument; useQueryDocumentValidations; useEditDocumentLifecycle; useQueryPreviouslyPublishedVersion |
| `DxService.test.tsx` | should fetch when enabled; should not fetch when disabled |
| `GroupsService.test.tsx` | useQueryGroups; useQueryGroup; useCreateGroup; useEditGroup; creates section |

### 6.6 cms-writer

| File | Test Names |
|------|------------|
| `ClarificationCenter.test.tsx` | should render; should show response dialog; should allow skip reason; should clear on skip; should navigate to question |
| `ClarificationSignature.test.tsx` | should render; should render when missing provider tag |
| `ClarificationSummary.test.tsx` | should render; should show message and link to resolution center |
| `ConflictRow.test.tsx` | renders titles and links; omits links when missing; renders separator |
| `ConflictsInline.test.tsx` | returns null when no conflicts; renders rows when exist |
| `ConflictsModal.test.tsx` | closes on overlay; does not close on content; renders empty-state; returns null; toggles on pathname |
| `ContextWriter.test.tsx` | should log event on answer change |
| `ChangeStatusButton.test.tsx` | should render disabled; should trigger started/stopped/finalized; should clear hidden answers |
| `ClinicalManagementDetails.test.tsx` | renders nothing/managedBy/recommendedFollowUp/rationale |
| `DateInformation.test.tsx` | renders nothing/last claim/last signify/both |
| `DiagnosisCardHeader.test.tsx` | renders diagnosis name; shows Confirmed/Not Confirmed/Not Completed; shows icons |
| `PageAttestation.test.tsx` | renders nothing/header and PageLinks; renders "Manually added" |
| `RapidValidation.test.tsx` | renders nothing/header and card; shows date labels; renders ContentWriter |
| `EvaluationResolutionCenter.test.tsx` | should render; should render disabled |
| `RequiredQuestion.test.tsx` | should render link; should render disabled |
| `Image.test.tsx` | Should render for found/not found source |
| `DefaultMatrixComponent.test.tsx` | should add row; should edit row; should render rows; should sort |
| `DeleteMatrixRowConfirmationModal.test.tsx` | should render; should only render when open; should handle cancel/dismiss/delete |
| `DiagnosisValidationComponent.test.tsx` | applies disabled styles; pointer-events-none |
| `FormattedMatrix.test.ts` | should format header/sub headers/body; should fail when no item rendering |
| `MatrixBody.test.tsx` | should render matrix body, rows, cells |
| `MatrixComponent.test.tsx` | should render default/dx validation; should add/cancel/delete row |
| `MatrixField.test.tsx` | should render stringified value; should render required indicator; should render dash |
| `MatrixHeader.test.tsx` | should render header and sub-headings |
| `MatrixModal.test.tsx` | should render modal; should render ContentWriter; should call onAdd/onCancel; should handle empty; should disable buttons; should open confirmation |
| `MatrixRow.test.tsx` | should render; should handle edit; should apply disabled styles |
| `AccordianNavigation.test.tsx` | Should render and allow navigation; Should style for selected; does not render when not visible |
| `AccordionUtils.test.ts` | iconMappings; getPageGroupColorClass (text, bg, border, default, edge cases) |
| `Navigation.test.tsx` | Should render; renders page group navigations; Accordion with feature flag |
| `AccordionPageNavigation.test.tsx` | renders page title; does not render when not visible; navigates; applies classes |
| `PageGroupNavigation.test.tsx` | Should render and allow navigation; renders title and image; does not render when not visible |
| `PageImage.test.tsx` | Should render for unselected/selected and 404 |
| `PageNavigation.test.tsx` | renders page title; does not render when not visible; navigates; applies classes |
| `Footer.test.tsx` | should render footer with next page; should return contentId; should render stop/finalize button; should render without button when finalized |
| `Header.test.tsx` | should render start/transcribe button; should render training banner; should not render notes/flag/review when finalized; Feature flag: new navigation styling |
| `PageNotesCapture.test.tsx` | renders modal/textarea; updates value; calls onSave/onClose; uses default testId; maintains value |
| `PageToolbar.test.tsx` | renders Notes/Flag/Review icons; calls toggleFlag/toggleReview; renders PageNotesCapture |
| `PageComponent.test.tsx` | should render; should render evaluation resolution center on last page |
| `PageLink.test.tsx` | renders with correct text; generates correct URL; has correct aria-label |
| `ScrollTo.test.tsx` | should scroll into view; should scroll to top; should do nothing for no hash |
| `Section.test.tsx` | should render with section title; should render with ContentList; should render hidden; should render matrix; should render empty placeholder |
| `DocumentMetadataProvider.test.tsx` | should process start info; should set questions optional/required on cancel |
| `ExternalEditorProvider.test.tsx` | Spirometry Editor; Barcode Editor; DEE Editor; Medication Editor |
| `PageNavigationProvider.test.tsx` | should generate pages and paths; should exclude invisible; Should return selected page link |
| `PageMetadataLayer.test.tsx` | toggles flag; handles undefined context; toggles review status |
| `content.utils.test.tsx` | Scrolls into view and focuses; returns answer id by tag; returns undefined if not found; throws if no answer id |

---

## Summary Statistics

| Category | Test Files | Approx. Test Count |
|----------|------------|---------------------|
| E2E – Content Weaver | ~40 | ~150+ |
| E2E – Writer | ~25 | ~100+ |
| E2E – Context Writer | ~5 | ~15+ |
| Unit – Content Weaver | ~100 | ~500+ |
| Unit – Context Writer | ~10 | ~50+ |
| Unit – cms-common | ~25 | ~80+ |
| Unit – cms-components | ~60 | ~250+ |
| Unit – cms-context | ~20 | ~120+ |
| Unit – cms-rules | ~25 | ~100+ |
| Unit – cms-service | ~3 | ~15 |
| Unit – cms-writer | ~45 | ~150+ |
| **Total** | **~350+** | **~1500+** |

---

*Report generated from automated extraction of test file names and describe/it/test block content.*
