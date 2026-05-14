import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

// Lista de países
const countryList = [
  { code: 'AR', name: 'Argentina' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'CU', name: 'Cuba' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'ES', name: 'España' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'HN', name: 'Honduras' },
  { code: 'MX', name: 'México' },
  { code: 'NI', name: 'Nicaragua' },
  { code: 'PA', name: 'Panamá' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'PE', name: 'Perú' },
  { code: 'PR', name: 'Puerto Rico' },
  { code: 'DO', name: 'República Dominicana' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'OT', name: 'Otro' }
];

// Clases CSS reutilizables basadas en variables del sistema (index.css)
const inputBaseClasses = "w-full p-4 h-[56px] bg-black/5 dark:bg-black/20 border-b-2 border-outline/30 rounded-t-xl focus:border-primary-container focus:bg-primary-container/10 outline-none text-sm transition-colors duration-200 text-on-surface placeholder:text-on-surface-variant/50";
const labelBaseClasses = "text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1 mb-1 block";

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
    country: '', 
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleCountrySelect = (code) => {
    setFormData({ ...formData, country: code });
    setIsCountryDropdownOpen(false);
    setError("");
  };

  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsCountryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!isLogin) {
      const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
      if (!nameRegex.test(formData.firstName) || !nameRegex.test(formData.lastName)) {
        setError("El nombre y apellido solo deben contener letras.");
        setLoading(false);
        return;
      }

      if (!formData.country || formData.country === "") {
        setError("Por favor, selecciona tu país de residencia.");
        setLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Las contraseñas no coinciden.");
        setLoading(false);
        return;
      }
    }

    const endpoint = isLogin ? 'login' : 'register';
    const payload = isLogin 
      ? { email: formData.email, password: formData.password }
      : { 
          firstName: formData.firstName.trim(), 
          lastName: formData.lastName.trim(), 
          email: formData.email, 
          phone: formData.phone,
          country: formData.country,
          password: formData.password 
        };

    try {
      const response = await api.post(`/${endpoint}`, payload);
      
      if (response.data.status === 'success') {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        if (!isLogin) {
          toast.success("¡Cuenta creada con éxito! Bienvenido a DocAI.", {
            duration: 4000,
            style: { borderRadius: '12px', background: '#333', color: '#fff' },
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

  const selectedCountryName = formData.country 
    ? countryList.find(c => c.code === formData.country)?.name 
    : "Seleccionar...";

  return (
    <div className="bg-background min-h-screen text-on-background relative overflow-x-hidden flex flex-col">
      <Navbar />
      
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-surface-container-high rounded-full blur-[150px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-surface-variant rounded-full blur-[130px]"
        />
      </div>

      <main className="flex-grow pt-32 pb-24 px-6 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          // Ancho máximo y fondo controlado para evitar invisibilidad de texto
          className="w-full max-w-md bg-surface/80 dark:bg-surface/90 backdrop-blur-2xl rounded-card border border-outline-variant/10 p-8 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_80px_-20px_rgba(255,107,0,0.1)]"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tighter text-on-surface mb-2 leading-tight">
              {isLogin ? t('auth.login_title') : t('auth.register_title')}
            </h1>
            <p className="text-on-surface-variant text-sm font-medium">
              {isLogin ? t('auth.no_account') : t('auth.have_account')}{' '}
              <button 
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(""); 
                }}
                className="text-primary-container font-bold hover:text-primary transition-colors hover:underline focus:outline-none"
              >
                {isLogin ? t('auth.switch_register') : t('auth.switch_login')}
              </button>
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-error/10 text-error p-4 rounded-xl text-xs font-bold border border-error/20 mb-6 flex items-center gap-3 shadow-inner"
            >
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* CAMPOS DE REGISTRO OCULTABLES */}
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div 
                  key="register-fields"
                  initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  animate={{ 
                    opacity: 1, 
                    height: 'auto', 
                    // Solución mágica para que el menú del país no se corte
                    transitionEnd: { overflow: 'visible' } 
                  }}
                  exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className={labelBaseClasses}>{t('auth.first_name')}</label>
                      <input 
                        type="text" name="firstName" required={!isLogin}
                        placeholder="John" className={inputBaseClasses}
                        onChange={handleChange} value={formData.firstName}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={labelBaseClasses}>{t('auth.last_name')}</label>
                      <input 
                        type="text" name="lastName" required={!isLogin}
                        placeholder="Doe" className={inputBaseClasses}
                        onChange={handleChange} value={formData.lastName}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className={labelBaseClasses}>{t('auth.phone')}</label>
                      <input 
                        type="tel" name="phone" required={!isLogin}
                        placeholder="+1 234 567 890" className={inputBaseClasses}
                        onChange={handleChange} value={formData.phone}
                      />
                    </div>

                    <div className="space-y-1" ref={dropdownRef}>
                      <label className={labelBaseClasses}>{t('auth.country')}</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                          className={`${inputBaseClasses} flex justify-between items-center ${isCountryDropdownOpen ? 'border-primary-container bg-orange-50 dark:bg-primary/10' : ''} ${!formData.country ? 'text-slate-400 dark:text-on-surface-variant/50' : 'text-on-surface'}`}
                        >
                          <span className="truncate pr-2">{selectedCountryName}</span>
                          <span className="material-symbols-outlined text-slate-400 dark:text-on-surface-variant text-xl transition-transform duration-300" style={{ transform: isCountryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                            keyboard_arrow_down
                          </span>
                        </button>

                        <AnimatePresence>
                          {isCountryDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute z-50 w-full mt-2 bg-white/90 dark:bg-surface-container-high/95 backdrop-blur-xl border border-slate-200 dark:border-outline-variant/20 rounded-2xl shadow-xl overflow-hidden origin-top"
                            >
                              <ul className="max-h-48 overflow-y-auto custom-scrollbar py-2">
                                {countryList.map((country) => (
                                  <li 
                                    key={country.code}
                                    onClick={() => handleCountrySelect(country.code)}
                                    className={`px-4 py-2 text-sm cursor-pointer transition-colors duration-150 flex items-center justify-between ${formData.country === country.code ? 'bg-primary-container text-white font-bold' : 'text-on-surface hover:bg-slate-100 dark:hover:bg-surface-variant'}`}
                                  >
                                    <span>{country.name}</span>
                                    {formData.country === country.code && (
                                      <span className="material-symbols-outlined text-lg">check</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CAMPOS SIEMPRE VISIBLES */}
            <div className="space-y-1">
              <label className={labelBaseClasses}>{t('auth.email')}</label>
              <input 
                type="email" name="email" required
                placeholder="email@example.com" className={inputBaseClasses}
                onChange={handleChange} value={formData.email}
              />
            </div>

            <div className="space-y-1">
              <label className={labelBaseClasses}>{t('auth.password')}</label>
              <input 
                type="password" name="password" required
                placeholder="••••••••" className={inputBaseClasses}
                onChange={handleChange} value={formData.password}
              />
            </div>

            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1 overflow-hidden"
                >
                  <label className={labelBaseClasses}>{t('auth.confirm_password')}</label>
                  <input 
                    type="password" name="confirmPassword" required={!isLogin}
                    placeholder="••••••••" className={inputBaseClasses}
                    onChange={handleChange} value={formData.confirmPassword}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.01, translateY: -2 }}
              whileTap={{ scale: 0.99 }}
              disabled={loading}
              type="submit"
              className={`w-full h-[56px] rounded-2xl font-black text-base shadow-lg transition-all duration-200 mt-6 flex items-center justify-center gap-3 ${loading ? 'bg-slate-300 dark:bg-surface-variant text-slate-500 cursor-not-allowed shadow-none' : 'bg-primary-container text-white shadow-orange-500/30 hover:shadow-orange-500/50'}`}
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">{isLogin ? 'login' : 'person_add'}</span>
                  {isLogin ? t('auth.login_btn') : t('auth.register_btn')}
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}