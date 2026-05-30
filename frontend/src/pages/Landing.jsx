import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';

export default function Landing() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const plan = user.plan === 'pro' ? 'pro' : 'free';
        navigate(`/editor/${plan}`, { replace: true });
      } catch (e) {
        // Ignorar si el JSON es inválido
      }
    }
  }, [navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="bg-background min-h-screen text-on-background relative overflow-x-hidden">
      <Navbar />
      
      {/* Ambient Background Elements with Animation - Hidden on mobile */}
      <div className="fixed inset-0 z-[-1] pointer-events-none hidden md:block">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], x: [0, 20, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-surface-container-high rounded-full blur-[100px] opacity-60"
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], x: [0, -30, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] right-[-5%] w-[30%] h-[50%] bg-surface-container-low rounded-full blur-[120px] opacity-80"
        />
      </div>

      <motion.main 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="pt-32 pb-24 px-gutter max-w-container-max mx-auto flex flex-col gap-stack-lg"
      >
        {/* Hero Section */}
        <section className="text-center flex flex-col items-center gap-stack-md pt-12">
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/30 backdrop-blur-sm mb-4">
            <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <span className="font-label-caps text-[12px] font-bold text-primary tracking-widest">{t('landing.powered_by_ai')}</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-black tracking-tighter text-on-surface max-w-4xl mx-auto leading-tight">
            {t('landing.title')} <br/> 
            <span className="text-primary-container">{t('landing.title_highlight')}</span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mt-6">
            {t('landing.subtitle')}
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-center gap-4 mt-8">
            <Link to="/upgrade" className="bg-primary-container text-white font-bold px-8 py-4 rounded-btn shadow-[0_4px_14px_0_rgba(255,107,0,0.39)] hover:shadow-[0_6px_20px_rgba(255,107,0,0.23)] hover:-translate-y-1 transition-all duration-200 active:scale-95 no-underline">
              {t('landing.cta_pro')}
            </Link>
            <Link to="/login" className="bg-white/70 dark:bg-[#1a1512]/70 backdrop-blur-lg text-on-surface font-bold px-8 py-4 rounded-btn border border-outline dark:border-outline-variant/30 hover:bg-surface-container-low dark:hover:bg-surface-container-high transition-all duration-200 active:scale-95 no-underline">
              {t('landing.cta_free')}
            </Link>
          </motion.div>
        </section>

        {/* Pricing Cards */}
        <section className="max-w-4xl mx-auto w-full mt-16 flex flex-col items-center gap-stack-md">
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-on-surface">{t('landing.pricing_title')}</h2>
            <p className="text-on-surface-variant mt-2">{t('landing.pricing_subtitle')}</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full px-4 text-left">
            {/* Free Card */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="bg-white/70 dark:bg-[#1a1512]/70 backdrop-blur-[20px] rounded-card border border-slate-200 dark:border-outline-variant/30 p-8 flex flex-col shadow-sm relative z-10"
            >
              <div className="mb-6">
                <h3 className="text-xl font-bold text-on-surface">{t('landing.plan_starter')}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-5xl font-black text-on-surface">{t('landing.price_free')}</span>
                  <span className="text-on-surface-variant">{t('landing.per_month')}</span>
                </div>
                <p className="text-on-surface-variant mt-2">{t('landing.starter_desc')}</p>
              </div>
              <ul className="flex flex-col gap-4 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-on-surface">
                  <span className="material-symbols-outlined text-primary text-sm">check_circle</span> {t('landing.feature_basic')}
                </li>
                <li className="flex items-center gap-3 text-on-surface">
                  <span className="material-symbols-outlined text-primary text-sm">check_circle</span> {t('landing.feature_limited')}
                </li>
              </ul>
              <Link to="/login" className="w-full text-center bg-white dark:bg-surface text-on-surface font-bold px-4 py-3 rounded-btn border border-outline dark:border-outline-variant/30 hover:bg-surface-container-low dark:hover:bg-surface-container-high transition-colors no-underline">
                {t('landing.cta_free')}
              </Link>
            </motion.div>

            {/* Pro Card */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -10 }}
              className="bg-white/90 dark:bg-[#1a1512]/90 backdrop-blur-[24px] rounded-card border-2 border-primary-container p-8 flex flex-col shadow-xl relative z-20 transform md:-translate-y-4"
            >
              <div className="absolute -top-4 right-8 bg-primary-container text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-md">
                {t('landing.most_popular')}
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-primary-container">{t('landing.plan_pro')}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-5xl font-black text-on-surface">{t('landing.price_pro')}</span>
                  <span className="text-on-surface-variant">{t('landing.per_month')}</span>
                </div>
                <p className="text-on-surface-variant mt-2">{t('landing.pro_desc')}</p>
              </div>
              <ul className="flex flex-col gap-4 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-on-surface font-medium">
                  <span className="material-symbols-outlined text-primary-container text-sm">check_circle</span> {t('landing.feature_advanced')}
                </li>
                <li className="flex items-center gap-3 text-on-surface font-medium">
                  <span className="material-symbols-outlined text-primary-container text-sm">check_circle</span> {t('landing.feature_unlimited')}
                </li>
                <li className="flex items-center gap-3 text-on-surface font-medium">
                  <span className="material-symbols-outlined text-primary-container text-sm">check_circle</span> {t('landing.feature_toc')}
                </li>
              </ul>
              <Link to="/upgrade" className="w-full text-center bg-primary-container text-white font-bold px-4 py-3 rounded-btn shadow-lg hover:opacity-90 transition-all no-underline">
                {t('landing.cta_pro')}
              </Link>
            </motion.div>
          </div>
        </section>
      </motion.main>
      
      <footer className="w-full py-12 bg-white dark:bg-[#110e0c] border-t border-slate-100 dark:border-outline-variant/30 text-xs text-slate-500 dark:text-on-surface-variant transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-bold text-slate-900 dark:text-on-surface text-sm">DocAI</div>
          <div>© 2024 DocAI. Precision academic formatting powered by AI.</div>
        </div>
      </footer>
    </div>
  );
}
