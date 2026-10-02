// Monthly cost lines with their chart color and accounting class (tipo: fixed or
// variable; dir: direct or indirect). Optional lines are left out when they are 0.
export function costBreakdownOf(result, inputs) {
  const fuelName =
    inputs.vehicleType === 'electric'
      ? 'Energía eléctrica'
      : inputs.vehicleType === 'diesel'
        ? 'Diésel'
        : 'Combustible';
  const costBreakdown = [
    inputs.purchaseMode !== 'cash' && {
      name: result.isLease ? 'Renta mensual' : 'Mensualidad crédito',
      value: result.monthlyPayment,
      color: '#b8431f',
      tipo: 'Fijo',
      dir: 'Directo',
    },
    {
      name: fuelName,
      value: result.monthlyFuel,
      color: '#d65a30',
      tipo: 'Variable',
      dir: 'Directo',
    },
    { name: 'Seguro', value: result.monthlyIns, color: '#a87819', tipo: 'Fijo', dir: 'Directo' },
    {
      name: 'Refrendo/Tenencia',
      value: result.monthlyRefrendo,
      color: '#6b3d8a',
      tipo: 'Fijo',
      dir: 'Directo',
    },
    {
      name: 'Mantenimiento',
      value: result.monthlyMaint,
      color: '#1f4d8a',
      tipo: 'Variable',
      dir: 'Directo',
    },
    result.monthlyData > 0 && {
      name: 'Datos móviles',
      value: result.monthlyData,
      color: '#7a6e5e',
      tipo: 'Fijo',
      dir: 'Directo',
    },
    result.monthlyCarWash > 0 && {
      name: 'Lavado',
      value: result.monthlyCarWash,
      color: '#0e6b6b',
      tipo: 'Variable',
      dir: 'Indirecto',
    },
    result.monthlyTips > 0 && {
      name: 'Propinas',
      value: result.monthlyTips,
      color: '#3a7d44',
      tipo: 'Variable',
      dir: 'Indirecto',
    },
    result.monthlyMisc > 0 && {
      name: 'Misceláneos',
      value: result.monthlyMisc,
      color: '#9c6b1f',
      tipo: 'Variable',
      dir: 'Indirecto',
    },
    result.monthlyAccess > 0 && {
      name: 'Accesorios',
      value: result.monthlyAccess,
      color: '#8a2727',
      tipo: 'Fijo',
      dir: 'Indirecto',
    },
  ].filter(Boolean);
  return costBreakdown;
}
