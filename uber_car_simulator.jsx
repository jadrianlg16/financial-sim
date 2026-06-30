// ############################################################################
// AUTO·PILOT — Simulador de viabilidad: ¿conviene comprar un auto (y usarlo en
// Uber para pagarlo)?  ·  Resumen de OBJETIVOS por petición del usuario.
// ----------------------------------------------------------------------------
// Este archivo documenta, página por página (ver comentarios sobre cada
// componente), qué se buscaba lograr. Historial de requerimientos:
//
// 1) ALCANCE INICIAL: prototipo funcional como artifact, alcance "Completo":
//    incluir Monte Carlo + análisis de sensibilidad + comparación multi-carro.
//    Caso académico (Actividades 1-A a 1-D): clasificación de costos, VP vs VF
//    del crédito, punto de equilibrio + intensidad de trabajo, depreciación y
//    valor de rescate con escenarios de liquidación, y un reporte narrativo.
//
// 2) MODOS Y VARIABLES: compra efectivo/crédito/mixto; operación break-even /
//    meta de ganancia / sin Uber; motor gasolina/diésel/híbrido/eléctrico con
//    costo de energía propio y tiempo de carga (EV/híbrido enchufable) que descuenta horas;
//    enganche por % o monto fijo; ciudad por dropdown + texto editable;
//    inflación de combustible; km personales + desgaste extra por Uber;
//    pestaña de Fórmulas; horas/semana visibles en la pantalla final;
//    pestaña Importar/AI (generar prompt JSON + importar caso).
//
// 3) USABILIDAD: que sea clara y flexible para cualquier usuario.
//    - Todos los sliders también con CAMPO MANUAL editable, permitiendo valores
//      FUERA del rango del slider (sin eliminar los sliders).
//    - Textos en lenguaje fácil para quien no sabe de finanzas; tecnicismos SIEMPRE
//      con explicación, vía tooltips con ícono "?" al hover (poco espacio visual).
//    - Explicar: Monte Carlo, posición/resultado final, depreciación, valor de
//      rescate, punto de equilibrio, costo total, "que se pague solo", costo
//      mensual total, desgaste, mantenimiento, resultado final.
//    - Atender perfiles: comprar nuevo y pagar con Uber, comprar usado, ya tengo
//      auto y quiero su costo, usar mi carro viejo, sólo ver depreciación sin
//      Uber, comparar autos, saber qué auto conviene, y cuánto del ingreso se va.
//    - Campo OPCIONAL de ingreso mensual → % del sueldo destinado al auto + gráficas.
//
// 4) VARIABLES EXTRA Y RIGOR: seguro MENSUAL (default $2,000, nota de que sube
//    por póliza comercial de Uber); refrendo mensual ($500); lavado ($800) y
//    propinas ($400); misceláneos ($2,000); pagos iniciales ÚNICOS (toxicológico
//    $400 + certificación Uber $900). Todas las variables interconectadas, y
//    reflejadas en el reporte y en las gráficas de gasto de largo plazo.
//    La investigación con IA debe llenar TODAS las variables y CITAR FUENTES por
//    cada dato para poder verificar la información.
// ############################################################################
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, ReferenceLine, Cell
} from 'recharts';
import {
  Car, MapPin, Wallet, Settings, BarChart3, Activity, FileText,
  Save, TrendingUp, AlertTriangle, CheckCircle2,
  Sliders, GitCompareArrows, Dice5, Sparkles, Download, RotateCcw,
  ChevronDown, ChevronRight, Building2, Calculator, Upload,
  Zap, Fuel, Battery, Copy, FileJson, BrainCircuit, HelpCircle,
  DollarSign, PiggyBank, Receipt
} from 'lucide-react';

const FontsAndTheme = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
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

const CAR_PRESETS = {
  'kia_k3':         { name: 'KIA K3 Sedán',            price: 279900, kmpl: 18.5, type: 'gasoline' },
  'nissan_versa':   { name: 'Nissan Versa Sense',      price: 286900, kmpl: 17.0, type: 'gasoline' },
  'chevrolet_aveo': { name: 'Chevrolet Aveo LS',       price: 249900, kmpl: 16.5, type: 'gasoline' },
  'hyundai_i10':    { name: 'Hyundai Grand i10 Sedán', price: 244900, kmpl: 19.0, type: 'gasoline' },
  'toyota_yaris':   { name: 'Toyota Yaris Sedán',      price: 295900, kmpl: 18.0, type: 'gasoline' },
  'suzuki_swift':   { name: 'Suzuki Swift GLS',        price: 259900, kmpl: 19.5, type: 'gasoline' },
  'corolla_hybrid': { name: 'Toyota Corolla Hybrid',   price: 459900, kmpl: 25.0, type: 'hybrid', kmPerKwh: 6.5, plugInHybrid: false },
  'mg_zs_ev':       { name: 'MG ZS EV',                price: 569900, kmpl: null, type: 'electric', kmPerKwh: 5.8, batteryCapacityKwh: 50.3 },
  'used_versa_20':  { name: 'Nissan Versa 2020 (usado)',  price: 195000, kmpl: 17.0, type: 'gasoline', condition: 'used', year: 2020, odometerKm: 80000 },
  'used_aveo_19':   { name: 'Chevrolet Aveo 2019 (usado)', price: 145000, kmpl: 16.0, type: 'gasoline', condition: 'used', year: 2019, odometerKm: 95000 },
  'used_sentra_21': { name: 'Nissan Sentra 2021 (usado)', price: 265000, kmpl: 16.5, type: 'gasoline', condition: 'used', year: 2021, odometerKm: 60000 },
  'custom':         { name: '— Personalizado / Mi auto actual —', price: 250000, kmpl: 17.0, type: 'gasoline' },
};
const CITY_PRESETS = {
  'mty':  { name: 'Monterrey',        fare: 140, fuel: 24.5, electricity: 4.2 },
  'cdmx': { name: 'Ciudad de México', fare: 165, fuel: 23.8, electricity: 3.9 },
  'gdl':  { name: 'Guadalajara',      fare: 135, fuel: 24.1, electricity: 4.0 },
  'qro':  { name: 'Querétaro',        fare: 138, fuel: 24.0, electricity: 4.1 },
  'pue':  { name: 'Puebla',           fare: 118, fuel: 23.9, electricity: 4.0 },
  'tij':  { name: 'Tijuana',          fare: 150, fuel: 24.7, electricity: 4.3 },
};
const VEHICLE_TYPES = { gasoline:{label:'Gasolina'}, diesel:{label:'Diésel'}, hybrid:{label:'Híbrido'}, electric:{label:'Eléctrico'} };
const SCENARIO_COLORS = ['#b8431f','#2f6a3b','#1f4d8a','#a87819','#6b3d8a','#8a2727','#0e6b6b'];

const fmtMXN = (n, dec = 0) => !isFinite(n) ? '—' : n.toLocaleString('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:dec,maximumFractionDigits:dec});
const fmtN = (n, dec = 0) => !isFinite(n) ? '—' : n.toLocaleString('es-MX',{minimumFractionDigits:dec,maximumFractionDigits:dec});
const fmtFixed = (n, dec = 1) => Number.isFinite(n) ? n.toFixed(dec) : '—';
const fmtPct = (n, dec = 1) => Number.isFinite(n) ? `${(n*100).toFixed(dec)}%` : '—';
const num = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, num(v, lo)));
const nonNegative = (v, fallback = 0) => Math.max(0, num(v, fallback));
const positive = (v, fallback = 1) => Math.max(0.000001, num(v, fallback));

const Info = ({ text }) => (
  <span className="info" tabIndex={0}><HelpCircle /><span className="info-tip" dangerouslySetInnerHTML={{ __html: text }} /></span>
);

const TIPS = {
  monthlyPayment: 'La mensualidad es lo que pagas cada mes al banco hasta terminar el crédito.',
  vp: '<strong>Valor Presente (VP).</strong> Cuánto valdría hoy todo el dinero que vas a pagar en el futuro. El dinero a futuro vale menos que el de hoy.',
  vf: '<strong>Valor Futuro (VF).</strong> Suma nominal de todo lo que terminarás pagando: enganche + todas las mensualidades + comisiones.',
  timeValue: '<strong>Costo del dinero.</strong> Diferencia entre lo que pagas en total (VF) y lo que ese dinero vale hoy (VP). Es lo que te cuesta pagar a plazos en vez de de contado.',
  breakeven: '<strong>Punto de equilibrio.</strong> Lo mínimo que necesitas trabajar para que el proyecto se pague solo: cubre costos mensuales y recupera lo que no se cubra con la venta final del auto menos la deuda.',
  depreciation: '<strong>Depreciación.</strong> Cuánto pierde de valor el auto cada año, calculado sobre el PRECIO ORIGINAL (lineal). Con 20%: tras 1 año vale 80% del original, tras 2 años 60%, tras 3 años 40%, etc.',
  finalPosition: '<strong>Resultado final.</strong> Lo que te queda al terminar: el dinero de la venta del auto menos lo que aún debes del crédito.',
  monthlyTotal: '<strong>Costo mensual total.</strong> Todo lo que cuesta tener el auto cada mes: mensualidad + combustible + seguro + mantenimiento + extras.',
  wear: '<strong>Desgaste por Uber.</strong> Recargo extra de mantenimiento por cada km manejado en Uber. NO es fijo: el costo total de desgaste crece automáticamente si haces más viajes, más horas o más km por viaje, porque eso aumenta los km de Uber. Este % sólo fija qué tan caro es cada km de Uber frente a un km personal.',
  maintenance: '<strong>Mantenimiento base.</strong> Servicios regulares y desgaste esperado para un uso de referencia de 20,000 km/año. El simulador lo convierte a costo por km, así que sube cuando manejas más km.',
  capacity: '<strong>Capacidad utilizada.</strong> Qué porcentaje del tiempo máximo disponible necesitas trabajar. Si pasa de 100%, no te alcanzan las horas.',
  salesFactor: 'Factor de venta: vender al valor calculado (1.00×), más barato (0.80×) o más caro (1.10×). El uso intensivo de Uber suele bajar la reventa.',
  uberCommission: 'Lo que se queda la app Uber de cada viaje (típicamente 25%).',
  tax: 'Porcentaje de impuestos calculado sobre la tarifa bruta del viaje, como pide el problema: precio del viaje menos comisión Uber menos impuestos.',
  refrendo: '<strong>Refrendo / Tenencia.</strong> Pago vehicular estatal para mantener tus placas vigentes. Varía por estado; aquí se captura como monto mensual prorrateado.',
  insurance: '<strong>Seguro.</strong> Lo que pagas por el seguro. <strong>Ojo:</strong> en muchos estados/aseguradoras, usar el auto para Uber exige una póliza comercial, más cara que la de un auto particular.',
  fuelInflation: 'Cuánto sube el precio de la gasolina cada año en promedio. En México el histórico ronda 5-7% anual.',
  vehicleType: 'El tipo de motor afecta cuánto gastas en energía. Eléctrico y los híbridos enchufables requieren tiempo de carga; un híbrido convencional usa gasolina y no resta horas de carga.',
  purchaseMode: 'Cómo pagas el auto: todo de contado (sin intereses), todo a crédito, o una mezcla.',
  income: 'Tu ingreso mensual del trabajo principal. Si lo llenas, mostramos qué porcentaje de tu sueldo se va al auto.',
  openingFee: 'Comisión de apertura: cargo único del banco al inicio del crédito, generalmente 1-3% del monto financiado.',
  amortization: 'Cómo se reparte cada mensualidad entre intereses y reducir tu deuda. Al principio paga más intereses; al final más capital.',
  costStructure: 'Cómo se reparte tu pago mensual entre las diferentes categorías de gasto.',
  carWash: 'Lavados del auto. Como conductor conviene traerlo limpio, por eso suele ser un gasto recurrente más alto que para uso personal.',
  tips: 'Propinas en lavados y servicios. Pequeño pero constante.',
  misc: 'Gastos misceláneos: imprevistos, casetas ocasionales, estacionamiento, multas menores, etc. Un colchón para lo que no entra en otra categoría.',
  toxicology: 'Examen toxicológico antidoping que Uber suele exigir para dar de alta a un conductor.',
  certification: 'Curso/certificación inicial de conductor y trámites de registro en la plataforma.',
  cumSpend: 'Cuánto dinero llevas gastado en total conforme pasan los años, por categoría. Incluye el desembolso inicial, las mensualidades y los costos recurrentes.',
  totalProject: 'Costo neto del proyecto: TODO lo que sale de tu bolsa en el horizonte (enganche + mensualidades + comisiones + pagos iniciales + costos recurrentes) MENOS lo que REALMENTE recuperas al final (venta del auto menos la deuda que aún debes).',
  liquidation: '<strong>Resultado de liquidación.</strong> Lo que te queda SÓLO de vender el auto al final: precio de venta menos la deuda que aún debes. No incluye lo que gastaste ni lo que ganaste en el camino.',
  netResult: '<strong>Resultado neto del proyecto.</strong> La foto completa: ingresos de Uber + lo que recuperas al vender el auto (menos deuda) − TODO lo que gastaste. Positivo = el proyecto te dejó dinero; negativo = te costó.',
  kmPerTrip: '<strong>Km por viaje.</strong> Distancia promedio que recorres por cada viaje, incluyendo el traslado vacío para recoger al pasajero. Conecta los viajes con el gasto de combustible y mantenimiento.',
  evRange: '<strong>Autonomía EV.</strong> Si tus km diarios superan lo que rinde una carga completa de la batería, tendrías que recargar a media jornada (pierdes tiempo de trabajo).',
  upfrontRecovery: 'El punto de equilibrio de Uber recupera automáticamente el desembolso inicial que no quede cubierto por la venta final del auto menos la deuda viva.',
  // --- Ingeniería económica (nuevos) ---
  discountRate: '<strong>Tasa de descuento (costo de oportunidad).</strong> Lo que tu dinero rendiría en otra inversión segura (p.ej. CETES ~10-11% en México). Es la tasa con la que traemos los flujos futuros a valor de hoy. NO es la tasa del crédito: usar la del crédito haría que el VP del préstamo siempre fuera igual al monto prestado, que no dice nada.',
  npv: '<strong>Valor Presente Neto (VPN).</strong> Suma de todos los flujos (lo que sale y lo que entra) traídos a hoy con la tasa de descuento. Positivo = el proyecto crea valor frente a invertir tu dinero a esa tasa; negativo = lo destruye.',
  irr: '<strong>Tasa Interna de Retorno (TIR).</strong> El rendimiento anual que realmente te deja el proyecto. Compárala con tu tasa de descuento: si la TIR es mayor, conviene.',
  eac: '<strong>Costo Anual Equivalente (CAE).</strong> Convierte el costo total (en valor presente) en una renta anual uniforme. Es la forma correcta de comparar autos que conservas distintos números de años: el de menor CAE es el de mejor valor.',
  tco: '<strong>Costo Total de Propiedad (TCO).</strong> Todo lo que el auto te cuesta de verdad en el horizonte: depreciación + financiamiento + energía + seguro + mantenimiento + tenencia + extras − lo que recuperas al venderlo. Es el número que de verdad importa al comparar autos.',
  costPerKm: '<strong>Costo por kilómetro.</strong> El TCO dividido entre todos los km que manejarás. Permite comparar autos sin importar cuánto los uses.',
  cat: '<strong>CAT (Costo Anual Total).</strong> La tasa real del crédito incluyendo la comisión de apertura, no sólo el interés de lista. En México es la cifra que la ley obliga a comparar entre créditos.',
  ear: '<strong>Tasa efectiva anual.</strong> El interés real una vez que se compone mes con mes. Siempre es un poco mayor que la tasa nominal de lista.',
  financeVsCash: '<strong>¿Financiar o pagar de contado?</strong> Comparamos, en valor de hoy, pagar todo de contado vs. dar enganche y financiar el resto invirtiendo tu dinero a la tasa de oportunidad. Positivo = financiar te conviene (tu dinero rinde más que lo que cuesta el crédito); negativo = de contado sale mejor.',
  depreciationMethod: '<strong>Método de depreciación.</strong> Saldo decreciente (geométrico, lo más realista para autos): pierde el mismo % del valor restante cada año. Lineal: pierde el mismo monto del precio original cada año. Realista: caída fuerte el primer año y luego saldo decreciente.',
  vehicleCondition: '<strong>Nuevo vs. usado.</strong> Un usado cuesta menos y deprecia más lento en %, pero suele tener tasa de crédito más alta, mantenimiento mayor y riesgo de reparaciones. Activa la reserva de reparaciones para modelarlo.',
  tradeIn: '<strong>Auto a cuenta (trade-in).</strong> Valor de tu auto actual entregado como parte del pago. Reduce lo que financias o pagas de contado.',
  acquisitionFees: '<strong>Gastos de adquisición.</strong> Pagos únicos al comprar: placas/alta vehicular, ISAN o tenencia inicial, revisión mecánica (usados), cambio de propietario/traspaso.',
  sellingCost: '<strong>Costo de venta.</strong> Lo que pierdes al vender el auto al final: comisión de agencia o lote, trámite de traspaso, acondicionamiento. Se descuenta del valor de reventa.',
  repairReserve: '<strong>Reserva de reparaciones.</strong> Dinero que apartas al año para fallas fuera del mantenimiento normal. Crece con la edad del auto; importante en usados y fuera de garantía.',
  generalInflation: '<strong>Inflación general de costos.</strong> Cuánto suben al año el seguro, refrendo, mantenimiento y demás gastos (aparte del combustible, que tiene su propia inflación).',
  depreciationCost: '<strong>Costo por depreciación.</strong> Lo que el auto pierde de valor en el horizonte (precio − valor de reventa). Suele ser el costo más grande de tener un auto, aunque no lo "sientas" cada mes.',
};

// Nombre a mostrar del auto: usa el preset, o el nombre importado por IA si es custom. (audit fix)
function carDisplayName(inputs) {
  if (inputs.carPreset === 'custom' && inputs.carName) return inputs.carName;
  return CAR_PRESETS[inputs.carPreset]?.name || 'auto seleccionado';
}

function pmt(principal, annualRate, months) {
  if (months <= 0) return 0;
  const r = annualRate / 12;
  if (r === 0) return principal / months;
  return principal * r / (1 - Math.pow(1 + r, -months));
}
function buildAmortization(principal, annualRate, months) {
  if (principal <= 0 || months <= 0) return { payment:0, rows:[], totalPaid:0, totalInterest:0 };
  const payment = pmt(principal, annualRate, months);
  const r = annualRate / 12;
  let bal = principal; const rows = []; let cumInt = 0, cumPrin = 0;
  for (let m = 1; m <= months; m++) {
    const interest = bal * r; const principalPart = payment - interest;
    bal = Math.max(0, bal - principalPart); cumInt += interest; cumPrin += principalPart;
    rows.push({ month:m, payment, interest, principal:principalPart, balance:bal, cumInt, cumPrin });
  }
  return { payment, rows, totalPaid: payment*months, totalInterest: payment*months - principal };
}

// ============================================================================
// INGENIERÍA ECONÓMICA  ·  VPN, TIR, CAE y CAT
// ----------------------------------------------------------------------------
// Estas son las ecuaciones "de verdad" para decidir entre alternativas:
//   - VPN (NPV): trae todos los flujos a hoy con una TASA DE OPORTUNIDAD (lo que
//     tu dinero podría ganar en otro lado, p.ej. CETES), NO la tasa del crédito.
//   - TIR (IRR): rendimiento que iguala el VPN a cero (sirve cuando hay ingresos).
//   - CAE (EAC): costo anual equivalente; convierte un costo en valor presente en
//     una renta anual uniforme, para comparar autos con horizontes distintos.
//   - CAT: tasa anual total real del crédito, incluyendo comisión de apertura.
// ============================================================================
function npv(ratePerPeriod, cashflows) {
  return cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + ratePerPeriod, t), 0);
}
// TIR por bisección robusta: requiere un cambio de signo en los flujos.
function irr(cashflows, lo = -0.95, hi = 5) {
  const f = (r) => npv(r, cashflows);
  let flo = f(lo), fhi = f(hi);
  if (!isFinite(flo) || !isFinite(fhi) || flo * fhi > 0) return NaN;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2, fmid = f(mid);
    if (!isFinite(fmid)) return NaN;
    if (Math.abs(fmid) < 1e-7) return mid;
    if (flo * fmid < 0) { hi = mid; fhi = fmid; } else { lo = mid; flo = fmid; }
  }
  return (lo + hi) / 2;
}
// Tasa periódica que resuelve: netoRecibido = pago · [1−(1+j)^−n]/j  (para CAT).
function solvePeriodicRate(netReceived, payment, n) {
  if (netReceived <= 0 || payment <= 0 || n <= 0) return 0;
  const g = (j) => (j === 0 ? payment * n : payment * (1 - Math.pow(1 + j, -n)) / j) - netReceived;
  let lo = 1e-9, hi = 5;
  if (g(lo) * g(hi) > 0) return 0;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2, gm = g(mid);
    if (Math.abs(gm) < 1e-6) return mid;
    if (g(lo) * gm < 0) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}
// CAE: anualiza un costo expresado como valor presente, sobre N años.
function equivalentAnnualCost(pvCost, annualRate, years) {
  if (years <= 0) return pvCost;
  if (annualRate === 0) return pvCost / years;
  const annuityFactor = (1 - Math.pow(1 + annualRate, -years)) / annualRate;
  return pvCost / annuityFactor;
}

// Depreciación con MÉTODO seleccionable (el activo nunca vale menos de 0):
//   - 'declining'  Saldo decreciente / geométrico:  V_n = V0·(1−d)^n   [realista, default]
//   - 'straight'   Lineal sobre precio original:     V_n = V0·(1−d·n)
//   - 'realistic'  Caída fuerte el 1er año y luego saldo decreciente:
//                  V_1 = V0·(1−d1);  V_n = V_1·(1−d)^(n−1)
function depreciatedValue(price, I, year) {
  if (year <= 0) return price;
  const d = clamp(I.depreciationRate, 0, 0.95);
  const method = I.depreciationMethod || 'declining';
  let v;
  if (method === 'straight') {
    v = price * (1 - d * year);
  } else if (method === 'realistic') {
    const d1 = clamp(I.firstYearDepreciation != null ? I.firstYearDepreciation : 0.25, 0, 0.95);
    const afterFirst = price * (1 - d1);
    v = year === 1 ? afterFirst : afterFirst * Math.pow(1 - d, year - 1);
  } else {
    v = price * Math.pow(1 - d, year);
  }
  return Math.max(0, v);
}
function calculateEnergyCost(I, monthlyKm, yearOffset = 0) {
  const km = nonNegative(monthlyKm);
  const fuelInflation = Math.max(-0.95, num(I.fuelInflation));
  const electricityInflation = Math.max(-0.95, num(I.electricityInflation));
  const fuelInflated = nonNegative(I.fuelPrice) * Math.pow(1 + fuelInflation, yearOffset);
  const dieselInflated = nonNegative(I.dieselPrice) * Math.pow(1 + fuelInflation, yearOffset);
  const elecInflated = nonNegative(I.electricityPrice) * Math.pow(1 + electricityInflation, yearOffset);
  const kmpl = positive(I.kmpl, 1);
  const kmPerKwh = positive(I.kmPerKwh, 1);
  const chargerPowerKw = positive(I.chargerPowerKw, 1);
  switch (I.vehicleType) {
    case 'gasoline': return { cost: (km / kmpl) * fuelInflated, chargingTimePerDay: 0 };
    case 'diesel':   return { cost: (km / kmpl) * dieselInflated, chargingTimePerDay: 0 };
    case 'electric': {
      const kWhMonth = km / kmPerKwh; const cost = kWhMonth * elecInflated;
      return { cost, chargingTimePerDay: (kWhMonth / 30) / chargerPowerKw };
    }
    case 'hybrid': {
      if (!I.plugInHybrid) return { cost: (km / kmpl) * fuelInflated, chargingTimePerDay: 0 };
      const hybridElectricFraction = clamp(I.hybridElectricFraction, 0, 1);
      const kmElec = km * hybridElectricFraction; const kmGas = km * (1 - hybridElectricFraction);
      const kWhMonth = kmElec / kmPerKwh;
      const gasCost = (kmGas / kmpl) * fuelInflated; const electricCost = kWhMonth * elecInflated;
      return { cost: gasCost + electricCost, chargingTimePerDay: (kWhMonth / 30) / chargerPowerKw };
    }
    default: return { cost: 0, chargingTimePerDay: 0 };
  }
}

// ============================================================================
// MOTOR DE CÁLCULO  ·  Objetivos solicitados por el usuario
// ----------------------------------------------------------------------------
// Núcleo que conecta TODAS las variables entre sí (petición: "asegúrate que
// todas las variables estén interconectadas con las que deben estarlo").
// Resuelve:
//   - 3 modos de compra (efectivo / crédito / mixto) → enganche, financiado, VF/VP.
//   - 3 modos de operación (break-even / meta de ganancia / sin Uber).
//   - 4 tipos de motor con costo de energía propio + tiempo de carga (EV/híbrido enchufable)
//     que reduce las horas disponibles y por lo tanto el punto de equilibrio.
//   - Desgaste por Uber que multiplica el mantenimiento.
//   - Costos recurrentes: seguro, refrendo, lavado, propinas, misceláneos, datos,
//     accesorios + inflación de combustible/electricidad a lo largo del horizonte.
//   - Pagos iniciales ÚNICOS (toxicológico + certificación) → desembolso día 1.
  //   - Depreciación lineal por tasa anual, valor de rescate y 3 escenarios de
