import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/db/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, companyName, role, teamSize, auditId } = body;

    console.log(`[CONSULTATION_REQUESTED] Email: ${email}, Company: ${companyName}, Role: ${role}, Team Size: ${teamSize}, Audit ID: ${auditId || 'N/A'}`);

    const hasSupabaseCreds = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let saved = false;
    let errorMessage = '';

    if (hasSupabaseCreds) {
      try {
        const { error: leadError } = await supabase
          .from('leads')
          .insert({
            email,
            company_name: companyName || null,
            role: role || null,
            team_size: teamSize || 1,
            audit_id: auditId && auditId !== 'mock-demo-slug' ? auditId : null
          });

        if (leadError) {
          throw leadError;
        } else {
          console.log(`Consultation lead successfully recorded in Supabase leads table for ${email}`);
          saved = true;
        }
      } catch (dbError: any) {
        console.error('Database lead insertion failed:', dbError);
        errorMessage = dbError.message || 'Supabase integration failed';
      }
    } else {
      console.warn('Supabase credentials missing from environment. Operating in mock save mode for consultation lead.');
      errorMessage = 'Supabase environment variables are missing.';
    }

    return NextResponse.json({
      success: true,
      saved,
      errorMessage: errorMessage || undefined
    });
  } catch (error: any) {
    console.error('Consultation request failed:', error);
    return NextResponse.json(
      { error: 'Failed to process consultation request', details: error.message },
      { status: 500 }
    );
  }
}
