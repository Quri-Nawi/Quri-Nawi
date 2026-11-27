# Propuesta, revisión y publicación — issues #8 y #4

## Contrato implementado

La web conserva borradores locales y permite descargar un expediente `quri-propuesta-v1`. `POST /api/propuestas` envía **solo la referencia** al `proponer_candidato` del MCP existente con protocolo `2025-11-25`. Reutiliza su cola D1: no crea otra base de datos. La ruta comprueba origen, JSON, tamaño (4 KiB), título (150), URL/DOI (500) y territorio; tiene timeout de 10 segundos. No recibe ni envía tokens administrativos y sus respuestas llevan `no-store`; el service worker no intercepta esta ruta.

Para habilitar el envío configura `QURI_PROPOSALS_ENABLED=1` en el servidor. Sin configuración devuelve 503 y conserva el borrador. El opt-in conserva el alcance de la revisión del 26/11: la escritura no se activa con el despliegue habitual de la demo. La URL del MCP está fijada en código, no se recibe del visitante. El contrato se contrastó con `propuestas.js`, `handler.js` y `worker.js` del repositorio vecino `mcp-quri-nawi`; falta validación conjunta con Jhamil, no se afirma que haya aprobado este cambio.

Solo se muestra confirmación cuando el MCP devuelve un ID `p_` de 20 caracteres hexadecimales y un estado reconocido. Los reintentos de la misma fuente usan el ID estable de D1; el DOI se normaliza. Un timeout puede ocurrir después de guardar: reintentar recupera la propuesta existente. El estado mostrado es el del último envío, no una suscripción a futuras revisiones. El expediente descargado incluye ese ID cuando se ha confirmado.

El contrato actual del MCP **no almacena el expediente por campo**: `motivo` admite 1000 caracteres. Este cambio no lo amplía ni envía documentos completos. Se descarga el expediente local y se adjunta a la revisión por PR únicamente si su contenido es público/autorizado. No subir documentos, datos individuales de salud, comunidades identificables ni ubicaciones restringidas al repositorio público.

## Procedimiento mínimo por PR

1. Una persona propone la referencia, conserva el expediente y, si se habilitó el envío, anota el ID D1. La cola mantiene `pendiente_revision` hasta intervención del revisor.
2. El revisor autorizado consulta la cola con el procedimiento administrativo del MCP. Corrige con motivo, o rechaza y registra su justificación en el expediente/PR. La API administrativa actual del MCP solo guarda estado y revisor; la justificación y el detalle por campo se conservan en la revisión por PR. No confundir `aceptada` con publicación.
3. Para publicar, un mantenedor prepara una entrada en `src/lib/publications.json` con `proposalId`, `state: publicado`, versión consecutiva, ficha pública, autoría, página/sección, método, especie, analito, autorización y revisión atribuida. Los ausentes se escriben como `Desconocido` o `No aplica` con su límite; no se inventan métodos ni permisos.
4. `permission` exige `public: true`, fundamento, precisión generalizada y vencimiento o `null`. `review` exige persona, fecha, decisión `aprobar`, motivo y estado de comprobación científica (`pendiente` o `completada`). `history` conserva cada versión y el responsable/motivo; cambiar una ficha mantiene su ID y aumenta su versión.
5. Solicitar revisión de Omar (@OmarQV) y, para afirmaciones científicas, de la persona competente. El nombre escrito en JSON **no autentica** al firmante; la aprobación se verifica en GitHub. La política de protección de rama es responsabilidad de los mantenedores; no se modificó desde esta tarea.
6. Añadir las fuentes nuevas al registro/CSV y ejecutar `npm run check`, `npm test`, `npm run test:browser`. Integrar únicamente tras la aprobación y autorización necesarias para los datos. La web combina las semillas documentales existentes con publicaciones que pasan el filtro de revisión. Tanto lista, mapa, comparación como `/api/catalogo` leen esos mismos IDs.
7. Mantener coherencia con el catálogo canónico del MCP mediante un PR en ese repositorio: mismo ID y versión, fuente, revisor, permiso y precisión. No hay una transacción ni sincronización automática entre ambos repositorios. Hasta aprobar allí, la ficha no se considera publicada por MCP. Jhamil conserva la responsabilidad de esa integración (#4).

`/api/catalogo.review` distingue semillas sin aprobación institucional y publicaciones con historial. Una propuesta pendiente/rechazada, un permiso vencido/restringido y campos ajenos a la lista pública se excluyen de publicaciones. `npm run datos` rechaza expedientes inválidos o propuestas repetidas en el manifiesto. Los borradores permanecen fuera de las API públicas.

## Demostración y límites comprobados

`tests/proposals.test.mjs` verifica contrato, DOI, confirmación, reintento e ID estable con respuestas controladas; no escribe en la cola productiva. `tests/review.test.mjs` reproduce pendiente → aprobación → publicación con un expediente **sintético**, y prueba exclusión de rechazo, permisos inválidos/vencidos y campos privados. No firma ni publica una revisión de estudios reales.

No se creó ninguna aprobación institucional ni permiso ficticio para las seis semillas originales (ni para las cinco añadidas posteriormente). La revisión documental disponible está en cada ficha y en `docs/fuentes/COMPROBACION_DE_FUENTES.md`. Las once conservan `institutionalReview: pendiente` en la API. Las semillas siguen visibles como antes en la web; el catálogo autorizado del MCP no se sustituye por ellas.

Pendientes externos: revisión por Omar, contraste científico, autorización de publicación por titulares cuando aplique, validación conjunta del contrato y publicación coordinada con Jhamil. No se enviaron propuestas de prueba al servicio productivo ni mensajes a personas.

Sincronización Notion pendiente: no se encontró un destino verificable de este proyecto en la conexión disponible.
