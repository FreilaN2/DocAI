import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

// ─── Estilos APA por categoría ────────────────────────────────────────────────
const APA_STYLES = {
  TITULO_N1:     { label: 'Título N1',      color: '#2563eb', bold: true,  italic: false, defaultAlign: 'center', indent: '0',      paddingLeft: '0' },
  TITULO_N2:     { label: 'Título N2',      color: '#4f46e5', bold: true,  italic: false, defaultAlign: 'left',   indent: '0',      paddingLeft: '0' },
  TITULO_N3:     { label: 'Título N3',      color: '#7c3aed', bold: true,  italic: false, defaultAlign: 'left',   indent: '0.5in',  paddingLeft: '0' },
  TITULO_N4:     { label: 'Título N4',      color: '#9333ea', bold: true,  italic: true,  defaultAlign: 'left',   indent: '0.5in',  paddingLeft: '0' },
  TITULO_N5:     { label: 'Título N5',      color: '#a855f7', bold: false, italic: true,  defaultAlign: 'left',   indent: '0.5in',  paddingLeft: '0' },
  PARRAFO_NORMAL:{ label: 'Párrafo',        color: '#64748b', bold: false, italic: false, defaultAlign: 'justify', indent: '0.5in',  paddingLeft: '0' },
  REFERENCIA:    { label: 'Referencia',     color: '#059669', bold: false, italic: false, defaultAlign: 'left',   indent: '0',      paddingLeft: '0.5in' },
  CITA_LARGA:    { label: 'Cita larga',     color: '#d97706', bold: false, italic: false, defaultAlign: 'left',   indent: '0',      paddingLeft: '0.5in' },
  PORTADA_IMAGEN:{ label: 'Imagen portada', color: '#0ea5e9', bold: false, italic: false, defaultAlign: 'center', indent: '0',      paddingLeft: '0' },
  PORTADA_ESPACIO:{ label: 'Espacio',       color: '#cbd5e1', bold: false, italic: false, defaultAlign: 'left',   indent: '0',      paddingLeft: '0' },
};

// Opciones seleccionables por el usuario (sin PORTADA_IMAGEN ni PORTADA_ESPACIO)
const CATEGORY_OPTIONS = [
  { id: 'PARRAFO_NORMAL',  label: 'Párrafo normal', color: '#94a3b8' },
  { id: 'TITULO_N1',       label: 'Título N1',      color: '#2563eb' },
  { id: 'TITULO_N2',       label: 'Título N2',      color: '#4f46e5' },
  { id: 'TITULO_N3',       label: 'Título N3',      color: '#7c3aed' },
  { id: 'TITULO_N4',       label: 'Título N4',      color: '#9333ea' },
  { id: 'TITULO_N5',       label: 'Título N5',      color: '#a855f7' },
  { id: 'REFERENCIA',      label: 'Referencia',     color: '#059669' },
  { id: 'CITA_LARGA',      label: 'Cita larga',     color: '#d97706' },
];

// ─── Botón de alineación pequeño ─────────────────────────────────────────────
function AlignBtn({ icon, active, onClick, title }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      title={title}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '20px', height: '20px', borderRadius: '4px', border: 'none',
        cursor: 'pointer', transition: 'all 0.1s',
        background: active ? '#2563eb' : 'rgba(255,255,255,0.85)',
        color: active ? '#fff' : '#475569',
        boxShadow: active ? '0 1px 4px rgba(37,99,235,0.4)' : '0 1px 2px rgba(0,0,0,0.08)',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '13px', lineHeight: 1 }}>{icon}</span>
    </button>
  );
}

