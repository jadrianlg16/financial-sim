export const SOURCE_LABELS = {
  price: 'Precio',
  plugInHybrid: 'Híbrido enchufable',
  kmpl: 'Rendimiento km/L',
  kmPerKwh: 'Rendimiento km/kWh',
  batteryCapacityKwh: 'Batería',
  chargerPowerKw: 'Potencia cargador',
  uberKmPerTrip: 'Km por viaje',
  monthlyInsurance: 'Seguro (póliza Uber)',
  annualMaintenance: 'Mantenimiento base',
  monthlyRefrendo: 'Refrendo/Tenencia',
  dataPlan: 'Datos móviles',
  carWash: 'Lavado',
  carWashTips: 'Propinas',
  miscellaneous: 'Misceláneos',
  accessories: 'Accesorios',
  uberWearFactor: 'Desgaste Uber',
  depreciationRate: 'Depreciación',
  salesFactor: 'Factor de venta',
  toxicologyReport: 'Examen toxicológico',
  uberCertification: 'Certificación Uber',
  condition: 'Condición (nuevo/usado)',
  odometerKm: 'Kilometraje',
  repairReserveAnnual: 'Reserva de reparaciones',
  depreciationMethod: 'Método de depreciación',
  firstYearDepreciation: 'Caída 1er año',
  sellingCostPct: 'Costo de venta',
  interestRate: 'Tasa de crédito',
  acquisitionFees: 'Gastos de adquisición',
  // FEATURE 1/2/3
  insuranceMode: 'Modo de seguro',
  insurancePctOfValue: 'Seguro (% del valor)',
  taxRegime: 'Régimen fiscal Uber',
  resicoRate: 'Retención RESICO',
  financeType: 'Tipo de financiamiento',
  balloonPct: 'Valor residual (globo)',
  leaseMonthly: 'Renta de arrendamiento',
  leaseDownPayment: 'Pago inicial arrendamiento',
  // NUEVOS: depreciación de usados, garantía, carga pública, pérdida total
  usedDepreciationRate: 'Depreciación de usados',
  warrantyYearsRemaining: 'Garantía restante',
  publicChargeFraction: 'Fracción de carga pública',
  publicChargePrice: 'Precio de carga pública',
  theftLossProbAnnual: 'Riesgo de pérdida total',
  theftDeductiblePct: 'Deducible cobertura amplia',
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
