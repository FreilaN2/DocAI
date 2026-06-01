import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import PlanBadge from '../components/PlanBadge';

// Constante del módulo para la lista de países
const COUNTRY_LIST = [
  { code: 'AR', name: 'Argentina' }, { code: 'BO', name: 'Bolivia' }, { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' }, { code: 'CR', name: 'Costa Rica' }, { code: 'CU', name: 'Cuba' },
  { code: 'EC', name: 'Ecuador' }, { code: 'SV', name: 'El Salvador' }, { code: 'ES', name: 'España' },
  { code: 'US', name: 'Estados Unidos' }, { code: 'GT', name: 'Guatemala' }, { code: 'HN', name: 'Honduras' },
  { code: 'MX', name: 'México' }, { code: 'NI', name: 'Nicaragua' }, { code: 'PA', name: 'Panamá' },
  { code: 'PY', name: 'Paraguay' }, { code: 'PE', name: 'Perú' }, { code: 'PR', name: 'Puerto Rico' },
  { code: 'DO', name: 'República Dominicana' }, { code: 'UY', name: 'Uruguay' }, { code: 'VE', name: 'Venezuela' },
  { code: 'OT', name: 'Otro' }
];

// Componente memoizado para los campos de información
const InfoField = React.memo(({ label, value, className = '' }) => (
  <div className={`p-4 bg-surface-container rounded-xl transition-colors hover:bg-surface-container-high ${className}`}>
    <p className="text-xs text-on-surface-variant uppercase font-black mb-2">{label}</p>
    <p className="font-bold text-on-surface truncate" title={typeof value === 'string' ? value : undefined}>
      {value}
    </p>
  </div>
));

InfoField.displayName = 'InfoField';

// Componente para el estado vacío
const EmptyState = React.memo(({ title, message }) => (
  <div className="bg-background min-h-screen text-on-background">
    <Navbar />
    <main className="pt-32 pb-24 px-gutter max-w-4xl mx-auto">
      <div className="bg-white/80 dark:bg-[#1a1512]/80 backdrop-blur-lg rounded-2xl border border-slate-200 dark:border-outline-variant/30 p-8 text-center animate-fadeIn">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4">person_off</span>
        <h2 className="text-xl font-black">{title}</h2>
        <p className="text-sm text-on-surface-variant mt-2">{message}</p>
      </div>
    </main>
  </div>
));

EmptyState.displayName = 'EmptyState';

export default function Profile() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);

  // Cargar usuario del localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);
      }
    } catch (e) {
      setUser(null);
    }
  }, []);

  // Handlers optimizados
  const handleCopyEmail = useCallback(() => {
    if (user?.email) {
      navigator.clipboard?.writeText(user.email).then(() => {
        // Feedback visual opcional
        const btn = document.activeElement;
        if (btn) {
          const originalText = btn.textContent;
          btn.textContent = '✓ Copiado';
          setTimeout(() => {
            btn.textContent = originalText;
          }, 2000);
        }
      }).catch(() => {
        // Fallback para navegadores sin API clipboard
        alert('No se pudo copiar el email. Intenta manualmente.');
      });
    }
  }, [user?.email]);

  const handleEditProfile = useCallback(() => {
    alert('Editar perfil (pendiente)');
  }, []);

  // Valores memoizados
  const countryName = useMemo(() => {
    if (!user?.country) return '—';
    return COUNTRY_LIST.find(c => c.code === user.country)?.name || '—';
  }, [user?.country]);

  const memberSince = useMemo(() => {
    if (!user?.createdAt) return '—';
    return new Date(user.createdAt).toLocaleDateString();
  }, [user?.createdAt]);

  const lastActivity = useMemo(() => {
    if (!user?.lastLoginAt) return '—';
    return new Date(user.lastLoginAt).toLocaleString();
  }, [user?.lastLoginAt]);

  const avatarInitial = useMemo(() => {
    return user?.firstName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?';
  }, [user?.firstName, user?.email]);

  const planType = useMemo(() => {
    return user?.plan === 'pro' ? 'pro' : 'free';
  }, [user?.plan]);

  // Si no hay usuario, mostrar estado vacío
  if (!user) {
    return (
      <EmptyState 
        title={t('profile.title')} 
        message={t('profile.no_user_info')} 
      />
    );
  }

  return (
    <div className="bg-background min-h-screen text-on-background relative overflow-x-hidden">
      <Navbar />

      <main className="pt-32 pb-24 px-gutter max-w-6xl mx-auto flex flex-col gap-8">
        {/* Tarjeta principal con avatar y plan */}
        <section className="w-full animate-fadeIn">
          <div className="bg-white/80 dark:bg-[#1a1512]/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-outline-variant/30 p-8 shadow-xl flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div 
                className="w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center text-4xl md:text-5xl font-black text-white shadow-lg"
                style={{ 
                  background: user.plan === 'pro' 
                    ? 'linear-gradient(135deg, #ff8a00, #ffca28)' 
                    : 'linear-gradient(135deg, #2563EB, #3B82F6)' 
                }}
              >
                {avatarInitial}
              </div>
            </div>

            {/* Información del usuario */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-black text-on-surface">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-sm text-on-surface-variant mt-1">{user.email}</p>
              <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <PlanBadge plan={planType} />
                <span className="text-xs text-slate-500 dark:text-on-surface-variant">
                  {t('profile.member_since')} {memberSince}
                </span>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex md:flex-col gap-3 w-full md:w-auto justify-center">
              <button
                onClick={handleCopyEmail}
                className="px-4 py-2 rounded-xl bg-surface-variant dark:bg-surface-container-high text-sm font-bold border border-outline hover:bg-surface-container-high dark:hover:bg-surface-container-low transition-all active:scale-95 transform duration-150"
              >
                {t('profile.copy_email')}
              </button>
              <button
                onClick={handleEditProfile}
                className="px-4 py-2 rounded-xl bg-primary-container text-white font-bold hover:opacity-95 transition-all active:scale-95 transform duration-150 shadow-sm"
              >
                {t('profile.edit_profile')}
              </button>
            </div>
          </div>
        </section>

        {/* Tarjeta de información detallada */}
        <section className="w-full animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <div className="-mt-6 bg-white/70 dark:bg-[#1a1512]/70 backdrop-blur-lg rounded-2xl border border-slate-200 dark:border-outline-variant/30 p-6 shadow-sm">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container">badge</span>
              {t('profile.information')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoField 
                label={t('profile.name')} 
                value={`${user.firstName} ${user.lastName}`} 
              />
              
              <InfoField 
                label={t('profile.email')} 
                value={user.email} 
              />
              
              <InfoField 
                label={t('profile.country')} 
                value={countryName} 
              />
              
              <InfoField 
                label={t('profile.phone')} 
                value={user.phone || '—'} 
              />
              
              <InfoField 
                label={t('profile.plan')} 
                value={planType.charAt(0).toUpperCase() + planType.slice(1)} 
              />
              
              <InfoField 
                label={t('profile.last_activity')} 
                value={lastActivity} 
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}