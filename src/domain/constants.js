export const CAR_PRESETS = {
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
export const CITY_PRESETS = {
  'mty':  { name: 'Monterrey',        fare: 140, fuel: 24.5, electricity: 4.2 },
  'cdmx': { name: 'Ciudad de México', fare: 165, fuel: 23.8, electricity: 3.9 },
  'gdl':  { name: 'Guadalajara',      fare: 135, fuel: 24.1, electricity: 4.0 },
  'qro':  { name: 'Querétaro',        fare: 138, fuel: 24.0, electricity: 4.1 },
  'pue':  { name: 'Puebla',           fare: 118, fuel: 23.9, electricity: 4.0 },
  'tij':  { name: 'Tijuana',          fare: 150, fuel: 24.7, electricity: 4.3 },
};
export const VEHICLE_TYPES = { gasoline:{label:'Gasolina'}, diesel:{label:'Diésel'}, hybrid:{label:'Híbrido'}, electric:{label:'Eléctrico'} };
export const SCENARIO_COLORS = ['#b8431f','#2f6a3b','#1f4d8a','#a87819','#6b3d8a','#8a2727','#0e6b6b'];
