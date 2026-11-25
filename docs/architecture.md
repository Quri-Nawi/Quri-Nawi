# Arquitectura de Quri-Ñawi

La base usa Next.js con App Router, TypeScript y npm. Incluye una portada mínima y la ruta `/api/health` para verificar el arranque.

| Lugar | Responsabilidad |
| --- | --- |
| `src/app` | Rutas, interfaz y respuestas HTTP. |
| `src/lib/project.ts` | Identidad y datos públicos del proyecto. |
| `scripts/smoke.mjs` | Verificación de la portada y del estado de la app en ejecución. |

## Decisiones para la siguiente etapa

- Empezar por una consulta del Beni con fuentes enlazadas. Mostrar la fecha de muestreo y la de publicación.
- Mantener una proyección pública de registros revisados y autorizados que puedan consumir la web y, después, el MCP.
- Diseñar roles, historial y retiro antes de incorporar fichas restringidas. PostgreSQL/PostGIS se evaluará cuando exista el modelo y se necesite persistencia geográfica.
- Comparar mediciones con matriz, analito, método y unidad registradas. Tratar las proyecciones de salud como escenarios con supuestos.
- Usar el sitio de Ale como referencia de experiencia visual. El catálogo, el mapa y la revisión se añadirán por secciones.
