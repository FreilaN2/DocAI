import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import PlanBadge from '../components/PlanBadge';
import ParagraphCard from '../components/ParagraphCard';
import DocumentPreview from '../components/DocumentPreview';
import Footer from '../components/Footer';
import { AdBanner, AdNative, AdGlobal } from '../components/Ads';

export default function Editor() {
  const { plan } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [edicion, setEdicion] = useState("7ma");
  const [fuente, setFuente] = useState("Times New Roman");
  const [result, setResult] = useState(null);
  const [uploadId, setUploadId] = useState(null);   // ← ID del archivo original
  const [includeTOC, setIncludeTOC] = useState(true);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'document'

  const fuenteOpciones = edicion === "6ta"
    ? ["Times New Roman"]
    : ["Times New Roman", "Arial", "Calibri", "Georgia", "Lucida Sans Unicode"];

  useEffect(() => {
    if (edicion === "6ta" && fuente !== "Times New Roman") {
      setFuente("Times New Roman");
    }
  }, [edicion, fuente]);
  
  const [downloadFormat, setDownloadFormat] = useState('docx');
  const [isDragging, setIsDragging] = useState(false);
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(null);
  const [progreso, setProgreso] = useState(0);
  const [loteActual, setLoteActual] = useState(0);
  const [totalLotes, setTotalLotes] = useState(0);
  const [tiempoRestante, setTiempoRestante] = useState(null);
  const [modeloUsado, setModeloUsado] = useState('');
  const [errorProceso, setErrorProceso] = useState(null);
  const esRef = useRef(null);

  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  const isPro = plan === 'pro';

  // Spinner SVG optimizado
  const Spinner = ({ className = "w-6 h-6" }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  // ── Guardia de Ruta y Gestión de Tokens ─────────────────────────
  const fetchTokens = () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.plan === 'pro') {
          api.get('/tokens/balance').then(r => {
            setTokenBalance(r.data);
            if (!isPro && r.data.total > 0) {
              navigate('/editor/pro', { replace: true });
            }
          }).catch(() => setTokenBalance(null));
        } else {
          setTokenBalance(null);
        }
      } catch (e) { }
    }
  };

  useEffect(() => {
    fetchTokens();
    window.addEventListener('storage', fetchTokens);
    return () => window.removeEventListener('storage', fetchTokens);
  }, [isPro, navigate]);

  useEffect(() => {
    if (isPro) {
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

    const pendingResult = sessionStorage.getItem('docai_pending_result');
    if (pendingResult) {
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          if (userData.plan === 'pro') {
            sessionStorage.removeItem('docai_pending_result');
            sessionStorage.removeItem('docai_pending_format');
            sessionStorage.removeItem('docai_pending_toc');
            sessionStorage.removeItem('docai_auto_download');
            setTimeout(() => {
              toast.error(t('editor.pro_progress_discarded'), { duration: 6000, icon: '⚠️' });
            }, 500);
            return;
          }
        } catch (e) { }
      }

      setResult(JSON.parse(pendingResult));
      const savedFormat = sessionStorage.getItem('docai_pending_format');
      if (savedFormat) setDownloadFormat(savedFormat);
      const savedToc = sessionStorage.getItem('docai_pending_toc');
      if (savedToc) setIncludeTOC(savedToc === 'true');
      sessionStorage.removeItem('docai_pending_result');
      sessionStorage.removeItem('docai_pending_format');
      sessionStorage.removeItem('docai_pending_toc');

      const autoDownload = sessionStorage.getItem('docai_auto_download');
      if (autoDownload === 'true') {
        sessionStorage.removeItem('docai_auto_download');
        if (token && storedUser) {
          setTimeout(() => {
            toast.success(t('editor.login_success_download'), { icon: '🔓', duration: 5000 });
          }, 1000);
        }
      }
    }
  }, [isPro, token, storedUser, navigate]);

  // ── Detección de AdBlock ──────────────────────────────────────────
  useEffect(() => {
    if (!isPro) {
      const checkAdBlock = async () => {
        let isBlocked = false;
        
        // 1. Verificación por DOM (elemento cebo)
        const adTest = document.createElement('div');
        adTest.innerHTML = '&nbsp;';
        // Clases comúnmente bloqueadas por AdBlockers
        adTest.className = 'adsbox ad-placement doubleclick ad-placeholder ad-banner';
        adTest.style.position = 'absolute';
        adTest.style.top = '-1000px';
        document.body.appendChild(adTest);
        
        setTimeout(() => {
          if (adTest.offsetHeight === 0 || adTest.style.display === 'none') {
             isBlocked = true;
          }
          if (isBlocked) setAdBlockDetected(true);
          adTest.remove();
        }, 500);

        // 2. Verificación por red (ping rápido a red genérica bloqueada universalmente)
        try {
          await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-store'
          });
        } catch (e) {
          setAdBlockDetected(true);
        }
      };
      
      // Esperar un instante para que el navegador resuelva si bloquea recursos
      setTimeout(checkAdBlock, 1000);
    }
  }, [isPro]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.toLowerCase().endsWith('.docx')) {
      setFile(selectedFile);
      setResult(null);
    } else {
      alert(t('editor.invalid_docx_alert'));
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.toLowerCase().endsWith('.docx')) {
      setFile(droppedFile);
      setResult(null);
    } else {
      alert(t('editor.drop_invalid_docx_alert'));
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
      const formData = new FormData();
      const safeName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const safeFile = new File([file], safeName, { type: file.type });
      formData.append('file', safeFile);
      const uploadResp = await api.post('/upload-documento/', formData);
      const { upload_id } = uploadResp.data;
      setUploadId(upload_id);  // ← guardar para enviarlo al generar final

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
          if (isPro && token) {
            api.get('/tokens/balance').then(r => setTokenBalance(r.data)).catch(() => { });
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

  const handleTextChange = (id, newText) => {
    const updatedDetalles = result.detalles.map(item =>
      item.id === id ? { ...item, texto: newText } : item
    );
    setResult({ ...result, detalles: updatedDetalles });
  };

  const handleReorder = (fromIdx, toIdx) => {
    setResult(prev => {
      if (!prev?.detalles) return prev;
      const detalles = [...prev.detalles];
      const [moved] = detalles.splice(fromIdx, 1);
      detalles.splice(toIdx, 0, moved);
      return { ...prev, detalles };
    });
  };

  const handleAlignChange = (id, align) => {
    setResult(prev => ({
      ...prev,
      detalles: prev.detalles.map(d => d.id === id ? { ...d, textAlign: align } : d),
    }));
  };

  const handleConfirmarYDescargar = async () => {
    const currentToken = localStorage.getItem('token');

    if (!currentToken) {
      sessionStorage.setItem('docai_pending_result', JSON.stringify(result));
      sessionStorage.setItem('docai_pending_filename', file ? file.name : '');
      sessionStorage.setItem('docai_pending_format', downloadFormat);
      sessionStorage.setItem('docai_pending_toc', includeTOC.toString());
      sessionStorage.setItem('docai_auto_download', 'true');
      toast(t('editor.login_to_download'), { icon: '🔒', duration: 5000 });
      navigate('/register');
      return;
    }

    setLoading(true);
    try {
      const savedFilename = sessionStorage.getItem('docai_pending_filename');

      // Detectar cuántos párrafos son portada (antes del primer título del cuerpo)
      const INICIO_CUERPO = [
        'capitulo', 'capítulo', 'resumen', 'abstract',
        'introduccion', 'introducción', 'el problema',
        'planteamiento', 'agradecimientos', 'dedicatoria',
        'indice', 'índice', 'referencias', 'bibliograf',
      ];
      let nPortada = 0;
      if (result?.detalles) {
        for (let idx = 0; idx < Math.min(result.detalles.length, 30); idx++) {
          const item = result.detalles[idx];
          const cat = item.categoria || '';
          const txt = (item.texto || '').trim().toLowerCase();
          
          const isTitle = cat.startsWith('TITULO');
          const isShortNormal = cat === 'PARRAFO_NORMAL' && txt.length < 100;
          
          if (isTitle || isShortNormal) {
            if (INICIO_CUERPO.some(kw => txt.startsWith(kw))) {
              nPortada = idx;
              break;
            }
          }
        }
      }

      const payload = {
        edicion, fuente,
        filename: file ? file.name : (savedFilename || 'documento_docai.docx'),
        plan,
        parrafos: result.detalles.map(d => ({ texto: d.texto, categoria: d.categoria, textAlign: d.textAlign || null, id: d.id })),
        incluir_indice: isPro ? includeTOC : false,
        formato: downloadFormat,
        upload_id: uploadId || null,
        n_portada: nPortada,
      };
      const response = await api.post('/generar-final/', payload);
      window.location.href = `${api.defaults.baseURL}/descargar/${response.data.file_id}`;
    } catch (error) {
      alert(t('editor.generate_error'));
    } finally {
      setLoading(false);
    }
  };

  const TOKEN_MAX_PRO = 500;
  const tokenPercent = tokenBalance
    ? Math.round(((tokenBalance.monthly_tokens + tokenBalance.extra_tokens) / TOKEN_MAX_PRO) * 100)
    : 0;
  const hasTokens = tokenBalance && (tokenBalance.monthly_tokens + tokenBalance.extra_tokens) > 0;
  const noTokensForPro = isPro && tokenBalance !== null && !hasTokens;

  return (
    <div className="bg-background min-h-screen text-on-background relative overflow-x-hidden">
      <Navbar />
      {!isPro && <AdGlobal />}

      {/* Skyscraper Izquierdo */}
      {!isPro && (
        <div className="hidden xl:block fixed left-4 top-[60%] -translate-y-1/2 z-0 opacity-80 hover:opacity-100 transition-opacity">
          <AdBanner optionsKey="c15e9b8930c739532302d4d56850443e" width={160} height={600} />
        </div>
      )}
      
      {/* Skyscraper Derecho */}
      {!isPro && (
        <div className="hidden xl:block fixed right-4 top-[60%] -translate-y-1/2 z-0 opacity-80 hover:opacity-100 transition-opacity">
          <AdBanner optionsKey="24a6e6653b1b0309553375faf4aeb1e3" width={160} height={300} />
        </div>
      )}

      {/* Sticky Mobile Banner */}
      {!isPro && (
        <div className="block sm:hidden fixed bottom-0 left-0 w-full z-50 bg-background/90 backdrop-blur border-t border-outline-variant/30 pt-2 pb-[env(safe-area-inset-bottom)]">
          <AdBanner optionsKey="fcb577830dd336a4f57c44ec27eb9e47" width={320} height={50} />
        </div>
      )}

      {/* Ambient Background - ESTÁTICO */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div className="absolute top-[-5%] right-[-5%] w-[30%] h-[30%] bg-surface-container-high rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-surface-variant rounded-full blur-[100px] opacity-30" />
      </div>

      <main className="pt-32 pb-24 px-gutter max-w-4xl mx-auto flex flex-col gap-8 relative z-10">
        {!isPro && <div className="hidden md:flex w-full justify-center mb-[-1rem]"><AdBanner optionsKey="7f2d1fbdf33a701cb4736f739bc34dd3" width={728} height={90} /></div>}
        
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="flex flex-col sm:flex-row items-center justify-between sm:justify-end gap-4 mb-4 w-full">
          {!isPro && (
            <a href="https://www.effectivecpmnetwork.com/xyfpimwm?key=9076051f47ffea6fc9c501efa2c56965" target="_blank" rel="noopener noreferrer" className="text-xs font-black px-4 py-2 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-primary-container hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors flex items-center gap-2 no-underline w-full sm:w-auto justify-center sm:mr-auto">
              <span className="material-symbols-outlined text-sm">favorite</span> Apoyar DocAI
            </a>
          )}
          <PlanBadge plan={plan} />
        </motion.div>

        {/* Token Balance Bar */}
        {isPro && tokenBalance && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
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
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
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
            <motion.section key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="w-full">
              <div className="text-center mb-10">
                <h1 className="text-4xl font-black tracking-tight text-on-surface mb-2">{t('editor.upload_title')}</h1>
                <p className="text-on-surface-variant">{t('editor.upload_subtitle')}</p>
              </div>

              <div className="bg-white/70 dark:bg-[#1a1512]/70 backdrop-blur-[20px] rounded-card border border-slate-200 dark:border-outline-variant/30 p-8 shadow-sm">
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('editor.style')}</label>
                    <select value={edicion} onChange={(e) => setEdicion(e.target.value)}
                      className="w-full p-4 bg-white dark:bg-surface border border-slate-200 dark:border-outline-variant/30 rounded-2xl focus:ring-4 focus:ring-orange-100 dark:focus:ring-primary/20 outline-none text-sm font-bold transition-all cursor-pointer">
                      <option value="6ta">{t('editor.apa_6th')}</option>
                      <option value="7ma">{t('editor.apa_7th')}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('editor.font')}</label>
                    <select value={fuente} onChange={(e) => setFuente(e.target.value)}
                      className="w-full p-4 bg-white dark:bg-surface border border-slate-200 dark:border-outline-variant/30 rounded-2xl focus:ring-4 focus:ring-orange-100 dark:focus:ring-primary/20 outline-none text-sm font-bold transition-all cursor-pointer"
                      disabled={edicion === "6ta"}>
                      {fuenteOpciones.map((fontOption) => (
                        <option key={fontOption} value={fontOption}>{fontOption}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('editor.format')}</label>
                    <div className="p-4 bg-slate-50 dark:bg-surface-variant border border-slate-200 dark:border-outline-variant/30 rounded-2xl text-sm font-bold text-slate-500 dark:text-on-surface-variant flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">description</span> {t('editor.word_docx')}
                    </div>
                  </div>
                </div>

                {!isPro && <div className="hidden sm:flex justify-center w-full mb-8"><AdBanner optionsKey="a9a5d00a37e85b3cc14bf03988c2fd2b" width={468} height={60} /></div>}

                {/* Dropzone o Advertencia de AdBlock */}
                {adBlockDetected && !isPro ? (
                  <div className="relative border-2 border-red-400 dark:border-red-500/50 rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center gap-4 bg-red-50/50 dark:bg-red-900/10 text-center transition-all duration-300 shadow-inner">
                    <span className="material-symbols-outlined text-6xl text-red-500 drop-shadow-sm">gpp_maybe</span>
                    <h3 className="text-2xl font-black text-red-700 dark:text-red-400">{t('editor.adblock_title')}</h3>
                    <p className="text-sm font-bold text-red-600/80 dark:text-red-300/80 max-w-md">
                      {t('editor.adblock_desc')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
                      <button onClick={() => window.location.reload()} className="w-full sm:w-auto px-6 py-3 rounded-xl font-black bg-white text-red-600 border border-red-200 shadow-sm hover:bg-red-50 transition-colors">
                        {t('editor.adblock_btn_disabled')}
                      </button>
                      <Link to="/upgrade" className="w-full sm:w-auto px-6 py-3 rounded-xl font-black bg-red-600 text-white shadow-md hover:bg-red-700 hover:shadow-lg transition-all no-underline flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-sm">workspace_premium</span> {t('editor.adblock_btn_pro')}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center gap-4 bg-surface-bright/50 transition-all duration-300 cursor-pointer hover:scale-[1.01] active:scale-[0.99]
                      ${isDragging ? 'border-primary-container bg-orange-100/40 scale-[1.02] shadow-lg shadow-orange-100' : 'border-outline-variant'}
                      ${file ? 'border-primary-container bg-orange-50/30' : 'hover:border-primary-container hover:bg-surface-container-low'}`}
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
                  </label>
                )}

                {/* Barra de progreso */}
                {loading ? (
                  <div className="mt-8 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-on-surface-variant px-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse inline-block" />
                        {totalLotes > 0 ? `Lote ${loteActual} de ${totalLotes}` : 'Preparando análisis...'}
                      </span>
                      <span className="text-primary-container font-black">{progreso}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-surface-variant rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-orange-400 to-primary-container relative transition-all duration-500 ease-out"
                        style={{ width: `${progreso}%` }}
                      >
                        <div className="absolute inset-0 bg-white/30 skew-x-12 animate-shimmer" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold px-1">
                      <span>
                        {modeloUsado.includes('scout') ? '🚀 Modelo Avanzado' : modeloUsado.includes('70b') ? '⚡ Modelo Estándar' : '🔧 Motor de reglas'}
                      </span>
                      {tiempoRestante !== null && tiempoRestante > 0 && <span>~{tiempoRestante}s restantes</span>}
                    </div>
                  </div>
                ) : (
                  <>
                    {errorProceso && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">error</span>
                        {errorProceso}
                      </motion.div>
                    )}
                    <button
                      onClick={handleUpload}
                      disabled={!file || noTokensForPro || adBlockDetected}
                      className={`w-full mt-8 py-5 rounded-2xl font-black text-white shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95
                        ${!file || noTokensForPro || adBlockDetected
                          ? 'bg-slate-200 dark:bg-surface-variant text-slate-400 dark:text-on-surface-variant/50 cursor-not-allowed shadow-none'
                          : 'bg-primary-container shadow-primary-container/20 hover:opacity-90'}`}
                    >
                      <span className="material-symbols-outlined">auto_fix_high</span>
                      {t('editor.analyze')}
                    </button>
                  </>
                )}
              </div>
            </motion.section>
          ) : (
            <motion.section key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full">
              <div className="bg-surface/80 dark:bg-surface/90 backdrop-blur-xl rounded-card border border-outline-variant/10 p-8 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-on-surface">{t('editor.correction_title')}</h2>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t('editor.correction_subtitle')}</p>
                  </div>

                  {/* Toggle de vista — solo Pro */}
                  {isPro && (
                    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-surface-variant rounded-2xl self-start md:self-auto shrink-0">
                      <button
                        onClick={() => setViewMode('cards')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 ${
                          viewMode === 'cards'
                            ? 'bg-white dark:bg-surface shadow-sm text-on-surface'
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>dashboard</span>
                        Tarjetas
                      </button>
                      <button
                        onClick={() => setViewMode('document')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 ${
                          viewMode === 'document'
                            ? 'bg-white dark:bg-surface shadow-sm text-on-surface'
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>article</span>
                        Documento
                      </button>
                    </div>
                  )}
                </div>

                {/* Vista tarjetas */}
                <AnimatePresence mode="wait">
                {viewMode === 'cards' ? (
                  <motion.div
                    key="cards"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 mb-8">
                      {result.detalles?.map((item) => (
                        <div key={item.id}>
                          <ParagraphCard item={item} onLabelChange={handleLabelChange} />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  /* Vista documento */
                  <motion.div
                    key="document"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="mb-8 overflow-x-auto"
                  >
                    <DocumentPreview
                      parrafos={result.detalles || []}
                      edicion={edicion}
                      fuente={fuente}
                      onLabelChange={handleLabelChange}
                      onTextChange={handleTextChange}
                      onAlignChange={handleAlignChange}
                      onReorder={handleReorder}
                      uploadId={uploadId}
                    />
                  </motion.div>
                )}
                </AnimatePresence>

                {!isPro && <div className="flex justify-center w-full mb-8"><AdBanner optionsKey="2711704c965197e3293a4588dedc1480" width={300} height={250} /></div>}

                {/* Opciones de descarga */}
                <div className={`flex flex-col gap-3 mb-8 p-5 rounded-2xl border transition-all ${isPro
                    ? 'bg-white/50 dark:bg-[#1a1512]/50 border-slate-200 dark:border-outline-variant/30'
                    : 'bg-white/30 dark:bg-[#1a1512]/50 border-slate-200/60 dark:border-outline-variant/20'}`}>
                  <div className={`flex items-center gap-4 ${!isPro ? 'opacity-50' : ''}`}>
                    <input type="checkbox" id="toc-toggle" checked={includeTOC} onChange={(e) => setIncludeTOC(e.target.checked)}
                      className="w-6 h-6 accent-primary-container" disabled={!isPro}
                      style={{ cursor: isPro ? 'pointer' : 'not-allowed' }} />
                    <label htmlFor="toc-toggle" className={`text-sm font-bold ${isPro ? 'text-on-surface cursor-pointer' : 'text-on-surface-variant cursor-not-allowed'}`}>
                      {t('editor.toc_label')}
                    </label>
                    {!isPro && (
                      <span className="ml-auto text-[9px] font-black bg-primary-container/15 text-primary-container border border-primary-container/20 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">lock</span> Pro
                      </span>
                    )}
                  </div>

                  <div className={`grid grid-cols-2 gap-3 pt-2 ${!isPro ? 'opacity-60' : ''}`}>
                    <label className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 dark:border-outline-variant/30 cursor-pointer">
                      <input type="radio" name="download-format" value="docx" checked={downloadFormat === 'docx'}
                        onChange={() => setDownloadFormat('docx')} className="accent-primary-container" />
                      <span className="text-sm font-bold">{t('editor.docx')}</span>
                    </label>
                    <label className={`flex items-center gap-2 p-3 rounded-2xl border transition-colors ${isPro
                        ? 'border-slate-200 dark:border-outline-variant/30 cursor-pointer'
                        : 'border-slate-200 dark:border-outline-variant/20 cursor-not-allowed'}`}>
                      <input type="radio" name="download-format" value="pdf" checked={downloadFormat === 'pdf'}
                        onChange={() => isPro && setDownloadFormat('pdf')} disabled={!isPro} className="accent-primary-container" />
                      <span className="text-sm font-bold">PDF</span>
                      {!isPro && (
                        <span className="ml-auto text-[9px] font-black bg-primary-container/15 text-primary-container border border-primary-container/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Pro</span>
                      )}
                    </label>
                  </div>

                  {!isPro && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="material-symbols-outlined text-sm text-primary-container">workspace_premium</span>
                      <span className="text-xs text-on-surface-variant">
                        {t('editor.pro_features_hint')}{' '}
                        <a href="/upgrade" className="text-primary-container font-bold hover:underline">{t('editor.upgrade_link')}</a>.
                      </span>
                    </div>
                  )}
                </div>

                {/* Botón descargar - CSS en vez de motion */}
                <button onClick={handleConfirmarYDescargar} disabled={loading}
                  className="w-full py-6 bg-primary-container text-white rounded-3xl font-black text-lg shadow-xl shadow-orange-200 hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <Spinner />
                  ) : (
                    <><span className="material-symbols-outlined">download</span> {t('editor.confirm')}</>
                  )}
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* CSS para animación shimmer */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s linear infinite;
        }
      `}</style>
      
      {!isPro && <div className="max-w-4xl mx-auto px-gutter mb-12"><AdNative /></div>}

      <Footer />
    </div>
  );
}