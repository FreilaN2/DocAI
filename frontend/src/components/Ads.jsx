import React, { useEffect, useRef } from 'react';

// Banner estándar (soporta múltiples tamaños inyectando el script dentro de un iframe)
export function AdBanner({ optionsKey, width, height }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <style>body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: transparent; }</style>
        </head>
        <body>
          <script type="text/javascript">
            atOptions = {
              'key' : '${optionsKey}',
              'format' : 'iframe',
              'height' : ${height},
              'width' : ${width},
              'params' : {}
            };
          </script>
          <script type="text/javascript" src="https://www.highperformanceformat.com/${optionsKey}/invoke.js"></script>
        </body>
      </html>
    `);
    doc.close();
  }, [optionsKey, width, height]);

  return (
    <div className="flex justify-center items-center w-full my-4 overflow-hidden rounded-md opacity-90 hover:opacity-100 transition-opacity">
      <iframe
        ref={iframeRef}
        width={width}
        height={height}
        style={{ border: 'none', overflow: 'hidden', width: `${width}px`, height: `${height}px`, margin: '0 auto', display: 'block' }}
        scrolling="no"
        title={`Ad-${width}x${height}`}
      />
    </div>
  );
}

// Banner Nativo
export function AdNative() {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <style>body { margin: 0; padding: 0; background: transparent; }</style>
        </head>
        <body>
          <script async="async" data-cfasync="false" src="https://pl29658533.effectivecpmnetwork.com/61343cf17420892297b59ec025c118e5/invoke.js"></script>
          <div id="container-61343cf17420892297b59ec025c118e5"></div>
        </body>
      </html>
    `);
    doc.close();
  }, []);

  return (
    <div className="flex justify-center items-center w-full my-6 bg-surface-variant/30 rounded-xl overflow-hidden p-2">
      <iframe
        ref={iframeRef}
        style={{ border: 'none', overflow: 'hidden', width: '100%', minHeight: '300px' }}
        scrolling="no"
        title="Native-Ad"
      />
    </div>
  );
}

// Scripts Globales (Popunder y Social Bar)
// Scripts Globales (Popunder y Social Bar)
export function AdGlobal() {
  useEffect(() => {
    // 1. Crear una hoja de estilos global específica para los elementos rebeldes
    const styleId = 'docai-ad-override';
    let styleTag = document.getElementById(styleId);
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      // Cualquier elemento marcado será forzado a bajar 85px con máxima prioridad CSS
      styleTag.innerHTML = `
        [data-docai-pushed="true"] {
          top: 85px !important;
          margin-top: 5px !important;
        }
      `;
      document.head.appendChild(styleTag);
    }

    // 2. Polling super agresivo para buscar el Social Bar en cuanto se renderice
    const intervalId = setInterval(() => {
      // Buscar elementos añadidos directamente al root o al body
      const floatingNodes = document.querySelectorAll('body > div, body > iframe, html > div');

      floatingNodes.forEach(el => {
        try {
          if (el.hasAttribute('data-docai-pushed') || el.id === 'root') return;

          const style = window.getComputedStyle(el);
          const className = (typeof el.className === 'string') ? el.className.toLowerCase() : '';
          const id = (typeof el.id === 'string') ? el.id.toLowerCase() : '';

          // Excluir elementos legítimos de nuestra app (navbar, toasts)
          if (className.includes('nav') || id.includes('nav') || className.includes('toast')) return;

          // Si es un contenedor fijo flotante
          if (style.position === 'fixed' || style.position === 'absolute') {
            const zIndex = parseInt(style.zIndex, 10);

            // Si tiene z-index alto o indefinido, y está tocando el techo de la página
            const rect = el.getBoundingClientRect();
            if ((zIndex > 100 || isNaN(zIndex) || style.zIndex === 'auto') && rect.top <= 20 && rect.height > 10) {
              // Marcarlo para que la regla CSS !important se le aplique al instante
              el.setAttribute('data-docai-pushed', 'true');
            }
          }
        } catch (e) { }
      });
    }, 300);

    // 3. Inyectar los scripts de la red
    const script1 = document.createElement('script');
    script1.src = "https://pl29658531.effectivecpmnetwork.com/2e/eb/73/2eeb736ae1d49b0e2537b3cb22166326.js";
    script1.async = true;
    document.body.appendChild(script1);

    const script2 = document.createElement('script');
    script2.src = "https://pl29658532.effectivecpmnetwork.com/d6/5a/d1/d65ad12bdfb8d4bda7b6ba55eb9a51e5.js";
    script2.async = true;
    document.body.appendChild(script2);

    return () => {
      clearInterval(intervalId);
      if (styleTag.parentNode) styleTag.parentNode.removeChild(styleTag);
      if (script1.parentNode) script1.parentNode.removeChild(script1);
      if (script2.parentNode) script2.parentNode.removeChild(script2);
    };
  }, []);

  return null;
}
