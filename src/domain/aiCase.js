import { currentYear } from './year.js';

/**
 * Prompt que pide a un LLM investigar un auto y devolver un JSON con un esquema
 * fijo que cubre todas las variables, con una fuente por dato en "sources"
 * (fabricante, AMDA, INEGI, Profeco, CFE, aseguradoras, Uber MX...). Las
 * estimaciones se marcan [ESTIMACIÓN] para que el usuario pueda verificar cada
 * cifra en lugar de confiar en el modelo. `year` es el año de ejemplo del esquema.
 */
export function buildAIPrompt(carName, year = currentYear()) {
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
    "year": ${year},
    "condition": "new | used",
    "odometerKm": 0,
    "usedDepreciationRate": 0.12,
    "warrantyYearsRemaining": 3,
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
    "insuranceMode": "fixed",
    "insurancePctOfValue": 0.045,
    "annualMaintenance": 8000,
    "monthlyRefrendo": 500,
    "dataPlan": 400,
    "carWash": 800,
    "carWashTips": 400,
    "miscellaneous": 2000,
    "accessories": 100,
    "repairReserveAnnual": 0,
    "uberWearFactor": 0.30,
    "uberKmPerTrip": 8,
    "publicChargeFraction": 0.15,
    "publicChargePrice": 8.0
  },
  "uber": { "taxRegime": "resico", "resicoRate": 0.025, "uberCommission": 0.25, "taxRate": 0.30 },
  "financing": { "financeType": "annuity", "balloonPct": 0.35, "leaseMonthly": 6500, "leaseDownPayment": 20000, "leaseTermMonths": 48, "leaseKmCapYear": 20000, "leaseExcessKmFee": 3 },
  "oneTime": { "toxicologyReport": 400, "uberCertification": 900, "acquisitionFees": 0 },
  "projection": { "depreciationMethod": "declining", "depreciationRate": 0.20, "firstYearDepreciation": 0.25, "salesFactor": 1.0, "sellingCostPct": 0.0, "interestRate": 0.135, "theftLossProbAnnual": 0.015, "theftDeductiblePct": 0.05 },
  "sources": {
    "price": "URL fabricante o seminuevos (para usados, cita el precio de seminuevo del año y km)",
    "condition": "nuevo o usado según el precio cotizado",
    "odometerKm": "[ESTIMACIÓN] km típicos para ese año si es usado, si no 0",
    "usedDepreciationRate": "[ESTIMACIÓN] si es usado, depreciación anual más lenta que un auto nuevo (típico 0.10-0.15)",
    "warrantyYearsRemaining": "[ESTIMACIÓN] años de garantía de fábrica restantes (nuevos 3-5; usados normalmente 0)",
    "kmpl": "URL ficha técnica / EPA / fabricante",
    "plugInHybrid": "URL ficha técnica que confirme si es híbrido enchufable; si no aplica, null",
    "kmPerKwh": "URL si aplica, si no null",
    "batteryCapacityKwh": "URL si aplica, si no null",
    "chargerPowerKw": "URL/estimación potencia de cargador doméstico recomendado (si EV/híbrido enchufable)",
    "monthlyInsurance": "URL aseguradora — si lo usarás en Uber cotiza póliza COMERCIAL (más cara)",
    "insuranceMode": "fixed si das un monto plano; pctOfValue si la prima es % del valor del auto (cobertura amplia)",
    "insurancePctOfValue": "[ESTIMACIÓN] prima anual como % del valor (cobertura amplia 3-6%) si insuranceMode=pctOfValue",
    "taxRegime": "resico (realista: retención de plataforma), gross (simplificado: % de tarifa bruta), o net (% sobre utilidad)",
    "resicoRate": "URL/Hacienda — retención RESICO de plataformas digitales (~2.1-2.5% del ingreso bruto)",
    "financeType": "annuity (crédito normal), balloon (pago final/residual), o lease (arrendamiento)",
    "balloonPct": "[ESTIMACIÓN] valor residual del plan de agencia si financeType=balloon (típico 0.25-0.45)",
    "leaseMonthly": "URL/cotización renta mensual de arrendamiento (si financeType=lease)",
    "leaseDownPayment": "URL/cotización pago inicial del arrendamiento (no recuperable)",
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
    "publicChargeFraction": "[ESTIMACIÓN] fracción de carga en estaciones públicas si es eléctrico/enchufable (0-0.3)",
    "publicChargePrice": "URL/estimación precio por kWh en cargadores públicos (suele superar la tarifa CFE doméstica)",
    "depreciationMethod": "declining para autos (saldo decreciente); straight sólo si quieres depreciación lineal",
    "depreciationRate": "URL guía de depreciación / valor seminuevos (15-25% típico)",
    "firstYearDepreciation": "[ESTIMACIÓN] caída del 1er año si method=realistic (autos nuevos ~20-25%)",
    "salesFactor": "[ESTIMACIÓN] ajuste de reventa frente al valor calculado 0.7-1.1",
    "sellingCostPct": "[ESTIMACIÓN] costo de vender (comisión/traspaso) 0-5%",
    "interestRate": "URL banco — tasa de crédito (autos usados suelen ser más caros, 14-20%)",
    "theftLossProbAnnual": "[ESTIMACIÓN] prob. anual de robo/pérdida total (INEGI/aseguradoras; típico 0.01-0.03)",
    "theftDeductiblePct": "[ESTIMACIÓN] deducible de cobertura amplia para robo/pérdida total (3-10%)",
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
- "uber.taxRegime": usa "resico" salvo que quieras el supuesto simplificado (entonces "gross"). leaseMonthly/leaseDownPayment sólo si financeType="lease".
- "costs.insuranceMode": usa "pctOfValue" sólo si cotizaste el seguro como porcentaje del valor; si no, "fixed" con monthlyInsurance.

Recuerda: SOLO el JSON, con una fuente por cada dato en "sources".`;
}

// Valores permitidos de cada campo de opción: un valor desconocido se ignora en vez
// de colarse al modelo (p. ej. un tipo de motor desconocido daría costo de energía 0).
const ALLOWED = {
  vehicleType: ['gasoline', 'diesel', 'hybrid', 'electric'],
  vehicleCondition: ['new', 'used'],
  insuranceMode: ['fixed', 'pctOfValue'],
  taxRegime: ['resico', 'gross', 'net'],
  financeType: ['annuity', 'balloon', 'lease'],
  depreciationMethod: ['declining', 'straight', 'realistic'],
};

// Campos que se aceptan del JSON: [sección, llave en el JSON, input, tipo]. Los
// números deben ser finitos, los textos no vacíos y las opciones de ALLOWED.
const IMPORT_FIELDS = [
  ['vehicle', 'name', 'carName', 'text'],
  ['vehicle', 'type', 'vehicleType', 'option'],
  ['vehicle', 'plugInHybrid', 'plugInHybrid', 'boolean'],
  ['vehicle', 'price', 'carPrice', 'number'],
  ['vehicle', 'year', 'carYear', 'number'],
  ['vehicle', 'kmpl', 'kmpl', 'number'],
  ['vehicle', 'kmPerKwh', 'kmPerKwh', 'number'],
  ['vehicle', 'batteryCapacityKwh', 'batteryCapacityKwh', 'number'],
  ['vehicle', 'chargerPowerKw', 'chargerPowerKw', 'number'],
  ['vehicle', 'condition', 'vehicleCondition', 'option'],
  ['vehicle', 'odometerKm', 'odometerKm', 'number'],
  ['vehicle', 'usedDepreciationRate', 'usedDepreciationRate', 'number'],
  ['vehicle', 'warrantyYearsRemaining', 'warrantyYearsRemaining', 'number'],
  ['vehicle', 'description', 'carDescription', 'text'],
  ['vehicle', 'justification', 'carJustification', 'text'],
  ['costs', 'monthlyInsurance', 'monthlyInsurance', 'number'],
  ['costs', 'insuranceMode', 'insuranceMode', 'option'],
  ['costs', 'insurancePctOfValue', 'insurancePctOfValue', 'number'],
  ['costs', 'annualMaintenance', 'annualMaintenance', 'number'],
  ['costs', 'monthlyRefrendo', 'monthlyRefrendo', 'number'],
  ['costs', 'dataPlan', 'dataPlan', 'number'],
  ['costs', 'carWash', 'carWash', 'number'],
  ['costs', 'carWashTips', 'carWashTips', 'number'],
  ['costs', 'miscellaneous', 'miscellaneous', 'number'],
  ['costs', 'accessories', 'accessories', 'number'],
  ['costs', 'repairReserveAnnual', 'repairReserveAnnual', 'number'],
  ['costs', 'uberWearFactor', 'uberWearFactor', 'number'],
  ['costs', 'uberKmPerTrip', 'uberKmPerTrip', 'number'],
  ['costs', 'publicChargeFraction', 'publicChargeFraction', 'number'],
  ['costs', 'publicChargePrice', 'publicChargePrice', 'number'],
  ['oneTime', 'toxicologyReport', 'toxicologyReport', 'number'],
  ['oneTime', 'uberCertification', 'uberCertification', 'number'],
  ['oneTime', 'acquisitionFees', 'acquisitionFees', 'number'],
  ['uber', 'taxRegime', 'taxRegime', 'option'],
  ['uber', 'resicoRate', 'resicoRate', 'number'],
  ['uber', 'uberCommission', 'uberCommission', 'number'],
  ['uber', 'taxRate', 'taxRate', 'number'],
  ['financing', 'financeType', 'financeType', 'option'],
  ['financing', 'balloonPct', 'balloonPct', 'number'],
  ['financing', 'leaseMonthly', 'leaseMonthly', 'number'],
  ['financing', 'leaseDownPayment', 'leaseDownPayment', 'number'],
  ['financing', 'leaseTermMonths', 'leaseTermMonths', 'number'],
  ['financing', 'leaseKmCapYear', 'leaseKmCapYear', 'number'],
  ['financing', 'leaseExcessKmFee', 'leaseExcessKmFee', 'number'],
  ['projection', 'depreciationMethod', 'depreciationMethod', 'option'],
  ['projection', 'depreciationRate', 'depreciationRate', 'number'],
  ['projection', 'firstYearDepreciation', 'firstYearDepreciation', 'number'],
  ['projection', 'salesFactor', 'salesFactor', 'number'],
  ['projection', 'sellingCostPct', 'sellingCostPct', 'number'],
  ['projection', 'interestRate', 'interestRate', 'number'],
  ['projection', 'theftLossProbAnnual', 'theftLossProbAnnual', 'number'],
  ['projection', 'theftDeductiblePct', 'theftDeductiblePct', 'number'],
];
const SECTIONS = ['vehicle', 'costs', 'oneTime', 'uber', 'financing', 'projection'];
const isPlainObject = (x) => x != null && typeof x === 'object' && !Array.isArray(x);

// Convierte un valor del JSON al tipo del input; undefined si no es válido.
const coerce = (kind, input, value) => {
  if (kind === 'boolean') return !!value;
  if (kind === 'text') return typeof value === 'string' && value ? value : undefined;
  if (kind === 'option') return ALLOWED[input].includes(value) ? value : undefined;
  const n = +value;
  return Number.isFinite(n) ? n : undefined;
};

/**
 * Applies a parsed case JSON (the schema buildAIPrompt asks for) on top of the
 * current inputs. Only known fields are copied; numbers must be finite and
 * option fields must hold an allowed value. Anything else is left unchanged and
 * listed in `ignored` (as "section.key"). Never mutates `currentInputs`.
 *
 * @returns {{ ok: true, inputs: object, sources: object|null, ignored: string[] }
 *   | { ok: false, error: string }}
 */
export function applyImportedJson(json, currentInputs) {
  if (!isPlainObject(json)) {
    return {
      ok: false,
      error: 'se esperaba un objeto JSON con las secciones vehicle, costs, uber, etc.',
    };
  }
  const merged = { ...currentInputs };
  const ignored = [];
  for (const section of SECTIONS) {
    if (json[section] != null && !isPlainObject(json[section])) ignored.push(section);
  }
  const sectionOf = (name) => (isPlainObject(json[name]) ? json[name] : null);
  for (const [section, key, input, kind] of IMPORT_FIELDS) {
    const raw = sectionOf(section)?.[key];
    if (raw == null) continue;
    const value = coerce(kind, input, raw);
    if (value === undefined) ignored.push(`${section}.${key}`);
    else merged[input] = value;
  }
  const vehicle = sectionOf('vehicle');
  if (vehicle) {
    merged.carPreset = 'custom';
    // Sin garantía en el JSON, se infiere de la condición (usado 0 años, nuevo 3),
    // igual que al elegir un preset.
    if (vehicle.warrantyYearsRemaining == null) {
      if (vehicle.condition === 'used') merged.warrantyYearsRemaining = 0;
      else if (vehicle.condition === 'new') merged.warrantyYearsRemaining = 3;
    }
  }
  const sources = isPlainObject(json.sources) ? json.sources : null;
  return { ok: true, inputs: merged, sources, ignored };
}

/** Removes the Markdown code fences an LLM often wraps its JSON answer in. */
export const stripCodeFences = (text) =>
  String(text)
    .replace(/```json\s*/g, '')
    .replace(/```\s*$/g, '')
    .trim();

/**
 * Parses the text pasted in the Import tab and applies it. Invalid JSON and a
 * JSON that is not an object both return `{ ok: false, error }` with a message
 * ready to show.
 */
export function importCaseText(text, currentInputs) {
  let json;
  try {
    json = JSON.parse(stripCodeFences(text));
  } catch (e) {
    return { ok: false, error: `JSON inválido: ${e.message}` };
  }
  const result = applyImportedJson(json, currentInputs);
  return result.ok ? result : { ok: false, error: `Error: ${result.error}` };
}
