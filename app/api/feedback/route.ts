import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/db/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, feedback, email } = body;

    console.log(`[FEEDBACK_RECEIVED] Slug: ${slug || 'N/A'}, Email: ${email || 'Anonymous'}, Feedback: ${feedback}`);

    const hasSupabaseCreds = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (hasSupabaseCreds && slug && slug !== 'mock-demo-slug') {
      try {
        // Fetch current results payload
        const { data: auditRow, error: fetchError } = await supabase
          .from('audits')
          .select('results_payload')
          .eq('id', slug)
          .single();

        if (!fetchError && auditRow?.results_payload) {
          const results = auditRow.results_payload as any;
          
          // Append the feedback to the JSONB payload
          results.userFeedback = feedback;

          const { error: updateError } = await supabase
            .from('audits')
            .update({ results_payload: results })
            .eq('id', slug);

          if (updateError) {
            console.error('Failed to append feedback to audit results payload:', updateError);
          } else {
            console.log(`Feedback successfully appended to database audit record for ID ${slug}`);
          }
        }
      } catch (dbError) {
        console.error('Database feedback logging failed:', dbError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { error: 'Failed to process feedback', details: error.message },
      { status: 500 }
    );
  }
}
