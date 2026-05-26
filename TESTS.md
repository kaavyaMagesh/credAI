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

### 2. `tests/ai.test.ts`
Verifies the server-side fallback AI text generation logic when the Gemini API is unconfigured or rate-limited.

* **Test Case 1:** `should generate an appropriate optimized summary for zero savings`
  - Verifies that when a stack is fully optimized (savings = $0), a mathematically sound, structured summary of "peak economic efficiency" is compiled.
* **Test Case 2:** `should generate a rich synthesis summary for non-zero savings`
  - Asserts that when stack leakages are present, a quantitative synthesis report is dynamically built outlining exact plan tiers, direct savings numbers, and consolidation actions.

### 3. `tests/audit.test.ts`
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
* **Test Case 6:** `should detect Claude Pro + Gemini Pro redundancy and recommend standardizing on Claude Pro`
  - Asserts that holding both premium chat assistants triggers Gemini consolidation to save money while retaining Claude Pro.
* **Test Case 7:** `should detect OpenAI API + Gemini API overlap and recommend standardizing non-reasoning agent requests on Gemini API`
  - Asserts standardizing high-throughput API agent workloads on cheaper Gemini API endpoints while retaining OpenAI for critical items.

### 4. `tests/abuse.test.ts`
Validates security mechanisms, rate limiting behaviors, and bot deflection controls.

* **Test Case 1:** `Rate Limiter - should allow up to 5 requests in a window and then rate limit`
  - Asserts that the IP-based rate limiter permits a maximum of 5 requests in a 10-minute window, blocking any subsequent calls.
* **Test Case 2:** `Rate Limiter - should track rate limits independently by IP address`
  - Asserts that rate limiting metrics are isolated per client IP address.
* **Test Case 3:** `Honeypot Bot Trap - should immediately deflect a bot request if website honeypot is populated`
  - Asserts that when a bot auto-fills the hidden `website` input field, the endpoint intercepts the request, blocks database insertion, and returns a dummy `mock-bot-slug` response instantly.

---

## Test Automation Metrics
- **Test Framework:** Vitest
- **Total Tests:** 14 active assertions
- **Coverage Target:** 100% coverage on core pricing parser, audit engine rules, rate limiters, and bot traps.

---

## 3. Third-Party Sandbox & Credentials Verification Guide

To help reviewers test and audit the live integrations without crashing, `credAI` incorporates highly resilient graceful fallbacks for all third-party services:

### 1. Database Connectivity (Supabase RLS)
*   **Offline Mock Mode**: If `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are not set in `.env.local` or the deployment dashboard, the server operates in a secure mock offline mode—storing temporary assets under `/audit/mock-demo-slug`.
*   **Production Dynamic Mode**: Once real credentials are set up, all submissions securely save and generate a unique dynamic UUID slug (e.g. `/audit/7b941d24-34fd-4ab1-8e9a-58fde56a8e8e`).
*   **RLS Security Policy**: Ensure you run the `Allow anonymous updates on audits` RLS UPDATE policy in your Supabase SQL Editor to authorize client-side feedback logging.

### 2. Synthesis Reports (Gemini LLM)
*   **Fallback Template**: If no `GEMINI_API_KEY` is present or if API rate limits are reached, the server-side compiler dynamically generates a mathematically aligned, grammatically sound fallback report to guarantee 100% uptime.
*   **Active Mode**: If a key is present, it directly queries the `gemini-2.5-flash` endpoint to generate high-density, quantitative summaries.

### 3. Transactional Emails (Resend Free Sandbox Tier)
*   **Local Sandbox Testing Restriction**: When using a free Resend developer sandbox key (`re_...`), Resend **strictly blocks** outbound emails to external domains. Emails will **only** deliver if sent to the **exact email address used to register the Resend account**.
*   **Production Execution**: In a production environment, verifying a custom branded domain (e.g. `credex.ai` or `getcredai.com`) instantly unlocks global delivery to any target email.
