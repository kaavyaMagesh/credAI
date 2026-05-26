import { describe, it, expect } from 'vitest';
import { runAudit, AuditInput } from '../lib/audit/engine';

describe('Deterministic Audit Engine', () => {
  it('should detect Copilot + Cursor redundancy and recommend consolidating to Cursor', async () => {
    const input: AuditInput = {
      teamSize: 10,
      useCase: 'coding',
      tools: [
        { toolId: 'cursor', planId: 'pro', seats: 10, enteredMonthlySpend: 200 },
        { toolId: 'copilot', planId: 'business', seats: 10, enteredMonthlySpend: 190 },
      ],
    };

    const audit = await runAudit(input);
    
    // Expect total monthly savings to equal the Copilot spend ($190)
    expect(audit.monthlySavings).toBe(190);
    expect(audit.annualSavings).toBe(190 * 12);
    expect(audit.overallSeverity).toBe('medium'); // 190 is medium, boundary is 200
    
    const copilotResult = audit.results.find(r => r.toolId === 'copilot');
    expect(copilotResult).toBeDefined();
    expect(copilotResult!.recommendationType).toBe('consolidate');
    expect(copilotResult!.savings).toBe(190);
    expect(copilotResult!.optimizedSpend).toBe(0);
    expect(copilotResult!.recommendation).toContain('native built-in');
  });

  it('should detect ChatGPT Team small seat issues and recommend downgrading to ChatGPT Plus', async () => {
    const input: AuditInput = {
      teamSize: 2,
      useCase: 'mixed',
      tools: [
        { toolId: 'chatgpt', planId: 'team', seats: 1, enteredMonthlySpend: 30 }, // Single user on Team (often paying minimums or over-provisioned)
      ],
    };

    const audit = await runAudit(input);
    
    // Expect ChatGPT result to show downgrade
    const chatgptResult = audit.results.find(r => r.toolId === 'chatgpt');
    expect(chatgptResult).toBeDefined();
    expect(chatgptResult!.recommendationType).toBe('downgrade');
    // Team $30 down to Plus $20 -> savings $10
    expect(chatgptResult!.savings).toBe(10);
    expect(chatgptResult!.optimizedSpend).toBe(20);
  });

  it('should detect ChatGPT + Claude redundancy and reduce ChatGPT seats', async () => {
    const input: AuditInput = {
      teamSize: 10,
      useCase: 'writing',
      tools: [
        { toolId: 'chatgpt', planId: 'plus', seats: 10, enteredMonthlySpend: 200 },
        { toolId: 'claude', planId: 'pro', seats: 10, enteredMonthlySpend: 170 },
      ],
    };

    const audit = await runAudit(input);
    
    const chatgptResult = audit.results.find(r => r.toolId === 'chatgpt');
    expect(chatgptResult).toBeDefined();
    expect(chatgptResult!.recommendationType).toBe('consolidate');
    // Recommend keeping 20% of ChatGPT seats (10 * 0.20 = 2 seats, so 2 * 20 = $40 optimized spend)
    // Savings = 200 - 40 = $160
    expect(chatgptResult!.savings).toBe(160);
    expect(chatgptResult!.optimizedSpend).toBe(40);
  });

  it('should flag high API usage for direct Credex discount credits', async () => {
    const input: AuditInput = {
      teamSize: 25,
      useCase: 'mixed',
      tools: [
        { toolId: 'openai_api', planId: 'api', seats: 1, enteredMonthlySpend: 1000 },
      ],
    };

    const audit = await runAudit(input);
    
    const apiResult = audit.results.find(r => r.toolId === 'openai_api');
    expect(apiResult).toBeDefined();
    expect(apiResult!.creditFlag).toBe(true);
    expect(apiResult!.recommendationType).toBe('credits');
    // 30% savings off $1000 = $300
    expect(apiResult!.savings).toBe(300);
    expect(apiResult!.optimizedSpend).toBe(700);
    expect(audit.showCredexBanner).toBe(true);
  });

  it('should deliver an honest zero state for a fully optimized stack', async () => {
    const input: AuditInput = {
      teamSize: 5,
      useCase: 'coding',
      tools: [
        { toolId: 'cursor', planId: 'pro', seats: 5, enteredMonthlySpend: 100 },
      ],
    };

    const audit = await runAudit(input);
    
    expect(audit.monthlySavings).toBe(0);
    expect(audit.overallSeverity).toBe('optimal');
    expect(audit.zeroStateMessage).toContain('fully optimized');
    expect(audit.showCredexBanner).toBe(false);
  });

  it('should detect Claude Pro + Gemini Pro redundancy and recommend standardizing on Claude Pro', async () => {
    const input: AuditInput = {
      teamSize: 8,
      useCase: 'mixed',
      tools: [
        { toolId: 'claude', planId: 'pro', seats: 8, enteredMonthlySpend: 136.00 },
        { toolId: 'gemini', planId: 'pro', seats: 8, enteredMonthlySpend: 162.40 },
      ],
    };

    const audit = await runAudit(input);

    // Expect Claude to be optimal and Gemini to be removed (saving $162.40)
    const claudeResult = audit.results.find(r => r.toolId === 'claude');
    const geminiResult = audit.results.find(r => r.toolId === 'gemini');

    expect(claudeResult).toBeDefined();
    expect(claudeResult!.recommendationType).toBe('optimal');

    expect(geminiResult).toBeDefined();
    expect(geminiResult!.recommendationType).toBe('consolidate');
    expect(geminiResult!.savings).toBe(162.40);
    expect(geminiResult!.optimizedSpend).toBe(0);
    expect(geminiResult!.recommendation).toContain('utilizing both Claude and Gemini');

    expect(audit.monthlySavings).toBeCloseTo(162.40);
  });

  it('should detect OpenAI API + Gemini API overlap and recommend standardizing non-reasoning agent requests on Gemini API', async () => {
    const input: AuditInput = {
      teamSize: 10,
      useCase: 'mixed',
      tools: [
        { toolId: 'openai_api', planId: 'api', seats: 1, enteredMonthlySpend: 500 },
        { toolId: 'gemini_api', planId: 'api', seats: 1, enteredMonthlySpend: 100 },
      ],
    };

    const audit = await runAudit(input);

    const openaiApiResult = audit.results.find(r => r.toolId === 'openai_api');
    
    expect(openaiApiResult).toBeDefined();
    expect(openaiApiResult!.recommendationType).toBe('credits');
    // Shifting to Gemini Flash API cuts OpenAI Direct spend by 40% (500 * 0.60 = 300) -> savings = 200
    // Then 300 optimized spend qualifies for Credex bulk credits (300 * 0.7 = 210) -> additional savings = 90
    // Total savings = 200 + 90 = 290
    expect(openaiApiResult!.savings).toBe(290);
    expect(openaiApiResult!.optimizedSpend).toBe(210);
    expect(openaiApiResult!.recommendation).toContain('standardizing high-throughput, non-reasoning agent requests on Gemini Flash API');
  });

  it('should preserve enterprise plan if compliance, HIPAA or SAML SSO requirements are active', async () => {
    const input: AuditInput = {
      teamSize: 8,
      useCase: 'mixed',
      hasComplianceNeeds: true,
      requiresSSO: true,
      tools: [
        { toolId: 'chatgpt', planId: 'enterprise', seats: 8, enteredMonthlySpend: 480 },
      ],
    };

    const audit = await runAudit(input);
    
    // With compliance/SSO needs active, the small-team downgrade is bypassed.
    const result = audit.results.find(r => r.toolId === 'chatgpt');
    expect(result).toBeDefined();
    expect(result!.recommendationType).toBe('optimal');
    expect(result!.savings).toBe(0);
    expect(result!.optimizedSpend).toBe(480);
  });

  it('should recommend downgrading enterprise plans if team size is small and compliance needs are absent', async () => {
    const input: AuditInput = {
      teamSize: 8,
      useCase: 'mixed',
      hasComplianceNeeds: false,
      requiresSSO: false,
      tools: [
        { toolId: 'chatgpt', planId: 'enterprise', seats: 8, enteredMonthlySpend: 480 },
      ],
    };

    const audit = await runAudit(input);
    
    // Without compliance/SSO, the small-team should be downgraded to Team ($23.45/mo per seat).
    // Spend = 8 * 23.45 = $187.60 -> rounded/truncated to $188 or close
    const result = audit.results.find(r => r.toolId === 'chatgpt');
    expect(result).toBeDefined();
    expect(result!.recommendationType).toBe('downgrade');
    expect(result!.optimizedSpend).toBeCloseTo(187.60, 1);
    expect(result!.savings).toBeGreaterThan(0);
  });

  it('should recommend consolidating individual high-tier Max plans to professional Team tiers when multiple seats are active', async () => {
    const input: AuditInput = {
      teamSize: 50,
      useCase: 'coding',
      tools: [
        { toolId: 'claude', planId: 'max', seats: 50, enteredMonthlySpend: 5000 },
      ],
    };

    const audit = await runAudit(input);

    const result = audit.results.find(r => r.toolId === 'claude');
    expect(result).toBeDefined();
    expect(result!.recommendationType).toBe('downgrade');
    // Claude Max ($100/seat) to Claude Team Standard ($25/seat)
    // Spend = 50 * 25 = $1250
    // Savings = 5000 - 1250 = $3750
    expect(result!.optimizedSpend).toBe(1250);
    expect(result!.savings).toBe(3750);
    expect(result!.recommendation).toContain('Claude Team Standard plan');
  });

  it('should dynamically lower the confidence score and append a warning if a pricing discrepancy is detected', async () => {
    const input: AuditInput = {
      teamSize: 1,
      useCase: 'coding',
      tools: [
        { toolId: 'chatgpt', planId: 'plus', seats: 1, enteredMonthlySpend: 17 }, // Plus officially costs $20
      ],
    };

    const audit = await runAudit(input);

    const result = audit.results.find(r => r.toolId === 'chatgpt');
    expect(result).toBeDefined();
    expect(result!.recommendationType).toBe('optimal');
    expect(result!.savings).toBe(0);
    // Standard confidence 0.95 should drop by 0.15 to 0.80 due to the discrepancy
    expect(result!.confidence).toBe(0.80);
    expect(result!.recommendation).toContain('pricing discrepancy');
  });

  it('should flag high retail Gemini usage for direct Credex bulk licensing discount', async () => {
    const input: AuditInput = {
      teamSize: 15,
      useCase: 'mixed',
      tools: [
        { toolId: 'gemini', planId: 'pro', seats: 15, enteredMonthlySpend: 300 },
      ],
    };

    const audit = await runAudit(input);

    const result = audit.results.find(r => r.toolId === 'gemini');
    expect(result).toBeDefined();
    expect(result!.creditFlag).toBe(true);
    expect(result!.creditMessage).toContain('Reduce your active retail Gemini costs');
  });
});


