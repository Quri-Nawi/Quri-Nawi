# Arquitectura de Curinawi

La primera versión usa el App Router de Next.js con TypeScript y npm. La portada contiene una experiencia de una sola página, con secciones enlazables.

| Lugar | Responsabilidad |
| --- | --- |
| `src/app` | Rutas, interfaz y respuestas HTTP. |
| `src/app/api/catalogo` | Catálogo público en JSON para personas y agentes. |
| `src/app/api/health` | Estado del servidor, sin caché. |
| `src/app/manifest.ts` | Manifiesto de la PWA: nombre, colores e íconos instalables. |
| `src/lib/project.ts` | Identidad y datos públicos del proyecto. |
| `src/lib/catalog.ts` | Catálogo semilla. La interfaz y la API usan los mismos registros públicos. |
| `src/components` | Atlas esquemático, comparación, borradores locales, guía, instalación y secciones. |
| `public/sw.js` | Caché de la vista principal y de sus recursos públicos. |
| `scripts/smoke.mjs` | Prueba HTTP de la portada, el estado, el catálogo, el manifiesto y el *service worker*. |
| `docs/assets` | Capturas de la aplicación usadas en el README. |

## Decisiones para la siguiente etapa

- Empezar por una consulta del Beni con fuentes enlazadas. La interfaz distingue el muestreo de la publicación. Las dos observaciones del Kaka remiten a una sola revisión.
- Mantener una proyección pública de registros revisados y autorizados que puedan consumir la web y, después, el MCP.
- Diseñar roles, historial y retiro antes de incorporar fichas restringidas. PostgreSQL/PostGIS se evaluará cuando exista el modelo y se necesite persistencia geográfica.
- Comparar mediciones con matriz, analito, método y unidad registradas. Tratar las proyecciones de salud como escenarios con supuestos.
- La geometría del atlas es esquemática y el relieve, ilustrativo. El comparador conserva las limitaciones de las observaciones. La exportación para agentes es JSON de lectura. El formulario guarda borradores en el navegador.

## Créditos de imagen

- Logo de Curinawi generado con ImageGen. El encargo fue un ojo de tinta verde con iris ocre dividido por un río en negativo. Los iconos instalables reutilizan ese mismo símbolo.
- La imagen aérea es una ilustración generada con ImageGen para el informe del proyecto y reutilizada aquí.
- El [logo oficial de Gold for Good](https://gold4good.info.bo/site/assets/logo.svg) se obtuvo del pie de su sitio y aparece en el pie de Curinawi como crédito a la hackathon.
