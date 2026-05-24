# Gemini AI Prompt Engineering Documentation

This document records the prompt structures, configuration choices, and reasoning applied to the Gemini AI personalized stack summary generator, detailing our prompt iterations, structural choices, and failed experiments.

## Model Selection & Configurations
- **Model**: `gemini-2.5-flash`
- **Reasoning**: Outstanding performance-to-cost ratio, extremely low latency (crucial for inline API responses during audit saving), and high accuracy in structured summaries.
- **Parameters**:
  - `temperature`: `0.2` (Low temperature to enforce factual calculations and block creative/science-fiction hallucinations)
  - `maxOutputTokens`: `1024` (To allow the model sufficient generation buffer for larger, complex audit tables without truncation)

---

## The Production Prompts

These are the exact prompts currently executing inside the dynamic `/api/audit/save` endpoint to generate the customized, high-density engineering summaries:

### 1. The System Prompt
```text
You are Credex AI, an elite technical systems auditor. Your task is to analyze the user's SaaS tooling stack and calculations, and write a professional, highly high-density, technical, personalized summary of their optimization report.

Keep it strictly factual and actionable. Avoid generic fluff, buzzwords, or unnecessary greetings. Target approximately 100 words (or 3-4 concise, high-density sentences).

Focus on specific tooling redundancies, plan tier misfits, and the exact magnitude of the financial leaks.

Do NOT use generic sci-fi jargon. Instead, keep the language authentic, engineering-focused, and highly quantitative.
```

### 2. The Dynamic User Prompt Template
```text
Audit Context:
- Team Size: {teamSize}
- Primary Use Case: {useCase}
- Total Current Monthly Spend: ${totalCurrentSpend}
- Total Optimized Monthly Spend: ${totalOptimizedSpend}
- Total Monthly Savings: ${monthlySavings} (Annualized: ${annualSavings})
- Overall Stack Severity: {overallSeverity}

Detailed Tool Audits:
{detailedToolSummaries}

Provide a ~100-word quantitative synthesis report detailing:
1. Exactly what is leaking (e.g., specific redundancies like Copilot/Cursor overlap, plan tier misfits like tiny teams on enterprise plans, or direct API spends over $300 eligible for Credex credits).
2. The concrete optimization action recommended.
3. The absolute direct business value of the savings (${monthlySavings}/mo).
```

---

## Why We Wrote Them This Way (Design Rationale)

1. **Role Prompting ("Elite Technical Systems Auditor"):**
   Setting a precise context prevents the LLM from writing generalized customer service copy. It forces the terminology to be authentic to DevOps and software engineering, talking in terms of "licensing consolidation," "overlapping developer environments," and "unused seats."
2. **Dynamic Data Injection:**
   Rather than letting the LLM read raw, unstructured input files, we pre-compile the inputs into a highly structured schema (`Audit Context` and `Detailed Tool Audits`). This guides the attention layer of the attention mechanism to focus specifically on the numerical discrepancies and exact product recommendations.
3. **Hyper-Specific Negative Constraints:**
   We explicitly banned conversational fluff (e.g., "Hello," "Welcome to your report") and generic sci-fi jargon. Keeping the copy dry, quantitative, and engineering-focused establishes institutional trust with CTOs and CFOs.

---

## What We Tried That Didn't Work (Our Prompt Engineering Iterations)

During our prompt engineering iterations, we encountered visual and API performance blockers that required adjusting our constraints:

### Unconstrained Length (High-Latency and Layout Overflow)
* **What We Tried:** We initially did not specify a strict target word count or restrict the length of the generated summary, allowing the LLM to write a detailed, multi-paragraph analysis of each SaaS tool.
* **Why It Failed:** This introduced two critical bottlenecks:
  1. **Latency:** Generation times peaked at 4–5 seconds per request. In a fast, modern web app, a 5-second wait when saving an audit feels sluggish and leads to dropped sessions.
  2. **UI Grid Overflow:** The monospace brutalist user interface is designed with rigid containers, absolute borders, and tight visual alignments. Flooding the dashboard with paragraphs of text broke the layout grid, leading to ugly scroll bars and broken visual boundaries.
* **The Fix:** We kept `maxOutputTokens: 1024` to ensure no generation was truncated mid-sentence, but we explicitly instructed the prompt to: *"Target approximately 100 words (or 3-4 concise, high-density sentences)."* This guided the model to maintain structural brevity, which slashed our Gemini API roundtrip latency to under 1 second and kept the generated summary beautifully centered within our monospace brutalist design viewport.
