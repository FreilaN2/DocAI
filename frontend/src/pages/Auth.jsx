import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import Navbar from '../components/Navbar';

// Lista de países - Constante del módulo
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

// Constantes de estilos
const INPUT_BASE_CLASSES = "w-full py-4 pr-4 pl-12 h-[56px] bg-black/5 dark:bg-black/20 border border-outline/30 rounded-xl focus:border-primary-container focus:bg-primary-container/10 outline-none text-sm transition-colors duration-200 text-on-surface placeholder:text-on-surface-variant/50";
const LABEL_BASE_CLASSES = "text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1 mb-1 block";

// Componente de ojo simplificado sin animaciones complejas
const SimpleEye = React.memo(({ 
  size = 48, 
  pupilSize = 16, 
  eyeColor = "white", 
  pupilColor = "black", 
  isBlinking = false 
}) => (
  <div
    className="rounded-full flex items-center justify-center"
    style={{
      width: `${size}px`, 
      height: isBlinking ? '2px' : `${size}px`,
      backgroundColor: eyeColor, 
      overflow: 'hidden',
      transition: 'height 0.15s ease-in-out',
    }}
  >
    {!isBlinking && (
      <div
        className="rounded-full"
        style={{
          width: `${pupilSize}px`, 
          height: `${pupilSize}px`, 
          backgroundColor: pupilColor,
        }}
      />
    )}
  </div>
));

SimpleEye.displayName = 'SimpleEye';

// Componente de personaje memoizado
const Character = React.memo(({ 
  style, 
  eyeLeft, 
  eyeTop, 
  eyeGap = 8, 
  eyeSize = 18, 
  pupilSize = 7,
  isBlinking = false,
  children 
}) => (
  <div className="absolute bottom-0 transition-all duration-700 ease-in-out" style={style}>
    <div 
      className="absolute flex transition-all duration-700 ease-in-out"
      style={{
        left: `${eyeLeft}px`,
        top: `${eyeTop}px`,
        gap: `${eyeGap}px`,
      }}
    >
      <SimpleEye size={eyeSize} pupilSize={pupilSize} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isBlinking} />
      <SimpleEye size={eyeSize} pupilSize={pupilSize} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isBlinking} />
    </div>
    {children}
  </div>
));

Character.displayName = 'Character';

