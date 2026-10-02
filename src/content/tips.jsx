export const TIPS = {
  monthlyPayment: 'La mensualidad es lo que pagas cada mes al banco hasta terminar el crédito.',
  vp: '<strong>Valor Presente (VP).</strong> Cuánto valdría hoy todo el dinero que vas a pagar en el futuro. El dinero a futuro vale menos que el de hoy.',
  vf: '<strong>Valor Futuro (VF).</strong> Suma nominal de todo lo que terminarás pagando: enganche + todas las mensualidades + comisiones.',
  timeValue:
    '<strong>Costo del dinero.</strong> Diferencia entre lo que pagas en total (VF) y lo que ese dinero vale hoy (VP). Es lo que te cuesta pagar a plazos en vez de de contado.',
  breakeven:
    '<strong>Punto de equilibrio.</strong> Lo mínimo que necesitas trabajar para que el proyecto se pague solo: cubre costos mensuales y recupera lo que no se cubra con la venta final del auto menos la deuda.',
  depreciation:
    '<strong>Depreciación.</strong> Cuánto pierde de valor el auto cada año, calculado sobre el PRECIO ORIGINAL (lineal). Con 20%: tras 1 año vale 80% del original, tras 2 años 60%, tras 3 años 40%, etc.',
  finalPosition:
    '<strong>Resultado final.</strong> Lo que te queda al terminar: el dinero de la venta del auto menos lo que aún debes del crédito.',
  monthlyTotal:
    '<strong>Costo mensual total.</strong> Todo lo que cuesta tener el auto cada mes: mensualidad + combustible + seguro + mantenimiento + extras.',
  wear: '<strong>Desgaste por Uber.</strong> Recargo extra de mantenimiento por cada km manejado en Uber. NO es fijo: el costo total de desgaste crece automáticamente si haces más viajes, más horas o más km por viaje, porque eso aumenta los km de Uber. Este % sólo fija qué tan caro es cada km de Uber frente a un km personal.',
  maintenance:
    '<strong>Mantenimiento base.</strong> Servicios regulares y desgaste esperado para un uso de referencia de 20,000 km/año. El simulador lo convierte a costo por km, así que sube cuando manejas más km.',
  capacity:
    '<strong>Capacidad utilizada.</strong> Qué porcentaje del tiempo máximo disponible necesitas trabajar. Si pasa de 100%, no te alcanzan las horas.',
  salesFactor:
    'Factor de venta: vender al valor calculado (1.00×), más barato (0.80×) o más caro (1.10×). El uso intensivo de Uber suele bajar la reventa.',
  uberCommission: 'Lo que se queda la app Uber de cada viaje (típicamente 25%).',
  tax: 'Porcentaje de impuestos calculado sobre la tarifa bruta del viaje, como pide el problema: precio del viaje menos comisión Uber menos impuestos.',
  refrendo:
    '<strong>Refrendo / Tenencia.</strong> Pago vehicular estatal para mantener tus placas vigentes. Varía por estado; aquí se captura como monto mensual prorrateado.',
  insurance:
    '<strong>Seguro.</strong> Lo que pagas por el seguro. <strong>Ojo:</strong> en muchos estados/aseguradoras, usar el auto para Uber exige una póliza comercial, más cara que la de un auto particular.',
  fuelInflation:
    'Cuánto sube el precio de la gasolina cada año en promedio. En México el histórico ronda 5-7% anual.',
  vehicleType:
    'El tipo de motor afecta cuánto gastas en energía. Eléctrico y los híbridos enchufables requieren tiempo de carga; un híbrido convencional usa gasolina y no resta horas de carga.',
  purchaseMode:
    'Cómo pagas el auto: todo de contado (sin intereses), todo a crédito, o una mezcla.',
  income:
    'Tu ingreso mensual del trabajo principal. Si lo llenas, mostramos qué porcentaje de tu sueldo se va al auto.',
  openingFee:
    'Comisión de apertura: cargo único del banco al inicio del crédito, generalmente 1-3% del monto financiado.',
  amortization:
    'Cómo se reparte cada mensualidad entre intereses y reducir tu deuda. Al principio paga más intereses; al final más capital.',
  costStructure: 'Cómo se reparte tu pago mensual entre las diferentes categorías de gasto.',
  carWash:
    'Lavados del auto. Como conductor conviene traerlo limpio, por eso suele ser un gasto recurrente más alto que para uso personal.',
  tips: 'Propinas en lavados y servicios. Pequeño pero constante.',
  misc: 'Gastos misceláneos: imprevistos, casetas ocasionales, estacionamiento, multas menores, etc. Un colchón para lo que no entra en otra categoría.',
  toxicology:
    'Examen toxicológico antidoping que Uber suele exigir para dar de alta a un conductor.',
  certification:
    'Curso/certificación inicial de conductor y trámites de registro en la plataforma.',
  cumSpend:
    'Cuánto dinero llevas gastado en total conforme pasan los años, por categoría. Incluye el desembolso inicial, las mensualidades y los costos recurrentes.',
  totalProject:
    'Costo neto del proyecto: TODO lo que sale de tu bolsa en el horizonte (enganche + mensualidades + comisiones + pagos iniciales + costos recurrentes) MENOS lo que REALMENTE recuperas al final (venta del auto menos la deuda que aún debes).',
  liquidation:
    '<strong>Resultado de liquidación.</strong> Lo que te queda SÓLO de vender el auto al final: precio de venta menos la deuda que aún debes. No incluye lo que gastaste ni lo que ganaste en el camino.',
  netResult:
    '<strong>Resultado neto del proyecto.</strong> La foto completa: ingresos de Uber + lo que recuperas al vender el auto (menos deuda) − TODO lo que gastaste. Positivo = el proyecto te dejó dinero; negativo = te costó.',
  kmPerTrip:
    '<strong>Km por viaje.</strong> Distancia promedio que recorres por cada viaje, incluyendo el traslado vacío para recoger al pasajero. Conecta los viajes con el gasto de combustible y mantenimiento.',
  evRange:
    '<strong>Autonomía EV.</strong> Si tus km diarios superan lo que rinde una carga completa de la batería, tendrías que recargar a media jornada (pierdes tiempo de trabajo).',
  upfrontRecovery:
    'El punto de equilibrio de Uber recupera automáticamente el desembolso inicial que no quede cubierto por la venta final del auto menos la deuda viva.',
  // --- Ingeniería económica (nuevos) ---
  discountRate:
    '<strong>Tasa de descuento (costo de oportunidad).</strong> Lo que tu dinero rendiría en otra inversión segura (p.ej. CETES ~10-11% en México). Es la tasa con la que traemos los flujos futuros a valor de hoy. NO es la tasa del crédito: usar la del crédito haría que el VP del préstamo siempre fuera igual al monto prestado, que no dice nada.',
  npv: '<strong>Valor Presente Neto (VPN).</strong> Suma de todos los flujos (lo que sale y lo que entra) traídos a hoy con la tasa de descuento. Positivo = el proyecto crea valor frente a invertir tu dinero a esa tasa; negativo = lo destruye.',
  irr: '<strong>Tasa Interna de Retorno (TIR).</strong> El rendimiento anual que realmente te deja el proyecto. Compárala con tu tasa de descuento: si la TIR es mayor, conviene.',
  eac: '<strong>Costo Anual Equivalente (CAE).</strong> Convierte el costo total (en valor presente) en una renta anual uniforme. Es la forma correcta de comparar autos que conservas distintos números de años: el de menor CAE es el de mejor valor.',
  tco: '<strong>Costo Total de Propiedad (TCO).</strong> Todo lo que el auto te cuesta de verdad en el horizonte: depreciación + financiamiento + energía + seguro + mantenimiento + tenencia + extras − lo que recuperas al venderlo. Es el número que de verdad importa al comparar autos.',
  costPerKm:
    '<strong>Costo por kilómetro.</strong> El TCO dividido entre todos los km que manejarás. Permite comparar autos sin importar cuánto los uses.',
  cat: '<strong>CAT (Costo Anual Total).</strong> La tasa real del crédito incluyendo la comisión de apertura, no sólo el interés de lista. En México es la cifra que la ley obliga a comparar entre créditos.',
  ear: '<strong>Tasa efectiva anual.</strong> El interés real una vez que se compone mes con mes. Siempre es un poco mayor que la tasa nominal de lista.',
  financeVsCash:
    '<strong>¿Financiar o pagar de contado?</strong> Comparamos, en valor de hoy, pagar todo de contado vs. dar enganche y financiar el resto invirtiendo tu dinero a la tasa de oportunidad. Positivo = financiar te conviene (tu dinero rinde más que lo que cuesta el crédito); negativo = de contado sale mejor.',
  depreciationMethod:
    '<strong>Método de depreciación.</strong> Saldo decreciente (geométrico, lo más realista para autos): pierde el mismo % del valor restante cada año. Lineal: pierde el mismo monto del precio original cada año. Realista: caída fuerte el primer año y luego saldo decreciente.',
  vehicleCondition:
    '<strong>Nuevo vs. usado.</strong> Un usado cuesta menos y deprecia más lento en %, pero suele tener tasa de crédito más alta, mantenimiento mayor y riesgo de reparaciones. Activa la reserva de reparaciones para modelarlo.',
  tradeIn:
    '<strong>Auto a cuenta (trade-in).</strong> Valor de tu auto actual entregado como parte del pago. Reduce lo que financias o pagas de contado.',
  acquisitionFees:
    '<strong>Gastos de adquisición.</strong> Pagos únicos al comprar: placas/alta vehicular, ISAN o tenencia inicial, revisión mecánica (usados), cambio de propietario/traspaso.',
  sellingCost:
    '<strong>Costo de venta.</strong> Lo que pierdes al vender el auto al final: comisión de agencia o lote, trámite de traspaso, acondicionamiento. Se descuenta del valor de reventa.',
  repairReserve:
    '<strong>Reserva de reparaciones.</strong> Dinero que apartas al año para fallas fuera del mantenimiento normal. Crece con la edad del auto; importante en usados y fuera de garantía.',
  generalInflation:
    '<strong>Inflación general de costos.</strong> Cuánto suben al año el seguro, refrendo, mantenimiento y demás gastos (aparte del combustible, que tiene su propia inflación).',
  depreciationCost:
    '<strong>Costo por depreciación.</strong> Lo que el auto pierde de valor en el horizonte (precio − valor de reventa). Suele ser el costo más grande de tener un auto, aunque no lo "sientas" cada mes.',
  // --- Régimen fiscal del ingreso Uber ---
  taxRegime:
    '<strong>Régimen fiscal del ingreso Uber.</strong> Cómo se calcula el impuesto de cada viaje.<br/><strong>RESICO (realista):</strong> la plataforma retiene un % pequeño del ingreso bruto (≈2.5%). Es lo que aplica a la mayoría de conductores en México hoy.<br/><strong>Bruto (escolar):</strong> % sobre la tarifa bruta del viaje (30% por defecto). Es el supuesto del problema/escuela; sobreestima mucho el impuesto.<br/><strong>Utilidad:</strong> el % se aplica sólo a la ganancia del viaje (tarifa − comisión − costo variable), no al bruto.',
  resicoRate:
    '<strong>Retención RESICO.</strong> Porcentaje que la plataforma retiene de tu ingreso BRUTO bajo el régimen simplificado (RESICO). En México la retención de plataformas digitales ronda 2.1% a 2.5% del ingreso.',
  // --- Tipo de financiamiento ---
  financeType:
    '<strong>Tipo de financiamiento.</strong> Cómo estructuras el crédito.<br/><strong>Tradicional:</strong> mensualidad fija que liquida todo el préstamo al final del plazo.<br/><strong>Pago final (globo):</strong> dejas un valor residual sin amortizar; la mensualidad baja, pero al final debes pagar el globo o refinanciarlo.<br/><strong>Arrendamiento:</strong> rentas el auto, NO eres dueño: no hay reventa ni depreciación a tu favor, pero la salida inicial y la mensualidad suelen ser menores.',
  balloonPct:
    '<strong>Valor residual (globo).</strong> Fracción del monto financiado que NO se amortiza en las mensualidades y queda como un pago único al final del plazo. Baja tu mensualidad pero te deja un pago grande (o un refinanciamiento) al cierre. Común en planes de agencia.',
  leaseMonthly:
    '<strong>Renta mensual del arrendamiento.</strong> Lo que pagas cada mes por usar el auto sin ser dueño. No incluye seguro, gasolina ni mantenimiento (esos los sigues pagando tú como arrendatario).',
  leaseDownPayment:
    '<strong>Pago inicial del arrendamiento.</strong> Desembolso único al firmar (depósito/comisión de apertura). NO se recupera al final porque nunca eres dueño del auto.',
  leaseTermMonths:
    '<strong>Plazo del arrendamiento.</strong> Meses de duración del contrato. Si tu horizonte de análisis es menor, sólo se cuentan las rentas dentro del horizonte.',
  leaseKmCapYear:
    '<strong>Límite de km al año (arrendamiento).</strong> Kilometraje incluido en el contrato. Si manejas más (típico en Uber), cada km extra se cobra como penalización.',
  leaseExcessKmFee:
    '<strong>Cuota por km excedente.</strong> Lo que cobra el arrendador por cada kilómetro arriba del límite anual. Para uso intensivo (Uber) esta penalización puede ser fuerte.',
  // --- Seguro como % del valor ---
  insuranceMode:
    '<strong>Cómo cobras el seguro.</strong><br/><strong>Monto fijo:</strong> una prima mensual plana que tú capturas.<br/><strong>% del valor:</strong> la prima anual es un porcentaje del valor del auto, así que BAJA cada año conforme el auto se deprecia (realista para cobertura amplia, donde la prima sigue el valor asegurado).',
  insurancePctOfValue:
    '<strong>Seguro como % del valor/año.</strong> Prima anual como porcentaje del valor depreciado del auto. La cobertura amplia en México suele rondar 3% a 6% del valor asegurado al año; declina conforme el auto pierde valor.',
  // --- NUEVOS: depreciación de usados, garantía, carga pública, pérdida total ---
  usedDepreciationRate:
    '<strong>Depreciación de usados (saldo decreciente).</strong> Un auto usado pierde un % MENOR de su valor cada año que uno nuevo: la curva ya se aplanó. Aquí defines esa tasa anual (típico 10-15%); se afina un poco más con la antigüedad del auto y queda acotada entre 4% y 30%. Sólo aplica cuando la condición es "Usado".',
  warrantyYearsRemaining:
    '<strong>Años de garantía restantes.</strong> Mientras el auto siga en garantía, las reparaciones mayores las cubre el fabricante, así que la <strong>reserva de reparaciones</strong> de esos años se pone en ≈0. Pasada la garantía, la reserva vuelve a aplicar y crece con la edad. Autos nuevos suelen traer 3-5 años; los usados normalmente 0.',
  publicChargeFraction:
    '<strong>Fracción de carga pública.</strong> Parte de la energía que cargas en estaciones públicas (más caras) en lugar de en casa. El precio efectivo del kWh mezcla tu tarifa casera y la pública según esta fracción. Sólo afecta autos eléctricos o híbridos enchufables.',
  publicChargePrice:
    '<strong>Precio de carga pública.</strong> Costo por kWh en cargadores públicos/comerciales, normalmente bastante más alto que la tarifa doméstica de CFE. Se mezcla con tu precio casero según la fracción de carga pública.',
  theftLossProbAnnual:
    '<strong>Riesgo de pérdida total / robo (anual).</strong> Probabilidad de que en un año el auto se pierda por completo (robo o siniestro total). En la simulación Monte Carlo se acumula sobre el horizonte; si ocurre, el seguro de cobertura amplia paga aproximadamente el valor depreciado menos el deducible y se sustituye la reventa por ese pago. Sólo afecta el análisis de riesgo, no el caso base.',
  theftDeductiblePct:
    '<strong>Deducible de cobertura amplia.</strong> Porcentaje del valor asegurado que NO te paga la aseguradora en caso de pérdida total (tú lo absorbes). En México la cobertura amplia suele tener deducibles de 3% a 10% para robo/pérdida total.',
};