//     liquidación → resultado final.
//   - GASTO ACUMULADO por categoría año por año (para la gráfica de largo plazo)
//     y costo total/neto del proyecto.
// ============================================================================
function calculate(I) {
  const carPrice = nonNegative(I.carPrice);
  const years = Math.max(1, Math.round(positive(I.horizonYears, 1)));
  const horizonMonths = years * 12;
  // Auto a cuenta (trade-in): actúa como enganche adicional, reduce lo financiado.
  const tradeInValue = Math.min(nonNegative(I.tradeInValue), carPrice);
  let cashPaid, financed;
  if (I.purchaseMode === 'cash') { cashPaid = Math.max(0, carPrice - tradeInValue); financed = 0; }
  else if (I.purchaseMode === 'hybrid') { cashPaid = Math.min(nonNegative(I.cashAmount), carPrice - tradeInValue); financed = Math.max(0, carPrice - tradeInValue - cashPaid); }
  else { cashPaid = I.downPaymentMode === 'percent' ? carPrice * clamp(I.downPaymentPct, 0, 1) : Math.min(nonNegative(I.downPaymentFixed), carPrice); financed = Math.max(0, carPrice - cashPaid - tradeInValue); }

  const months = financed > 0 ? Math.max(1, Math.round(positive(I.loanMonths, 1))) : 0;
  const interestRate = Math.max(-0.95, num(I.interestRate));
  const amort = buildAmortization(financed, interestRate, months);
  const monthlyPayment = amort.payment;
  const totalInterest = amort.totalInterest;
  const openingFee = financed * nonNegative(I.openingFeePct);

  const r = interestRate / 12;
  const pvOfPayments = financed > 0 ? (r === 0 ? monthlyPayment * months : monthlyPayment * (1 - Math.pow(1 + r, -months)) / r) : 0;
  const pvTotal = pvOfPayments + cashPaid + openingFee;
  const fvTotal = amort.totalPaid + cashPaid + openingFee;
  const timeValueOfMoney = fvTotal - pvTotal;

  const isUberMode = I.operationMode !== 'no-uber';
  const personalKm = nonNegative(I.personalKmDaily);

  // --- TRIP ↔ KM CONSISTENCY (audit fix #3) -------------------------------
  // El break-even se resuelve por CONTRIBUCIÓN NETA por viaje: los km de Uber,
  // el combustible y el mantenimiento variable dependen de los viajes que
  // realmente se necesitan, no de un supuesto diario desconectado.
  const kmPerTrip = positive(I.uberKmPerTrip, 1);     // km recorridos por viaje (incluye traslados vacíos)
  const personalMonthlyKm = personalKm * 30;

  // Costo de energía y mantenimiento POR KM (promediados sobre el horizonte para
  // incorporar inflación). Se calculan con un km de referencia y se normalizan.
  const REF_KM = 1000;
  let refEnergyOverHorizon = 0;
  for (let y = 0; y < years; y++) refEnergyOverHorizon += calculateEnergyCost(I, REF_KM, y).cost;
  const energyCostPerKm = (refEnergyOverHorizon / years) / REF_KM; // $/km promedio

  // Desgaste por Uber: el mantenimiento base se reparte por km; el uso Uber lo
  // encarece según uberWearFactor sobre la porción de km de Uber.
  // Mantenimiento variable por km: usamos un supuesto de 20,000 km/año base para derivar $/km,
  // y aplicamos el factor de desgaste a la fracción de km de Uber.
  const ASSUMED_BASE_KM_YEAR = 20000;
  const maintCostPerKm = nonNegative(I.annualMaintenance) / ASSUMED_BASE_KM_YEAR;
  const maintCostPerUberKm = maintCostPerKm * (1 + nonNegative(I.uberWearFactor));

  // Fijos mensuales que NO dependen de km (todo menos energía y mantenimiento variable)
  const monthlyIns      = nonNegative(I.monthlyInsurance);
  const monthlyRefrendo = nonNegative(I.monthlyRefrendo);
  const monthlyData     = isUberMode ? nonNegative(I.dataPlan) : 0;
  const monthlyCarWash  = isUberMode ? nonNegative(I.carWash) : nonNegative(I.carWash) * 0.4;
  const monthlyTips     = isUberMode ? nonNegative(I.carWashTips) : 0;
  const monthlyMisc     = nonNegative(I.miscellaneous);
  const monthlyAccess   = isUberMode ? nonNegative(I.accessories) : 0;

  // Energía/mantenimiento de los km PERSONALES (fijos respecto a los viajes Uber)
  const personalEnergyMonthly = personalMonthlyKm * energyCostPerKm;
  const personalMaintMonthly  = personalMonthlyKm * maintCostPerKm;

  const monthlyFixedNonKm = monthlyIns + monthlyRefrendo + monthlyData + monthlyCarWash
                          + monthlyTips + monthlyMisc + monthlyAccess
                          + personalEnergyMonthly + personalMaintMonthly;

  const oneTimeUberCosts = isUberMode ? (nonNegative(I.toxicologyReport) + nonNegative(I.uberCertification)) : 0;
  // Costos de adquisición que pagas una vez al comprar: placas/alta, ISAN/tenencia
  // inicial, revisión mecánica (usados), cambio de propietario, etc.
  const acquisitionFees = nonNegative(I.acquisitionFees);
  const upfrontCash = cashPaid + openingFee + oneTimeUberCosts + acquisitionFees;

  const valueAtEnd = depreciatedValue(carPrice, I, years);
  const grossSalePrice = valueAtEnd * nonNegative(I.salesFactor);
  // Costo de venta al liquidar (comisión/agencia, trámite de traspaso).
  const sellingCostPct = clamp(I.sellingCostPct, 0, 0.5);
  const actualSalePrice = grossSalePrice * (1 - sellingCostPct);
  const monthAtEnd = Math.min(horizonMonths, months);
  const remainingDebt = (horizonMonths >= months || months === 0) ? 0 : (amort.rows[monthAtEnd - 1] ? amort.rows[monthAtEnd - 1].balance : 0);
  // Liquidación: lo que realmente recuperas al final (venta neta − deuda viva).
  const terminalRecovery = actualSalePrice - remainingDebt;
  const liquidationPosition = terminalRecovery;
  const finalPosition = terminalRecovery; // compat hacia atrás

  // Ingreso y costo variable POR VIAJE
  const grossPerTrip = nonNegative(I.avgFare);
  const uberCommissionRate = clamp(I.uberCommission, 0, 1);
  const taxRate = clamp(I.taxRate, 0, 1);
  const platformCommission = grossPerTrip * uberCommissionRate;
  const taxAmountPerTrip = grossPerTrip * taxRate;
  const afterUber = grossPerTrip - platformCommission;
  const netRevenuePerTrip = grossPerTrip - platformCommission - taxAmountPerTrip;
  const variableCostPerTrip = (energyCostPerKm + maintCostPerUberKm) * kmPerTrip;
  const netContributionPerTrip = netRevenuePerTrip - variableCostPerTrip;
  const netPerTrip = netRevenuePerTrip; // compat: ingreso neto antes de costo variable

  // Recuperación necesaria para que el proyecto completo se pague solo:
  // si la venta menos deuda no cubre el desembolso inicial, Uber debe generar
  // esa diferencia durante el horizonte. Si la venta la cubre, no se cobra extra.
  const projectRecoveryBase = isUberMode ? Math.max(0, upfrontCash - terminalRecovery) : 0;
  const projectRecoveryMonthly = projectRecoveryBase / horizonMonths;
  const upfrontRecoveryMonthly = projectRecoveryMonthly; // alias para compatibilidad

  const profitTarget = I.operationMode === 'uber-target-profit' ? nonNegative(I.monthlyProfitTarget) : 0;
  // Costos FIJOS mensuales a cubrir con la contribución por viaje:
  const operatingFixedMonthlyCosts = monthlyPayment + monthlyFixedNonKm;
  const fixedMonthlyCosts = operatingFixedMonthlyCosts + profitTarget + projectRecoveryMonthly;
  const operatingBreakEvenTrips = (isUberMode && netContributionPerTrip > 0) ? operatingFixedMonthlyCosts / netContributionPerTrip : 0;
  const breakEvenTrips = isUberMode ? (netContributionPerTrip > 0 ? fixedMonthlyCosts / netContributionPerTrip : Infinity) : 0;

  // Km realizados, derivados de los viajes resultantes (consistencia total)
  const uberMonthlyKm = isUberMode && Number.isFinite(breakEvenTrips) ? breakEvenTrips * kmPerTrip : 0;
  const monthlyKm = uberMonthlyKm + personalMonthlyKm;
  const totalDailyKm = monthlyKm / 30;
  const uberKm = uberMonthlyKm / 30;

  // Energía mensual realizada (para mostrar y para gráficas), con inflación por año
  const energyByYear = [];
  for (let y = 0; y < years; y++) energyByYear.push(calculateEnergyCost(I, monthlyKm, y));
  const yearOneEnergy = energyByYear[0] || { cost: 0, chargingTimePerDay: 0 };
  const avgMonthlyEnergy = energyByYear.reduce((a, e) => a + e.cost, 0) / years;

  // Mantenimiento mensual realizado (personal + uber con desgaste)
  const effectiveMaintenance = (personalMonthlyKm * maintCostPerKm + uberMonthlyKm * maintCostPerUberKm) * 12;
  const wearMultiplier = isUberMode && (personalMonthlyKm + uberMonthlyKm) > 0
    ? (personalMonthlyKm * maintCostPerKm + uberMonthlyKm * maintCostPerUberKm) / ((personalMonthlyKm + uberMonthlyKm) * maintCostPerKm)
    : 1;

  const monthlyFuel  = avgMonthlyEnergy;
  const monthlyMaint = effectiveMaintenance / 12;
  // Costo operativo y total mensual (ya con km consistentes)
  const monthlyOpCosts = monthlyFuel + monthlyIns + monthlyRefrendo + monthlyMaint + monthlyData + monthlyCarWash + monthlyTips + monthlyMisc + monthlyAccess;
  const monthlyTotalOperative = monthlyOpCosts + monthlyPayment;

  // --- EV: viabilidad por batería (audit fix #6) --------------------------
  // ¿Los km diarios de Uber caben en la energía utilizable de la batería por día,
  // dado el tiempo de carga disponible? Señala si la autonomía no alcanza.
  const isEV = I.vehicleType === 'electric';
  const usableKwh = nonNegative(I.batteryCapacityKwh) * 0.9; // 90% utilizable (margen de batería)
  const dailyRangeKm = isEV ? usableKwh * positive(I.kmPerKwh, 1) : Infinity;
  const evRangeShortfall = isEV && totalDailyKm > dailyRangeKm; // requiere recargar a mitad de jornada

  const chargingHoursPerDay = yearOneEnergy.chargingTimePerDay || 0;
  const maxHoursPerDay = nonNegative(I.maxHoursPerDay);
  const effectiveMaxHoursPerDay = Math.max(0, maxHoursPerDay - chargingHoursPerDay);
  const tripsPerHour = positive(I.tripsPerHour, 1);
  const workDaysPerMonth = positive(I.workDaysPerMonth, 1);
  const maxTripsMonth = tripsPerHour * effectiveMaxHoursPerDay * workDaysPerMonth;

  const tripsPerDay = isUberMode ? breakEvenTrips / workDaysPerMonth : 0;
  const hoursPerDay = isUberMode ? tripsPerDay / tripsPerHour : 0;
  const weeklyDays = workDaysPerMonth / 4.33;
  const hoursPerWeek = weeklyDays * hoursPerDay;

  const capacityUsage = isUberMode && maxTripsMonth > 0 ? breakEvenTrips / maxTripsMonth : 0;
  const tripsPerHourWarn = tripsPerHour > 4;
  const chargingExceedsAvailableHours = chargingHoursPerDay > maxHoursPerDay;
  const feasible = !isUberMode || (
    Number.isFinite(breakEvenTrips)
    && maxTripsMonth > 0            // sin horas/viajes disponibles no es viable (evita capacityUsage=0 vacuo)
    && capacityUsage <= 1
    && netContributionPerTrip > 0
    && !tripsPerHourWarn
    && !evRangeShortfall
    && !chargingExceedsAvailableHours
  );
  const safetyMargin = (isUberMode && netContributionPerTrip > 0 && Number.isFinite(breakEvenTrips))
    ? (maxTripsMonth - breakEvenTrips) * netContributionPerTrip
    : -fixedMonthlyCosts;

  // Inflación general de costos (seguro, refrendo, mantenimiento, misc, etc.) y
  // reserva de reparaciones que crece con la edad del auto (clave en usados).
  const generalInflation = Math.max(-0.5, num(I.generalInflation));
  const baseAgeYears = Math.max(0, 2026 - num(I.carYear, 2026));
  const repairBase = nonNegative(I.repairReserveAnnual);
  const repairGrowth = nonNegative(I.repairGrowth != null ? I.repairGrowth : 0.15);
  const repairReserveYear = (y) => repairBase * Math.pow(1 + repairGrowth, baseAgeYears + (y - 1));

  const loanMonthsInYear = (y) => { if (months === 0) return 0; const overlapEnd = Math.min(y*12, months); return Math.max(0, overlapEnd - (y-1)*12); };
  const cashflow = [];
  let cumRevenue = 0, cumCosts = 0, cCar = 0, cEnergy = 0, cInsRef = 0, cMaint = 0, cOther = 0, cTotal = 0;
  let totalRepairReserve = 0;
  for (let y = 1; y <= years; y++) {
    const infl = Math.pow(1 + generalInflation, y - 1);
    const yearPayment = loanMonthsInYear(y) * monthlyPayment;
    const yearEnergy = (energyByYear[y-1]?.cost || 0) * 12;                 // ya trae inflación de combustible
    // Seguro PLANO en nominal: en la práctica baja con el valor del auto, así que
    // inflarlo sería irreal. El refrendo/tenencia sí sigue la inflación. (audit fix)
    const yearInsRef = monthlyIns * 12 + monthlyRefrendo * 12 * infl;
    const yearRepair = repairReserveYear(y);
    const yearMaint = monthlyMaint * 12 * infl + yearRepair;
    const yearOther = (monthlyData + monthlyCarWash + monthlyTips + monthlyMisc + monthlyAccess) * 12 * infl;
    const yearUpfront = (y === 1) ? upfrontCash : 0;
    totalRepairReserve += yearRepair;
    cCar += yearPayment + yearUpfront; cEnergy += yearEnergy; cInsRef += yearInsRef; cMaint += yearMaint; cOther += yearOther;
    cTotal = cCar + cEnergy + cInsRef + cMaint + cOther;
    const yearOperating = yearEnergy + yearInsRef + yearMaint + yearOther;
    const annualRevenue = isUberMode && Number.isFinite(breakEvenTrips) ? breakEvenTrips * netPerTrip * 12 : 0;
    const annualCosts = yearOperating + yearPayment + yearUpfront;
    cumRevenue += annualRevenue; cumCosts += annualCosts;
    cashflow.push({
      year: 2025 + y, revenue: annualRevenue, costs: annualCosts, cumRevenue, cumCosts,
      depValue: depreciatedValue(carPrice, I, y),
      debtRemaining: (y*12 >= months || months === 0) ? 0 : (amort.rows[y*12 - 1] ? amort.rows[y*12 - 1].balance : 0),
      cCar: Math.round(cCar), cEnergy: Math.round(cEnergy), cInsRef: Math.round(cInsRef),
      cMaint: Math.round(cMaint), cOther: Math.round(cOther), cTotal: Math.round(cTotal),
    });
  }
  // Posición de liquidación por año = valor de venta neto ese año − deuda viva ese año.
  // Útil para que la gráfica de comparación incluya venta/deuda y no sólo flujo. (audit fix #comparison)
  const saleNetFactor = nonNegative(I.salesFactor) * (1 - sellingCostPct);
  cashflow.forEach(p => { p.liqValue = Math.round(p.depValue * saleNetFactor - p.debtRemaining); });

  const totalSpentGross = cTotal;
  // Costo neto del proyecto: gasto total MENOS lo que REALMENTE recuperas
  // (venta − deuda viva), no la venta completa. (audit fix #1)
  const totalProjectCost = totalSpentGross - terminalRecovery;
  // Resultado neto del proyecto: ingresos Uber + liquidación − todo lo gastado.
  const netProjectResult = cumRevenue + terminalRecovery - totalSpentGross;

  // ==========================================================================
  // INGENIERÍA ECONÓMICA: VPN, TIR, CAE, TCO, CAT y financiar-vs-contado
  // --------------------------------------------------------------------------
  // Tasa de oportunidad (costo de capital): lo que tu dinero rendiría en otro
  // lado. Es la tasa con la que se descuentan los flujos (NO la del crédito).
  const discountAnnual = clamp(I.discountRate, 0, 1);
  // Flujos ANUALES del comprador (− sale dinero, + entra). El desembolso inicial
  // va en t0; el último año suma la recuperación terminal (venta neta − deuda).
  const annualNet = cashflow.map((c, idx) => c.revenue - (c.costs - (idx === 0 ? upfrontCash : 0)));
  if (annualNet.length) annualNet[annualNet.length - 1] += terminalRecovery;
  const projectCashflows = [-upfrontCash, ...annualNet];
  const npvProject = npv(discountAnnual, projectCashflows);
  const irrProject = irr(projectCashflows);
  // Valor presente del COSTO total de propiedad (ignora ingresos: sirve para
  // comparar autos y formas de pago de forma homogénea).
  let pvLifetimeCost = upfrontCash;
  cashflow.forEach((c, i) => { pvLifetimeCost += (c.costs - (i === 0 ? upfrontCash : 0)) / Math.pow(1 + discountAnnual, i + 1); });
  pvLifetimeCost -= terminalRecovery / Math.pow(1 + discountAnnual, years);
  const eac = equivalentAnnualCost(pvLifetimeCost, discountAnnual, years); // costo anual equivalente

  // TCO nominal (sin descontar) = costo neto del proyecto. Por año y por km.
  const tcoTotal = totalProjectCost;
  const tcoPerYear = tcoTotal / years;
  const totalKmHorizon = monthlyKm * 12 * years;
  const costPerKm = totalKmHorizon > 0 ? tcoTotal / totalKmHorizon : NaN;
  // Depreciación como costo: pérdida de valor del auto (precio − valor de mercado
  // al final, ANTES de costos de venta; el costo de venta es transacción, no depreciación).
  const depreciationCost = carPrice - grossSalePrice;
  const financingCost = totalInterest + openingFee; // costo del crédito

  // CAT y tasa efectiva anual del crédito (incluye comisión de apertura).
  const ear = financed > 0 ? Math.pow(1 + interestRate/12, 12) - 1 : 0;
  const catMonthly = financed > 0 ? solvePeriodicRate(financed - openingFee, monthlyPayment, months) : 0;
  const cat = financed > 0 ? Math.pow(1 + catMonthly, 12) - 1 : 0;

  // ¿Financiar o pagar de contado? Comparación en valor presente a la tasa de
  // oportunidad. Positivo = financiar conviene (tu dinero rinde más que el crédito).
  // Tasa mensual EQUIVALENTE a la anual (mismo factor de descuento que VPN/CAE).
  const dM = Math.pow(1 + discountAnnual, 1/12) - 1;
  const pvPaymentsAtOpportunity = financed > 0 ? (dM === 0 ? monthlyPayment*months : monthlyPayment*(1-Math.pow(1+dM,-months))/dM) : 0;
  const pvFinancedPath = cashPaid + openingFee + pvPaymentsAtOpportunity;
  const pvCashPath = Math.max(0, carPrice - tradeInValue);
  const financeVsCashPV = pvCashPath - pvFinancedPath; // + → financiar conviene en VP
  const opportunityCostUpfront = upfrontCash * (Math.pow(1 + discountAnnual, years) - 1); // lo que rendiría el desembolso

  return {
    carPrice, cashPaid, financed, openingFee, oneTimeUberCosts, upfrontCash,
    monthlyPayment, totalInterest, totalPaidNominal: amort.totalPaid, pvTotal, fvTotal, timeValueOfMoney,
    months, amortRows: amort.rows, grossPerTrip, platformCommission, taxAmountPerTrip, afterUber, netPerTrip,
    netRevenuePerTrip, variableCostPerTrip, netContributionPerTrip, kmPerTrip,
    energyCostPerKm, maintCostPerKm, maintCostPerUberKm, upfrontRecoveryMonthly,
    projectRecoveryBase, projectRecoveryMonthly, operatingFixedMonthlyCosts, fixedMonthlyCosts, operatingBreakEvenTrips,
    monthlyFuel, monthlyIns, monthlyRefrendo, monthlyMaint, monthlyData, monthlyCarWash, monthlyTips, monthlyMisc, monthlyAccess,
    monthlyOpCosts, monthlyTotalOperative, monthlyFixedNonKm,
    breakEvenTrips, tripsPerDay, hoursPerDay, weeklyDays, hoursPerWeek, maxTripsMonth, capacityUsage, feasible, tripsPerHourWarn,
    safetyMargin, profitTarget, valueAtEnd, actualSalePrice, remainingDebt,
    finalPosition, liquidationPosition, terminalRecovery, netProjectResult, cumRevenue, cumCosts,
    cashflow, monthlyKm, uberKm, uberMonthlyKm, personalKm, personalMonthlyKm, totalDailyKm, isUberMode, chargingHoursPerDay, effectiveMaxHoursPerDay,
    isEV, usableKwh, dailyRangeKm, evRangeShortfall, chargingExceedsAvailableHours,
    yearOneEnergy, energyByYear, wearMultiplier, effectiveMaintenance, avgMonthlyEnergy, totalProjectCost, totalSpentGross,
    // Ingeniería económica + variables nuevas
    tradeInValue, acquisitionFees, sellingCostPct, grossSalePrice, generalInflation, totalRepairReserve, baseAgeYears,
    discountAnnual, npvProject, irrProject, pvLifetimeCost, eac, tcoTotal, tcoPerYear, totalKmHorizon, costPerKm,
    depreciationCost, financingCost, ear, cat, financeVsCashPV, pvFinancedPath, pvCashPath, opportunityCostUpfront,
  };
}

// Construye las variables de sensibilidad según el tipo de vehículo y el modo. (audit fix #sens)
function buildSensKeys(inputs) {
  const keys = [
    { key:'avgFare', label:'Tarifa por viaje', delta:0.20, uberOnly:true },
    { key:'uberCommission', label:'Comisión Uber', delta:0.20, uberOnly:true },
    { key:'taxRate', label:'Impuestos', delta:0.20, uberOnly:true },
    { key:'uberKmPerTrip', label:'Km por viaje', delta:0.20, uberOnly:true },
    { key:'interestRate', label:'Tasa de interés', delta:0.20 },
    { key:'carPrice', label:'Precio del auto', delta:0.15 },
    { key:'monthlyInsurance', label:'Seguro', delta:0.25 },
    { key:'annualMaintenance', label:'Mantenimiento', delta:0.30 },
    { key:'monthlyRefrendo', label:'Refrendo', delta:0.30 },
    { key:'miscellaneous', label:'Misceláneos', delta:0.40 },
    { key:'depreciationRate', label:'Depreciación', delta:0.25 },
    { key:'salesFactor', label:'Factor de venta', delta:0.15 },
    { key:'discountRate', label:'Tasa de descuento', delta:0.25 },
  ];
  // Variables de energía según el motor
  if (inputs.vehicleType === 'electric') {
    keys.push({ key:'electricityPrice', label:'Precio electricidad', delta:0.20 });
    keys.push({ key:'kmPerKwh', label:'Rendimiento km/kWh', delta:0.20 });
  } else if (inputs.vehicleType === 'diesel') {
    keys.push({ key:'dieselPrice', label:'Precio diésel', delta:0.20 });
    keys.push({ key:'kmpl', label:'Rendimiento km/L', delta:0.20 });
  } else if (inputs.vehicleType === 'hybrid') {
    keys.push({ key:'fuelPrice', label:'Combustible', delta:0.20 });
    keys.push({ key:'kmpl', label:'Rendimiento km/L', delta:0.20 });
    // La electricidad sólo afecta a un híbrido ENCHUFABLE; si no, el km eléctrico no aplica.
    if (inputs.plugInHybrid) keys.push({ key:'electricityPrice', label:'Precio electricidad', delta:0.20 });
  } else {
    keys.push({ key:'fuelPrice', label:'Combustible', delta:0.20 });
    keys.push({ key:'kmpl', label:'Rendimiento km/L', delta:0.20 });
  }
  return inputs.operationMode === 'no-uber' ? keys.filter(k => !k.uberOnly) : keys;
}

function sensitivity(inputs) {
  const uber = inputs.operationMode !== 'no-uber';
  // En modo Uber medimos el punto de equilibrio; sin Uber, el costo neto del proyecto.
  const metricOf = (I) => uber ? calculate(I).breakEvenTrips : calculate(I).totalProjectCost;
  const base = metricOf(inputs);
  const metricUnit = uber ? 'viajes' : 'MXN';
  return buildSensKeys(inputs).map(({ key, label, delta }) => {
    const lo = metricOf({ ...inputs, [key]: inputs[key]*(1-delta) });
    const hi = metricOf({ ...inputs, [key]: inputs[key]*(1+delta) });
    return { label, key, delta, metricUnit, low: Math.min(lo,hi)-base, high: Math.max(lo,hi)-base, range: Math.abs(hi-lo) };
  }).sort((a,b) => b.range - a.range);
}

