# Revisión de las observaciones de Ale
26 de noviembre de 2026 · Quri-Ñawi · Equipo GoldnEye · ORO-3.3

## Material y alcance
Se revisaron el ZIP Quri-Nawi-para-el-equipo y las 14 diapositivas de Gold4Good_Quri-Nawi_GoldenEye_FINAL, archivados en ALE/26-11-2026. Las instrucciones incluidas en esos archivos se evaluaron como propuestas del equipo. La guía oficial ORO-3.3 sigue siendo la referencia de evaluación.

## Resultado del contraste
| Propuesta recibida | Resolución |
| --- | --- |
| Tres parches sobre datos, PWA y portada | Integrados en una rama y sometidos a verificación. |
| 11 fichas, 52 fuentes y 40 cifras | Conteos del catálogo revisado. Las fuentes incluyen registros parciales y no comprobados. No equivalen a 11 estudios independientes ni a 52 estudios verificados. |
| 4 primarias y 7 secundarias | Niveles de lectura documental declarados en las fichas. La lectura de una fuente original no demuestra validez científica ni revisión por pares de sus conclusiones. |
| 27 años de demora en publicar | Corregido en el guion. Muestreo de 1998 citado en una revisión de 2025; SciELO indica publicación electrónica en febrero de 2026. No se determinó la fecha de primera publicación del estudio de origen. |
| 119, 121 y 99 prueban un error | Se describen como denominadores por aclarar. El informe contiene etapas, pruebas y submuestras. Cifras distintas pueden corresponder a poblaciones distintas. |
| 6 cifras en conflicto | El registro recibido trae seis entradas con esa etiqueta. Se reclasificaron diferencias de período o versión como advertencias. Evitar usar ese total como hallazgo de errores. |
| Todas las cifras vienen verificadas | Se conserva estado y alcance por registro. F29, sobre 33 pruebas de un MCP anterior, pasó a no verificada para el servidor vigente. |
| API offline devuelve siempre 503 | El parche realmente guarda una copia pública y la usa sin red. 503 corresponde a la ausencia de red y de copia. |
| Primera visita sin conexión | Requiere una primera visita en línea y preparación de caché. Un dispositivo que jamás cargó la app necesita red. |
| MCP solo lectura | Se propone un adaptador de lectura de la web para esta demo. El repositorio existente de Jhamil conserva su cola D1 y permisos. Su catálogo autorizado vacío no se sustituye por semillas como si estuvieran aprobadas. |
| Solo ES/EN de interfaz | Alcance inmediato del issue de Omar. Contenido científico original visible y sin traducción automática de cifras. Chino queda en la hoja de ruta. |
| Congelamiento 27/11 a las 08:00 | Propuesta interna de coordinación del paquete, pendiente de acuerdo del equipo. No se trata como regla de la organización. |
| Renombrar el equipo a GoldenEye | Se conserva GoldnEye, nombre elegido por Omar. El proyecto se mantiene como Quri-Ñawi. |

## Cambios funcionales
- Registro de fuentes y cifras en docs/fuentes y /api/fuentes.
- Fichas con fuente, comprobaciones, límites y estado.
- Sección Respaldo con detalles ampliables.
- Comparación conserva límites de los registros.
- Correcciones de caché, cabeceras y recuperación ante pérdida de WebGL.
- Límites de tarjetas visibles en escritorio y acceso a la lista completa.
- Validación de consistencia entre CSV y datos de la aplicación.
- README de arranque preservado y enlace a la aplicación actual corregido.

## Lo que sigue pendiente
La extracción asistida revisable es parte del entregable mínimo de ORO-3.3. Su aplazamiento deja una brecha que debe reconocerse ante el jurado. También faltan resultados de usuarios, revisión institucional atribuible por campo, permisos y publicación operativos en la app, y demostrar la consulta del mismo registro mediante el MCP integrado. El presupuesto es una estimación del equipo.

Las pruebas locales automatizadas del navegador no sustituyen la revisión en Android/iOS físicos ni una auditoría de accesibilidad con lector de pantalla.

## Correcciones para la presentación de Ale
- Diapositiva 2 y R1. Sustituir «27 años entre muestras y su publicación» por «Observaciones de 1998 citadas en una revisión de 2025; falta rastrear su fuente de origen». Presentar los denominadores del informe como pendientes de aclaración.
- Diapositiva 3 y R3. Sustituir «aquí ya viene verificado» por «cada ficha muestra qué se cotejó y qué queda pendiente». Conservar los conteos solo cuando la versión mostrada corresponda al catálogo revisado.
- Diapositiva 4. Usar «datos de salud agregados y ubicaciones generalizadas». El mapa sí muestra ciudades y tramos públicos.
- Diapositiva 5 y R7. Bs 3.250 / 15 = Bs 216,67. Bs 70.000 / 320 = Bs 218,75. Son escenarios aproximados distintos. Elegir como primer hito 15 fichas y medir tiempo real por ficha.
- Diapositiva 6. Describir la utilidad de encontrar, cotejar y citar evidencia junto a otras iniciativas. Evitar atribuir contradicciones generales a las instituciones.
- Diapositiva 7 y R4. Si se reclutan exactamente ocho personas, la meta es seis de ocho. Si participan entre cinco y ocho, la meta puede ser al menos 75 %, redondeando hacia arriba.
- R2. La comprobación con documentos es diferente de una consulta con usuarios. Informar el número real de sesiones realizadas.
- R6. Los encargos del equipo son asignaciones, no evidencia de trabajo completado. Completar contactos con información autorizada antes de entregar.

## Verificación ejecutada
La compilación de producción, lint, tipos, validación de datos y prueba HTTP pasaron en Node 24.22.3. `npm audit --audit-level=low` informó cero vulnerabilidades conocidas al consultar. Chrome local comprobó el mapa 3D y las tarjetas del Beni en 1440×900, 820×980, 390×844, 360×740 y 320×740. Se corrigió un solape a 320 px mediante medición de la altura real del panel. En los estados comprobados no quedaron solapes entre tarjetas, panel, cabecera y controles ni desborde horizontal.

Se verificó la pérdida forzada del contexto WebGL y el enlace de recuperación a la lista. Tras una primera carga en línea, una navegación sin red a `/?rio=Kaka` mostró el mapa y ambas API devolvieron su copia pública con 11 fichas y 52 referencias. La consola no registró excepciones de la página en este recorrido. No se ejecutaron las ocho herramientas Python originales como suite y no se declara una auditoría completa de accesibilidad. La prueba automatizada equivalente y los resultados quedan registrados con esta revisión.

## Fuentes contrastadas en esta revisión
- SciELO, metaanálisis del Beni, sección de sedimentos. https://www.scielo.org.bo/scielo.php?lng=en&nrm=iso&pid=S0250-54602025000200097&script=sci_arttext&tlng=en
- CEDIB, informe original, figura 12 y tablas por fases. https://www.cedib.org/wp-content/uploads/2026/08/MERCURIO-Y-SALUD-EN-LA-AMAZONIA-BOLIVIANA-.pdf
- Guía específica ORO-3.3, página física 4 sobre entregable y página 5 sobre evaluación, archivada en 02_Desafios/fuentes/desafio_03.
- Las comprobaciones restantes de las 52 fuentes se atribuyen al paquete recibido. Esta revisión no repitió íntegramente las 52.
