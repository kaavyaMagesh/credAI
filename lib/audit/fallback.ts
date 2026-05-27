export function generateFallbackSummary(
  result: any, 
  teamSize: number, 
  useCase: string,
  hasComplianceNeeds?: boolean,
  requiresHIPAA?: boolean,
  requiresSSO?: boolean
): string {
  const savings = result.monthlySavings;
  const annualSavings = result.annualSavings;
  const hasCompliance = hasComplianceNeeds || requiresHIPAA || requiresSSO;

  let summary = '';

  const economicSafeguards = result.results.filter(
    (r: any) => r.savings === 0 && r.currentPlanName.toLowerCase() === 'enterprise' && r.currentSpend > 0
  );

  if (savings === 0) {
    if (hasCompliance) {
      const details = [];
      if (hasComplianceNeeds) details.push('SOC2/ISO compliance guidelines');
      if (requiresHIPAA) details.push('HIPAA regulatory restrictions');
      if (requiresSSO) details.push('SAML SSO user management');
      
      summary = `Your tech stack is currently running at peak operational security. Because active compliance controls (${details.join(', ')}) are enabled, standard individual or team plan downgrades are safely bypassed to preserve mandatory enterprise security profiles and prevent policy gaps.`;
    } else {
      summary = `Your tech stack is currently running at peak economic efficiency. With a team size of ${teamSize} focusing on ${useCase}, no overlapping redundancies or seat mis-licensing were detected. We recommend keeping your current configuration intact.`;
    }
  } else {
    // Collect active recommendations
    const dynamicRecs = result.results
      .filter((r: any) => r.savings > 0)
      .map((r: any) => `${r.toolName} (${r.recommendationType})`);

    const recsList = dynamicRecs.length > 0 ? dynamicRecs.join(', ') : 'license consolidation';

    summary = `Our deterministic audit has identified notable cost-saving opportunities across your stack, specifically involving ${recsList}. With a team size of ${teamSize} and a use case focusing on ${useCase}, addressing these tier mismatches and redundancies will immediately reduce your monthly spend from $${result.totalCurrentSpend} to $${result.totalOptimizedSpend}. Standardizing your configuration is projected to recover $${savings}/mo, leading to a direct annual savings of $${annualSavings} with zero impact on operational productivity.`;
    
    if (hasCompliance) {
      summary += ` Note: Active SAML SSO and compliance dependencies were recognized and preserved, maintaining enterprise tiers where security downgrades are impossible.`;
    }
  }

  if (economicSafeguards.length > 0) {
    const names = economicSafeguards.map((r: any) => r.toolName).join(', ');
    summary += ` Additionally, our economic safeguard rules identified that your custom ${names} contract is highly optimized; standard retail downgrades were bypassed since they would actually increase your monthly expenses.`;
  }

  return summary;
}

