"use client";

import React from 'react';
import { FileText } from 'lucide-react';

export default function ExportPdfButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 hover:text-emerald-400 transition-colors border border-slate-800 hover:border-emerald-500/20 bg-slate-900/40 rounded-none cursor-pointer"
    >
      <FileText className="w-3.5 h-3.5" />
      Export PDF
    </button>
  );
}
