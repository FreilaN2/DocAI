import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-6 sm:py-8 md:py-10 lg:py-12 bg-white dark:bg-[#110e0c] border-t border-slate-100 dark:border-outline-variant/30 text-xs sm:text-sm text-slate-500 dark:text-on-surface-variant transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4 md:gap-6">
        {/* Logo / Brand */}
        <div className="font-bold text-slate-900 dark:text-on-surface text-sm sm:text-base md:text-lg">
          DocIA
        </div>
        
        {/* Copyright y créditos */}
        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center sm:text-left">
          <span className="text-xs sm:text-sm">© {currentYear} DocIA.</span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
          <span className="text-xs sm:text-sm">
            Desarrollado por{' '}
            <a 
              href="https://prisma-code.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-bold text-primary-container hover:text-orange-700 dark:hover:text-orange-400 transition-colors no-underline inline-block"
            >
              Prisma Code
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}