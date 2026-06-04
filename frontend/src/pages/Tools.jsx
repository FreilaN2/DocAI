import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Tools() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-surface font-sans transition-colors duration-300">
      <Navbar />
      
      <main className="pt-32 pb-16 px-4 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[80vh]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="text-center"
        >
          <div className="relative inline-block mb-8">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-primary-container/10 dark:bg-primary-container/20 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-6xl sm:text-8xl text-primary-container">construction</span>
            </div>
            {/* Icono de settings ESTÁTICO - sin animación infinita */}
            <div className="absolute -right-2 -bottom-2 w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-surface-variant rounded-full flex items-center justify-center shadow-lg border border-slate-100 dark:border-outline-variant/30">
              <span className="material-symbols-outlined text-xl sm:text-2xl text-orange-500">settings</span>
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl font-black text-on-surface mb-6 tracking-tight">
            {t('tools_page.title')}
          </h1>
          <p className="text-on-surface-variant text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            {t('tools_page.subtitle')}
          </p>

        </motion.div>
      </main>
    </div>
  );
}