import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// ── Partícula flotante ────────────────────────────────────────────────────────
function Particle({ x, y, size, duration, delay, color }) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        filter: 'blur(1px)',
        pointerEvents: 'none',
      }}
      animate={{
        y: [0, -30, 0],
        opacity: [0.2, 0.8, 0.2],
        scale: [1, 1.4, 1],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

// ── Dígito animado ─────────────────────────────────────────────────────────
function GlitchDigit({ digit, color }) {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 200);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <span
        style={{
          fontSize: 'clamp(120px, 20vw, 220px)',
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: '-0.04em',
          color: 'transparent',
          WebkitTextStroke: `3px ${color}`,
          textShadow: glitching
            ? `4px 0 #ff003c, -4px 0 #00d4ff, 0 0 40px ${color}80`
            : `0 0 60px ${color}40, 0 0 120px ${color}20`,
          transition: 'text-shadow 0.1s',
          display: 'block',
          userSelect: 'none',
          fontFamily: '"Inter", "Segoe UI", sans-serif',
        }}
      >
        {digit}
      </span>
      {glitching && (
        <>
          <span style={{
            position: 'absolute', inset: 0,
            fontSize: 'clamp(120px, 20vw, 220px)', fontWeight: 900,
            lineHeight: 1, letterSpacing: '-0.04em',
            color: '#ff003c', opacity: 0.6,
            transform: 'translate(4px, -2px)',
            fontFamily: '"Inter", "Segoe UI", sans-serif',
          }}>{digit}</span>
          <span style={{
            position: 'absolute', inset: 0,
            fontSize: 'clamp(120px, 20vw, 220px)', fontWeight: 900,
            lineHeight: 1, letterSpacing: '-0.04em',
            color: '#00d4ff', opacity: 0.6,
            transform: 'translate(-4px, 2px)',
            fontFamily: '"Inter", "Segoe UI", sans-serif',
          }}>{digit}</span>
        </>
      )}
    </div>
  );
}

