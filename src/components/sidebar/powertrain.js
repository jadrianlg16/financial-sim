/** Which energy inputs apply to the selected powertrain. */
export const powertrainOf = (inputs) => {
  const isPlugInHybrid = inputs.vehicleType === 'hybrid' && !!inputs.plugInHybrid;
  return {
    isPlugInHybrid,
    usesElectricDrive: inputs.vehicleType === 'electric' || isPlugInHybrid,
    // Gasoline, diesel and hybrids (the plug-in included) use liquid fuel.
    usesLiquidFuel:
      inputs.vehicleType === 'gasoline' ||
      inputs.vehicleType === 'diesel' ||
      inputs.vehicleType === 'hybrid',
  };
};
