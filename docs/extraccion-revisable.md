# Extracción asistida revisable — issue #12

## Recorrido implementado

En **Aportar → Importar informe y revisar sugerencias**, seleccionar un PDF autorizado con texto o un TXT UTF-8. Se lee localmente con PDF.js, sin enviar el archivo ni su texto al servidor. El atlas no descarga el lector PDF hasta seleccionar un archivo. El límite es 8 MiB, 200 páginas, un millón de caracteres y 30 segundos de lectura PDF; se rechazan archivos vacíos, binarios, formatos no soportados, PDF corruptos/protegidos y escaneos sin texto. No hay OCR, modelo remoto ni inferencia de datos ausentes.

El método `reglas-locales-v1` es un piloto acotado al informe CEDIB de referencia y texto rotulado. Sugiere título, autoría, matriz, especie cuando consta, lugar, método y fechas. Cada sugerencia conserva la página PDF, sección y fragmento literal. **Página PDF no equivale a página impresa**: en este informe hay un desplazamiento de una página. Un campo no reconocido tiene valor `null` y se muestra como **Desconocido**.

La pantalla ofrece texto de la página y sugerencia lado a lado (en móvil, apilados). Hay que revisar los ocho campos. Aceptar conserva el respaldo; corregir exige valor, motivo, página y fragmento literal presente en ella; rechazar exige motivo y deja el valor desconocido. La sugerencia original permanece en el expediente junto a la decisión y el valor final. La persona declara su nombre y que los metadatos son públicos/autorizados; esto no autentica una aprobación institucional ni concede permiso para publicar.

**Guardar propuesta pendiente** conserva el resultado en los borradores existentes. Una segunda revisión de la misma fuente/territorio actualiza ese borrador. **Descargar expediente** entrega JSON con fuente, SHA-256 del archivo, método, límites, sugerencias, decisiones y respaldo por campo. No contiene el documento completo. Se integra con el procedimiento de #8: la cola D1 recibe solo la referencia cuando está habilitada; el expediente completo se revisa por PR. `review` de publicación sigue siendo `null` hasta la revisión formal. [Contrato y publicación](revision-publicacion.md).

## Documento real y reproducción

Fuente pública: [CEDIB, informe Mercurio y salud en la Amazonia boliviana](https://www.cedib.org/wp-content/uploads/2026/08/MERCURIO-Y-SALUD-EN-LA-AMAZONIA-BOLIVIANA-.pdf). Se accedió a la copia públicamente ofrecida por CEDIB. El piloto no presupone derechos de redistribución: el PDF se descarga directamente de su origen, permanece excluido de Git y no se incorpora al catálogo como documento hospedado.

- 186 páginas PDF; aproximadamente 4,14 MiB.
- SHA-256: `5aa2ff430cd30e34f693d6ab7a61448f7352dc417199e219c1d9fb8a4e88c137`.
- El etiquetado de referencia es un cotejo documental efectuado durante esta tarea, no una revisión científica o institucional.

```sh
npm ci --ignore-scripts
npm run check
npx playwright install chromium
npm run demo:informe
QURI_REPORT_PDF=scripts/.cache/informe-cedib.pdf npm run test:browser
```

En PowerShell, establecer `$env:QURI_REPORT_PDF = "scripts/.cache/informe-cedib.pdf"` antes del último comando. La descarga verifica la huella y falla si CEDIB cambió el archivo; no actualiza silenciosamente la referencia. La prueba normal en CI no descarga el documento de terceros: ejecuta el caso sintético y marca como omitido el caso real cuando falta `QURI_REPORT_PDF`.

El caso real comprueba la lectura PDF, huella, campos y páginas contra el etiquetado, corrige la autoría en la interfaz y guarda una propuesta pendiente. Adjunta `evaluacion-informe.json` al informe Playwright. No envía una propuesta de prueba al servicio productivo.

## Evaluación del piloto

| Campo | Referencia cotejada | Resultado de las reglas | Respaldo PDF |
| --- | --- | --- | --- |
| Título | Título principal del informe | Acierto | 2 |
| Autoría | Siete autores en créditos | Parcial: solo el primer nombre; requiere completar | 5 |
| Matriz | Cabello humano y músculo de peces | Parcial: solo cabello; conservar ambas matrices al revisar el estudio completo | 35 |
| Especie | El informe estudia varias especies; no corresponde una sola para toda la ficha | Desconocido; no inventa una especie | — |
| Lugar | Cuencas del Beni y Madre de Dios | Acierto como alcance regional; no como sitio de cada muestra | 2 |
| Método | Equipo Lumex RA-915M para mercurio total | Acierto de identificación del equipo; no reemplaza el protocolo completo | 35 |
| Muestreo/desarrollo | 2023–2024 | Acierto de período declarado, no de fechas individuales | 32 |
| Publicación | Primera edición de junio de 2026 | Acierto | 6 |

Cinco campos correctos dentro de ese alcance, dos parciales y uno sin sugerencia. No se expresa una precisión general a partir de un solo documento. La corrección de autoría que efectúa la prueba es una demostración técnica; la propuesta permanece pendiente. La matriz parcial y los demás límites deben resolverse según el alcance de la ficha antes de publicación.

Las reglas no distinguen automáticamente resultados propios de referencias históricas, no reconocen tablas complejas y no extraen observaciones clínicas. No generalizar una coincidencia de palabras a una conclusión científica. El método prioriza la sección de obtención de muestras para cabello, pero aun así requiere revisión. No infiere permisos de acceso a partir de un enlace público.

## Verificación y mantenimiento

`tests/extraction.test.mjs` cubre ausentes, procedencia, bloqueo sin revisión completa, rechazo, corrección con motivo/respaldo, título ausente, tamaño, UTF-8 y formato. `tests/browser/extraction.spec.mjs` comprueba texto → corrección → descarga → recarga del borrador y, cuando se proporciona el PDF, el informe real. Los archivos de prueba sintéticos se identifican como tales y no se publican como evidencia científica.

PDF.js (paquete `pdfjs-dist`, licencia Apache-2.0) se fija en el lockfile. `prebuild` y `predev` copian su worker a `public` conservando su encabezado de licencia; el artefacto generado no se versiona y no depende de ejecutar scripts durante `npm ci`. El service worker lo guarda solo cuando se utiliza. Actualizar la dependencia exige repetir el caso real y las pruebas offline.

Pendiente: revisión de Omar, revisión científica, validación conjunta con Jhamil y ampliación a más informes/OCR. Sincronización Notion pendiente por falta de destino verificable del proyecto.
