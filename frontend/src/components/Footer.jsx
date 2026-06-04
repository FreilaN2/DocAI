import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-12 bg-white dark:bg-[#110e0c] border-t border-slate-100 dark:border-outline-variant/30 text-xs text-slate-500 dark:text-on-surface-variant transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="font-bold text-slate-900 dark:text-on-surface text-sm">DocIA</div>
        <div className="flex items-center gap-1">
          <span>© {currentYear} DocIA. Desarrollado por</span>
          <a 
            href="https://prisma-code.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-bold text-primary-container hover:text-orange-700 dark:hover:text-orange-400 transition-colors no-underline"
          >
            Prisma Code
          </a>
        </div>
      </div>
    </footer>
  );
}