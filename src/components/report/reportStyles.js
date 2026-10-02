// Estilos que sólo aplican al reporte.

// Impresión: oculta el resto de la app, lleva la columna principal a ancho
// completo, quita el fondo y evita cortar tablas y KPIs entre páginas, para que
// "Guardar como PDF" desde el diálogo del navegador produzca un documento limpio.
export const PRINT_CSS = `
    @media print {
      .sidebar, .tabs { display:none !important; }
      .layout { display:block !important; grid-template-columns:1fr !important; }
      .main { padding:0 !important; }
      .app-root::before { display:none !important; }
      .app-root, .layout, .main { background:#fff !important; }
      .report-body { max-width:none !important; box-shadow:none !important; border:none !important; padding:0 !important; }
      .report-noprint { display:none !important; }
      tr, .formula-block, .kpi { break-inside:avoid; page-break-inside:avoid; }
      table, .card { break-inside:auto; }
      h1, h2 { break-after:avoid; page-break-after:avoid; }
      @page { margin:16mm 14mm; }
    }
  `;

// Pantallas angostas (menos de 700px), sólo dentro de .report-body: menos padding
// (gana al estilo en línea con !important), tablas anchas con scroll horizontal y
// títulos más chicos.
export const RESPONSIVE_CSS = `
    @media (max-width:700px) {
      .report-body { padding:20px 14px !important; }
      .report-body h1 { font-size:30px; }
      .report-body h2 { font-size:20px; }
      .report-body table { display:block; overflow-x:auto; white-space:nowrap; -webkit-overflow-scrolling:touch; }
    }
  `;
