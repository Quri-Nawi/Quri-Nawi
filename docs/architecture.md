# Arquitectura de Quri-Ñawi

La primera versión usa el App Router de Next.js con TypeScript y npm. La portada contiene una experiencia de una sola página, con secciones enlazables.

| Lugar | Responsabilidad |
| --- | --- |
| `src/app` | Rutas, interfaz y respuestas HTTP. |
| `src/app/api/catalogo` | Catálogo público en JSON para personas y agentes. |
| `src/app/api/fuentes` | Registro de fuentes y matriz de cifras en JSON. |
| `src/app/api/health` | Estado del servidor, sin caché. |
| `src/app/manifest.ts` | Manifiesto de la PWA: nombre, colores e íconos instalables. |
| `src/lib/project.ts` | Identidad y datos públicos del proyecto. |
| `src/lib/catalog.ts` | Catálogo: 11 fichas con nivel de verificación, qué se comprobó, límites y fuentes. La interfaz y la API usan los mismos registros públicos. |
| `src/lib/evidence.ts` | Fuentes y cifras con estado y redacción segura. Espejo de `docs/fuentes/*.csv`: `npm run datos` falla si difieren. |
| `src/components/evidence.tsx` | Sección «Respaldo» de la portada. |
| `src/components/basin-hero.tsx` | Portada 3D: etiquetas de estudios, líneas guía, panel del río, chips y controles accesibles. |
| `src/lib/outlook.ts` | Escenario «si nadie vuelve a medir»: antigüedad del dato más reciente por río y por línea de evidencia (agua y sedimentos, peces, personas). Lo valida `npm run datos`. |
| `src/components/basin-scene.ts` | Escena Three.js: relieve real, ríos, marcadores, giro automático, zoom al río y clic por *raycasting*. Se carga aparte para no frenar la portada. |
| `src/components` | Atlas esquemático, comparación, borradores locales, guía, instalación y secciones. |
| `public/sw.js` | Caché de la vista principal y de sus recursos públicos. |
| `scripts/validar-datos.mjs` | `npm run datos`: coherencia entre fichas, fuentes, cifras y CSV. Se ejecuta antes del lint en `npm run check`. |
| `scripts/smoke.mjs` | Prueba HTTP de la portada, el respaldo, el estado, el catálogo, las fuentes, el manifiesto y el *service worker*. |
| `public/geo` | `relieve.bin` (elevación en metros, Uint16) y `rios.json`, generados por `scripts/geodatos.py`; `satelite.jpg`, `satelite-hd.jpg` (solo escritorio) y `normales.jpg`, generados por `scripts/terreno_hd.py` y `scripts/blender_terreno.py`. |
| `docs/fuentes` | Respaldo de datos: registro de fuentes, matriz de cifras, conflictos, redacción de cifras y límites. |
| `docs/viabilidad.md` | Evaluación de viabilidad: qué está demostrado y qué no. |
| `docs/assets` | Capturas de la aplicación usadas en el README. |

## Decisiones para la siguiente etapa

- Una cifra sin fuente, alcance y estado no se publica: el CSV es la fuente única y `npm run datos` lo hace cumplir.
- Empezar por una consulta del Beni con fuentes enlazadas. La interfaz distingue el muestreo de la publicación. Las dos observaciones del Kaka remiten a una sola revisión.
- Mantener una proyección pública de registros revisados y autorizados que puedan consumir la web y, después, el MCP.
- Diseñar roles, historial y retiro antes de incorporar fichas restringidas. PostgreSQL/PostGIS se evaluará cuando exista el modelo y se necesite persistencia geográfica.
- Comparar mediciones con matriz, analito, método y unidad registradas. Tratar las proyecciones de salud como escenarios con supuestos.
- La geometría del atlas es esquemática y el relieve, ilustrativo. El comparador conserva las limitaciones de las observaciones. La exportación para agentes es JSON de lectura. El formulario guarda borradores en el navegador.

## Créditos de imagen

