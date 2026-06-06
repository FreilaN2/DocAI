import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Mapa de estilos APA por categoría ───────────────────────────────────────
const APA_STYLES = {
  TITULO_N1: {
    tag: 'h1',
    className: 'text-center font-bold',
    fontSize: '1rem',
    marginTop: '1.5rem',
    marginBottom: '0',
    textIndent: '0',
    label: 'Título N1',
    color: '#2563eb',
  },
  TITULO_N2: {
    tag: 'h2',
    className: 'text-left font-bold',
    fontSize: '1rem',
    marginTop: '1.25rem',
    marginBottom: '0',
    textIndent: '0',
    label: 'Título N2',
    color: '#4f46e5',
  },
  TITULO_N3: {
    tag: 'h3',
    className: 'text-left font-bold',
    fontSize: '1rem',
    marginTop: '1rem',
    marginBottom: '0',
    textIndent: '0.5in',
    label: 'Título N3',
    color: '#7c3aed',
  },
  TITULO_N4: {
    tag: 'h4',
    className: 'text-left font-bold italic',
    fontSize: '1rem',
    marginTop: '1rem',
    marginBottom: '0',
    textIndent: '0.5in',
    label: 'Título N4',
    color: '#9333ea',
  },
  TITULO_N5: {
    tag: 'h5',
    className: 'text-left italic',
    fontSize: '1rem',
    marginTop: '1rem',
    marginBottom: '0',
    textIndent: '0.5in',
    label: 'Título N5',
    color: '#a855f7',
  },
  PARRAFO_NORMAL: {
    tag: 'p',
    className: '',
    fontSize: '1rem',
    marginTop: '0',
    marginBottom: '0',
    textIndent: '0.5in',
    label: 'Párrafo',
    color: '#64748b',
  },
  REFERENCIA: {
    tag: 'p',
    className: '',
    fontSize: '1rem',
    marginTop: '0',
    marginBottom: '0',
    textIndent: '0',
    paddingLeft: '0.5in',
    label: 'Referencia',
    color: '#059669',
  },
  CITA_LARGA: {
    tag: 'blockquote',
    className: '',
    fontSize: '1rem',
    marginTop: '0',
    marginBottom: '0',
    textIndent: '0',
    paddingLeft: '0.5in',
    label: 'Cita larga',
    color: '#d97706',
  },
};

const CATEGORY_OPTIONS = [
  { id: 'PARRAFO_NORMAL', label: 'Párrafo normal', color: '#94a3b8' },
  { id: 'TITULO_N1',      label: 'Título N1',      color: '#2563eb' },
  { id: 'TITULO_N2',      label: 'Título N2',      color: '#4f46e5' },
  { id: 'TITULO_N3',      label: 'Título N3',      color: '#7c3aed' },
  { id: 'TITULO_N4',      label: 'Título N4',      color: '#9333ea' },
  { id: 'TITULO_N5',      label: 'Título N5',      color: '#a855f7' },
  { id: 'REFERENCIA',     label: 'Referencia',     color: '#059669' },
  { id: 'CITA_LARGA',     label: 'Cita larga',     color: '#d97706' },
];

