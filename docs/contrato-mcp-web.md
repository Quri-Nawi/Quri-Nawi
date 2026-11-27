# Contrato de lectura entre Quri-Ñawi y GoldEye Trace

Relacionado con [web #4](https://github.com/Quri-Nawi/Quri-Nawi/issues/4) y [MCP #1](https://github.com/Quri-Nawi/mcp-quri-nawi/issues/1). Corte documental: 26 de noviembre de 2026.

## Separación de estados

`/api/catalogo` y `/api/fuentes` son la vista documental revisada de la web. Sus `records` son **semillas pendientes de autorización en GoldEye Trace**, aunque cada una declare su nivel de comprobación documental. `verification: primaria` significa lectura de una fuente, no aprobación de publicación en el MCP. `publicationStatus` es `pendiente_revision_mcp` en cada registro. La proyección canónica de GoldEye Trace sigue usando `estado: publicado` y `permiso.publicacion: true`, con revisor, versión y permiso vigente. El adaptador nunca inserta las semillas en esa proyección.

## Campos y mapeo

| Web revisada | Lectura del adaptador MCP | Catálogo canónico MCP |
| --- | --- | --- |
| `records[].id` | Se conserva literalmente en `resultados[].id` y `record.id` | No crea un ID canónico por sí solo. Una ficha autorizada debe resolver explícitamente su identidad. |
| `title`, `area`, `matrix`, `sample`, `published` | Se conservan en el registro completo; la búsqueda expone título, territorio y matriz | `titulo`, `ubicacion_publica`, `matriz`, fechas necesitan revisión campo a campo. |
| `verification`, `claims`, `limits` | Se conservan literalmente en `obtener_registro_web` | No equivalen a `estado: publicado` ni a firma de revisor. |
| `sourceIds` | Se resuelven contra `sources[].id` de `/api/fuentes` | `fuente`, página/sección y licencia requieren comprobación y permiso individual. |
| `figures[].status`, `safeWording` | `consultar_fuentes_web` conserva ambos | La redacción segura no certifica automáticamente un valor canónico. |
| `version`, `checked`, `consultedAt`, `provenance` | Se entregan en cada resultado MCP de la web | No sustituyen `revisor`, `version` ni `permiso` de una ficha autorizada. |

`Sedimentos` podría corresponder a `sedimento` y `Peces` a `pez`. `Datos agregados` requiere decidir si corresponde a `humano_agregado` para cada ficha. `Proyecto` no es una matriz de muestra del catálogo canónico y queda como registro documental. Por eso el adaptador preserva las etiquetas de la web y no hace una conversión silenciosa. Los campos de autoría, método, unidad, página, licencia, precisión territorial y revisor faltantes se revisan antes de cualquier publicación.

## Transporte y fallos

GoldEye Trace se configura como servidor MCP remoto en `https://goldeye-trace-mcp.pinata-server.workers.dev/mcp`. El origen web por defecto del adaptador es `https://quri-nawi.vercel.app`; `WEB_CATALOG_BASE_URL` permite apuntar a una web de pruebas desde el Worker. No se configura token administrativo para leer.

La web entrega JSON público por HTTPS sin token. El MCP usa exclusivamente solicitudes de servidor a `/api/catalogo` y `/api/fuentes`, en paralelo, con límite de cinco segundos, validación de estructura, versión igual en ambas respuestas, IDs únicos y referencias de fuente existentes. Una respuesta inválida o una caída de red produce `web_no_disponible`; no sustituye el catálogo autorizado. Las herramientas canónicas `buscar_estudios` y `obtener_ficha` conservan su significado actual.

En el navegador, el mapa, la lista y el comparador comparten el mismo `record.id` desde una consulta validada. Si falla, muestran la copia incluida en esta versión con un aviso; no se afirma que sea una lectura reciente. El *service worker* guarda una copia de ambas API tras una visita en línea y marca `X-Quri-Copy: offline` cuando la devuelve sin red. `consultedAt` indica cuándo se generó la respuesta guardada; `checked` es la fecha de revisión documental. Una primera visita sin conexión no dispone de copia.

## Propuestas

La cola D1 y `proponer_candidato` de GoldEye Trace no se cambian. El formulario web guarda un borrador local y **todavía no envía propuestas**. No muestra ID ni estado de D1. En una fase posterior hará falta un contrato de envío, confirmación, reintento y duplicado entre la web y el servicio, además de revisión humana. Ningún token administrativo pertenece al cliente.
