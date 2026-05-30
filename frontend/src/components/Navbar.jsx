import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  useEffect(() => {
    const updateAuth = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          setIsPro(parsed.plan === 'pro');
        } catch (e) {}
      } else {
        setUser(null);
        setIsPro(false);
      }
    };

    updateAuth();

    window.addEventListener('storage', updateAuth);
    return () => window.removeEventListener('storage', updateAuth);
  }, []);

  const toggleLanguage = () => {
    const currentLang = i18n.language || 'es';
    const newLang = currentLang.startsWith('es') ? 'en' : 'es';
    i18n.changeLanguage(newLang);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsPro(false);
    setShowLogoutConfirm(false);
    navigate('/');
  };

  return (
    <>
    <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-[#110e0c]/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-outline-variant/30 shadow-sm font-sans transition-colors duration-300">
      <div className="flex justify-between items-center max-w-7xl mx-auto px-8 h-20">
        <Link to="/" className="flex items-center gap-2 no-underline hover:opacity-90 transition-opacity">
          <img src="/LOGO.png" alt="DocIA" className="h-10 sm:h-12 w-auto dark:hidden" />
          <img src="/LOGO2.png" alt="DocIA" className="h-10 sm:h-12 w-auto hidden dark:block" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-primary-container font-bold border-b-2 border-primary-container pb-1 hover:opacity-80 transition-all no-underline">
            {t('navbar.home')}
          </Link>
          <a href="#" className="text-slate-600 dark:text-on-surface-variant font-medium hover:text-primary-container dark:hover:text-primary-container transition-colors no-underline">{t('navbar.features')}</a>
          <Link to="/upgrade" className="text-slate-600 dark:text-on-surface-variant font-medium hover:text-primary-container dark:hover:text-primary-container transition-colors no-underline">{t('navbar.pricing')}</Link>
        </div>

        <div className="flex items-center gap-4">
          {/* Language Toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-surface-variant hover:bg-slate-200 dark:hover:bg-surface-container-high text-slate-600 dark:text-on-surface-variant transition-colors border border-slate-200 dark:border-outline/50"
          >
            <span className="material-symbols-outlined text-sm">language</span>
            <span className="text-[10px] font-black uppercase tracking-widest">
              {i18n.language?.startsWith('es') ? 'EN' : 'ES'}
            </span>
          </motion.button>

          {/* Theme Toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-surface-variant hover:bg-slate-200 dark:hover:bg-surface-container-high text-slate-600 dark:text-on-surface-variant transition-colors border border-slate-200 dark:border-outline/50"
          >
            <span className="material-symbols-outlined text-[18px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </motion.button>

          <AnimatePresence mode="wait">
            {user ? (
              <motion.div
                key="user-menu"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-3 bg-slate-50 dark:bg-surface-variant p-1.5 pr-4 rounded-full border border-slate-200 dark:border-outline/50"
              >
                {/* Avatar con inicial */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white
                  ${isPro ? 'bg-gradient-to-br from-orange-500 to-amber-600' : 'bg-primary-container'}`}>
                  {user.firstName?.charAt(0).toUpperCase()}
                </div>

                {/* Nombre + Badge PRO */}
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/profile" className="text-sm font-bold text-slate-700 dark:text-on-surface no-underline">{t('navbar.hello')}{user.firstName}</Link>
                  {isPro ? (
                    <span className="text-[9px] font-black bg-gradient-to-r from-orange-500 to-amber-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                      PRO
                    </span>
                  ) : (
                    <Link to="/upgrade"
                      className="text-[9px] font-black bg-slate-200 dark:bg-surface-container-high text-slate-500 dark:text-on-surface-variant px-2 py-0.5 rounded-full uppercase tracking-widest hover:bg-orange-100 hover:text-primary-container transition-colors no-underline">
                      Free ↑
                    </Link>
                  )}
                </div>

                {/* Botón logout */}
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="material-symbols-outlined text-slate-400 hover:text-red-500 transition-colors text-xl"
                  title={t('navbar.logout_title')}
                >
                  logout
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="guest-menu"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-4"
              >
                <Link to="/login" className="text-slate-600 dark:text-on-surface-variant hover:text-primary-container dark:hover:text-primary-container transition-colors font-medium no-underline hidden sm:block">
                  {t('navbar.login')}
                </Link>
                <Link to="/register" className="bg-primary-container text-white font-bold px-4 py-2 rounded-btn shadow-sm hover:opacity-90 transition-all no-underline">
                  {t('navbar.get_started')}
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>

    {/* Logout Confirmation Modal */}
    <AnimatePresence>
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLogoutConfirm(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-[#1a1512] rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-outline-variant/30 text-center"
          >
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">logout</span>
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-on-surface mb-2">{t('navbar.logout_confirm_title')}</h3>
            <p className="text-slate-500 dark:text-on-surface-variant text-sm mb-8">{t('navbar.logout_confirm_desc')}</p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-on-surface-variant bg-slate-100 dark:bg-surface-variant hover:bg-slate-200 dark:hover:bg-surface-container-high transition-colors"
              >
                {t('navbar.cancel')}
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 transition-all"
              >
                {t('navbar.yes_logout')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
