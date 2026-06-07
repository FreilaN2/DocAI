import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import PlanBadge from '../components/PlanBadge';
import Footer from '../components/Footer';

const countryList = [
  { code: 'AR', name: 'Argentina' }, { code: 'BO', name: 'Bolivia' }, { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' }, { code: 'CR', name: 'Costa Rica' }, { code: 'CU', name: 'Cuba' },
  { code: 'EC', name: 'Ecuador' }, { code: 'SV', name: 'El Salvador' }, { code: 'ES', name: 'España' },
  { code: 'US', name: 'Estados Unidos' }, { code: 'GT', name: 'Guatemala' }, { code: 'HN', name: 'Honduras' },
  { code: 'MX', name: 'México' }, { code: 'NI', name: 'Nicaragua' }, { code: 'PA', name: 'Panamá' },
  { code: 'PY', name: 'Paraguay' }, { code: 'PE', name: 'Perú' }, { code: 'PR', name: 'Puerto Rico' },
  { code: 'DO', name: 'República Dominicana' }, { code: 'UY', name: 'Uruguay' }, { code: 'VE', name: 'Venezuela' },
  { code: 'OT', name: 'Otro' }
];

export default function Profile() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    } catch (e) { setUser(null); }
  }, []);

  const handleCopyEmail = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(user.email);
      toast.success(t('profile.email_copied') || 'Email copiado al portapapeles', {
        icon: '📋',
        duration: 2000,
      });
    }
  };

  // ─── Estado: Sin usuario ───
  if (!user) {
    return (
      <div className="bg-background min-h-screen text-on-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 px-4 sm:px-6">
          <div className="w-full max-w-md bg-white/80 dark:bg-[#1a1512]/80 backdrop-blur-lg rounded-2xl border border-slate-200 dark:border-outline-variant/30 p-6 sm:p-8 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-surface-variant rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl sm:text-4xl text-slate-400">person_off</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-on-surface">
              {t('profile.title')}
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-2">
              {t('profile.no_user_info')}
            </p>
            <Link 
              to="/login" 
              className="inline-block mt-4 sm:mt-6 px-5 sm:px-6 py-2.5 sm:py-3 bg-primary-container text-white font-bold text-sm sm:text-base rounded-xl hover:opacity-90 transition-opacity no-underline"
            >
              {t('profile.go_login') || 'Iniciar sesión'}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const countryName = user.country ? countryList.find(c => c.code === user.country)?.name : '—';
  const planGradient = user.plan === 'pro'
    ? 'linear-gradient(135deg, #ff6b00, #ff8c33)'
    : 'linear-gradient(135deg, #3b82f6, #2563eb)';

  return (
    <div className="bg-background min-h-screen text-on-background relative overflow-x-hidden flex flex-col">
      <Navbar />

      <main className="flex-1 pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 md:px-8 lg:px-gutter max-w-6xl mx-auto w-full flex flex-col gap-6 sm:gap-8">
        
        {/* ── Perfil principal ── */}
        <section className="w-full">
          <div className="bg-white/80 dark:bg-[#1a1512]/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-outline-variant/30 p-4 sm:p-6 md:p-8 shadow-xl">
            <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div
                  className="w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-full flex items-center justify-center text-3xl sm:text-4xl md:text-5xl font-black text-white shadow-lg"
                  style={{ background: planGradient }}
                >
                  {user.firstName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-on-surface">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1 break-all">
                  {user.email}
                </p>
                <div className="mt-3 sm:mt-4 flex items-center justify-center md:justify-start gap-2 sm:gap-3 flex-wrap">
                  <PlanBadge plan={user.plan === 'pro' ? 'pro' : 'free'} />
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-on-surface-variant">
                    {t('profile.member_since')} {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>

              {/* Botones */}
              <div className="flex flex-row md:flex-col gap-2 sm:gap-3 w-full md:w-auto mt-2 md:mt-0">
                <button
                  onClick={handleCopyEmail}
                  className="flex-1 md:flex-none px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-surface-variant dark:bg-surface-container-high text-xs sm:text-sm font-bold border border-outline hover:bg-slate-200 dark:hover:bg-surface-container-low transition-colors flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-base sm:text-lg">content_copy</span>
                  <span className="hidden sm:inline">{t('profile.copy_email')}</span>
                </button>
                <button
                  onClick={() => toast(t('profile.coming_soon') || 'Próximamente', { icon: '🔧' })}
                  className="flex-1 md:flex-none px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-primary-container text-white font-bold text-xs sm:text-sm hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-base sm:text-lg">edit</span>
                  <span className="hidden sm:inline">{t('profile.edit_profile')}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Información detallada ── */}
        <section className="w-full">
          <div className="bg-white/70 dark:bg-[#1a1512]/70 backdrop-blur-lg rounded-2xl border border-slate-200 dark:border-outline-variant/30 p-4 sm:p-6 shadow-sm">
            <h2 className="text-base sm:text-lg font-black mb-3 sm:mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-lg sm:text-xl">info</span>
              {t('profile.information')}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* Nombre */}
              <div className="p-3 sm:p-4 bg-surface-container/50 dark:bg-surface-container/30 rounded-xl hover:bg-surface-container-high dark:hover:bg-surface-container/50 transition-colors">
                <p className="text-[10px] sm:text-xs text-on-surface-variant uppercase font-black mb-1.5 sm:mb-2 tracking-wider">
                  {t('profile.name')}
                </p>
                <p className="font-bold text-on-surface text-sm sm:text-base">
                  {user.firstName} {user.lastName}
                </p>
              </div>

              {/* Email */}
              <div className="p-3 sm:p-4 bg-surface-container/50 dark:bg-surface-container/30 rounded-xl hover:bg-surface-container-high dark:hover:bg-surface-container/50 transition-colors">
                <p className="text-[10px] sm:text-xs text-on-surface-variant uppercase font-black mb-1.5 sm:mb-2 tracking-wider">
                  {t('profile.email')}
                </p>
                <p className="font-bold text-on-surface text-sm sm:text-base truncate" title={user.email}>
                  {user.email}
                </p>
              </div>

              {/* País */}
              <div className="p-3 sm:p-4 bg-surface-container/50 dark:bg-surface-container/30 rounded-xl hover:bg-surface-container-high dark:hover:bg-surface-container/50 transition-colors">
                <p className="text-[10px] sm:text-xs text-on-surface-variant uppercase font-black mb-1.5 sm:mb-2 tracking-wider">
                  {t('profile.country')}
                </p>
                <p className="font-bold text-on-surface text-sm sm:text-base">
                  {countryName}
                </p>
              </div>

              {/* Teléfono */}
              <div className="p-3 sm:p-4 bg-surface-container/50 dark:bg-surface-container/30 rounded-xl hover:bg-surface-container-high dark:hover:bg-surface-container/50 transition-colors">
                <p className="text-[10px] sm:text-xs text-on-surface-variant uppercase font-black mb-1.5 sm:mb-2 tracking-wider">
                  {t('profile.phone')}
                </p>
                <p className="font-bold text-on-surface text-sm sm:text-base">
                  {user.phone || '—'}
                </p>
              </div>

              {/* Plan */}
              <div className="p-3 sm:p-4 bg-surface-container/50 dark:bg-surface-container/30 rounded-xl hover:bg-surface-container-high dark:hover:bg-surface-container/50 transition-colors">
                <p className="text-[10px] sm:text-xs text-on-surface-variant uppercase font-black mb-1.5 sm:mb-2 tracking-wider">
                  {t('profile.plan')}
                </p>
                <p className="font-bold text-on-surface text-sm sm:text-base capitalize flex items-center gap-1.5">
                  {user.plan === 'pro' ? (
                    <>
                      <span className="text-primary-container">⚡</span>
                      <span>Pro</span>
                    </>
                  ) : (
                    'Free'
                  )}
                </p>
              </div>

              {/* Última actividad */}
              <div className="p-3 sm:p-4 bg-surface-container/50 dark:bg-surface-container/30 rounded-xl hover:bg-surface-container-high dark:hover:bg-surface-container/50 transition-colors">
                <p className="text-[10px] sm:text-xs text-on-surface-variant uppercase font-black mb-1.5 sm:mb-2 tracking-wider">
                  {t('profile.last_activity')}
                </p>
                <p className="font-bold text-on-surface text-sm sm:text-base">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Acciones adicionales ── */}
        <section className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Link
              to={user.plan === 'pro' ? '/editor/pro' : '/editor/free'}
              className="flex items-center justify-center gap-2 p-4 sm:p-5 rounded-2xl bg-primary-container/10 dark:bg-primary-container/20 border border-primary-container/20 dark:border-primary-container/30 hover:bg-primary-container/20 dark:hover:bg-primary-container/30 transition-all no-underline group"
            >
              <span className="material-symbols-outlined text-primary-container text-2xl sm:text-3xl group-hover:scale-110 transition-transform">
                edit_note
              </span>
              <div className="text-left">
                <p className="font-black text-on-surface text-sm sm:text-base">
                  {t('profile.go_editor') || 'Ir al Editor'}
                </p>
                <p className="text-[10px] sm:text-xs text-on-surface-variant">
                  {t('profile.go_editor_desc') || 'Formatea tus documentos'}
                </p>
              </div>
            </Link>

            <Link
              to="/upgrade"
              className="flex items-center justify-center gap-2 p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all no-underline group"
            >
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-500 text-2xl sm:text-3xl group-hover:scale-110 transition-transform">
                workspace_premium
              </span>
              <div className="text-left">
                <p className="font-black text-on-surface text-sm sm:text-base">
                  {t('profile.upgrade_plan') || 'Mejorar Plan'}
                </p>
                <p className="text-[10px] sm:text-xs text-on-surface-variant">
                  {t('profile.upgrade_plan_desc') || 'Accede a funciones Pro'}
                </p>
              </div>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}