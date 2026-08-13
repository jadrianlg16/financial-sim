import { irr, npv } from '../domain/finance.js';

export const GLOSSARY_LABELS = {
  // Financiamiento y crédito
  monthlyPayment:'Mensualidad', purchaseMode:'Modo de compra', financeType:'Tipo de financiamiento',
  openingFee:'Comisión de apertura', amortization:'Amortización', balloonPct:'Valor residual (pago globo)',
  cat:'CAT (Costo Anual Total)', ear:'Tasa efectiva anual', financeVsCash:'¿Financiar o pagar de contado?',
  tradeIn:'Auto a cuenta (trade-in)', acquisitionFees:'Gastos de adquisición',
  leaseMonthly:'Renta mensual (arrendamiento)', leaseDownPayment:'Pago inicial (arrendamiento)',
  leaseTermMonths:'Plazo del arrendamiento', leaseKmCapYear:'Límite de km/año (arrendamiento)',
  leaseExcessKmFee:'Cuota por km excedente',
  // Valor del dinero e ingeniería económica
  vp:'Valor Presente (VP)', vf:'Valor Futuro (VF)', timeValue:'Costo del dinero',
  discountRate:'Tasa de descuento', npv:'Valor Presente Neto (VPN)', irr:'Tasa Interna de Retorno (TIR)',
  eac:'Costo Anual Equivalente (CAE)', tco:'Costo Total de Propiedad (TCO)', costPerKm:'Costo por kilómetro',
  totalProject:'Costo neto del proyecto', netResult:'Resultado neto del proyecto',
  liquidation:'Resultado de liquidación', finalPosition:'Resultado final', upfrontRecovery:'Recuperación del desembolso inicial',
  // Depreciación y reventa
  depreciation:'Depreciación', depreciationMethod:'Método de depreciación', depreciationCost:'Costo por depreciación',
  usedDepreciationRate:'Depreciación de usados', salesFactor:'Factor de venta', sellingCost:'Costo de venta',
  vehicleCondition:'Nuevo vs. usado', warrantyYearsRemaining:'Años de garantía restantes',
  repairReserve:'Reserva de reparaciones',
  // Costos de operación
  monthlyTotal:'Costo mensual total', costStructure:'Estructura de costos', maintenance:'Mantenimiento base',
  wear:'Desgaste por Uber', insurance:'Seguro', insuranceMode:'Modo de seguro', insurancePctOfValue:'Seguro como % del valor',
  refrendo:'Refrendo / tenencia', carWash:'Lavado del auto', tips:'Propinas', misc:'Misceláneos',
  generalInflation:'Inflación general de costos', fuelInflation:'Inflación del combustible',
  cumSpend:'Gasto acumulado', breakeven:'Punto de equilibrio', capacity:'Capacidad utilizada',
  // Vehículo y energía
  vehicleType:'Tipo de motor', kmPerTrip:'Km por viaje', evRange:'Autonomía eléctrica (EV)',
  publicChargeFraction:'Fracción de carga pública', publicChargePrice:'Precio de carga pública',
  // Uber e ingreso
  income:'Ingreso mensual', uberCommission:'Comisión Uber', tax:'Impuesto sobre la tarifa',
  taxRegime:'Régimen fiscal del ingreso', resicoRate:'Retención RESICO',
  toxicology:'Examen toxicológico', certification:'Certificación de conductor',
  // Riesgo
  theftLossProbAnnual:'Riesgo de pérdida total / robo', theftDeductiblePct:'Deducible de cobertura amplia',
};
export const GLOSSARY_SECTIONS = [
  { title:'Financiamiento y crédito', keys:['monthlyPayment','purchaseMode','financeType','openingFee','amortization','balloonPct','cat','ear','financeVsCash','tradeIn','acquisitionFees','leaseMonthly','leaseDownPayment','leaseTermMonths','leaseKmCapYear','leaseExcessKmFee'] },
  { title:'Valor del dinero e ingeniería económica', keys:['vp','vf','timeValue','discountRate','npv','irr','eac','tco','costPerKm','totalProject','netResult','liquidation','finalPosition','upfrontRecovery'] },
  { title:'Depreciación y reventa', keys:['depreciation','depreciationMethod','depreciationCost','usedDepreciationRate','salesFactor','sellingCost','vehicleCondition','warrantyYearsRemaining','repairReserve'] },
  { title:'Costos de operación', keys:['monthlyTotal','costStructure','maintenance','wear','insurance','insuranceMode','insurancePctOfValue','refrendo','carWash','tips','misc','generalInflation','fuelInflation','cumSpend','breakeven','capacity'] },
  { title:'Vehículo y energía', keys:['vehicleType','kmPerTrip','evRange','publicChargeFraction','publicChargePrice'] },
  { title:'Uber e ingreso', keys:['income','uberCommission','tax','taxRegime','resicoRate','toxicology','certification'] },
  { title:'Riesgo', keys:['theftLossProbAnnual','theftDeductiblePct'] },
];
