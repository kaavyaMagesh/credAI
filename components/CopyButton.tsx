"use client";

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  textToCopy: string;
  label?: string;
}

export default function CopyButton({ textToCopy, label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className="bg-emerald-500 hover:bg-emerald-600 text-[#020617] font-bold p-2 rounded-none transition-all flex items-center gap-1 shrink-0 cursor-pointer select-none active:scale-95"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" />
          <span className="text-[8px] uppercase font-bold tracking-widest pr-1">Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          {label && <span className="text-[8px] uppercase font-bold tracking-widest pr-1">{label}</span>}
        </>
      )}
    </button>
  );
}