// ─── Párrafo editable (con drag, align y category switch) ────────────────────
function EditableParagraph({
  item, fuente,
  onLabelChange, onTextChange, onAlignChange,
  uploadId,
  flatIndex, dragFrom, dragOver,
  onDragStart, onDragOver, onDragEnd,
  isPortada = false,
}) {
  const [isEditing, setIsEditing]     = useState(false);
  const [showCatMenu, setShowCatMenu] = useState(false);
  const [hovered, setHovered]         = useState(false);
  const textareaRef = useRef(null);
  const menuRef     = useRef(null);

  const style    = APA_STYLES[item.categoria] || APA_STYLES.PARRAFO_NORMAL;
  const textAlign = item.textAlign || style.defaultAlign || 'left';
  const isDragging = dragFrom === flatIndex;
  const isDragOver = dragOver === flatIndex && dragFrom !== flatIndex;
  const isCoverItem = isPortada && (item.categoria.startsWith('TITULO') || item.categoria === 'PARRAFO_NORMAL' || item.categoria.startsWith('PORTADA'));

  // Auto-resize textarea
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      textareaRef.current.focus();
    }
  }, [isEditing]);

  // Cerrar menú al click fuera
  useEffect(() => {
    if (!showCatMenu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowCatMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCatMenu]);

  const fontFamily =
    fuente === 'Times New Roman' ? '"Times New Roman", Times, serif' :
    fuente === 'Arial'           ? 'Arial, Helvetica, sans-serif'    :
    fuente === 'Calibri'         ? 'Calibri, sans-serif'             :
    fuente === 'Georgia'         ? 'Georgia, serif'                  : fuente;

  // ── Handlers de drag ──────────────────────────────────────────────────────
  const dragHandlers = {
    draggable: true,
    onDragStart: (e) => { e.stopPropagation(); onDragStart(flatIndex); },
    onDragOver:  (e) => { e.preventDefault(); e.stopPropagation(); onDragOver(flatIndex); },
    onDrop:      (e) => { e.preventDefault(); e.stopPropagation(); onDragEnd(); },
    onDragEnd:   () => onDragEnd(),
  };

  // ── Toolbar flotante (drag handle + alineación + categoría) ──────────────
  const toolbar = (
    <AnimatePresence>
      {(hovered || isEditing) && item.categoria !== 'PORTADA_ESPACIO' && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12 }}
          style={{
            position: 'absolute', top: '2px', right: '0', zIndex: 30,
            display: 'flex', alignItems: 'center', gap: '3px',
            pointerEvents: 'auto',
          }}
        >
          {/* Grip handle */}
          <div
            {...dragHandlers}
            title="Arrastrar para reordenar"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '20px', height: '20px', borderRadius: '4px',
              background: 'rgba(255,255,255,0.85)', cursor: 'grab',
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
              color: '#94a3b8', fontSize: '13px',
              userSelect: 'none',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px', lineHeight: 1 }}>drag_indicator</span>
          </div>

          {/* Separador */}
          <div style={{ width: '1px', height: '16px', background: '#e2e8f0' }} />

          {/* Alineación — solo para no-imagen */}
          {item.categoria !== 'PORTADA_IMAGEN' && (
            <>
              <AlignBtn icon="format_align_left"   active={textAlign === 'left'}    title="Alinear izquierda" onClick={() => onAlignChange(item.id, 'left')} />
              <AlignBtn icon="format_align_center" active={textAlign === 'center'}  title="Centrar"           onClick={() => onAlignChange(item.id, 'center')} />
              <AlignBtn icon="format_align_right"  active={textAlign === 'right'}   title="Alinear derecha"  onClick={() => onAlignChange(item.id, 'right')} />
              <AlignBtn icon="format_align_justify" active={textAlign === 'justify'} title="Justificar"       onClick={() => onAlignChange(item.id, 'justify')} />
              {/* Separador */}
              <div style={{ width: '1px', height: '16px', background: '#e2e8f0' }} />
            </>
          )}

          {/* Badge de categoría + dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowCatMenu(v => !v)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest text-white shadow-md transition-all hover:brightness-110 whitespace-nowrap"
              style={{ backgroundColor: style.color, lineHeight: '1.6', border: 'none', cursor: 'pointer' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '10px', lineHeight: '1' }}>label</span>
              {style.label}
              <span className="material-symbols-outlined" style={{ fontSize: '10px', lineHeight: '1', opacity: 0.8 }}>
                {showCatMenu ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            <AnimatePresence>
              {showCatMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                    zIndex: 50, background: '#fff', borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                    border: '1px solid #e2e8f0', padding: '4px 0', minWidth: '165px',
                  }}
                >
                  {CATEGORY_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { onLabelChange(item.id, opt.id); setShowCatMenu(false); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '7px 12px', fontSize: '11px', fontWeight: 700,
                        color: item.categoria === opt.id ? '#0f172a' : '#64748b',
                        background: item.categoria === opt.id ? opt.color + '15' : 'transparent',
                        border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = opt.color + '20'}
                      onMouseLeave={e => e.currentTarget.style.background = item.categoria === opt.id ? opt.color + '15' : 'transparent'}
                    >
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: opt.color, flexShrink: 0 }} />
                      {opt.label}
                      {item.categoria === opt.id && (
                        <span className="material-symbols-outlined" style={{ marginLeft: 'auto', fontSize: '14px', color: opt.color }}>check</span>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── PORTADA_ESPACIO: línea en blanco, sin interacción ───────────────────
  if (item.categoria === 'PORTADA_ESPACIO') {
    return <div style={{ lineHeight: '2', height: '1.5em' }} />;
  }

  // ── PORTADA_IMAGEN: muestra la imagen con toolbar completo ───────────────
  if (item.categoria === 'PORTADA_IMAGEN') {
    const imgUrl = uploadId && item.rel_id
      ? `${api.defaults.baseURL}/imagen/${uploadId}/${item.rel_id}`
      : null;
    return (
      <div
        className="relative group"
        {...dragHandlers}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setShowCatMenu(false); }}
        style={{
          textAlign: 'center', padding: '8px 0',
          opacity: isDragging ? 0.35 : 1,
          outline: isDragOver ? '2px dashed #2563eb' : 'none',
          borderRadius: '4px', transition: 'opacity 0.15s',
        }}
      >
        {toolbar}
        {imgUrl ? (
          <img
            src={imgUrl}
            alt="Imagen de portada"
            style={{ maxWidth: '60%', maxHeight: '160px', display: 'inline-block', objectFit: 'contain' }}
          />
        ) : (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', background: '#f0f9ff', borderRadius: '8px',
            border: '1.5px dashed #0ea5e9', color: '#0ea5e9', fontSize: '11px', fontWeight: 700,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>image</span>
            Imagen de portada
          </div>
        )}
      </div>
    );
  }

  // ── Párrafo / Título normal ───────────────────────────────────────────────
  const baseStyle = {
    fontFamily,
    fontSize: '12pt',
    lineHeight: isCoverItem ? '1.5' : '2',
    marginTop: (style.label.startsWith('Título') && !isCoverItem) ? '1rem' : '0',
    marginBottom: '0',
    textIndent: item.categoria === 'REFERENCIA' ? '0' : style.indent,
    paddingLeft: item.categoria === 'REFERENCIA' ? '0.5in' : (style.paddingLeft || '0'),
    textAlign,
    fontWeight: style.bold ? 'bold' : 'normal',
    fontStyle: style.italic ? 'italic' : 'normal',
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
      {...dragHandlers}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowCatMenu(false); }}
      style={{
        opacity: isDragging ? 0.35 : 1,
        outline: isDragOver ? '2px dashed #2563eb' : 'none',
        borderRadius: '4px', transition: 'opacity 0.15s',
      }}
    >
      {toolbar}

      {/* Fondo de hover sutil */}
      {(hovered || isEditing) && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundColor: style.color + '0d',
          outline: `1.5px dashed ${style.color}50`,
          borderRadius: '2px', pointerEvents: 'none',
        }} />
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
        <div style={{ ...baseStyle, width: '100%' }} onClick={() => setIsEditing(true)} title="Clic para editar">
          {!item.texto ? (
            <span style={{ opacity: 0.3, fontStyle: 'italic' }}>(párrafo vacío)</span>
          ) : item.texto.includes('\t') ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span>{item.texto.split('\t')[0]}</span>
              <span>{item.texto.split('\t').slice(1).join(' ')}</span>
            </div>
          ) : (
            item.texto
          )}
        </div>
      )}
    </div>
  );
}

