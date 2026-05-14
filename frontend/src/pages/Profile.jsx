import React from 'react';
import Navbar from '../components/Navbar';

const countryNames = {
  AR: 'Argentina', BO: 'Bolivia', CL: 'Chile', CO: 'Colombia', CR: 'Costa Rica', CU: 'Cuba',
  EC: 'Ecuador', SV: 'El Salvador', ES: 'España', US: 'Estados Unidos', GT: 'Guatemala',
  HN: 'Honduras', MX: 'México', NI: 'Nicaragua', PA: 'Panamá', PY: 'Paraguay', PE: 'Perú',
  PR: 'Puerto Rico', DO: 'República Dominicana', UY: 'Uruguay', VE: 'Venezuela', OT: 'Otro'
};

export default function Profile() {
  const raw = localStorage.getItem('user');
  let user = null;
  try { user = raw ? JSON.parse(raw) : null; } catch (e) { user = null; }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 px-6">
          <div className="max-w-3xl mx-auto bg-white/60 dark:bg-surface/60 p-8 rounded-2xl border border-white/20">
            <h2 className="text-2xl font-black mb-4">Mi perfil</h2>
            <p className="text-sm text-on-surface-variant">No hay usuario autenticado. Inicia sesión para ver tu perfil.</p>
          </div>
        </main>
      </div>
    );
  }

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  const country = countryNames[user.country] || user.country || '—';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white/60 dark:bg-surface/60 p-6 rounded-2xl border border-white/20 flex flex-col items-center">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black text-white ${user.plan === 'pro' ? 'bg-gradient-to-br from-orange-500 to-amber-600' : 'bg-primary-container'}`}>
                {user.firstName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
              </div>
              <h3 className="mt-4 text-lg font-extrabold text-slate-800 dark:text-on-surface truncate text-center">{fullName || user.email}</h3>
              <p className="text-xs text-on-surface-variant mt-1">{user.plan === 'pro' ? 'PRO' : 'Free'}</p>
            </div>

            <div className="md:col-span-2 bg-white/60 dark:bg-surface/60 p-6 rounded-2xl border border-white/20">
              <h2 className="text-xl font-black mb-4">Información</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Nombre</label>
                  <div className="p-3 bg-slate-50 rounded-md">{user.firstName || '—'}</div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Apellido</label>
                  <div className="p-3 bg-slate-50 rounded-md">{user.lastName || '—'}</div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Email</label>
                  <div className="p-3 bg-slate-50 rounded-md break-words">{user.email}</div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Teléfono</label>
                  <div className="p-3 bg-slate-50 rounded-md">{user.phone || '—'}</div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">País</label>
                  <div className="p-3 bg-slate-50 rounded-md">{country}</div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Plan</label>
                  <div className="p-3 bg-slate-50 rounded-md">{user.plan || 'free'}</div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button className="px-4 py-3 rounded-xl font-bold bg-primary-container text-white">Editar perfil</button>
                <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.reload(); }} className="px-4 py-3 rounded-xl font-bold bg-red-500 text-white">Cerrar sesión</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
