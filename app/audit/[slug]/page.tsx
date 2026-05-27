import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { 
  Coins, 
  ChevronLeft, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Sparkles,
  Lock,
  Activity,
  Cpu,
  Layers,
  Sliders,
  Share2
} from 'lucide-react';
import { supabase } from '@/lib/db/supabase';
import { Severity } from '@/lib/audit/engine';
import ExportPdfButton from '../../../components/ExportPdfButton';
import CopyButton from '../../../components/CopyButton';
import { headers } from 'next/headers';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Tech corners widget for Fictional UI look
const TechCorners = () => (
  <>
    <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-emerald-500/70 pointer-events-none" />
    <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-emerald-500/70 pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-emerald-500/70 pointer-events-none" />
    <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-emerald-500/70 pointer-events-none" />
  </>
);

// 1. Dynamic Open Graph & SEO Metadata Setup (Next.js 15 standard)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  let savingsAmount = 0;
  let isDemo = slug === 'mock-demo-slug';

  if (isDemo) {
    savingsAmount = 2280; // $190/mo * 12
  } else if (slug.startsWith('offline-')) {
    try {
      const b64 = slug.substring(8);
      const decoded = Buffer.from(b64, 'base64url').toString('utf8');
      const parsed = JSON.parse(decoded);
      savingsAmount = parsed.results_payload?.annualSavings || 0;
    } catch (e) {
      console.error('Metadata generation failed to parse offline payload:', e);
    }
  } else {
    try {
      const { data } = await supabase
        .from('audits')
        .select('results_payload')
        .eq('id', slug)
        .single();
        
      if (data?.results_payload) {
        savingsAmount = (data.results_payload as any).annualSavings || 0;
      }
    } catch (e) {
      console.error('Metadata generation failed to fetch audit:', e);
    }
  }

  const title = `AI Stack Audit Report — Save $${savingsAmount.toLocaleString()}/year`;
  const description = `This public shared AI stack audit identifies up to $${savingsAmount.toLocaleString()}/year in recurring software optimization savings. View the detailed report here.`;

  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${appUrl}/audit/${slug}`,
      siteName: 'credAI Stack Auditor',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  };
}

// Helper mock for offline/demo visits
const DEMO_AUDIT_RESULT = {
  team_size: 10,
  use_case: 'coding',
  results_payload: {
    totalCurrentSpend: 390,
    totalOptimizedSpend: 200,
    monthlySavings: 190,
    annualSavings: 2280,
    overallSeverity: 'medium' as Severity,
    showCredexBanner: false,
    results: [
      {
        toolId: 'cursor',
        toolName: 'Cursor',
        currentPlanName: 'Pro',
        currentSpend: 200,
        optimizedSpend: 200,
        savings: 0,
        annualSavings: 0,
        severity: 'optimal' as Severity,
        recommendationType: 'optimal',
        recommendation: 'Your active Cursor subscription matches your team size and coding workloads optimally. No modifications needed.',
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
        severity: 'medium' as Severity,
        recommendationType: 'consolidate',
        recommendation: 'Redundancy Alert: Your engineers are utilizing both Cursor and Copilot. Cursor includes a native built-in editor Copilot, making separate GitHub Copilot seats unnecessary.',
        confidence: 0.96,
        capabilityGap: ['GitHub Copilot CLI integration outside the editor']
      }
    ]
  }
};

// 2. Dynamic Server-side Rendered Shared Page
export default async function SharedAuditPage({ params }: PageProps) {
  const { slug } = await params;
  
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
  
  let auditData: any = null;
  let isDemo = slug === 'mock-demo-slug';
  let errorState = false;

  if (isDemo) {
    auditData = DEMO_AUDIT_RESULT;
  } else if (slug.startsWith('offline-')) {
    try {
      const b64 = slug.substring(8);
      const decoded = Buffer.from(b64, 'base64url').toString('utf8');
      auditData = JSON.parse(decoded);
    } catch (e) {
      console.warn(`Failed to parse offline sharing payload for slug ${slug}:`, e);
      auditData = DEMO_AUDIT_RESULT;
      isDemo = true;
    }
  } else {
    try {
      // Security measure: strictly fetch team_size, use_case, results_payload
      const { data, error } = await supabase
        .from('audits')
        .select('team_size, use_case, results_payload')
        .eq('id', slug)
        .single();

      if (error || !data) {
        console.warn(`Dynamic shared fetch failed for slug ${slug} (database may be offline or unconfigured). Gracefully falling back to demo state. Details:`, error);
        auditData = DEMO_AUDIT_RESULT;
        isDemo = true;
      } else {
        auditData = data;
      }
    } catch (e) {
      console.warn(`Database connection threw an error during fetch for ${slug}. Gracefully falling back to demo state. Details:`, e);
      auditData = DEMO_AUDIT_RESULT;
      isDemo = true;
    }
  }

  if (errorState || !auditData) {
    return (
      <main className="min-h-screen bg-[#020617] text-[#f8fafc] flex flex-col items-center justify-center p-4 font-mono">
        <div className="max-w-md w-full bg-slate-950/40 border border-slate-800 rounded-none p-8 text-center space-y-4 shadow-2xl relative">
          <TechCorners />
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Report Not Resolved</h2>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            The dynamic audit slug is invalid or database connections are offline. Create a new audit stack in seconds from our compiler canvas.
          </p>
          <Link 
            href="/"
            className="inline-block bg-emerald-500 hover:bg-emerald-600 text-[#020617] font-bold uppercase tracking-wider text-[10px] px-6 py-2.5 rounded-none transition-colors shadow-md"
          >
            Compiler Canvas
          </Link>
        </div>
      </main>
    );
  }

  const results = auditData.results_payload;
  const toolResults = results.results || [];

  const teamSize = auditData.team_size || 1;
  const spendPerDeveloper = Math.round(results.totalCurrentSpend / teamSize);
  let benchmarkAverage = 65;
  if (teamSize <= 5) {
    benchmarkAverage = 40;
  } else if (teamSize > 25) {
    benchmarkAverage = 90;
  }

  return (
    <main className="min-h-screen bg-[#020617] text-[#f8fafc] flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8 font-space">
      <div className="w-full max-w-4xl flex-grow flex flex-col">

        {/* Header Title block */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity text-left">
            <div className="p-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-none">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent font-mono uppercase tracking-tight">credAI Stack Auditor</h1>
              <p className="text-[10px] text-slate-400 font-sans">Utilitarian cost auditing & redundant seed assessment.</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 print:hidden">
            <ExportPdfButton />
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 hover:text-emerald-400 transition-colors border border-slate-800 hover:border-emerald-500/20 bg-slate-900/40 rounded-none"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Run New Audit
            </Link>
          </div>
        </div>

        {/* Security / PII Stripped Banner */}
        <div className="mb-6 py-2.5 px-4 bg-slate-950/60 border border-slate-800 text-[10px] font-mono flex items-center justify-between gap-3 text-left relative">
          <div className="absolute top-0 left-0 w-1 h-1 bg-emerald-500" />
          <div className="flex items-center gap-2 text-slate-450">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold uppercase tracking-widest text-slate-300">PUBLIC DELEGATION VIEW</span>
          </div>
          <span className="text-[9px] text-slate-500 font-sans font-medium">
            Personal identities (emails, companies) are strictly omitted from this client payload.
          </span>
        </div>

        {/* Utilitarian Brutalist Container */}
        <div className="bg-slate-950/20 border border-slate-800 rounded-none p-6 sm:p-8 relative shadow-2xl flex-grow space-y-8">
          
          <TechCorners />

          {/* UTILITY HERO STAT PANEL */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-none p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-center justify-between relative overflow-hidden shadow-lg text-left">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-3 font-mono">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 text-[8px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-none tracking-widest uppercase select-none">
                  OPTIMIZATION REPORT
                </span>
                <span className={`px-2 py-0.5 text-[8px] font-bold rounded-none border uppercase tracking-widest select-none ${
                  results.overallSeverity === 'high'
                    ? 'bg-red-500/10 text-red-400 border-red-500/30'
                    : results.overallSeverity === 'medium'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  SEVERITY LEVEL: {results.overallSeverity}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white uppercase tracking-wider font-mono">
                Audit Stack Performance
              </h2>
              <p className="text-[11px] text-slate-400 font-sans">
                Computed metrics for a workspace of <span className="font-semibold text-slate-200 font-mono">{auditData.team_size}</span> seats on a <span className="font-semibold text-slate-200 font-mono uppercase text-[10px] tracking-wider">{auditData.use_case}</span> workload.
              </p>
            </div>

            <div className="flex gap-4 shrink-0 font-mono w-full sm:w-auto pt-4 md:pt-0">
              <div className="text-center bg-slate-950 border border-slate-850 p-4 rounded-none shrink-0 min-w-[130px] sm:min-w-[155px] w-auto px-4">
                <p className="text-[9px] font-bold text-slate-550 uppercase tracking-widest">Monthly savings</p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">${results.monthlySavings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
              </div>

              <div className="text-center bg-emerald-500 text-[#020617] border border-emerald-400 p-4 rounded-none shrink-0 min-w-[130px] sm:min-w-[155px] w-auto px-4 shadow-lg shadow-emerald-500/5">
                <p className="text-[9px] font-extrabold uppercase tracking-widest">Annual savings</p>
                <p className="text-xl sm:text-2xl font-black mt-1">${results.annualSavings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          {/* METRIC_SYNTHESIS_REPORT // COGNITIVE_ANALYSIS */}
          {results.aiSummary && (
            <div className="border border-emerald-500/30 bg-emerald-950/5 p-6 rounded-none font-mono text-left relative">
              <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-emerald-500" />
              <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-emerald-500" />
              <div className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-emerald-500" />
              <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-emerald-500" />
              
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800">
                <span className="text-[10px] font-bold text-emerald-400 tracking-widest flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-emerald-500 animate-pulse shrink-0" />
                  AI SUMMARY
                </span>
                <span className="text-[8px] text-slate-550">ENGINE: GEMINI_2.5_FLASH</span>
              </div>
              
              <div className="text-xs text-slate-350 leading-relaxed font-mono">
                <p className="inline">{results.aiSummary}</p>
                <span className="inline-block w-1.5 h-3.5 bg-emerald-400 ml-1.5 align-middle animate-pulse" />
              </div>
            </div>
          )}

          {/* Dynamic Shareable Link Card */}
          <div className="bg-slate-950/40 border border-slate-805 p-5 rounded-none flex flex-col sm:flex-row gap-4 items-center justify-between text-left font-mono relative">
            <div className="absolute top-0 left-0 w-2 h-[1px] bg-emerald-500" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                Dynamic shared URL
              </h4>
              <p className="text-[10px] text-slate-550 font-sans leading-relaxed">
                Share this static dashboard. Personally identifiable information is fully omitted from the output.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 p-1.5 rounded-none w-full sm:w-auto">
              <span className="text-[10px] font-mono text-slate-400 truncate max-w-xs px-2 select-all font-semibold">
                {appUrl}/audit/{slug}
              </span>
              <CopyButton textToCopy={`${appUrl}/audit/${slug}`} />
            </div>
          </div>

          {/* Breakdowns strict list */}
          <div className="space-y-4 font-mono">
            <h3 className="text-[10px] font-bold text-slate-550 uppercase tracking-widest border-b border-slate-800 pb-2 text-left">
              Tool-Specific Analysis Insights
            </h3>
            
            <div className="space-y-4">
              {toolResults.map((result: any) => {
                const isOptimal = result.severity === 'optimal' || result.savings === 0;
                return (
                  <div 
                    key={result.toolId} 
                    className={`border rounded-none p-5 space-y-4 text-left transition-all relative ${
                      isOptimal 
                        ? 'border-slate-850 bg-slate-950/5' 
                        : result.severity === 'high' 
                        ? 'border-red-500/20 bg-red-950/5'
                        : 'border-amber-500/20 bg-amber-950/5'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850/80 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">{result.toolName}</span>
                        <span className="text-[9px] text-slate-550">[{result.currentPlanName}]</span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-none uppercase tracking-widest border ${
                          isOptimal
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : result.severity === 'high'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {isOptimal ? 'OPTIMAL' : 'REDUNDANT'}
                        </span>
                        
                        <span className="text-[9px] text-slate-400 font-semibold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-none select-none">
                          CONFIDENCE: {Math.round(result.confidence * 100)}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="space-y-1 text-[10px] font-medium text-slate-550 text-left">
                        <div className="flex justify-between">
                          <span>Current:</span>
                          <span className="font-semibold text-slate-200">${result.currentSpend}/mo</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Optimized:</span>
                          <span className="font-semibold text-emerald-400">${result.optimizedSpend}/mo</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Savings:</span>
                          <span className="font-semibold text-emerald-400">${result.savings}/mo</span>
                        </div>
                      </div>

                      <div className="md:col-span-2 p-3 bg-slate-950/60 border border-slate-850 rounded-none text-[11px] text-slate-350 leading-relaxed font-sans text-left">
                        {result.recommendation}
                      </div>
                    </div>

                    {(result.creditFlag || (result.capabilityGap && result.capabilityGap.length > 0)) && (
                      <div className="p-3 bg-slate-950 border border-slate-850 rounded-none space-y-2 text-[10px] font-mono leading-relaxed text-left">
                        {result.creditFlag && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1">
                            <div className="flex gap-2 items-start text-left">
                              <Coins className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <p className="text-slate-400 font-medium">{result.creditMessage}</p>
                            </div>
                            <a
                              href="https://calendly.com/credex-audit/escalation"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block bg-emerald-500 hover:bg-emerald-600 text-[#020617] border border-emerald-400 font-mono font-bold uppercase tracking-wider text-[9px] px-3 py-1 rounded-none shadow-sm transition-all text-center whitespace-nowrap shrink-0 sm:self-center cursor-pointer"
                            >
                              Get In Touch
                            </a>
                          </div>
                        )}

                        {result.capabilityGap && result.capabilityGap.length > 0 && (
                          <div className="flex gap-2 items-start">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="text-slate-400">
                              <span className="font-bold text-slate-300">POTENTIAL CAPABILITY GAPS: </span>
                              {result.capabilityGap.join(', ')}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* BENCHMARK MODE PANEL */}
          <div className="bg-slate-950/40 border border-slate-850 p-6 rounded-none text-left relative space-y-3 font-mono">
            <div className="absolute top-0 left-0 w-2 h-[1px] bg-emerald-500" />
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold tracking-widest uppercase">
              <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              METRIC BENCHMARK ANALYSIS
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-950/80 border border-slate-850/80 p-4 rounded-none">
                <span className="text-[8px] font-bold text-slate-550 uppercase tracking-widest block">YOUR AVERAGE AI BUDGET</span>
                <span className="text-xl sm:text-2xl font-black text-white mt-1">${spendPerDeveloper}<span className="text-[10px] font-normal text-slate-500"> / dev / mo</span></span>
              </div>
              <div className="bg-slate-950/80 border border-slate-850/80 p-4 rounded-none">
                <span className="text-[8px] font-bold text-slate-550 uppercase tracking-widest block">PEER AVERAGE ({teamSize <= 5 ? "TINY" : teamSize <= 25 ? "MID-SIZED" : "ENTERPRISE"} COHORT)</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">${benchmarkAverage}<span className="text-[10px] font-normal text-slate-500"> / dev / mo</span></span>
              </div>
            </div>
            <p className="text-[10px] text-slate-450 font-sans leading-relaxed pt-1">
              {spendPerDeveloper > benchmarkAverage ? (
                <span className="text-amber-400 font-semibold">OVER BUDGET: Your team&apos;s average AI tool spend is higher than similar-sized peer averages by {Math.round((spendPerDeveloper - benchmarkAverage) / benchmarkAverage * 100)}%. Centralizing accounts is highly advised.</span>
              ) : spendPerDeveloper < benchmarkAverage ? (
                <span className="text-emerald-400 font-semibold">OPTIMAL BUDGET: Your team&apos;s average AI tool spend is optimized and runs lower than peer averages by {Math.round((benchmarkAverage - spendPerDeveloper) / benchmarkAverage * 100)}%.</span>
              ) : (
                <span className="text-emerald-400 font-semibold">OPTIMAL BUDGET: Well aligned! Your team&apos;s average AI tool spend matches the peer cohort average exactly.</span>
              )}
            </p>
          </div>

          {/* JOIN WAITLIST BANNER */}
          <div className="p-6 bg-slate-950/40 border border-slate-850 rounded-none text-left space-y-4 font-mono relative">
            <div className="absolute top-0 left-0 w-2 h-[1px] bg-slate-550" />
            <div className="flex gap-3.5 items-start">
              <div className="p-2.5 bg-slate-900 rounded-none border border-slate-800 text-slate-400 shrink-0 select-none">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono">JOIN WAITLIST</h4>
                <p className="text-[10px] text-slate-450 font-sans leading-relaxed">
                  Join the waitlist to get notified when new optimization opportunities become available.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 max-w-md pt-1">
              <input
                type="email"
                placeholder="user@company.com"
                disabled
                className="bg-slate-950/50 border border-slate-850 text-slate-650 rounded-none px-3 py-1.5 text-[10px] outline-none font-mono flex-grow cursor-not-allowed"
              />
              <Link
                href="/"
                className="bg-slate-900 hover:bg-slate-850 text-white border border-slate-700 font-mono font-bold uppercase tracking-wider text-[9px] px-4 py-2 rounded-none transition-all text-center shrink-0"
              >
                Configure Stack
              </Link>
            </div>
          </div>
          {/* REFERRAL SYSTEM PANEL */}
          <div className="bg-slate-950/40 border border-slate-850 p-6 rounded-none text-left font-mono relative space-y-4">
            <div className="absolute top-0 left-0 w-2 h-[1px] bg-emerald-500" />
            <div className="flex justify-between items-center border-b border-slate-850/80 pb-2.5">
              <span className="text-[10px] font-bold text-emerald-400 tracking-widest flex items-center gap-2">
                <Coins className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                REFERRAL ACQUISITION SYSTEM
              </span>
              <span className="text-[8px] text-slate-500">REF_CODE: {slug.slice(0, 8).toUpperCase()}-CRD</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/45 border border-slate-850 p-4 rounded-none font-sans">
              <div className="space-y-1 text-left">
                <p className="text-[11px] text-slate-350 font-medium leading-relaxed">
                  When another team runs an audit using your referral code <span className="font-semibold text-emerald-400 font-mono">{slug.slice(0, 8).toUpperCase()}-CRD</span>, <strong>both of you get 30% off</strong> on your first Credex enterprise license!
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 p-1.5 rounded-none w-full sm:w-auto font-mono shrink-0">
                <span className="text-[10px] text-slate-400 truncate max-w-xs px-2 select-all font-semibold">
                  {appUrl}/?ref={slug.slice(0, 8).toUpperCase()}-CRD
                </span>
                <CopyButton textToCopy={`${appUrl}/?ref=${slug.slice(0, 8).toUpperCase()}-CRD`} />
              </div>
            </div>
          </div>


          {/* Action Link Panel */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6 border-t border-slate-800 font-mono">
            <Link
              href="/"
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-[#020617] border border-emerald-400 font-mono font-bold uppercase tracking-wider text-[11px] px-6 py-2.5 rounded-none shadow-md shadow-emerald-500/5 transition-all"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              Build Your Own Audit Report
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}
