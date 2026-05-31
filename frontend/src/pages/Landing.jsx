import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';

export default function Landing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

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

        {/* How it Works Section */}
        <section className="max-w-5xl mx-auto w-full mt-24 px-4">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-on-surface">{t('landing.hiw_title')}</h2>
            <p className="text-on-surface-variant mt-2 text-lg">{t('landing.hiw_subtitle')}</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-primary-container/0 via-primary-container/30 to-primary-container/0 z-0"></div>
            
            <motion.div variants={itemVariants} className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-white dark:bg-surface border-4 border-slate-100 dark:border-outline-variant/30 flex items-center justify-center mb-6 shadow-xl">
                <span className="material-symbols-outlined text-4xl text-primary-container">upload_file</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3">{t('landing.hiw_step1_title')}</h3>
              <p className="text-on-surface-variant leading-relaxed">{t('landing.hiw_step1_desc')}</p>
            </motion.div>

            <motion.div variants={itemVariants} className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-white dark:bg-surface border-4 border-slate-100 dark:border-outline-variant/30 flex items-center justify-center mb-6 shadow-xl">
                <span className="material-symbols-outlined text-4xl text-primary-container">auto_fix</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3">{t('landing.hiw_step2_title')}</h3>
              <p className="text-on-surface-variant leading-relaxed">{t('landing.hiw_step2_desc')}</p>
            </motion.div>

            <motion.div variants={itemVariants} className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-white dark:bg-surface border-4 border-slate-100 dark:border-outline-variant/30 flex items-center justify-center mb-6 shadow-xl">
                <span className="material-symbols-outlined text-4xl text-primary-container">download_done</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3">{t('landing.hiw_step3_title')}</h3>
              <p className="text-on-surface-variant leading-relaxed">{t('landing.hiw_step3_desc')}</p>
            </motion.div>
          </div>
        </section>

        {/* Features Grid Section */}
        <section className="max-w-6xl mx-auto w-full mt-32 px-4 mb-16">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-on-surface">{t('landing.feat_title')}</h2>
            <p className="text-on-surface-variant mt-2 text-lg">{t('landing.feat_subtitle')}</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="bg-white/50 dark:bg-[#1a1512]/50 backdrop-blur-md p-8 rounded-3xl border border-slate-200 dark:border-outline-variant/20 shadow-sm flex gap-6">
              <div className="w-14 h-14 shrink-0 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-3xl">my_location</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-on-surface mb-2">{t('landing.feat1_title')}</h3>
                <p className="text-on-surface-variant leading-relaxed">{t('landing.feat1_desc')}</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="bg-white/50 dark:bg-[#1a1512]/50 backdrop-blur-md p-8 rounded-3xl border border-slate-200 dark:border-outline-variant/20 shadow-sm flex gap-6">
              <div className="w-14 h-14 shrink-0 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-3xl">timer</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-on-surface mb-2">{t('landing.feat2_title')}</h3>
                <p className="text-on-surface-variant leading-relaxed">{t('landing.feat2_desc')}</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="bg-white/50 dark:bg-[#1a1512]/50 backdrop-blur-md p-8 rounded-3xl border border-slate-200 dark:border-outline-variant/20 shadow-sm flex gap-6">
              <div className="w-14 h-14 shrink-0 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-3xl">shield_lock</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-on-surface mb-2">{t('landing.feat3_title')}</h3>
                <p className="text-on-surface-variant leading-relaxed">{t('landing.feat3_desc')}</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="bg-white/50 dark:bg-[#1a1512]/50 backdrop-blur-md p-8 rounded-3xl border border-slate-200 dark:border-outline-variant/20 shadow-sm flex gap-6">
              <div className="w-14 h-14 shrink-0 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-3xl">format_list_numbered</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-on-surface mb-2">{t('landing.feat4_title')}</h3>
                <p className="text-on-surface-variant leading-relaxed">{t('landing.feat4_desc')}</p>
              </div>
            </motion.div>
          </div>
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
                  <span className="material-symbols-outlined text-primary text-sm">check_circle</span> {t('landing.feature_free_1')}
                </li>
                <li className="flex items-center gap-3 text-on-surface">
                  <span className="material-symbols-outlined text-primary text-sm">check_circle</span> {t('landing.feature_free_2')}
                </li>
                <li className="flex items-center gap-3 text-on-surface">
                  <span className="material-symbols-outlined text-primary text-sm">check_circle</span> {t('landing.feature_free_3')}
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
                  <span className="material-symbols-outlined text-primary-container text-sm">check_circle</span> {t('landing.feature_pro_1')}
                </li>
                <li className="flex items-center gap-3 text-on-surface font-medium">
                  <span className="material-symbols-outlined text-primary-container text-sm">check_circle</span> {t('landing.feature_pro_2')}
                </li>
                <li className="flex items-center gap-3 text-on-surface font-medium">
                  <span className="material-symbols-outlined text-primary-container text-sm">check_circle</span> {t('landing.feature_pro_3')}
                </li>
              </ul>
              <Link to="/upgrade" className="w-full text-center bg-primary-container text-white font-bold px-4 py-3 rounded-btn shadow-lg hover:opacity-90 transition-all no-underline">
                {t('landing.cta_pro')}
              </Link>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-3xl mx-auto w-full mt-32 mb-16 px-4">
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-on-surface">{t('landing.faq_title')}</h2>
            <p className="text-on-surface-variant mt-2 text-lg">{t('landing.faq_subtitle')}</p>
          </motion.div>
          
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((num) => (
              <motion.div 
                key={num}
                variants={itemVariants}
                className="bg-white/70 dark:bg-[#1a1512]/70 backdrop-blur-lg border border-slate-200 dark:border-outline-variant/30 rounded-2xl overflow-hidden"
              >
                <button 
                  onClick={() => toggleFaq(num)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="font-bold text-on-surface text-lg">{t(`landing.faq${num}_q`)}</span>
                  <motion.span 
                    animate={{ rotate: openFaq === num ? 180 : 0 }} 
                    className="material-symbols-outlined text-on-surface-variant"
                  >
                    expand_more
                  </motion.span>
                </button>
                <AnimatePresence>
                  {openFaq === num && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-5"
                    >
                      <p className="text-on-surface-variant leading-relaxed">{t(`landing.faq${num}_a`)}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </section>

      </motion.main>
      
      <footer className="w-full py-12 bg-white dark:bg-[#110e0c] border-t border-slate-100 dark:border-outline-variant/30 text-xs text-slate-500 dark:text-on-surface-variant transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-bold text-slate-900 dark:text-on-surface text-sm">DocIA</div>
          <div>© {new Date().getFullYear()} DocIA. Precision academic formatting powered by AI.</div>
        </div>
      </footer>
    </div>
  );
}
