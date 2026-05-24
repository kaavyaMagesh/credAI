export function generateFallbackSummary(result: any, teamSize: number, useCase: string): string {
  const savings = result.monthlySavings;
  const annualSavings = result.annualSavings;

  let summary = '';

  if (savings === 0) {
    summary = `Your tech stack is currently running at peak economic efficiency. With a team size of ${teamSize} focusing on ${useCase}, no overlapping redundancies or seat mis-licensing were detected. We recommend keeping your current configuration intact.`;
  } else {
    // Collect active recommendations
    const dynamicRecs = result.results
      .filter((r: any) => r.savings > 0)
      .map((r: any) => `${r.toolName} (${r.recommendationType})`);

    const recsList = dynamicRecs.length > 0 ? dynamicRecs.join(', ') : 'license consolidation';

    summary = `Our deterministic audit has identified notable cost-saving opportunities across your stack, specifically involving ${recsList}. With a team size of ${teamSize} and a use case focusing on ${useCase}, addressing these tier mismatches and redundancies will immediately reduce your monthly spend from $${result.totalCurrentSpend} to $${result.totalOptimizedSpend}. Standardizing your configuration is projected to recover $${savings}/mo, leading to an direct annual savings of $${annualSavings} with zero impact on operational productivity.`;
  }

  return summary;
}
