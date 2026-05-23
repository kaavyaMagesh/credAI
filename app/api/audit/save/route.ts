import { NextResponse } from 'next/server';
import { runAudit, AuditInput } from '../../../../lib/audit/engine';
import { supabase } from '../../../../lib/db/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { teamSize, useCase, tools, email, companyName, hasComplianceNeeds, requiresHIPAA, requiresSSO } = body;

    if (!teamSize || !useCase || !tools) {
      return NextResponse.json(
        { error: 'Missing required fields: teamSize, useCase, or tools.' },
        { status: 400 }
      );
    }

    // 1. Run the deterministic audit calculations
    const auditInput: AuditInput = {
      teamSize,
      useCase,
      tools,
      hasComplianceNeeds,
      requiresHIPAA,
      requiresSSO
    };

    const calculatedResult = await runAudit(auditInput);

    // 1B. Generate AI personalized summary with Gemini API (or fallback summary)
    let aiSummary = '';
    try {
      if (process.env.GEMINI_API_KEY) {
        aiSummary = await generateAiSummary(calculatedResult, teamSize, useCase);
      } else {
        console.warn('GEMINI_API_KEY is not defined in environment. Triggering fallback template summary.');
        aiSummary = generateFallbackSummary(calculatedResult, teamSize, useCase);
      }
    } catch (aiError: any) {
      console.error('AI Summary generation failed, triggering fallback:', aiError);
      aiSummary = generateFallbackSummary(calculatedResult, teamSize, useCase);
    }
    calculatedResult.aiSummary = aiSummary;

    // 2. Try saving to Supabase (Graceful fallback if keys are missing or database is down)
    let saved = false;
    let slug = 'mock-demo-slug';
    let errorMessage = '';

    const hasSupabaseCreds = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (hasSupabaseCreds) {
      try {
        // A. Insert into audits table
        const { data: auditRow, error: auditError } = await supabase
          .from('audits')
          .insert({
            team_size: teamSize,
            use_case: useCase,
            input_tools: tools,
            results_payload: calculatedResult,
            email: email || null,
            company_name: companyName || null
          })
          .select('id')
          .single();

        if (auditError) throw auditError;

        if (auditRow?.id) {
          slug = auditRow.id;
          saved = true;

          // B. Insert into leads table (linked to the audit if email is provided)
          if (email) {
            const { error: leadError } = await supabase
              .from('leads')
              .insert({
                email,
                company_name: companyName || null,
                team_size: teamSize,
                audit_id: slug
              });

            if (leadError) {
              console.error('Lead storage insertion failed:', leadError);
              // Do not fail the entire audit save if just the lead logger failed
            }
          }
        }
      } catch (dbError: any) {
        console.error('Database connection / insertion failed:', dbError);
        errorMessage = dbError.message || 'Supabase integration failed';
      }
    } else {
      console.warn('Supabase credentials missing from environment. Operating in mock save mode.');
      errorMessage = 'Supabase environment variables are missing.';
    }

    return NextResponse.json({
      success: true,
      saved,
      slug,
      calculatedResult,
      errorMessage: errorMessage || undefined
    });

  } catch (error: any) {
    console.error('Save audit failed:', error);
    return NextResponse.json(
      { error: 'Failed to process and save audit calculations', details: error.message },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------
// AI Personalization Pipeline & Fallbacks
// ----------------------------------------------------

async function generateAiSummary(result: any, teamSize: number, useCase: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  // Format detailed tool summaries for the prompt
  const toolDetails = result.results.map((r: any) => {
    return `- ${r.toolName} (${r.currentPlanName}): Spending $${r.currentSpend}/mo. Recommendation: ${r.recommendationType.toUpperCase()} -> ${r.recommendation} (Savings: $${r.savings}/mo)`;
  }).join('\n');

  const systemInstruction = `You are Credex AI, an elite technical systems auditor. Your task is to analyze the user's SaaS tooling stack and calculations, and write a professional, highly high-density, technical, personalized summary of their optimization report.
Keep it strictly factual and actionable. Avoid generic fluff, buzzwords, or unnecessary greetings. Target approximately 100 words (or 3-4 concise, high-density sentences).
Focus on specific tooling redundancies, plan tier misfits, and the exact magnitude of the financial leaks.
Do NOT use generic sci-fi jargon (e.g., do not say "DECRYPTION STATUS: RAW" or "SECURE ACCESS"). Instead, keep the language authentic, engineering-focused, and highly quantitative.`;

  const prompt = `Audit Context:
- Team Size: ${teamSize}
- Primary Use Case: ${useCase}
- Total Current Monthly Spend: $${result.totalCurrentSpend}
- Total Optimized Monthly Spend: $${result.totalOptimizedSpend}
- Total Monthly Savings: $${result.monthlySavings} (Annualized: $${result.annualSavings})
- Overall Stack Severity: ${result.overallSeverity.toUpperCase()}

Detailed Tool Audits:
${toolDetails}

Provide a ~100-word quantitative synthesis report detailing:
1. Exactly what is leaking (e.g., specific redundancies like Copilot/Cursor overlap, plan tier misfits like tiny teams on enterprise plans, or direct API spends over $300 eligible for Credex credits).
2. The concrete optimization action recommended.
3. The absolute direct business value of the savings ($${result.monthlySavings}/mo).`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      systemInstruction: {
        parts: [
          {
            text: systemInstruction
          }
        ]
      },
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 250
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API returned status ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Invalid Gemini API response structure');
  }

  return text.trim();
}

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