function randomNormal(mean, std) {
  let u = 0, v = 0; while (u === 0) u = Math.random(); while (v === 0) v = Math.random();
  return mean + std * Math.sqrt(-2*Math.log(u)) * Math.cos(2*Math.PI*v);
}
function runMonteCarlo(inputs, iterations = 3000) {
  const results = [];
  const jitter = (val, pct, lo = -Infinity, hi = Infinity) => Math.min(hi, Math.max(lo, randomNormal(val, Math.abs(val) * pct)));
  for (let i = 0; i < iterations; i++) {
    const sim = { ...inputs,
      // Ingreso / plataforma
      avgFare: Math.max(50, jitter(inputs.avgFare, 0.12)),
      uberCommission: Math.min(0.5, Math.max(0.15, randomNormal(inputs.uberCommission, 0.02))),
      uberKmPerTrip: Math.max(1, jitter(inputs.uberKmPerTrip, 0.15)),
      tripsPerHour: Math.max(1, Math.min(4, randomNormal(inputs.tripsPerHour, 0.4))),
      // Energía (según motor)
      fuelPrice: Math.max(8, jitter(inputs.fuelPrice, 0.08)),
      dieselPrice: Math.max(8, jitter(inputs.dieselPrice, 0.08)),
      electricityPrice: Math.max(0.5, jitter(inputs.electricityPrice, 0.10)),
      kmPerKwh: Math.max(2, jitter(inputs.kmPerKwh, 0.10)),
      // Costos recurrentes
      annualMaintenance: Math.max(0, jitter(inputs.annualMaintenance, 0.25)),
      monthlyInsurance: Math.max(0, jitter(inputs.monthlyInsurance, 0.15)),
      monthlyRefrendo: Math.max(0, jitter(inputs.monthlyRefrendo, 0.20)),
      carWash: Math.max(0, jitter(inputs.carWash, 0.20)),
      miscellaneous: Math.max(0, jitter(inputs.miscellaneous, 0.35)),
      // Valor del activo
      depreciationRate: Math.min(0.5, Math.max(0.05, randomNormal(inputs.depreciationRate, 0.04))),
      salesFactor: Math.max(0.3, jitter(inputs.salesFactor, 0.12)),
    };
    const c = calculate(sim);
    results.push({ be:c.breakEvenTrips, feasible:c.feasible?1:0, finalPos:c.liquidationPosition, net:c.netProjectResult });
  }
  const beSorted = results.map(r=>r.be).filter(isFinite).sort((a,b)=>a-b);
  const fpSorted = results.map(r=>r.finalPos).sort((a,b)=>a-b);
  const netSorted = results.map(r=>r.net).filter(isFinite).sort((a,b)=>a-b);
  const feasibleRate = results.reduce((a,r)=>a+r.feasible,0)/results.length;
  const q = (arr,p) => arr.length ? arr[Math.floor(arr.length*p)] : NaN;
  const min = beSorted.length ? Math.min(...beSorted) : 0, max = beSorted.length ? Math.max(...beSorted) : 0;
  const bins = 24; const binSize = (max-min)/bins || 1;
  const hist = Array(bins).fill(0).map((_,i)=>({ rangeLabel: Math.round(min+i*binSize), count:0 }));
  beSorted.forEach(v => { const idx = Math.min(bins-1, Math.floor((v-min)/binSize)); hist[idx].count++; });
  return {
    feasibleRate,
    be: { p10:q(beSorted,0.1), p50:q(beSorted,0.5), p90:q(beSorted,0.9), mean: beSorted.length ? beSorted.reduce((a,b)=>a+b,0)/beSorted.length : NaN },
    fp: { p10:q(fpSorted,0.1), p50:q(fpSorted,0.5), p90:q(fpSorted,0.9), mean: fpSorted.reduce((a,b)=>a+b,0)/fpSorted.length },
    net: { p10:q(netSorted,0.1), p50:q(netSorted,0.5), p90:q(netSorted,0.9), mean: netSorted.reduce((a,b)=>a+b,0)/Math.max(1,netSorted.length) },
    hist, iterations,
  };
}

const DEFAULT_INPUTS = {
  carPreset:'kia_k3', carPrice:279900, carYear:2026, vehicleType:'gasoline',
  kmpl:18.5, kmPerKwh:6.0, batteryCapacityKwh:50, chargerPowerKw:7, hybridElectricFraction:0.3, plugInHybrid:false,
  carDescription:'', carJustification:'', carName:'',
  purchaseMode:'credit', downPaymentMode:'percent', downPaymentPct:0.20, downPaymentFixed:56000,
  cashAmount:100000, interestRate:0.135, loanMonths:48, openingFeePct:0.02,
  operationMode:'uber-breakeven', monthlyProfitTarget:5000,
  city:'mty', cityName:'Monterrey', avgFare:140, uberCommission:0.25, taxRate:0.30,
  tripsPerHour:3, maxHoursPerDay:8, workDaysPerMonth:22, personalKmDaily:20, uberWearFactor:0.30,
  uberKmPerTrip:8,
  fuelPrice:24.5, dieselPrice:26.0, electricityPrice:4.2, fuelInflation:0.06, electricityInflation:0.04,
  monthlyInsurance:2000, annualMaintenance:8000, monthlyRefrendo:500, dataPlan:400,
  carWash:800, carWashTips:400, miscellaneous:2000, accessories:100,
  toxicologyReport:400, uberCertification:900,
  horizonYears:4, depreciationRate:0.20, salesFactor:1.0, monthlyIncome:0,
  // --- Ingeniería económica y variables de decisión (nuevas) ---
  vehicleCondition:'new', odometerKm:0,
  depreciationMethod:'declining', firstYearDepreciation:0.25,
  discountRate:0.105,            // costo de oportunidad (≈ CETES). Tasa para VPN/CAE.
  generalInflation:0.045,        // inflación anual de costos no-energéticos
  repairReserveAnnual:0,         // reserva de reparaciones (sube en usados)
  repairGrowth:0.15,
  tradeInValue:0,                // auto a cuenta
  acquisitionFees:0,             // placas/alta/ISAN/revisión/traspaso
  sellingCostPct:0,              // costo de venta al liquidar
};

// ----------------------------------------------------------------------------
// buildAIPrompt  ·  Petición: generar un prompt para que una IA investigue un
// auto nuevo y devuelva un JSON ESTRUCTURADO con TODAS las variables, y que
// CITE UNA FUENTE POR CADA DATO en el bloque "sources" (fabricante, AMDA, INEGI,
// Profeco, CFE, aseguradoras, Uber MX, etc.). Las estimaciones se marcan
// [ESTIMACIÓN]. Así el usuario puede verificar que la info está respaldada.
// ----------------------------------------------------------------------------
function buildAIPrompt(carName) {
  return `Eres un investigador financiero. Necesito datos VERIFICADOS y con FUENTE para evaluar la viabilidad de un auto en plataforma Uber en México.

VEHÍCULO A INVESTIGAR: ${carName || '[ingresa el modelo aquí]'}

Reglas:
- Responde ÚNICAMENTE con un objeto JSON válido. Sin markdown, sin texto extra, sin comentarios.
- Para CADA dato numérico incluye su fuente dentro de "sources", usando EXACTAMENTE la misma llave del dato.
- Usa fuentes reputables: fabricante, AMDA, INEGI, Profeco, CFE, Hacienda/gobiernos estatales, Uber México, aseguradoras (GNP, Qualitas), o portales de seminuevos reconocidos.
- Si un dato NO es verificable, da una estimación conservadora y en su fuente escribe "[ESTIMACIÓN] " con el razonamiento.
- Precios en pesos MXN, sólo números (sin símbolos ni comas).

Esquema EXACTO:

\`\`\`json
{
  "vehicle": {
    "name": "Nombre completo del modelo y versión",
    "year": 2026,
    "condition": "new | used",
    "odometerKm": 0,
    "type": "gasoline | diesel | hybrid | electric",
    "plugInHybrid": false,
    "price": 280000,
    "kmpl": 18.5,
    "kmPerKwh": null,
    "batteryCapacityKwh": null,
    "chargerPowerKw": null,
    "description": "Descripción breve del vehículo",
    "justification": "3-4 razones por las que es (o no) buena opción"
  },
  "costs": {
    "monthlyInsurance": 2000,
    "annualMaintenance": 8000,
    "monthlyRefrendo": 500,
    "dataPlan": 400,
    "carWash": 800,
    "carWashTips": 400,
    "miscellaneous": 2000,
    "accessories": 100,
    "repairReserveAnnual": 0,
    "uberWearFactor": 0.30,
    "uberKmPerTrip": 8
  },
  "oneTime": { "toxicologyReport": 400, "uberCertification": 900, "acquisitionFees": 0 },
  "projection": { "depreciationMethod": "declining", "depreciationRate": 0.20, "firstYearDepreciation": 0.25, "salesFactor": 1.0, "sellingCostPct": 0.0, "interestRate": 0.135 },
  "sources": {
    "price": "URL fabricante o seminuevos (para usados, cita el precio de seminuevo del año y km)",
    "condition": "nuevo o usado según el precio cotizado",
    "odometerKm": "[ESTIMACIÓN] km típicos para ese año si es usado, si no 0",
    "kmpl": "URL ficha técnica / EPA / fabricante",
    "plugInHybrid": "URL ficha técnica que confirme si es híbrido enchufable; si no aplica, null",
    "kmPerKwh": "URL si aplica, si no null",
    "batteryCapacityKwh": "URL si aplica, si no null",
    "chargerPowerKw": "URL/estimación potencia de cargador doméstico recomendado (si EV/híbrido enchufable)",
    "monthlyInsurance": "URL aseguradora — si lo usarás en Uber cotiza póliza COMERCIAL (más cara)",
    "annualMaintenance": "URL costos de servicio del fabricante/taller",
    "repairReserveAnnual": "[ESTIMACIÓN] reserva de reparaciones/año; para usados fuera de garantía 5,000-15,000",
    "monthlyRefrendo": "URL gobierno del estado (el refrendo/tenencia varía por estado)",
    "dataPlan": "URL plan de datos típico",
    "carWash": "URL/estimación precio lavado x frecuencia mensual",
    "carWashTips": "[ESTIMACIÓN] propinas mensuales",
    "miscellaneous": "[ESTIMACIÓN] imprevistos/casetas/estacionamiento mensuales",
    "accessories": "[ESTIMACIÓN] cargador, soporte, etc. prorrateado",
    "uberWearFactor": "[ESTIMACIÓN] desgaste extra por uso intensivo 0.2-0.5",
    "uberKmPerTrip": "[ESTIMACIÓN] km promedio por viaje incl. traslado vacío (típico 6-12)",
    "depreciationMethod": "declining para autos (saldo decreciente); straight sólo si lo pide la tarea",
    "depreciationRate": "URL guía de depreciación / valor seminuevos (15-25% típico)",
    "firstYearDepreciation": "[ESTIMACIÓN] caída del 1er año si method=realistic (autos nuevos ~20-25%)",
    "salesFactor": "[ESTIMACIÓN] ajuste de reventa frente al valor calculado 0.7-1.1",
    "sellingCostPct": "[ESTIMACIÓN] costo de vender (comisión/traspaso) 0-5%",
    "interestRate": "URL banco — tasa de crédito (autos usados suelen ser más caros, 14-20%)",
    "toxicologyReport": "URL costo antidoping / requisitos Uber MX",
    "uberCertification": "URL requisitos de registro Uber MX",
    "acquisitionFees": "[ESTIMACIÓN] placas/alta/ISAN/revisión/traspaso al comprar"
  }
}
\`\`\`

Notas técnicas:
- gasolina/diésel: llena kmpl, deja kmPerKwh y batería en null.
- eléctrico: llena kmPerKwh y batería, deja kmpl en null.
- híbrido convencional: plugInHybrid=false, llena kmpl y deja datos eléctricos en null si no aplica.
- híbrido enchufable: plugInHybrid=true, llena kmpl, kmPerKwh, batería y cargador.
- monthlyInsurance, monthlyRefrendo, dataPlan, carWash, carWashTips, miscellaneous, accessories son MENSUALES.
- annualMaintenance es ANUAL.
- toxicologyReport y uberCertification son pagos ÚNICOS (una sola vez).

Recuerda: SOLO el JSON, con una fuente por cada dato en "sources".`;
}

function applyImportedJson(json, currentInputs) {
  const merged = { ...currentInputs };
  try {
    if (json.vehicle) {
      const v = json.vehicle; merged.carPreset = 'custom';
      if (v.name) merged.carName = v.name;   // guardar nombre real del auto importado (audit fix)
      if (v.type) merged.vehicleType = v.type;
      if (v.plugInHybrid != null) merged.plugInHybrid = !!v.plugInHybrid;
      if (v.price != null) merged.carPrice = +v.price;
      if (v.year != null) merged.carYear = +v.year;
      if (v.kmpl != null) merged.kmpl = +v.kmpl;
      if (v.kmPerKwh != null) merged.kmPerKwh = +v.kmPerKwh;
      if (v.batteryCapacityKwh != null) merged.batteryCapacityKwh = +v.batteryCapacityKwh;
      if (v.chargerPowerKw != null) merged.chargerPowerKw = +v.chargerPowerKw;
      if (v.condition === 'used' || v.condition === 'new') merged.vehicleCondition = v.condition;
      if (v.odometerKm != null) merged.odometerKm = +v.odometerKm;
      if (v.description) merged.carDescription = v.description;
      if (v.justification) merged.carJustification = v.justification;
    }
    if (json.costs) {
      const c = json.costs;
      if (c.monthlyInsurance != null) merged.monthlyInsurance = +c.monthlyInsurance;
      if (c.annualMaintenance != null) merged.annualMaintenance = +c.annualMaintenance;
      if (c.monthlyRefrendo != null) merged.monthlyRefrendo = +c.monthlyRefrendo;
      if (c.dataPlan != null) merged.dataPlan = +c.dataPlan;
      if (c.carWash != null) merged.carWash = +c.carWash;
      if (c.carWashTips != null) merged.carWashTips = +c.carWashTips;
      if (c.miscellaneous != null) merged.miscellaneous = +c.miscellaneous;
      if (c.accessories != null) merged.accessories = +c.accessories;
      if (c.repairReserveAnnual != null) merged.repairReserveAnnual = +c.repairReserveAnnual;
      if (c.uberWearFactor != null) merged.uberWearFactor = +c.uberWearFactor;
      if (c.uberKmPerTrip != null) merged.uberKmPerTrip = +c.uberKmPerTrip;
    }
    if (json.oneTime) {
      const o = json.oneTime;
      if (o.toxicologyReport != null) merged.toxicologyReport = +o.toxicologyReport;
      if (o.uberCertification != null) merged.uberCertification = +o.uberCertification;
      if (o.acquisitionFees != null) merged.acquisitionFees = +o.acquisitionFees;
    }
    if (json.projection) {
      const p = json.projection;
      if (p.depreciationMethod) merged.depreciationMethod = p.depreciationMethod;
      if (p.depreciationRate != null) merged.depreciationRate = +p.depreciationRate;
      if (p.firstYearDepreciation != null) merged.firstYearDepreciation = +p.firstYearDepreciation;
      if (p.salesFactor != null) merged.salesFactor = +p.salesFactor;
      if (p.sellingCostPct != null) merged.sellingCostPct = +p.sellingCostPct;
      if (p.interestRate != null) merged.interestRate = +p.interestRate;
    }
    const sources = json.sources && typeof json.sources === 'object' ? json.sources : null;
    return { ok:true, inputs:merged, sources };
  } catch (e) { return { ok:false, error:e.message }; }
}

// ----------------------------------------------------------------------------
// COMPONENTE Field  ·  Cumple la petición: "slider + campo manual editable"
// "No elimines los sliders, sólo hazlos más flexibles." Cada campo tiene:
//   - un input de texto donde se puede escribir CUALQUIER valor (incluso fuera
//     del rango del slider), y ese valor real es el que se usa en los cálculos;
//   - el slider para mover rápido; si el valor cae fuera del min/max del slider,
//     el thumb se pinta en ámbar (clase out-of-range) como aviso visual.
// ----------------------------------------------------------------------------
const Field = ({ label, value, min, max, step, onChange, unit, info, decimals = 0, suffix }) => {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');
  const outOfRange = value < min || value > max;
  const displayValue = focused ? draft : (decimals > 0 ? Number(value).toFixed(decimals) : String(Math.round(value*1000)/1000));
  const commit = () => { const n = parseFloat(draft.replace(/,/g,'')); if (!isNaN(n)) onChange(n); setFocused(false); };
  return (
    <div className="field">
      <div className="field-row">
        <span className="field-label">{label}{info && <Info text={info} />}</span>
        <input type="text" className="field-input" value={displayValue}
          onFocus={() => { setDraft(String(value)); setFocused(true); }}
          onChange={e => setDraft(e.target.value)} onBlur={commit}
          onKeyDown={e => { if (e.key==='Enter') e.target.blur(); if (e.key==='Escape') { setDraft(String(value)); setFocused(false); } }} />
      </div>
      <input className={`slider${outOfRange ? ' out-of-range' : ''}`} type="range" min={min} max={max} step={step}
        value={Math.min(max, Math.max(min, value))} onChange={e => onChange(parseFloat(e.target.value))}
        title={outOfRange ? `Valor fuera del rango del slider (${min}-${max}). El valor real (${value}) se usa en los cálculos.` : ''} />
      {(unit || suffix) && (<div style={{ fontSize:10, color:'var(--muted)', marginTop:2, textAlign:'right', fontFamily:'JetBrains Mono, monospace' }}>{suffix || unit}</div>)}
    </div>
  );
};
const Group = ({ icon: Icon, title, children, defaultOpen = true, blurb }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="group">
      <div className="group-title" onClick={() => setOpen(!open)}>
        <span className="group-title-l">{Icon && <Icon size={11} />}{title}</span>
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
      </div>
      {open && blurb && <div className="group-blurb">{blurb}</div>}
      {open && children}
    </div>
  );
};
const Segmented = ({ options, value, onChange }) => (
  <div className="seg">{options.map(o => (<button key={o.value} className={value===o.value ? 'active' : ''} onClick={() => onChange(o.value)}>{o.label}</button>))}</div>
);

