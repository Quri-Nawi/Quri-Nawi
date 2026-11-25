# Quri-Ñawi

Mapa vivo de estudios y proyectos sobre mercurio, creado por el equipo **GoldnEye** para **Gold4Good · ORO-3.3**.

Quri-Ñawi busca reunir evidencia sobre el mercurio en un catálogo geográfico. Cada ficha enlaza la fuente y conserva el contexto de la medición. El piloto se centra en la cuenca del Beni y la primera consulta se plantea en el río Kaka.

## Base de desarrollo

Requiere la versión de Node.js que indica `.node-version`. Usa npm y el archivo de bloqueo del repositorio.

```sh
npm ci --ignore-scripts
npm run dev
```

Abre `http://localhost:3000`. La portada identifica el proyecto y `/api/health` permite comprobar si el servidor está disponible.

## Verificaciones

```sh
npm run check
npm audit --audit-level=low
```

Con la aplicación en ejecución, `npm run smoke` comprueba la portada y la ruta de estado.

## Próximos pasos

1. Catálogo inicial con fichas revisadas del Beni y una consulta sobre el Kaka.
2. Comparación de registros según muestra, unidad, método, fecha y lugar.
3. Revisión humana, permisos y publicación con historial.
4. Prueba con usuarios y conexión del MCP a las mismas fichas públicas.

[Arquitectura y alcance](docs/architecture.md) · [Contribuir](CONTRIBUTING.md) · [Demo conceptual de Ale](https://qurinawi.vercel.app/).
