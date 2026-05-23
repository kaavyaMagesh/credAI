import { describe, it, expect } from 'vitest';
import { generateFallbackSummary } from '../app/api/audit/save/route';

describe('AI Fallback Text Generator', () => {
  it('should generate an appropriate optimized summary for zero savings', () => {
    const mockResult = {
      totalCurrentSpend: 200,
      totalOptimizedSpend: 200,
      monthlySavings: 0,
      annualSavings: 0,
      overallSeverity: 'optimal',
      results: [
        {
          toolId: 'cursor',
          toolName: 'Cursor',
          currentPlanName: 'Pro',
          currentSpend: 200,
          optimizedSpend: 200,
          savings: 0,
          annualSavings: 0,
          severity: 'optimal',
          recommendationType: 'optimal',
          recommendation: 'Your subscription is fully optimized.',
          confidence: 0.95
        }
      ]
    };

    const summary = generateFallbackSummary(mockResult, 10, 'coding');
    expect(summary).toContain('peak economic efficiency');
    expect(summary).toContain('10');
    expect(summary).toContain('coding');
  });

  it('should generate a rich synthesis summary for non-zero savings', () => {
    const mockResult = {
      totalCurrentSpend: 390,
      totalOptimizedSpend: 200,
      monthlySavings: 190,
      annualSavings: 2280,
      overallSeverity: 'medium',
      results: [
        {
          toolId: 'cursor',
          toolName: 'Cursor',
          currentPlanName: 'Pro',
          currentSpend: 200,
          optimizedSpend: 200,
          savings: 0,
          annualSavings: 0,
          severity: 'optimal',
          recommendationType: 'optimal',
          recommendation: 'Your subscription is fully optimized.',
          confidence: 0.95
        },
        {
          toolId: 'copilot',
          toolName: 'GitHub Copilot',
          currentPlanName: 'Business',
          currentSpend: 190,
          optimizedSpend: 0,
          savings: 190,
          annualSavings: 2280,
          severity: 'medium',
          recommendationType: 'consolidate',
          recommendation: 'Redundancy alert: duplicate copilot seat',
          confidence: 0.96
        }
      ]
    };

    const summary = generateFallbackSummary(mockResult, 10, 'coding');
    expect(summary).toContain('notable cost-saving opportunities');
    expect(summary).toContain('GitHub Copilot (consolidate)');
    expect(summary).toContain('reduce your monthly spend from $390 to $200');
    expect(summary).toContain('recover $190/mo');
    expect(summary).toContain('annual savings of $2280');
  });
});