// ============================================================================
// PANEL LATERAL (SIDEBAR)  ·  Objetivos solicitados por el usuario
// ----------------------------------------------------------------------------
// Es donde se capturan TODAS las variables. Consolida muchas peticiones:
//   MODOS:
//     - Compra: efectivo / crédito / mixto (3 opciones).
//     - Operación: "que se pague solo" (break-even) / "ganar X al mes" / "sin Uber".
//     - Enganche: por porcentaje O por monto fijo (toggle).
//     - Tipo de motor: gasolina / diésel / híbrido / eléctrico, con costos de
//       energía propios; EV/híbrido enchufable agregan tiempo de carga que descuenta horas.
//   FLEXIBILIDAD DE CAPTURA (petición clave):
//     - "Todos los campos con slider también permiten escribir el valor manual."
//     - "El slider sigue, pero puedo capturar un valor FUERA del rango si lo
//       necesito" → ver componente Field: el input manual acepta cualquier número
//       y el slider se marca en ámbar (out-of-range) sin recortar el valor real.
//   CIUDAD: dropdown de presets + campo de texto editable para escribir la ciudad.
//   VARIABLES NUEVAS pedidas (todas interconectadas con el motor de cálculo):
//     - Seguro MENSUAL (default $2,000, con nota de que sube por póliza Uber).
//     - Refrendo/tenencia mensual (default $500).
//     - Lavado ($800) y propinas ($400) por separado. Misceláneos ($2,000).
//     - Pagos iniciales ÚNICOS: examen toxicológico ($400) y certificación Uber ($900).
//     - Km personales aparte de los de Uber + factor de desgaste extra por Uber.
//     - Inflación anual de combustible y de electricidad.
//   INGRESO mensual: campo OPCIONAL (si es 0 se ignora).
//   AYUDA: lenguaje técnico PERO con explicaciones vía tooltips (ícono ? al hover)
//          y blurbs cortos, para no ocupar mucho espacio visual.
// ============================================================================
const Sidebar = ({ inputs, setInputs, onReset, onSave }) => {
  const set = (k, v) => setInputs(prev => ({ ...prev, [k]: v }));
  const applyCarPreset = (k) => {
    if (k === 'custom') { setInputs(prev => ({ ...prev, carPreset:'custom' })); return; }
    const c = CAR_PRESETS[k];
    setInputs(prev => {
      const next = { ...prev, carPreset:k, carPrice:c.price, kmpl:c.kmpl||prev.kmpl, vehicleType:c.type,
        plugInHybrid:!!c.plugInHybrid, kmPerKwh:c.kmPerKwh||prev.kmPerKwh, batteryCapacityKwh:c.batteryCapacityKwh||prev.batteryCapacityKwh };
      const cond = c.condition || 'new';
      next.vehicleCondition = cond;
      next.carYear = c.year || 2026;
      next.odometerKm = c.odometerKm || 0;
      if (cond === 'used') { if (!prev.repairReserveAnnual) next.repairReserveAnnual = 6000; if (prev.interestRate <= 0.135) next.interestRate = 0.16; }
      else if (prev.repairReserveAnnual === 6000) { next.repairReserveAnnual = 0; }
      return next;
    });
  };
  const applyCityPreset = (k) => {
    const c = CITY_PRESETS[k];
    setInputs(prev => ({ ...prev, city:k, cityName:c.name, avgFare:c.fare, fuelPrice:c.fuel, electricityPrice:c.electricity }));
  };
  // Cambiar entre nuevo/usado ajusta supuestos típicos (sólo si siguen en su default,
  // para no pisar valores que el usuario ya editó a mano).
  const applyCondition = (cond) => setInputs(prev => {
    const next = { ...prev, vehicleCondition: cond };
    if (cond === 'used') {
      if (!prev.repairReserveAnnual) next.repairReserveAnnual = 6000;   // los usados sí tienen reparaciones
      if (prev.depreciationMethod === 'straight') next.depreciationMethod = 'declining';
      if (prev.interestRate <= 0.135) next.interestRate = 0.16;         // crédito de usado suele ser más caro
    } else {
      if (prev.repairReserveAnnual === 6000) next.repairReserveAnnual = 0;
      next.odometerKm = 0;
    }
    return next;
  });
  const isPlugInHybrid = inputs.vehicleType === 'hybrid' && !!inputs.plugInHybrid;
  const usesElectricDrive = inputs.vehicleType === 'electric' || isPlugInHybrid;
  // Combustible líquido incluye DIÉSEL (antes lo excluía y ocultaba sus campos). (audit fix #4)
  const usesLiquidFuel = inputs.vehicleType === 'gasoline' || inputs.vehicleType === 'diesel' || inputs.vehicleType === 'hybrid';
  const usesGas = usesLiquidFuel; // alias para compatibilidad con el resto del JSX
  return (
    <aside className="sidebar">
      <div className="brand-row"><div><div className="brand">Auto<em>·</em>Pilot</div><div className="brand-sub">¿Conviene comprar un auto?</div></div></div>
      <div style={{ display:'flex', gap:4, marginBottom:18 }}>
        <button className="btn outline" style={{ flex:1, fontSize:11 }} onClick={onSave}><Save size={11} /> Guardar escenario</button>
        <button className="btn ghost" onClick={onReset} title="Resetear"><RotateCcw size={12} /></button>
      </div>

      <Group icon={Settings} title="¿Qué quieres analizar?" blurb="Define el objetivo de tu análisis.">
        <Segmented value={inputs.operationMode} onChange={v => set('operationMode', v)}
          options={[{value:'uber-breakeven',label:'Que se pague solo'},{value:'uber-target-profit',label:'Ganar X al mes'},{value:'no-uber',label:'Sin Uber'}]} />
        <div style={{ fontSize:10.5, color:'var(--muted)', marginTop:-2, marginBottom:8, lineHeight:1.5 }}>
          {inputs.operationMode==='uber-breakeven' && '→ Calculamos lo mínimo que debes trabajar para que el proyecto completo se pague solo.'}
          {inputs.operationMode==='uber-target-profit' && '→ Calculamos cuánto trabajar para que el proyecto se pague y además te dé la ganancia que defines.'}
          {inputs.operationMode==='no-uber' && '→ Sólo calculamos cuánto cuesta tener el auto (sin generar ingresos).'}
        </div>
        {inputs.operationMode==='uber-target-profit' && (
          <Field label="Ganancia mensual que quieres" value={inputs.monthlyProfitTarget} min={0} max={30000} step={500}
            onChange={v => set('monthlyProfitTarget', v)} suffix="MXN/mes" info="Cuánto quieres ganar al mes por encima de cubrir los gastos del auto." />
        )}
      </Group>

      <Group icon={Car} title="Tu vehículo" blurb="Elige un auto preconfigurado o personalízalo (incluye tu auto actual).">
        <div className="field"><div className="field-label" style={{ marginBottom:4 }}>Modelo</div>
          <select className="select" value={inputs.carPreset} onChange={e => applyCarPreset(e.target.value)}>
            {Object.entries(CAR_PRESETS).map(([k,c]) => <option key={k} value={k}>{c.name}</option>)}
          </select></div>
        <div className="field"><div className="field-label" style={{ marginBottom:4 }}>Tipo de motor <Info text={TIPS.vehicleType} /></div>
          <Segmented value={inputs.vehicleType} onChange={v => set('vehicleType', v)}
            options={[{value:'gasoline',label:'Gasolina'},{value:'diesel',label:'Diésel'},{value:'hybrid',label:'Híbrido'},{value:'electric',label:'Eléctrico'}]} /></div>
        <div className="field"><div className="field-label" style={{ marginBottom:4 }}>Condición <Info text={TIPS.vehicleCondition} /></div>
          <Segmented value={inputs.vehicleCondition || 'new'} onChange={v => applyCondition(v)}
            options={[{value:'new',label:'Nuevo'},{value:'used',label:'Usado / seminuevo'}]} /></div>
        <Field label="Precio del auto" value={inputs.carPrice} min={50000} max={1500000} step={1000} onChange={v => set('carPrice', v)} suffix="MXN" info="Auto nuevo, usado, o el que ya tienes. Puedes escribir cualquier monto." />
        <Field label="Año modelo" value={inputs.carYear} min={2000} max={2027} step={1} onChange={v => set('carYear', v)} suffix={inputs.carYear < 2026 ? `≈${Math.max(0,2026-inputs.carYear)} años de antigüedad` : 'nuevo'} />
        {inputs.vehicleCondition==='used' && (<>
          <Field label="Kilometraje actual" value={inputs.odometerKm} min={0} max={300000} step={1000} onChange={v => set('odometerKm', v)} suffix="km en el odómetro" info="Km que ya trae el auto. Más km = más cerca de reparaciones mayores; ajusta la reserva de reparaciones." />
          <div className="field-note">Para usados, abre <strong>Ingeniería financiera</strong> y sube la <strong>reserva de reparaciones</strong>; usa método de depreciación <strong>Saldo decreciente</strong> sobre el precio ya rebajado.</div>
        </>)}
        {usesGas && <Field label="Rendimiento" value={inputs.kmpl} min={5} max={40} step={0.1} decimals={1} onChange={v => set('kmpl', v)} suffix="km por litro" info="Kilómetros por litro. Más alto = más eficiente." />}
        {inputs.vehicleType==='hybrid' && (
          <div className="field" style={{ marginTop:4 }}>
            <label style={{ display:'flex', alignItems:'flex-start', gap:8, fontSize:12, color:'var(--ink-2)', cursor:'pointer' }}>
              <input type="checkbox" checked={!!inputs.plugInHybrid} onChange={e => set('plugInHybrid', e.target.checked)} style={{ marginTop:2 }} />
              <span>Híbrido enchufable <Info text="Actívalo sólo si el híbrido se carga con enchufe. Un híbrido convencional usa gasolina y no consume tiempo de carga." /></span>
            </label>
          </div>
        )}
        {usesElectricDrive && (<>
          <Field label="Rendimiento eléctrico" value={inputs.kmPerKwh} min={2} max={12} step={0.1} decimals={1} onChange={v => set('kmPerKwh', v)} suffix="km por kWh" />
          <Field label="Capacidad batería" value={inputs.batteryCapacityKwh} min={5} max={150} step={1} onChange={v => set('batteryCapacityKwh', v)} suffix="kWh" />
          <Field label="Potencia cargador casero" value={inputs.chargerPowerKw} min={1.5} max={50} step={0.5} decimals={1} onChange={v => set('chargerPowerKw', v)} suffix="kW" info="1.8 kW (contacto normal), 7 kW (instalación dedicada), 11+ kW (rápido casero)." />
          {isPlugInHybrid && <Field label="Fracción en modo eléctrico" value={inputs.hybridElectricFraction} min={0} max={1} step={0.05} decimals={2} onChange={v => set('hybridElectricFraction', v)} suffix={`${fmtPct(inputs.hybridElectricFraction,0)} del tiempo en eléctrico`} />}
        </>)}
      </Group>

      <Group icon={Wallet} title="¿Cómo lo pagas?" blurb="Si ya lo tienes pagado, elige 'Efectivo'. Si lo financias, 'Crédito'.">
        <div className="field"><div className="field-label" style={{ marginBottom:4 }}>Forma de pago <Info text={TIPS.purchaseMode} /></div>
          <Segmented value={inputs.purchaseMode} onChange={v => set('purchaseMode', v)}
            options={[{value:'cash',label:'Efectivo'},{value:'credit',label:'Crédito'},{value:'hybrid',label:'Mixto'}]} /></div>
        {inputs.purchaseMode==='credit' && (<>
          <div className="field"><div className="field-label" style={{ marginBottom:4 }}>Forma del enganche</div>
            <Segmented value={inputs.downPaymentMode} onChange={v => set('downPaymentMode', v)} options={[{value:'percent',label:'Por porcentaje'},{value:'fixed',label:'Monto fijo'}]} /></div>
          {inputs.downPaymentMode==='percent'
            ? <Field label="Enganche" value={inputs.downPaymentPct} min={0.05} max={0.6} step={0.01} decimals={2} onChange={v => set('downPaymentPct', v)} suffix={`${fmtPct(inputs.downPaymentPct,0)} del precio`} />
            : <Field label="Enganche (monto)" value={inputs.downPaymentFixed} min={10000} max={500000} step={1000} onChange={v => set('downPaymentFixed', v)} suffix="MXN" />}
        </>)}
        {inputs.purchaseMode==='hybrid' && <Field label="Pago inicial en efectivo" value={inputs.cashAmount} min={0} max={2000000} step={1000} onChange={v => set('cashAmount', v)} suffix="MXN (el resto se financia)" />}
        {inputs.purchaseMode!=='cash' && (<>
          <Field label="Tasa de interés anual" value={inputs.interestRate} min={0.03} max={0.40} step={0.001} decimals={3} onChange={v => set('interestRate', v)} suffix={`${fmtPct(inputs.interestRate,1)} anual`} info="Créditos automotrices típicos: 10% a 18% anual (usados suelen ser más caros)." />
          <Field label="Plazo del crédito" value={inputs.loanMonths} min={6} max={84} step={6} onChange={v => set('loanMonths', v)} suffix="meses" />
          <Field label="Comisión de apertura" value={inputs.openingFeePct} min={0} max={0.10} step={0.001} decimals={3} onChange={v => set('openingFeePct', v)} suffix={fmtPct(inputs.openingFeePct,1)} info={TIPS.openingFee} />
        </>)}
        <Field label="Auto a cuenta (trade-in)" value={inputs.tradeInValue} min={0} max={800000} step={5000} onChange={v => set('tradeInValue', v)} suffix={inputs.tradeInValue>0 ? `${fmtMXN(inputs.tradeInValue)} a cuenta` : 'Opcional · entregas tu auto actual'} info={TIPS.tradeIn} />
        <Field label="Gastos de adquisición" value={inputs.acquisitionFees} min={0} max={100000} step={500} onChange={v => set('acquisitionFees', v)} suffix="MXN (placas, alta, ISAN, traspaso)" info={TIPS.acquisitionFees} />
      </Group>

      {inputs.operationMode!=='no-uber' && (
        <Group icon={MapPin} title="Operación Uber" blurb="Los presets ajustan tarifa y precios por ciudad. Puedes sobreescribir cualquier valor.">
          <div className="field"><div className="field-label" style={{ marginBottom:4 }}>Ciudad (preset)</div>
            <select className="select" value={inputs.city} onChange={e => applyCityPreset(e.target.value)}>{Object.entries(CITY_PRESETS).map(([k,c]) => <option key={k} value={k}>{c.name}</option>)}</select></div>
          <div className="field"><div className="field-label" style={{ marginBottom:4 }}>Nombre de la ciudad</div>
            <input className="input" type="text" value={inputs.cityName} onChange={e => set('cityName', e.target.value)} placeholder="Escribe tu ciudad" /></div>
          <Field label="Tarifa promedio por viaje" value={inputs.avgFare} min={50} max={500} step={5} onChange={v => set('avgFare', v)} suffix="MXN por viaje" info="Cuánto te pagan en promedio por viaje (antes de comisión)." />
          <Field label="Comisión Uber" value={inputs.uberCommission} min={0.10} max={0.40} step={0.01} decimals={2} onChange={v => set('uberCommission', v)} suffix={`Uber se queda ${fmtPct(inputs.uberCommission,0)}`} info={TIPS.uberCommission} />
          <Field label="Impuestos" value={inputs.taxRate} min={0} max={0.45} step={0.01} decimals={2} onChange={v => set('taxRate', v)} suffix={`${fmtPct(inputs.taxRate,0)} al SAT`} info={TIPS.tax} />
          <Field label="Viajes por hora" value={inputs.tripsPerHour} min={0.5} max={5} step={0.1} decimals={1} onChange={v => set('tripsPerHour', v)} suffix={inputs.tripsPerHour>4 ? '⚠️ Máx. 4 según el problema' : 'viajes/hora'} info="El problema asume un tope realista de 4 viajes por hora." />
          <Field label="Horas máx. disponibles/día" value={inputs.maxHoursPerDay} min={1} max={16} step={0.5} decimals={1} onChange={v => set('maxHoursPerDay', v)} suffix="horas/día" />
          <Field label="Días trabajados al mes" value={inputs.workDaysPerMonth} min={1} max={31} step={1} onChange={v => set('workDaysPerMonth', v)} suffix="días" />
          <Field label="Km por viaje (incl. traslados)" value={inputs.uberKmPerTrip} min={1} max={40} step={0.5} decimals={1} onChange={v => set('uberKmPerTrip', v)} suffix="km/viaje" info="Kilómetros que recorres por cada viaje, incluyendo el traslado para recoger al pasajero. Conecta los viajes con el gasto de combustible y mantenimiento." />
          <div className="field-note">El punto de equilibrio Uber incluye la recuperación del proyecto completo: costos mensuales más el desembolso inicial que no quede cubierto por la venta final del auto menos la deuda.</div>
        </Group>
      )}

      {inputs.operationMode!=='no-uber' && (
        <Group icon={Receipt} title="Pagos iniciales únicos" blurb="Trámites que pagas UNA sola vez para darte de alta en Uber.">
          <Field label="Examen toxicológico" value={inputs.toxicologyReport} min={0} max={3000} step={50} onChange={v => set('toxicologyReport', v)} suffix="MXN (una vez)" info={TIPS.toxicology} />
          <Field label="Certificación inicial Uber" value={inputs.uberCertification} min={0} max={5000} step={50} onChange={v => set('uberCertification', v)} suffix="MXN (una vez)" info={TIPS.certification} />
        </Group>
      )}

      <Group icon={Building2} title="Uso personal y desgaste" blurb="Si usarás el auto también para tu vida normal (no Uber), agrégalo aquí.">
        <Field label="Km personales/día" value={inputs.personalKmDaily} min={0} max={200} step={1} onChange={v => set('personalKmDaily', v)} suffix="km/día (no Uber)" />
        {inputs.operationMode!=='no-uber' && <Field label="Desgaste extra por Uber" value={inputs.uberWearFactor} min={0} max={1.5} step={0.05} decimals={2} onChange={v => set('uberWearFactor', v)} suffix={`+${fmtPct(inputs.uberWearFactor,0)} mantenimiento`} info={TIPS.wear} />}
      </Group>

      <Group icon={Fuel} title="Costos recurrentes" blurb="Gastos que tienes mes a mes (o cada año) por tener el auto.">
        {usesGas && <Field label={inputs.vehicleType==='diesel' ? 'Precio del diésel' : 'Precio de gasolina'} value={inputs.vehicleType==='diesel' ? inputs.dieselPrice : inputs.fuelPrice} min={10} max={60} step={0.1} decimals={2} onChange={v => set(inputs.vehicleType==='diesel' ? 'dieselPrice' : 'fuelPrice', v)} suffix="MXN por litro" />}
        {usesElectricDrive && <Field label="Precio de electricidad" value={inputs.electricityPrice} min={0.5} max={20} step={0.1} decimals={2} onChange={v => set('electricityPrice', v)} suffix="MXN por kWh" />}
        <Field label="Inflación combustible/año" value={inputs.fuelInflation} min={0} max={0.30} step={0.005} decimals={3} onChange={v => set('fuelInflation', v)} suffix={`+${fmtPct(inputs.fuelInflation,1)} cada año`} info={TIPS.fuelInflation} />
        {usesElectricDrive && <Field label="Inflación electricidad/año" value={inputs.electricityInflation} min={0} max={0.30} step={0.005} decimals={3} onChange={v => set('electricityInflation', v)} suffix={`+${fmtPct(inputs.electricityInflation,1)} cada año`} />}
        <Field label="Seguro mensual" value={inputs.monthlyInsurance} min={300} max={8000} step={50} onChange={v => set('monthlyInsurance', v)} suffix="MXN/mes" info={TIPS.insurance} />
        {inputs.operationMode!=='no-uber' && <div className="field-note">⚠️ Si usas el auto para Uber, muchas aseguradoras exigen una <strong>póliza comercial</strong> más cara que la de un auto particular. Por eso el default ya está en $2,000/mes.</div>}
        <Field label="Mantenimiento base anual" value={inputs.annualMaintenance} min={1000} max={60000} step={500} onChange={v => set('annualMaintenance', v)} suffix="MXN/año a 20,000 km" info={TIPS.maintenance} />
        <Field label="Refrendo / Tenencia" value={inputs.monthlyRefrendo} min={0} max={5000} step={50} onChange={v => set('monthlyRefrendo', v)} suffix="MXN/mes" info={TIPS.refrendo} />
        <Field label="Datos móviles" value={inputs.dataPlan} min={0} max={3000} step={50} onChange={v => set('dataPlan', v)} suffix="MXN/mes" />
        <Field label="Lavado de auto" value={inputs.carWash} min={0} max={3000} step={50} onChange={v => set('carWash', v)} suffix="MXN/mes" info={TIPS.carWash} />
        <Field label="Propinas (lavado/servicio)" value={inputs.carWashTips} min={0} max={2000} step={25} onChange={v => set('carWashTips', v)} suffix="MXN/mes" info={TIPS.tips} />
        <Field label="Misceláneos / imprevistos" value={inputs.miscellaneous} min={0} max={10000} step={100} onChange={v => set('miscellaneous', v)} suffix="MXN/mes" info={TIPS.misc} />
        <Field label="Accesorios/gadgets" value={inputs.accessories} min={0} max={2000} step={25} onChange={v => set('accessories', v)} suffix="MXN/mes" />
      </Group>

      <Group icon={Calculator} title="Ingeniería financiera" defaultOpen={false} blurb="El corazón del análisis: tasa de oportunidad para VPN/CAE e inflación de costos.">
        <Field label="Tasa de descuento (oportunidad)" value={inputs.discountRate} min={0} max={0.30} step={0.005} decimals={3} onChange={v => set('discountRate', v)} suffix={`${fmtPct(inputs.discountRate,1)} anual · CETES ≈ 10-11%`} info={TIPS.discountRate} />
        <Field label="Inflación general de costos" value={inputs.generalInflation} min={0} max={0.20} step={0.005} decimals={3} onChange={v => set('generalInflation', v)} suffix={`+${fmtPct(inputs.generalInflation,1)} cada año`} info={TIPS.generalInflation} />
        <Field label="Reserva de reparaciones/año" value={inputs.repairReserveAnnual} min={0} max={60000} step={500} onChange={v => set('repairReserveAnnual', v)} suffix={inputs.repairReserveAnnual>0 ? `${fmtMXN(inputs.repairReserveAnnual)}/año (crece con la edad)` : 'Opcional · súbelo para usados'} info={TIPS.repairReserve} />
      </Group>

      <Group icon={TrendingUp} title="Proyección y venta" defaultOpen={false} blurb="Cómo proyectamos el valor del auto a futuro.">
        <Field label="Horizonte de análisis" value={inputs.horizonYears} min={1} max={15} step={1} onChange={v => set('horizonYears', v)} suffix="años" />
        <div className="field"><div className="field-label" style={{ marginBottom:4 }}>Método de depreciación <Info text={TIPS.depreciationMethod} /></div>
          <Segmented value={inputs.depreciationMethod || 'declining'} onChange={v => set('depreciationMethod', v)}
            options={[{value:'declining',label:'Saldo decreciente'},{value:'straight',label:'Lineal'},{value:'realistic',label:'Realista'}]} /></div>
        <Field label="Depreciación anual" value={inputs.depreciationRate} min={0.02} max={0.50} step={0.01} decimals={2} onChange={v => set('depreciationRate', v)} suffix={`${fmtPct(inputs.depreciationRate,0)} ${inputs.depreciationMethod==='straight'?'del precio original':'del valor restante'}/año`} info={TIPS.depreciation} />
        {inputs.depreciationMethod==='realistic' && <Field label="Caída del primer año" value={inputs.firstYearDepreciation} min={0.05} max={0.5} step={0.01} decimals={2} onChange={v => set('firstYearDepreciation', v)} suffix={`−${fmtPct(inputs.firstYearDepreciation,0)} al salir de la agencia`} />}
        <div style={{ fontSize:10.5, color:'var(--muted)', marginTop:-6, marginBottom:10, lineHeight:1.5 }}>
          {inputs.depreciationMethod==='declining' && `Saldo decreciente (lo más realista): cada año pierde ${fmtPct(inputs.depreciationRate,0)} del valor restante. `}
          {inputs.depreciationMethod==='straight' && `Lineal: resta el mismo monto cada año; en ${Math.floor(1/Math.max(0.01,inputs.depreciationRate))} años llegaría a $0. `}
          {inputs.depreciationMethod==='realistic' && `Realista: −${fmtPct(inputs.firstYearDepreciation,0)} el primer año, luego ${fmtPct(inputs.depreciationRate,0)} de saldo decreciente. `}
          En {inputs.horizonYears} años conservaría ≈{fmtPct(depreciatedValue(1, inputs, inputs.horizonYears),0)} del precio.
        </div>
        <Field label="Factor venta real" value={inputs.salesFactor} min={0.3} max={2.0} step={0.01} decimals={2} onChange={v => set('salesFactor', v)} suffix={`${inputs.salesFactor.toFixed(2)}× del valor calculado`} info={TIPS.salesFactor} />
        <Field label="Costo de venta al liquidar" value={inputs.sellingCostPct} min={0} max={0.15} step={0.005} decimals={3} onChange={v => set('sellingCostPct', v)} suffix={`${fmtPct(inputs.sellingCostPct,1)} (comisión/traspaso)`} info={TIPS.sellingCost} />
      </Group>

      <Group icon={PiggyBank} title="Tu ingreso (opcional)" defaultOpen={false} blurb="Si llenas tu ingreso, te mostramos qué porcentaje de tu sueldo se iría al auto.">
        <Field label="Ingreso mensual" value={inputs.monthlyIncome} min={0} max={150000} step={500} onChange={v => set('monthlyIncome', v)} suffix={inputs.monthlyIncome>0 ? `${fmtMXN(inputs.monthlyIncome)}/mes` : 'Opcional · déjalo en 0 para ignorar'} info={TIPS.income} />
      </Group>
    </aside>
  );
};

// ============================================================================
// BLOQUE: VEREDICTO  ·  Objetivos solicitados por el usuario
// ----------------------------------------------------------------------------
// Resumen de una línea, en lenguaje simple, que responde la pregunta central:
// "¿conviene o no?". Cubre los 3 modos de operación que pidió el usuario:
//   - Sin Uber  → cuánto cuesta tener el auto + resultado final.
//   - Uber      → viable / viable-pero-pesado / inviable (no alcanzan las horas).
//   - Respeta el supuesto del problema: máx 4 viajes/hora (avisa si se excede).
// ============================================================================
const Verdict = ({ R, inputs }) => {
  if (!R.isUberMode) {
    return (<div className="verdict warn"><div className="verdict-icon"><Wallet size={22} color="var(--warn)" /></div><div>
      <div className="verdict-text">Tener el auto cuesta <span className="mono">{fmtMXN(R.monthlyTotalOperative)}</span>/mes</div>
      <div className="verdict-sub">En {inputs.horizonYears} años gastarás {fmtMXN(R.totalSpentGross)} en total. Al vender el auto recuperas {fmtMXN(R.terminalRecovery)} (venta − deuda), dejando un costo neto de <strong>{fmtMXN(R.totalProjectCost)}</strong>.</div>
    </div></div>);
  }
  if (R.tripsPerHourWarn) {
    return (<div className="verdict bad"><div className="verdict-icon"><AlertTriangle size={22} color="var(--neg)" /></div><div>
      <div className="verdict-text">Más de 4 viajes/hora no es realista</div><div className="verdict-sub">El problema asume un tope físico de 4 viajes por hora.</div></div></div>);
  }
  if (R.netContributionPerTrip <= 0) {
    return (<div className="verdict bad"><div className="verdict-icon"><AlertTriangle size={22} color="var(--neg)" /></div><div>
      <div className="verdict-text">Cada viaje pierde dinero</div>
      <div className="verdict-sub">La contribución por viaje es {fmtMXN(R.netContributionPerTrip,2)} después de comisión, impuesto bruto, energía y mantenimiento. Sube tarifa o baja costos/km.</div></div></div>);
  }
  if (R.evRangeShortfall) {
    return (<div className="verdict bad"><div className="verdict-icon"><Battery size={22} color="var(--neg)" /></div><div>
      <div className="verdict-text">La autonomía eléctrica no alcanza</div>
      <div className="verdict-sub">El plan requiere {fmtN(R.totalDailyKm)} km/día, pero una carga útil rinde ~{fmtN(R.dailyRangeKm)} km. Ajusta batería, km por viaje, días u horas antes de considerarlo viable.</div></div></div>);
  }
  if (R.chargingExceedsAvailableHours) {
    return (<div className="verdict bad"><div className="verdict-icon"><Battery size={22} color="var(--neg)" /></div><div>
      <div className="verdict-text">La carga consume la jornada disponible</div>
      <div className="verdict-sub">La carga requiere {fmtFixed(R.chargingHoursPerDay)} hrs/día y sólo tienes {fmtFixed(inputs.maxHoursPerDay)} hrs/día disponibles.</div></div></div>);
  }
  if (!R.feasible) {
    return (<div className="verdict bad"><div className="verdict-icon"><AlertTriangle size={22} color="var(--neg)" /></div><div>
      <div className="verdict-text">No alcanzan las horas del día</div>
      <div className="verdict-sub">Necesitas {fmtN(R.breakEvenTrips)} viajes/mes pero el máximo posible es {fmtN(R.maxTripsMonth)}.{R.chargingHoursPerDay>0.5 && ` (La carga eléctrica consume ${fmtFixed(R.chargingHoursPerDay)} hrs/día.)`}</div></div></div>);
  }
  if (R.hoursPerDay > 5) {
    return (<div className="verdict warn"><div className="verdict-icon"><AlertTriangle size={22} color="var(--warn)" /></div><div>
      <div className="verdict-text">Es viable, pero pesado: {fmtFixed(R.hoursPerDay)} hrs/día</div>
      <div className="verdict-sub">{fmtN(R.breakEvenTrips)} viajes/mes · {fmtFixed(R.hoursPerWeek)} hrs/semana · podrías ganar {fmtMXN(R.safetyMargin)} extra al máximo</div></div></div>);
  }
  return (<div className="verdict ok"><div className="verdict-icon"><CheckCircle2 size={22} color="var(--pos)" /></div><div>
    <div className="verdict-text">Viable y manejable</div>
    <div className="verdict-sub">{fmtFixed(R.hoursPerDay)} hrs/día · {fmtFixed(R.weeklyDays)} días/sem · {fmtFixed(R.hoursPerWeek)} hrs/sem total · holgura para ganar {fmtMXN(R.safetyMargin)} extra</div></div></div>);
};

// ============================================================================
// BLOQUE: IMPACTO EN EL INGRESO  ·  Objetivos solicitados por el usuario
// ----------------------------------------------------------------------------
// Petición: "Agrega un campo OPCIONAL para ingreso mensual. Si lo llena, calcula
// qué % de su ingreso se iría a: mensualidad, seguro, gasolina/diésel/electricidad,
// mantenimiento, desgaste, costos totales mensuales y costo total del proyecto.
// Muéstralo en una gráfica sencilla (% del ingreso al auto, ingreso vs costo
// mensual, distribución de gastos como % del ingreso). NO debe ser obligatorio:
// si no lo llena, el sistema sigue funcionando normalmente."
//   - Si monthlyIncome <= 0 → retorna null (no estorba, todo lo demás funciona).
//   - Semáforo de salud financiera (regla 20-30% del ingreso).
// ============================================================================
const IncomeImpact = ({ R, inputs }) => {
  if (!inputs.monthlyIncome || inputs.monthlyIncome <= 0) return null;
  const total = R.monthlyTotalOperative, income = inputs.monthlyIncome;
  const pct = total / income, remaining = Math.max(0, income - total);
  const segments = [
    R.monthlyPayment > 0 && { name:'Mensualidad', value:R.monthlyPayment, color:'#b8431f' },
    { name: inputs.vehicleType==='electric' ? 'Electricidad' : (inputs.vehicleType==='diesel' ? 'Diésel' : 'Gasolina'), value:R.monthlyFuel, color:'#d65a30' },
    { name:'Seguro', value:R.monthlyIns, color:'#a87819' },
    { name:'Refrendo', value:R.monthlyRefrendo, color:'#6b3d8a' },
    { name:'Mantenimiento', value:R.monthlyMaint, color:'#1f4d8a' },
    R.monthlyData > 0 && { name:'Datos', value:R.monthlyData, color:'#7a6e5e' },
    R.monthlyCarWash > 0 && { name:'Lavado', value:R.monthlyCarWash, color:'#0e6b6b' },
    R.monthlyTips > 0 && { name:'Propinas', value:R.monthlyTips, color:'#3a7d44' },
    R.monthlyMisc > 0 && { name:'Misceláneos', value:R.monthlyMisc, color:'#9c6b1f' },
    R.monthlyAccess > 0 && { name:'Accesorios', value:R.monthlyAccess, color:'#8a2727' },
  ].filter(Boolean);
  const stressLevel = pct > 0.5 ? 'bad' : pct > 0.3 ? 'warn' : 'ok';
  const stressText = pct > 0.5 ? '⚠️ Tu auto se llevará más de la mitad de tu ingreso. Riesgo alto.' : pct > 0.3 ? 'Tu auto se llevará una parte considerable de tu ingreso. Manejable pero apretado.' : 'Tu auto representa una proporción saludable de tu ingreso.';
  return (
    <div className="card" style={{ marginBottom:18 }}>
      <div className="card-title"><PiggyBank size={11} /> Impacto en tu ingreso mensual <Info text="Comparamos lo que cuesta el auto contra tu sueldo. La regla común dice que el auto no debería pasar del 20-30% de tu ingreso." /></div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontSize:12, color:'var(--muted)' }}>De tu ingreso de <strong className="mono">{fmtMXN(income)}</strong>/mes, el auto consume</div>
          <div className="serif" style={{ fontSize:36, lineHeight:1.1, color: pct>0.5?'var(--neg)':pct>0.3?'var(--warn)':'var(--pos)' }}>{fmtPct(pct,1)}</div>
          <div className="mono" style={{ fontSize:12, color:'var(--muted)' }}>{fmtMXN(total)} de {fmtMXN(income)}</div>
        </div>
        <span className={`stress-badge ${stressLevel}`}>{pct>0.5?'⚠️ Alto':pct>0.3?'⚠️ Medio':'✓ Saludable'}</span>
      </div>
      <div style={{ fontSize:12, color:'var(--muted)', marginBottom:8 }}><strong>Distribución de tu ingreso:</strong></div>
      <div className="income-bar">
        {segments.map((s,i) => (<div key={i} style={{ width:`${(s.value/income)*100}%`, background:s.color }} title={`${s.name}: ${fmtMXN(s.value)}`}>{(s.value/income)>0.05 && fmtPct(s.value/income,0)}</div>))}
        {remaining > 0 && <div style={{ width:`${(remaining/income)*100}%`, background:'var(--pos)' }}>{(remaining/income)>0.05 && `${fmtPct(remaining/income,0)} libre`}</div>}
      </div>
      <div className="income-bar-legend">
        {segments.map((s,i) => (<div key={i}><span className="swatch" style={{ background:s.color }} /><span>{s.name}: <strong className="mono">{fmtMXN(s.value)}</strong> ({fmtPct(s.value/income,1)})</span></div>))}
        <div><span className="swatch" style={{ background:'var(--pos)' }} /><span>Libre para otros gastos: <strong className="mono">{fmtMXN(remaining)}</strong> ({fmtPct(remaining/income,1)})</span></div>
      </div>
      <div style={{ marginTop:14, fontSize:12, color:'var(--ink-2)', fontStyle:'italic', borderTop:'1px solid var(--line)', paddingTop:12 }}>{stressText}</div>
      <div className="income-summary" style={{ marginTop:14 }}>
        <div><div className="lbl">Gasto total {inputs.horizonYears} años</div><div className="val">{fmtMXN(R.totalSpentGross)}</div><div style={{ fontSize:10, color:'var(--muted)', marginTop:2 }}>= {fmtPct(R.totalSpentGross/(income*inputs.horizonYears*12),1)} de tu ingreso del período</div></div>
        <div><div className="lbl">Ingreso anual</div><div className="val">{fmtMXN(income*12)}</div></div>
        <div><div className="lbl">Costo anual auto</div><div className="val">{fmtMXN(R.monthlyTotalOperative*12)}</div></div>
      </div>
    </div>
  );
};

