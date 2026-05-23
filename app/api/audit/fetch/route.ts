import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Missing slug query parameter.' },
        { status: 400 }
      );
    }

    // 1. Handle mock fallback for testing offline/without Supabase
    if (slug === 'mock-demo-slug') {
      return NextResponse.json({
        success: true,
        isDemo: true,
        audit: {
          team_size: 10,
          use_case: 'coding',
          results_payload: {
            totalCurrentSpend: 390,
            totalOptimizedSpend: 200,
            monthlySavings: 190,
            annualSavings: 2280,
            overallSeverity: 'medium',
            showCredexBanner: false,
            aiSummary: "Redundancy identified: GitHub Copilot and Cursor licenses are overlapping, creating a high-density compute duplication. Consolidating the engineering team solely onto Cursor licenses is recommended. This optimization path recovers $190/mo ($2,280 annualized) with zero loss of editor functionality.",
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
                recommendation: 'Redundancy Alert: Engineers are utilizing both Cursor and Copilot. Standardize on Cursor to save $190/mo.',
                confidence: 0.96,
                capabilityGap: ['Copilot CLI outside editor']
              }
            ]
          }
        }
      });
    }

    // 2. Fetch from Supabase
    const { data: audit, error } = await supabase
      .from('audits')
      .select('team_size, use_case, results_payload')
      .eq('id', slug)
      .single();

    if (error || !audit) {
      console.error(`Audit fetch failed for slug ${slug}:`, error);
      return NextResponse.json(
        { error: 'Audit report not found or database is unreachable.' },
        { status: 404 }
      );
    }

    // 3. Respond with clean, PII-stripped data
    return NextResponse.json({
      success: true,
      isDemo: false,
      audit: {
        team_size: audit.team_size,
        use_case: audit.use_case,
        results_payload: audit.results_payload // contains no PII
      }
    });

  } catch (error: any) {
    console.error('Fetch audit failed:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve shared audit report', details: error.message },
      { status: 500 }
    );
  }
}
