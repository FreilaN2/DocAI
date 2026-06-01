import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Navbar() {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Optimizar el efecto del tema
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Optimizar la actualización de autenticación
  const updateAuth = useCallback(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setIsPro(parsed.plan === 'pro');
      } catch (e) {
        setUser(null);
        setIsPro(false);
      }
    } else {
      setUser(null);
      setIsPro(false);
    }
  }, []);

  useEffect(() => {
    updateAuth();
    window.addEventListener('storage', updateAuth);
    return () => window.removeEventListener('storage', updateAuth);
  }, [updateAuth]);

  const toggleLanguage = useCallback(() => {
    const currentLang = i18n.language || 'es';
    const newLang = currentLang.startsWith('es') ? 'en' : 'es';
    i18n.changeLanguage(newLang);
  }, [i18n]);

  const confirmLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsPro(false);
    setShowLogoutConfirm(false);
    navigate('/');
  }, [navigate]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Función helper para las clases de los links de navegación
  const getNavLinkClass = useCallback((path) => {
    const isActive = location.pathname === path;
    return `flex items-center gap-1.5 ${
      isActive 
        ? "text-primary-container font-bold border-b-2 border-primary-container pb-1" 
        : "text-slate-600 dark:text-on-surface-variant font-medium hover:text-primary-container dark:hover:text-primary-container"
    } transition-colors no-underline`;
  }, [location.pathname]);

  // Componente memoizado para el botón de toggle
  const ToggleButton = React.memo(({ onClick, className, children }) => (
    <button
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  ));

  // Componente memoizado para los links del menú móvil
  const MobileNavLink = React.memo(({ to, icon, children, isActive }) => (
    <Link 
      to={to} 
      onClick={closeMobileMenu} 
      className={`flex items-center gap-2 ${
        isActive ? "text-primary-container font-bold" : "text-slate-600 dark:text-on-surface-variant font-medium"
      }`}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      {children}
    </Link>
  ));

  return (
    <>
    <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-[#110e0c]/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-outline-variant/30 shadow-sm font-sans transition-colors duration-300">
      <div className="flex justify-between items-center max-w-7xl mx-auto px-4 sm:px-8 h-16 sm:h-20">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 no-underline hover:opacity-90 transition-opacity min-w-0 flex-shrink">
          <img src="/LOGO.png" alt="DocIA" className="h-7 sm:h-12 w-auto object-contain dark:hidden" loading="eager" />
          <img src="/LOGO2.png" alt="DocIA" className="h-7 sm:h-12 w-auto object-contain hidden dark:block" loading="eager" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className={getNavLinkClass('/')}>
            <span className="material-symbols-outlined text-[18px]">home</span>
            {t('navbar.home')}
          </Link>
          
          <Link to="/tools" className={getNavLinkClass('/tools')}>
            <span className="material-symbols-outlined text-[18px]">construction</span>
            {t('navbar.tools')}
          </Link>

          <Link to="/upgrade" className={getNavLinkClass('/upgrade')}>
            <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
            {t('navbar.pricing')}
          </Link>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {/* Support Link - Desktop only */}
          <Link 
            to="/support" 
            className={`hidden md:flex items-center gap-1.5 ${
              location.pathname === '/support' 
                ? "text-primary-container font-bold" 
                : "text-slate-600 dark:text-on-surface-variant font-medium hover:text-primary-container dark:hover:text-primary-container"
            } transition-colors no-underline mr-2`}
          >
            <span className="material-symbols-outlined text-[18px]">support_agent</span>
            {t('navbar.support')}
          </Link>

          {/* Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-100 dark:bg-surface-variant hover:bg-slate-200 dark:hover:bg-surface-container-high text-slate-600 dark:text-on-surface-variant transition-colors border border-slate-200 dark:border-outline/50 active:scale-95 transform duration-150"
          >
            <span className="material-symbols-outlined text-[16px] sm:text-sm">language</span>
            <span className="text-[10px] font-black uppercase tracking-widest hidden xs:block">
              {i18n.language?.startsWith('es') ? 'EN' : 'ES'}
            </span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-surface-variant hover:bg-slate-200 dark:hover:bg-surface-container-high text-slate-600 dark:text-on-surface-variant transition-colors border border-slate-200 dark:border-outline/50 active:scale-95 transform duration-150"
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* User Menu - con transición CSS */}
          <div className="relative">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 dark:bg-surface-variant p-1 sm:p-1.5 pr-2 sm:pr-4 rounded-full border border-slate-200 dark:border-outline/50 animate-fadeIn">
                {/* Avatar con inicial */}
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm text-white
                  ${isPro ? 'bg-gradient-to-br from-orange-500 to-amber-600' : 'bg-primary-container'}`}>
                  {user.firstName?.charAt(0).toUpperCase()}
                </div>

                {/* Nombre + Badge PRO - Desktop */}
                <div className="hidden md:flex items-center gap-2">
                  <Link to="/profile" className="text-sm font-bold text-slate-700 dark:text-on-surface no-underline">
                    {t('navbar.hello')}{user.firstName}
                  </Link>
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
                
                {/* Perfil link - Mobile only */}
                <Link to="/profile" className="md:hidden flex items-center material-symbols-outlined text-slate-400 hover:text-primary-container transition-colors text-[20px] no-underline">
                  person
                </Link>

                {/* Logout button */}
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="material-symbols-outlined text-slate-400 hover:text-red-500 transition-colors text-[20px] sm:text-xl ml-1 sm:ml-0"
                  title={t('navbar.logout_title')}
                >
                  logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-4 animate-fadeIn">
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
          </div>

          {/* Hamburger Menu Toggle (Mobile Only) */}
          <button 
            onClick={toggleMobileMenu}
            className="md:hidden flex items-center justify-center p-1.5 ml-1 rounded-lg text-slate-600 dark:text-on-surface-variant hover:bg-slate-100 dark:hover:bg-surface-variant transition-colors"
            aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            <span className="material-symbols-outlined text-[24px]">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown - con CSS transitions */}
      <div 
        className={`md:hidden border-t border-slate-200 dark:border-outline-variant/30 bg-white dark:bg-[#110e0c] transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="flex flex-col px-4 py-4 space-y-4">
          <MobileNavLink to="/" icon="home" isActive={location.pathname === '/'}>
            {t('navbar.home')}
          </MobileNavLink>
          <MobileNavLink to="/tools" icon="construction" isActive={location.pathname === '/tools'}>
            {t('navbar.tools')}
          </MobileNavLink>
          <MobileNavLink to="/upgrade" icon="workspace_premium" isActive={location.pathname === '/upgrade'}>
            {t('navbar.pricing')}
          </MobileNavLink>
          <MobileNavLink to="/support" icon="support_agent" isActive={location.pathname === '/support'}>
            {t('navbar.support')}
          </MobileNavLink>
          {!user && (
            <div className="pt-2 mt-2 border-t border-slate-200 dark:border-outline-variant/30">
              <Link to="/register" onClick={closeMobileMenu} className="flex items-center justify-center gap-2 bg-primary-container text-white font-bold py-3 rounded-lg shadow-sm hover:opacity-90 transition-all no-underline">
                <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
                {t('navbar.get_started')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>

    {/* Logout Confirmation Modal - con CSS transitions */}
    {showLogoutConfirm && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn">
        {/* Overlay */}
        <div 
          onClick={() => setShowLogoutConfirm(false)}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
        />
        
        {/* Modal */}
        <div className="relative bg-white dark:bg-[#1a1512] rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-outline-variant/30 text-center animate-fadeInUp">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">logout</span>
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-on-surface mb-2">
            {t('navbar.logout_confirm_title')}
          </h3>
          <p className="text-slate-500 dark:text-on-surface-variant text-sm mb-8">
            {t('navbar.logout_confirm_desc')}
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-on-surface-variant bg-slate-100 dark:bg-surface-variant hover:bg-slate-200 dark:hover:bg-surface-container-high transition-colors active:scale-95 transform duration-150"
            >
              {t('navbar.cancel')}
            </button>
            <button
              onClick={confirmLogout}
              className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 transition-all active:scale-95 transform duration-150"
            >
              {t('navbar.yes_logout')}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}