// Styles that only apply to the report.

// Print: hides the rest of the app, takes the main column to full width, drops
// the background and avoids splitting tables and KPIs across pages, so "Guardar
// como PDF" (save as PDF) from the browser dialog produces a clean document.
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

// Narrow screens (under 700px), only inside .report-body: less padding (beats
// the inline style with !important), wide tables scroll horizontally and
// headings are smaller.
export const RESPONSIVE_CSS = `
    @media (max-width:700px) {
      .report-body { padding:20px 14px !important; }
      .report-body h1 { font-size:30px; }
      .report-body h2 { font-size:20px; }
      .report-body table { display:block; overflow-x:auto; white-space:nowrap; -webkit-overflow-scrolling:touch; }
    }
  `;
