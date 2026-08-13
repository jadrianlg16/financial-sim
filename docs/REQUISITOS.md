# Historial de requerimientos

Este documento conserva la evolución de los objetivos del simulador. Vivía como
un comentario de 42 líneas en la cabecera del archivo monolítico; se movió aquí
al separar el código en módulos, para que siga siendo rastreable sin ocupar la
cabecera de un archivo fuente.

## 1) Alcance inicial

Prototipo funcional con alcance "completo": simulación **Monte Carlo**, **análisis
de sensibilidad** y **comparación multi-auto**. El modelo financiero sigue métodos
estándar de ingeniería económica:

- clasificación de costos (fijos / variables / hundidos),
- valor presente vs. valor futuro del crédito,
- punto de equilibrio e intensidad de trabajo requerida,
- depreciación y valor de rescate con escenarios de liquidación,
- reporte narrativo de la decisión.

## 2) Modos y variables

- **Compra**: contado, crédito o mixto.
- **Operación**: break-even ("que se pague solo"), meta de ganancia mensual, o
  sin Uber (costo puro de propiedad).
- **Motor**: gasolina, diésel, híbrido o eléctrico, cada uno con su costo de
  energía; para EV / híbrido enchufable el tiempo de carga descuenta horas
  productivas.
- Enganche por porcentaje o monto fijo; ciudad por menú o texto libre; inflación
  del combustible; km personales más desgaste extra atribuible a Uber.
- Pestañas de **Fórmulas** e **Importar / AI** (generar prompt JSON e importar un
  caso ya investigado).

## 3) Usabilidad

- Todo slider tiene además un **campo manual editable** que acepta valores fuera
  del rango del slider; el valor real escrito es el que entra al cálculo, y el
  thumb se pinta en ámbar cuando queda fuera de rango.
- Lenguaje llano para quien no sabe de finanzas. Todo tecnicismo lleva
  explicación en un tooltip con ícono `?`, para no gastar espacio visual.
- Se explican explícitamente: Monte Carlo, resultado final, depreciación, valor
  de rescate, punto de equilibrio, costo total, "que se pague solo", costo
  mensual total, desgaste y mantenimiento.
- Perfiles de usuario atendidos: comprar nuevo y pagarlo con Uber, comprar usado,
  calcular el costo de un auto que ya se tiene, usar el carro viejo, ver sólo la
  depreciación sin Uber, comparar autos, y saber qué parte del ingreso se va al
  auto.
- Campo opcional de ingreso mensual → porcentaje del sueldo destinado al auto.

## 4) Variables extra y rigor

Seguro mensual (default $2,000, con nota de que sube con póliza comercial de
Uber), refrendo mensual ($500), lavado ($800), propinas ($400), misceláneos
($2,000) y pagos iniciales únicos (examen toxicológico $400 + certificación Uber
$900). Todas las variables están interconectadas y se reflejan tanto en el
reporte como en las gráficas de gasto de largo plazo.

La investigación asistida por IA debe llenar **todas** las variables y **citar una
fuente por cada dato**, para que el usuario pueda verificar la información en
lugar de confiar en el modelo.
