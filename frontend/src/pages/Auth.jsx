import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

export default function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    const endpoint = isLogin ? 'login' : 'register';
    const payload = isLogin 
      ? { email: formData.email, password: formData.password }
      : { 
          firstName: formData.firstName, 
          lastName: formData.lastName, 
          email: formData.email, 
          phone: formData.phone, 
          password: formData.password 
        };

    try {
      const response = await axios.post(`http://127.0.0.1:8000/${endpoint}`, payload);
      
      if (response.data.status === 'success') {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        if (!isLogin) {
          toast.success("¡Cuenta creada con éxito! Bienvenido a DocAI.", {
            duration: 4000,
            style: {
              borderRadius: '12px',
              background: '#333',
              color: '#fff',
            },
          });
        }
        
        const userPlan = response.data.user.plan === 'pro' ? 'pro' : 'free';
        navigate(`/editor/${userPlan}`);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen text-on-background relative overflow-x-hidden">
      <Navbar />
      
      {/* Ambient Background Elements */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.4, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-surface-container-high rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-surface-variant rounded-full blur-[100px]"
        />
      </div>

      <main className="pt-32 pb-24 px-6 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white/80 dark:bg-[#1a1512]/80 backdrop-blur-xl rounded-card border border-slate-200 dark:border-outline-variant/30 p-8 shadow-2xl"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tight text-on-surface mb-2">
              {isLogin ? t('auth.login_title') : t('auth.register_title')}
            </h1>
            <p className="text-on-surface-variant text-sm">
              {isLogin ? t('auth.no_account') : t('auth.have_account')}{' '}
              <button 
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary-container font-bold hover:underline"
              >
                {isLogin ? t('auth.switch_register') : t('auth.switch_login')}
              </button>
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-xs font-bold border border-red-100 dark:border-red-800/30 mb-6 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div 
                  key="register-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('auth.first_name')}</label>
                      <input 
                        type="text" name="firstName" required
                        placeholder="John"
                        className="w-full p-3 bg-slate-50 dark:bg-surface-variant border border-slate-200 dark:border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-orange-100 dark:focus:ring-primary/20 outline-none text-sm transition-all dark:text-on-surface"
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('auth.last_name')}</label>
                      <input 
                        type="text" name="lastName" required
                        placeholder="Doe"
                        className="w-full p-3 bg-slate-50 dark:bg-surface-variant border border-slate-200 dark:border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-orange-100 dark:focus:ring-primary/20 outline-none text-sm transition-all dark:text-on-surface"
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('auth.phone')}</label>
                    <input 
                      type="tel" name="phone" required
                      placeholder="+1 234 567 890"
                      className="w-full p-3 bg-slate-50 dark:bg-surface-variant border border-slate-200 dark:border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-orange-100 dark:focus:ring-primary/20 outline-none text-sm transition-all dark:text-on-surface"
                      onChange={handleChange}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('auth.email')}</label>
              <input 
                type="email" name="email" required
                placeholder="email@example.com"
                className="w-full p-3 bg-slate-50 dark:bg-surface-variant border border-slate-200 dark:border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-orange-100 dark:focus:ring-primary/20 outline-none text-sm transition-all dark:text-on-surface"
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('auth.password')}</label>
              <input 
                type="password" name="password" required
                placeholder="••••••••"
                className="w-full p-3 bg-slate-50 dark:bg-surface-variant border border-slate-200 dark:border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-orange-100 dark:focus:ring-primary/20 outline-none text-sm transition-all dark:text-on-surface"
                onChange={handleChange}
              />
            </div>

            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('auth.confirm_password')}</label>
                <input 
                  type="password" name="confirmPassword" required
                  placeholder="••••••••"
                  className="w-full p-3 bg-slate-50 dark:bg-surface-variant border border-slate-200 dark:border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-orange-100 dark:focus:ring-primary/20 outline-none text-sm transition-all dark:text-on-surface"
                  onChange={handleChange}
                />
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              type="submit"
              className={`w-full py-4 rounded-2xl font-black shadow-lg transition-all mt-6 flex items-center justify-center gap-2 ${loading ? 'bg-slate-200 dark:bg-surface-variant text-slate-400 dark:text-on-surface-variant/50 cursor-not-allowed shadow-none' : 'bg-primary-container text-white shadow-orange-200 dark:shadow-orange-900/20'}`}
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                isLogin ? t('auth.login_btn') : t('auth.register_btn')
              )}
            </motion.button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