export default function NotFound() {
  const { t } = useTranslation();
  const canvasRef = useRef(null);

  // Leer tema actual desde localStorage (misma fuente que el Navbar)
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  useEffect(() => {
    // Sincronizar si el usuario cambia el tema mientras está en el 404
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Paleta según tema
  const c = isDark ? {
    bg:            'linear-gradient(135deg, #0a0a0f 0%, #12111a 50%, #0f0a0a 100%)',
    h1:            '#ffffff',
    p:             'rgba(255,255,255,0.5)',
    footerC:       'rgba(255,255,255,0.2)',
    btnBackBg:     'rgba(255,107,0,0.07)',
    btnBackBorder: '1.5px solid rgba(255,107,0,0.35)',
    btnBackColor:  '#ff8c33',
    chipBg:        'rgba(255,255,255,0.04)',
    chipBorder:    '1px solid rgba(255,255,255,0.1)',
    chipColor:     'rgba(255,255,255,0.6)',
  } : {
    bg:            'linear-gradient(135deg, #fff7f0 0%, #fef3ec 50%, #fff9f5 100%)',
    h1:            '#1a0f05',
    p:             'rgba(30,15,5,0.55)',
    footerC:       'rgba(30,15,5,0.3)',
    btnBackBg:     'rgba(255,107,0,0.06)',
    btnBackBorder: '1.5px solid rgba(255,107,0,0.3)',
    btnBackColor:  '#a04100',
    chipBg:        'rgba(255,107,0,0.05)',
    chipBorder:    '1px solid rgba(255,107,0,0.15)',
    chipColor:     'rgba(100,50,10,0.7)',
  };

  // Grid animada de fondo
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let offset = 0;
    const draw = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const step = 60;
      ctx.strokeStyle = 'rgba(255,107,0,0.06)';
      ctx.lineWidth = 1;
      for (let x = (offset % step) - step; x < canvas.width + step; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = (offset % step) - step; y < canvas.height + step; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
      offset += 0.3;
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  const particles = Array.from({ length: 18 }, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: `${Math.random() * 6 + 2}px`,
    duration: 3 + Math.random() * 4,
    delay: Math.random() * 3,
    color: i % 3 === 0 ? '#ff6b00' : i % 3 === 1 ? '#ff8c33' : '#a04100',
  }));

  return (
    <div style={{
      minHeight: '100vh',
      background: c.bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '"Inter", "Segoe UI", sans-serif',
    }}>
      {/* Grid canvas */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      {/* Orbes de luz de fondo */}
      <div style={{
        position: 'absolute', width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,107,0,0.12) 0%, transparent 70%)',
        top: '-100px', left: '-150px', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(160,65,0,0.1) 0%, transparent 70%)',
        bottom: '-50px', right: '-100px', pointerEvents: 'none',
      }} />

      {/* Partículas flotantes */}
      {particles.map((p, i) => <Particle key={i} {...p} />)}

      {/* Contenido principal */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        style={{
          position: 'relative', zIndex: 10,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', textAlign: 'center',
          padding: '0 24px', maxWidth: '700px',
        }}
      >
        {/* Ícono de documento roto */}
        <motion.div
          animate={{ rotate: [-3, 3, -3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ marginBottom: '16px' }}
        >
          <div style={{
            width: '80px', height: '80px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #ff6b00, #a04100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(255,107,0,0.4), 0 8px 32px rgba(0,0,0,0.5)',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#fff' }}>
              broken_image
            </span>
          </div>
        </motion.div>

        {/* 404 con efecto glitch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0px', marginBottom: '8px' }}>
          <GlitchDigit digit="4" color="#ff6b00" />
          <motion.div
            animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <GlitchDigit digit="0" color="#ff8c33" />
          </motion.div>
          <GlitchDigit digit="4" color="#ff6b00" />
        </div>

        {/* Línea decorativa */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{
            height: '2px', width: '200px', marginBottom: '28px',
            background: 'linear-gradient(90deg, transparent, #ff6b00, #ff8c33, #ff6b00, transparent)',
            borderRadius: '2px',
          }}
        />

        {/* Textos */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800,
            color: c.h1, marginBottom: '12px', lineHeight: 1.2,
          }}
        >
          {t('not_found.title')}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          style={{
            fontSize: 'clamp(14px, 2vw, 17px)', color: c.p,
            lineHeight: 1.6, marginBottom: '40px', maxWidth: '440px',
          }}
        >
          {t('not_found.desc')}
        </motion.p>

        {/* Botones de acción */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <Link to="/" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '14px 28px', borderRadius: '14px', border: 'none',
                background: 'linear-gradient(135deg, #ff6b00, #a04100)',
                color: '#ffffff', fontWeight: 700, fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 4px 24px rgba(255,107,0,0.35), 0 2px 8px rgba(0,0,0,0.3)',
                fontFamily: '"Inter", "Segoe UI", sans-serif',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>home</span>
              {t('not_found.go_home')}
            </motion.button>
          </Link>

          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => window.history.back()}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '14px 28px', borderRadius: '14px',
              border: c.btnBackBorder,
              background: c.btnBackBg,
              color: c.btnBackColor, fontWeight: 700, fontSize: '15px',
              cursor: 'pointer', backdropFilter: 'blur(8px)',
              fontFamily: '"Inter", "Segoe UI", sans-serif',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            {t('not_found.go_back')}
          </motion.button>
        </motion.div>

        {/* Links rápidos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{ marginTop: '48px', display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          {[
            { to: '/editor/free', icon: 'description', label: 'Editor Free' },
            { to: '/editor/pro', icon: 'auto_awesome', label: 'Editor Pro' },
            { to: '/support', icon: 'help', label: t('not_found.support') },
          ].map(link => (
            <Link key={link.to} to={link.to} style={{ textDecoration: 'none' }}>
              <motion.div
                whileHover={{ background: 'rgba(255,107,0,0.12)', borderColor: 'rgba(255,107,0,0.4)' }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px', borderRadius: '20px',
                  border: c.chipBorder,
                  background: c.chipBg,
                  color: c.chipColor, fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>{link.icon}</span>
                {link.label}
              </motion.div>
            </Link>
          ))}
        </motion.div>
      </motion.div>

      {/* Footer minimal */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{
          position: 'absolute', bottom: '24px',
          color: c.footerC, fontSize: '12px',
        }}
      >
        © 2026 DocIA · {t('not_found.error_code')}: 404
      </motion.p>
    </div>
  );
}
