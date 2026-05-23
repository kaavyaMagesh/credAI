import { NextResponse } from 'next/server';
import { runAudit, AuditInput } from '@/lib/audit/engine';

export async function POST(request: Request) {
  try {
    const body: AuditInput = await request.json();
    const result = await runAudit(body);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Audit run failed:', error);
    return NextResponse.json(
      { error: 'Failed to execute audit engine', details: error.message },
      { status: 500 }
    );
  }
}
