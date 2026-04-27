import React from 'react';

export default function PlanBadge({ plan }) {
  const isPro = plan === 'pro';
  
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest uppercase shadow-sm border ${
      isPro 
        ? 'bg-primary-container text-white border-primary-container/20' 
        : 'bg-slate-900 text-white border-slate-700'
    }`}>
      <span className="material-symbols-outlined text-sm">
        {isPro ? 'workspace_premium' : 'person'}
      </span>
      {isPro ? 'Plan Researcher Pro' : 'Plan Starter Free'}
    </div>
  );
}
