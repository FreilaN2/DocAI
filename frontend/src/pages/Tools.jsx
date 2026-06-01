import React from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';

export default function Tools() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-surface font-sans transition-colors duration-300">
      <Navbar />
      
      <main className="pt-32 pb-16 px-4 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[80vh]">
        <div className="text-center animate-fadeIn">
          {/* Ícono con engranaje animado */}
          <div className="relative inline-block mb-8">
            {/* Círculo principal */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-primary-container/10 dark:bg-primary-container/20 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-6xl sm:text-8xl text-primary-container">
                construction
              </span>
            </div>
            
            {/* Engranaje giratorio */}
            <div className="absolute -right-2 -bottom-2 w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-surface-variant rounded-full flex items-center justify-center shadow-lg border border-slate-100 dark:border-outline-variant/30 animate-spin-slow">
              <span className="material-symbols-outlined text-xl sm:text-2xl text-orange-500">
                settings
              </span>
            </div>
          </div>

          {/* Título y descripción */}
          <h1 className="text-5xl sm:text-6xl font-black text-on-surface mb-6 tracking-tight">
            {t('tools_page.title')}
          </h1>
          <p className="text-on-surface-variant text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            {t('tools_page.subtitle')}
          </p>

          {/* Sección de herramientas próximas */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 - Próximamente */}
            <div className="bg-white dark:bg-[#1a1512]/70 backdrop-blur-md border border-slate-200 dark:border-outline-variant/30 rounded-2xl p-6 text-center hover:shadow-md transition-all hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-400">description</span>
              </div>
              <h3 className="font-bold text-on-surface mb-2">Generador de Citas</h3>
              <p className="text-xs text-on-surface-variant">Próximamente</p>
            </div>

            {/* Card 2 - Próximamente */}
            <div className="bg-white dark:bg-[#1a1512]/70 backdrop-blur-md border border-slate-200 dark:border-outline-variant/30 rounded-2xl p-6 text-center hover:shadow-md transition-all hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-2xl text-green-600 dark:text-green-400">plagiarism</span>
              </div>
              <h3 className="font-bold text-on-surface mb-2">Detector de Plagio</h3>
              <p className="text-xs text-on-surface-variant">Próximamente</p>
            </div>

            {/* Card 3 - Próximamente */}
            <div className="bg-white dark:bg-[#1a1512]/70 backdrop-blur-md border border-slate-200 dark:border-outline-variant/30 rounded-2xl p-6 text-center hover:shadow-md transition-all hover:-translate-y-1 duration-300 sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-2xl text-purple-600 dark:text-purple-400">translate</span>
              </div>
              <h3 className="font-bold text-on-surface mb-2">Traductor Académico</h3>
              <p className="text-xs text-on-surface-variant">Próximamente</p>
            </div>
          </div>

          {/* Badge de "En Desarrollo" */}
          <div className="mt-12 inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/30 rounded-full">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              {t('tools_page.in_development') || 'En Desarrollo'}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}