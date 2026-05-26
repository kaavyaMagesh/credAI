"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ExportPdfButton from '../components/ExportPdfButton';
import { 
  Building2, 
  Sparkles, 
  Terminal, 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Briefcase, 
  Coins,
  Share2,
  Mail,
  Copy,
  Check,
  Activity,
  Cpu,
  Layers,
  Sliders
} from 'lucide-react';
type UseCase = 'coding' | 'writing' | 'research' | 'data' | 'mixed';
type RecommendationType = 'downgrade' | 'consolidate' | 'switch' | 'credits' | 'optimal';
type Severity = 'high' | 'medium' | 'low' | 'optimal';

// Interfaces matching backend
interface InputToolData {
  toolId: string;
  planId: string;
  seats: number;
  enteredMonthlySpend: number;
}

interface AuditResult {
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

interface AggregateAudit {
  totalCurrentSpend: number;
  totalOptimizedSpend: number;
  monthlySavings: number;
  annualSavings: number;
  overallSeverity: Severity;
  showCredexBanner: boolean;
  zeroStateMessage?: string;
  aiSummary?: string;
  results: AuditResult[];
}

// Tool definitions for frontend selection
interface ToolMetadata {
  id: string;
  name: string;
  category: 'Editor' | 'Assistant' | 'API' | 'UI Generation';
  isApi: boolean;
  plans: { id: string; name: string; price: number }[];
}

const TOOLS: ToolMetadata[] = [
  {
    id: 'cursor',
    name: 'Cursor',
    category: 'Editor',
    isApi: false,
    plans: [
      { id: 'hobby', name: 'Hobby', price: 0 },
      { id: 'pro', name: 'Pro', price: 20 },
      { id: 'business', name: 'Business', price: 40 },
      { id: 'enterprise', name: 'Enterprise', price: -1 }, 
    ]
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    category: 'Editor',
    isApi: false,
    plans: [
      { id: 'free', name: 'Free', price: 0 },
      { id: 'pro', name: 'Pro', price: 10 },
      { id: 'pro+', name: 'Pro+', price: 39 },
      { id: 'business', name: 'Business', price: 19 },
      { id: 'enterprise', name: 'Enterprise', price: 39 },
    ]
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    category: 'Assistant',
    isApi: false,
    plans: [
      { id: 'free', name: 'Free', price: 0 },
      { id: 'plus', name: 'Plus', price: 20 },
      { id: 'team', name: 'Team', price: 23.45 },
      { id: 'enterprise', name: 'Enterprise', price: -1 },
    ]
  },
  {
    id: 'claude',
    name: 'Claude',
    category: 'Assistant',
    isApi: false,
    plans: [
      { id: 'free', name: 'Free', price: 0 },
      { id: 'pro', name: 'Pro', price: 17 },
      { id: 'max', name: 'Max', price: 100 },
      { id: 'team standard', name: 'Team Standard', price: 25 },
      { id: 'team premium', name: 'Team Premium', price: 125 },
      { id: 'enterprise', name: 'Enterprise', price: 20 },
    ]
  },
  {
    id: 'gemini',
    name: 'Gemini',
    category: 'Assistant',
    isApi: false,
    plans: [
      { id: 'free', name: 'Free', price: 0 },
      { id: 'pro', name: 'Pro', price: 20.30 },
      { id: 'ultra (5x limits)', name: 'Ultra (5x limits)', price: 67.70 },
      { id: 'ultra (20x limits)', name: 'Ultra (20x limits)', price: 203.10 },
    ]
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    category: 'Editor',
    isApi: false,
    plans: [
      { id: 'free', name: 'Free', price: 0 },
      { id: 'pro', name: 'Pro', price: 20 },
      { id: 'max', name: 'Max', price: 200 },
      { id: 'teams', name: 'Teams', price: 40 },
      { id: 'enterprise', name: 'Enterprise', price: 60 },
      { id: 'enterprise custom', name: 'Enterprise Custom', price: -1 },
    ]
  },
  {
    id: 'v0',
    name: 'v0',
    category: 'UI Generation',
    isApi: false,
    plans: [
      { id: 'free', name: 'Free', price: 0 },
      { id: 'team', name: 'Team', price: 30 },
      { id: 'business', name: 'Business', price: 100 },
      { id: 'enterprise', name: 'Enterprise', price: -1 },
    ]
  },
  {
    id: 'anthropic_api',
    name: 'Anthropic API',
    category: 'API',
    isApi: true,
    plans: [{ id: 'api', name: 'API Direct Access', price: 0 }]
  },
  {
    id: 'openai_api',
    name: 'OpenAI API',
    category: 'API',
    isApi: true,
    plans: [{ id: 'api', name: 'API Direct Access', price: 0 }]
  },
  {
    id: 'gemini_api',
    name: 'Gemini API',
    category: 'API',
    isApi: true,
    plans: [{ id: 'api', name: 'API Direct Access', price: 0 }]
  }
];

const PLAN_PRICES: Record<string, number> = {
  'cursor-hobby': 0,
  'cursor-pro': 20,
  'cursor-business': 40,
  'cursor-enterprise': -1,
  'copilot-free': 0,
  'copilot-pro': 10,
  'copilot-pro+': 39,
  'copilot-business': 19,
  'copilot-enterprise': 39,
  'chatgpt-free': 0,
  'chatgpt-plus': 20,
  'chatgpt-team': 23.45,
  'chatgpt-enterprise': -1,
  'claude-free': 0,
  'claude-pro': 17,
  'claude-max': 100,
  'claude-team standard': 25,
  'claude-team premium': 125,
  'claude-enterprise': 20,
  'gemini-free': 0,
  'gemini-pro': 20.30,
  'gemini-ultra (5x limits)': 67.70,
  'gemini-ultra (20x limits)': 203.10,
  'windsurf-free': 0,
  'windsurf-pro': 20,
  'windsurf-max': 200,
  'windsurf-teams': 40,
  'windsurf-enterprise': 60,
  'windsurf-enterprise custom': -1,
  'v0-free': 0,
  'v0-team': 30,
  'v0-business': 100,
  'v0-enterprise': -1,
};

const LOCAL_STORAGE_KEY = 'credai_audit_wizard_fui_v3';

// L-shaped absolute Framing Corners for high-tech instrument panel / viewfinder look
const TechCorners = () => (
  <>
    <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-emerald-500/70 pointer-events-none" />
    <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-emerald-500/70 pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-emerald-500/70 pointer-events-none" />
    <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-emerald-500/70 pointer-events-none" />
  </>
);

function HomeContent() {
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get('embed') === 'true';

  const [isMounted, setIsMounted] = useState(false);
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [teamSize, setTeamSize] = useState<number>(5);
  const [useCase, setUseCase] = useState<UseCase>('coding');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [toolConfigs, setToolConfigs] = useState<Record<string, { planId: string; seats: number; enteredMonthlySpend: number }>>({});
  const [hasComplianceNeeds, setHasComplianceNeeds] = useState<boolean>(false);
  const [requiresHIPAA, setRequiresHIPAA] = useState<boolean>(false);
  const [requiresSSO, setRequiresSSO] = useState<boolean>(false);

  // Lead capture state
  const [email, setEmail] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [honeypot, setHoneypot] = useState<string>('');
  const [showLeadCapture, setShowLeadCapture] = useState<boolean>(false);

  // Audit Results & slug
  const [auditResult, setAuditResult] = useState<AggregateAudit | null>(null);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [origin, setOrigin] = useState<string>('http://localhost:3000');
  const [feedbackText, setFeedbackText] = useState<string>('');
  
  // Consultation & Waitlist State
  const [isConsultModalOpen, setIsConsultModalOpen] = useState<boolean>(false);
  const [waitlistEmail, setWaitlistEmail] = useState<string>('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState<boolean>(false);
  const [consultSubmitted, setConsultSubmitted] = useState<boolean>(false);
  const [consultSubmitting, setConsultSubmitting] = useState<boolean>(false);
  const [consultEmail, setConsultEmail] = useState<string>('');
  const [consultCompany, setConsultCompany] = useState<string>('');
  const [consultRole, setConsultRole] = useState<string>('');
  const [consultTeamSize, setConsultTeamSize] = useState<number>(1);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<boolean>(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

  // 1. Hydration
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.teamSize) setTeamSize(parsed.teamSize);
        if (parsed.useCase) setUseCase(parsed.useCase);
        if (parsed.selectedTools) setSelectedTools(parsed.selectedTools);
        if (parsed.toolConfigs) setToolConfigs(parsed.toolConfigs);
        if (parsed.hasComplianceNeeds !== undefined) setHasComplianceNeeds(parsed.hasComplianceNeeds);
        if (parsed.requiresHIPAA !== undefined) setRequiresHIPAA(parsed.requiresHIPAA);
        if (parsed.requiresSSO !== undefined) setRequiresSSO(parsed.requiresSSO);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.companyName) setCompanyName(parsed.companyName);
        if (parsed.role) setRole(parsed.role);
        if (parsed.step) setStep(parsed.step);
        if (parsed.auditResult) setAuditResult(parsed.auditResult);
        if (parsed.savedSlug) setSavedSlug(parsed.savedSlug);
      }
    } catch (e) {
      console.error('Failed to load localStorage state:', e);
    }
  }, []);

  // 2. Persist
  useEffect(() => {
    if (!isMounted) return;
    try {
      const stateToSave = {
        teamSize,
        useCase,
        selectedTools,
        toolConfigs,
        hasComplianceNeeds,
        requiresHIPAA,
        requiresSSO,
        email,
        companyName,
        role,
        step,
        auditResult,
        savedSlug
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
  }, [teamSize, useCase, selectedTools, toolConfigs, hasComplianceNeeds, requiresHIPAA, requiresSSO, email, companyName, role, step, auditResult, savedSlug, isMounted]);

  const handleReset = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setStep(1);
    setTeamSize(5);
    setUseCase('coding');
    setSelectedTools([]);
    setToolConfigs({});
    setHasComplianceNeeds(false);
    setRequiresHIPAA(false);
    setRequiresSSO(false);
    setEmail('');
    setCompanyName('');
    setRole('');
    setHoneypot('');
    setShowLeadCapture(false);
    setAuditResult(null);
    setSavedSlug(null);
    setError(null);
    setFeedbackText('');
    setFeedbackSubmitting(false);
    setFeedbackSubmitted(false);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setFeedbackSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          slug: savedSlug,
          feedback: feedbackText,
          email: email || null
        })
      });

      if (response.ok) {
        setFeedbackSubmitted(true);
      } else {
        console.error('Failed to submit feedback');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // Sync state values from wizard when modal opens
  useEffect(() => {
    if (isMounted && isConsultModalOpen) {
      setConsultEmail(email || '');
      setConsultCompany(companyName || '');
      setConsultRole(role || '');
      setConsultTeamSize(teamSize || 1);
    }
  }, [isConsultModalOpen, email, companyName, role, teamSize, isMounted]);

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    setWaitlistSubmitted(true);
    setWaitlistEmail('');
  };

  const handleConsultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultEmail.trim()) return;

    setConsultSubmitting(true);
    try {
      const response = await fetch('/api/consult', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: consultEmail,
          companyName: consultCompany || null,
          role: consultRole || null,
          teamSize: consultTeamSize || 1,
          auditId: savedSlug || null
        })
      });

      if (response.ok) {
        setConsultSubmitted(true);
      } else {
        console.error('Failed to submit consultation');
      }
    } catch (err) {
      console.error('Error submitting consultation:', err);
    } finally {
      setConsultSubmitting(false);
    }
  };

  const handleToggleTool = (toolId: string) => {
    const isSelected = selectedTools.includes(toolId);
    let nextTools = [...selectedTools];
    let nextConfigs = { ...toolConfigs };

    if (isSelected) {
      nextTools = nextTools.filter(id => id !== toolId);
      delete nextConfigs[toolId];
    } else {
      nextTools.push(toolId);
      const toolDef = TOOLS.find(t => t.id === toolId);
      
      if (toolDef) {
        const defaultPlan = toolDef.isApi ? 'api' : (toolDef.plans.find(p => p.id === 'pro' || p.id === 'plus' || p.id === 'team')?.id || toolDef.plans[0].id);
        const seats = toolDef.isApi ? 1 : teamSize;
        const defaultPrice = PLAN_PRICES[`${toolId}-${defaultPlan}`] || 0;
        const enteredMonthlySpend = defaultPrice >= 0 ? defaultPrice * seats : 0;
        
        nextConfigs[toolId] = {
          planId: defaultPlan,
          seats,
          enteredMonthlySpend: toolDef.isApi ? 350 : Math.round(enteredMonthlySpend)
        };
      }
    }

    setSelectedTools(nextTools);
    setToolConfigs(nextConfigs);
  };

  const handlePlanChange = (toolId: string, planId: string) => {
    const config = toolConfigs[toolId];
    if (!config) return;

    const defaultPrice = PLAN_PRICES[`${toolId}-${planId}`] || 0;
    const enteredMonthlySpend = defaultPrice >= 0 ? defaultPrice * config.seats : 0;

    setToolConfigs({
      ...toolConfigs,
      [toolId]: {
        ...config,
        planId,
        enteredMonthlySpend: Math.round(enteredMonthlySpend)
      }
    });
  };

  const handleSeatChange = (toolId: string, seats: number) => {
    const config = toolConfigs[toolId];
    if (!config) return;

    const defaultPrice = PLAN_PRICES[`${toolId}-${config.planId}`] || 0;
    const enteredMonthlySpend = defaultPrice >= 0 ? defaultPrice * seats : 0;

    setToolConfigs({
      ...toolConfigs,
      [toolId]: {
        ...config,
        seats,
        enteredMonthlySpend: Math.round(enteredMonthlySpend)
      }
    });
  };

  const handleSaveAndRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('A valid work email is required.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const payload = {
        teamSize,
        useCase,
        tools: selectedTools.map(id => ({
          toolId: id,
          planId: toolConfigs[id]?.planId || 'pro',
          seats: toolConfigs[id]?.seats || 1,
          enteredMonthlySpend: Number(toolConfigs[id]?.enteredMonthlySpend || 0)
        })),
        email,
        companyName,
        role,
        website: honeypot,
        hasComplianceNeeds,
        requiresHIPAA,
        requiresSSO
      };

      const response = await fetch('/api/audit/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Server calculations failed.');
      }

      const resData = await response.json();
      
      if (resData.success) {
        setAuditResult(resData.calculatedResult);
        setSavedSlug(resData.slug);
        setShowLeadCapture(false);
        setStep(4);
      } else {
        throw new Error(resData.errorMessage || 'Failed to register stack.');
      }
    } catch (e: any) {
      console.error('Audit operation failed:', e);
      setError(e.message || 'Supabase integration mismatch.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!savedSlug) return;
    const shareUrl = `${origin}/audit/${savedSlug}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#020617] text-[#f8fafc] font-mono">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-[10px] uppercase tracking-widest text-slate-400">Loading system catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <main className={`min-h-screen bg-[#020617] text-[#f8fafc] flex flex-col items-center font-space ${
      isEmbed ? 'py-3 px-3' : 'py-10 px-4 sm:px-6 lg:px-8'
    }`}>
      <div className="w-full max-w-4xl flex-grow flex flex-col">

        {/* Header Title block */}
        {!isEmbed && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
            <div className="text-left space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-sm">
                  <Coins className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-bold uppercase tracking-tight text-white font-mono">credAI Stack Auditor</h1>
              </div>
              <p className="text-xs text-slate-400 font-sans">Utilitarian cost auditing & redundant seed assessment.</p>
            </div>
            
            <button 
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 hover:text-emerald-400 transition-colors border border-slate-850 hover:border-emerald-500/20 bg-slate-950/40 rounded-none shadow-sm"
            >
              <RotateCcw className="w-3 h-3" />
              Reset stack state
            </button>
          </div>
        )}

        {/* Strict Grid Wizard Steps Indicator */}
        <div className="grid grid-cols-4 border border-slate-800 bg-slate-950/20 mb-8 select-none text-left">
          {[1, 2, 3, 4].map((i) => {
            const isActive = step === i;
            const isCompleted = step > i;
            const labels = ["General Info", "AI Tools Stack", "Details & Spend", "Audit Report"];
            return (
              <button
                key={i}
                disabled={i > 3 && !auditResult}
                onClick={() => {
                  setShowLeadCapture(false);
                  setStep(i);
                }}
                className={`p-4 border-r border-slate-800 last:border-r-0 flex flex-col gap-1 transition-all relative ${
                  isActive 
                    ? 'bg-emerald-950/10 text-emerald-400 font-bold' 
                    : isCompleted 
                    ? 'text-emerald-500/70 hover:bg-slate-900/10' 
                    : 'text-slate-500 cursor-not-allowed'
                }`}
              >
                {isActive && <div className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-500" />}
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">STEP_0{i}</span>
                <span className="text-xs truncate uppercase tracking-wider font-mono">{labels[i-1]}</span>
              </button>
            );
          })}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-none flex gap-3 text-red-200 font-mono text-xs text-left relative">
            <div className="absolute top-0 left-0 w-1 h-1 bg-red-500" />
            <div className="absolute top-0 right-0 w-1 h-1 bg-red-500" />
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-red-400 tracking-wider">CRITICAL_EXCEPTION:</h4>
              <p className="text-red-300/90 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Utilitarian Brutalist Container */}
        <div className="bg-slate-950/20 border border-slate-800 rounded-none p-6 sm:p-8 relative shadow-2xl flex-grow">
          
          {/* Inject dynamic tech framing corners */}
          <TechCorners />

          {/* STEP 1: GENERAL PROFILE */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="border-b border-slate-850 pb-4 text-left">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 font-mono">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  01 // Workspace Attributes
                </h2>
                <p className="text-xs text-slate-400 mt-1">Specify team scaling parameters and workload types to feed calculations.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 text-left">
                {/* Team Size */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="team-size" className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    Workspace seat count [integer]
                  </label>
                  <input
                    id="team-size"
                    type="number"
                    min="1"
                    value={teamSize}
                    onChange={(e) => setTeamSize(Math.max(1, Number(e.target.value)))}
                    className="bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-none px-4 py-2.5 text-white font-mono text-sm outline-none transition-colors w-full"
                  />
                  <span className="text-[10px] text-slate-500">Total active developers or seats requiring subscriptions.</span>
                </div>

                {/* Use Case */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="use-case" className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    Primary workload profile
                  </label>
                  <select
                    id="use-case"
                    value={useCase}
                    onChange={(e) => setUseCase(e.target.value as UseCase)}
                    className="bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-none px-4 py-3 text-white font-mono text-xs outline-none transition-colors appearance-none cursor-pointer w-full"
                  >
                    <option value="coding">Coding & Software Development</option>
                    <option value="writing">Writing, Content & Marketing</option>
                    <option value="research">Academic & Information Gathering</option>
                    <option value="data">Data Analysis & Predictive Modeling</option>
                    <option value="mixed">Mixed Multipurpose Stack</option>
                  </select>
                  <span className="text-[10px] text-slate-500">Applies targeted rules to eliminate tool overlaps.</span>
                </div>
              </div>

              {/* Compliance & Administration Checks */}
              <div className="border-t border-slate-850 pt-6 mt-6 text-left">
                <h3 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-4">Security constraints</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label className="flex items-center gap-3 p-3 bg-slate-950/40 border border-slate-850 rounded-none cursor-pointer hover:border-emerald-500/20 transition-all select-none">
                    <input
                      type="checkbox"
                      checked={hasComplianceNeeds}
                      onChange={(e) => setHasComplianceNeeds(e.target.checked)}
                      className="accent-emerald-500 w-3.5 h-3.5 rounded-none border-slate-850"
                    />
                    <div className="text-left font-mono">
                      <p className="text-[11px] font-bold text-white uppercase tracking-wider">Compliance</p>
                      <p className="text-[9px] text-slate-500">SOC2 / ISO commitments</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-950/40 border border-slate-850 rounded-none cursor-pointer hover:border-emerald-500/20 transition-all select-none">
                    <input
                      type="checkbox"
                      checked={requiresHIPAA}
                      onChange={(e) => setRequiresHIPAA(e.target.checked)}
                      className="accent-emerald-500 w-3.5 h-3.5 rounded-none border-slate-850"
                    />
                    <div className="text-left font-mono">
                      <p className="text-[11px] font-bold text-white uppercase tracking-wider">HIPAA</p>
                      <p className="text-[9px] text-slate-500">Medical vault safety</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-950/40 border border-slate-850 rounded-none cursor-pointer hover:border-emerald-500/20 transition-all select-none">
                    <input
                      type="checkbox"
                      checked={requiresSSO}
                      onChange={(e) => setRequiresSSO(e.target.checked)}
                      className="accent-emerald-500 w-3.5 h-3.5 rounded-none border-slate-850"
                    />
                    <div className="text-left font-mono">
                      <p className="text-[11px] font-bold text-white uppercase tracking-wider">SAML SSO</p>
                      <p className="text-[9px] text-slate-500">Central user admin control</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-end pt-6 border-t border-slate-850">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-[#020617] font-mono font-bold uppercase tracking-wider text-[11px] px-5 py-2.5 rounded-none transition-all shadow-md shadow-emerald-500/5"
                >
                  Configure stack
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: STACK SELECTION */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="border-b border-slate-850 pb-4 text-left">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 font-mono">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  02 // AI Stack Components
                </h2>
                <p className="text-xs text-slate-400 mt-1">Check every paid seat subscription or developer API catalog active in the organization.</p>
              </div>

              {/* Strict Grid Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-left">
                {TOOLS.map((tool) => {
                  const isSelected = selectedTools.includes(tool.id);
                  return (
                    <div
                      key={tool.id}
                      onClick={() => handleToggleTool(tool.id)}
                      className={`relative flex items-start gap-3 p-4 bg-slate-950/40 border cursor-pointer select-none transition-all group rounded-none ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-950/5 ring-1 ring-emerald-500/25' 
                          : 'border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-950'
                      }`}
                    >
                      <div className={`p-2 rounded-none shrink-0 border ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-slate-900 border-slate-800 text-slate-500 group-hover:text-slate-350'
                      }`}>
                        {tool.category === 'Editor' && <Terminal className="w-3.5 h-3.5" />}
                        {tool.category === 'Assistant' && <Sparkles className="w-3.5 h-3.5" />}
                        {tool.category === 'API' && <Building2 className="w-3.5 h-3.5" />}
                        {tool.category === 'UI Generation' && <Plus className="w-3.5 h-3.5" />}
                      </div>

                      <div className="flex-grow min-w-0 font-mono">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-xs font-bold text-white uppercase tracking-wider truncate">{tool.name}</h3>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-none uppercase tracking-wider shrink-0 select-none ${
                            tool.category === 'API'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : tool.category === 'Editor'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {tool.category}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-500 mt-1 font-sans">
                          {tool.isApi ? 'Usage API billing' : 'Seat SaaS subscription'}
                        </p>
                      </div>

                      {/* Small Tech Active Decal */}
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-6 border-t border-slate-850 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 border border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white px-5 py-2.5 rounded-none transition-all text-xs font-mono uppercase tracking-wider"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Back
                </button>

                <button
                  disabled={selectedTools.length === 0}
                  onClick={() => setStep(3)}
                  className={`flex items-center gap-1.5 font-mono font-bold uppercase tracking-wider text-[11px] px-5 py-2.5 rounded-none shadow-md transition-all ${
                    selectedTools.length === 0
                      ? 'bg-slate-850 text-slate-650 cursor-not-allowed shadow-none border border-slate-800'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-[#020617] shadow-emerald-500/5'
                  }`}
                >
                  Configure Details
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: DETAILS & SPEND / LEAD FORM */}
          {step === 3 && (
            <div className="space-y-6">
              {!showLeadCapture ? (
                <>
                  <div className="border-b border-slate-850 pb-4 text-left">
                    <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 font-mono">
                      <Sliders className="w-4 h-4 text-emerald-400" />
                      03 // Rates & Constraints Tuning
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Match your plans to official price schedules or adjust numbers for customized discount structures.</p>
                  </div>

                  {/* Tech Grid configurations list */}
                  <div className="space-y-4 pt-2">
                    {selectedTools.map((toolId) => {
                      const metadata = TOOLS.find(t => t.id === toolId);
                      const config = toolConfigs[toolId];
                      if (!metadata || !config) return null;

                      return (
                        <div key={toolId} className="bg-slate-950/40 border border-slate-850 rounded-none p-5 space-y-4 text-left relative">
                          {/* Inner Tech TL corner dot */}
                          <div className="absolute top-0 left-0 w-1 h-1 bg-slate-850" />
                          
                          <div className="flex items-center justify-between border-b border-slate-850/80 pb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="p-1 bg-emerald-500/10 border border-emerald-500/30 rounded-none text-emerald-400">
                                {metadata.category === 'Editor' && <Terminal className="w-3.5 h-3.5" />}
                                {metadata.category === 'Assistant' && <Sparkles className="w-3.5 h-3.5" />}
                                {metadata.category === 'API' && <Building2 className="w-3.5 h-3.5" />}
                                {metadata.category === 'UI Generation' && <Plus className="w-3.5 h-3.5" />}
                              </div>
                              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">{metadata.name}</span>
                            </div>
                            <span className="text-[9px] font-mono text-slate-500 tracking-widest uppercase">CAT: {metadata.category}</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
                            {!metadata.isApi ? (
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Plan Selection</label>
                                <select
                                  value={config.planId}
                                  onChange={(e) => handlePlanChange(toolId, e.target.value)}
                                  className="bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-none px-3 py-2 text-[11px] text-white outline-none cursor-pointer"
                                >
                                  {metadata.plans.map(plan => (
                                    <option key={plan.id} value={plan.id}>
                                      {plan.name} {plan.price >= 0 ? `($${plan.price}/mo)` : '(Custom)'}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Billing Tier</label>
                                <div className="bg-slate-950 border border-slate-800 text-slate-500 text-[11px] px-3 py-2 rounded-none font-bold uppercase tracking-wider select-none">
                                  Usage API
                                </div>
                              </div>
                            )}

                            <div className="flex flex-col gap-1.5">
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                {metadata.isApi ? 'Developer Accounts' : 'Seats Count'}
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={config.seats}
                                onChange={(e) => handleSeatChange(toolId, Math.max(1, Number(e.target.value)))}
                                className="bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-none px-3 py-2 text-[11px] text-white outline-none"
                              />
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Actual Spend / month</label>
                              <div className="relative">
                                <span className="absolute left-3 top-2 text-[11px] text-slate-500 font-bold">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={config.enteredMonthlySpend}
                                  onChange={(e) => setToolConfigs({
                                    ...toolConfigs,
                                    [toolId]: {
                                      ...config,
                                      enteredMonthlySpend: Math.max(0, Number(e.target.value))
                                    }
                                  })}
                                  className="bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-none pl-6 pr-3 py-2 text-[11px] text-white outline-none w-full"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between pt-6 border-t border-slate-850 mt-6">
                    <button
                      onClick={() => setStep(2)}
                      className="flex items-center gap-1.5 border border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white px-5 py-2.5 rounded-none transition-all text-xs font-mono uppercase tracking-wider"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Back
                    </button>

                    <button
                      onClick={() => setShowLeadCapture(true)}
                      className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-[#020617] font-mono font-bold uppercase tracking-wider text-[11px] px-6 py-2.5 rounded-none shadow-md shadow-emerald-500/5 transition-all"
                    >
                      Generate Audit Report
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                /* LEAD CAPTURE FORM */
                <form onSubmit={handleSaveAndRunAudit} className="space-y-6 max-w-sm mx-auto py-6 font-mono text-left">
                  <div className="text-center space-y-2 border-b border-slate-850 pb-4 mb-4">
                    <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-none flex items-center justify-center mx-auto mb-2">
                      <Mail className="w-5 h-5" />
                    </div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-widest font-mono">Unlock Stack Report</h2>
                    <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                      Register work details to compute audit metrics and output your dynamic shareable dashboard URL.
                    </p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="lead-email" className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Work Email Address</label>
                      <input
                        id="lead-email"
                        type="email"
                        required
                        placeholder="user@organization.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-none px-4 py-2.5 text-xs text-white outline-none w-full font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="lead-company" className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Company / Org Name (Optional)</label>
                      <input
                        id="lead-company"
                        type="text"
                        placeholder="Initech Corp"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-none px-4 py-2.5 text-xs text-white outline-none w-full font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="lead-role" className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Job Title / Role (Optional)</label>
                      <input
                        id="lead-role"
                        type="text"
                        placeholder="CTO / Head of Engineering"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-none px-4 py-2.5 text-xs text-white outline-none w-full font-mono"
                      />
                    </div>

                    {/* Honeypot field - invisible to humans, auto-filled by bots */}
                    <div className="hidden" style={{ display: 'none' }}>
                      <label htmlFor="lead-website" className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Website</label>
                      <input
                        id="lead-website"
                        type="text"
                        name="website"
                        tabIndex={-1}
                        autoComplete="off"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-none px-4 py-2.5 text-xs text-white outline-none w-full font-mono"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 justify-center">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setShowLeadCapture(false)}
                      className="border border-slate-850 bg-slate-950/40 text-slate-400 hover:text-white px-5 py-2.5 rounded-none transition-all text-xs font-mono uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-[#020617] font-mono font-bold uppercase tracking-wider text-xs px-6 py-2.5 rounded-none shadow-md shadow-emerald-500/5 disabled:bg-slate-850 disabled:text-slate-650"
                    >
                      {loading ? (
                        <>
                          <div className="w-3.5 h-3.5 border border-[#020617] border-t-transparent animate-spin"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          Build Report
                          <ChevronRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* STEP 4: AUDIT RESULTS DISPLAY */}
          {step === 4 && auditResult && (() => {
            const spendPerDeveloper = Math.round(auditResult.totalCurrentSpend / teamSize);
            let benchmarkAverage = 65;
            if (teamSize <= 5) {
              benchmarkAverage = 40;
            } else if (teamSize > 25) {
              benchmarkAverage = 90;
            }
            return (
              <div className="space-y-8 text-left">
              
              {/* UTILITY HERO STAT PANEL */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-none p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-center justify-between relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="space-y-3 font-mono">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 text-[8px] font-bold rounded-none border uppercase tracking-widest select-none ${
                      auditResult.overallSeverity === 'high'
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : auditResult.overallSeverity === 'medium'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                     }`}>
                      SEVERITY LEVEL: {auditResult.overallSeverity}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-white uppercase tracking-wider font-mono">
                    Audit stack results
                  </h2>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Deterministic analytics resolved from live markdown pricing schedules.
                  </p>
                </div>

                <div className="flex gap-4 shrink-0 font-mono w-full sm:w-auto pt-4 md:pt-0">
                  <div className="text-center bg-slate-950 border border-slate-850 p-4 rounded-none shrink-0 w-28 sm:w-32">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Monthly savings</p>
                    <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">${auditResult.monthlySavings}</p>
                  </div>

                  <div className="text-center bg-emerald-500 text-[#020617] border border-emerald-400 p-4 rounded-none shrink-0 w-28 sm:w-32 shadow-lg shadow-emerald-500/5">
                    <p className="text-[9px] font-extrabold uppercase tracking-widest">Annual savings</p>
                    <p className="text-xl sm:text-2xl font-black mt-1">${auditResult.annualSavings}</p>
                  </div>
                </div>
              </div>

              {/* METRIC_SYNTHESIS_REPORT // COGNITIVE_ANALYSIS */}
              {auditResult.aiSummary && (
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
                    <span className="text-[8px] text-slate-500">ENGINE: GEMINI_2.5_FLASH</span>
                  </div>
                  
                  <div className="text-xs text-slate-350 leading-relaxed font-mono">
                    <p className="inline">{auditResult.aiSummary}</p>
                    <span className="inline-block w-1.5 h-3.5 bg-emerald-400 ml-1.5 align-middle animate-pulse" />
                  </div>
                </div>
              )}

              {/* CREDEX CONDITIONAL BANNER OR LOW-SAVINGS HONESTY BANNER */}
              {auditResult.monthlySavings > 500 ? (
                <div className="bg-emerald-950/5 border border-emerald-500/30 rounded-none p-6 flex flex-col sm:flex-row gap-5 items-center justify-between text-left font-mono relative">
                  <div className="absolute top-0 left-0 w-2 h-[1px] bg-emerald-500" />
                  <div className="flex gap-3.5 items-start">
                    <div className="p-2.5 bg-emerald-500/10 rounded-none border border-emerald-500/30 text-emerald-400 shrink-0 select-none">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono">You may qualify for discounted enterprise AI credits.</h4>
                      <p className="text-[10px] text-slate-450 font-sans leading-relaxed">
                        Teams with similar usage patterns reduced spend further through Credex marketplace pricing.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsConsultModalOpen(true)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-[#020617] border border-emerald-400 font-mono font-bold uppercase tracking-wider text-[10px] px-5 py-2.5 rounded-none shadow-md shrink-0 transition-all cursor-pointer whitespace-nowrap"
                  >
                    Book Free Consultation
                  </button>
                </div>
              ) : (
                <div className="p-6 bg-slate-950/40 border border-slate-850 rounded-none text-left space-y-4 font-mono relative">
                  <div className="absolute top-0 left-0 w-2 h-[1px] bg-slate-550" />
                  <div className="flex gap-3.5 items-start">
                    <div className="p-2.5 bg-slate-900 rounded-none border border-slate-800 text-slate-400 shrink-0 select-none">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono">Your stack already appears reasonably optimized.</h4>
                      <p className="text-[10px] text-slate-450 font-sans leading-relaxed">
                        Join the waitlist to get notified when new optimization opportunities become available.
                      </p>
                    </div>
                  </div>
                  
                  {waitlistSubmitted ? (
                    <div className="text-[10px] text-emerald-400 font-mono px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/20 max-w-sm">
                      [ WAITLIST_LOGGED ]: Thank you! We will notify you of fresh API rate plans or licenses.
                    </div>
                  ) : (
                    <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md pt-1">
                      <input
                        type="email"
                        required
                        placeholder="Enter email for optimization alerts"
                        value={waitlistEmail}
                        onChange={(e) => setWaitlistEmail(e.target.value)}
                        className="bg-slate-950 border border-slate-800 focus:border-slate-500 rounded-none px-3 py-1.5 text-[10px] text-white outline-none font-mono flex-grow"
                      />
                      <button
                        type="submit"
                        className="bg-slate-900 hover:bg-slate-850 text-white border border-slate-700 font-mono font-bold uppercase tracking-wider text-[9px] px-4 py-2 rounded-none transition-all cursor-pointer shrink-0"
                      >
                        Join Waitlist
                      </button>
                    </form>
                  )}
                </div>
              )}

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
                    <span className="text-emerald-400 font-semibold">OPTIMAL BUDGET: Outstanding! Your team&apos;s average AI tool spend is optimized and runs lower than peer averages by {Math.round((benchmarkAverage - spendPerDeveloper) / benchmarkAverage * 100)}%.</span>
                  ) : (
                    <span className="text-emerald-400 font-semibold">OPTIMAL BUDGET: Well aligned! Your team&apos;s average AI tool spend matches the peer cohort average exactly.</span>
                  )}
                </p>
              </div>

              {/* Dynamic Shareable Link Card */}
              {savedSlug && (
                <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-none flex flex-col sm:flex-row gap-4 items-center justify-between text-left font-mono">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                      Dynamic shared URL
                    </h4>
                    <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                      Share this static dashboard. Personally identifiable information is fully omitted from the output.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 p-1.5 rounded-none w-full sm:w-auto">
                    <span className="text-[10px] font-mono text-slate-400 truncate max-w-xs px-2 select-all">
                      {origin}/audit/{savedSlug}
                    </span>
                    <button
                      onClick={handleCopyLink}
                      className="bg-emerald-500 hover:bg-emerald-600 text-[#020617] font-bold p-2 rounded-none transition-colors flex items-center gap-1 shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span className="text-[8px] uppercase font-bold tracking-widest pr-1">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[8px] uppercase font-bold tracking-widest pr-1">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}



              {/* Breakdowns strict list */}
              <div className="space-y-4 font-mono">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">
                  Tool-Specific Analysis Insights
                </h3>
                
                <div className="space-y-4">
                  {auditResult.results.map((result) => {
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
                            <span className="text-[9px] text-slate-500">[{result.currentPlanName}]</span>
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
                          <div className="space-y-1 text-[10px] font-medium text-slate-550">
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

                          <div className="md:col-span-2 p-3 bg-slate-950/60 border border-slate-850 rounded-none text-[11px] text-slate-350 leading-relaxed font-sans">
                            {result.recommendation}
                          </div>
                        </div>

                        {(result.creditFlag || (result.capabilityGap && result.capabilityGap.length > 0)) && (
                          <div className="p-3 bg-slate-950 border border-slate-850 rounded-none space-y-2 text-[10px] font-mono leading-relaxed">
                            {result.creditFlag && (
                              <div className="flex gap-2 items-start">
                                <Coins className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <p className="text-slate-400 font-medium">{result.creditMessage}</p>
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

              {/* REFERRAL SYSTEM PANEL */}
              {savedSlug && (
                <div className="bg-slate-950/40 border border-slate-850 p-6 rounded-none text-left font-mono relative space-y-3">
                  <div className="absolute top-0 left-0 w-2 h-[1px] bg-emerald-500" />
                  <div className="flex justify-between items-center border-b border-slate-850/80 pb-2.5">
                    <span className="text-[10px] font-bold text-emerald-400 tracking-widest flex items-center gap-2">
                      <Coins className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      REFERRAL ACQUISITION SYSTEM
                    </span>
                    <span className="text-[8px] text-slate-500">REF_CODE: {savedSlug.slice(0, 8).toUpperCase()}-CRD</span>
                  </div>
                  <div className="text-[11px] text-slate-350 leading-relaxed font-sans font-medium">
                    Share this audit report or your unique referral link. When another team runs an audit using your code <span className="font-semibold text-emerald-400 font-mono">{savedSlug.slice(0, 8).toUpperCase()}-CRD</span>, <strong>both of you get 30% off</strong> on your first Credex enterprise license integration!
                  </div>
                </div>
              )}

              {/* Verification payload JSON log */}
              <div className="border border-slate-800 bg-slate-950/10 p-4 rounded-none font-mono text-left relative">
                <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-slate-800" />
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] font-bold text-slate-550 tracking-widest">VERIFICATION LOG</span>
                  <span className="text-[8px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-none font-mono border border-emerald-500/30">PARSER_OK</span>
                </div>
                <details className="cursor-pointer">
                  <summary className="text-[11px] text-slate-400 hover:text-emerald-400 transition-colors font-medium">
                    Toggle raw engine result JSON payload structures
                  </summary>
                  <pre className="text-[10px] font-mono bg-slate-950 border border-slate-850 p-4 rounded-none overflow-x-auto mt-2 text-slate-350 max-h-40 overflow-y-auto">
                    {JSON.stringify(auditResult, null, 2)}
                  </pre>
                </details>
              </div>

              {/* FEEDBACK & INTEGRATION REQUESTS PANEL */}
              <div className="bg-slate-950/40 border border-slate-850 p-6 rounded-none text-left font-mono relative space-y-4 print:hidden">
                <div className="absolute top-0 left-0 w-2 h-[1px] bg-emerald-500" />
                <div className="flex justify-between items-center border-b border-slate-850/80 pb-2.5">
                  <span className="text-[10px] font-bold text-emerald-400 tracking-widest flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    FEEDBACK & TOOL REQUESTS
                  </span>
                  <span className="text-[8px] text-slate-500">FEEDBACK_TELEMETRY</span>
                </div>
                
                <p className="text-[11px] text-slate-350 leading-relaxed font-sans">
                  Are your primary developer tools or services missing from our compiler? Suggest what we should integrate next or share your general feedback.
                </p>

                {feedbackSubmitted ? (
                  <div className="p-4 bg-emerald-950/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono rounded-none">
                    [ REQUEST_LOGGED // THANK_YOU ]: Your feedback has been logged directly inside your audit record telemetry. We will review it shortly.
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                    <textarea
                      required
                      rows={3}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="e.g. Windsurf Teams, v0 Business, Cursor Enterprise limits, custom OpenAI tokens..."
                      className="bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-none p-3 text-[11px] text-white outline-none w-full font-mono resize-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={feedbackSubmitting || !feedbackText.trim()}
                        className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-850 disabled:text-slate-650 text-[#020617] font-mono font-bold uppercase tracking-wider text-[10px] px-4 py-2 rounded-none shadow-md transition-all cursor-pointer"
                      >
                        {feedbackSubmitting ? 'Logging...' : 'Submit Request'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Reset navigation */}
              <div className="flex justify-center gap-4 pt-6 border-t border-slate-800 mt-6 font-mono print:hidden">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 border border-slate-850 bg-slate-950/40 text-slate-400 hover:text-white px-6 py-2.5 rounded-none transition-all text-xs font-mono uppercase tracking-wider"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Modify configurations
                </button>
                <ExportPdfButton />
              </div>

            </div>
          );
        })()}

        {/* CONSULTATION LEAD CAPTURE MODAL */}
        {isConsultModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm font-mono">
            <div className="relative w-full max-w-md bg-[#020617] border border-emerald-500/30 p-6 sm:p-8 space-y-6 shadow-2xl rounded-none">
              {/* Tech Corners decal */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-emerald-500" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-emerald-500" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-emerald-500" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-emerald-500" />

              <div className="flex justify-between items-start border-b border-slate-850 pb-4">
                <div className="space-y-1 text-left">
                  <span className="px-2 py-0.5 text-[8px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-none tracking-widest uppercase select-none">
                    SAVINGS ESCALATION
                  </span>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Book Free Consultation</h3>
                </div>
                <button 
                  onClick={() => { setIsConsultModalOpen(false); setConsultSubmitted(false); }}
                  className="text-slate-500 hover:text-white transition-colors text-xs p-1"
                >
                  [ESC]
                </button>
              </div>

              {consultSubmitted ? (
                <div className="space-y-4 py-4 text-center">
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-none flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Consultation Request Logged</h4>
                    <p className="text-[10px] text-slate-450 font-sans leading-relaxed max-w-xs mx-auto">
                      An enterprise licensing strategist will analyze your stack optimization indicators and reach out to you within 24 hours.
                    </p>
                  </div>
                  <button
                    onClick={() => { setIsConsultModalOpen(false); setConsultSubmitted(false); }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-[#020617] border border-emerald-400 font-mono font-bold uppercase tracking-wider text-[10px] px-5 py-2.5 rounded-none shadow-md transition-all cursor-pointer w-full"
                  >
                    Return to Audit
                  </button>
                </div>
              ) : (
                <form onSubmit={handleConsultSubmit} className="space-y-4 text-left">
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-slate-455 uppercase tracking-widest">Work Email Address</label>
                      <input
                        type="email"
                        required
                        value={consultEmail}
                        onChange={(e) => setConsultEmail(e.target.value)}
                        className="bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-none px-3.5 py-2 text-xs text-white outline-none w-full"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-slate-455 uppercase tracking-widest">Company / Org Name</label>
                      <input
                        type="text"
                        required
                        value={consultCompany}
                        onChange={(e) => setConsultCompany(e.target.value)}
                        className="bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-none px-3.5 py-2 text-xs text-white outline-none w-full"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-slate-455 uppercase tracking-widest">Job Title / Role</label>
                        <input
                          type="text"
                          required
                          value={consultRole}
                          onChange={(e) => setConsultRole(e.target.value)}
                          className="bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-none px-3.5 py-2 text-xs text-white outline-none w-full"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-slate-455 uppercase tracking-widest">Team Size (Seats)</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={consultTeamSize}
                          onChange={(e) => setConsultTeamSize(Math.max(1, Number(e.target.value)))}
                          className="bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-none px-3.5 py-2 text-xs text-white outline-none w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsConsultModalOpen(false)}
                      className="border border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white px-5 py-2.5 rounded-none transition-all text-xs font-mono uppercase tracking-wider flex-grow text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={consultSubmitting}
                      className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-850 disabled:text-slate-650 text-[#020617] border border-emerald-400 font-mono font-bold uppercase tracking-wider text-xs px-6 py-2.5 rounded-none shadow-md transition-all cursor-pointer flex-grow text-center"
                    >
                      {consultSubmitting ? 'Submitting...' : 'Book Free Consultation'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#020617] text-[#f8fafc] font-mono">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-[10px] uppercase tracking-widest text-slate-400">Loading system catalog...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
