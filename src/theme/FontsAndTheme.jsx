export const FontsAndTheme = () => (
  <style>{`
    :root {
      --bg:#f5f0e6; --bg-2:#ede5d3; --surface:#fdfaf2;
      --ink:#181410; --ink-2:#3a322a; --muted:#7a6e5e;
      --line:#d9cdb7; --line-2:#c8b994;
      --accent:#b8431f; --accent-2:#d65a30; --accent-soft:#f0d4c4;
      --pos:#2f6a3b; --neg:#8a2727; --warn:#a87819;
      --electric:#1f4d8a; --electric-soft:#d4e0f0;
    }
    * { box-sizing:border-box; }
    body { margin:0; }
    .app-root { font-family:'Manrope',system-ui,sans-serif; color:var(--ink); background:var(--bg); min-height:100vh; font-size:14px; letter-spacing:-0.005em; }
    .serif { font-family:'Instrument Serif',serif; font-weight:400; letter-spacing:-0.01em; }
    .mono { font-family:'JetBrains Mono',monospace; font-variant-numeric:tabular-nums; }
    .italic-serif { font-family:'Instrument Serif',serif; font-style:italic; }
    .app-root::before { content:''; position:fixed; inset:0; pointer-events:none; background-image:radial-gradient(circle at 1px 1px, rgba(0,0,0,0.025) 1px, transparent 0); background-size:22px 22px; z-index:0; }
    .layout { display:grid; grid-template-columns:360px 1fr; min-height:100vh; position:relative; z-index:1; }
    @media (max-width:1000px){ .layout{grid-template-columns:1fr;} .sidebar{position:relative;max-height:none;} }
    .sidebar { background:var(--surface); border-right:1px solid var(--line); padding:22px 20px 80px; max-height:100vh; overflow-y:auto; position:sticky; top:0; }
    .sidebar::-webkit-scrollbar { width:6px; }
    .sidebar::-webkit-scrollbar-thumb { background:var(--line-2); border-radius:4px; }
    .main { padding:28px 36px 80px; min-width:0; }
    .brand-row { display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin-bottom:14px; }
    .brand { font-family:'Instrument Serif',serif; font-size:34px; line-height:1; }
    .brand em { font-style:italic; color:var(--accent); }
    .brand-sub { font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:var(--muted); }
    .group { margin-bottom:18px; border-bottom:1px dashed var(--line); padding-bottom:14px; }
    .group:last-child { border-bottom:none; }
    .group-title { display:flex; align-items:center; gap:8px; justify-content:space-between; font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:var(--muted); margin-bottom:12px; cursor:pointer; }
    .group-title-l { display:flex; align-items:center; gap:6px; }
    .group-blurb { font-size:11px; color:var(--muted); margin:-6px 0 12px; line-height:1.5; }
    .field-note { font-size:10.5px; color:var(--warn); margin:-4px 0 10px; line-height:1.5; background:#fcf0d6; padding:6px 8px; border-radius:3px; border:1px solid #e8d3a0; }
    .field { margin-bottom:12px; }
    .field-row { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:4px; }
    .field-label { font-size:12px; color:var(--ink-2); display:inline-flex; align-items:center; gap:4px; }
    .field-input { width:105px; padding:4px 6px; background:var(--bg); border:1px solid var(--line); color:var(--ink); font-family:'JetBrains Mono',monospace; font-size:11.5px; border-radius:3px; text-align:right; font-variant-numeric:tabular-nums; }
    .field-input:focus { outline:none; border-color:var(--accent); background:var(--surface); }
    .slider { -webkit-appearance:none; appearance:none; width:100%; height:3px; background:var(--line); outline:none; border-radius:2px; }
    .slider::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:14px; height:14px; border-radius:50%; background:var(--accent); cursor:pointer; border:2px solid var(--surface); box-shadow:0 0 0 1px var(--accent); }
    .slider::-moz-range-thumb { width:14px; height:14px; border-radius:50%; background:var(--accent); cursor:pointer; border:2px solid var(--surface); }
    .out-of-range::-webkit-slider-thumb { background:var(--warn); box-shadow:0 0 0 1px var(--warn); }
    .out-of-range::-moz-range-thumb { background:var(--warn); }
    .input,.select,.textarea { width:100%; padding:7px 10px; background:var(--bg); border:1px solid var(--line); color:var(--ink); font-family:'JetBrains Mono',monospace; font-size:12px; border-radius:3px; }
    .textarea { resize:vertical; min-height:120px; }
    .input:focus,.select:focus,.textarea:focus { outline:none; border-color:var(--accent); }
    .seg { display:flex; gap:0; background:var(--bg-2); border-radius:3px; padding:2px; margin-bottom:8px; }
    .seg button { flex:1; padding:5px 8px; font-size:10px; font-weight:500; background:transparent; border:none; cursor:pointer; border-radius:2px; color:var(--muted); font-family:'Manrope',sans-serif; transition:all 0.15s; }
    .seg button.active { background:var(--surface); color:var(--ink); box-shadow:0 1px 2px rgba(0,0,0,0.05); }
    .seg button:not(.active):hover { color:var(--ink); }
    .tabs { display:flex; gap:2px; border-bottom:1px solid var(--line); margin-bottom:24px; flex-wrap:wrap; }
    .tab { padding:10px 14px; font-size:13px; color:var(--muted); background:transparent; border:none; cursor:pointer; border-bottom:2px solid transparent; display:flex; align-items:center; gap:6px; font-family:'Manrope',sans-serif; font-weight:500; transition:color 0.15s, border-color 0.15s; }
    .tab:hover { color:var(--ink); }
    .tab.active { color:var(--accent); border-bottom-color:var(--accent); }
    .card { background:var(--surface); border:1px solid var(--line); padding:20px 22px; border-radius:4px; }
    .card-title { font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:var(--muted); margin-bottom:14px; display:flex; align-items:center; gap:8px; }
    .card-blurb { font-size:12px; color:var(--muted); margin:-6px 0 14px; line-height:1.6; }
    .kpi-grid { display:grid; gap:14px; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); margin-bottom:24px; }
    .kpi { background:var(--surface); border:1px solid var(--line); padding:16px 18px; border-radius:4px; position:relative; overflow:hidden; }
    .kpi-label { font-size:10px; letter-spacing:0.16em; text-transform:uppercase; color:var(--muted); margin-bottom:6px; display:flex; align-items:center; gap:4px; }
    .kpi-value { font-family:'Instrument Serif',serif; font-size:28px; line-height:1.05; color:var(--ink); }
    .kpi-sub { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--muted); margin-top:4px; }
    .kpi.accent { background:var(--accent-soft); border-color:var(--accent); }
    .kpi.accent .kpi-value { color:var(--accent); }
    .kpi.electric { background:var(--electric-soft); border-color:var(--electric); }
    .kpi.electric .kpi-value { color:var(--electric); }
    .verdict { display:flex; align-items:center; gap:14px; padding:16px 22px; border-radius:4px; margin-bottom:24px; border:1px solid var(--line); background:var(--surface); }
    .verdict.ok { border-left:4px solid var(--pos); }
    .verdict.warn { border-left:4px solid var(--warn); }
    .verdict.bad { border-left:4px solid var(--neg); }
    .verdict-icon { flex-shrink:0; }
    .verdict-text { font-family:'Instrument Serif',serif; font-size:22px; line-height:1.2; }
    .verdict-sub { font-size:12px; color:var(--muted); margin-top:2px; }
    .row-2 { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-bottom:18px; }
    @media (max-width:900px){ .row-2{grid-template-columns:1fr;} }
    .btn { display:inline-flex; align-items:center; gap:6px; padding:8px 14px; font-size:12px; font-weight:500; background:var(--ink); color:var(--bg); border:none; border-radius:3px; cursor:pointer; font-family:'Manrope',sans-serif; transition:opacity 0.15s; }
    .btn:hover { opacity:0.85; }
    .btn:disabled { opacity:0.4; cursor:not-allowed; }
    .btn.outline { background:transparent; color:var(--ink); border:1px solid var(--line); }
    .btn.accent { background:var(--accent); color:white; }
    .btn.ghost { background:transparent; color:var(--muted); border:none; padding:4px 8px; }
    .btn.ghost:hover { color:var(--accent); }
    .tbl { width:100%; border-collapse:collapse; font-size:13px; }
    .tbl th { text-align:left; font-weight:500; padding:8px 10px; color:var(--muted); text-transform:uppercase; font-size:10px; letter-spacing:0.12em; border-bottom:1px solid var(--line); }
    .tbl td { padding:9px 10px; border-bottom:1px solid var(--bg-2); font-family:'JetBrains Mono',monospace; font-size:12px; }
    .tbl tr:last-child td { border-bottom:none; }
    .tbl .num { text-align:right; }
    .pos { color:var(--pos); }
    .neg { color:var(--neg); }
    .scenario-chip { display:inline-flex; align-items:center; gap:6px; padding:6px 10px; margin:0 6px 6px 0; background:var(--bg-2); border:1px solid var(--line); border-radius:100px; font-size:11px; }
    .scenario-chip .dot { width:8px; height:8px; border-radius:50%; }
    .scenario-chip .x { cursor:pointer; opacity:0.5; margin-left:2px; }
    .scenario-chip .x:hover { opacity:1; color:var(--accent); }
    .pill { display:inline-block; padding:3px 8px; font-size:10px; letter-spacing:0.1em; text-transform:uppercase; background:var(--bg-2); border:1px solid var(--line); border-radius:2px; color:var(--muted); }
    .pill.accent { background:var(--accent-soft); border-color:var(--accent); color:var(--accent); }
    .report-body { max-width:760px; line-height:1.7; }
    .report-body h1 { font-family:'Instrument Serif',serif; font-weight:400; font-size:42px; margin:0 0 6px; }
    .report-body h2 { font-family:'Instrument Serif',serif; font-weight:400; font-size:24px; margin:30px 0 8px; color:var(--accent); }
    .report-body p { color:var(--ink-2); }
    .report-body .lead { font-family:'Instrument Serif',serif; font-style:italic; font-size:17px; color:var(--muted); border-left:2px solid var(--accent); padding-left:14px; margin:16px 0; }
    .formula-block { background:var(--bg); border:1px solid var(--line); border-radius:4px; padding:18px 22px; margin:12px 0; }
    .formula-block .formula-name { font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:var(--muted); margin-bottom:8px; }
    .formula-block .formula-eq { font-family:'Instrument Serif',serif; font-size:22px; font-style:italic; margin:10px 0; }
    .formula-block .formula-eq .op { font-style:normal; padding:0 4px; color:var(--muted); }
    .formula-block .formula-where { font-size:12px; color:var(--ink-2); margin-top:8px; line-height:1.6; }
    .formula-block .formula-substituted { font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--accent); background:var(--accent-soft); padding:6px 10px; border-radius:3px; display:inline-block; margin-top:6px; }
    .frac { display:inline-flex; flex-direction:column; align-items:center; vertical-align:middle; padding:0 4px; }
    .frac > span:first-child { border-bottom:1px solid currentColor; padding:0 6px 2px; font-size:0.9em; }
    .frac > span:last-child { padding-top:2px; font-size:0.9em; }
    pre.json-out { background:var(--ink); color:var(--bg); padding:16px; border-radius:4px; font-family:'JetBrains Mono',monospace; font-size:11px; line-height:1.5; max-height:420px; overflow:auto; white-space:pre-wrap; word-break:break-word; }
    .toast { padding:10px 14px; border-radius:3px; font-size:12px; margin-top:10px; }
    .toast.success { background:#e3efde; color:var(--pos); border:1px solid var(--pos); }
    .toast.error { background:#f5dada; color:var(--neg); border:1px solid var(--neg); }
    .info { display:inline-flex; align-items:center; justify-content:center; width:13px; height:13px; border-radius:50%; background:var(--bg-2); color:var(--muted); cursor:help; position:relative; flex-shrink:0; }
    .info svg { width:9px; height:9px; }
    .info:hover { background:var(--accent); color:white; }
    .info:hover .info-tip { opacity:1; pointer-events:auto; transform:translateX(-50%) translateY(0); }
    .info-tip { position:absolute; bottom:calc(100% + 8px); left:50%; transform:translateX(-50%) translateY(4px); background:var(--ink); color:var(--bg); padding:10px 12px; border-radius:4px; font-size:11.5px; line-height:1.55; font-weight:400; width:260px; opacity:0; pointer-events:none; transition:opacity 0.15s, transform 0.15s; z-index:1000; text-transform:none; letter-spacing:normal; text-align:left; font-family:'Manrope',sans-serif; box-shadow:0 4px 14px rgba(0,0,0,0.15); }
    .info-tip::after { content:''; position:absolute; top:100%; left:50%; transform:translateX(-50%); border:5px solid transparent; border-top-color:var(--ink); }
    .info-tip strong { color:white; font-weight:600; }
    .income-bar { width:100%; height:32px; background:var(--bg-2); border-radius:4px; overflow:hidden; display:flex; border:1px solid var(--line); }
    .income-bar > div { height:100%; display:flex; align-items:center; justify-content:center; font-size:10px; color:white; font-family:'JetBrains Mono',monospace; font-weight:600; overflow:hidden; }
    .income-bar-legend { display:flex; flex-wrap:wrap; gap:12px 18px; margin-top:12px; font-size:11px; }
    .income-bar-legend > div { display:flex; align-items:center; gap:6px; }
    .income-bar-legend .swatch { width:10px; height:10px; border-radius:2px; }
    .income-summary { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:10px; margin-bottom:14px; }
    .income-summary > div { padding:10px 12px; background:var(--bg-2); border-radius:3px; }
    .income-summary .lbl { font-size:10px; text-transform:uppercase; letter-spacing:0.12em; color:var(--muted); margin-bottom:2px; }
    .income-summary .val { font-family:'JetBrains Mono',monospace; font-size:15px; }
    .stress-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:100px; font-size:11px; font-weight:500; }
    .stress-badge.ok { background:#e3efde; color:var(--pos); }
    .stress-badge.warn { background:#fcf0d6; color:var(--warn); }
    .stress-badge.bad { background:#f5dada; color:var(--neg); }
  `}</style>
);
