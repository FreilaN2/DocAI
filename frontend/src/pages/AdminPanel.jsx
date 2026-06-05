import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { adminApi } from '../api';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionConfirm, setActionConfirm] = useState(null);

  const [historialPagos, setHistorialPagos] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingSearch, setPendingSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');

  // Admin Login State
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Create Admin State
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminConfirmPassword, setNewAdminConfirmPassword] = useState('');
  const [showNewAdminPassword, setShowNewAdminPassword] = useState(false);
  const [showNewAdminConfirmPassword, setShowNewAdminConfirmPassword] = useState(false);
  const [createAdminLoading, setCreateAdminLoading] = useState(false);

  // Theme State for Dashboard
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  // Profile State
  const [showProfile, setShowProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const userStr = localStorage.getItem('admin_user');
  const loggedUser = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    setPasswordLoading(true);
    try {
      const resp = await adminApi.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      toast.success(resp.data.message);
      setCurrentPassword('');
      setNewPassword('');
      setShowProfile(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al cambiar contraseña');
    } finally {
      setPasswordLoading(false);
    }
  };

  useEffect(() => {
    // Check if currently logged in user is admin
    const checkAdmin = () => {
      const token = localStorage.getItem('admin_token');
      const userStr = localStorage.getItem('admin_user');
      if (token && userStr) {
        try {
          const userObj = JSON.parse(userStr);
          if (userObj.isAdmin) {
            setIsAdmin(true);
            fetchPagos();
            return;
          }
        } catch (e) { }
      }
      setLoading(false);
    };
    checkAdmin();
  }, []);

  // Polling para pagos nuevos (cada 10 segundos)
  useEffect(() => {
    let interval;
    if (isAdmin) {
      interval = setInterval(() => {
        adminApi.get('/admin/pagos')
          .then(resp => setPagos(resp.data))
          .catch(err => {
            if (err.response?.status === 403) {
              setIsAdmin(false);
              localStorage.removeItem('admin_token');
              localStorage.removeItem('admin_user');
            }
          });
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [isAdmin]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const resp = await adminApi.post('/login', { email, password });
      if (!resp.data.user.isAdmin) {
        toast.error('Acceso denegado. Esta cuenta no tiene permisos de administrador.');
        // Don't save token to avoid overwriting normal user session if they were just trying
      } else {
        localStorage.setItem('admin_token', resp.data.access_token);
        localStorage.setItem('admin_user', JSON.stringify(resp.data.user));
        setIsAdmin(true);
        setLoading(true);
        fetchPagos();
        window.dispatchEvent(new Event('storage'));
        toast.success('Bienvenido al Panel de Administración');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Credenciales incorrectas');
    } finally {
      setLoginLoading(false);
    }
  };

  const fetchHistorial = async (filter = historyFilter) => {
    setHistoryLoading(true);
    try {
      const resp = await adminApi.get(`/admin/pagos?status=${filter}`);
      setHistorialPagos(resp.data);
    } catch (err) {
      console.error('Error cargando historial', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchHistorial(historyFilter);
    }
  }, [historyFilter, isAdmin]);

  const fetchPagos = async () => {
    try {
      const resp = await adminApi.get('/admin/pagos');
      setPagos(resp.data);
      fetchHistorial();
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Sesión expirada o acceso denegado.');
        setIsAdmin(false);
      } else {
        toast.error('Error cargando pagos pendientes');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    setActionLoading(id);
    try {
      const endpoint = action === 'approve' ? '/admin/aprobar-pago' : '/admin/rechazar-pago';
      const resp = await adminApi.post(endpoint, { transaction_id: id });
      toast.success(resp.data.message);
      setPagos(pagos.filter(p => p.id !== id));
      fetchHistorial();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al procesar el pago');
    } finally {
      setActionLoading(null);
      setActionConfirm(null);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (newAdminPassword !== newAdminConfirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (newAdminPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setCreateAdminLoading(true);
    try {
      const resp = await adminApi.post('/admin/create-admin', {
        email: newAdminEmail,
        password: newAdminPassword
      });
      toast.success(resp.data.message);
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al crear administrador');
    } finally {
      setCreateAdminLoading(false);
    }
  };

  const filteredPagos = pagos.filter(p => 
    p.user_email.toLowerCase().includes(pendingSearch.toLowerCase()) || 
    p.reference_number.toLowerCase().includes(pendingSearch.toLowerCase())
  );

  const filteredHistory = historialPagos.filter(p => 
    p.user_email.toLowerCase().includes(historySearch.toLowerCase()) || 
    p.reference_number.toLowerCase().includes(historySearch.toLowerCase())
  );

  if (loading && isAdmin) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="dark bg-[#121212] min-h-screen flex items-center justify-center p-4 relative overflow-hidden text-white">
        {/* Background decorations for Admin Login */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md bg-[#1e1e1e] border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-8">
            <span className="material-symbols-outlined text-5xl text-primary mb-2">shield_person</span>
            <h1 className="text-2xl font-black text-white">DocAI Admin</h1>
            <p className="text-gray-400 text-sm text-center mt-2">Acceso exclusivo para administradores del sistema</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Correo de Administrador</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#2a2a2a] border border-white/10 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-gray-600"
                  placeholder="admin@docia.qzz.io"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Contraseña</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">lock</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#2a2a2a] border border-white/10 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-gray-600"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 bg-primary hover:bg-primary-container text-white rounded-xl font-bold transition-all active:scale-[0.98] flex justify-center items-center gap-2 mt-4"
            >
              {loginLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">login</span>
                  Iniciar Sesión Segura
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => navigate('/')} className="text-sm font-bold text-gray-400 hover:text-white transition-colors">
              &larr; Volver a DocAI
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard de Administrador
  return (
    <div className="bg-background min-h-screen text-on-background relative overflow-x-hidden flex flex-col">
      {/* Top Navbar for Admin */}
      <nav className="h-16 border-b border-outline/10 bg-surface/80 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl">admin_panel_settings</span>
          <span className="font-black text-xl tracking-tight text-on-surface">DocIA Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center justify-center p-2 rounded-full bg-slate-100 dark:bg-surface-variant hover:bg-slate-200 dark:hover:bg-surface-container-high text-slate-600 dark:text-on-surface-variant transition-all active:scale-90"
            title="Mi Perfil"
          >
            <span className="material-symbols-outlined text-[20px]">person</span>
          </button>
          
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 rounded-full bg-slate-100 dark:bg-surface-variant hover:bg-slate-200 dark:hover:bg-surface-container-high text-slate-600 dark:text-on-surface-variant transition-all active:scale-90"
            title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="text-sm font-bold text-slate-500 hover:text-red-500 flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Cerrar Sesión
          </button>
        </div>
      </nav>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowProfile(false)}>
          <div 
            className="bg-white dark:bg-surface w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person</span>
                Mi Perfil
              </h3>
              <button onClick={() => setShowProfile(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <p className="text-sm text-on-surface-variant mb-1 font-bold">Correo Electrónico</p>
                <div className="px-4 py-3 bg-surface-variant/30 rounded-xl border border-outline/20 text-on-surface flex items-center justify-between">
                  {loggedUser?.email || 'No disponible'}
                  <span className="material-symbols-outlined text-green-500 text-sm" title="Cuenta verificada">verified</span>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 pt-4 border-t border-outline/10">
                <h4 className="font-bold text-on-surface">Cambiar Contraseña</h4>
                
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Contraseña Actual</label>
                  <div className="relative">
                    <input 
                      type={showCurrentPassword ? "text" : "password"} 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-4 pr-10 py-2 bg-slate-100 dark:bg-[#2a2a2a] border border-outline/30 dark:border-white/10 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                      placeholder="••••••••"
                      required
                    />
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-white">
                      <span className="material-symbols-outlined text-[20px]">{showCurrentPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Nueva Contraseña</label>
                  <div className="relative">
                    <input 
                      type={showNewPassword ? "text" : "password"} 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-4 pr-10 py-2 bg-slate-100 dark:bg-[#2a2a2a] border border-outline/30 dark:border-white/10 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-white">
                      <span className="material-symbols-outlined text-[20px]">{showNewPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full py-3 bg-primary hover:bg-primary-container text-white rounded-xl font-bold transition-all active:scale-[0.98] flex justify-center items-center gap-2 mt-2"
                >
                  {passwordLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">key</span>
                      Actualizar Contraseña
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)}>
          <div 
            className="bg-white dark:bg-surface w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-500 text-3xl">logout</span>
            </div>
            <h3 className="text-xl font-black text-on-surface mb-2">¿Cerrar Sesión?</h3>
            <p className="text-on-surface-variant mb-6 text-sm">
              Estás a punto de salir del Panel de Administración.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 bg-surface-variant text-on-surface-variant hover:bg-outline/20 rounded-xl font-bold transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  localStorage.removeItem('admin_token');
                  localStorage.removeItem('admin_user');
                  setIsAdmin(false);
                  setShowLogoutConfirm(false);
                  window.dispatchEvent(new Event('storage'));
                  navigate('/');
                }}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all shadow-md shadow-red-500/20"
              >
                Salir
              </button>
            </div>
          </div>
        </div>

      )}

      {/* Action Confirmation Modal */}
      {actionConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setActionConfirm(null)}>
          <div 
            className="bg-white dark:bg-surface w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col p-6 text-center border-2 border-slate-200 dark:border-outline-variant/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${actionConfirm.action === 'approve' ? 'bg-green-100 dark:bg-green-900/30 text-green-500' : 'bg-red-100 dark:bg-red-900/30 text-red-500'}`}>
              <span className="material-symbols-outlined text-3xl">{actionConfirm.action === 'approve' ? 'check_circle' : 'cancel'}</span>
            </div>
            <h3 className="text-xl font-black text-on-surface mb-2">
              {actionConfirm.action === 'approve' ? '¿Aprobar Pago?' : '¿Rechazar Pago?'}
            </h3>
            <p className="text-on-surface-variant mb-6 text-sm">
              {actionConfirm.action === 'approve' 
                ? `Estás a punto de aprobar el pago del usuario ${actionConfirm.user_email}. Sus beneficios se activarán inmediatamente.` 
                : `Estás a punto de rechazar el pago del usuario ${actionConfirm.user_email}. No se activarán beneficios.`}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setActionConfirm(null)}
                disabled={actionLoading === actionConfirm.id}
                className="flex-1 py-3 bg-surface-variant text-on-surface-variant hover:bg-outline/20 rounded-xl font-bold transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleAction(actionConfirm.id, actionConfirm.action)}
                disabled={actionLoading === actionConfirm.id}
                className={`flex-1 py-3 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-md ${
                  actionConfirm.action === 'approve' 
                    ? 'bg-green-500 hover:bg-green-600 shadow-green-500/20' 
                    : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                }`}
              >
                {actionLoading === actionConfirm.id ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  actionConfirm.action === 'approve' ? 'Sí, Aprobar' : 'Sí, Rechazar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow pt-8 pb-24 px-6 max-w-6xl mx-auto w-full">
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-outline/20">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 font-bold text-lg px-2 border-b-2 transition-colors ${activeTab === 'pending' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 font-bold text-lg px-2 border-b-2 transition-colors ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
          >
            Historial
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`pb-3 font-bold text-lg px-2 border-b-2 transition-colors ${activeTab === 'admins' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
          >
            Administradores
          </button>
        </div>

        {activeTab === 'admins' ? (
          <div className="bg-white dark:bg-surface rounded-card border-2 border-slate-200 dark:border-outline-variant/30 p-6 shadow-sm max-w-2xl mx-auto">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">person_add</span>
              Crear Nuevo Administrador
            </h2>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Correo Electrónico</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-[#2a2a2a] border border-outline/30 dark:border-white/10 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-slate-800 dark:text-white"
                    placeholder="nuevo_admin@docia.qzz.io"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Contraseña</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                  <input
                    type={showNewAdminPassword ? "text" : "password"}
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full pl-12 pr-10 py-3 bg-slate-100 dark:bg-[#2a2a2a] border border-outline/30 dark:border-white/10 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-slate-800 dark:text-white"
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowNewAdminPassword(!showNewAdminPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-white">
                    <span className="material-symbols-outlined text-[20px]">{showNewAdminPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Confirmar Contraseña</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                  <input
                    type={showNewAdminConfirmPassword ? "text" : "password"}
                    value={newAdminConfirmPassword}
                    onChange={(e) => setNewAdminConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-10 py-3 bg-slate-100 dark:bg-[#2a2a2a] border border-outline/30 dark:border-white/10 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-slate-800 dark:text-white"
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowNewAdminConfirmPassword(!showNewAdminConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-white">
                    <span className="material-symbols-outlined text-[20px]">{showNewAdminConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={createAdminLoading}
                className="w-full py-3.5 bg-primary hover:bg-primary-container text-white rounded-xl font-bold transition-all active:scale-[0.98] flex justify-center items-center gap-2 mt-4"
              >
                {createAdminLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">person_add</span>
                    Crear Cuenta de Administrador
                  </>
                )}
              </button>
            </form>
          </div>
        ) : activeTab === 'pending' ? (
          <div className="bg-white dark:bg-surface rounded-card border-2 border-slate-200 dark:border-outline-variant/30 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-500">pending_actions</span>
                Reportes Pendientes
              </h2>
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input 
                  type="text" 
                  placeholder="Buscar ref o correo..." 
                  value={pendingSearch}
                  onChange={(e) => setPendingSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-[#2a2a2a] border border-outline/30 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 transition-all"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : pagos.length === 0 ? (
              <div className="text-center py-10 text-on-surface-variant bg-surface-variant/20 rounded-xl border border-dashed border-outline/30">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">check_circle</span>
                <p className="font-bold">No hay pagos pendientes por revisar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline/20 text-sm text-on-surface-variant">
                      <th className="pb-3 px-4 font-bold">Fecha</th>
                      <th className="pb-3 px-4 font-bold">Usuario</th>
                      <th className="pb-3 px-4 font-bold">Referencia / Tlf</th>
                      <th className="pb-3 px-4 font-bold">Monto (VES)</th>
                      <th className="pb-3 px-4 font-bold">Item</th>
                      <th className="pb-3 px-4 font-bold text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {filteredPagos.map(p => (
                      <tr key={p.id} className="border-b border-outline/10 hover:bg-surface-variant/20 transition-colors">
                        <td className="py-4 px-4 text-xs font-medium">
                          {new Date(p.created_at).toLocaleDateString()} <br />
                          <span className="text-on-surface-variant">{new Date(p.created_at).toLocaleTimeString()}</span>
                        </td>
                        <td className="py-4 px-4 font-medium">{p.user_email}</td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-primary">#{p.reference_number}</div>
                          <div className="text-xs text-on-surface-variant">{p.phone_number}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-bold">Bs. {p.amount_ves}</div>
                          <div className="text-xs text-on-surface-variant">${p.amount_usd}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded">
                            {p.type === 'subscription' ? `Sub ${p.item_id} Mes(es)` : `Pack #${p.item_id}`}
                          </span>
                        </td>
                        <td className="py-4 px-4 flex justify-center gap-2">
                          <button
                            onClick={() => setActionConfirm({ id: p.id, action: 'approve', user_email: p.user_email })}
                            disabled={actionLoading === p.id}
                            className="bg-green-100 text-green-700 hover:bg-green-200 p-2 rounded-lg transition-colors disabled:opacity-50"
                            title="Aprobar Pago"
                          >
                            <span className="material-symbols-outlined text-sm">check</span>
                          </button>
                          <button
                            onClick={() => setActionConfirm({ id: p.id, action: 'reject', user_email: p.user_email })}
                            disabled={actionLoading === p.id}
                            className="bg-red-100 text-red-700 hover:bg-red-200 p-2 rounded-lg transition-colors disabled:opacity-50"
                            title="Rechazar Pago"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (

        <div className="bg-white dark:bg-surface rounded-card border-2 border-slate-200 dark:border-outline-variant/30 p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-primary">history</span>
              Historial de Solicitudes
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input 
                  type="text" 
                  placeholder="Buscar ref o correo..." 
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-[#2a2a2a] border border-outline/30 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 transition-all"
                />
              </div>
              <div className="flex gap-2">
              <button 
                onClick={() => setHistoryFilter('all')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${historyFilter === 'all' ? 'bg-primary/10 text-primary dark:bg-primary/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-surface-variant dark:text-on-surface-variant'}`}
              >
                Todas
              </button>
              <button 
                onClick={() => setHistoryFilter('approved')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${historyFilter === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-surface-variant dark:text-on-surface-variant'}`}
              >
                Aprobados
              </button>
              <button 
                onClick={() => setHistoryFilter('rejected')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${historyFilter === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-surface-variant dark:text-on-surface-variant'}`}
              >
                Rechazados
              </button>
              </div>
            </div>
          </div>

          {historyLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : historialPagos.length === 0 ? (
            <div className="text-center py-10 text-on-surface-variant bg-surface-variant/20 rounded-xl border border-dashed border-outline/30">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">history</span>
              <p className="font-bold">No hay pagos en este historial</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline/20 text-sm text-on-surface-variant">
                    <th className="pb-3 px-4 font-bold">Fecha</th>
                    <th className="pb-3 px-4 font-bold">Usuario</th>
                    <th className="pb-3 px-4 font-bold">Referencia / Tlf</th>
                    <th className="pb-3 px-4 font-bold">Monto (VES)</th>
                    <th className="pb-3 px-4 font-bold">Item</th>
                    <th className="pb-3 px-4 font-bold">Estado</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredHistory.map(p => (
                    <tr key={p.id} className="border-b border-outline/10 hover:bg-surface-variant/20 transition-colors">
                      <td className="py-4 px-4 text-xs font-medium text-on-surface">
                        {new Date(p.created_at).toLocaleDateString()} <br />
                        <span className="text-on-surface-variant">{new Date(p.created_at).toLocaleTimeString()}</span>
                      </td>
                      <td className="py-4 px-4 font-medium text-on-surface">{p.user_email}</td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-primary">#{p.reference_number}</div>
                        <div className="text-xs text-on-surface-variant">{p.phone_number}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-on-surface">Bs. {p.amount_ves}</div>
                        <div className="text-xs text-on-surface-variant">${p.amount_usd}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded">
                          {p.type === 'subscription' ? `Sub ${p.item_id} Mes(es)` : `Pack #${p.item_id}`}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {p.status === 'approved' ? (
                          <span className="inline-block px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold rounded flex items-center gap-1 w-max">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span> Aprobado
                          </span>
                        ) : p.status === 'rejected' ? (
                          <span className="inline-block px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold rounded flex items-center gap-1 w-max">
                            <span className="material-symbols-outlined text-[14px]">cancel</span> Rechazado
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs font-bold rounded flex items-center gap-1 w-max">
                            <span className="material-symbols-outlined text-[14px]">pending</span> Pendiente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}
      </main>
    </div>
  );
}
