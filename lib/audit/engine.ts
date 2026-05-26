import { getLivePricing, ParsedPricingRegistry, PlanPricing } from '../pricing/parser';

export type UseCase = 'coding' | 'writing' | 'research' | 'data' | 'mixed';

export type RecommendationType = 'downgrade' | 'consolidate' | 'switch' | 'credits' | 'optimal';

export type Severity = 'high' | 'medium' | 'low' | 'optimal';

// Constants
export const DEFAULT_SWITCH_THRESHOLD = 0.3; // 30% savings threshold for vendor switching
export const CAPABILITY_MATCH_THRESHOLD = 0.8; // 80% capability match required
export const FEATURE_COVERAGE_THRESHOLD = 0.9; // 90% feature coverage

export interface InputToolData {
  toolId: string; // 'cursor', 'copilot', 'chatgpt', 'claude', 'anthropic_api', 'openai_api', 'gemini', 'gemini_api', 'windsurf', 'v0'
  planId: string; // plan IDs normalized to lowercase, e.g. 'hobby', 'pro', 'business', 'team', 'plus', 'pro+', 'api'
  seats: number;
  enteredMonthlySpend: number;
}

export interface AuditInput {
  teamSize: number;
  useCase: UseCase;
  tools: InputToolData[];
  hasComplianceNeeds?: boolean;
  requiresHIPAA?: boolean;
  requiresSSO?: boolean;
  isBuildingProductOnAPI?: boolean;
}

export interface AuditResult {
  toolId: string;
  toolName: string;
  currentPlanName: string;
  currentSpend: number;
  optimizedSpend: number;
  savings: number;
  annualSavings: number;
  severity: Severity;
  recommendationType: RecommendationType;
  recommendation: string;
  confidence: number;
  capabilityGap?: string[];
  creditFlag?: boolean;
  creditMessage?: string;
  actionDetails?: {
    actionType: string;
    targetPlanName?: string;
    seatSavings?: number;
    reason: string;
  };
}

export interface AggregateAudit {
  totalCurrentSpend: number;
  totalOptimizedSpend: number;
  monthlySavings: number;
  annualSavings: number;
  overallSeverity: Severity;
  showCredexBanner: boolean;
  zeroStateMessage?: string;
  results: AuditResult[];
  aiSummary?: string;
}

/**
 * Standardizes tool display names from IDs
 */
function getToolDisplayName(toolId: string): string {
  const mapping: Record<string, string> = {
    cursor: 'Cursor',
    copilot: 'GitHub Copilot',
    chatgpt: 'ChatGPT',
    claude: 'Claude',
    anthropic_api: 'Anthropic API Direct',
    openai_api: 'OpenAI API Direct',
    gemini: 'Gemini',
    gemini_api: 'Gemini API Direct',
    windsurf: 'Windsurf',
    v0: 'v0',
  };
  return mapping[toolId] || toolId;
}

/**
 * Deterministic Audit Recommendation Engine
 */
