import React from 'react';

// Constantes fuera del componente para evitar recreaciones
const PLAN_CONFIG = {
  pro: {
    icon: 'workspace_premium',
    text: 'Plan Researcher Pro',
    className: 'bg-primary-container text-white border-primary-container/20'
  },
  free: {
    icon: 'person',
    text: 'Plan Starter Free',
    className: 'bg-slate-900 text-white border-slate-700'
  }
};

const PlanBadge = React.memo(({ plan }) => {
  const config = PLAN_CONFIG[plan] || PLAN_CONFIG.free;
  
  return (
    <div 
      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest uppercase shadow-sm border ${config.className}`}
      role="status"
      aria-label={`Plan: ${config.text}`}
    >
      <span 
        className="material-symbols-outlined text-sm"
        aria-hidden="true"
      >
        {config.icon}
      </span>
      {config.text}
    </div>
  );
});

PlanBadge.displayName = 'PlanBadge';

export default PlanBadge;