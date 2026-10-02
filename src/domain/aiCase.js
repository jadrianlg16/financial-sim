import { currentYear } from './year.js';

// ----------------------------------------------------------------------------
// buildAIPrompt  ·  Petición: generar un prompt para que una IA investigue un
// auto nuevo y devuelva un JSON ESTRUCTURADO con TODAS las variables, y que
// CITE UNA FUENTE POR CADA DATO en el bloque "sources" (fabricante, AMDA, INEGI,
// Profeco, CFE, aseguradoras, Uber MX, etc.). Las estimaciones se marcan
// [ESTIMACIÓN]. Así el usuario puede verificar que la info está respaldada.
// ----------------------------------------------------------------------------
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
    "taxRegime": "resico (realista: retención de plataforma), gross (escolar: % de tarifa bruta), o net (% sobre utilidad)",
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
    "depreciationMethod": "declining para autos (saldo decreciente); straight sólo si lo pide la tarea",
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
- "uber.taxRegime": usa "resico" salvo que sea un caso escolar (entonces "gross"). leaseMonthly/leaseDownPayment sólo si financeType="lease".
- "costs.insuranceMode": usa "pctOfValue" sólo si cotizaste el seguro como porcentaje del valor; si no, "fixed" con monthlyInsurance.

Recuerda: SOLO el JSON, con una fuente por cada dato en "sources".`;
}

export function applyImportedJson(json, currentInputs) {
  const merged = { ...currentInputs };
  try {
    if (json.vehicle) {
      const v = json.vehicle;
      merged.carPreset = 'custom';
      if (v.name) merged.carName = v.name; // guardar nombre real del auto importado (audit fix)
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
      // FEATURE 1 — depreciación de usados y garantía. Si el JSON no trae garantía,
      // se infiere de la condición (usado=0, nuevo=3) para mantener la semántica.
      if (v.usedDepreciationRate != null) merged.usedDepreciationRate = +v.usedDepreciationRate;
      if (v.warrantyYearsRemaining != null)
        merged.warrantyYearsRemaining = +v.warrantyYearsRemaining;
      else if (v.condition === 'used') merged.warrantyYearsRemaining = 0;
      else if (v.condition === 'new') merged.warrantyYearsRemaining = 3;
      if (v.description) merged.carDescription = v.description;
      if (v.justification) merged.carJustification = v.justification;
    }
    if (json.costs) {
      const c = json.costs;
      if (c.monthlyInsurance != null) merged.monthlyInsurance = +c.monthlyInsurance;
      if (c.insuranceMode === 'fixed' || c.insuranceMode === 'pctOfValue')
        merged.insuranceMode = c.insuranceMode;
      if (c.insurancePctOfValue != null) merged.insurancePctOfValue = +c.insurancePctOfValue;
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
      // FEATURE 2 — split de carga pública vs. casera (sólo relevante para eléctrico/enchufable).
      if (c.publicChargeFraction != null) merged.publicChargeFraction = +c.publicChargeFraction;
      if (c.publicChargePrice != null) merged.publicChargePrice = +c.publicChargePrice;
    }
    if (json.oneTime) {
      const o = json.oneTime;
      if (o.toxicologyReport != null) merged.toxicologyReport = +o.toxicologyReport;
      if (o.uberCertification != null) merged.uberCertification = +o.uberCertification;
      if (o.acquisitionFees != null) merged.acquisitionFees = +o.acquisitionFees;
    }
    if (json.uber) {
      const u = json.uber;
      if (u.taxRegime === 'resico' || u.taxRegime === 'gross' || u.taxRegime === 'net')
        merged.taxRegime = u.taxRegime;
      if (u.resicoRate != null) merged.resicoRate = +u.resicoRate;
      if (u.uberCommission != null) merged.uberCommission = +u.uberCommission;
      if (u.taxRate != null) merged.taxRate = +u.taxRate;
    }
    if (json.financing) {
      const f = json.financing;
      if (f.financeType === 'annuity' || f.financeType === 'balloon' || f.financeType === 'lease')
        merged.financeType = f.financeType;
      if (f.balloonPct != null) merged.balloonPct = +f.balloonPct;
      if (f.leaseMonthly != null) merged.leaseMonthly = +f.leaseMonthly;
      if (f.leaseDownPayment != null) merged.leaseDownPayment = +f.leaseDownPayment;
      if (f.leaseTermMonths != null) merged.leaseTermMonths = +f.leaseTermMonths;
      if (f.leaseKmCapYear != null) merged.leaseKmCapYear = +f.leaseKmCapYear;
      if (f.leaseExcessKmFee != null) merged.leaseExcessKmFee = +f.leaseExcessKmFee;
    }
    if (json.projection) {
      const p = json.projection;
      if (p.depreciationMethod) merged.depreciationMethod = p.depreciationMethod;
      if (p.depreciationRate != null) merged.depreciationRate = +p.depreciationRate;
      if (p.firstYearDepreciation != null) merged.firstYearDepreciation = +p.firstYearDepreciation;
      if (p.salesFactor != null) merged.salesFactor = +p.salesFactor;
      if (p.sellingCostPct != null) merged.sellingCostPct = +p.sellingCostPct;
      if (p.interestRate != null) merged.interestRate = +p.interestRate;
      // FEATURE 3 — riesgo de pérdida total / robo (afecta el Monte Carlo).
      if (p.theftLossProbAnnual != null) merged.theftLossProbAnnual = +p.theftLossProbAnnual;
      if (p.theftDeductiblePct != null) merged.theftDeductiblePct = +p.theftDeductiblePct;
    }
    const sources = json.sources && typeof json.sources === 'object' ? json.sources : null;
    return { ok: true, inputs: merged, sources };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
