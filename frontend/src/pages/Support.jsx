import React, { useState } from 'react';
import { useForm, ValidationError } from '@formspree/react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// ─── Lista de dominios de correo desechable/falso ─────────────────────────────
const DISPOSABLE_DOMAINS = [
  'mailinator.com','guerrillamail.com','temp-mail.org','throwam.com',
  'yopmail.com','sharklasers.com','guerrillamailblock.com','grr.la',
  'guerrillamail.info','spam4.me','trashmail.com','trashmail.me',
  'trashmail.net','dispostable.com','maildrop.cc','fakeinbox.com',
  'tempmail.com','getairmail.com','discard.email','spamgourmet.com',
  'tempinbox.com','mailnull.com','spamhole.com','trashmail.at',
  'tempmail.ninja','mohmal.com','spamgob.com','throwam.com',
  'falso.com','fake.com','test.com','noemail.com','nomail.com',
  'example.com','domain.com','email.com','asd.com','asdf.com',
];

// ─── Validación de email ───────────────────────────────────────────────────────
function validateEmail(email) {
  const re = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if (!re.test(email)) return 'invalid';

  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return 'invalid';

  if (DISPOSABLE_DOMAINS.includes(domain)) return 'disposable';

  const [localPart, domainPart] = email.split('@');
  if (localPart.length < 3) return 'invalid';
  const domainParts = domainPart.split('.');
  if (domainParts[0].length < 2) return 'invalid';

  return 'ok';
}

