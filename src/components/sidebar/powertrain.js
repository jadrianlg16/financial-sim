/** Which energy inputs apply to the selected powertrain. */
export const powertrainOf = (inputs) => {
  const isPlugInHybrid = inputs.vehicleType === 'hybrid' && !!inputs.plugInHybrid;
  return {
    isPlugInHybrid,
    usesElectricDrive: inputs.vehicleType === 'electric' || isPlugInHybrid,
    // Gasolina, diésel e híbridos (incluido el enchufable) usan combustible líquido.
    usesLiquidFuel:
      inputs.vehicleType === 'gasoline' ||
      inputs.vehicleType === 'diesel' ||
      inputs.vehicleType === 'hybrid',
  };
};
