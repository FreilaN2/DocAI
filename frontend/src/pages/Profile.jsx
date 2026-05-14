import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import PlanBadge from '../components/PlanBadge';

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    } catch (e) { setUser(null); }
  }, []);

  if (!user) {
    return (
      <div className="bg-background min-h-screen text-on-background">
        <Navbar />
        <main className="pt-32 pb-24 px-gutter max-w-4xl mx-auto">
          <div className="bg-white/80 dark:bg-[#1a1512]/80 backdrop-blur-lg rounded-2xl border border-slate-200 dark:border-outline-variant/30 p-8 text-center">
            <h2 className="text-xl font-black">Perfil</h2>
            <p className="text-sm text-on-surface-variant mt-2">No hay información de usuario disponible.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen text-on-background relative overflow-x-hidden">
      <Navbar />

      <main className="pt-32 pb-24 px-gutter max-w-6xl mx-auto flex flex-col gap-8">
        {/* Top wide card with avatar, name and plan */}
        <section className="w-full">
          <div className="bg-white/80 dark:bg-[#1a1512]/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-outline-variant/30 p-8 shadow-xl flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center text-4xl md:text-5xl font-black text-white"
                style={{ background: user.plan === 'pro' ? 'linear-gradient(135deg,#ff8a00,#ffca28)' : '#2563EB' }}>
                {user.firstName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-black text-on-surface">{user.firstName} {user.lastName}</h1>
              <p className="text-sm text-on-surface-variant mt-1">{user.email}</p>
              <div className="mt-4 flex items-center gap-3">
                <PlanBadge plan={user.plan === 'pro' ? 'pro' : 'free'} />
                <span className="text-xs text-slate-500 dark:text-on-surface-variant">Miembro desde {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</span>
              </div>
            </div>

            <div className="self-stretch flex items-center md:justify-end md:flex-col gap-3">
              <button
                onClick={() => navigator.clipboard?.writeText(user.email)}
                className="px-4 py-2 rounded-xl bg-surface-variant dark:bg-surface-container-high text-sm font-bold border border-outline hover:opacity-90 transition-colors"
              >Copiar email</button>
              <button
                onClick={() => alert('Editar perfil (pendiente)')}
                className="px-4 py-2 rounded-xl bg-primary-container text-white font-bold hover:opacity-95 transition-all"
              >Editar perfil</button>
            </div>
          </div>
        </section>

        {/* Information card below */}
        <section className="w-full">
          <div className="-mt-6 bg-white/70 dark:bg-[#1a1512]/70 backdrop-blur-lg rounded-2xl border border-slate-200 dark:border-outline-variant/30 p-6 shadow-sm">
            <h2 className="text-lg font-black mb-4">Información</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-surface-container rounded-xl">
                <p className="text-xs text-on-surface-variant uppercase font-black mb-2">Nombre</p>
                <p className="font-bold text-on-surface">{user.firstName} {user.lastName}</p>
              </div>

              <div className="p-4 bg-surface-container rounded-xl">
                <p className="text-xs text-on-surface-variant uppercase font-black mb-2">Email</p>
                <p className="font-bold text-on-surface truncate">{user.email}</p>
              </div>

              <div className="p-4 bg-surface-container rounded-xl">
                <p className="text-xs text-on-surface-variant uppercase font-black mb-2">País</p>
                <p className="font-bold text-on-surface">{user.country || '—'}</p>
              </div>

              <div className="p-4 bg-surface-container rounded-xl">
                <p className="text-xs text-on-surface-variant uppercase font-black mb-2">Teléfono</p>
                <p className="font-bold text-on-surface">{user.phone || '—'}</p>
              </div>

              <div className="p-4 bg-surface-container rounded-xl">
                <p className="text-xs text-on-surface-variant uppercase font-black mb-2">Plan</p>
                <p className="font-bold text-on-surface">{user.plan || 'free'}</p>
              </div>

              <div className="p-4 bg-surface-container rounded-xl">
                <p className="text-xs text-on-surface-variant uppercase font-black mb-2">Última actividad</p>
                <p className="font-bold text-on-surface">{user.last_login ? new Date(user.last_login).toLocaleString() : '—'}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
