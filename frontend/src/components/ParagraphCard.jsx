import React from 'react';
import { useTranslation } from 'react-i18next';

const CATEGORIES_LIST = [
  { id: 'TITULO_N1', color: 'bg-blue-600', light: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800/30', text: 'text-blue-700 dark:text-blue-400' },
  { id: 'TITULO_N2', color: 'bg-indigo-600', light: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800/30', text: 'text-indigo-700 dark:text-indigo-400' },
  { id: 'REFERENCIA', color: 'bg-emerald-600', light: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800/30', text: 'text-emerald-700 dark:text-emerald-400' },
  { id: 'PARRAFO_NORMAL', color: 'bg-slate-400', light: 'bg-slate-50 dark:bg-surface-variant', border: 'border-slate-200 dark:border-outline-variant/30', text: 'text-slate-600 dark:text-on-surface-variant' },
  { id: 'PORTADA_BLOQUE', color: 'bg-slate-800', light: 'bg-slate-200 dark:bg-slate-800', border: 'border-slate-400 dark:border-slate-600', text: 'text-slate-800 dark:text-slate-200' },
];

export default function ParagraphCard({ item, onLabelChange }) {
  const { t } = useTranslation();
  const currentCat = CATEGORIES_LIST.find(c => c.id === item.categoria) || CATEGORIES_LIST[3];

  const isReadOnly = item.categoria === 'PORTADA_BLOQUE';

  return (
    <div className={`group p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 bg-white dark:bg-surface ${currentCat.border} hover:shadow-md ${isReadOnly ? 'opacity-90' : ''}`}>
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Texto del párrafo */}
        <div className="flex-grow">
          <p className={`text-xs sm:text-sm leading-relaxed text-on-surface font-medium ${isReadOnly ? 'font-bold text-center' : 'italic'} mb-3 sm:mb-4 whitespace-pre-wrap`}>
            {isReadOnly ? item.texto : `"${item.texto}"`}
          </p>
          
          {/* Controles de categoría */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-3">
            {/* Badge de categoría actual */}
            <span className={`text-[9px] sm:text-[10px] font-black px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg uppercase tracking-widest whitespace-nowrap ${currentCat.light} ${currentCat.text}`}>
              {isReadOnly ? 'PORTADA PROTEGIDA' : t(`categories.${currentCat.id}`)}
            </span>
            
            {!isReadOnly && (
              <>
                {/* Separador - visible en sm+ */}
                <div className="hidden sm:block h-4 w-[1px] bg-slate-200 dark:bg-outline-variant/30"></div>
            
            {/* Selector de categorías */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-on-surface-variant uppercase tracking-tighter whitespace-nowrap">
                Cambiar a:
              </span>
              <div className="flex gap-1 sm:gap-1.5 flex-wrap">
                {CATEGORIES_LIST.filter(c => c.id !== 'PORTADA_BLOQUE').map(cat => (
                  <button
                    key={cat.id}
                    title={t(`categories.${cat.id}`)}
                    onClick={() => onLabelChange(item.id, cat.id)}
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-all transform hover:scale-125 active:scale-110 ${cat.color} ${
                      item.categoria === cat.id 
                        ? 'ring-2 ring-offset-2 dark:ring-offset-[#1a1512] ring-slate-400 dark:ring-on-surface-variant scale-110' 
                        : 'opacity-40 hover:opacity-100'
                    }`}
                    aria-label={t(`categories.${cat.id}`)}
                  />
                ))}
              </div>
            </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}