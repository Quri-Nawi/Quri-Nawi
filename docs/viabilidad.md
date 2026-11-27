# Viabilidad de Quri-Ñawi

Valoración de si el piloto se puede usar y mantener, con lo que está demostrado hoy y lo que no. Fecha: 26 de noviembre de 2026. Las cifras citadas remiten a [docs/fuentes](fuentes/README.md).

## Resumen

| Dimensión | Veredicto | Con qué se sostiene |
| --- | :---: | --- |
| Necesidad: la evidencia está dispersa y requiere contexto | Demostrada | La propia verificación del equipo encontró diferencias de unidades, denominadores, períodos y versiones que requieren cotejo (ver más abajo). |
| Técnica: la aplicación funciona y se puede mantener | Demostrada | Compila, pasa lint, tipos, validación de datos y prueba HTTP con Node 24; CI en cada cambio. |
| Datos: las fichas se pueden respaldar | Registro documental para 11 fichas | Cada ficha declara verificación, qué se comprobó, límites y fuentes; la validación falla si falta alguno. |
| Ética y legal: se puede publicar sin dañar | Diseñada, no auditada | Datos agregados, sin ubicaciones precisas ni PDF de terceros; falta revisión de un comité o de las organizaciones dueñas de los datos. |
| Operativa: alguien puede mantenerla | No demostrada | No hay roles, historial ni revisores asignados todavía. |
| Uso: la gente encuentra y entiende la evidencia | **No probada** | No se ha hecho ninguna prueba con usuarios. |

La aplicación funciona como piloto; todavía no demuestra que resuelva el problema. Lo que sigue explica cada veredicto.

## 1. Necesidad

El problema de partida es que la evidencia sobre mercurio en el Beni existe, pero cuesta usarla con confianza. No lo decimos de oído: al verificarla encontramos que

- un informe de CEDIB contiene denominadores de 119, 121 y 99 en secciones distintas. Se requiere aclarar etapas y pruebas antes de comparar (F01);
- las series de importaciones tienen distintos períodos y alcances (F17);
- Mongabay Latam y su propia base no coinciden en el número de estudios revisados (F08);
- una cifra de importaciones citada con frecuencia, 103 t de UN Comtrade, no tiene respaldo;
- el valor de 3,26 µg/g admite redondeos distintos (3,2 o 3,3); se cita como 3,3 (F03).

Esto muestra que hace falta un lugar donde cada cifra lleve su fuente, su alcance y su estado. No mide cuánta gente lo necesita ni si Quri-Ñawi es la forma correcta de dárselo.

## 2. Viabilidad técnica

- Next.js 16, React 19, TypeScript 6 y Three.js, con relieve real y ríos de OpenStreetMap.
- `npm run check` ejecuta la validación de datos, lint, tipos y la compilación de producción. `npm run smoke` prueba la app en marcha: portada, sección de respaldo, `/api/catalogo`, `/api/fuentes`, estado, PWA y datos de la cuenca.
- Funciona sin servidor propio de datos: las fichas viven en el código. Eso la hace barata y reproducible, pero limita la escala (ver riesgos).
- Sin WebGL existe un enlace a la vista 2D/lista. La preferencia de movimiento reducido detiene el giro inicial del 3D.
- Sin medir todavía: rendimiento en celulares de gama baja y conexiones lentas. La PWA cachea la portada y los recursos públicos para uso sin conexión tras la primera carga.

## 3. Viabilidad de los datos

Estado de las 11 fichas: 4 verificadas en la fuente original (peces de Heliyon, las dos fichas de CEDIB y planetGOLD) y 7 verificadas en fuentes secundarias (sedimentos del Kaka, peces de Rurrenabaque, CPILAP, dos estudios de dragas y Mongabay). Cada etiqueta describe el cotejo documental declarado en el paquete recibido.

Lo que el equipo declara abiertamente:

- Las dos observaciones del Kaka (0,088 y 0,214 µg/g, 1998) proceden de una revisión de 2025 que no nombra la referencia original. Son un caso de uso del comparador, no un resultado.
- Los promedios de CEDIB describen mujeres seleccionadas y voluntarias; no representan a una población.
- Los peces se compraron en mercados, así que la ficha no confirma el lugar de captura.
- Los informes originales de CEJIS y CPILAP no se abrieron; se citan «según» la nota que los reporta.

El gemelo de salud, si se presenta, es un escenario sobre mujeres con exposición previa, con una sensibilidad de 0,745 a 0,9 para la proporción sobre 1 µg/g (F38). No es una predicción.

## 4. Viabilidad ética y legal

- **Datos agregados.** Salud solo agregada; sin datos individuales ni ubicaciones precisas. Los marcadores muestran su precisión y son aproximados.
- **Principios CARE y FAIR** como marco (S39, S40). Aplicarlos de verdad requiere hablar con las organizaciones indígenas y con quienes custodian los datos; eso no se ha hecho.
- **Licencias.** Se enlazan los estudios de terceros, no se redistribuyen sus PDF (el artículo de Heliyon es CC BY-NC-ND). Los ríos son © colaboradores de OpenStreetMap (ODbL).
- **Lenguaje.** Los hallazgos de salud se presentan como reportados y de diseño transversal; no se atribuyen al mercurio (F37).

## 5. Viabilidad operativa y costo

- La aplicación todavía carece de un flujo institucional de revisión y roles. Git conserva el historial del código y de los datos. La verificación la hace quien edita el CSV y la comprueba `npm run datos`.
- El presupuesto del piloto (Bs 217 por ficha; Bs 3.250 para 15 fichas; Bs 70.000 para un piloto núcleo) es un **supuesto del equipo** (F32), no un dato externo.
- Las fuentes de financiamiento no se citan: la lista de 12 programas no está verificada (F31).

## 6. Riesgos

| Riesgo | Efecto | Cómo se reduce hoy | Qué no cubre |
| --- | --- | --- | --- |
| Una cifra se dice con más certeza de la que tiene | Pérdida de credibilidad | Estado y redacción segura por cifra; `npm run datos` | Que alguien improvise en vivo |
| Una fuente se corrige o desaparece | Ficha desactualizada | Fecha de comprobación visible; registro de comprobación | Monitoreo automático |
| Las comunidades no aprueban cómo se usan sus datos | Daño y rechazo | Datos agregados, sin ubicaciones precisas | Consulta previa con las organizaciones |
| Las fichas viven en el código | No escala a cientos de fichas | Estructura de datos validada | Base de datos con roles y revisión |
| La demo se confunde con evidencia | Mensaje equivocado | Ejemplos rotulados (F34) | — |

## 7. Qué demostraría que sí es viable

Prueba con usuarios (aún no realizada): 5 a 8 personas de ONG, academia o gobierno, cada una con una tarea cronometrada.

1. Encontrar una fuente con su fecha de muestreo.
2. Decir qué dato falta para comparar dos fichas.
3. Explicar si una cifra se puede citar y cómo.

Criterio de éxito propuesto: al menos 6 de 8 completan las tres tareas en menos de 5 minutos sin ayuda. Si no lo logran, el diseño cambia antes de crecer.

## 8. Política de afirmaciones

- Las cifras se citan como indica [REDACCION_DE_CIFRAS.md](fuentes/REDACCION_DE_CIFRAS.md).
- Cada cifra lleva su fuente o su «según».
- Lo no probado se describe como plan, no como resultado.
