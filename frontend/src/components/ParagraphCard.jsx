import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const CATEGORIES_LIST = [
  { id: 'TITULO_N1', color: 'bg-blue-600', light: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800/30', text: 'text-blue-700 dark:text-blue-400' },
  { id: 'TITULO_N2', color: 'bg-indigo-600', light: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800/30', text: 'text-indigo-700 dark:text-indigo-400' },
  { id: 'REFERENCIA', color: 'bg-emerald-600', light: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800/30', text: 'text-emerald-700 dark:text-emerald-400' },
  { id: 'PARRAFO_NORMAL', color: 'bg-slate-400', light: 'bg-slate-50 dark:bg-surface-variant', border: 'border-slate-200 dark:border-outline-variant/30', text: 'text-slate-600 dark:text-on-surface-variant' },
];

// Componente memoizado para los botones de categoría
const CategoryButton = React.memo(({ cat, isActive, onClick, title }) => (
  <button
    title={title}
    onClick={() => onClick(cat.id)}
    className={`w-6 h-6 rounded-full transition-transform duration-200 ${
      cat.color
    } ${
      isActive 
        ? 'ring-2 ring-offset-2 dark:ring-offset-[#1a1512] ring-slate-400 dark:ring-on-surface-variant scale-110' 
        : 'opacity-40 hover:opacity-100 hover:scale-110'
    }`}
    style={{ transform: isActive ? 'scale(1.1)' : 'scale(1)' }}
  />
));

const ParagraphCard = React.memo(({ item, onLabelChange }) => {
  const { t } = useTranslation();
  
  // Encontrar la categoría actual de forma memoizada
  const currentCat = CATEGORIES_LIST.find(c => c.id === item.categoria) || CATEGORIES_LIST[3];

  // Callback optimizado para el cambio de categoría
  const handleLabelChange = useCallback((categoryId) => {
    if (categoryId !== item.categoria) {
      onLabelChange(item.id, categoryId);
    }
  }, [item.id, item.categoria, onLabelChange]);

  return (
    <div className={`group p-5 rounded-2xl border-2 transition-all duration-300 bg-white dark:bg-surface ${currentCat.border} hover:shadow-md`}>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-grow">
          {/* Texto del párrafo */}
          <p className="text-sm leading-relaxed text-on-surface font-medium italic mb-4 line-clamp-3">
            "{item.texto}"
          </p>
          
          {/* Controles de categoría */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Badge de categoría actual */}
            <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest ${currentCat.light} ${currentCat.text}`}>
              {t(`categories.${currentCat.id}`)}
            </span>
            
            {/* Separador - visible solo en desktop */}
            <div className="h-4 w-[1px] bg-slate-200 dark:bg-outline-variant/30 hidden md:block" aria-hidden="true" />
            
            {/* Selector de categorías */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-on-surface-variant uppercase tracking-tighter">
                Cambiar a:
              </span>
              <div className="flex gap-1.5">
                {CATEGORIES_LIST.map(cat => (
                  <CategoryButton
                    key={cat.id}
                    cat={cat}
                    isActive={item.categoria === cat.id}
                    onClick={handleLabelChange}
                    title={t(`categories.${cat.id}`)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// Asignar display name para debugging
ParagraphCard.displayName = 'ParagraphCard';
CategoryButton.displayName = 'CategoryButton';

export default ParagraphCard;