# Curinawi

Mapa vivo de estudios y proyectos sobre mercurio, creado por el equipo **Golden Eye** para **Gold for Good · ORO-3.3**.

Curinawi reúne referencias sobre mercurio en un catálogo geográfico inicial. Cada ficha enlaza la fuente y conserva el contexto de la medición. El piloto se centra en la cuenca del Beni y la primera consulta se plantea en el río Kaka.

## Base de desarrollo

Requiere la versión de Node.js que indica `.node-version`. Usa npm y el archivo de bloqueo del repositorio.

```sh
npm ci --ignore-scripts
npm run dev
```

Abre `http://localhost:3000`. La app incluye el atlas esquemático en dos vistas, filtros, comparación, guía Quri, metodología, impacto, catálogo JSON y borradores locales. `/api/health` comprueba el arranque.

El lockfile de npm y el CI ya pasaron la verificación del repositorio. npm viene con la versión de Node fijada y `npm ci` instala según el lockfile. Una migración a pnpm sería viable, con su propio lockfile y cambios de CI. Se conserva un único gestor en esta versión.

## Instalar como PWA

Usa `npm run build` y `npm start` para probar el *service worker* en local. Desde HTTPS, abre **Instalar app** o la opción de instalar del navegador. Una vez cargada en línea, la vista principal y su catálogo inicial pueden consultarse sin conexión.

## Verificaciones

```sh
npm run check
npm audit --audit-level=low
```

Con la aplicación en ejecución, `npm run smoke` comprueba la portada y la ruta de estado.

## Próximos pasos

1. Validar las fichas semilla con revisores y probar una consulta con usuarios.
2. Incorporar revisión humana, permisos, persistencia e historial.
3. Conectar el MCP de referencia a la misma vista pública.

[Arquitectura y alcance](docs/architecture.md) · [Contribuir](CONTRIBUTING.md) · [Demo conceptual de Ale](https://qurinawi.vercel.app/).