// ============================================================================
// PÁGINA: DASHBOARD  ·  Objetivos solicitados por el usuario
// ----------------------------------------------------------------------------
// Es la pantalla principal de resultados. Reúne las metas de varias peticiones:
//   - Veredicto claro arriba: ¿es viable / pesado / inviable / sólo costo?
//   - Perfiles de usuario que debe atender: "comprar auto nuevo y pagarlo con
//     Uber en tiempo libre", "comprar usado", "ya tengo auto y quiero saber
//     cuánto me cuesta", "usar mi carro viejo", "no quiero Uber, sólo ver
//     depreciación y costo de tenerlo", "cuánto de mi ingreso se va al carro".
//   - KPIs con tooltips (ícono ? al hover) que explican en lenguaje simple:
//     mensualidad, VF, VP, costo del dinero, costo mensual total, punto de
//     equilibrio, depreciación, costo total del proyecto y resultado final.
//   - Bloque "Impacto en tu ingreso" (sólo si el usuario llenó su ingreso,
//     campo OPCIONAL): % del sueldo que se va al auto, barra de distribución,
//     y desglose por categoría. Si no llena ingreso, todo sigue funcionando.
//   - Act. 1-A: tabla de clasificación contable Fijo/Variable × Directo/Indirecto.
//   - Gráficas de largo plazo: amortización, estructura mensual de costos,
//     GASTO TOTAL ACUMULADO por categoría (incluye desembolso inicial y todas
//     las variables nuevas), y valor del auto vs deuda.
//   - Tooltips de ayuda piden poco espacio: ícono con hover, no texto fijo.
// ============================================================================
// ============================================================================
// BLOQUE: RESUMEN DE DECISIÓN DE COMPRA  ·  Valor real (no escolar)
// ----------------------------------------------------------------------------
// Las cifras que de verdad mueven una decisión de compra de auto, con ingeniería
// económica seria: TCO, costo por km, CAE (comparador justo entre horizontes),
// valor presente del costo, costo por depreciación, CAT y financiar-vs-contado.
// Funciona en TODOS los modos; brilla en "Sin Uber" (sólo quiero comprar un auto).
// ============================================================================
const DecisionSummary = ({ R, inputs }) => {
  const financed = R.financed > 0;
  const fvc = R.financeVsCashPV;
  return (
    <div className="card" style={{ marginBottom:18 }}>
      <div className="card-title"><Calculator size={11} /> Resumen de decisión de compra <Info text={TIPS.tco} /></div>
      <div className="card-blurb">Las cifras que de verdad importan para decidir, con ingeniería económica (VPN, CAE, TCO) a una tasa de oportunidad de {fmtPct(R.discountAnnual,1)}. Compara autos por su <strong>CAE</strong> (menor = mejor) y por su <strong>costo por km</strong>.</div>
      <div className="kpi-grid" style={{ marginBottom:0 }}>
        <div className="kpi accent"><div className="kpi-label">Costo total de propiedad <Info text={TIPS.tco} /></div><div className="kpi-value mono">{fmtMXN(R.tcoTotal)}</div><div className="kpi-sub">{fmtMXN(R.tcoPerYear)}/año · {inputs.horizonYears} años</div></div>
        <div className="kpi"><div className="kpi-label">Costo por kilómetro <Info text={TIPS.costPerKm} /></div><div className="kpi-value mono">{isFinite(R.costPerKm) ? fmtMXN(R.costPerKm,2) : '—'}</div><div className="kpi-sub">{isFinite(R.costPerKm) ? `${fmtN(R.totalKmHorizon)} km en total` : 'agrega km personales'}</div></div>
        <div className="kpi accent"><div className="kpi-label">Costo anual equivalente <Info text={TIPS.eac} /></div><div className="kpi-value mono">{fmtMXN(R.eac)}</div><div className="kpi-sub">renta anual equivalente · comparador justo</div></div>
        <div className="kpi"><div className="kpi-label">Valor presente del costo <Info text={TIPS.npv} /></div><div className="kpi-value mono">{fmtMXN(R.pvLifetimeCost)}</div><div className="kpi-sub">todo el costo, traído a hoy</div></div>
        <div className="kpi"><div className="kpi-label">Costo por depreciación <Info text={TIPS.depreciationCost} /></div><div className="kpi-value mono">{fmtMXN(R.depreciationCost)}</div><div className="kpi-sub">{fmtPct(R.depreciationCost/Math.max(1,R.carPrice),0)} del precio se esfuma</div></div>
        {financed && <div className="kpi"><div className="kpi-label">CAT real del crédito <Info text={TIPS.cat} /></div><div className="kpi-value mono">{fmtPct(R.cat,1)}</div><div className="kpi-sub">interés de lista {fmtPct(inputs.interestRate,1)} · efectiva {fmtPct(R.ear,1)}</div></div>}
        {financed && <div className="kpi"><div className="kpi-label">¿Financiar o contado? <Info text={TIPS.financeVsCash} /></div><div className="kpi-value mono" style={{ color: fvc>=0?'var(--pos)':'var(--neg)' }}>{fvc>=0?'Financiar':'Contado'}</div><div className="kpi-sub">{fvc>=0?'+':''}{fmtMXN(fvc)} en valor presente</div></div>}
        {R.isUberMode && <div className="kpi accent"><div className="kpi-label">VPN del proyecto Uber <Info text={TIPS.npv} /></div><div className="kpi-value mono" style={{ color: R.npvProject>=0?'var(--pos)':'var(--neg)' }}>{fmtMXN(R.npvProject)}</div><div className="kpi-sub">TIR: {isFinite(R.irrProject) ? fmtPct(R.irrProject,1) : '—'} vs descuento {fmtPct(R.discountAnnual,1)}</div></div>}
      </div>
    </div>
  );
};

const Dashboard = ({ R, inputs }) => {
  const cashflowChart = R.cashflow.map(r => ({ year:r.year, Valor:Math.round(r.depValue), Deuda:Math.round(r.debtRemaining) }));
  const cumSpendChart = R.cashflow.map(r => ({ year:r.year, 'Auto / crédito':r.cCar, 'Combustible':r.cEnergy, 'Seguro + refrendo':r.cInsRef, 'Mantenimiento':r.cMaint, 'Otros':r.cOther }));
  const fuelName = inputs.vehicleType==='electric' ? 'Energía eléctrica' : (inputs.vehicleType==='diesel' ? 'Diésel' : 'Combustible');
  const costBreakdown = [
    inputs.purchaseMode!=='cash' && { name:'Mensualidad crédito', value:R.monthlyPayment, color:'#b8431f', tipo:'Fijo', dir:'Directo' },
    { name:fuelName, value:R.monthlyFuel, color:'#d65a30', tipo:'Variable', dir:'Directo' },
    { name:'Seguro', value:R.monthlyIns, color:'#a87819', tipo:'Fijo', dir:'Directo' },
    { name:'Refrendo/Tenencia', value:R.monthlyRefrendo, color:'#6b3d8a', tipo:'Fijo', dir:'Directo' },
    { name:'Mantenimiento', value:R.monthlyMaint, color:'#1f4d8a', tipo:'Variable', dir:'Directo' },
    R.monthlyData>0 && { name:'Datos móviles', value:R.monthlyData, color:'#7a6e5e', tipo:'Fijo', dir:'Directo' },
    R.monthlyCarWash>0 && { name:'Lavado', value:R.monthlyCarWash, color:'#0e6b6b', tipo:'Variable', dir:'Indirecto' },
    R.monthlyTips>0 && { name:'Propinas', value:R.monthlyTips, color:'#3a7d44', tipo:'Variable', dir:'Indirecto' },
    R.monthlyMisc>0 && { name:'Misceláneos', value:R.monthlyMisc, color:'#9c6b1f', tipo:'Variable', dir:'Indirecto' },
    R.monthlyAccess>0 && { name:'Accesorios', value:R.monthlyAccess, color:'#8a2727', tipo:'Fijo', dir:'Indirecto' },
  ].filter(Boolean);
  const amortChartData = R.amortRows.length > 0 ? R.amortRows.filter((_,i) => i%3===0 || i===R.amortRows.length-1).map(r => ({ month:r.month, Capital:Math.round(r.cumPrin), Interés:Math.round(r.cumInt), Saldo:Math.round(r.balance) })) : [];
  const cumColors = ['#b8431f','#d65a30','#a87819','#1f4d8a','#0e6b6b'];

  return (<>
    <Verdict R={R} inputs={inputs} />
    {!R.isUberMode && R.evRangeShortfall && (
      <div className="verdict bad" style={{ marginTop:-12 }}>
        <div className="verdict-icon"><Battery size={22} color="var(--neg)" /></div>
        <div>
          <div className="verdict-text">Autonomía eléctrica ajustada</div>
          <div className="verdict-sub">Manejas {fmtN(R.totalDailyKm)} km/día pero una carga rinde ~{fmtN(R.dailyRangeKm)} km. Esto bloquea la viabilidad hasta ajustar batería, carga, km por viaje o días de trabajo.</div>
        </div>
      </div>
    )}
    <DecisionSummary R={R} inputs={inputs} />
    <IncomeImpact R={R} inputs={inputs} />
    <div className="kpi-grid">
      <div className="kpi"><div className="kpi-label">Desembolso inicial <Info text="Todo lo que pagas el primer día: enganche/efectivo + comisión de apertura + trámites iniciales de Uber + gastos de adquisición." /></div>
        <div className="kpi-value mono">{fmtMXN(R.upfrontCash)}</div>
        <div className="kpi-sub">{inputs.purchaseMode==='cash'?'Pago de contado':inputs.purchaseMode==='hybrid'?'Mixto efectivo + crédito':`${fmtPct(R.cashPaid/inputs.carPrice,0)} enganche`}{R.oneTimeUberCosts>0 && ` + ${fmtMXN(R.oneTimeUberCosts)} trámites`}</div></div>
      {R.financed > 0 && (<>
        <div className="kpi"><div className="kpi-label">Mensualidad <Info text={TIPS.monthlyPayment} /></div><div className="kpi-value mono">{fmtMXN(R.monthlyPayment)}</div><div className="kpi-sub">× {R.months} meses</div></div>
        <div className="kpi"><div className="kpi-label">Costo total nominal (VF) <Info text={TIPS.vf} /></div><div className="kpi-value mono">{fmtMXN(R.fvTotal)}</div><div className="kpi-sub">Suma de TODO lo del crédito</div></div>
        <div className="kpi"><div className="kpi-label">Valor presente (VP) <Info text={TIPS.vp} /></div><div className="kpi-value mono">{fmtMXN(R.pvTotal)}</div><div className="kpi-sub">Equivalente en dinero de hoy</div></div>
        <div className="kpi accent"><div className="kpi-label">Costo del dinero <Info text={TIPS.timeValue} /></div><div className="kpi-value mono">{fmtMXN(R.timeValueOfMoney)}</div><div className="kpi-sub">Intereses: {fmtMXN(R.totalInterest)}</div></div>
      </>)}
      <div className="kpi"><div className="kpi-label">Costo mensual total <Info text={TIPS.monthlyTotal} /></div><div className="kpi-value mono">{fmtMXN(R.monthlyTotalOperative)}</div><div className="kpi-sub">todo lo del auto por mes</div></div>
      {R.isUberMode && <div className="kpi accent"><div className="kpi-label">Punto de equilibrio <Info text={TIPS.breakeven} /></div><div className="kpi-value mono">{fmtN(R.breakEvenTrips,0)}</div><div className="kpi-sub">viajes/mes · {fmtFixed(R.hoursPerDay)} hrs/día</div></div>}
      <div className="kpi"><div className="kpi-label">Valor en {2025+inputs.horizonYears} <Info text={TIPS.depreciation} /></div><div className="kpi-value mono">{fmtMXN(R.valueAtEnd)}</div><div className="kpi-sub">Esperado al vender: {fmtMXN(R.actualSalePrice)}</div></div>
      <div className="kpi"><div className="kpi-label">Costo neto del proyecto <Info text={TIPS.totalProject} /></div><div className="kpi-value mono">{fmtMXN(R.totalProjectCost)}</div><div className="kpi-sub">gasto − (venta − deuda)</div></div>
      <div className="kpi"><div className="kpi-label">Resultado de liquidación <Info text={TIPS.liquidation} /></div><div className="kpi-value mono" style={{ color: R.liquidationPosition>=0?'var(--pos)':'var(--neg)' }}>{fmtMXN(R.liquidationPosition)}</div><div className="kpi-sub">Venta − deuda restante</div></div>
      {R.isUberMode && <div className="kpi accent"><div className="kpi-label">Resultado neto del proyecto <Info text={TIPS.netResult} /></div><div className="kpi-value mono" style={{ color: R.netProjectResult>=0?'var(--pos)':'var(--neg)' }}>{fmtMXN(R.netProjectResult)}</div><div className="kpi-sub">ingresos + liquidación − gastos</div></div>}
      {R.chargingHoursPerDay>0 && <div className="kpi electric"><div className="kpi-label">Tiempo de carga</div><div className="kpi-value mono">{fmtFixed(R.chargingHoursPerDay)}</div><div className="kpi-sub">hrs/día · cargador {inputs.chargerPowerKw} kW</div></div>}
    </div>

    <div className="row-2">
      {R.amortRows.length > 0 ? (
        <div className="card"><div className="card-title"><BarChart3 size={11} /> Amortización del crédito <Info text={TIPS.amortization} /></div>
          <ResponsiveContainer width="100%" height={250}><ComposedChart data={amortChartData}>
            <CartesianGrid stroke="#e6dccc" strokeDasharray="2 4" /><XAxis dataKey="month" stroke="#7a6e5e" fontSize={11} /><YAxis stroke="#7a6e5e" fontSize={11} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={v => fmtMXN(v)} contentStyle={{ background:'#fdfaf2', border:'1px solid #d9cdb7', borderRadius:3 }} /><Legend wrapperStyle={{ fontSize:11 }} />
            <Area type="monotone" dataKey="Capital" stackId="1" fill="#b8431f" stroke="#b8431f" fillOpacity={0.7} /><Area type="monotone" dataKey="Interés" stackId="1" fill="#a87819" stroke="#a87819" fillOpacity={0.6} /><Line type="monotone" dataKey="Saldo" stroke="#181410" strokeWidth={2} dot={false} />
          </ComposedChart></ResponsiveContainer></div>
      ) : (
        <div className="card"><div className="card-title"><Wallet size={11} /> Compra en efectivo</div>
          <p style={{ fontSize:14, color:'var(--muted)', marginTop:0 }}>No hay financiamiento. Pagaste <strong style={{ color:'var(--ink)' }}>{fmtMXN(R.cashPaid)}</strong> al momento de la compra.</p>
          <p style={{ fontSize:12, color:'var(--muted)' }}><strong>Costo de oportunidad:</strong> ese dinero invertido en CETES (~10% anual) generaría aproximadamente <strong>{fmtMXN(R.cashPaid*0.10*inputs.horizonYears)}</strong> en {inputs.horizonYears} años.</p></div>
      )}
      <div className="card"><div className="card-title"><BarChart3 size={11} /> Estructura mensual de costos <Info text={TIPS.costStructure} /></div>
        <ResponsiveContainer width="100%" height={250}><BarChart data={costBreakdown} layout="vertical" margin={{ left:20 }}>
          <CartesianGrid stroke="#e6dccc" strokeDasharray="2 4" horizontal={false} /><XAxis type="number" stroke="#7a6e5e" fontSize={11} tickFormatter={v => `${(v/1000).toFixed(0)}k`} /><YAxis type="category" dataKey="name" stroke="#7a6e5e" fontSize={10} width={120} />
          <Tooltip formatter={v => fmtMXN(v)} contentStyle={{ background:'#fdfaf2', border:'1px solid #d9cdb7', borderRadius:3 }} /><Bar dataKey="value" radius={[0,2,2,0]}>{costBreakdown.map((d,i) => <Cell key={i} fill={d.color} />)}</Bar>
        </BarChart></ResponsiveContainer>
        <div style={{ textAlign:'right', marginTop:8, fontFamily:'JetBrains Mono, monospace', fontSize:12 }}>Total mensual: <strong>{fmtMXN(R.monthlyTotalOperative)}</strong></div></div>
    </div>

    <div className="card" style={{ marginBottom:18 }}><div className="card-title"><TrendingUp size={11} /> Gasto total acumulado a lo largo del proyecto <Info text={TIPS.cumSpend} /></div>
      <div className="card-blurb">Cuánto dinero llevas gastado en total conforme pasan los años, apilado por categoría. El año 1 incluye tu desembolso inicial (enganche + comisión + trámites Uber).</div>
      <ResponsiveContainer width="100%" height={300}><AreaChart data={cumSpendChart}>
        <CartesianGrid stroke="#e6dccc" strokeDasharray="2 4" /><XAxis dataKey="year" stroke="#7a6e5e" fontSize={11} /><YAxis stroke="#7a6e5e" fontSize={11} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
        <Tooltip formatter={v => fmtMXN(v)} contentStyle={{ background:'#fdfaf2', border:'1px solid #d9cdb7', borderRadius:3 }} /><Legend wrapperStyle={{ fontSize:11 }} />
        {['Auto / crédito','Combustible','Seguro + refrendo','Mantenimiento','Otros'].map((k,i) => <Area key={k} type="monotone" dataKey={k} stackId="1" stroke={cumColors[i]} fill={cumColors[i]} fillOpacity={0.65} />)}
      </AreaChart></ResponsiveContainer>
      <div style={{ textAlign:'right', marginTop:8, fontFamily:'JetBrains Mono, monospace', fontSize:12 }}>Gasto bruto total: <strong>{fmtMXN(R.totalSpentGross)}</strong> · Neto tras vender: <strong>{fmtMXN(R.totalProjectCost)}</strong></div></div>

    <div className="card" style={{ marginBottom:18 }}><div className="card-title"><Calculator size={11} /> Clasificación contable de costos <Info text="<strong>Fijo:</strong> mismo monto sin importar cuánto uses el auto.<br/><strong>Variable:</strong> depende de cuánto manejes.<br/><strong>Directo:</strong> esencial para operar.<br/><strong>Indirecto:</strong> de apoyo." /></div>
      <div className="card-blurb">Clasificación estándar de contabilidad, pedida en la Actividad 1-A.</div>
      <table className="tbl"><thead><tr><th>Costo</th><th>Naturaleza</th><th>Tipo</th><th className="num">Mensual</th><th className="num">Anual</th></tr></thead><tbody>
        {costBreakdown.map((c,i) => (<tr key={i}><td style={{ fontFamily:'Manrope', fontWeight:500 }}><span style={{ display:'inline-block', width:8, height:8, borderRadius:50, background:c.color, marginRight:8 }} />{c.name}</td><td>{c.tipo}</td><td>{c.dir}</td><td className="num">{fmtMXN(c.value)}</td><td className="num">{fmtMXN(c.value*12)}</td></tr>))}
        {R.oneTimeUberCosts>0 && (<tr style={{ background:'var(--bg-2)' }}><td style={{ fontFamily:'Manrope', fontWeight:500 }}><span style={{ display:'inline-block', width:8, height:8, borderRadius:50, background:'#181410', marginRight:8 }} />Trámites iniciales Uber (único)</td><td>Único</td><td>Directo</td><td className="num">—</td><td className="num">{fmtMXN(R.oneTimeUberCosts)}</td></tr>)}
      </tbody></table></div>

    <div className="card" style={{ marginBottom:18 }}><div className="card-title"><TrendingUp size={11} /> Valor del auto vs lo que aún debes <Info text="<strong>Verde:</strong> cuánto vale el auto cada año (baja por depreciación). <strong>Rojo:</strong> cuánto aún debes del crédito." /></div>
      <ResponsiveContainer width="100%" height={260}><LineChart data={cashflowChart}>
        <CartesianGrid stroke="#e6dccc" strokeDasharray="2 4" /><XAxis dataKey="year" stroke="#7a6e5e" fontSize={11} /><YAxis stroke="#7a6e5e" fontSize={11} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
        <Tooltip formatter={v => fmtMXN(v)} contentStyle={{ background:'#fdfaf2', border:'1px solid #d9cdb7', borderRadius:3 }} /><Legend wrapperStyle={{ fontSize:11 }} />
        <Line type="monotone" dataKey="Valor" stroke="#2f6a3b" strokeWidth={2.5} dot={{ r:3 }} /><Line type="monotone" dataKey="Deuda" stroke="#b8431f" strokeWidth={2.5} dot={{ r:3 }} strokeDasharray="4 4" />
      </LineChart></ResponsiveContainer></div>

    {R.isUberMode && (
      <div className="card"><div className="card-title"><Activity size={11} /> Plan de operación sugerido <Info text="Lo que tendrías que trabajar para alcanzar tu objetivo." /></div>
        <table className="tbl"><tbody>
          <tr><td>Ingreso neto antes de km</td><td className="num pos">{fmtMXN(R.netRevenuePerTrip,2)}</td><td>Tarifa {fmtMXN(R.grossPerTrip)} − Uber {fmtMXN(R.platformCommission,2)} − impuesto bruto {fmtMXN(R.taxAmountPerTrip,2)}</td></tr>
          <tr><td>(−) Costo variable por viaje</td><td className="num neg">{fmtMXN(R.variableCostPerTrip,2)}</td><td>{fmtN(R.kmPerTrip,1)} km/viaje × (energía + mantenimiento base/km con desgaste Uber)</td></tr>
          <tr><td><strong>Contribución por viaje</strong> <Info text={TIPS.kmPerTrip} /></td><td className="num"><strong>{fmtMXN(R.netContributionPerTrip,2)}</strong></td><td>lo que cada viaje aporta a cubrir fijos</td></tr>
          <tr><td>Equilibrio operativo</td><td className="num">{fmtN(R.operatingBreakEvenTrips,0)}</td><td>Sólo costos mensuales: {fmtMXN(R.operatingFixedMonthlyCosts)}</td></tr>
          <tr><td>Viajes/mes objetivo</td><td className="num"><strong>{fmtN(R.breakEvenTrips,0)}</strong></td><td>Operativo {fmtMXN(R.operatingFixedMonthlyCosts)}{R.projectRecoveryMonthly>0 && ` + recuperación proyecto ${fmtMXN(R.projectRecoveryMonthly)}`}{R.profitTarget>0 && ` + meta ${fmtMXN(R.profitTarget)}`}</td></tr>
          <tr><td>Viajes por día</td><td className="num">{fmtFixed(R.tripsPerDay)}</td><td>en {inputs.workDaysPerMonth} días/mes · {fmtN(R.uberMonthlyKm)} km Uber/mes</td></tr>
          <tr><td><strong>Horas por día</strong></td><td className="num"><strong>{fmtFixed(R.hoursPerDay)} hrs</strong></td><td>a {inputs.tripsPerHour} viajes/hora</td></tr>
          <tr><td><strong>Horas por semana</strong></td><td className="num"><strong>{fmtFixed(R.hoursPerWeek)} hrs</strong></td><td>{fmtFixed(R.weeklyDays)} días/sem × {fmtFixed(R.hoursPerDay)} hrs/día</td></tr>
          <tr><td>Capacidad utilizada <Info text={TIPS.capacity} /></td><td className="num">{fmtPct(R.capacityUsage,1)}</td><td>Tope: {fmtN(R.maxTripsMonth)} viajes/mes</td></tr>
          {R.chargingHoursPerDay>0 && <tr><td>Carga eléctrica diaria</td><td className="num">{fmtFixed(R.chargingHoursPerDay)} hrs</td><td>Te resta tiempo de trabajo</td></tr>}
        </tbody></table></div>
    )}
  </>);
};

