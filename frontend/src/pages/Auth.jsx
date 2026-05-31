import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import Navbar from '../components/Navbar';

// Lista de países
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

const inputBaseClasses = "w-full py-4 pr-4 pl-12 h-[56px] bg-black/5 dark:bg-black/20 border border-outline/30 rounded-xl focus:border-primary-container focus:bg-primary-container/10 outline-none text-sm transition-colors duration-200 text-on-surface placeholder:text-on-surface-variant/50";
const labelBaseClasses = "text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1 mb-1 block";

const Pupil = ({ size = 12, maxDistance = 5, pupilColor = "black", forceLookX, forceLookY }) => {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const pupilRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const calculatePupilPosition = () => {
    if (!pupilRef.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };

    const pupil = pupilRef.current.getBoundingClientRect();
    const pupilCenterX = pupil.left + pupil.width / 2;
    const pupilCenterY = pupil.top + pupil.height / 2;

    const deltaX = mouseX - pupilCenterX;
    const deltaY = mouseY - pupilCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={pupilRef}
      className="rounded-full"
      style={{
        width: `${size}px`, height: `${size}px`, backgroundColor: pupilColor,
        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    />
  );
};

const EyeBall = ({ size = 48, pupilSize = 16, maxDistance = 10, eyeColor = "white", pupilColor = "black", isBlinking = false, forceLookX, forceLookY }) => {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const eyeRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const calculatePupilPosition = () => {
    if (!eyeRef.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };

    const eye = eyeRef.current.getBoundingClientRect();
    const eyeCenterX = eye.left + eye.width / 2;
    const eyeCenterY = eye.top + eye.height / 2;

    const deltaX = mouseX - eyeCenterX;
    const deltaY = mouseY - eyeCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={eyeRef}
      className="rounded-full flex items-center justify-center transition-all duration-150"
      style={{
        width: `${size}px`, height: isBlinking ? '2px' : `${size}px`,
        backgroundColor: eyeColor, overflow: 'hidden',
      }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: `${pupilSize}px`, height: `${pupilSize}px`, backgroundColor: pupilColor,
            transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}
    </div>
  );
};

export default function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname !== '/register');
  
  useEffect(() => {
    setIsLogin(location.pathname !== '/register');
  }, [location.pathname]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', country: '', password: '', confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  
  const purpleRef = useRef(null);
  const blackRef = useRef(null);
  const yellowRef = useRef(null);
  const orangeRef = useRef(null);
  
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

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;
    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(() => {
        setIsPurpleBlinking(true);
        setTimeout(() => {
          setIsPurpleBlinking(false);
          scheduleBlink();
        }, 150);
      }, getRandomBlinkInterval());
      return blinkTimeout;
    };
    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;
    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(() => {
        setIsBlackBlinking(true);
        setTimeout(() => {
          setIsBlackBlinking(false);
          scheduleBlink();
        }, 150);
      }, getRandomBlinkInterval());
      return blinkTimeout;
    };
    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const timer = setTimeout(() => setIsLookingAtEachOther(false), 800);
      return () => clearTimeout(timer);
    } else {
      setIsLookingAtEachOther(false);
    }
  }, [isTyping]);

  useEffect(() => {
    if (formData.password.length > 0 && showPassword) {
      const schedulePeek = () => {
        const peekInterval = setTimeout(() => {
          setIsPurplePeeking(true);
          setTimeout(() => setIsPurplePeeking(false), 800);
        }, Math.random() * 3000 + 2000);
        return peekInterval;
      };
      const firstPeek = schedulePeek();
      return () => clearTimeout(firstPeek);
    } else {
      setIsPurplePeeking(false);
    }
  }, [formData.password, showPassword]);

  const calculatePosition = (ref) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    const faceX = Math.max(-15, Math.min(15, deltaX / 20));
    const faceY = Math.max(-10, Math.min(10, deltaY / 30));
    const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120));
    return { faceX, faceY, bodySkew };
  };

  const purplePos = calculatePosition(purpleRef);
  const blackPos = calculatePosition(blackRef);
  const yellowPos = calculatePosition(yellowRef);
  const orangePos = calculatePosition(orangeRef);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleCountrySelect = (code) => {
    setFormData({ ...formData, country: code });
    setIsCountryDropdownOpen(false);
    setError("");
  };

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

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/google', { token: credentialResponse.credential });
      if (response.data.status === 'success') {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        toast.success("¡Bienvenido!", { style: { background: '#1a1512', color: '#fff', borderRadius: '15px' }, icon: '🚀' });
        navigate('/editor/free');
      }
    } catch (err) {
      toast.error("Error al iniciar sesión con Google");
    } finally {
      setLoading(false);
    }
  };

  const selectedCountryName = formData.country
    ? countryList.find(c => c.code === formData.country)?.name
    : "Seleccionar...";

  const hasPassword = formData.password.length > 0;

  return (
    <div className="bg-background min-h-screen text-on-background relative flex flex-col lg:flex-row overflow-x-hidden">
      <Navbar />

      {/* Left Content Section */}
      <div className="relative hidden lg:flex flex-col justify-between bg-surface p-12 text-on-surface flex-1 overflow-hidden h-screen pt-24 sticky top-0">
        
        <div className="relative z-20 flex flex-col h-full justify-center">
          
          <div className="text-left mb-8 max-w-sm mx-auto w-full">
            <h2 className="text-4xl font-bold mb-4 tracking-tight">{t('auth.left_title')}</h2>
            <p className="text-on-surface-variant text-lg">{t('auth.left_desc')}</p>
          </div>

          <div className="relative flex items-end justify-center h-[500px] mt-10">
            {/* Cartoon Characters */}
            <div className="relative" style={{ width: '550px', height: '400px' }}>
              {/* Purple tall rectangle character */}
              <div 
                ref={purpleRef}
                className="absolute bottom-0 transition-all duration-700 ease-in-out"
                style={{
                  left: '70px',
                  width: '180px',
                  height: (isTyping || (hasPassword && !showPassword)) ? '440px' : '400px',
                  backgroundColor: '#6C3FF5',
                  borderRadius: '10px 10px 0 0',
                  zIndex: 1,
                  transform: (hasPassword && showPassword)
                    ? `skewX(0deg)`
                    : (isTyping || (hasPassword && !showPassword))
                      ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)` 
                      : `skewX(${purplePos.bodySkew || 0}deg)`,
                  transformOrigin: 'bottom center',
                }}
              >
                <div 
                  className="absolute flex gap-8 transition-all duration-700 ease-in-out"
                  style={{
                    left: (hasPassword && showPassword) ? `20px` : isLookingAtEachOther ? `55px` : `${45 + purplePos.faceX}px`,
                    top: (hasPassword && showPassword) ? `35px` : isLookingAtEachOther ? `65px` : `${40 + purplePos.faceY}px`,
                  }}
                >
                  <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isPurpleBlinking} forceLookX={(hasPassword && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined} forceLookY={(hasPassword && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
                  <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isPurpleBlinking} forceLookX={(hasPassword && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined} forceLookY={(hasPassword && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
                </div>
              </div>

              {/* Black tall rectangle character */}
              <div 
                ref={blackRef}
                className="absolute bottom-0 transition-all duration-700 ease-in-out"
                style={{
                  left: '240px',
                  width: '120px',
                  height: '310px',
                  backgroundColor: '#2D2D2D',
                  borderRadius: '8px 8px 0 0',
                  zIndex: 2,
                  transform: (hasPassword && showPassword)
                    ? `skewX(0deg)`
                    : isLookingAtEachOther
                      ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                      : (isTyping || (hasPassword && !showPassword))
                        ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)` 
                        : `skewX(${blackPos.bodySkew || 0}deg)`,
                  transformOrigin: 'bottom center',
                }}
              >
                <div 
                  className="absolute flex gap-6 transition-all duration-700 ease-in-out"
                  style={{
                    left: (hasPassword && showPassword) ? `10px` : isLookingAtEachOther ? `32px` : `${26 + blackPos.faceX}px`,
                    top: (hasPassword && showPassword) ? `28px` : isLookingAtEachOther ? `12px` : `${32 + blackPos.faceY}px`,
                  }}
                >
                  <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isBlackBlinking} forceLookX={(hasPassword && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined} forceLookY={(hasPassword && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined} />
                  <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isBlackBlinking} forceLookX={(hasPassword && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined} forceLookY={(hasPassword && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined} />
                </div>
              </div>

              {/* Orange semi-circle character */}
              <div 
                ref={orangeRef}
                className="absolute bottom-0 transition-all duration-700 ease-in-out"
                style={{
                  left: '0px', width: '240px', height: '200px', zIndex: 3,
                  backgroundColor: '#FF9B6B', borderRadius: '120px 120px 0 0',
                  transform: (hasPassword && showPassword) ? `skewX(0deg)` : `skewX(${orangePos.bodySkew || 0}deg)`,
                  transformOrigin: 'bottom center',
                }}
              >
                <div 
                  className="absolute flex gap-8 transition-all duration-200 ease-out"
                  style={{
                    left: (hasPassword && showPassword) ? `50px` : `${82 + (orangePos.faceX || 0)}px`,
                    top: (hasPassword && showPassword) ? `85px` : `${90 + (orangePos.faceY || 0)}px`,
                  }}
                >
                  <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(hasPassword && showPassword) ? -5 : undefined} forceLookY={(hasPassword && showPassword) ? -4 : undefined} />
                  <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(hasPassword && showPassword) ? -5 : undefined} forceLookY={(hasPassword && showPassword) ? -4 : undefined} />
                </div>
              </div>

              {/* Yellow tall rectangle character */}
              <div 
                ref={yellowRef}
                className="absolute bottom-0 transition-all duration-700 ease-in-out"
                style={{
                  left: '310px', width: '140px', height: '230px', backgroundColor: '#E8D754',
                  borderRadius: '70px 70px 0 0', zIndex: 4,
                  transform: (hasPassword && showPassword) ? `skewX(0deg)` : `skewX(${yellowPos.bodySkew || 0}deg)`,
                  transformOrigin: 'bottom center',
                }}
              >
                <div 
                  className="absolute flex gap-6 transition-all duration-200 ease-out"
                  style={{
                    left: (hasPassword && showPassword) ? `20px` : `${52 + (yellowPos.faceX || 0)}px`,
                    top: (hasPassword && showPassword) ? `35px` : `${40 + (yellowPos.faceY || 0)}px`,
                  }}
                >
                  <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(hasPassword && showPassword) ? -5 : undefined} forceLookY={(hasPassword && showPassword) ? -4 : undefined} />
                  <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(hasPassword && showPassword) ? -5 : undefined} forceLookY={(hasPassword && showPassword) ? -4 : undefined} />
                </div>
                <div 
                  className="absolute w-20 h-[4px] bg-[#2D2D2D] rounded-full transition-all duration-200 ease-out"
                  style={{
                    left: (hasPassword && showPassword) ? `10px` : `${40 + (yellowPos.faceX || 0)}px`,
                    top: (hasPassword && showPassword) ? `88px` : `${88 + (yellowPos.faceY || 0)}px`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Background is now clean to match the right side */}
      </div>

      {/* Right Login Section */}
      <div className="flex-1 flex flex-col items-center px-6 md:px-12 lg:px-24 pt-32 pb-24 bg-surface h-screen overflow-y-auto custom-scrollbar">
        <div className="flex-grow shrink-0 min-h-[1rem]"></div>
        <div className="w-full max-w-[440px] shrink-0">

          {/* Header */}
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-3xl font-black tracking-tight mb-2 text-on-surface">
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

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="register-fields"
                  initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  animate={{
                    opacity: 1, height: 'auto',
                    transitionEnd: { overflow: 'visible' }
                  }}
                  exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className={labelBaseClasses}>{t('auth.first_name')}</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">person</span>
                        <input
                          type="text" name="firstName" required={!isLogin}
                          placeholder="John" className={inputBaseClasses}
                          onChange={handleChange} value={formData.firstName}
                          onFocus={() => setIsTyping(true)} onBlur={() => setIsTyping(false)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className={labelBaseClasses}>{t('auth.last_name')}</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">person</span>
                        <input
                          type="text" name="lastName" required={!isLogin}
                          placeholder="Doe" className={inputBaseClasses}
                          onChange={handleChange} value={formData.lastName}
                          onFocus={() => setIsTyping(true)} onBlur={() => setIsTyping(false)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className={labelBaseClasses}>{t('auth.phone')}</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">call</span>
                        <input
                          type="tel" name="phone" required={!isLogin}
                          placeholder="+1 234 567 890" className={inputBaseClasses}
                          onChange={handleChange} value={formData.phone}
                          onFocus={() => setIsTyping(true)} onBlur={() => setIsTyping(false)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1" ref={dropdownRef}>
                      <label className={labelBaseClasses}>{t('auth.country')}</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                          className={`${inputBaseClasses} flex justify-between items-center ${isCountryDropdownOpen ? 'border-primary-container bg-primary/10' : ''} ${!formData.country ? 'text-slate-500' : 'text-on-surface'}`}
                        >
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">public</span>
                          <span className="truncate pr-2">{selectedCountryName}</span>
                          <span className="material-symbols-outlined text-on-surface-variant text-xl transition-transform duration-300" style={{ transform: isCountryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
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
                              className="absolute z-50 w-full mt-2 bg-surface backdrop-blur-xl border border-outline-variant/20 rounded-2xl shadow-xl overflow-hidden origin-top"
                            >
                              <ul className="max-h-48 overflow-y-auto custom-scrollbar py-2">
                                {countryList.map((country) => (
                                  <li
                                    key={country.code}
                                    onClick={() => handleCountrySelect(country.code)}
                                    className={`px-4 py-2 text-sm cursor-pointer transition-colors duration-150 flex items-center justify-between ${formData.country === country.code ? 'bg-primary-container text-white font-bold' : 'text-on-surface hover:bg-primary-container/10'}`}
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

            <div className="space-y-1">
              <label className={labelBaseClasses}>{t('auth.email')}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">mail</span>
                <input
                  type="email" name="email" required
                  placeholder="email@example.com" className={inputBaseClasses}
                  onChange={handleChange} value={formData.email}
                  onFocus={() => setIsTyping(true)} onBlur={() => setIsTyping(false)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelBaseClasses}>{t('auth.password')}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">lock</span>
                <input
                  type={showPassword ? "text" : "password"} name="password" required
                  placeholder="••••••••" className={inputBaseClasses}
                  onChange={handleChange} value={formData.password}
                  onFocus={() => setIsTyping(true)} onBlur={() => setIsTyping(false)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-on-surface transition-colors focus:outline-none"
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
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
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">lock</span>
                    <input
                      type={showPassword ? "text" : "password"} name="confirmPassword" required={!isLogin}
                      placeholder="••••••••" className={inputBaseClasses}
                      onChange={handleChange} value={formData.confirmPassword}
                      onFocus={() => setIsTyping(true)} onBlur={() => setIsTyping(false)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.01, translateY: -2 }}
              whileTap={{ scale: 0.99 }}
              disabled={loading}
              type="submit"
              className={`w-full h-[56px] rounded-xl font-black text-base shadow-lg transition-all duration-200 mt-6 flex items-center justify-center gap-3 ${loading ? 'bg-surface-variant text-on-surface-variant/50 cursor-not-allowed shadow-none' : 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container shadow-primary/20'}`}
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-3 border-current/30 border-t-current rounded-full" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">{isLogin ? 'login' : 'person_add'}</span>
                  {isLogin ? t('auth.login_btn') : t('auth.register_btn')}
                </>
              )}
            </motion.button>
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
        <div className="flex-grow shrink-0 min-h-[2rem]"></div>
      </div>
    </div>
  );
}