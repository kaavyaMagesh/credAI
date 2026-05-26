import { NextResponse } from 'next/server';
import { runAudit, AuditInput } from '../../../../lib/audit/engine';
import { supabase } from '../../../../lib/db/supabase';
import { checkRateLimit } from '../../../../lib/abuse/limiter';
import { generateFallbackSummary } from '../../../../lib/audit/fallback';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { teamSize, useCase, tools, email, companyName, role, hasComplianceNeeds, requiresHIPAA, requiresSSO, website, referralCode } = body;

    // 1A. Honeypot check: Bots auto-fill 'website'. Real humans do not.
    if (website) {
      console.warn('Bot detected via honeypot field!');
      return NextResponse.json({
        success: true,
        saved: true,
        slug: 'mock-bot-slug',
        calculatedResult: {
          totalCurrentSpend: 0,
          totalOptimizedSpend: 0,
          monthlySavings: 0,
          annualSavings: 0,
          overallSeverity: 'optimal',
          showCredexBanner: false,
          aiSummary: 'System status nominal. Bot activity deflected.',
          results: []
        }
      });
    }

    // 1B. IP-based rate limiting (prevent Gemini & Resend API credit abuse)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1';
               
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again after 10 minutes.' },
        { status: 429 }
      );
    }


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
    try {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        slug = crypto.randomUUID();
      } else {
        slug = Math.random().toString(36).substring(2, 15) + '-' + Math.random().toString(36).substring(2, 15);
      }
    } catch (e) {
      slug = 'mock-demo-slug';
    }
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
                role: role || null,
                team_size: teamSize,
                audit_id: slug,
                referral_code: referralCode || null
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
    }
    
    // If we tried to save to Supabase but failed, fall back to offline serialization so the URL still works!
    if (!saved) {
      console.warn('Supabase saving failed or was bypassed. Generating offline serialized payload fallback.');
      try {
        const offlinePayload = {
          team_size: teamSize,
          use_case: useCase,
          results_payload: calculatedResult
        };
        const serialized = JSON.stringify(offlinePayload);
        const b64 = Buffer.from(serialized).toString('base64url');
        slug = `offline-${b64}`;
        saved = true;
      } catch (encodeErr) {
        console.error('Failed to encode offline sharing payload fallback:', encodeErr);
        slug = 'mock-demo-slug';
      }
    }

    // 3. Send transactional audit confirmation email via Resend
    if (email) {
      if (process.env.RESEND_API_KEY) {
        try {
          const host = request.headers.get('host') || 'localhost:3000';
          const protocol = request.headers.get('x-forwarded-proto') || 'http';
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

          const emailResponse = await sendTransactionalEmail(email, companyName, calculatedResult, slug, appUrl);
          if (!emailResponse.ok) {
            const errText = await emailResponse.text();
            console.error(`Resend API returned status ${emailResponse.status}: ${errText}`);
          } else {
            console.log(`Successfully dispatched transactional audit verification email to ${email}`);
          }
        } catch (emailError: any) {
          console.error('Failed to send transactional audit email:', emailError);
        }
      } else {
        console.warn('RESEND_API_KEY is not defined in environment. Skipping transactional email sending.');
      }
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


// Helper to send transactional emails via Resend REST API
async function sendTransactionalEmail(email: string, companyName: string | null, result: any, slug: string, appUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const isHighSavings = result.monthlySavings > 100; // threshold for high savings
  
  const reportUrl = `${appUrl}/audit/${slug}`;
  const fromEmail = 'onboarding@resend.dev'; // Resend Sandbox sender
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Your Credex Savings Audit Report</title>
        <style>
          body {
            font-family: monospace;
            background-color: #020617;
            color: #f8fafc;
            padding: 24px;
          }
          .container {
            border: 1px solid #1e293b;
            background-color: #020617;
            padding: 24px;
            max-width: 600px;
            margin: 0 auto;
          }
          .header {
            border-bottom: 1px solid #1e293b;
            padding-bottom: 16px;
            margin-bottom: 16px;
          }
          .title {
            color: #34d399;
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }
          .metric-box {
            background-color: rgba(52, 211, 153, 0.05);
            border: 1px solid rgba(52, 211, 153, 0.2);
            padding: 16px;
            margin: 16px 0;
            text-align: center;
          }
          .metric-val {
            color: #34d399;
            font-size: 28px;
            font-weight: bold;
          }
          .button {
            display: inline-block;
            background-color: #34d399;
            color: #020617 !important;
            padding: 12px 24px;
            text-decoration: none;
            font-weight: bold;
            margin-top: 16px;
            text-transform: uppercase;
          }
          .notice {
            border: 1px solid rgba(245, 158, 11, 0.2);
            background-color: rgba(245, 158, 11, 0.05);
            color: #f59e0b;
            padding: 12px;
            margin: 16px 0;
            font-size: 12px;
          }
          .high-savings {
            border: 1px solid rgba(52, 211, 153, 0.3);
            background-color: rgba(52, 211, 153, 0.05);
            color: #34d399;
            padding: 12px;
            margin: 16px 0;
            font-size: 12px;
          }
          .footer {
            font-size: 10px;
            color: #64748b;
            margin-top: 24px;
            border-top: 1px solid #1e293b;
            padding-top: 16px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="title">CREDEX // AUDIT_REPORT</div>
            <p style="font-size: 11px; color: #64748b;">Deterministic SaaS optimization payload complete.</p>
          </div>
          
          <p>Hi there,</p>
          
          <p>We have successfully processed your workspace configuration. The calculations generated direct savings recommendations across your active AI products stack.</p>
          
          <div class="metric-box">
            <span style="font-size: 10px; text-transform: uppercase; color: #64748b; display: block;">Calculated Annual Savings</span>
            <div class="metric-val">$${result.annualSavings}</div>
            <span style="font-size: 11px; color: #64748b;">($${result.monthlySavings}/mo reduction in software leakages)</span>
          </div>

          ${isHighSavings ? `
          <div class="high-savings">
            <strong>[HIGH_SAVINGS_IDENTIFIED]:</strong> Your audit indicates substantial optimization opportunities. A Credex licensing consultant will proactively reach out to help you convert to bulk enterprise pricing and capture up to an additional 30% reduction.
          </div>
          ` : `
          <div class="notice">
            Your configurations are highly optimized. Check the full breakdown for minor plan tuning and downgrade paths.
          </div>
          `}

          <p>Review the full interactive stack visualization, vendor redundancy analysis, and actionable implementation checklists online:</p>
          
          <div style="text-align: center;">
            <a href="${reportUrl}" class="button" style="color: #020617;">View Live Dashboard</a>
          </div>
          
          <div class="footer">
            SYS_REF: CRD-2026 // SECURE REPORT STORAGE INSTANCE<br>
            Please note: Personally identifiable information is fully stripped from public dynamic URLs.
          </div>
        </div>
      </body>
    </html>
  `;

  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from: fromEmail,
      to: email,
      subject: `Your Credex Savings Audit Report [Annual Savings: $${result.annualSavings}]`,
      html: htmlContent
    })
  });
}