// ============================================================================
// PÁGINA: COMPARAR  ·  Objetivos solicitados por el usuario
// ----------------------------------------------------------------------------
// Peticiones (perfiles de usuario): "Quiero comparar diferentes tipos de carros",
// "Quiero saber qué auto me conviene más", y del alcance original: comparar
// múltiples escenarios lado a lado con líneas sobrepuestas y tabla de diferencias.
//   - Cada escenario guardado es una configuración COMPLETA de variables.
//   - Gráfica de utilidad acumulada por escenario (líneas sobrepuestas).
//   - Tabla comparativa: mensual, equilibrio, hrs/sem, costo del proyecto y
//     resultado final, para decidir cuál opción conviene.
//   - "Actual" siempre se compara contra los guardados sin necesidad de guardarlo.
// ============================================================================
const Comparison = ({ saved, current, currentInputs, setSaved }) => {
  if (saved.length === 0) {
    return (<div className="card" style={{ textAlign:'center', padding:60 }}>
      <GitCompareArrows size={32} color="var(--muted)" style={{ marginBottom:12 }} />
      <div className="serif" style={{ fontSize:22 }}>Sin escenarios guardados</div>
      <div style={{ color:'var(--muted)', fontSize:13, marginTop:6, maxWidth:480, marginLeft:'auto', marginRight:'auto' }}>Cambia parámetros (otro auto, otra ciudad, otro plazo) y presiona <strong>Guardar escenario</strong>. Aquí los comparas lado a lado.</div>
    </div>);
  }
  // sid = id único por serie (evita que escenarios con el mismo nombre se pisen en la gráfica). (audit fix)
  const all = [...saved, { name:'Actual', inputs:currentInputs, result:current, color:'#181410' }].map((s, i) => ({ ...s, sid:`s${i}` }));
  const yearsMax = Math.max(...all.map(s => s.inputs.horizonYears));
  const anyUber = all.some(s => s.result.isUberMode);
  const lineData = [];
  // Utilidad acumulada incluyendo la liquidación del auto ese año (venta − deuda),
  // para que autos con mejor reventa o con deuda viva se comparen de forma justa. (audit fix #comparison)
  for (let y = 1; y <= yearsMax; y++) { const row = { year:2025+y }; all.forEach(s => { const cf = s.result.cashflow[y-1]; if (cf) row[s.sid] = Math.round(cf.cumRevenue - cf.cumCosts + (cf.liqValue || 0)); }); lineData.push(row); }
  // Mejor valor = menor Costo Anual Equivalente (CAE). Es el comparador correcto
  // porque normaliza autos con horizontes distintos a una renta anual.
  const bestEac = all.reduce((b, s) => (s.result.eac < b.result.eac ? s : b), all[0]);
  const bestPerKm = all.filter(s => isFinite(s.result.costPerKm)).reduce((b, s) => (!b || s.result.costPerKm < b.result.costPerKm ? s : b), null);
  return (<>
    <div className="card" style={{ marginBottom:18 }}><div className="card-title"><GitCompareArrows size={11} /> Escenarios guardados</div>
      <div className="card-blurb">Cada escenario es una configuración completa. Compáralos para ver cuál te conviene más.</div>
      <div>{saved.map((s,i) => (<span key={i} className="scenario-chip"><span className="dot" style={{ background:s.color }} />{s.name}<span className="x" onClick={() => setSaved(saved.filter((_,j) => j!==i))}>×</span></span>))}
        <span className="scenario-chip" style={{ borderColor:'var(--ink)' }}><span className="dot" style={{ background:'#181410' }} />Actual <span style={{ color:'var(--muted)' }}>(sin guardar)</span></span></div></div>
    <div className="verdict ok" style={{ marginBottom:18 }}><div className="verdict-icon"><CheckCircle2 size={22} color="var(--pos)" /></div><div>
      <div className="verdict-text">Mejor valor: <span style={{ color:'var(--accent)' }}>{bestEac.name}</span></div>
      <div className="verdict-sub">Menor costo anual equivalente: {fmtMXN(bestEac.result.eac)}/año (CAE){bestPerKm && ` · más barato por km: ${bestPerKm.name} a ${fmtMXN(bestPerKm.result.costPerKm,2)}/km`}. El CAE compara de forma justa autos que conservas distintos años.</div></div></div>
    <div className="card" style={{ marginBottom:18 }}><div className="card-title"><BarChart3 size={11} /> {anyUber ? 'Utilidad acumulada por escenario' : 'Posición patrimonial acumulada'} <Info text="Cuánto ganas (o pierdes) acumulado al pasar los años, incluyendo el valor de reventa del auto menos la deuda. La línea más alta = mejor." /></div>
      <ResponsiveContainer width="100%" height={300}><LineChart data={lineData}>
        <CartesianGrid stroke="#e6dccc" strokeDasharray="2 4" /><XAxis dataKey="year" stroke="#7a6e5e" fontSize={11} /><YAxis stroke="#7a6e5e" fontSize={11} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
        <Tooltip formatter={v => fmtMXN(v)} contentStyle={{ background:'#fdfaf2', border:'1px solid #d9cdb7', borderRadius:3 }} /><Legend wrapperStyle={{ fontSize:11 }} /><ReferenceLine y={0} stroke="#7a6e5e" strokeDasharray="3 3" />
        {all.map(s => <Line key={s.sid} type="monotone" dataKey={s.sid} name={s.name} stroke={s.color} strokeWidth={2.5} dot={{ r:3 }} />)}
      </LineChart></ResponsiveContainer></div>
    <div className="card"><div className="card-title"><BarChart3 size={11} /> Tabla comparativa <Info text="TCO = costo total de propiedad. CAE = costo anual equivalente (el comparador correcto)." /></div>
      <div className="card-blurb">Ordena tu decisión por <strong>CAE</strong> (menor = mejor valor) y <strong>$/km</strong>. La fila en verde es el mejor valor.</div>
      <div style={{ overflowX:'auto' }}><table className="tbl"><thead><tr><th>Escenario</th><th>Auto</th><th>Motor</th><th className="num">Precio</th><th className="num">Mensual</th><th className="num">TCO neto</th><th className="num">$/km</th><th className="num">CAE/año</th><th className="num">Reventa</th>{anyUber && <><th className="num">Equilibrio</th><th className="num">Result. neto</th></>}</tr></thead><tbody>
        {all.map((s,i) => { const R2 = s.result; const isBest = s.sid===bestEac.sid; return (<tr key={s.sid} style={{ background: isBest?'#e7f0e4':(s.name==='Actual'?'var(--bg-2)':'transparent') }}>
          <td style={{ fontFamily:'Manrope', fontWeight:500 }}><span style={{ display:'inline-block', width:8, height:8, borderRadius:50, background:s.color, marginRight:6 }} />{s.name}{isBest && <span className="pill accent" style={{ marginLeft:6 }}>Mejor</span>}</td>
          <td style={{ fontSize:11 }}>{carDisplayName(s.inputs).split(' ').slice(0,3).join(' ')}{s.inputs.vehicleCondition==='used' ? ' (usado)' : ''}</td>
          <td>{VEHICLE_TYPES[s.inputs.vehicleType]?.label || '—'}</td>
          <td className="num">{fmtMXN(R2.carPrice)}</td>
          <td className="num">{fmtMXN(R2.monthlyTotalOperative)}</td>
          <td className="num">{fmtMXN(R2.tcoTotal)}</td>
          <td className="num">{isFinite(R2.costPerKm) ? fmtMXN(R2.costPerKm,2) : '—'}</td>
          <td className="num"><strong>{fmtMXN(R2.eac)}</strong></td>
          <td className="num">{fmtMXN(R2.actualSalePrice)}</td>
          {anyUber && <><td className="num">{R2.isUberMode ? fmtN(R2.breakEvenTrips,0) : '—'}</td>
          <td className={`num ${R2.netProjectResult>=0?'pos':'neg'}`}>{R2.isUberMode ? fmtMXN(R2.netProjectResult) : '—'}</td></>}
        </tr>); })}
      </tbody></table></div></div>
  </>);
};

// ============================================================================
// PÁGINA: SENSIBILIDAD  ·  Objetivos solicitados por el usuario
// ----------------------------------------------------------------------------
// Parte del alcance "Completo: + Monte Carlo + sensibilidad + multi-carro".
// Petición de claridad: explicar en lenguaje simple qué hace este análisis.
//   - Muestra QUÉ variables mueven más el punto de equilibrio si suben/bajan,
//     para que el usuario sepa dónde poner atención (tornado chart).
//   - Verde a la izquierda = baja la variable, necesitas menos viajes (mejor).
//     Rojo a la derecha = sube la variable, necesitas más viajes (peor).
//   - Incluye seguro, mantenimiento y misceláneos (variables nuevas agregadas).
// ============================================================================
const Sensitivity = ({ inputs }) => {
  const data = useMemo(() => sensitivity(inputs), [inputs]);
  const maxAbs = Math.max(...data.map(d => Math.max(Math.abs(d.low), Math.abs(d.high))));
  const uber = inputs.operationMode !== 'no-uber';
  const metricName = uber ? 'el punto de equilibrio' : 'el costo neto del proyecto';
  const fmtRange = (v) => uber ? `${fmtN(v,0)} viajes/mes` : fmtMXN(v);
  return (<>
    <div className="card" style={{ marginBottom:18 }}><div className="card-title"><Sliders size={11} /> Análisis de sensibilidad</div>
      <div className="card-blurb"><strong>¿Qué pasa si una variable cambia?</strong> Te mostramos cuánto se mueve {metricName} si cada variable sube o baja. Las barras más largas son las que más afectan tu plan. {uber ? '' : '(En modo sin Uber medimos el impacto sobre el costo neto, ya que no hay viajes que calcular.)'}</div>
      <div>{data.map(d => (<div key={d.key} style={{ marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}><span>{d.label} <span style={{ color:'var(--muted)' }}>(±{(d.delta*100).toFixed(0)}%)</span></span><span className="mono" style={{ fontSize:11, color:'var(--muted)' }}>Mueve hasta {d.metricUnit==='MXN' ? fmtMXN(d.range) : `${fmtN(d.range,0)} viajes`}</span></div>
        <div style={{ position:'relative', height:18, background:'var(--bg-2)', borderRadius:2 }}>
          <div style={{ position:'absolute', left:'50%', top:0, bottom:0, width:1, background:'var(--ink)', zIndex:2 }} />
          <div style={{ position:'absolute', top:0, bottom:0, right:'50%', width:`${Math.abs(d.low)/maxAbs*50}%`, background: d.low<0?'var(--pos)':'var(--neg)', opacity:0.85 }} />
          <div style={{ position:'absolute', top:0, bottom:0, left:'50%', width:`${Math.abs(d.high)/maxAbs*50}%`, background: d.high>0?'var(--neg)':'var(--pos)', opacity:0.85 }} />
        </div></div>))}</div>
      <div style={{ fontSize:11, color:'var(--muted)', marginTop:14, lineHeight:1.6 }}>{uber ? <><strong style={{ color:'var(--pos)' }}>Verde a la izquierda</strong> = cuando baja, necesitas menos viajes (mejor). <strong style={{ color:'var(--neg)' }}>Rojo a la derecha</strong> = cuando sube, necesitas más viajes.</> : <><strong style={{ color:'var(--pos)' }}>Verde</strong> = baja el costo neto (mejor). <strong style={{ color:'var(--neg)' }}>Rojo</strong> = sube el costo neto.</>}</div></div>
    <div className="card"><div className="card-title"><Sparkles size={11} /> En resumen</div>
      <p className="italic-serif" style={{ fontSize:17, lineHeight:1.5, margin:0 }}>Lo que <span style={{ color:'var(--accent)' }}>más mueve la aguja</span> es <strong>{data[0].label.toLowerCase()}</strong>. Si cambia ±{(data[0].delta*100).toFixed(0)}%, {metricName} se mueve hasta <strong>{fmtRange(data[0].range)}</strong>.</p></div>
  </>);
};

// ============================================================================
// PÁGINA: MONTE CARLO  ·  Objetivos solicitados por el usuario
// ----------------------------------------------------------------------------
// Alcance original elegido: "Completo: + Monte Carlo + sensibilidad + multi-carro".
// Petición de claridad posterior: explicar en términos fáciles QUÉ es Monte Carlo,
// PARA QUÉ sirve y QUÉ se simula realmente (sin tecnicismos sin explicar).
//   - Repite el cálculo miles de veces variando al azar los valores inciertos
//     (tarifa, combustible, comisión Uber, mantenimiento, seguro, depreciación,
//     viajes/hora) para estimar la PROBABILIDAD de que el plan funcione (riesgo).
//   - Reporta probabilidad de éxito, P10/P50/P90 de viajes y de resultado final,
//     e histograma de distribución del punto de equilibrio.
//   - El card-blurb lista textualmente qué variable se mueve y cuánto.
// ============================================================================
const MonteCarlo = ({ inputs }) => {
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [iterations, setIterations] = useState(3000);
  const run = () => { setRunning(true); setTimeout(() => { setResults(runMonteCarlo(inputs, iterations)); setRunning(false); }, 50); };
  return (<>
    <div className="card" style={{ marginBottom:18 }}><div className="card-title"><Dice5 size={11} /> Simulación Monte Carlo</div>
      <div className="card-blurb" style={{ marginBottom:18 }}><strong>¿Y si la realidad no es exactamente como dices?</strong> Monte Carlo repite el cálculo miles de veces variando al azar los valores inciertos para estimar qué tan probable es que tu plan funcione. Es una forma de medir el riesgo.<br /><br />En cada repetición cambia un poco:
        <ul style={{ marginTop:6, marginBottom:0, paddingLeft:18 }}><li>Tarifa por viaje (±12%)</li><li>Precio del combustible (±8%)</li><li>Comisión Uber (±2 puntos %)</li><li>Mantenimiento base anual (±25%)</li><li>Seguro mensual (±15%)</li><li>Depreciación (±4 puntos %)</li><li>Viajes/hora (varía un poco, máx 4)</li></ul></div>
      <div style={{ display:'flex', gap:8, alignItems:'center', justifyContent:'flex-end' }}><span style={{ fontSize:11, color:'var(--muted)' }}>Repeticiones:</span>
        <select className="select" style={{ width:110 }} value={iterations} onChange={e => setIterations(parseInt(e.target.value))}><option value={1000}>1,000</option><option value={3000}>3,000</option><option value={10000}>10,000</option></select>
        <button className="btn accent" onClick={run} disabled={running}>{running ? 'Corriendo…' : 'Ejecutar simulación'}</button></div></div>
    {results && (<>
      <div className="kpi-grid">
        <div className="kpi accent"><div className="kpi-label">Probabilidad de éxito</div><div className="kpi-value mono">{fmtPct(results.feasibleRate,1)}</div><div className="kpi-sub">de {results.iterations.toLocaleString()} simulaciones tu plan funciona</div></div>
        <div className="kpi"><div className="kpi-label">Viajes/mes esperados <Info text="<strong>P50</strong> = el valor más probable. <strong>P10–P90</strong> = rango donde caen el 80% de los casos." /></div><div className="kpi-value mono">{fmtN(results.be.p50,0)}</div><div className="kpi-sub">Optimista: {fmtN(results.be.p10,0)} · Pesimista: {fmtN(results.be.p90,0)}</div></div>
        <div className="kpi"><div className="kpi-label">Liquidación esperada <Info text={TIPS.liquidation} /></div><div className="kpi-value mono" style={{ color: results.fp.p50>=0?'var(--pos)':'var(--neg)' }}>{fmtMXN(results.fp.p50)}</div><div className="kpi-sub">Pesimista {fmtMXN(results.fp.p10)} · Optimista {fmtMXN(results.fp.p90)}</div></div>
        <div className="kpi accent"><div className="kpi-label">Resultado neto esperado <Info text={TIPS.netResult} /></div><div className="kpi-value mono" style={{ color: results.net.p50>=0?'var(--pos)':'var(--neg)' }}>{fmtMXN(results.net.p50)}</div><div className="kpi-sub">Pesimista {fmtMXN(results.net.p10)} · Optimista {fmtMXN(results.net.p90)}</div></div>
      </div>
      <div className="card"><div className="card-title"><BarChart3 size={11} /> Distribución del punto de equilibrio <Info text="Cuántas veces, de las miles de simulaciones, salió cada número de viajes/mes." /></div>
        <ResponsiveContainer width="100%" height={280}><BarChart data={results.hist}>
          <CartesianGrid stroke="#e6dccc" strokeDasharray="2 4" /><XAxis dataKey="rangeLabel" stroke="#7a6e5e" fontSize={10} interval={2} /><YAxis stroke="#7a6e5e" fontSize={11} />
          <Tooltip contentStyle={{ background:'#fdfaf2', border:'1px solid #d9cdb7', borderRadius:3 }} /><Bar dataKey="count" fill="#b8431f" fillOpacity={0.85} radius={[2,2,0,0]} />
        </BarChart></ResponsiveContainer></div>
    </>)}
    {!results && !running && (<div className="card" style={{ textAlign:'center', padding:60, color:'var(--muted)' }}><Dice5 size={32} style={{ marginBottom:12 }} /><div className="serif" style={{ fontSize:22, color:'var(--ink)' }}>Listo para simular</div><div style={{ fontSize:13, marginTop:6 }}>Presiona <strong>Ejecutar simulación</strong> arriba.</div></div>)}
  </>);
};

// ============================================================================
// PÁGINA: FÓRMULAS  ·  Objetivos solicitados por el usuario
// ----------------------------------------------------------------------------
// Petición: "Quiero poder ver las fórmulas utilizadas en el front."
//   - Mostrar TODAS las ecuaciones del simulador con los valores actuales ya
//     sustituidos, para auditar de dónde sale cada número y para el reporte.
//   - Incluye: mensualidad (anualidad), VP, VF, costo del dinero, depreciación
//     lineal por tasa anual, ganancia neta/viaje, punto de equilibrio,
//     intensidad de trabajo (horas), inflación de combustible (P_n=P_0(1+i)^n),
//     costo total del proyecto / resultado final, y tiempo de carga (EV/híbrido enchufable).
//   - Nota de accesibilidad: el usuario pidió "seguir usando lenguaje técnico
//     pero con explicaciones" → cada fórmula trae su "donde..." en lenguaje simple.
// ============================================================================
const Formulas = ({ R, inputs }) => {
  const i = inputs.interestRate / 12; const n = R.months;
  const dm = inputs.depreciationMethod || 'declining';
  const depName = dm==='straight' ? 'lineal (saldo original)' : dm==='realistic' ? 'realista (caída 1er año + saldo decreciente)' : 'saldo decreciente (geométrico)';
  return (<div style={{ maxWidth:820 }}>
    <h1 className="serif" style={{ fontSize:38, margin:'0 0 8px' }}>Fórmulas usadas</h1>
    <p style={{ color:'var(--muted)', marginBottom:28, lineHeight:1.7 }}>Todas las ecuaciones del simulador con los valores actuales sustituidos. Las primeras son de ingeniería financiera de plazos (anualidad, VP/VF); las nuevas (VPN, TIR, CAE, CAT) son las que se usan en una decisión de inversión/compra real.</p>

    <div className="formula-block"><div className="formula-name">1 · Mensualidad del crédito (anualidad)</div>
      <div className="formula-eq">A <span className="op">=</span> P <span className="op">×</span><span className="frac"><span>i (1 + i)<sup>n</sup></span><span>(1 + i)<sup>n</sup> − 1</span></span></div>
      <div className="formula-where"><em>P</em> = lo que financias, <em>i</em> = tasa mensual = anual ÷ 12, <em>n</em> = meses.</div>
      <div className="formula-substituted">A = {fmtMXN(R.financed)} × [{i.toFixed(5)} × (1+{i.toFixed(5)})^{n}] / [(1+{i.toFixed(5)})^{n} − 1] = <strong>{fmtMXN(R.monthlyPayment)}/mes</strong></div></div>

    <div className="formula-block"><div className="formula-name">2 · Valor Presente (VP)</div>
      <div className="formula-eq">VP <span className="op">=</span> A <span className="op">×</span><span className="frac"><span>1 − (1 + i)<sup>−n</sup></span><span>i</span></span> <span className="op">+</span> Enganche</div>
      <div className="formula-where">Trae cada mensualidad futura a valor de hoy.</div>
      <div className="formula-substituted">VP = {fmtMXN(R.monthlyPayment)} × [1−(1+{i.toFixed(5)})^−{n}]/{i.toFixed(5)} + {fmtMXN(R.cashPaid)} = <strong>{fmtMXN(R.pvTotal)}</strong></div></div>

    <div className="formula-block"><div className="formula-name">3 · Valor Futuro (VF)</div>
      <div className="formula-eq">VF <span className="op">=</span> A <span className="op">×</span> n <span className="op">+</span> Enganche <span className="op">+</span> Comisiones</div>
      <div className="formula-substituted">VF = {fmtMXN(R.monthlyPayment)} × {n} + {fmtMXN(R.cashPaid)} + {fmtMXN(R.openingFee)} = <strong>{fmtMXN(R.fvTotal)}</strong></div></div>

    <div className="formula-block"><div className="formula-name">4 · Costo del dinero</div>
      <div className="formula-eq">Δ <span className="op">=</span> VF <span className="op">−</span> VP</div>
      <div className="formula-where">Lo que cuesta pagar a plazos en vez de de contado.</div>
      <div className="formula-substituted">Δ = {fmtMXN(R.fvTotal)} − {fmtMXN(R.pvTotal)} = <strong>{fmtMXN(R.timeValueOfMoney)}</strong></div></div>

    <div className="formula-block"><div className="formula-name">5 · Depreciación — método {depName}</div>
      <div className="formula-eq">{dm==='straight'
        ? <>V<sub>n</sub> <span className="op">=</span> V<sub>0</sub> <span className="op">×</span> (1 − d · n)</>
        : dm==='realistic'
          ? <>V<sub>1</sub> = V<sub>0</sub>(1 − d<sub>1</sub>) <span className="op">;</span> V<sub>n</sub> = V<sub>1</sub>(1 − d)<sup>n−1</sup></>
          : <>V<sub>n</sub> <span className="op">=</span> V<sub>0</sub> <span className="op">×</span> (1 − d)<sup>n</sup></>}</div>
      <div className="formula-where"><em>V<sub>0</sub></em> = precio, <em>d</em> = tasa anual, <em>n</em> = años. {dm==='straight' ? 'Resta el mismo monto del precio original cada año.' : dm==='realistic' ? 'Caída fuerte el primer año y luego saldo decreciente (lo más realista para autos nuevos).' : 'Pierde el mismo % del valor RESTANTE cada año (saldo decreciente, lo estándar para autos).'} El activo nunca vale menos de 0.</div>
      <div className="formula-substituted">V<sub>{inputs.horizonYears}</sub> = {fmtMXN(R.valueAtEnd)} ({fmtPct(R.valueAtEnd/Math.max(1,inputs.carPrice),0)} del precio) · venta neta esperada {fmtMXN(R.actualSalePrice)} · <strong>costo por depreciación {fmtMXN(R.depreciationCost)}</strong></div></div>

    <div className="formula-block"><div className="formula-name">6 · Contribución neta por viaje</div>
      <div className="formula-eq">Ingreso <span className="op">=</span> T − (T·c<sub>uber</sub>) − (T·t) <span className="op">;</span> Contrib <span className="op">=</span> Ingreso <span className="op">−</span> costo<sub>var</sub>·km<sub>viaje</sub></div>
      <div className="formula-where"><em>T</em> = tarifa bruta, <em>c<sub>uber</sub></em> = comisión, <em>t</em> = impuestos sobre tarifa bruta. El costo variable por km combina energía y mantenimiento base convertido a $/km con desgaste Uber.</div>
      <div className="formula-substituted">Ingreso = {fmtMXN(R.grossPerTrip)} − {fmtMXN(R.platformCommission,2)} − {fmtMXN(R.taxAmountPerTrip,2)} = {fmtMXN(R.netRevenuePerTrip,2)} · Costo var = {fmtMXN(R.variableCostPerTrip,2)} · <strong>Contribución = {fmtMXN(R.netContributionPerTrip,2)}/viaje</strong></div></div>

    <div className="formula-block"><div className="formula-name">7 · Punto de equilibrio (margen de contribución)</div>
      <div className="formula-eq">E <span className="op">=</span><span className="frac"><span>C<sub>fijos</sub></span><span>Contrib<sub>viaje</sub></span></span></div>
      <div className="formula-where">Costos mensuales + recuperación del proyecto + meta de ganancia. La recuperación del proyecto es la parte del desembolso inicial que no queda cubierta por venta final − deuda.</div>
      <div className="formula-substituted">E = ({fmtMXN(R.operatingFixedMonthlyCosts)} + {fmtMXN(R.projectRecoveryMonthly)} + {fmtMXN(R.profitTarget)}) ÷ {fmtMXN(R.netContributionPerTrip,2)} = <strong>{fmtN(R.breakEvenTrips,0)} viajes/mes</strong></div></div>

    <div className="formula-block"><div className="formula-name">8 · Intensidad de trabajo</div>
      <div className="formula-eq">h<sub>día</sub> <span className="op">=</span><span className="frac"><span>E / d</span><span>v</span></span><span className="op">;</span> h<sub>semana</sub> <span className="op">=</span> h<sub>día</sub> <span className="op">×</span> (d / 4.33)</div>
      <div className="formula-where"><em>d</em> = días/mes, <em>v</em> = viajes/hora (máx 4).</div>
      <div className="formula-substituted">h<sub>día</sub> = ({fmtN(R.breakEvenTrips,0)}/{inputs.workDaysPerMonth})/{inputs.tripsPerHour} = <strong>{fmtFixed(R.hoursPerDay)} hrs/día</strong> · h<sub>semana</sub> = <strong>{fmtFixed(R.hoursPerWeek)} hrs/sem</strong></div></div>

    <div className="formula-block"><div className="formula-name">9 · Inflación del combustible</div>
      <div className="formula-eq">F<sub>n</sub> <span className="op">=</span> F<sub>0</sub> <span className="op">×</span> (1 + i<sub>f</sub>)<sup>n</sup></div>
      <div className="formula-where">Crecimiento geométrico del precio. <em>i<sub>f</sub></em> = inflación anual.</div>
      <div className="formula-substituted">F<sub>{inputs.horizonYears}</sub> = ${inputs.fuelPrice.toFixed(2)} × (1+{inputs.fuelInflation})^{inputs.horizonYears} = <strong>${(inputs.fuelPrice * Math.pow(1+inputs.fuelInflation, inputs.horizonYears)).toFixed(2)}/L</strong> en {2025+inputs.horizonYears}</div></div>

    <div className="formula-block"><div className="formula-name">10 · Costo neto y resultado neto del proyecto</div>
      <div className="formula-eq">Recuperas <span className="op">=</span> Venta <span className="op">−</span> Deuda ; Costo<sub>neto</sub> <span className="op">=</span> Gasto<sub>total</sub> <span className="op">−</span> Recuperas ; Neto <span className="op">=</span> Ingresos <span className="op">+</span> Recuperas <span className="op">−</span> Gasto<sub>total</sub></div>
      <div className="formula-where">Lo que recuperas al final es la venta MENOS la deuda viva (no la venta completa). El costo neto descuenta esa recuperación real; el resultado neto suma además los ingresos de Uber.</div>
      <div className="formula-substituted">Recuperas = venta − deuda = {fmtMXN(R.actualSalePrice)} − {fmtMXN(R.remainingDebt)} = {fmtMXN(R.terminalRecovery)} · Costo neto = {fmtMXN(R.totalSpentGross)} − {fmtMXN(R.terminalRecovery)} = <strong>{fmtMXN(R.totalProjectCost)}</strong> · Resultado neto = <strong style={{ color: R.netProjectResult>=0?'var(--pos)':'var(--neg)' }}>{fmtMXN(R.netProjectResult)}</strong></div></div>

    <div className="formula-block" style={{ borderColor:'var(--accent)' }}><div className="formula-name">11 · Valor Presente Neto (VPN / NPV)</div>
      <div className="formula-eq">VPN <span className="op">=</span> <span style={{ fontSize:'0.8em' }}>Σ</span><span className="frac"><span>FE<sub>t</sub></span><span>(1 + k)<sup>t</sup></span></span></div>
      <div className="formula-where"><em>FE<sub>t</sub></em> = flujo de efectivo del año <em>t</em> (− sale, + entra; t=0 es el desembolso inicial), <em>k</em> = tasa de descuento (oportunidad). VPN &gt; 0 = el proyecto crea valor frente a invertir tu dinero a la tasa <em>k</em>.</div>
      <div className="formula-substituted">k = {fmtPct(R.discountAnnual,1)} · VPN del proyecto = <strong style={{ color: R.npvProject>=0?'var(--pos)':'var(--neg)' }}>{fmtMXN(R.npvProject)}</strong> · valor presente del costo de propiedad = <strong>{fmtMXN(R.pvLifetimeCost)}</strong></div></div>

    {isFinite(R.irrProject) && (R.isUberMode) && (
      <div className="formula-block"><div className="formula-name">12 · Tasa Interna de Retorno (TIR / IRR)</div>
        <div className="formula-eq">0 <span className="op">=</span> <span style={{ fontSize:'0.8em' }}>Σ</span><span className="frac"><span>FE<sub>t</sub></span><span>(1 + TIR)<sup>t</sup></span></span></div>
        <div className="formula-where">La tasa que hace VPN = 0: el rendimiento anual real del proyecto. Conviene si TIR &gt; tasa de descuento.</div>
        <div className="formula-substituted">TIR = <strong>{fmtPct(R.irrProject,1)}</strong> vs descuento {fmtPct(R.discountAnnual,1)} → {R.irrProject>=R.discountAnnual ? 'crea valor' : 'no supera tu costo de oportunidad'}</div></div>
    )}

    <div className="formula-block" style={{ borderColor:'var(--accent)' }}><div className="formula-name">13 · Costo Anual Equivalente (CAE / EAC)</div>
      <div className="formula-eq">CAE <span className="op">=</span> VP<sub>costo</sub> <span className="op">÷</span><span className="frac"><span>1 − (1 + k)<sup>−N</sup></span><span>k</span></span></div>
      <div className="formula-where">Convierte el costo total (en valor presente) en una renta anual uniforme. Es el comparador correcto entre autos que conservas distinto número de años: el de menor CAE es el de mejor valor.</div>
      <div className="formula-substituted">CAE = {fmtMXN(R.pvLifetimeCost)} ÷ factor(k={fmtPct(R.discountAnnual,1)}, N={inputs.horizonYears}) = <strong>{fmtMXN(R.eac)}/año</strong></div></div>

    {R.financed > 0 && (
      <div className="formula-block"><div className="formula-name">14 · CAT y tasa efectiva anual</div>
        <div className="formula-eq">(P − comisión) <span className="op">=</span> A · <span className="frac"><span>1 − (1+j)<sup>−n</sup></span><span>j</span></span> <span className="op">;</span> CAT = (1+j)<sup>12</sup> − 1</div>
        <div className="formula-where"><em>j</em> = tasa mensual que iguala lo que REALMENTE recibes (financiado − comisión de apertura) con tus pagos. El CAT incluye la comisión; por eso es mayor que el interés de lista.</div>
        <div className="formula-substituted">Interés lista {fmtPct(inputs.interestRate,1)} · efectiva {fmtPct(R.ear,1)} · <strong>CAT {fmtPct(R.cat,1)}</strong></div></div>
    )}

    {R.financed > 0 && (
      <div className="formula-block"><div className="formula-name">15 · ¿Financiar o pagar de contado?</div>
        <div className="formula-eq">Δ <span className="op">=</span> Precio<sub>contado</sub> <span className="op">−</span> [Enganche + Comisión + VP<sub>pagos</sub>(k)]</div>
        <div className="formula-where">Compara, en valor de hoy, pagar de contado vs. financiar invirtiendo tu dinero a la tasa de oportunidad <em>k</em>. Δ &gt; 0 = financiar conviene (tu dinero rinde más que el crédito).</div>
        <div className="formula-substituted">Δ = {fmtMXN(R.pvCashPath)} − {fmtMXN(R.pvFinancedPath)} = <strong style={{ color: R.financeVsCashPV>=0?'var(--pos)':'var(--neg)' }}>{fmtMXN(R.financeVsCashPV)}</strong> → {R.financeVsCashPV>=0 ? 'financiar' : 'contado'} conviene</div></div>
    )}

    {isFinite(R.costPerKm) && (
      <div className="formula-block"><div className="formula-name">16 · Costo total de propiedad por km</div>
        <div className="formula-eq">$/km <span className="op">=</span><span className="frac"><span>TCO</span><span>km<sub>totales</sub></span></span></div>
        <div className="formula-where">TCO = costo neto de propiedad; km totales = (km Uber + km personales) × horizonte.</div>
        <div className="formula-substituted">$/km = {fmtMXN(R.tcoTotal)} ÷ {fmtN(R.totalKmHorizon)} km = <strong>{fmtMXN(R.costPerKm,2)}/km</strong></div></div>
    )}

    {R.chargingHoursPerDay > 0 && (
      <div className="formula-block"><div className="formula-name">17 · Tiempo de carga eléctrica diario</div>
        <div className="formula-eq">t<sub>carga</sub> <span className="op">=</span><span className="frac"><span>km<sub>diarios</sub> / η<sub>eléc</sub></span><span>P<sub>cargador</sub></span></span></div>
        <div className="formula-where"><em>η<sub>eléc</sub></em> = km/kWh, <em>P<sub>cargador</sub></em> = potencia del cargador.</div>
        <div className="formula-substituted">t<sub>carga</sub> = ({fmtN(R.totalDailyKm,1)} / {inputs.kmPerKwh}) / {inputs.chargerPowerKw} = <strong>{fmtFixed(R.chargingHoursPerDay)} hrs/día</strong></div></div>
    )}
    {R.isEV && (
      <div className="formula-block"><div className="formula-name">18 · Autonomía eléctrica</div>
        <div className="formula-eq">Rango <span className="op">=</span> batería <span className="op">×</span> 90% <span className="op">×</span> km/kWh</div>
        <div className="formula-where">Si los km diarios superan una carga útil, el plan no se marca viable.</div>
        <div className="formula-substituted">Rango = {fmtN(R.usableKwh,1)} kWh × {inputs.kmPerKwh} = <strong>{fmtN(R.dailyRangeKm,0)} km/día</strong>; uso = <strong>{fmtN(R.totalDailyKm,0)} km/día</strong></div></div>
    )}
  </div>);
};

const SOURCE_LABELS = {
  price:'Precio', plugInHybrid:'Híbrido enchufable', kmpl:'Rendimiento km/L', kmPerKwh:'Rendimiento km/kWh', batteryCapacityKwh:'Batería',
  chargerPowerKw:'Potencia cargador', uberKmPerTrip:'Km por viaje',
  monthlyInsurance:'Seguro (póliza Uber)', annualMaintenance:'Mantenimiento base', monthlyRefrendo:'Refrendo/Tenencia',
  dataPlan:'Datos móviles', carWash:'Lavado', carWashTips:'Propinas', miscellaneous:'Misceláneos',
  accessories:'Accesorios', uberWearFactor:'Desgaste Uber', depreciationRate:'Depreciación',
  salesFactor:'Factor de venta', toxicologyReport:'Examen toxicológico', uberCertification:'Certificación Uber',
  condition:'Condición (nuevo/usado)', odometerKm:'Kilometraje', repairReserveAnnual:'Reserva de reparaciones',
  depreciationMethod:'Método de depreciación', firstYearDepreciation:'Caída 1er año', sellingCostPct:'Costo de venta',
  interestRate:'Tasa de crédito', acquisitionFees:'Gastos de adquisición',
};

// ============================================================================
// PÁGINA: IMPORTAR / AI  ·  Objetivos solicitados por el usuario
// ----------------------------------------------------------------------------
// Petición original (turno de mejoras): "Quiero agregar una vista donde pueda
// poner un nuevo modelo de carro por nombre, después haya un botón 'generar
// prompt para búsqueda con AI' donde se genere un prompt con todos los
// variables que se ocupan poblar, pedido de manera estructurada tipo JSON; y
// con otro botón de importar, pueda pegar/subir un JSON y la aplicación genere
// otro caso con esos valores y lo visualice en el resto de la app."
// Petición posterior: "Asegúrate que la investigación con AI llene TODAS las
// variables y CITE FUENTES en el lugar apropiado de cada variable, para que al
// llenar un carro nuevo puedas verificar que la info está respaldada por
// información real y reputable."
//   - Paso 1: input de nombre del auto → genera prompt JSON estricto (con bloque
//     "sources" que exige una liga por cada dato; estimaciones marcadas [ESTIMACIÓN]).
//   - Paso 2: pegar el JSON → applyImportedJson() valida y aplica al escenario actual.
//   - Las fuentes se guardan y se muestran en tabla (también viajan al Reporte).
// ============================================================================
const ImportCase = ({ inputs, setInputs, sources, setSources }) => {
  const [carName, setCarName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [toast, setToast] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const generate = () => { if (!carName.trim()) { setToast({ type:'error', msg:'Escribe el nombre/modelo del vehículo primero.' }); return; } setPrompt(buildAIPrompt(carName)); setToast(null); };
  const copy = () => { navigator.clipboard.writeText(prompt).then(() => { setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }); };
  const importJson = () => {
    try {
      const cleaned = jsonText.replace(/```json\s*/g,'').replace(/```\s*$/g,'').trim();
      const parsed = JSON.parse(cleaned);
      const { ok, inputs:newInputs, error, sources:newSources } = applyImportedJson(parsed, inputs);
      if (ok) { setInputs(newInputs); if (newSources) setSources(newSources); setToast({ type:'success', msg:'¡Caso importado! Ve al Dashboard para visualizar. Las fuentes aparecen abajo.' }); }
      else setToast({ type:'error', msg:`Error: ${error}` });
    } catch (e) { setToast({ type:'error', msg:`JSON inválido: ${e.message}` }); }
  };
  return (<div style={{ maxWidth:880 }}>
    <h1 className="serif" style={{ fontSize:38, margin:'0 0 8px' }}>Importar otro vehículo</h1>
    <p style={{ color:'var(--muted)', marginBottom:28, lineHeight:1.7 }}>¿Quieres probar otro auto? Genera un prompt para que una IA (Claude, ChatGPT, Gemini, Perplexity) investigue TODAS las variables del vehículo <strong>con una fuente para cada dato</strong>, copia la respuesta JSON aquí, y la app cargará el caso automáticamente — incluyendo las ligas de respaldo para que verifiques la información.</p>
    <div className="card" style={{ marginBottom:22 }}><div className="card-title"><BrainCircuit size={11} /> Paso 1 · Generar prompt para la IA</div>
      <div style={{ display:'flex', gap:10, alignItems:'flex-end', marginBottom:14 }}>
        <div style={{ flex:1 }}><div className="field-label" style={{ marginBottom:4 }}>¿Qué vehículo quieres investigar?</div>
          <input className="input" type="text" value={carName} onChange={e => setCarName(e.target.value)} placeholder="Ej. Tesla Model 3 2026, Ford Ranger Diesel, BYD Atto 3..." /></div>
        <button className="btn accent" onClick={generate}><Sparkles size={12} /> Generar prompt</button></div>
      {prompt && (<>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}><span className="pill accent">Prompt generado</span>
          <button className="btn outline" onClick={copy}><Copy size={11} /> {copySuccess ? 'Copiado ✓' : 'Copiar al portapapeles'}</button></div>
        <pre className="json-out">{prompt}</pre>
        <p style={{ fontSize:12, color:'var(--muted)', marginTop:10, marginBottom:0 }}>Pega esto en tu IA preferida. Te devolverá un JSON con cada variable y su fuente, que copias al paso 2.</p>
      </>)}</div>
    <div className="card" style={{ marginBottom: sources ? 22 : 0 }}><div className="card-title"><FileJson size={11} /> Paso 2 · Importar el JSON</div>
      <p style={{ fontSize:12, color:'var(--muted)', marginTop:0, marginBottom:12 }}>Pega el JSON que recibiste de la IA. La app aplicará todos los valores al escenario actual y guardará las fuentes.</p>
      <textarea className="textarea" value={jsonText} onChange={e => setJsonText(e.target.value)} placeholder={'{\n  "vehicle": {...},\n  "costs": {...},\n  "oneTime": {...},\n  "projection": {...},\n  "sources": {...}\n}'} style={{ minHeight:220 }} />
      <div style={{ display:'flex', gap:10, marginTop:12, alignItems:'center' }}>
        <button className="btn accent" onClick={importJson} disabled={!jsonText.trim()}><Upload size={11} /> Importar y aplicar</button>
        <button className="btn outline" onClick={() => { setJsonText(''); setToast(null); }}>Limpiar</button></div>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}</div>
    {sources && (<div className="card"><div className="card-title"><FileText size={11} /> Fuentes de los datos importados</div>
      <div className="card-blurb">Cada dato del vehículo importado, con su liga de respaldo. Verifica que provengan de fuentes confiables.</div>
      <table className="tbl"><thead><tr><th>Variable</th><th>Fuente</th></tr></thead><tbody>
        {Object.entries(sources).map(([k,v]) => (<tr key={k}><td style={{ fontFamily:'Manrope', fontWeight:500 }}>{SOURCE_LABELS[k] || k}</td>
          <td style={{ wordBreak:'break-all', fontSize:11 }}>{typeof v==='string' && v.startsWith('http') ? <a href={v} target="_blank" rel="noreferrer" style={{ color:'var(--accent)' }}>{v}</a> : <span style={{ color: v && String(v).includes('[ESTIM') ? 'var(--warn)' : 'var(--muted)' }}>{String(v)}</span>}</td></tr>))}
      </tbody></table></div>)}
  </div>);
};

