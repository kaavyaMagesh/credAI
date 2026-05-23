import { NextResponse } from 'next/server';
import { runAudit, AuditInput } from '@/lib/audit/engine';
import { supabase } from '@/lib/db/supabase';

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
