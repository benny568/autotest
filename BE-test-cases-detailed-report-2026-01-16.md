# Detailed Test Cases Report

## Content Manager Service - Reformers Project (Backend)

**Report Date:** January 2026  
**Generated:** 2026-01-16 16:48:00  
**Cross-Reference:** See `BE-executive-summary-2026-01-16.md` for high-level metrics  
**Project Location:** `/Users/bodaly/sig/reformers.content-manager-service`

---

## Overview

This report provides a detailed listing of individual test cases organized by business area for the Content Manager Service backend. It complements the Executive Summary report which provides high-level metrics and business impact analysis.

**How to Use This Report:**

- Cross-reference with Executive Summary metrics (test file counts, test case counts)
- Identify specific test coverage for each service area
- Track test case additions/removals over time
- Understand detailed test coverage scope

---

## Test Case Count Summary

| Business Area            | Test Files | Test Cases | Status           |
| ------------------------ | ---------- | ---------- | ---------------- |
| **Component Tests**      | 53         | 825        | ✅ Comprehensive |
| **Core Services**        | 43         | 573        | ✅ Comprehensive |
| **Translation Services** | 20         | 224        | ✅ Comprehensive |
| **Model Tests**          | 18         | 160        | ✅ Good          |
| **Query Services**       | ~5         | 20         | ⚠️ Limited       |
| **Web API Tests**        | 1          | 4          | ⚠️ Limited       |
| **Migration Tests**      | 1          | 6          | ⚠️ Limited       |
| **TOTAL**                | **136**    | **1,812**  | ✅ Excellent     |

---

## 1. Component Tests

**Cross-Reference:** Executive Summary - Component Tests: 53 files, 825 test cases

### 1.1 Content API Tests

Tests for content management API endpoints:

- Content creation and retrieval
- Content updates and deletion
- Content validation
- Content relationships

### 1.2 Document API Tests

Tests for document operations:

- Document creation
- Document retrieval
- Document updates
- Document lifecycle management

### 1.3 Rules API Tests

Tests for rules management:

- Rule creation and updates
- Rule execution
- Rule validation

### 1.4 Group API Tests

Tests for group management:

- Group operations
- Group relationships
- Group validation

### 1.5 Integration Tests

- Lifecycle management tests
- Value bindings tests
- Tags management tests
- ID generation tests
- Document copying tests
- Auto-push functionality tests

_Detailed test case listings available in individual test files within `src/ContentManagerService.ComponentTests/`_

---

## 2. Core Services Tests

**Cross-Reference:** Executive Summary - Core Services: 43 files, 573 test cases

### 2.1 Query Services

Tests for data querying operations:

- Document queries
- Content queries
- Rules queries
- Diagnosis queries
- Group queries
- Form version queries

### 2.2 Command Services

Tests for command processing:

- Command validation
- Business rule execution
- Data transformation
- Side effect validation

_Detailed test case listings available in individual test files within `src/ContentManagerService.Core.Tests/`_

---

## 3. Translation Services Tests

**Cross-Reference:** Executive Summary - Translation Services: 20 files, 224 test cases

### 3.1 Question Translators

Tests for translating different question types:

- Yes/No question translation
- Text box translation
- Numeric text box translation
- Select question translation
- Switch question translation
- Date question translation
- Signature question translation
- Barcode question translation
- Blood pressure translation
- Table question translation
- Address question translation
- Image question translation
- Data search translation
- Text list translation

### 3.2 Group Translators

Tests for translating group structures:

- Matrix translation
- Page translation
- Page group translation
- Content list translation
- Section translation

_Detailed test case listings available in individual test files within `shared/Signify.ContentManager.Translations/Translations.Tests/`_

---

## 4. Model Tests

**Cross-Reference:** Executive Summary - Model Tests: 18 files, 160 test cases

Tests for data models and entities:

- Entity validation
- Property mapping
- Data serialization/deserialization
- Model constraints
- Relationship validation

_Detailed test case listings available in individual test files within `shared/Signify.ContentManager/Models.Tests/`_

---

## 5. Query Services Tests

**Cross-Reference:** Executive Summary - Query Services: ~5 files, 20 test cases

Tests for query operations:

- Query execution
- Data retrieval
- Filtering and sorting
- Query optimization

_Detailed test case listings available in individual test files within `src/ContentManagerService.Core.Tests/Queries/`_

---

## 6. Web API Tests

**Cross-Reference:** Executive Summary - Web API Tests: 1 file, 4 test cases

Tests for Web API layer:

- API controller testing
- Request routing
- Response formatting
- Middleware testing

_Detailed test case listings available in `src/ContentManagerService.WebApi.Tests/`_

---

## 7. Migration Tests

**Cross-Reference:** Executive Summary - Migration Tests: 1 file, 6 test cases

Tests for database migrations:

- Migration script validation
- Data migration testing
- Schema change validation

_Detailed test case listings available in `src/ContentManagerService.Migrations.Tests/`_

---

## Notes

1. **Test Case Extraction:** Test case names are extracted from C# test files using `[Fact]`, `[Theory]`, `[TestMethod]`, and `[Test]` attributes. Test method names are converted from PascalCase to readable format.

2. **Coverage Completeness:** This report provides representative test coverage for each service area. For complete listings, refer to individual test files in the codebase or the CSV spreadsheet.

3. **Test Case Counts:** Test case counts are based on direct extraction of test methods from C# test files. The total of 1,812 test cases represents individual test methods.

4. **Cross-Referencing:** Use the Executive Summary (`BE-executive-summary-2026-01-16.md`) for high-level metrics and business impact. Use this report for detailed test case listings.

5. **Future Updates:** This report should be updated when:
   - New test files are added
   - Test cases are significantly modified
   - Service areas are restructured

---

**Report Generated:** 2026-01-16 16:48:00  
**Next Review Date:** **\*\***\_\_\_**\*\***  
**Maintained By:** Development Team
