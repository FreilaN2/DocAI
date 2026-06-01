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
  const [downloadFormat, setDownloadFormat] = useState('docx');
  const [isDragging, setIsDragging] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(null);
  // Estado de progreso SSE
  const [progreso, setProgreso] = useState(0);
  const [loteActual, setLoteActual] = useState(0);
  const [totalLotes, setTotalLotes] = useState(0);
  const [tiempoRestante, setTiempoRestante] = useState(null);
  const [modeloUsado, setModeloUsado] = useState('');
  const [errorProceso, setErrorProceso] = useState(null);
  const esRef = React.useRef(null); // referencia al EventSource activo

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
    setProgreso(0);
    setLoteActual(0);
    setTotalLotes(0);
    setTiempoRestante(null);
    setModeloUsado('');
    setErrorProceso(null);

    try {
      // ── Paso 1: Subir el archivo ───────────────────────────────────────
      const formData = new FormData();
      formData.append('file', file);
      const uploadResp = await api.post('/upload-documento/', formData);
      const { upload_id } = uploadResp.data;

      // ── Paso 2: Conectar SSE para procesar ────────────────────────────
      const baseURL = api.defaults.baseURL || '';
      const sseUrl = `${baseURL}/procesar-apa/stream?upload_id=${upload_id}&edicion=${edicion}&plan=${plan}&token=${token}`;

      const es = new EventSource(sseUrl);
      esRef.current = es;

      es.onmessage = (e) => {
        const evento = JSON.parse(e.data);

        if (evento.tipo === 'inicio') {
          setTotalLotes(evento.total_lotes);
          setModeloUsado(evento.modelo || '');
        }

        if (evento.tipo === 'lote') {
          setProgreso(evento.progreso);
          setLoteActual(evento.lote);
          setTotalLotes(evento.total_lotes);
          setTiempoRestante(evento.tiempo_estimado);
        }

        if (evento.tipo === 'finalizado') {
          setProgreso(100);
          setResult({
            detalles: evento.detalles,
            resumen: evento.stats,
          });
          es.close();
          esRef.current = null;
          setLoading(false);
          // Actualizar saldo tras análisis
          if (isPro && token) {
            api.get('/tokens/balance').then(r => setTokenBalance(r.data)).catch(() => {});
          }
        }

        if (evento.tipo === 'error') {
          setErrorProceso(evento.mensaje || 'Error desconocido en el procesamiento.');
          es.close();
          esRef.current = null;
          setLoading(false);
        }
      };

      es.onerror = () => {
        setErrorProceso('Se perdió la conexión con el servidor.');
        es.close();
        esRef.current = null;
        setLoading(false);
      };

    } catch (error) {
      if (error.response?.status === 402) {
        setErrorProceso('Sin tokens disponibles. Adquiere más en la página de Upgrade.');
      } else {
        setErrorProceso('Error al subir el archivo. Inténtalo de nuevo.');
      }
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
        incluir_indice: isPro ? includeTOC : false,
        formato: downloadFormat
      };
      const response = await api.post('/generar-final/', payload);
      window.location.href = `${api.defaults.baseURL}/descargar/${response.data.file_id}`;
    } catch (error) {
      alert("Error al generar el documento final.");
    } finally {
      setLoading(false);
    }
  };

  // Calcular porcentaje de tokens restantes (máximo: 500 tokens Pro)
  const TOKEN_MAX_PRO = 500;
  const tokenPercent = tokenBalance
    ? Math.round(((tokenBalance.monthly_tokens + tokenBalance.extra_tokens) / TOKEN_MAX_PRO) * 100)
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
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-center sm:justify-end mb-4">
          <PlanBadge plan={plan} />
        </motion.div>

        {/* Token Balance Bar — Solo usuarios Pro logueados */}
        {isPro && tokenBalance && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 dark:bg-[#1a1512]/80 backdrop-blur-lg rounded-2xl border border-slate-200 dark:border-outline-variant/30 p-4 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container text-sm">token</span>
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{t('editor.tokens_available')}</span>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-bold w-full sm:w-auto">
                <span className="text-primary-container flex-1 sm:flex-none">
                  {tokenBalance.monthly_tokens} {t('editor.tokens_monthly')} + {tokenBalance.extra_tokens} {t('editor.tokens_extra')}
                </span>
                <Link to="/upgrade" className="text-[10px] font-black px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-primary-container hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors no-underline whitespace-nowrap shrink-0">
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

                {/* Botón de análisis / Barra de progreso SSE */}
                {loading ? (
                  <div className="mt-8 space-y-3">
                    {/* Cabecera de progreso */}
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-on-surface-variant px-1">
                      <span className="flex items-center gap-1.5">
                        <motion.span
                          animate={{ opacity: [1, 0.4, 1] }}
                          transition={{ repeat: Infinity, duration: 1.2 }}
                          className="w-2 h-2 rounded-full bg-primary-container inline-block"
                        />
                        {totalLotes > 0
                          ? `Lote ${loteActual} de ${totalLotes}`
                          : 'Preparando análisis...'}
                      </span>
                      <span className="text-primary-container font-black">{progreso}%</span>
                    </div>

                    {/* Barra de progreso animada */}
                    <div className="w-full bg-slate-100 dark:bg-surface-variant rounded-full h-3 overflow-hidden">
                      <motion.div
                        animate={{ width: `${progreso}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-3 rounded-full bg-gradient-to-r from-orange-400 to-primary-container relative"
                      >
                        {/* Brillo deslizante */}
                        <motion.div
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                          className="absolute inset-0 bg-white/30 skew-x-12"
                        />
                      </motion.div>
                    </div>

                    {/* Info extra */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold px-1">
                      <span>
                        {modeloUsado.includes('scout')
                          ? '🚀 Modelo Avanzado (Scout 17B)'
                          : modeloUsado.includes('70b')
                          ? '⚡ Modelo Estándar (70B)'
                          : '🔧 Motor de reglas'}
                      </span>
                      {tiempoRestante !== null && tiempoRestante > 0 && (
                        <span>~{tiempoRestante}s restantes</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {errorProceso && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">error</span>
                        {errorProceso}
                      </motion.div>
                    )}
                    <button
                      id="btn-analizar-documento"
                      onClick={handleUpload}
                      disabled={!file || noTokensForPro}
                      className={`w-full mt-8 py-5 rounded-2xl font-black text-white shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95
                        ${!file || noTokensForPro
                          ? 'bg-slate-200 dark:bg-surface-variant text-slate-400 dark:text-on-surface-variant/50 cursor-not-allowed shadow-none'
                          : 'bg-primary-container shadow-primary-container/20'}`}
                    >
                      <span className="material-symbols-outlined">auto_fix_high</span>
                      {t('editor.analyze')}
                    </button>
                  </>
                )}
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

                <div className="flex flex-col gap-3 mb-8 p-5 bg-surface-container-low rounded-2xl border border-outline-variant/30">
                  <div className="flex items-center gap-4">
                    <input type="checkbox" id="toc-toggle" checked={includeTOC} onChange={(e) => setIncludeTOC(e.target.checked)}
                      className="w-6 h-6 accent-primary-container cursor-pointer" disabled={!isPro} />
                    <label htmlFor="toc-toggle" className="text-sm font-bold text-on-surface cursor-pointer">
                      Generar Tabla de Contenidos automáticamente
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <label className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 dark:border-outline-variant/30 cursor-pointer">
                      <input
                        type="radio"
                        name="download-format"
                        value="docx"
                        checked={downloadFormat === 'docx'}
                        onChange={() => setDownloadFormat('docx')}
                        className="accent-primary-container"
                      />
                      <span className="text-sm font-bold">DOCX</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 dark:border-outline-variant/30 cursor-pointer">
                      <input
                        type="radio"
                        name="download-format"
                        value="pdf"
                        checked={downloadFormat === 'pdf'}
                        onChange={() => setDownloadFormat('pdf')}
                        className="accent-primary-container"
                      />
                      <span className="text-sm font-bold">PDF</span>
                    </label>
                  </div>

                  {!isPro && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Esta función usa el índice real con números de página y está disponible solo en DocAI Pro.
                    </span>
                  )}
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