export default function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estado del formulario
  const [isLogin, setIsLogin] = useState(location.pathname !== '/register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', country: '', password: '', confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados de animación simplificados
  const [isTyping, setIsTyping] = useState(false);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  
  const dropdownRef = useRef(null);

  // Sincronizar isLogin con la ruta
  useEffect(() => {
    setIsLogin(location.pathname !== '/register');
  }, [location.pathname]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Animaciones de parpadeo simplificadas
  useEffect(() => {
    let timeoutId;
    const scheduleBlink = () => {
      const delay = Math.random() * 4000 + 3000;
      timeoutId = setTimeout(() => {
        setIsPurpleBlinking(true);
        setTimeout(() => {
          setIsPurpleBlinking(false);
          scheduleBlink();
        }, 150);
      }, delay);
    };
    scheduleBlink();
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    let timeoutId;
    const scheduleBlink = () => {
      const delay = Math.random() * 4000 + 3000;
      timeoutId = setTimeout(() => {
        setIsBlackBlinking(true);
        setTimeout(() => {
          setIsBlackBlinking(false);
          scheduleBlink();
        }, 150);
      }, delay);
    };
    scheduleBlink();
    return () => clearTimeout(timeoutId);
  }, []);

  // Handlers optimizados con useCallback
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  }, []);

  const handleCountrySelect = useCallback((code) => {
    setFormData(prev => ({ ...prev, country: code }));
    setIsCountryDropdownOpen(false);
    setError("");
  }, []);

  const handleTypingFocus = useCallback(() => setIsTyping(true), []);
  const handleTypingBlur = useCallback(() => setIsTyping(false), []);

  const togglePassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleAuthMode = useCallback(() => {
    setIsLogin(prev => !prev);
    setError("");
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validaciones
    if (!isLogin) {
      const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
      if (!nameRegex.test(formData.firstName) || !nameRegex.test(formData.lastName)) {
        setError("El nombre y apellido solo deben contener letras.");
        setLoading(false);
        return;
      }
      if (!formData.country) {
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
  }, [isLogin, formData, navigate]);

  const handleGoogleSuccess = useCallback(async (credentialResponse) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/google', { token: credentialResponse.credential });
      if (response.data.status === 'success') {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        toast.success("¡Bienvenido!", { 
          style: { background: '#1a1512', color: '#fff', borderRadius: '15px' }, 
          icon: '🚀' 
        });
        navigate('/editor/free');
      }
    } catch (err) {
      toast.error("Error al iniciar sesión con Google");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const selectedCountryName = formData.country
    ? COUNTRY_LIST.find(c => c.code === formData.country)?.name
    : "Seleccionar...";

  return (
    <div className="bg-background min-h-screen text-on-background relative flex flex-col lg:flex-row overflow-x-hidden">
      <Navbar />

      {/* Left Content Section - Solo visible en desktop */}
      <div className="relative hidden lg:flex flex-col justify-between bg-surface p-12 text-on-surface flex-1 overflow-hidden h-screen pt-24 sticky top-0">
        <div className="relative z-20 flex flex-col h-full justify-start pt-8 xl:pt-16">
          <div className="text-left mb-auto max-w-sm mx-auto w-full">
            <h2 className="text-5xl font-black mb-4 tracking-tight">{t('auth.left_title')}</h2>
            <p className="text-on-surface-variant text-lg">{t('auth.left_desc')}</p>
          </div>

          {/* Personajes simplificados */}
          <div className="relative flex items-end justify-center h-[500px]">
            <div 
              className="relative transform origin-bottom scale-[1.15] xl:scale-[1.35] transition-transform duration-500" 
              style={{ width: '550px', height: '400px' }}
            >
              {/* Purple character */}
              <Character
                eyeLeft={45} eyeTop={40} eyeSize={18} pupilSize={7}
                isBlinking={isPurpleBlinking}
                style={{
                  left: '70px', width: '180px',
                  height: isTyping ? '440px' : '400px',
                  backgroundColor: '#6C3FF5',
                  borderRadius: '10px 10px 0 0',
                  zIndex: 1,
                  transform: isTyping ? 'skewX(-12deg) translateX(40px)' : 'skewX(0deg)',
                  transformOrigin: 'bottom center',
                }}
              />

              {/* Black character */}
              <Character
                eyeLeft={26} eyeTop={32} eyeSize={16} pupilSize={6} eyeGap={6}
                isBlinking={isBlackBlinking}
                style={{
                  left: '240px', width: '120px', height: '310px',
                  backgroundColor: '#2D2D2D',
                  borderRadius: '8px 8px 0 0',
                  zIndex: 2,
                  transform: isTyping ? 'skewX(10deg) translateX(20px)' : 'skewX(0deg)',
                  transformOrigin: 'bottom center',
                }}
              />

              {/* Orange character */}
              <Character
                eyeLeft={82} eyeTop={90} eyeSize={0} pupilSize={0}
                isBlinking={false}
                style={{
                  left: '0px', width: '240px', height: '200px', zIndex: 3,
                  backgroundColor: '#FF9B6B',
                  borderRadius: '120px 120px 0 0',
                  transformOrigin: 'bottom center',
                }}
              />

              {/* Yellow character */}
              <Character
                eyeLeft={52} eyeTop={40} eyeSize={0} pupilSize={0} eyeGap={6}
                isBlinking={false}
                style={{
                  left: '310px', width: '140px', height: '230px',
                  backgroundColor: '#E8D754',
                  borderRadius: '70px 70px 0 0', zIndex: 4,
                  transformOrigin: 'bottom center',
                }}
              >
                <div 
                  className="absolute w-20 h-[4px] bg-[#2D2D2D] rounded-full"
                  style={{ left: '40px', top: '88px' }}
                />
              </Character>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="flex-1 flex flex-col items-center px-6 md:px-12 lg:px-24 justify-center bg-surface h-screen overflow-y-auto custom-scrollbar pt-20 pb-12">
        <div className="w-full max-w-[520px] shrink-0">
          {/* Header */}
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-3xl font-black tracking-tight mb-2 text-on-surface">
              {isLogin ? t('auth.login_title') : t('auth.register_title')}
            </h1>
            <p className="text-on-surface-variant text-sm font-medium">
              {isLogin ? t('auth.no_account') : t('auth.have_account')}{' '}
              <button
                type="button"
                onClick={toggleAuthMode}
                className="text-primary-container font-bold hover:text-primary transition-colors hover:underline focus:outline-none"
              >
                {isLogin ? t('auth.switch_register') : t('auth.switch_login')}
              </button>
            </p>
          </div>

          {/* Error message con animación CSS */}
          {error && (
            <div className="bg-error/10 text-error p-4 rounded-xl text-xs font-bold border border-error/20 mb-6 flex items-center gap-3 shadow-inner animate-fadeIn">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campos de registro - con transición CSS */}
            <div 
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                !isLogin ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={LABEL_BASE_CLASSES}>{t('auth.first_name')}</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">person</span>
                      <input
                        type="text" name="firstName" required={!isLogin}
                        placeholder="John" className={INPUT_BASE_CLASSES}
                        onChange={handleChange} value={formData.firstName}
                        onFocus={handleTypingFocus} onBlur={handleTypingBlur}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className={LABEL_BASE_CLASSES}>{t('auth.last_name')}</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">person</span>
                      <input
                        type="text" name="lastName" required={!isLogin}
                        placeholder="Doe" className={INPUT_BASE_CLASSES}
                        onChange={handleChange} value={formData.lastName}
                        onFocus={handleTypingFocus} onBlur={handleTypingBlur}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={LABEL_BASE_CLASSES}>{t('auth.phone')}</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">call</span>
                      <input
                        type="tel" name="phone" required={!isLogin}
                        placeholder="+1 234 567 890" className={INPUT_BASE_CLASSES}
                        onChange={handleChange} value={formData.phone}
                        onFocus={handleTypingFocus} onBlur={handleTypingBlur}
                      />
                    </div>
                  </div>

                  <div className="space-y-1" ref={dropdownRef}>
                    <label className={LABEL_BASE_CLASSES}>{t('auth.country')}</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsCountryDropdownOpen(prev => !prev)}
                        className={`${INPUT_BASE_CLASSES} flex justify-between items-center ${
                          isCountryDropdownOpen ? 'border-primary-container bg-primary/10' : ''
                        } ${!formData.country ? 'text-slate-500' : 'text-on-surface'}`}
                      >
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">public</span>
                        <span className="truncate pr-2">{selectedCountryName}</span>
                        <span 
                          className="material-symbols-outlined text-on-surface-variant text-xl transition-transform duration-300"
                          style={{ transform: isCountryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        >
                          keyboard_arrow_down
                        </span>
                      </button>

                      {/* Dropdown con animación CSS */}
                      <div 
                        className={`absolute z-50 w-full mt-2 bg-surface backdrop-blur-xl border border-outline-variant/20 rounded-2xl shadow-xl overflow-hidden origin-top transition-all duration-200 ${
                          isCountryDropdownOpen 
                            ? 'opacity-100 scale-100 translate-y-0' 
                            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                        }`}
                      >
                        <ul className="max-h-48 overflow-y-auto custom-scrollbar py-2">
                          {COUNTRY_LIST.map((country) => (
                            <li
                              key={country.code}
                              onClick={() => handleCountrySelect(country.code)}
                              className={`px-4 py-2 text-sm cursor-pointer transition-colors duration-150 flex items-center justify-between ${
                                formData.country === country.code 
                                  ? 'bg-primary-container text-white font-bold' 
                                  : 'text-on-surface hover:bg-primary-container/10'
                              }`}
                            >
                              <span>{country.name}</span>
                              {formData.country === country.code && (
                                <span className="material-symbols-outlined text-lg">check</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Email field */}
            <div className="space-y-1">
              <label className={LABEL_BASE_CLASSES}>{t('auth.email')}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">mail</span>
                <input
                  type="email" name="email" required
                  placeholder="email@example.com" className={INPUT_BASE_CLASSES}
                  onChange={handleChange} value={formData.email}
                  onFocus={handleTypingFocus} onBlur={handleTypingBlur}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1">
              <label className={LABEL_BASE_CLASSES}>{t('auth.password')}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">lock</span>
                <input
                  type={showPassword ? "text" : "password"} name="password" required
                  placeholder="••••••••" className={INPUT_BASE_CLASSES}
                  onChange={handleChange} value={formData.password}
                  onFocus={handleTypingFocus} onBlur={handleTypingBlur}
                />
                <button
                  type="button"
                  onClick={togglePassword}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-on-surface transition-colors focus:outline-none"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Confirm password - con transición CSS */}
            <div 
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                !isLogin ? 'max-h-[100px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="space-y-1">
                <label className={LABEL_BASE_CLASSES}>{t('auth.confirm_password')}</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">lock</span>
                  <input
                    type={showPassword ? "text" : "password"} 
                    name="confirmPassword" 
                    required={!isLogin}
                    placeholder="••••••••" 
                    className={INPUT_BASE_CLASSES}
                    onChange={handleChange} 
                    value={formData.confirmPassword}
                    onFocus={handleTypingFocus} 
                    onBlur={handleTypingBlur}
                  />
                </div>
              </div>
            </div>

            {/* Submit button */}
            <button
              disabled={loading}
              type="submit"
              className={`w-full h-[56px] rounded-xl font-black text-base shadow-lg transition-all duration-200 mt-6 flex items-center justify-center gap-3 active:scale-[0.99] ${
                loading 
                  ? 'bg-surface-variant text-on-surface-variant/50 cursor-not-allowed shadow-none' 
                  : 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container hover:-translate-y-0.5 shadow-primary/20'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-[3px] border-current/30 border-t-current rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">
                    {isLogin ? 'login' : 'person_add'}
                  </span>
                  {isLogin ? t('auth.login_btn') : t('auth.register_btn')}
                </>
              )}
            </button>
          </form>

          {/* Social Login */}
          <div className="mt-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline/20"></div>
              </div>
              <div className="relative flex justify-center text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                <span className="bg-surface px-4">{t('auth.continue_with')}</span>
              </div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error(t('auth.google_error'))}
                theme={document.documentElement.classList.contains('dark') ? 'filled_black' : 'outline'}
                shape="pill"
                size="large"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}