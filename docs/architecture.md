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
| `src/components/basin-scene.ts` | Escena Three.js: relieve real, ríos, marcadores, giro automático, zoom al río y clic por *raycasting*. Se carga aparte para no frenar la portada. |
| `src/components` | Atlas esquemático, comparación, borradores locales, guía, instalación y secciones. |
| `public/sw.js` | Caché de la vista principal y de sus recursos públicos. |
| `scripts/validar-datos.mjs` | `npm run datos`: coherencia entre fichas, fuentes, cifras y CSV. Se ejecuta antes del lint en `npm run check`. |
| `scripts/smoke.mjs` | Prueba HTTP de la portada, el respaldo, el estado, el catálogo, las fuentes, el manifiesto y el *service worker*. |
| `public/geo` | `relieve.bin` (elevación en metros, Uint16), `satelite.jpg` y `rios.json`, generados por `scripts/geodatos.py`. |
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
- Imagen: NASA Blue Marble Next Generation vía GIBS. Frontera: Natural Earth. Ambas de dominio público.
- Los marcadores usan la ubicación aproximada de cada ficha y muestran su precisión. Un mercado de compra no se presenta como sitio de captura.
- Sin WebGL, o con movimiento reducido, la portada sigue siendo usable: el giro se detiene y la vista 2D y la lista responden la misma pregunta.