// ─── Componente de párrafo editable ──────────────────────────────────────────
function EditableParagraph({ item, edicion, fuente, onLabelChange, onTextChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showCatMenu, setShowCatMenu] = useState(false);
  const [hovered, setHovered] = useState(false);
  const textareaRef = useRef(null);
  const menuRef = useRef(null);
  const style = APA_STYLES[item.categoria] || APA_STYLES.PARRAFO_NORMAL;

  // Ajustar altura del textarea al contenido
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      textareaRef.current.focus();
    }
  }, [isEditing]);

  // Cerrar menú al clic fuera
  useEffect(() => {
    if (!showCatMenu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowCatMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCatMenu]);

  const fontFamily = fuente === 'Times New Roman'
    ? '"Times New Roman", Times, serif'
    : fuente === 'Arial'
    ? 'Arial, Helvetica, sans-serif'
    : fuente === 'Calibri'
    ? 'Calibri, sans-serif'
    : fuente === 'Georgia'
    ? 'Georgia, serif'
    : fuente;

  const baseStyle = {
    fontFamily,
    fontSize: '12pt',
    lineHeight: '2',
    marginTop: style.marginTop,
    marginBottom: style.marginBottom,
    textIndent: item.categoria === 'REFERENCIA' ? '0' : style.textIndent,
    paddingLeft: item.categoria === 'REFERENCIA' ? '0.5in' : (style.paddingLeft || '0'),
    textAlign: item.categoria === 'TITULO_N1' ? 'center' : 'left',
    fontWeight: ['TITULO_N1', 'TITULO_N2', 'TITULO_N3', 'TITULO_N4'].includes(item.categoria) ? 'bold' : 'normal',
    fontStyle: ['TITULO_N4', 'TITULO_N5'].includes(item.categoria) ? 'italic' : 'normal',
    color: '#000',
    width: '100%',
    cursor: 'text',
    outline: 'none',
    border: 'none',
    background: 'transparent',
    display: 'block',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
  };

  return (
    <div
      className="relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowCatMenu(false); }}
    >
      {/* Badge de categoría — esquina superior derecha, dentro de la hoja */}
      <AnimatePresence>
        {(hovered || isEditing) && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.13 }}
            style={{ position: 'absolute', top: '2px', right: '0', zIndex: 30 }}
          >
            {/* Badge */}
            <button
              onClick={() => setShowCatMenu(v => !v)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest text-white shadow-md transition-all hover:brightness-110 whitespace-nowrap"
              style={{ backgroundColor: style.color, lineHeight: '1.6' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '10px', lineHeight: '1' }}>label</span>
              {style.label}
              <span className="material-symbols-outlined" style={{ fontSize: '10px', lineHeight: '1', opacity: 0.8 }}>
                {showCatMenu ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {/* Dropdown — se abre hacia abajo-izquierda para no salirse de la hoja */}
            <AnimatePresence>
              {showCatMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '4px',
                    zIndex: 50,
                    background: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                    border: '1px solid #e2e8f0',
                    padding: '4px 0',
                    minWidth: '160px',
                  }}
                >
                  {CATEGORY_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        onLabelChange(item.id, opt.id);
                        setShowCatMenu(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '7px 12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: item.categoria === opt.id ? '#0f172a' : '#64748b',
                        background: item.categoria === opt.id ? opt.color + '15' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = opt.color + '20'}
                      onMouseLeave={e => e.currentTarget.style.background = item.categoria === opt.id ? opt.color + '15' : 'transparent'}
                    >
                      <span
                        style={{
                          width: '10px', height: '10px', borderRadius: '50%',
                          background: opt.color, flexShrink: 0,
                        }}
                      />
                      {opt.label}
                      {item.categoria === opt.id && (
                        <span className="material-symbols-outlined" style={{ marginLeft: 'auto', fontSize: '14px', color: opt.color }}>check</span>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fondo de hover sutil */}
      {(hovered || isEditing) && (
        <div
          style={{
            position: 'absolute', inset: 0,
            backgroundColor: style.color + '0d',
            outline: `1.5px dashed ${style.color}50`,
            borderRadius: '2px',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Contenido editable */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={item.texto}
          onChange={(e) => {
            onTextChange(item.id, e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          onBlur={() => setIsEditing(false)}
          style={{ ...baseStyle, resize: 'none', overflow: 'hidden', padding: '0' }}
          spellCheck={true}
        />
      ) : (
        <div
          style={baseStyle}
          onClick={() => setIsEditing(true)}
          title="Clic para editar"
        >
          {item.texto || <span style={{ opacity: 0.3, fontStyle: 'italic' }}>(párrafo vacío)</span>}
        </div>
      )}
    </div>
  );
}


// ─── Hoja de papel (reutilizable en normal y fullscreen) ──────────────────────
function PaperSheet({ parrafos, edicion, fuente, onLabelChange, onTextChange, fullscreen = false }) {
  const fontFamily = fuente === 'Times New Roman'
    ? '"Times New Roman", Times, serif'
    : fuente === 'Arial'
    ? 'Arial, Helvetica, sans-serif'
    : fuente === 'Calibri'
    ? 'Calibri, sans-serif'
    : fuente === 'Georgia'
    ? 'Georgia, serif'
    : fuente;

  return (
    <div
      style={{
        // En fullscreen: ancho fijo (8.5in @ 96dpi = 816px), sin maxWidth
        // En vista normal: maxWidth 100% para que no desborde
        width: fullscreen ? '816px' : '8.5in',
        maxWidth: fullscreen ? 'none' : '100%',
        minHeight: fullscreen ? '1056px' : '11in', // 11in @ 96dpi = 1056px
        background: '#fff',
        boxShadow: fullscreen
          ? '0 8px 48px rgba(0,0,0,0.45)'
          : '0 4px 32px rgba(0,0,0,0.18)',
        borderRadius: '2px',
        padding: fullscreen ? '96px 100px 96px 120px' : '1in',
        paddingLeft: fullscreen ? '120px' : '1.25in',
        fontFamily,
        fontSize: '12pt',
        lineHeight: '2',
        color: '#000',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Número de página simulado */}
      <div style={{
        position: 'absolute',
        top: fullscreen ? '38px' : '0.4in',
        right: fullscreen ? '100px' : '1in',
        fontSize: '12pt', fontFamily, lineHeight: '1',
      }}>
        1
      </div>

      {/* Párrafos */}
      <div style={{ paddingTop: fullscreen ? '20px' : '0.2in' }}>
        {parrafos.map((item) => (
          <EditableParagraph
            key={item.id}
            item={item}
            edicion={edicion}
            fuente={fuente}
            onLabelChange={onLabelChange}
            onTextChange={onTextChange}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Componente principal de vista previa ─────────────────────────────
export default function DocumentPreview({ parrafos, edicion, fuente, onLabelChange, onTextChange }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scrollContainerRef = useRef(null);

  // Cerrar con Escape + enfocar el scroll container al abrir
  useEffect(() => {
    if (!isFullscreen) return;

    // Foco al contenedor para que la rueda del mouse funcione de inmediato
    if (scrollContainerRef.current) {
      scrollContainerRef.current.focus();
    }

    const handler = (e) => { if (e.key === 'Escape') setIsFullscreen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isFullscreen]);

  const sharedProps = { parrafos, edicion, fuente, onLabelChange, onTextChange };

  return (
    <>
      {/* ── Vista normal ── */}
      <div
        className="flex flex-col items-center w-full"
        style={{ background: '#e8e8e8', borderRadius: '12px', padding: '24px 0 16px', minHeight: '600px' }}
      >
        {/* Barra de herramientas */}
        <div className="flex items-center justify-between w-full px-4 mb-4" style={{ maxWidth: '8.5in' }}>
          <p className="text-xs text-slate-500 font-bold flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
            Clic para editar · Hover para cambiar categoría
          </p>
          <button
            onClick={() => setIsFullscreen(true)}
            title="Pantalla completa (F)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black text-slate-600 bg-white hover:bg-slate-100 shadow-sm transition-all hover:scale-105 active:scale-95"
            style={{ border: '1px solid #e2e8f0' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>fullscreen</span>
            Pantalla completa
          </button>
        </div>

        <PaperSheet {...sharedProps} />
      </div>

      {/* ── Fullscreen — estilo Word Print Layout ── */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              background: '#525659', // Gris clásico de Word
            }}
          >
            {/* ── Ribbon mínimo (pegado arriba, no intrusivo) ── */}
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 16px',
                height: '40px',
                background: '#2b2b2b',
                flexShrink: 0,
                userSelect: 'none',
              }}
            >
              {/* Izquierda: ícono + nombre */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#9ca3af' }}>description</span>
                <span style={{ color: '#d1d5db', fontSize: '12px', fontWeight: 600, letterSpacing: '0.01em' }}>
                  Documento APA
                </span>
                <span style={{
                  color: '#4b5563', fontSize: '10px', fontWeight: 700,
                  background: '#1f1f1f', padding: '1px 7px',
                  borderRadius: '4px', letterSpacing: '0.05em',
                }}>
                  VISTA PREVIA
                </span>
              </div>

              {/* Derecha: hint ESC + botón salir */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#4b5563', fontSize: '11px', fontWeight: 600 }}>ESC para salir</span>
                <button
                  onClick={() => setIsFullscreen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '4px 10px', borderRadius: '6px',
                    background: 'transparent',
                    border: '1px solid #374151',
                    color: '#9ca3af', fontSize: '11px', fontWeight: 700,
                    cursor: 'pointer', transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#ef4444';
                    e.currentTarget.style.borderColor = '#ef4444';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = '#374151';
                    e.currentTarget.style.color = '#9ca3af';
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                  Salir
                </button>
              </div>
            </div>

            {/* ── Área de páginas (scroll vertical, como Word) ── */}
            <div
              ref={scrollContainerRef}
              tabIndex={0}
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: '32px',
                paddingBottom: '64px',
                gap: '24px',
                outline: 'none', // ocultar el anillo de foco del teclado
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <PaperSheet {...sharedProps} fullscreen />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

