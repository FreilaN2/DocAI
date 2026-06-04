import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Cerrar menú móvil al navegar
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
    <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-[#110e0c]/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-outline-variant/30 shadow-sm font-sans transition-colors duration-300">
      <div className="flex justify-between items-center max-w-7xl mx-auto px-4 sm:px-8 h-16 sm:h-20">
        <Link to="/" className="flex items-center gap-2 no-underline hover:opacity-90 transition-opacity min-w-0 flex-shrink">
          <img src="/LOGO.png" alt="DocIA" className="h-7 sm:h-12 w-auto object-contain dark:hidden" />
          <img src="/LOGO2.png" alt="DocIA" className="h-7 sm:h-12 w-auto object-contain hidden dark:block" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className={`flex items-center gap-1.5 ${location.pathname === '/' ? "text-primary-container font-bold border-b-2 border-primary-container pb-1 hover:opacity-80 transition-all no-underline" : "text-slate-600 dark:text-on-surface-variant font-medium hover:text-primary-container dark:hover:text-primary-container transition-colors no-underline"}`}>
            <span className="material-symbols-outlined text-[18px]">home</span>
            {t('navbar.home')}
          </Link>
          
          <Link to="/tools" className={`flex items-center gap-1.5 ${location.pathname === '/tools' ? "text-primary-container font-bold border-b-2 border-primary-container pb-1 hover:opacity-80 transition-all no-underline" : "text-slate-600 dark:text-on-surface-variant font-medium hover:text-primary-container dark:hover:text-primary-container transition-colors no-underline"}`}>
            <span className="material-symbols-outlined text-[18px]">construction</span>
            {t('navbar.tools')}
          </Link>

          <Link to="/upgrade" className={`flex items-center gap-1.5 ${location.pathname === '/upgrade' ? "text-primary-container font-bold border-b-2 border-primary-container pb-1 hover:opacity-80 transition-all no-underline" : "text-slate-600 dark:text-on-surface-variant font-medium hover:text-primary-container dark:hover:text-primary-container transition-colors no-underline"}`}>
            <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
            {t('navbar.pricing')}
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {/* Support Link */}
          <Link to="/support" className={`hidden md:flex items-center gap-1.5 ${location.pathname === '/support' ? "text-primary-container font-bold" : "text-slate-600 dark:text-on-surface-variant font-medium hover:text-primary-container dark:hover:text-primary-container"} transition-colors no-underline mr-2`}>
            <span className="material-symbols-outlined text-[18px]">support_agent</span>
            {t('navbar.support')}
          </Link>

          {/* Language Toggle - Con banderas */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-100 dark:bg-surface-variant hover:bg-slate-200 dark:hover:bg-surface-container-high text-slate-600 dark:text-on-surface-variant transition-all active:scale-90 border border-slate-200 dark:border-outline/50"
            title={i18n.language?.startsWith('es') ? 'Switch to English' : 'Cambiar a Español'}
          >
            {i18n.language?.startsWith('es') ? (
              <>
                <img 
                  src="https://flagcdn.com/w20/es.png" 
                  alt="English" 
                  className="w-4 h-3 sm:w-5 sm:h-3.5 rounded-sm shadow-sm object-cover"
                />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">ES</span>
              </>
            ) : (
              <>
                <img 
                  src="https://flagcdn.com/w20/us.png" 
                  alt="Español" 
                  className="w-4 h-3 sm:w-5 sm:h-3.5 rounded-sm shadow-sm object-cover"
                />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">EN</span>
              </>
            )}
            <span className="material-symbols-outlined text-[14px] sm:text-sm">swap_horiz</span>
          </button>

          {/* User Menu - SIN AnimatePresence para evitar re-renders */}
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 dark:bg-surface-variant p-1 sm:p-1.5 pr-2 sm:pr-4 rounded-full border border-slate-200 dark:border-outline/50">
              {/* Avatar con inicial */}
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm text-white
                ${isPro ? 'bg-gradient-to-br from-orange-500 to-amber-600' : 'bg-primary-container'}`}>
                {user.firstName?.charAt(0).toUpperCase()}
              </div>

              {/* Nombre + Badge PRO */}
              <div className="hidden md:flex items-center gap-2">
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
              
              {/* Enlace al perfil solo visible en mobile */}
              <Link to="/profile" className="md:hidden flex items-center material-symbols-outlined text-slate-400 hover:text-primary-container transition-colors text-[20px] no-underline">
                person
              </Link>

              {/* Botón logout */}
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="material-symbols-outlined text-slate-400 hover:text-red-500 transition-colors text-[20px] sm:text-xl ml-1 sm:ml-0"
                title={t('navbar.logout_title')}
              >
                logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-4">
              <Link to="/login" className="flex items-center gap-1 text-slate-600 dark:text-on-surface-variant hover:text-primary-container dark:hover:text-primary-container transition-colors text-xs sm:text-sm font-medium no-underline">
                <span className="material-symbols-outlined text-[18px]">login</span>
                {t('navbar.login')}
              </Link>
              <Link to="/register" className="hidden sm:flex items-center gap-1.5 bg-primary-container text-white text-xs sm:text-base font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-btn shadow-sm hover:opacity-90 transition-all no-underline whitespace-nowrap">
                <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                {t('navbar.get_started')}
              </Link>
            </div>
          )}

          {/* Hamburger Menu Toggle (Mobile Only) */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex items-center justify-center p-1.5 ml-1 rounded-lg text-slate-600 dark:text-on-surface-variant hover:bg-slate-100 dark:hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown - OPTIMIZADO sin animar height */}
      <div 
        className={`md:hidden border-t border-slate-200 dark:border-outline-variant/30 bg-white dark:bg-[#110e0c] transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="flex flex-col px-4 py-4 space-y-4">
          <Link to="/" className={`flex items-center gap-2 ${location.pathname === '/' ? "text-primary-container font-bold" : "text-slate-600 dark:text-on-surface-variant font-medium"}`}>
            <span className="material-symbols-outlined text-[20px]">home</span>
            {t('navbar.home')}
          </Link>
          <Link to="/tools" className={`flex items-center gap-2 ${location.pathname === '/tools' ? "text-primary-container font-bold" : "text-slate-600 dark:text-on-surface-variant font-medium"}`}>
            <span className="material-symbols-outlined text-[20px]">construction</span>
            {t('navbar.tools')}
          </Link>
          <Link to="/upgrade" className={`flex items-center gap-2 ${location.pathname === '/upgrade' ? "text-primary-container font-bold" : "text-slate-600 dark:text-on-surface-variant font-medium"}`}>
            <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
            {t('navbar.pricing')}
          </Link>
          <Link to="/support" className={`flex items-center gap-2 ${location.pathname === '/support' ? "text-primary-container font-bold" : "text-slate-600 dark:text-on-surface-variant font-medium"}`}>
            <span className="material-symbols-outlined text-[20px]">support_agent</span>
            {t('navbar.support')}
          </Link>
          {!user && (
            <div className="pt-2 mt-2 border-t border-slate-200 dark:border-outline-variant/30">
              <Link to="/register" className="flex items-center justify-center gap-2 bg-primary-container text-white font-bold py-3 rounded-lg shadow-sm hover:opacity-90 transition-all no-underline">
                <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
                {t('navbar.get_started')}
              </Link>
            </div>
          )}
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
            transition={{ duration: 0.2 }}
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
                className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 active:scale-95 transition-all"
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