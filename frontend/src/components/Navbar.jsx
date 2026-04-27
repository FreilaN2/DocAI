import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const toggleLanguage = () => {
    const currentLang = i18n.language || 'es';
    const newLang = currentLang.startsWith('es') ? 'en' : 'es';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-lg border-b border-slate-200/50 shadow-sm font-sans">
      <div className="flex justify-between items-center max-w-7xl mx-auto px-8 h-20">
        <Link to="/" className="text-2xl font-black tracking-tighter text-primary-container no-underline">
          DocAI
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-primary-container font-bold border-b-2 border-primary-container pb-1 hover:opacity-80 transition-all no-underline">
            {t('navbar.home')}
          </Link>
          <a href="#" className="text-slate-600 font-medium hover:text-primary-container transition-colors no-underline">{t('navbar.features')}</a>
          <a href="#" className="text-slate-600 font-medium hover:text-primary-container transition-colors no-underline">{t('navbar.pricing')}</a>
        </div>
        
        <div className="flex items-center gap-4">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border border-slate-200"
          >
            <span className="material-symbols-outlined text-sm">language</span>
            <span className="text-[10px] font-black uppercase tracking-widest">
              {i18n.language?.startsWith('es') ? 'EN' : 'ES'}
            </span>
          </motion.button>

          <AnimatePresence mode="wait">
            {user ? (
              <motion.div 
                key="user-menu"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 bg-slate-50 p-1.5 pr-4 rounded-full border border-slate-200"
              >
                <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-sm">
                  {user.firstName?.charAt(0)}
                </div>
                <span className="text-sm font-bold text-slate-700 hidden sm:block">Hola, {user.firstName}</span>
                <button 
                  onClick={handleLogout}
                  className="material-symbols-outlined text-slate-400 hover:text-red-500 transition-colors text-xl ml-2"
                  title="Cerrar Sesión"
                >
                  logout
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="guest-menu"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-4"
              >
                <Link to="/login" className="text-slate-600 hover:text-primary-container transition-colors font-medium no-underline hidden sm:block">
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
  );
}