export async function runAudit(input: AuditInput): Promise<AggregateAudit> {
  const registry = await getLivePricing();
  const results: AuditResult[] = [];
  
  // Track tools in stack for cross-tool redundancy detection
  const hasTool = (id: string) => input.tools.some(t => t.toolId === id && t.seats > 0);
  const getToolData = (id: string) => input.tools.find(t => t.toolId === id);

  const hasCursor = hasTool('cursor');
  const hasCopilot = hasTool('copilot');
  const hasChatGPT = hasTool('chatgpt');
  const hasClaude = hasTool('claude');
  const hasAnthropicAPI = hasTool('anthropic_api');
  const hasOpenAIAPI = hasTool('openai_api');
  const hasWindsurf = hasTool('windsurf');
  const hasV0 = hasTool('v0');

  for (const item of input.tools) {
    const { toolId, planId, seats, enteredMonthlySpend } = item;
    
    // Default fallback values
    const displayName = getToolDisplayName(toolId);
    let optimizedSpend = enteredMonthlySpend;
    let recType: RecommendationType = 'optimal';
    let reason = 'Your current subscription plan is optimal for your usage profile.';
    let confidence = 0.95;
    let capGap: string[] | undefined;
    let creditFlag = false;
    let creditMessage = '';
    let actionType = 'keep';
    let targetPlanName = '';

    // Retrieve live pricing records
    const registryName = displayName;
    const toolPricing = registry.tools[registryName];
    const planPricing = toolPricing?.plans[planId.toLowerCase()];

    // Core calculations
    const officialPrice = planPricing ? planPricing.numericPrice : 0;
    const expectedSpend = officialPrice >= 0 ? officialPrice * seats : enteredMonthlySpend;
    
    // Always respect actual user-entered spend (trust user spend)
    const actualSpend = enteredMonthlySpend;

    // Detect pricing discrepancies (negotiated contracts, annual billing, etc.)
    const isDiscrepancy = officialPrice >= 0 && !planPricing?.isCustom && actualSpend !== expectedSpend;

    // ----------------------------------------------------
    // API / USAGE-BASED TOOLS Logic
    // ----------------------------------------------------
    if (toolId.endsWith('_api')) {
      // 1. Cross-API Redundancy/Consolidation Logic
      const apisInStack = input.tools.filter(t => 
        t.toolId.endsWith('_api') && 
        t.toolId !== toolId && 
        Number(t.enteredMonthlySpend || 0) > 0
      );

      if (apisInStack.length > 0) {
        const hasGeminiAPI = hasTool('gemini_api');
        const hasOpenAIAPI = hasTool('openai_api');

        if ((toolId === 'openai_api' || toolId === 'anthropic_api') && hasGeminiAPI) {
          recType = 'consolidate';
          actionType = 'switch_api';
          optimizedSpend = Math.round(actualSpend * 0.60); // 40% savings
          reason = `Multi-API Overlap: Your team is utilizing both ${displayName} and Gemini API. Optimize direct compute by standardizing high-throughput, non-reasoning agent requests on Gemini Flash API (which is up to 10x cheaper), reducing your ${displayName} monthly costs by 40%.`;
          confidence = 0.92;
        } else if (toolId === 'openai_api' && hasTool('anthropic_api')) {
          recType = 'consolidate';
          actionType = 'switch_api';
          optimizedSpend = Math.round(actualSpend * 0.80); // 20% savings
          reason = `Multi-API Overlap: Your team is utilizing both OpenAI and Anthropic APIs. Optimize costs by leveraging Anthropic's prompt caching for recurring system prompts, reducing your OpenAI API monthly costs by 20%.`;
          confidence = 0.90;
        } else if (toolId === 'anthropic_api' && hasOpenAIAPI) {
          recType = 'consolidate';
          actionType = 'switch_api';
          optimizedSpend = Math.round(actualSpend * 0.85); // 15% savings
          reason = `Multi-API Overlap: Your team is utilizing both Anthropic and OpenAI APIs. Optimize costs by routing brief structural inputs to OpenAI's cheaper GPT-4o mini tier, reducing your Anthropic API monthly costs by 15%.`;
          confidence = 0.88;
        }
      }

      // 2. Credits Flag for high-spend APIs (respecting any optimized spend calculated above)
      if (optimizedSpend >= 300) {
        creditFlag = true;
        creditMessage = 'Save up to 30% on direct API compute costs by routing payments through Credex infrastructure credits.';
        const prevReason = recType !== 'optimal' ? (reason + " Furthermore, ") : "";
        optimizedSpend = Math.round(optimizedSpend * 0.70); // additional 30% savings via Credex credits
        recType = 'credits';
        actionType = 'credits';
        reason = `${prevReason}your remaining API spend qualifies for Credex bulk credits. By acquiring credits, you could reduce monthly costs to $${optimizedSpend} without changing models.`;
        confidence = 0.98;
      } else if (actualSpend >= 300 && recType === 'optimal') {
        creditFlag = true;
        creditMessage = 'Save up to 30% on direct API compute costs by routing payments through Credex infrastructure credits.';
        optimizedSpend = Math.round(actualSpend * 0.70); // 30% savings via Credex credits
        recType = 'credits';
        actionType = 'credits';
        reason = `Your API spend qualifies for Credex bulk credits. By acquiring credits, you could reduce monthly costs to $${optimizedSpend} without changing models.`;
        confidence = 0.98;
      }
      
      results.push({
        toolId,
        toolName: displayName,
        currentPlanName: 'API Direct',
        currentSpend: actualSpend,
        optimizedSpend,
        savings: actualSpend - optimizedSpend,
        annualSavings: (actualSpend - optimizedSpend) * 12,
        severity: (actualSpend - optimizedSpend) > 200 ? 'high' : (actualSpend - optimizedSpend) >= 50 ? 'medium' : 'optimal',
        recommendationType: recType,
        recommendation: reason,
        confidence,
        creditFlag,
        creditMessage,
        actionDetails: {
          actionType,
          reason,
        }
      });
      continue;
    }

    // ----------------------------------------------------
    // PLAN-SEAT FIT & DOWNGRADE ENGINE
    // ----------------------------------------------------
    const isEnterprise = planId.toLowerCase() === 'enterprise';
    const isTeam = ['team', 'team standard', 'team premium', 'business', 'teams'].includes(planId.toLowerCase());

    // 1. Enterprise minimum seat mis-tier checks (e.g. Claude Enterprise, ChatGPT Enterprise require huge commitments)
    if (isEnterprise && seats < 15 && !input.hasComplianceNeeds && !input.requiresHIPAA && !input.requiresSSO) {
      recType = 'downgrade';
      actionType = 'downgrade';
      
      // Determine lower tier target
      let targetPlan = 'Pro';
      let lowerPrice = 20;
      
      if (toolId === 'chatgpt') {
        targetPlan = 'Team';
        lowerPrice = 23.45;
      } else if (toolId === 'claude') {
        targetPlan = 'Team Standard';
        lowerPrice = 25;
      } else if (toolId === 'cursor') {
        targetPlan = 'Business';
        lowerPrice = 40;
      }
      
      optimizedSpend = lowerPrice * seats;
      targetPlanName = targetPlan;
      reason = `Enterprise compliance features may be underutilized for a small team of ${seats}. Downgrading to the ${targetPlan} plan yields significant savings.`;
      confidence = 0.90;
      capGap = ['SAML SSO', 'Audit Logs', 'HIPAA compliance guarantees'];
    }
    
    // 2. Small teams on Team/Business plans (SSO / Admin features underutilized for ≤ 2 seats)
    else if (isTeam && seats <= 2) {
      recType = 'downgrade';
      actionType = 'downgrade';
      
      let targetPlan = 'Pro';
      let lowerPrice = 20;
      
      if (toolId === 'chatgpt') {
        targetPlan = 'Plus';
        lowerPrice = 20;
      } else if (toolId === 'claude') {
        targetPlan = 'Pro';
        lowerPrice = 17;
      } else if (toolId === 'copilot') {
        targetPlan = 'Pro';
        lowerPrice = 10;
      }
      
      optimizedSpend = lowerPrice * seats;
      targetPlanName = targetPlan;
      reason = `A tiny team of ${seats} does not need team seat administration. Individual ${targetPlan} licenses cover identical model outputs.`;
      confidence = 0.92;
    }
    
    // 3. Large teams on Individual plans (Operational security check - no savings but high administrative recommendation)
    else if (seats > 50 && ['plus', 'pro', 'pro+', 'individual'].includes(planId.toLowerCase())) {
      recType = 'optimal'; // Not a spend saving but operational improvement
      actionType = 'upgrade_recommendation';
      
      let targetPlan = 'Business';
      if (toolId === 'chatgpt' || toolId === 'claude') targetPlan = 'Team';
      
      reason = `A large cohort of ${seats} seats on fragmented individual plans poses security risks. We recommend centralizing administration on a ${targetPlan} tier.`;
      confidence = 0.85;
    }

    // 4. Same-vendor downgrade rule: Writing/research users underutilize advanced controls
    else if (['writing', 'research'].includes(input.useCase) && isTeam && toolId === 'claude') {
      // Claude Team standard is $25. Claude Pro is $17. Both have access to Sonnet/Opus models.
      recType = 'downgrade';
      actionType = 'downgrade';
      targetPlanName = 'Pro';
      optimizedSpend = 17 * seats;
      reason = 'For primary writing and research workflows, individual Claude Pro accounts provide similar core model access without team licensing costs.';
      confidence = 0.88;
    }

    // ----------------------------------------------------
    // CROSS-TOOL REDUNDANCY ENGINE
    // ----------------------------------------------------
    
    // Redundancy 1: GitHub Copilot + Cursor (Major overlapping engineering editors)
    if (toolId === 'copilot' && hasCursor && input.useCase === 'coding') {
      recType = 'consolidate';
      actionType = 'remove';
      optimizedSpend = 0;
      reason = 'Redundancy Alert: Your engineers are utilizing both Cursor and Copilot. Cursor includes a native built-in editor Copilot, making separate GitHub Copilot seats unnecessary.';
      confidence = 0.96;
      capGap = ['GitHub Copilot CLI integration outside the editor'];
    }
    
    // Redundancy 2: Generalized Assistant Redundancy (ChatGPT, Claude, Gemini)
    else if (['chatgpt', 'claude', 'gemini'].includes(toolId) && ['writing', 'research', 'mixed'].includes(input.useCase)) {
      const getPlanCategory = (pId: string) => {
        const p = pId.toLowerCase();
        if (p === 'enterprise') return 'enterprise';
        if (['team', 'team standard', 'team premium', 'business', 'teams'].includes(p)) return 'team';
        return 'individual';
      };
      
      const currentPlanCategory = getPlanCategory(planId);
      const assistantsInStack = input.tools.filter(t => 
        ['chatgpt', 'claude', 'gemini'].includes(t.toolId) && 
        t.seats > 0 &&
        t.toolId !== toolId &&
        getPlanCategory(t.planId) === currentPlanCategory
      );

      if (assistantsInStack.length > 0) {
        const hasClaudeInStack = assistantsInStack.some(t => t.toolId === 'claude') || (toolId === 'claude');
        const hasGPTInStack = assistantsInStack.some(t => t.toolId === 'chatgpt') || (toolId === 'chatgpt');

        if (toolId !== 'claude' && hasClaudeInStack) {
          if (toolId === 'chatgpt') {
            // Keep 20% of seats for ChatGPT edge cases, reduce 80% to Claude
            recType = 'consolidate';
            actionType = 'seat_reduction';
            const retainedSeats = Math.max(1, Math.round(seats * 0.20));
            const pricePerSeat = officialPrice > 0 ? officialPrice : 20;
            optimizedSpend = retainedSeats * pricePerSeat;
            reason = `Redundancy Alert: Your team is utilizing both Claude and ChatGPT on equivalent ${currentPlanCategory} tiers. We recommend standardizing 80% of your chat seats on Claude, retaining ChatGPT only for specific web-browsing or custom GPT tasks.`;
            confidence = 0.90;
          } else if (toolId === 'gemini') {
            // Remove Gemini entirely in favor of Claude
            recType = 'consolidate';
            actionType = 'remove';
            optimizedSpend = 0;
            reason = `Redundancy Alert: Your team is utilizing both Claude and Gemini on equivalent ${currentPlanCategory} tiers. Standardize on Claude to eliminate overlapping assistant subscriptions.`;
            confidence = 0.94;
          }
        } else if (toolId === 'gemini' && hasGPTInStack) {
          // Remove Gemini in favor of ChatGPT
          recType = 'consolidate';
          actionType = 'remove';
          optimizedSpend = 0;
          reason = `Redundancy Alert: Your team is utilizing both ChatGPT and Gemini on equivalent ${currentPlanCategory} tiers. Standardize on ChatGPT to eliminate overlapping assistant subscriptions.`;
          confidence = 0.92;
        }
      }
    }

    // Redundancy 3: Windsurf + Cursor (Dual AI coding editors)
    else if (toolId === 'windsurf' && hasCursor && input.useCase === 'coding') {
      recType = 'consolidate';
      actionType = 'remove';
      optimizedSpend = 0;
      reason = 'Double editor stack. Windsurf and Cursor are both premium AI-native IDEs. Standardize your engineering team on a single editor to eliminate double licensing.';
      confidence = 0.95;
    }

    // ----------------------------------------------------
    // ALTERNATIVE TOOL RECOMMENDATIONS (SWITCHING)
    // ----------------------------------------------------
    
    // Switch Rule: Copilot Pro+ ($39) -> Cursor Pro ($20) / Copilot Pro ($10)
    else if (toolId === 'copilot' && planId.toLowerCase() === 'pro+' && input.useCase === 'coding') {
      const pctSavings = (actualSpend - (10 * seats)) / actualSpend;
      if (pctSavings >= DEFAULT_SWITCH_THRESHOLD) {
        recType = 'switch';
        actionType = 'switch';
        targetPlanName = 'GitHub Copilot Pro';
        optimizedSpend = 10 * seats;
        reason = 'Standard Copilot Pro covers essential completions. Switching from Pro+ to standard Copilot Pro saves over 70% with negligible feature loss.';
        confidence = 0.94;
        capGap = ['Heavy agent-mode credit pools'];
      }
    }
    
    // Switch Rule: Gemini Ultra ($67.70 or $203.10) -> Claude Pro ($17) / ChatGPT Plus ($20)
    else if (toolId === 'gemini' && planId.toLowerCase().includes('ultra') && ['writing', 'research', 'mixed'].includes(input.useCase)) {
      recType = 'switch';
      actionType = 'switch';
      targetPlanName = 'Claude Pro';
      optimizedSpend = 17 * seats;
      reason = 'Switching to Claude Pro delivers top-tier writing and research capabilities at a fraction of the cost of premium Gemini Ultra subscriptions.';
      confidence = 0.92;
    }

    // ----------------------------------------------------
    // CREDEX BRAND CHECK
    // ----------------------------------------------------
    // If no action was taken, but the tool is supported by Credex and spend is high
    const supportsCredex = ['cursor', 'claude', 'chatgpt'].includes(toolId);
    if (recType === 'optimal' && supportsCredex && actualSpend >= 200) {
      creditFlag = true;
      creditMessage = `Reduce your active retail ${displayName} costs by up to 25% through Credex bulk licensing options.`;
    }

    // Standardize safety check (cannot have optimized spend higher than actual spend unless it is a recommended upgrade)
    if (actionType !== 'upgrade_recommendation' && optimizedSpend > actualSpend) {
      optimizedSpend = actualSpend;
    }

    const savings = actualSpend - optimizedSpend;
    
    // Determine tool severity
    let severity: Severity = 'optimal';
    if (savings > 200) severity = 'high';
    else if (savings >= 50) severity = 'medium';
    else if (savings > 0) severity = 'low';

    results.push({
      toolId,
      toolName: displayName,
      currentPlanName: planPricing ? planPricing.planName : planId,
      currentSpend: actualSpend,
      optimizedSpend,
      savings,
      annualSavings: savings * 12,
      severity,
      recommendationType: recType,
      recommendation: savings > 0 ? reason : 'Your stack is fully optimized for this tool. No modifications needed.',
      confidence,
      capabilityGap: savings > 0 ? capGap : undefined,
      creditFlag,
      creditMessage: creditFlag ? creditMessage : undefined,
      actionDetails: {
        actionType,
        targetPlanName: targetPlanName || undefined,
        seatSavings: savings > 0 && seats > 0 ? seats : undefined,
        reason,
      }
    });
  }

  // Calculate Aggregates
  const totalCurrentSpend = results.reduce((acc, curr) => acc + curr.currentSpend, 0);
  const totalOptimizedSpend = results.reduce((acc, curr) => acc + curr.optimizedSpend, 0);
  const monthlySavings = totalCurrentSpend - totalOptimizedSpend;
  const annualSavings = monthlySavings * 12;

  const anyHigh = results.some(r => r.severity === 'high');
  const anyMedium = results.some(r => r.severity === 'medium');
  const allOptimal = results.every(r => r.severity === 'optimal');

  let overallSeverity: Severity = 'optimal';
  if (anyHigh) overallSeverity = 'high';
  else if (anyMedium) overallSeverity = 'medium';
  else if (!allOptimal) overallSeverity = 'low';

  const showCredexBanner = overallSeverity === 'high' || monthlySavings > 150;
  
  let zeroStateMessage: string | undefined;
  if (allOptimal && monthlySavings === 0) {
    zeroStateMessage = 'Outstanding setup! Your active AI stack is fully optimized. Every subscription matches your team size and use cases flawlessly.';
  }

  return {
    totalCurrentSpend,
    totalOptimizedSpend,
    monthlySavings,
    annualSavings,
    overallSeverity,
    showCredexBanner,
    zeroStateMessage,
    results
  };
}
