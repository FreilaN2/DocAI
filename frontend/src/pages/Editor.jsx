import React, { useState, useEffect } from 'react';
import api from '../api';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import PlanBadge from '../components/PlanBadge';
import ParagraphCard from '../components/ParagraphCard';

export default function Editor() {
  const { plan } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [edicion, setEdicion] = useState("7ma");
  const [result, setResult] = useState(null);
  const [includeTOC, setIncludeTOC] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(null);

  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  const isPro = plan === 'pro';

  // ── Guardia de Ruta y Gestión de Tokens ─────────────────────────
  useEffect(() => {
    if (isPro) {
      // Intentando entrar a Pro
      if (!token || !storedUser) {
        navigate('/login', { replace: true });
        return;
      }
      const userData = JSON.parse(storedUser);
      if (userData.plan !== 'pro') {
        navigate('/upgrade', { replace: true });
        return;
      }
    }

    // Cargar saldo si el usuario es Pro (sin importar en qué editor esté)
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.plan === 'pro') {
          api.get('/tokens/balance').then(r => {
            setTokenBalance(r.data);
            // Si intenta usar la herramienta Free pero aún tiene tokens, lo enviamos a Pro
            if (!isPro && r.data.total > 0) {
              navigate('/editor/pro', { replace: true });
            }
          }).catch(() => setTokenBalance(null));
        }
      } catch (e) { }
    }
  }, [isPro, token, storedUser, navigate]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.docx')) {
      setFile(selectedFile);
      setResult(null);
    } else {
      alert("Por favor, selecciona un archivo .docx válido.");
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.docx')) {
      setFile(droppedFile);
      setResult(null);
    } else {
      alert("Por favor, suelta un archivo .docx válido.");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('edicion', edicion);
    formData.append('plan', plan);

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const response = await api.post('/procesar-apa/', formData);
      setResult(response.data);
      // Actualizar saldo tras análisis
      if (isPro && token) {
        const balResp = await api.get('/tokens/balance');
        setTokenBalance(balResp.data);
      }
    } catch (error) {
      if (error.response?.status === 402) {
        alert("Sin tokens disponibles. Por favor adquiere más tokens en la página de Upgrade.");
      } else {
        alert("Error en la comunicación con el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLabelChange = (id, newCategory) => {
    const updatedDetalles = result.detalles.map(item =>
      item.id === id ? { ...item, categoria: newCategory } : item
    );
    setResult({ ...result, detalles: updatedDetalles });
  };

  const handleConfirmarYDescargar = async () => {
    setLoading(true);
    try {
      const payload = {
        edicion,
        filename: file.name,
        plan,
        parrafos: result.detalles.map(d => ({ texto: d.texto, categoria: d.categoria })),
        incluir_indice: includeTOC
      };
      const response = await api.post('/generar-final/', payload);
      window.location.href = `${api.defaults.baseURL}/descargar/${response.data.file_id}`;
    } catch (error) {
      alert("Error al generar el documento final.");
    } finally {
      setLoading(false);
    }
  };

  // Calcular porcentaje de tokens restantes
  const tokenPercent = tokenBalance
    ? Math.round(((tokenBalance.monthly_tokens + tokenBalance.extra_tokens) / 1000) * 100)
    : 0;
  const hasTokens = tokenBalance && (tokenBalance.monthly_tokens + tokenBalance.extra_tokens) > 0;
  const noTokensForPro = isPro && tokenBalance !== null && !hasTokens;

  return (
    <div className="bg-background min-h-screen text-on-background relative overflow-x-hidden">
      <Navbar />

      {/* Ambient Background */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.4, 0.3] }} transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-[-5%] right-[-5%] w-[30%] h-[30%] bg-surface-container-high rounded-full blur-[120px]" />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }} transition={{ duration: 12, repeat: Infinity }}
          className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-surface-variant rounded-full blur-[100px]" />
      </div>

      <main className="pt-32 pb-24 px-gutter max-w-4xl mx-auto flex flex-col gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-end mb-4">
          <PlanBadge plan={plan} />
        </motion.div>

        {/* Token Balance Bar — Solo usuarios Pro logueados */}
        {isPro && tokenBalance && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 dark:bg-[#1a1512]/80 backdrop-blur-lg rounded-2xl border border-slate-200 dark:border-outline-variant/30 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container text-sm">token</span>
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{t('editor.tokens_available')}</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="text-primary-container">
                  {tokenBalance.monthly_tokens} {t('editor.tokens_monthly')} + {tokenBalance.extra_tokens} {t('editor.tokens_extra')}
                </span>
                <Link to="/upgrade" className="text-[10px] font-black px-2 py-1 rounded-full bg-orange-100 text-primary-container hover:bg-orange-200 transition-colors no-underline">
                  + Tokens
                </Link>
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-surface-variant rounded-full h-2.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(tokenPercent, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-2.5 rounded-full ${tokenPercent > 20 ? 'bg-primary-container' : 'bg-red-400'}`}
              />
            </div>
            {tokenBalance.next_reset_at && (
              <p className="text-[10px] text-slate-400 font-bold mt-1.5">
                {t('editor.tokens_renewal')}{new Date(tokenBalance.next_reset_at).toLocaleDateString()}
              </p>
            )}
          </motion.div>
        )}

        {/* Banner sin tokens */}
        {noTokensForPro && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-orange-50 dark:bg-surface-container-high border-2 border-primary-container/30 rounded-2xl p-5 flex items-center gap-4"
          >
            <span className="material-symbols-outlined text-primary-container text-3xl">warning</span>
            <div className="flex-grow">
              <p className="font-black text-on-surface">Sin tokens disponibles</p>
              <p className="text-xs text-on-surface-variant">Tus tokens mensuales se han agotado. Renueva tu plan o compra un paquete extra.</p>
            </div>
            <Link to="/upgrade" className="bg-primary-container text-white font-black px-4 py-2 rounded-xl text-sm hover:opacity-90 no-underline whitespace-nowrap">
              Ver planes →
            </Link>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.section key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full">
              <div className="text-center mb-10">
                <h1 className="text-4xl font-black tracking-tight text-on-surface mb-2">{t('editor.upload_title')}</h1>
                <p className="text-on-surface-variant">{t('editor.upload_subtitle')}</p>
              </div>

              <div className="bg-white/70 dark:bg-[#1a1512]/70 backdrop-blur-[20px] rounded-card border border-slate-200 dark:border-outline-variant/30 p-8 shadow-sm">
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('editor.style')}</label>
                    <select value={edicion} onChange={(e) => setEdicion(e.target.value)}
                      className="w-full p-4 bg-white dark:bg-surface border border-slate-200 dark:border-outline-variant/30 rounded-2xl focus:ring-4 focus:ring-orange-100 dark:focus:ring-primary/20 outline-none text-sm font-bold transition-all cursor-pointer"
                    >
                      <option value="6ta">{t('editor.apa_6th')}</option>
                      <option value="7ma">{t('editor.apa_7th')}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Formato</label>
                    <div className="p-4 bg-slate-50 dark:bg-surface-variant border border-slate-200 dark:border-outline-variant/30 rounded-2xl text-sm font-bold text-slate-500 dark:text-on-surface-variant flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">description</span> Microsoft Word (.docx)
                    </div>
                  </div>
                </div>

                <motion.label
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`relative border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center gap-4 bg-surface-bright/50 transition-all duration-300 cursor-pointer
                    ${isDragging ? 'border-primary-container bg-orange-100/40 scale-[1.02] shadow-lg shadow-orange-100' : 'border-outline-variant'}
                    ${file ? 'border-primary-container bg-orange-50/30' : 'hover:border-primary-container hover:bg-surface-container-low'}
                  `}
                >
                  <input type="file" className="hidden" accept=".docx" onChange={handleFileChange} />
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${isDragging || file ? 'bg-primary-container text-white' : 'bg-surface-container text-primary-container'}`}>
                    <span className={`material-symbols-outlined text-3xl ${isDragging ? 'animate-bounce' : ''}`}>
                      {file ? 'task_alt' : (isDragging ? 'download' : 'upload_file')}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-on-surface text-center">
                    {isDragging ? t('editor.drop_here') : (file ? file.name : t('editor.select_file'))}
                  </h3>
                  {!file && !isDragging && <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{t('editor.drag_drop')}</p>}
                </motion.label>

                <button
                  onClick={handleUpload}
                  disabled={loading || !file || noTokensForPro}
                  className={`w-full mt-8 py-5 rounded-2xl font-black text-white shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95
                    ${loading || !file || noTokensForPro ? 'bg-slate-200 dark:bg-surface-variant text-slate-400 dark:text-on-surface-variant/50 cursor-not-allowed shadow-none' : 'bg-primary-container shadow-primary-container/20'}`}
                >
                  {loading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                  ) : (
                    <><span className="material-symbols-outlined">auto_fix_high</span> {t('editor.analyze')}</>
                  )}
                </button>
              </div>
            </motion.section>
          ) : (
            <motion.section key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
              <div className="bg-surface/80 dark:bg-surface/90 backdrop-blur-xl rounded-card border border-outline-variant/10 p-8 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-on-surface">{t('editor.correction_title')}</h2>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t('editor.correction_subtitle')}</p>
                  </div>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 mb-8">
                  {result.detalles?.map((item, index) => (
                    <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                      <ParagraphCard item={item} onLabelChange={handleLabelChange} />
                    </motion.div>
                  ))}
                </div>

                <div className="flex items-center gap-4 mb-8 p-5 bg-surface-container-low rounded-2xl border border-outline-variant/30">
                  <input type="checkbox" id="toc-toggle" checked={includeTOC} onChange={(e) => setIncludeTOC(e.target.checked)}
                    className="w-6 h-6 accent-primary-container cursor-pointer" />
                  <label htmlFor="toc-toggle" className="text-sm font-bold text-on-surface cursor-pointer">
                    Generar Tabla de Contenidos automáticamente
                  </label>
                </div>

                <button onClick={handleConfirmarYDescargar} disabled={loading}
                  className="w-full py-6 bg-primary-container text-white rounded-3xl font-black text-lg shadow-xl shadow-orange-200 hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full" />
                  ) : (
                    <><span className="material-symbols-outlined">download</span> {t('editor.confirm')}</>
                  )}
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
