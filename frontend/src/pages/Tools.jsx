import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Tools() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-surface font-sans transition-colors duration-300 flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 md:px-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="text-center w-full max-w-2xl mx-auto"
        >
          {/* Contenedor del ícono */}
          <div className="relative inline-block mb-6 sm:mb-8">
            {/* Círculo principal */}
            <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-primary-container/10 dark:bg-primary-container/20 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl sm:text-5xl md:text-6xl lg:text-8xl text-primary-container">
                construction
              </span>
            </div>
            
            {/* Badge de settings */}
            <div className="absolute -right-2 -bottom-2 sm:-right-3 sm:-bottom-3 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white dark:bg-surface-variant rounded-full flex items-center justify-center shadow-lg border border-slate-100 dark:border-outline-variant/30">
              <span className="material-symbols-outlined text-base sm:text-lg md:text-xl lg:text-2xl text-orange-500">
                settings
              </span>
            </div>
          </div>

          {/* Título */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-on-surface mb-4 sm:mb-6 tracking-tight px-2">
            {t('tools_page.title')}
          </h1>
          
          {/* Subtítulo */}
          <p className="text-on-surface-variant text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed px-2">
            {t('tools_page.subtitle')}
          </p>

          {/* Badge de "Próximamente" */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mt-8 sm:mt-10 md:mt-12"
          >
            <span className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs sm:text-sm font-bold border border-amber-200 dark:border-amber-700/30">
              <span className="material-symbols-outlined text-sm sm:text-base">rocket_launch</span>
              Próximamente
            </span>
          </motion.div>

          {/* Indicador de scroll (opcional, visible en desktop) */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="hidden md:flex items-center justify-center gap-2 mt-12 text-slate-400 dark:text-slate-500"
          >
            <span className="material-symbols-outlined text-sm animate-bounce">arrow_downward</span>
            <span className="text-xs font-medium">Más herramientas pronto</span>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}