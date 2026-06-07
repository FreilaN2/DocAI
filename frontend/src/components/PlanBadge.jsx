import React from 'react';

export default function PlanBadge({ plan }) {
  const isPro = plan === 'pro';
  
  return (
    <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-full font-black text-[9px] sm:text-[10px] md:text-[11px] tracking-widest uppercase shadow-sm border transition-all ${
      isPro 
        ? 'bg-primary-container text-white border-primary-container/20' 
        : 'bg-slate-900 text-white border-slate-700'
    }`}>
      <span className="material-symbols-outlined text-xs sm:text-sm md:text-base">
        {isPro ? 'workspace_premium' : 'person'}
      </span>
      <span className="whitespace-nowrap">
        {isPro ? 'Plan Researcher Pro' : 'Plan Starter Free'}
      </span>
    </div>
  );
}