export default function Support() {
  const { t } = useTranslation();
  const [state, handleFormspreeSubmit] = useForm("xkoaoddd");

  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});

  const subjectOptions = [
    { value: 'bug',        label: t('support.subjects.bug') },
    { value: 'billing',    label: t('support.subjects.billing') },
    { value: 'account',    label: t('support.subjects.account') },
    { value: 'feature',    label: t('support.subjects.feature') },
    { value: 'formatting', label: t('support.subjects.formatting') },
    { value: 'other',      label: t('support.subjects.other') },
  ];

  function validateField(field, value) {
    switch (field) {
      case 'name':
        return value.trim().length < 2 ? t('support.validation_name_required') : '';
      case 'email': {
        const res = validateEmail(value.trim());
        if (res === 'disposable') return t('support.validation_email_disposable');
        if (res !== 'ok') return t('support.validation_email_invalid');
        return '';
      }
      case 'subject':
        return !value ? t('support.validation_subject_required') : '';
      case 'message':
        return value.trim().length < 20 ? t('support.validation_message_short') : '';
      default:
        return '';
    }
  }

  function handleBlur(field, value) {
    setTouched(prev => ({ ...prev, [field]: true }));
    const err = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: err }));
  }

  function validateAll() {
    const fields = { name, email, subject, message };
    const newErrors = {};
    Object.keys(fields).forEach(f => {
      newErrors[f] = validateField(f, fields[f]);
    });
    setErrors(newErrors);
    setTouched({ name: true, email: true, subject: true, message: true });
    return Object.values(newErrors).every(e => !e);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateAll()) return;
    await handleFormspreeSubmit(e);
  }

  const inputClass = (field) =>
    `w-full bg-slate-50 dark:bg-[#110e0c] px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border transition-all text-on-surface placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 text-sm sm:text-base
    ${touched[field] && errors[field]
      ? 'border-red-400 dark:border-red-600 focus:border-red-400 focus:ring-red-300'
      : 'border-slate-200 dark:border-outline-variant/50 focus:border-primary-container focus:ring-primary-container'
    }`;

  // Spinner para el botón de envío
  const Spinner = () => (
    <svg className="animate-spin w-4 h-4 sm:w-5 sm:h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-surface font-sans transition-colors duration-300 flex flex-col">
      <Navbar />

      <main className="flex-1 pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 md:px-8 max-w-2xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-6 sm:mb-8 md:mb-10"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary-container/10 dark:bg-primary-container/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <span className="material-symbols-outlined text-3xl sm:text-4xl text-primary-container">support_agent</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-on-surface mb-3 sm:mb-4 px-2">
            {t('support.title')}
          </h1>
          <p className="text-on-surface-variant text-sm sm:text-base md:text-lg px-2">
            {t('support.subtitle')}
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="bg-white dark:bg-[#1a1512]/70 backdrop-blur-md border border-slate-200 dark:border-outline-variant/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm"
        >
          <AnimatePresence mode="wait">
            {/* ── Pantalla de éxito ── */}
            {state.succeeded ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-4 sm:gap-5 py-6 sm:py-8 text-center px-2"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-5xl sm:text-6xl text-emerald-500">check_circle</span>
                </motion.div>
                <h2 className="text-xl sm:text-2xl font-black text-on-surface">
                  {t('support.success_title')}
                </h2>
                <p className="text-on-surface-variant text-sm sm:text-base max-w-sm leading-relaxed">
                  {t('support.success_body')}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-primary-container text-white font-bold text-sm sm:text-base hover:opacity-90 transition-all active:scale-95 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base sm:text-lg">refresh</span>
                  {t('support.send_another')}
                </button>
              </motion.div>
            ) : (
              /* ── Formulario ── */
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-4 sm:gap-5 md:gap-6"
                noValidate
              >
                {/* Nombre */}
                <div>
                  <label htmlFor="name" className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-on-surface mb-1.5 sm:mb-2">
                    {t('support.name')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="name" name="name" type="text" required
                    value={name}
                    onChange={e => { 
                      setName(e.target.value); 
                      if (touched.name) setErrors(p => ({ ...p, name: validateField('name', e.target.value) })); 
                    }}
                    onBlur={e => handleBlur('name', e.target.value)}
                    placeholder={t('support.name_ph')}
                    className={inputClass('name')}
                  />
                  <AnimatePresence>
                    {touched.name && errors.name && (
                      <motion.p 
                        initial={{ opacity: 0, y: -4 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0 }}
                        className="text-red-500 dark:text-red-400 text-[10px] sm:text-xs font-bold mt-1 sm:mt-1.5 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs flex-shrink-0">error</span>
                        <span>{errors.name}</span>
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-on-surface mb-1.5 sm:mb-2">
                    {t('support.email')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="email" name="email" type="email" required
                    value={email}
                    onChange={e => { 
                      setEmail(e.target.value); 
                      if (touched.email) setErrors(p => ({ ...p, email: validateField('email', e.target.value) })); 
                    }}
                    onBlur={e => handleBlur('email', e.target.value)}
                    placeholder={t('support.email_ph')}
                    className={inputClass('email')}
                  />
                  <AnimatePresence>
                    {touched.email && errors.email && (
                      <motion.p 
                        initial={{ opacity: 0, y: -4 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0 }}
                        className="text-red-500 dark:text-red-400 text-[10px] sm:text-xs font-bold mt-1 sm:mt-1.5 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs flex-shrink-0">error</span>
                        <span>{errors.email}</span>
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <ValidationError 
                    prefix="Email" 
                    field="email" 
                    errors={state.errors}
                    className="text-red-500 text-[10px] sm:text-xs font-bold mt-1" 
                  />
                </div>

                {/* Asunto (select) */}
                <div>
                  <label htmlFor="subject" className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-on-surface mb-1.5 sm:mb-2">
                    {t('support.subject')} <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="subject" name="subject" required
                    value={subject}
                    onChange={e => { 
                      setSubject(e.target.value); 
                      if (touched.subject) setErrors(p => ({ ...p, subject: validateField('subject', e.target.value) })); 
                    }}
                    onBlur={e => handleBlur('subject', e.target.value)}
                    className={`${inputClass('subject')} cursor-pointer appearance-none bg-no-repeat`}
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23475569' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundPosition: 'right 12px center' }}
                  >
                    <option value="">{t('support.subject_placeholder')}</option>
                    {subjectOptions.map(opt => (
                      <option key={opt.value} value={opt.label}>{opt.label}</option>
                    ))}
                  </select>
                  <AnimatePresence>
                    {touched.subject && errors.subject && (
                      <motion.p 
                        initial={{ opacity: 0, y: -4 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0 }}
                        className="text-red-500 dark:text-red-400 text-[10px] sm:text-xs font-bold mt-1 sm:mt-1.5 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs flex-shrink-0">error</span>
                        <span>{errors.subject}</span>
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mensaje */}
                <div>
                  <label htmlFor="message" className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-on-surface mb-1.5 sm:mb-2">
                    {t('support.message')} <span className="text-red-400">*</span>
                    <span className="ml-1.5 sm:ml-2 text-[9px] sm:text-[10px] font-normal text-slate-400">
                      ({message.trim().length}/20 mín.)
                    </span>
                  </label>
                  <textarea
                    id="message" name="message" required rows="5"
                    value={message}
                    onChange={e => { 
                      setMessage(e.target.value); 
                      if (touched.message) setErrors(p => ({ ...p, message: validateField('message', e.target.value) })); 
                    }}
                    onBlur={e => handleBlur('message', e.target.value)}
                    placeholder={t('support.message_ph')}
                    className={`${inputClass('message')} resize-none`}
                  />
                  <AnimatePresence>
                    {touched.message && errors.message && (
                      <motion.p 
                        initial={{ opacity: 0, y: -4 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0 }}
                        className="text-red-500 dark:text-red-400 text-[10px] sm:text-xs font-bold mt-1 sm:mt-1.5 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs flex-shrink-0">error</span>
                        <span>{errors.message}</span>
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <ValidationError 
                    prefix="Message" 
                    field="message" 
                    errors={state.errors}
                    className="text-red-500 text-[10px] sm:text-xs font-bold mt-1" 
                  />
                </div>

                {/* Error general de Formspree */}
                {state.errors && state.errors.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -8 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-2.5 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-[10px] sm:text-xs font-bold text-red-600 dark:text-red-400"
                  >
                    <span className="material-symbols-outlined text-sm flex-shrink-0">error</span>
                    <span>{t('support.error_general')}</span>
                  </motion.div>
                )}

                {/* Botón enviar */}
                <button
                  type="submit"
                  disabled={state.submitting}
                  className={`w-full font-bold px-5 sm:px-6 py-3 sm:py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-1 sm:mt-2 text-sm sm:text-base
                    ${state.submitting
                      ? 'bg-slate-200 dark:bg-surface-variant text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-primary-container text-white hover:opacity-90 active:scale-95'
                    }`}
                >
                  {state.submitting ? (
                    <>
                      <Spinner />
                      {t('support.sending')}
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg sm:text-xl">send</span>
                      {t('support.send')}
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}