- Logo de Quri-Ñawi generado con ImageGen. El encargo fue un ojo de tinta verde con iris ocre dividido por un río en negativo. Los iconos instalables reutilizan ese mismo símbolo.
- El [logo oficial de Gold for Good](https://gold4good.info.bo/site/assets/logo.svg) se obtuvo del pie de su sitio y aparece en el pie de Quri-Ñawi como crédito a la hackathon.

## Datos de la cuenca 3D

- Ríos © colaboradores de OpenStreetMap, con licencia ODbL; `rios.json` es una extracción simplificada y queda bajo esa misma licencia.
- Relieve: Terrain Tiles de Mapzen en AWS Open Data (SRTM, GMTED, ETOPO1). La maqueta exagera la altura ×11 para que el relieve se lea.
- Imagen: Sentinel-2 cloudless 2016, [EOxCloudless](https://cloudless.eox.at) de EOX IT Services GmbH (contiene datos Copernicus Sentinel modificados 2016), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Se ajustó el color, se igualó el tono con NASA Blue Marble y se hornearon en Blender la oclusión y las sombras del relieve real. Las versiones posteriores de ese mosaico tienen licencia no comercial.
- Frontera: Natural Earth (dominio público).
- Los marcadores usan la ubicación aproximada de cada ficha y muestran su precisión. Un mercado de compra no se presenta como sitio de captura.
- Sin WebGL, o con movimiento reducido, la portada sigue siendo usable: el giro se detiene y la vista 2D y la lista responden la misma pregunta.

## Escenario «si nadie vuelve a medir»

- Usa solo las fichas que traen una medición de mercurio (`measures` en `catalog.ts`) y el año de muestreo; no usa el año de publicación.
- Años: hoy (2026), 2027, 2028, 2029 y 2030. Cada año cambia el color continuo de los ríos (`ageColor`), el tono del terreno, la bruma y la opacidad de los marcadores.
- Antigüedad = año elegido − año de la medición más reciente del río. Niveles: hasta 5 años, 6 a 10, 11 a 20 y más de 20. Son un criterio del equipo para priorizar dónde medir, no un umbral científico.
- No proyecta concentraciones, tendencias ni efectos en salud. Esas proyecciones necesitan series de medición y un modelo revisado por especialistas.
- Los ODS mostrados (3, 6, 12 y 15) y el Convenio de Minamata indican a qué compromisos aporta cada tipo de evidencia; no son metas medidas por la app.


## Propuestas y extracción revisable

El [contrato de revisión y publicación](revision-publicacion.md) documenta `POST /api/propuestas`, el envío opcional a la cola D1 existente y el manifiesto de publicaciones revisadas. El [piloto de extracción](extraccion-revisable.md) procesa PDF/TXT localmente, conserva respaldo y correcciones por campo y entrega un expediente pendiente al mismo flujo. La autenticación y revisión administrativa continúan a cargo del procedimiento por PR y del MCP; no se expone un token administrativo al cliente.

## Tipografía y piezas animadas

- Títulos, marca y cifras usan Bargain (`public/fonts/bargain.woff`, convertido del OTF del equipo). Es de Hamzstudio · Sensatype con todos los derechos reservados: el uso web depende de la licencia del equipo. No incluye µ ni flechas; el navegador las toma de la fuente de respaldo.
- `src/components/motion-bits.tsx` reúne el contador, la curva y los puntos escalonados de las alertas. Las secciones Método y Escala usan tarjetas con animaciones CSS. Todo se detiene con «reducir movimiento».


## Quri, la guía con voz

- `src/components/quri.tsx` dibuja a Quri en canvas con las piezas de `public/quri` (cuerpo, brazos, ojos y boca): respira, parpadea, sigue el puntero, saluda y mueve la boca con el volumen real de su voz. Se asoma por el borde derecho en la vista general y por el izquierdo con un río abierto.
- Al tocarlo pide el micrófono, solicita a `/api/quri-sesion` una clave temporal de OpenAI Realtime (`gpt-realtime-2.1-mini`, 60 s para conectar) y conversa por WebRTC. La clave del proyecto (`API_KEY_OPENAI`) solo vive en el servidor, que fija instrucciones, herramientas y tope de respuesta.
- Herramientas: `enfocar_rio`, `ver_escenario` y `volver_a_la_cuenca`. El navegador las ejecuta con el evento `quri:control` y devuelve las fichas del río, para que Quri hable solo con el catálogo.
- Límites para cuidar el saldo: 6 sesiones por cliente cada 10 minutos y 60 en total por instancia; cada conversación se corta a los 5 minutos.
