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

  if (!user) {
    return (
      <div className="bg-background min-h-screen text-on-background">
        <Navbar />
        <main className="pt-32 pb-24 px-gutter max-w-4xl mx-auto">
          <div className="bg-white/80 dark:bg-[#1a1512]/80 backdrop-blur-lg rounded-2xl border border-slate-200 dark:border-outline-variant/30 p-8 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-surface-variant rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-4xl text-slate-400">person_off</span>
            </div>
            <h2 className="text-xl font-black text-on-surface">{t('profile.title')}</h2>
            <p className="text-sm text-on-surface-variant mt-2">{t('profile.no_user_info')}</p>
            <Link to="/login" className="inline-block mt-4 px-6 py-2.5 bg-primary-container text-white font-bold rounded-xl hover:opacity-90 transition-opacity no-underline">
              {t('profile.go_login') || 'Iniciar sesión'}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const countryName = user.country ? countryList.find(c => c.code === user.country)?.name : '—';
  const planGradient = user.plan === 'pro'
    ? 'linear-gradient(135deg, #ff6b00, #ff8c33)'
    : 'linear-gradient(135deg, #3b82f6, #2563eb)';

  return (
    <div className="bg-background min-h-screen text-on-background relative overflow-x-hidden">
      <Navbar />

      <main className="pt-32 pb-24 px-gutter max-w-6xl mx-auto flex flex-col gap-8">
        {/* Perfil principal */}
        <section className="w-full">
          <div className="bg-white/80 dark:bg-[#1a1512]/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-outline-variant/30 p-8 shadow-xl flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div
                className="w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center text-4xl md:text-5xl font-black text-white shadow-lg"
                style={{ background: planGradient }}
              >
                {user.firstName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-black text-on-surface">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-sm text-on-surface-variant mt-1">{user.email}</p>
              <div className="mt-4 flex items-center justify-center md:justify-start gap-3 flex-wrap">
                <PlanBadge plan={user.plan === 'pro' ? 'pro' : 'free'} />
                <span className="text-xs text-slate-500 dark:text-on-surface-variant">
                  {t('profile.member_since')} {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                </span>
              </div>
            </div>

            {/* Botones */}
            <div className="flex md:flex-col gap-3 w-full md:w-auto">
              <button
                onClick={handleCopyEmail}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-surface-variant dark:bg-surface-container-high text-sm font-bold border border-outline hover:bg-slate-200 dark:hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">content_copy</span>
                {t('profile.copy_email')}
              </button>
              <button
                onClick={() => toast(t('profile.coming_soon') || 'Próximamente', { icon: '🔧' })}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-primary-container text-white font-bold hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                {t('profile.edit_profile')}
              </button>
            </div>
          </div>
        </section>

        {/* Información detallada */}
        <section className="w-full">
          <div className="bg-white/70 dark:bg-[#1a1512]/70 backdrop-blur-lg rounded-2xl border border-slate-200 dark:border-outline-variant/30 p-6 shadow-sm">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container">info</span>
              {t('profile.information')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors">
                <p className="text-xs text-on-surface-variant uppercase font-black mb-2">{t('profile.name')}</p>
                <p className="font-bold text-on-surface">{user.firstName} {user.lastName}</p>
              </div>

              <div className="p-4 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors">
                <p className="text-xs text-on-surface-variant uppercase font-black mb-2">{t('profile.email')}</p>
                <p className="font-bold text-on-surface truncate">{user.email}</p>
              </div>

              <div className="p-4 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors">
                <p className="text-xs text-on-surface-variant uppercase font-black mb-2">{t('profile.country')}</p>
                <p className="font-bold text-on-surface">{countryName}</p>
              </div>

              <div className="p-4 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors">
                <p className="text-xs text-on-surface-variant uppercase font-black mb-2">{t('profile.phone')}</p>
                <p className="font-bold text-on-surface">{user.phone || '—'}</p>
              </div>

              <div className="p-4 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors">
                <p className="text-xs text-on-surface-variant uppercase font-black mb-2">{t('profile.plan')}</p>
                <p className="font-bold text-on-surface capitalize flex items-center gap-1">
                  {user.plan === 'pro' ? (
                    <span className="text-primary-container">⚡ Pro</span>
                  ) : 'Free'}
                </p>
              </div>

              <div className="p-4 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors">
                <p className="text-xs text-on-surface-variant uppercase font-black mb-2">{t('profile.last_activity')}</p>
                <p className="font-bold text-on-surface">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}