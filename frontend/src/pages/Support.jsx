import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';

export default function Support() {
  const { t } = useTranslation();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate sending
    alert(t('support.success'));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-surface font-sans transition-colors duration-300">
      <Navbar />
      
      <main className="pt-32 pb-16 px-4 max-w-2xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-16 h-16 bg-primary-container/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl text-primary-container">support_agent</span>
          </div>
          <h1 className="text-4xl font-black text-on-surface mb-4">{t('support.title')}</h1>
          <p className="text-on-surface-variant text-lg">{t('support.subtitle')}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#1a1512]/70 backdrop-blur-md border border-slate-200 dark:border-outline-variant/30 rounded-3xl p-8 shadow-sm"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-on-surface mb-2">{t('support.name')}</label>
              <input type="text" required placeholder={t('support.name_ph')} className="w-full bg-slate-50 dark:bg-[#110e0c] px-4 py-3 rounded-xl border border-slate-200 dark:border-outline-variant/50 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all text-on-surface placeholder-slate-400 dark:placeholder-slate-600" />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-on-surface mb-2">{t('support.email')}</label>
              <input type="email" required placeholder={t('support.email_ph')} className="w-full bg-slate-50 dark:bg-[#110e0c] px-4 py-3 rounded-xl border border-slate-200 dark:border-outline-variant/50 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all text-on-surface placeholder-slate-400 dark:placeholder-slate-600" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-on-surface mb-2">{t('support.subject')}</label>
              <input type="text" required placeholder={t('support.subject_ph')} className="w-full bg-slate-50 dark:bg-[#110e0c] px-4 py-3 rounded-xl border border-slate-200 dark:border-outline-variant/50 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all text-on-surface placeholder-slate-400 dark:placeholder-slate-600" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-on-surface mb-2">{t('support.message')}</label>
              <textarea required rows="5" placeholder={t('support.message_ph')} className="w-full bg-slate-50 dark:bg-[#110e0c] px-4 py-3 rounded-xl border border-slate-200 dark:border-outline-variant/50 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all text-on-surface placeholder-slate-400 dark:placeholder-slate-600 resize-none"></textarea>
            </div>

            <button type="submit" className="w-full bg-primary-container text-white font-bold px-6 py-4 rounded-xl shadow-md hover:bg-[#ff8533] transition-colors flex items-center justify-center gap-2 mt-2">
              <span className="material-symbols-outlined text-[20px]">send</span>
              {t('support.send')}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
