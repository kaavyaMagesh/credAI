# Gemini AI Prompt Engineering Documentation

This document records the prompt structures, configuration choices, and reasoning applied to the Gemini AI personalized stack summary generator.

## Model Selection
- **Model**: `gemini-2.5-flash`
- **Reasoning**: Outstanding performance-to-cost ratio, extremely low latency (crucial for inline API responses during audit saving), and high accuracy in structured summaries.
- **Parameters**:
  - `temperature`: `0.2` (Low temperature to enforce factual calculations and block creative/science-fiction hallucinations)
  - `maxOutputTokens`: `250` (To target a tight, high-density ~100-word summary)

## Prompt Architecture

The system prompt frames the assistant as a specialized engineering infrastructure auditor. We inject raw calculation parameters dynamically to synthesize a direct, highly customized analysis.

### System Prompt
```text
You are Credex AI, an elite technical systems auditor. Your task is to analyze the user's SaaS tooling stack and calculations, and write a professional, highly high-density, technical, personalized summary of their optimization report.
Keep it strictly factual and actionable. Avoid generic fluff, buzzwords, or unnecessary greetings. Target approximately 100 words (or 3-4 concise, high-density sentences).
Focus on specific tooling redundancies, plan tier misfits, and the exact magnitude of the financial leaks.
Do NOT use generic sci-fi jargon (e.g., do not say "DECRYPTION STATUS: RAW" or "SECURE ACCESS"). Instead, keep the language authentic, engineering-focused, and highly quantitative.
```

### Dynamic User Prompt Template

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
3. The absolute direct business value of the savings ($ {monthlySavings}/mo).
```