// ============================================================================
// PÁGINA: REPORTE  ·  Objetivos solicitados por el usuario
// ----------------------------------------------------------------------------
// Entregable académico del problema (Actividades 1-A a 1-D):
//   - Portada/intro, conclusiones narrativas siguiendo la plantilla del problema,
//     y tabla resumen con todos los números clave.
//   - Act. 1-B: mostrar VP, VF y el "costo del dinero" (VF − VP) diferenciados.
//   - Act. 1-C: punto de equilibrio + intensidad (días/sem, horas/día, horas/sem).
//     El usuario pidió explícitamente que las HORAS POR SEMANA aparezcan en la
//     pantalla final ("recuerda las instrucciones especificaron...").
//   - Act. 1-D: depreciación, valor de rescate y los 3 escenarios de liquidación
//     (crédito pagado / venta cubre saldo / venta NO cubre saldo = déficit).
// Peticiones posteriores integradas aquí:
//   - TODAS las variables nuevas deben verse en el reporte: seguro mensual,
//     refrendo, lavado, propinas, misceláneos, y los pagos iniciales únicos
//     (toxicológico + certificación) como desembolso de una sola vez.
//   - Desglose de gasto total del horizonte + costo neto del proyecto.
//   - Si se importó un auto con IA, listar la TABLA DE FUENTES (una liga por dato)
//     para poder verificar que la info viene de fuentes reputables.
//   - Si el usuario llenó su ingreso mensual (opcional), mostrar qué % se va al auto.
// ============================================================================
const Report = ({ R, inputs, sources }) => {
  const car = carDisplayName(inputs);
  const city = inputs.cityName || CITY_PRESETS[inputs.city]?.name || 'la ciudad';
  const yearEnd = 2025 + inputs.horizonYears;
  const vehicleLabel = VEHICLE_TYPES[inputs.vehicleType]?.label;
  const carAge = Math.max(0, 2026 - inputs.carYear);
  const isUsed = inputs.vehicleCondition === 'used';
  const incomePct = inputs.monthlyIncome > 0 ? R.monthlyTotalOperative / inputs.monthlyIncome : null;
  const energyName = inputs.vehicleType==='electric' ? 'Energía eléctrica' : (inputs.vehicleType==='diesel' ? 'Diésel' : 'Combustible');

  // --- RECOMENDACIÓN (veredicto de asesor, no narrativa escolar) ------------
  const rec = (() => {
    if (R.isUberMode) {
      if (R.tripsPerHourWarn) return { level:'bad', title:'Replantea los supuestos de Uber', reasons:['Asumes más de 4 viajes/hora, que no es realista. Ajusta antes de decidir.'] };
      if (R.netContributionPerTrip <= 0) return { level:'bad', title:'Cada viaje pierde dinero', reasons:['Con la tarifa y los costos actuales, manejar para Uber no cubre ni el costo variable por viaje.'] };
      if (!R.feasible) return { level:'bad', title:'Inviable con la capacidad disponible', reasons:[`El equilibrio exige ${fmtN(R.breakEvenTrips)} viajes/mes y el máximo posible es ${fmtN(R.maxTripsMonth)}.`] };
      const reasons = [
        `El proyecto se paga solo trabajando ${fmtFixed(R.hoursPerWeek)} hrs/semana (${fmtFixed(R.hoursPerDay)} hrs/día).`,
        `Resultado neto a ${inputs.horizonYears} años: ${fmtMXN(R.netProjectResult)} · VPN ${fmtMXN(R.npvProject)} (tasa ${fmtPct(R.discountAnnual,1)})${isFinite(R.irrProject)?` · TIR ${fmtPct(R.irrProject,1)}`:''}.`,
      ];
      if (R.hoursPerDay > 5) return { level:'warn', title:'Viable, pero exigente', reasons };
      return { level:'ok', title:'Estrategia viable', reasons };
    }
    const reasons = [`Costo total de propiedad: ${fmtMXN(R.tcoTotal)} (${fmtMXN(R.tcoPerYear)}/año · CAE ${fmtMXN(R.eac)}/año).`];
    if (isFinite(R.costPerKm)) reasons.push(`Equivale a ${fmtMXN(R.costPerKm,2)} por kilómetro.`);
    if (R.financed > 0) reasons.push(`Conviene ${R.financeVsCashPV>=0?'financiar':'pagar de contado'} (Δ en valor presente ${fmtMXN(R.financeVsCashPV)}); CAT real ${fmtPct(R.cat,1)}.`);
    if (incomePct != null) {
      if (incomePct > 0.35) return { level:'bad', title:'Pesa demasiado en tu ingreso', reasons:[`El auto se llevaría ${fmtPct(incomePct,0)} de tu ingreso (arriba de 35% es riesgo alto).`, ...reasons] };
      if (incomePct > 0.20) return { level:'warn', title:'Comprable, pero ajustado', reasons:[`El auto se llevaría ${fmtPct(incomePct,0)} de tu ingreso (la regla sana es ≤20%).`, ...reasons] };
      return { level:'ok', title:'Compra dentro de tus posibilidades', reasons:[`El auto representa ${fmtPct(incomePct,0)} de tu ingreso, dentro de lo sano.`, ...reasons] };
    }
    return { level:'warn', title:'Decisión informada', reasons:[...reasons, 'Agrega tu ingreso mensual (panel lateral) para una recomendación de asequibilidad.'] };
  })();
  const recColor = rec.level==='ok' ? 'var(--pos)' : rec.level==='warn' ? 'var(--warn)' : 'var(--neg)';

  const escenario = R.remainingDebt === 0
    ? `el crédito estará completamente pagado, por lo que vender el auto en su valor estimado de ${fmtMXN(R.actualSalePrice)} se traduce en una ganancia neta directa de ${fmtMXN(R.finalPosition)}.`
    : R.actualSalePrice >= R.remainingDebt
      ? `el crédito tendrá un saldo restante de ${fmtMXN(R.remainingDebt)}. La venta del auto en ${fmtMXN(R.actualSalePrice)} cubriría dicho saldo y dejaría una ganancia neta de ${fmtMXN(R.finalPosition)}.`
      : `el crédito tendrá un saldo restante de ${fmtMXN(R.remainingDebt)} mientras que el valor de venta proyectado (${fmtMXN(R.actualSalePrice)}) sería insuficiente, dejando un déficit de ${fmtMXN(Math.abs(R.finalPosition))} que tendría que absorberse de otras fuentes.`;
  const purchaseDesc = inputs.purchaseMode==='cash' ? `pagado en efectivo en su totalidad (${fmtMXN(inputs.carPrice)})`
    : inputs.purchaseMode==='hybrid' ? `pagando ${fmtMXN(R.cashPaid)} en efectivo y financiando los restantes ${fmtMXN(R.financed)}`
    : `con un enganche de ${fmtMXN(R.cashPaid)} (${fmtPct(R.cashPaid/inputs.carPrice,0)}) financiando los restantes ${fmtMXN(R.financed)}`;
  const operationDesc = R.isUberMode ? `que distribuirán durante el mes resultando en ${fmtFixed(R.weeklyDays)} días/semana durante ${fmtFixed(R.hoursPerDay)} horas/día (es decir, ${fmtFixed(R.hoursPerWeek)} horas semanales totales) para obtener ${fmtFixed(R.tripsPerDay)} viajes/día` : `bajo modo de uso exclusivamente personal sin generación de ingresos por plataforma`;
  const oneTimeDesc = R.oneTimeUberCosts>0 ? ` Además, se contemplan pagos iniciales únicos de ${fmtMXN(R.oneTimeUberCosts)} (examen toxicológico ${fmtMXN(inputs.toxicologyReport)} y certificación inicial Uber ${fmtMXN(inputs.uberCertification)}) que se desembolsan una sola vez al inicio.` : '';
  const narrative = `Nuestra conclusión sobre la situación problema fue adquirir un ${car} (motor ${vehicleLabel?.toLowerCase()}, modelo ${inputs.carYear}) por un costo de ${fmtMXN(inputs.carPrice)}, ${purchaseDesc}${R.financed>0 ? ` a un plazo de ${inputs.loanMonths} meses con una tasa de interés del ${fmtPct(inputs.interestRate,1)} anual, resultando en ${inputs.loanMonths} mensualidades de ${fmtMXN(R.monthlyPayment)}` : ''}. ${R.financed>0 ? `Pagaríamos ${fmtMXN(R.totalInterest)} adicionales en intereses, y el Valor Futuro nominal total del crédito (${fmtMXN(R.fvTotal)}) frente a su Valor Presente (${fmtMXN(R.pvTotal)}) refleja un costo del dinero de ${fmtMXN(R.timeValueOfMoney)}.` : ''}

Para evaluar el proyecto en ${city}, consideramos costos mensuales operativos de ${fmtMXN(R.monthlyOpCosts)} que incluyen ${inputs.vehicleType==='electric' ? 'electricidad' : 'combustible'} (${fmtMXN(R.monthlyFuel)}), seguro (${fmtMXN(R.monthlyIns)}), refrendo/tenencia (${fmtMXN(R.monthlyRefrendo)}), mantenimiento ligado a kilometraje (${fmtMXN(R.monthlyMaint)}), datos móviles (${fmtMXN(R.monthlyData)}), lavado (${fmtMXN(R.monthlyCarWash)}), propinas (${fmtMXN(R.monthlyTips)}), misceláneos (${fmtMXN(R.monthlyMisc)}) y accesorios (${fmtMXN(R.monthlyAccess)})${R.financed>0 ? `, más la mensualidad del auto de ${fmtMXN(R.monthlyPayment)}` : ''}, resultando en un total mensual de ${fmtMXN(R.monthlyTotalOperative)}.${oneTimeDesc}

${R.isUberMode ? `Con una tarifa promedio por viaje de ${fmtMXN(R.grossPerTrip)}, descontando comisión Uber de ${fmtMXN(R.platformCommission,2)} e impuestos sobre tarifa bruta de ${fmtMXN(R.taxAmountPerTrip,2)}, obtenemos un ingreso neto antes de km de ${fmtMXN(R.netPerTrip,2)} y una contribución por viaje de ${fmtMXN(R.netContributionPerTrip,2)} después de combustible/mantenimiento. El equilibrio operativo simple sería ${fmtN(R.operatingBreakEvenTrips,0)} viajes/mes; para que el proyecto completo se pague solo se agrega una recuperación mensual de ${fmtMXN(R.projectRecoveryMonthly)} y el objetivo queda en ${fmtN(R.breakEvenTrips,0)} viajes/mes, ${operationDesc}.` : `Bajo el modo de uso personal, no hay punto de equilibrio que calcular: simplemente cargamos el costo total mensual al usuario.`}

A lo largo de ${inputs.horizonYears} años, el gasto bruto total del proyecto suma ${fmtMXN(R.totalSpentGross)}; al final se recupera ${fmtMXN(R.terminalRecovery)} (valor de venta ${fmtMXN(R.actualSalePrice)} menos la deuda viva ${fmtMXN(R.remainingDebt)}), por lo que el costo neto del proyecto es ${fmtMXN(R.totalProjectCost)}${R.isUberMode ? ` y, sumando los ingresos de Uber, el resultado neto del proyecto es ${fmtMXN(R.netProjectResult)}` : ''}. Al final del año ${yearEnd}, ${escenario}`;
  const months = inputs.horizonYears * 12;
  // Desglose con TOTALES reales del horizonte (ya con inflación y reserva de
  // reparaciones), tomados de los acumulados del último año del flujo.
  const last = R.cashflow[R.cashflow.length - 1] || {};
  const horizonBreakdown = [
    { name:'Auto: crédito/efectivo + desembolso inicial', total: last.cCar || 0 },
    { name: energyName, total: last.cEnergy || 0 },
    { name:'Seguro + refrendo/tenencia', total: last.cInsRef || 0 },
    { name:'Mantenimiento + reparaciones', total: last.cMaint || 0 },
    { name:'Otros (datos, lavado, propinas, misc, accesorios)', total: last.cOther || 0 },
  ].filter(b => b.total > 0);
  // Reporte descargable en Markdown (sirve para pegar en Word/Docs o convertir a PDF).
  const md = `# Análisis de decisión — ${car}
*${isUsed ? 'Usado/seminuevo' : 'Nuevo'} · ${vehicleLabel} · modelo ${inputs.carYear} · ${city} · horizonte ${inputs.horizonYears} años (2026–${yearEnd})*

## Recomendación: ${rec.title}
${rec.reasons.map(r => `- ${r}`).join('\n')}

## La decisión de un vistazo
| Métrica | Valor |
|---|---|
| Precio del vehículo | ${fmtMXN(inputs.carPrice)} |
| Desembolso inicial | ${fmtMXN(R.upfrontCash)} |
| Costo mensual de tener el auto | ${fmtMXN(R.monthlyTotalOperative)} |
| Costo total de propiedad (TCO) | ${fmtMXN(R.tcoTotal)} (${fmtMXN(R.tcoPerYear)}/año) |
| Costo anual equivalente (CAE) | ${fmtMXN(R.eac)}/año |
| Costo por kilómetro | ${isFinite(R.costPerKm) ? fmtMXN(R.costPerKm,2) : '—'} |
| Valor presente del costo (tasa ${fmtPct(R.discountAnnual,1)}) | ${fmtMXN(R.pvLifetimeCost)} |
| Costo por depreciación | ${fmtMXN(R.depreciationCost)} |
| Valor de reventa en ${yearEnd} | ${fmtMXN(R.actualSalePrice)} |
${incomePct!=null ? `| Peso en tu ingreso | ${fmtPct(incomePct,1)} |\n` : ''}${R.financed>0 ? `\n## Financiamiento
- Monto financiado ${fmtMXN(R.financed)} a ${fmtPct(inputs.interestRate,1)} por ${inputs.loanMonths} meses → ${fmtMXN(R.monthlyPayment)}/mes.
- **CAT real ${fmtPct(R.cat,1)}** (tasa efectiva ${fmtPct(R.ear,1)}); intereses totales ${fmtMXN(R.totalInterest)} + apertura ${fmtMXN(R.openingFee)}.
- ¿Financiar o pagar de contado? Δ valor presente = ${fmtMXN(R.financeVsCashPV)} → conviene **${R.financeVsCashPV>=0?'financiar':'pagar de contado'}**.
- VF nominal ${fmtMXN(R.fvTotal)} vs VP ${fmtMXN(R.pvTotal)} (costo del dinero ${fmtMXN(R.timeValueOfMoney)}).
` : `\n## Pago\n- Compra de contado por ${fmtMXN(R.cashPaid)}. Costo de oportunidad de ese dinero en ${inputs.horizonYears} años a ${fmtPct(R.discountAnnual,1)}: ${fmtMXN(R.opportunityCostUpfront)}.\n`}
## Costo total de propiedad (${inputs.horizonYears} años)
${horizonBreakdown.map(b => `- ${b.name}: ${fmtMXN(b.total)}`).join('\n')}
- **Gasto bruto total: ${fmtMXN(R.totalSpentGross)}**
- Menos recuperación al vender (venta neta − deuda): ${fmtMXN(R.terminalRecovery)}
- **Costo neto de propiedad (TCO): ${fmtMXN(R.totalProjectCost)}**
${R.isUberMode ? `\n## Operación en Uber
- Contribución por viaje ${fmtMXN(R.netContributionPerTrip,2)}; equilibrio del proyecto ${fmtN(R.breakEvenTrips,0)} viajes/mes.
- Intensidad: ${fmtFixed(R.weeklyDays)} días/sem · ${fmtFixed(R.hoursPerDay)} hrs/día · ${fmtFixed(R.hoursPerWeek)} hrs/sem.
- Resultado neto del proyecto ${fmtMXN(R.netProjectResult)} · VPN ${fmtMXN(R.npvProject)}${isFinite(R.irrProject)?` · TIR ${fmtPct(R.irrProject,1)}`:''}.\n` : ''}
## Supuestos clave
- Tasa de descuento (oportunidad): ${fmtPct(R.discountAnnual,1)} · Inflación de costos: ${fmtPct(R.generalInflation,1)}/año.
- Depreciación: método ${inputs.depreciationMethod} a ${fmtPct(inputs.depreciationRate,0)}/año · factor de reventa ${inputs.salesFactor.toFixed(2)}× · costo de venta ${fmtPct(R.sellingCostPct,1)}.
${R.totalRepairReserve>0 ? `- Reserva de reparaciones acumulada en el horizonte: ${fmtMXN(R.totalRepairReserve)}.\n` : ''}- Generado por Auto·Pilot. Valida precios y tasas con fuentes oficiales (fabricante, AMDA, Profeco, CFE, banco).
`;
  const copyReport = () => { const blob = new Blob([md], { type:'text/markdown' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `analisis_${car.replace(/[^a-z0-9]+/gi,'_').toLowerCase()}.md`; a.click(); URL.revokeObjectURL(url); };
  const glance = [
    { k:'Precio del vehículo', v:fmtMXN(inputs.carPrice) },
    { k:'Desembolso inicial (día 1)', v:fmtMXN(R.upfrontCash) },
    { k:'Costo mensual de tenerlo', v:fmtMXN(R.monthlyTotalOperative) },
    { k:'Costo total de propiedad (TCO)', v:fmtMXN(R.tcoTotal), strong:true },
    { k:'TCO por año', v:fmtMXN(R.tcoPerYear) },
    { k:'Costo anual equivalente (CAE)', v:`${fmtMXN(R.eac)}/año`, strong:true },
    { k:'Costo por kilómetro', v:isFinite(R.costPerKm)?fmtMXN(R.costPerKm,2):'—' },
    { k:'Valor presente del costo', v:fmtMXN(R.pvLifetimeCost) },
    { k:'Costo por depreciación', v:fmtMXN(R.depreciationCost) },
    { k:`Reventa esperada en ${yearEnd}`, v:fmtMXN(R.actualSalePrice) },
  ];
  return (<div className="card report-body" style={{ padding:'40px 50px' }}>
    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:24, alignItems:'center' }}><span className="pill accent">Análisis de decisión</span><button className="btn outline" onClick={copyReport}><Download size={11} /> Descargar .md</button></div>
    <h1>{R.isUberMode ? 'Comprar un auto y pagarlo con Uber' : 'Comprar un auto: ¿conviene y cuánto cuesta?'}</h1>
    <div style={{ fontFamily:'Manrope', fontSize:13, color:'var(--muted)', letterSpacing:'0.05em', textTransform:'uppercase' }}>{isUsed?'Usado/seminuevo':'Nuevo'} · {car} · {vehicleLabel} · {city} · 2026–{yearEnd}</div>
    {inputs.carDescription && <p style={{ fontSize:13, color:'var(--muted)', marginTop:6 }}>{inputs.carDescription}{carAge>0 ? ` · Modelo ${inputs.carYear} (≈${carAge} ${carAge===1?'año':'años'}${inputs.odometerKm>0?`, ${fmtN(inputs.odometerKm)} km`:''}).` : ` · Modelo ${inputs.carYear} (nuevo).`}</p>}

    <div className="verdict" style={{ borderLeft:`4px solid ${recColor}`, marginTop:18, marginBottom:8, alignItems:'flex-start' }}>
      <div className="verdict-icon">{rec.level==='ok' ? <CheckCircle2 size={22} color={recColor} /> : <AlertTriangle size={22} color={recColor} />}</div>
      <div><div className="verdict-text" style={{ color:recColor }}>Recomendación: {rec.title}</div>
        <ul style={{ margin:'8px 0 0', paddingLeft:18, color:'var(--ink-2)', fontFamily:'Manrope', fontSize:13.5, lineHeight:1.6 }}>{rec.reasons.map((r,i)=><li key={i}>{r}</li>)}</ul></div>
    </div>
    {incomePct!=null && (<p style={{ background:'var(--bg-2)', padding:'12px 16px', borderRadius:4, fontSize:13.5, marginTop:14 }}><strong>Asequibilidad:</strong> con un ingreso de {fmtMXN(inputs.monthlyIncome)}/mes, el auto consume el <strong style={{ color: incomePct>0.3?'var(--neg)':incomePct>0.2?'var(--warn)':'var(--pos)' }}>{fmtPct(incomePct,1)}</strong> de tu sueldo. La regla sana: ≤20%.</p>)}

    <h2>La decisión de un vistazo</h2>
    <table className="tbl"><tbody>
      {glance.map((g,i)=>(<tr key={i}><td style={{ fontFamily:'Manrope', fontWeight: g.strong?700:500 }}>{g.k}</td><td className="num">{g.strong?<strong>{g.v}</strong>:g.v}</td></tr>))}
    </tbody></table>

    {inputs.carJustification && (<><h2>Por qué este vehículo</h2><p>{inputs.carJustification}</p></>)}

    {R.financed>0 ? (<>
      <h2>Análisis del financiamiento</h2>
      <p>Financias {fmtMXN(R.financed)} a una tasa de lista de {fmtPct(inputs.interestRate,1)} por {inputs.loanMonths} meses, lo que da una mensualidad de <strong>{fmtMXN(R.monthlyPayment)}</strong>. Pero la tasa de lista no es el costo real: el <strong>CAT es {fmtPct(R.cat,1)}</strong> (incluye la comisión de apertura) y la tasa efectiva anual es {fmtPct(R.ear,1)}. En total pagarás {fmtMXN(R.totalInterest)} de intereses más {fmtMXN(R.openingFee)} de apertura.</p>
      <p style={{ background: R.financeVsCashPV>=0?'#e7f0e4':'#f7e6e0', padding:'12px 16px', borderRadius:4, fontSize:13.5 }}><strong>¿Financiar o pagar de contado?</strong> Comparando en valor de hoy (tasa de oportunidad {fmtPct(R.discountAnnual,1)}), {R.financeVsCashPV>=0 ? <>te conviene <strong style={{ color:'var(--pos)' }}>financiar</strong>: conservar tu dinero invertido vale {fmtMXN(R.financeVsCashPV)} más que pagar todo de golpe.</> : <>te conviene <strong style={{ color:'var(--neg)' }}>pagar de contado</strong>: financiar cuesta {fmtMXN(Math.abs(R.financeVsCashPV))} más en valor presente.</>}</p>
    </>) : (
      <><h2>Pago de contado</h2><p>Pagas {fmtMXN(R.cashPaid)} de contado. Recuerda el <strong>costo de oportunidad</strong>: ese dinero invertido a {fmtPct(R.discountAnnual,1)} anual generaría ≈{fmtMXN(R.opportunityCostUpfront)} en {inputs.horizonYears} años. No es dinero "gratis" sólo por no pagar intereses.</p></>
    )}

    <h2>Costo total de propiedad ({inputs.horizonYears} años)</h2>
    <table className="tbl"><thead><tr><th>Concepto</th><th className="num">Total del período</th></tr></thead><tbody>
      {horizonBreakdown.map((b,i) => (<tr key={i}><td style={{ fontFamily:'Manrope', fontWeight:500 }}>{b.name}</td><td className="num">{fmtMXN(b.total)}</td></tr>))}
      <tr style={{ borderTop:'2px solid var(--line)' }}><td><strong>Gasto bruto total</strong></td><td className="num"><strong>{fmtMXN(R.totalSpentGross)}</strong></td></tr>
      <tr><td>(−/+) Recuperación terminal real (venta − deuda)</td><td className={`num ${R.terminalRecovery>=0?'pos':'neg'}`}>{R.terminalRecovery>=0 ? `−${fmtMXN(R.terminalRecovery)}` : `+${fmtMXN(Math.abs(R.terminalRecovery))}`}</td></tr>
      <tr><td><strong>Costo neto del proyecto</strong></td><td className="num"><strong>{fmtMXN(R.totalProjectCost)}</strong></td></tr>
    </tbody></table>
    <h2>Tabla resumen</h2>
    <table className="tbl"><tbody>
      <tr><td>Vehículo</td><td className="num">{car} · {vehicleLabel}</td></tr>
      <tr><td>Precio</td><td className="num">{fmtMXN(inputs.carPrice)}</td></tr>
      <tr><td>Modo de compra</td><td className="num" style={{ textTransform:'capitalize' }}>{inputs.purchaseMode}</td></tr>
      <tr><td>Desembolso inicial</td><td className="num">{fmtMXN(R.upfrontCash)}</td></tr>
      {R.financed>0 && (<>
        <tr><td>Monto financiado</td><td className="num">{fmtMXN(R.financed)}</td></tr>
        <tr><td>Tasa / Plazo</td><td className="num">{fmtPct(inputs.interestRate,1)} / {inputs.loanMonths} meses</td></tr>
        <tr><td>Mensualidad</td><td className="num">{fmtMXN(R.monthlyPayment)}</td></tr>
        <tr><td>VF (nominal total)</td><td className="num">{fmtMXN(R.fvTotal)}</td></tr>
        <tr><td>VP (descontado)</td><td className="num">{fmtMXN(R.pvTotal)}</td></tr>
        <tr><td>Costo del dinero (VF − VP)</td><td className="num">{fmtMXN(R.timeValueOfMoney)}</td></tr>
        <tr><td>Intereses pagados</td><td className="num">{fmtMXN(R.totalInterest)}</td></tr>
      </>)}
      {R.oneTimeUberCosts>0 && <tr><td>Trámites iniciales Uber (único)</td><td className="num">{fmtMXN(R.oneTimeUberCosts)}</td></tr>}
      <tr><td>Seguro mensual</td><td className="num">{fmtMXN(R.monthlyIns)}</td></tr>
      <tr><td>Refrendo/tenencia mensual</td><td className="num">{fmtMXN(R.monthlyRefrendo)}</td></tr>
      <tr><td>Lavado + propinas mensual</td><td className="num">{fmtMXN(R.monthlyCarWash + R.monthlyTips)}</td></tr>
      <tr><td>Misceláneos mensual</td><td className="num">{fmtMXN(R.monthlyMisc)}</td></tr>
      <tr><td>Egresos operativos mensuales</td><td className="num">{fmtMXN(R.monthlyTotalOperative)}</td></tr>
      {R.isUberMode && (<>
        <tr><td>Ingreso neto antes de km/viaje</td><td className="num pos">{fmtMXN(R.netPerTrip,2)}</td></tr>
        <tr><td>Contribución después de km/viaje</td><td className={`num ${R.netContributionPerTrip>=0?'pos':'neg'}`}>{fmtMXN(R.netContributionPerTrip,2)}</td></tr>
        <tr><td>Equilibrio operativo</td><td className="num">{fmtN(R.operatingBreakEvenTrips,0)} viajes/mes</td></tr>
        <tr><td>Recuperación mensual del proyecto</td><td className="num">{fmtMXN(R.projectRecoveryMonthly)}</td></tr>
        <tr><td><strong>Punto de equilibrio del proyecto</strong></td><td className="num"><strong>{fmtN(R.breakEvenTrips,0)} viajes/mes</strong></td></tr>
        <tr><td><strong>Intensidad: días/semana</strong></td><td className="num"><strong>{fmtFixed(R.weeklyDays)} días</strong></td></tr>
        <tr><td><strong>Intensidad: horas/día</strong></td><td className="num"><strong>{fmtFixed(R.hoursPerDay)} hrs</strong></td></tr>
        <tr><td><strong>Intensidad: horas/semana</strong></td><td className="num"><strong>{fmtFixed(R.hoursPerWeek)} hrs</strong></td></tr>
        <tr><td>Viajes/día</td><td className="num">{fmtFixed(R.tripsPerDay)}</td></tr>
      </>)}
      <tr><td>Valor depreciado en {yearEnd}</td><td className="num">{fmtMXN(R.valueAtEnd)}</td></tr>
      <tr><td>Precio venta esperado (× {inputs.salesFactor.toFixed(2)})</td><td className="num">{fmtMXN(R.actualSalePrice)}</td></tr>
      <tr><td>Saldo crédito en {yearEnd}</td><td className="num">{fmtMXN(R.remainingDebt)}</td></tr>
      <tr><td><strong>Costo neto del proyecto</strong></td><td className="num"><strong>{fmtMXN(R.totalProjectCost)}</strong></td></tr>
      <tr><td>Resultado de liquidación (venta − deuda)</td><td className={`num ${R.liquidationPosition>=0?'pos':'neg'}`}>{fmtMXN(R.liquidationPosition)}</td></tr>
      {R.isUberMode && <tr><td><strong>Resultado neto del proyecto</strong></td><td className={`num ${R.netProjectResult>=0?'pos':'neg'}`}><strong>{fmtMXN(R.netProjectResult)}</strong></td></tr>}
    </tbody></table>
    <h2>Escenarios de liquidación</h2>
    <table className="tbl"><thead><tr><th>Caso</th><th>Condición</th><th className="num">Resultado</th></tr></thead><tbody>
      <tr style={{ background: R.remainingDebt===0?'var(--bg-2)':'transparent' }}><td>Crédito ya pagado</td><td style={{ fontFamily:'Manrope' }}>Horizonte ≥ plazo del crédito</td><td className="num pos">{R.remainingDebt===0 ? `Ganancia: ${fmtMXN(R.actualSalePrice)}` : '—'}</td></tr>
      <tr style={{ background: (R.remainingDebt>0 && R.actualSalePrice>=R.remainingDebt)?'var(--bg-2)':'transparent' }}><td>Crédito vivo, venta cubre saldo</td><td style={{ fontFamily:'Manrope' }}>Valor venta ≥ saldo restante</td><td className="num">{(R.remainingDebt>0 && R.actualSalePrice>=R.remainingDebt) ? `Ganancia: ${fmtMXN(R.finalPosition)}` : '—'}</td></tr>
      <tr style={{ background: (R.remainingDebt>0 && R.actualSalePrice<R.remainingDebt)?'var(--bg-2)':'transparent' }}><td>Crédito vivo, déficit</td><td style={{ fontFamily:'Manrope' }}>Valor venta &lt; saldo restante</td><td className="num neg">{(R.remainingDebt>0 && R.actualSalePrice<R.remainingDebt) ? `Déficit: ${fmtMXN(Math.abs(R.finalPosition))}` : '—'}</td></tr>
    </tbody></table>
    <h2>Supuestos clave del análisis</h2>
    <table className="tbl"><tbody>
      <tr><td>Tasa de descuento (costo de oportunidad)</td><td className="num">{fmtPct(R.discountAnnual,1)} anual</td></tr>
      <tr><td>Inflación general de costos</td><td className="num">{fmtPct(R.generalInflation,1)}/año</td></tr>
      <tr><td>Método de depreciación</td><td className="num" style={{ textTransform:'capitalize' }}>{inputs.depreciationMethod} · {fmtPct(inputs.depreciationRate,0)}/año</td></tr>
      <tr><td>Factor de reventa / costo de venta</td><td className="num">{inputs.salesFactor.toFixed(2)}× · {fmtPct(R.sellingCostPct,1)}</td></tr>
      {R.tradeInValue>0 && <tr><td>Auto a cuenta (trade-in)</td><td className="num">{fmtMXN(R.tradeInValue)}</td></tr>}
      {R.acquisitionFees>0 && <tr><td>Gastos de adquisición</td><td className="num">{fmtMXN(R.acquisitionFees)}</td></tr>}
      {R.totalRepairReserve>0 && <tr><td>Reserva de reparaciones (horizonte)</td><td className="num">{fmtMXN(R.totalRepairReserve)}</td></tr>}
    </tbody></table>

    {sources && (<><h2>Fuentes de los datos</h2>
      <table className="tbl"><thead><tr><th>Variable</th><th>Fuente</th></tr></thead><tbody>
        {Object.entries(sources).map(([k,v]) => (<tr key={k}><td style={{ fontFamily:'Manrope', fontWeight:500 }}>{SOURCE_LABELS[k] || k}</td><td style={{ wordBreak:'break-all', fontSize:11 }}>{typeof v==='string' && v.startsWith('http') ? <a href={v} target="_blank" rel="noreferrer" style={{ color:'var(--accent)' }}>{v}</a> : String(v)}</td></tr>))}
      </tbody></table></>)}

    <h2 style={{ color:'var(--muted)' }}>Apéndice · Conclusión narrativa</h2>
    <p style={{ fontSize:12, color:'var(--muted)', marginTop:-4 }}>Redacción corrida con el formato de la situación problema académica, por si necesitas entregarla así.</p>
    {narrative.split('\n\n').map((p,i) => <p key={i} style={{ fontSize:13.5 }}>{p}</p>)}

    <div style={{ marginTop:30, fontSize:11, color:'var(--muted)', fontStyle:'italic', borderTop:'1px solid var(--line)', paddingTop:14 }}>Análisis generado por Auto·Pilot con ingeniería económica (VPN, TIR, CAE, CAT). Los precios, tasas y costos son estimaciones referenciales: valídalos con fuentes oficiales (fabricante, AMDA, Profeco, CFE, tu banco/aseguradora) antes de decidir.</div>
  </div>);
};

// ============================================================================
// APP (router de páginas)  ·  Conecta las 7 pestañas pedidas por el usuario:
// Dashboard · Comparar · Sensibilidad · Monte Carlo · Fórmulas · Importar/AI ·
// Reporte. Mantiene el estado global de inputs, escenarios guardados y las
// fuentes importadas. 'inputs' es la única fuente de verdad: cambiar cualquier
// variable en el Sidebar recalcula R (useMemo) y actualiza todas las páginas.
// ============================================================================
// Persistencia local: el estado sobrevive a recargar la página. (mejora #persist)
const STORAGE_KEY = 'autopilot.v1';
const readPersisted = () => {
  try { const raw = (typeof localStorage !== 'undefined') && localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
};

export default function App() {
  const persisted = useRef(readPersisted()).current;
  const [inputs, setInputs] = useState(() => persisted?.inputs ? { ...DEFAULT_INPUTS, ...persisted.inputs } : DEFAULT_INPUTS);
  // Los escenarios guardados se almacenan ligeros (sin el resultado) y se recalculan al cargar.
  const [saved, setSaved] = useState(() => Array.isArray(persisted?.saved) ? persisted.saved.map(s => ({ ...s, result: calculate(s.inputs) })) : []);
  const [tab, setTab] = useState('dashboard');
  const [sources, setSources] = useState(persisted?.sources || null);
  const colorIdx = useRef(Array.isArray(persisted?.saved) ? persisted.saved.length : 0);
  const R = useMemo(() => calculate(inputs), [inputs]);
  useEffect(() => {
    try {
      const slimSaved = saved.map(({ name, inputs, color }) => ({ name, inputs, color }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ inputs, saved: slimSaved, sources }));
    } catch { /* almacenamiento lleno o no disponible: el cálculo sigue funcionando */ }
  }, [inputs, saved, sources]);
  const handleSave = () => {
    const carName = CAR_PRESETS[inputs.carPreset]?.name.split(' ').slice(0,2).join(' ') || 'Auto';
    const cityName = inputs.operationMode!=='no-uber' ? (inputs.cityName || 'Custom') : 'Personal';
    const motorTag = VEHICLE_TYPES[inputs.vehicleType]?.label.charAt(0) || '?';
    const purchaseTag = inputs.purchaseMode==='cash' ? '$' : inputs.purchaseMode==='hybrid' ? 'M' : 'C';
    const name = `${carName} · ${cityName} · ${motorTag}${purchaseTag}`;
    const color = SCENARIO_COLORS[colorIdx.current % SCENARIO_COLORS.length];
    colorIdx.current++;
    setSaved([...saved, { name, inputs:{ ...inputs }, result:R, color }]);
  };
  const handleReset = () => { setInputs(DEFAULT_INPUTS); setSaved([]); setSources(null); colorIdx.current = 0; try { localStorage.removeItem(STORAGE_KEY); } catch {} };
  return (
    <div className="app-root"><FontsAndTheme />
      <div className="layout">
        <Sidebar inputs={inputs} setInputs={setInputs} onSave={handleSave} onReset={handleReset} />
        <main className="main">
          <div className="tabs">
            <button className={`tab ${tab==='dashboard'?'active':''}`} onClick={() => setTab('dashboard')}><BarChart3 size={13} /> Dashboard</button>
            <button className={`tab ${tab==='compare'?'active':''}`} onClick={() => setTab('compare')}><GitCompareArrows size={13} /> Comparar <span className="pill" style={{ marginLeft:4 }}>{saved.length}</span></button>
            <button className={`tab ${tab==='sens'?'active':''}`} onClick={() => setTab('sens')}><Sliders size={13} /> Sensibilidad</button>
            <button className={`tab ${tab==='mc'?'active':''}`} onClick={() => setTab('mc')}><Dice5 size={13} /> Monte Carlo</button>
            <button className={`tab ${tab==='formulas'?'active':''}`} onClick={() => setTab('formulas')}><Calculator size={13} /> Fórmulas</button>
            <button className={`tab ${tab==='import'?'active':''}`} onClick={() => setTab('import')}><Upload size={13} /> Importar / AI</button>
            <button className={`tab ${tab==='report'?'active':''}`} onClick={() => setTab('report')}><FileText size={13} /> Reporte</button>
          </div>
          {tab==='dashboard' && <Dashboard R={R} inputs={inputs} />}
          {tab==='compare' && <Comparison saved={saved} current={R} currentInputs={inputs} setSaved={setSaved} />}
          {tab==='sens' && <Sensitivity inputs={inputs} />}
          {tab==='mc' && <MonteCarlo inputs={inputs} />}
          {tab==='formulas' && <Formulas R={R} inputs={inputs} />}
          {tab==='import' && <ImportCase inputs={inputs} setInputs={setInputs} sources={sources} setSources={setSources} />}
          {tab==='report' && <Report R={R} inputs={inputs} sources={sources} />}
        </main>
      </div>
    </div>
  );
}