// ─── Hoja de papel ────────────────────────────────────────────────────────────
function PaperSheet({ parrafos, edicion, fuente, onLabelChange, onTextChange, onAlignChange, onDragStart, onDragOver, onDragEnd, dragFrom, dragOver, uploadId, fullscreen = false, pageNumber = 1, isPortada = false }) {
  const fontFamily =
    fuente === 'Times New Roman' ? '"Times New Roman", Times, serif' :
    fuente === 'Arial'           ? 'Arial, Helvetica, sans-serif'    :
    fuente === 'Calibri'         ? 'Calibri, sans-serif'             :
    fuente === 'Georgia'         ? 'Georgia, serif'                  : fuente;

  return (
    <div
      style={{
        width: fullscreen ? '816px' : '8.5in',
        maxWidth: fullscreen ? 'none' : '100%',
        minHeight: fullscreen ? '1056px' : '11in',
        background: '#fff',
        boxShadow: fullscreen ? '0 8px 48px rgba(0,0,0,0.45)' : '0 4px 32px rgba(0,0,0,0.18)',
        borderRadius: '2px',
        padding: fullscreen ? '96px 100px 96px 120px' : '1in',
        paddingLeft: fullscreen ? '120px' : '1.25in',
        fontFamily, fontSize: '12pt', lineHeight: '2', color: '#000',
        position: 'relative', boxSizing: 'border-box',
      }}
    >
      {/* Número de página */}
      {!isPortada && (
        <div style={{ position: 'absolute', top: fullscreen ? '38px' : '0.4in', right: fullscreen ? '100px' : '1in', fontSize: '12pt', fontFamily, lineHeight: '1' }}>
          {pageNumber}
        </div>
      )}

      <div style={{ paddingTop: fullscreen ? '20px' : '0.2in' }}>
        {parrafos.map((item) => (
          <EditableParagraph
            key={`${item.id}-${item._flatIdx}`}
            item={item}
            edicion={edicion}
            fuente={fuente}
            onLabelChange={onLabelChange}
            onTextChange={onTextChange}
            onAlignChange={onAlignChange}
            uploadId={uploadId}
            flatIndex={item._flatIdx}
            dragFrom={dragFrom}
            dragOver={dragOver}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            isPortada={isPortada}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function DocumentPreview({ parrafos, edicion, fuente, onLabelChange, onTextChange, onAlignChange, onReorder, uploadId }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dragFrom, setDragFrom]         = useState(null);
  const [dragOver, setDragOver]         = useState(null);
  const scrollContainerRef              = useRef(null);

  // Drag handlers (flat index based)
  const handleDragStart = useCallback((idx) => setDragFrom(idx), []);
  const handleDragOver  = useCallback((idx) => { if (idx !== dragFrom) setDragOver(idx); }, [dragFrom]);
  const handleDragEnd   = useCallback(() => {
    if (dragFrom !== null && dragOver !== null && dragFrom !== dragOver) {
      onReorder(dragFrom, dragOver);
    }
    setDragFrom(null);
    setDragOver(null);
  }, [dragFrom, dragOver, onReorder]);

  // Añadir índice plano a cada item para el drag
  const parrafosWithIdx = parrafos.map((item, idx) => ({ ...item, _flatIdx: idx }));

  // Paginación
  const chunkParagraphs = (items) => {
    const MAX_WEIGHT = 3500;
    const pages = [];
    let page = [], weight = 0;
    let refStarted = false;

    // Detectar dónde termina la portada (inicio del cuerpo real)
    const INICIO_CUERPO = [
      'capitulo', 'capítulo', 'resumen', 'abstract',
      'introduccion', 'introducción', 'el problema',
      'planteamiento', 'agradecimientos', 'dedicatoria',
      'indice', 'índice', 'referencias', 'bibliograf',
    ];
    let nPortada = 0;
    for (let i = 0; i < Math.min(items.length, 30); i++) {
      const item = items[i];
      const cat = item.categoria || '';
      const txt = (item.texto || '').trim().toLowerCase();
      
      const isTitle = cat.startsWith('TITULO');
      const isShortNormal = cat === 'PARRAFO_NORMAL' && txt.length < 100;
      
      if (isTitle || isShortNormal) {
        if (INICIO_CUERPO.some(kw => txt.startsWith(kw))) {
          nPortada = i;
          break;
        }
      }
    }

    items.forEach((item, index) => {
      // Salto de página explícito al terminar la portada
      if (nPortada > 0 && index === nPortada) {
        if (page.length) { pages.push(page); page = []; weight = 0; }
      }

      let w = (item.texto ? item.texto.length : 0) + 100;
      if (item.categoria?.startsWith('TITULO')) w += 150;
      if (item.categoria === 'PORTADA_IMAGEN') w += 400;

      const isRefHdr = item.categoria?.startsWith('TITULO') && item.texto?.toLowerCase().includes('referencia');
      const isRefLine = item.categoria === 'REFERENCIA';
      if (!refStarted && (isRefHdr || isRefLine)) {
        if (page.length) { pages.push(page); page = []; weight = 0; }
        refStarted = true;
      }

      if (weight + w > MAX_WEIGHT && page.length) {
        pages.push(page); page = [item]; weight = w;
      } else {
        page.push(item); weight += w;
      }
    });

    if (page.length) pages.push(page);
    return { pages: pages.length ? pages : [[]], nPortada };
  };

  const { pages, nPortada } = chunkParagraphs(parrafosWithIdx);

  // ESC para salir del fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    if (scrollContainerRef.current) scrollContainerRef.current.focus();
    const handler = (e) => { if (e.key === 'Escape') setIsFullscreen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isFullscreen]);

  const sharedProps = {
    edicion, fuente, onLabelChange, onTextChange, onAlignChange, uploadId,
    dragFrom, dragOver,
    onDragStart: handleDragStart,
    onDragOver:  handleDragOver,
    onDragEnd:   handleDragEnd,
  };

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
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>drag_indicator</span>
            Arrastra · Clic para editar · Hover para categoría y alineación
          </p>
          <button
            onClick={() => setIsFullscreen(true)}
            title="Pantalla completa"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black text-slate-600 bg-white hover:bg-slate-100 shadow-sm transition-all hover:scale-105 active:scale-95"
            style={{ border: '1px solid #e2e8f0' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>fullscreen</span>
            Pantalla completa
          </button>
        </div>

        <div className="flex flex-col gap-6 w-full items-center pb-4">
          {pages.map((pageData, index) => (
            <PaperSheet key={index} {...sharedProps} parrafos={pageData} pageNumber={index + 1} isPortada={nPortada > 0 && index === 0} />
          ))}
        </div>
      </div>

      {/* ── Fullscreen ── */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', background: '#525659' }}
          >
            {/* Ribbon */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 16px', height: '40px', background: '#2b2b2b', flexShrink: 0, userSelect: 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#9ca3af' }}>description</span>
                <span style={{ color: '#d1d5db', fontSize: '12px', fontWeight: 600 }}>Documento APA</span>
                <span style={{ color: '#4b5563', fontSize: '10px', fontWeight: 700, background: '#1f1f1f', padding: '1px 7px', borderRadius: '4px' }}>
                  VISTA PREVIA
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#4b5563', fontSize: '11px', fontWeight: 600 }}>ESC para salir</span>
                <button
                  onClick={() => setIsFullscreen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px',
                    borderRadius: '6px', background: 'transparent', border: '1px solid #374151',
                    color: '#9ca3af', fontSize: '11px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#374151'; e.currentTarget.style.color = '#9ca3af'; }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                  Salir
                </button>
              </div>
            </div>

            {/* Área de páginas */}
            <div
              ref={scrollContainerRef}
              tabIndex={0}
              style={{
                flex: 1, overflowY: 'auto', overflowX: 'auto',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                paddingTop: '32px', paddingBottom: '64px', gap: '24px', outline: 'none',
              }}
            >
              {pages.map((pageData, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: index * 0.05, ease: 'easeOut' }}
                >
                  <PaperSheet {...sharedProps} parrafos={pageData} pageNumber={index + 1} fullscreen isPortada={nPortada > 0 && index === 0} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
