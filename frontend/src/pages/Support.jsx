import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';

// Constantes de clases para inputs
const INPUT_CLASSES = "w-full bg-slate-50 dark:bg-[#110e0c] px-4 py-3 rounded-xl border border-slate-200 dark:border-outline-variant/50 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all text-on-surface placeholder-slate-400 dark:placeholder-slate-600";

// Componente memoizado para campos del formulario
const FormField = React.memo(({ label, type = 'text', required = true, placeholder, isTextarea = false, rows = 5 }) => {
  const inputProps = {
    type,
    required,
    placeholder,
    className: `${INPUT_CLASSES} ${isTextarea ? 'resize-none' : ''}`,
  };

  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 dark:text-on-surface mb-2">
        {label}
      </label>
      {isTextarea ? (
        <textarea {...inputProps} rows={rows} />
      ) : (
        <input {...inputProps} />
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

export default function Support() {
  const { t } = useTranslation();

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    // Obtener datos del formulario
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Aquí iría la llamada a la API para enviar el soporte
    console.log('Datos del formulario:', data);
    
    // Feedback al usuario
    alert(t('support.success'));
    
    // Limpiar formulario
    e.target.reset();
  }, [t]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-surface font-sans transition-colors duration-300">
      <Navbar />
      
      <main className="pt-32 pb-16 px-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 animate-fadeIn">
          <div className="w-16 h-16 bg-primary-container/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl text-primary-container">
              support_agent
            </span>
          </div>
          <h1 className="text-4xl font-black text-on-surface mb-4">
            {t('support.title')}
          </h1>
          <p className="text-on-surface-variant text-lg">
            {t('support.subtitle')}
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white dark:bg-[#1a1512]/70 backdrop-blur-md border border-slate-200 dark:border-outline-variant/30 rounded-3xl p-8 shadow-sm animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <FormField 
              label={t('support.name')}
              type="text"
              placeholder={t('support.name_ph')}
            />
            
            <FormField 
              label={t('support.email')}
              type="email"
              placeholder={t('support.email_ph')}
            />

            <FormField 
              label={t('support.subject')}
              type="text"
              placeholder={t('support.subject_ph')}
            />

            <FormField 
              label={t('support.message')}
              isTextarea
              rows={5}
              placeholder={t('support.message_ph')}
            />

            <button 
              type="submit" 
              className="w-full bg-primary-container text-white font-bold px-6 py-4 rounded-xl shadow-md hover:bg-[#ff8533] transition-all flex items-center justify-center gap-2 mt-2 active:scale-[0.98] transform duration-150"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
              {t('support.send')}
            </button>
          </form>
        </div>

        {/* Información adicional de contacto */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <div className="bg-white dark:bg-[#1a1512]/70 backdrop-blur-md border border-slate-200 dark:border-outline-variant/30 rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
            <span className="material-symbols-outlined text-3xl text-primary-container mb-3">mail</span>
            <h3 className="font-bold text-on-surface mb-1">{t('support.email_us')}</h3>
            <p className="text-sm text-on-surface-variant">support@docia.com</p>
          </div>

          <div className="bg-white dark:bg-[#1a1512]/70 backdrop-blur-md border border-slate-200 dark:border-outline-variant/30 rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
            <span className="material-symbols-outlined text-3xl text-primary-container mb-3">schedule</span>
            <h3 className="font-bold text-on-surface mb-1">{t('support.response_time')}</h3>
            <p className="text-sm text-on-surface-variant">{t('support.response_time_desc')}</p>
          </div>

          <div className="bg-white dark:bg-[#1a1512]/70 backdrop-blur-md border border-slate-200 dark:border-outline-variant/30 rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
            <span className="material-symbols-outlined text-3xl text-primary-container mb-3">help_center</span>
            <h3 className="font-bold text-on-surface mb-1">{t('support.faq_link')}</h3>
            <p className="text-sm text-on-surface-variant">{t('support.faq_link_desc')}</p>
          </div>
        </div>
      </main>
    </div>
  );
}