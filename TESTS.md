# TESTS.md — Test Suite Directory & Coverage

This document outlines the test suite structure, coverage reports, and instructions to execute automated validations for the CredAI audit engine.

## How to Run Tests
The repository is equipped with **Vitest**, a high-performance next-generation testing framework. 

To execute the tests locally:
```bash
# Run all tests once
npm test

# Run tests in watch/interactive mode
npm run test:watch
```

---

## Active Test Files

### 1. `tests/pricing.test.ts`
Verifies that the live pricing parser programmatically reads, splits, and accurately converts the `PRICING_DATA.md` markdown file into schema-compliant records at runtime.

* **Test Case 1:** `should parse the markdown file and correctly extract all tool pricing`
  - Validates that standard lists, URL boundaries, and date tokens are parsed.
  - Asserts that special non-integer prices (like Claude Pro at $17/mo or Gemini Pro at $20.30/mo) are extracted as precise decimals.
  - Verifies custom plans are marked `isCustom: true`.
* **Test Case 2:** `should parse the API tokens correctly`
  - Asserts input/output token pricing per million is successfully extracted for Anthropic (Opus/Sonnet/Haiku) and OpenAI (GPT-5.5/5.4) models.

### 2. `tests/audit.test.ts`
Tests the core business logic engine, checking plan-seat fits, same-vendor downgrades, cross-tool redundancies, and alternative options.

* **Test Case 1:** `should detect Copilot + Cursor redundancy and recommend consolidating to Cursor`
  - Simulates a developer team paying for both Copilot and Cursor, asserting that 100% of the Copilot spend is surfaced as savings with a custom explanation.
* **Test Case 2:** `should detect ChatGPT Team small seat issues and recommend downgrading to ChatGPT Plus`
  - Simulates a 1-person team paying for ChatGPT Team, recommending individual Plus licenses to avoid ghost seat fees.
* **Test Case 3:** `should detect ChatGPT + Claude redundancy and reduce ChatGPT seats`
  - Asserts that overlapping general chat assistants trigger an 80% seat reduction recommendation for ChatGPT, standardizing on Claude.
* **Test Case 4:** `should flag high API usage for direct Credex discount credits`
  - Asserts that direct API bills above $300/mo trigger the `creditFlag` and calculate a 30% savings rate through Credex credits.
* **Test Case 5:** `should deliver an honest zero state for a fully optimized stack`
  - Asserts that an already-optimized stack yields $0 savings, triggers `optimal` overall severity, and displays our authentic zero-state congratulatory message.

---

## Test Automation Metrics
- **Test Framework:** Vitest
- **Total Tests:** 7 active unit tests
- **Coverage Target:** 100% coverage on core pricing parser and audit engine logical rules.
