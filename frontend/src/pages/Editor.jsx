import React, { useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import PlanBadge from '../components/PlanBadge';
import ParagraphCard from '../components/ParagraphCard';

export default function Editor() {
  const { plan } = useParams();
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [edicion, setEdicion] = useState("7ma");
  const [result, setResult] = useState(null);
  const [includeTOC, setIncludeTOC] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.docx')) {
      setFile(selectedFile);
      setResult(null);
    } else {
      alert("Por favor, selecciona un archivo .docx válido.");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

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

    try {
      const response = await axios.post('http://127.0.0.1:8000/procesar-apa/', formData);
      setResult(response.data);
    } catch (error) {
      alert("Error en la comunicación con el servidor.");
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
        edicion: edicion,
        filename: file.name,
        plan: plan,
        parrafos: result.detalles.map(d => ({
          texto: d.texto,
          categoria: d.categoria
        })),
        incluir_indice: includeTOC
      };

      const response = await axios.post('http://127.0.0.1:8000/generar-final/', payload);
      window.location.href = `http://127.0.0.1:8000/descargar/${response.data.file_id}`;
    } catch (error) {
      alert("Error al generar el documento final.");
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
          className="absolute top-[-5%] right-[-5%] w-[30%] h-[30%] bg-surface-container-high rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-surface-variant rounded-full blur-[100px]"
        />
      </div>

      <main className="pt-32 pb-24 px-gutter max-w-4xl mx-auto flex flex-col gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between"
        >
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-primary-container transition-colors no-underline">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            {t('editor.back')}
          </Link>
          <PlanBadge plan={plan} />
        </motion.div>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.section 
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <div className="text-center mb-10">
                <h1 className="text-4xl font-black tracking-tight text-on-surface mb-2">{t('editor.upload_title')}</h1>
                <p className="text-on-surface-variant">{t('editor.upload_subtitle')}</p>
              </div>

              <div className="bg-white/70 backdrop-blur-[20px] rounded-card border border-slate-200 p-8 shadow-sm relative overflow-hidden">
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('editor.style')}</label>
                    <select
                      value={edicion}
                      onChange={(e) => setEdicion(e.target.value)}
                      className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-100 outline-none text-sm font-bold transition-all cursor-pointer"
                    >
                      <option value="6ta">Normas APA 6ta Edición</option>
                      <option value="7ma">Normas APA 7ma Edición</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Formato</label>
                     <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500 flex items-center gap-2">
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
                    {isDragging ? "¡Suéltalo aquí!" : (file ? file.name : t('editor.select_file'))}
                  </h3>
                  {!file && !isDragging && <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">O arrastra tu archivo aquí</p>}
                </motion.label>

                <button
                  onClick={handleUpload}
                  disabled={loading || !file}
                  className={`w-full mt-8 py-5 rounded-2xl font-black text-white shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95 ${loading || !file ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-primary-container shadow-primary-container/20'}`}
                >
                  {loading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                  ) : (
                    <><span className="material-symbols-outlined">auto_fix_high</span> {t('editor.analyze')}</>
                  )}
                </button>
              </div>
            </motion.section>
          ) : (
            <motion.section 
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-card border border-slate-200 p-8 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">{t('editor.correction_title')}</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('editor.correction_subtitle')}</p>
                  </div>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 mb-8 custom-scrollbar">
                  {result.detalles?.map((item, index) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ParagraphCard item={item} onLabelChange={handleLabelChange} />
                    </motion.div>
                  ))}
                </div>

                <div className="flex items-center gap-4 mb-8 p-5 bg-surface-container-low rounded-2xl border border-outline-variant/30">
                  <input 
                    type="checkbox" 
                    id="toc-toggle"
                    checked={includeTOC}
                    onChange={(e) => setIncludeTOC(e.target.checked)}
                    className="w-6 h-6 accent-primary-container cursor-pointer"
                  />
                  <label htmlFor="toc-toggle" className="text-sm font-bold text-on-surface cursor-pointer">
                    Generar Tabla de Contenidos (Índice) automáticamente
                  </label>
                </div>

                <button
                  onClick={handleConfirmarYDescargar}
                  disabled={loading}
                  className="w-full py-6 bg-primary-container text-white rounded-3xl font-black text-lg shadow-xl shadow-orange-200 hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full" />
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
