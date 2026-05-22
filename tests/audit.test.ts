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
});
