# Verificación reproducible de la demo — issue #9

Entorno: Linux x86_64, Node 24.22.3, npm 11.19.1. Chromium de Playwright; escritorio 1440×900 y perfil Pixel 7 emulado. GPU de software SwiftShader: sus tiempos **no representan** la fluidez de un teléfono físico.

## Repetir y conservar evidencia

```sh
npm ci --ignore-scripts
npx playwright install --with-deps chromium
npm run check
npm test
npm run test:browser
npm audit --audit-level=low
```

Playwright levanta la compilación de producción en el puerto 3100. Conserva capturas completas online/offline por perfil, tiempos de navegación y tamaño transferido/descomprimido de cada recurso en el adjunto `recursos.json`. `playwright-report/index.html` permite consultarlos; CI sube el informe y `test-results` como artefacto `navegador-produccion`. Los resultados describen una primera visita con conexión y una recarga sin red; no una instalación inicial sin red.

Los casos cubren selección del Kaka por URL, acceso a fuentes, filtros, comparación, borrador conservado al recargar, ambas API offline (11 fichas y 52 fuentes), movimiento reducido y pérdida real del contexto WebGL con recuperación a lista/2D. Las pruebas unitarias fuerzan API sin red ni caché (503), caída 503 del servidor con copia (200), fallo de preparación de APIs y actualización sin borrar cachés ajenas.

## Fallos y prioridades

1. Corregido: el service worker permitía anunciar preparación offline sin haber guardado ambas API. Ahora la instalación falla si falta alguna; queda activa la versión anterior cuando existe.
2. Corregido: al actualizar se eliminaban todas las otras cachés del origen. Ahora solo elimina versiones anteriores de `quri-nawi-public-`.
3. Pendiente P0 externo: probar instalación, recarga, rotación y fluidez en Android/iOS físicos, anotando modelo, SO y navegador. La emulación no acredita este requisito.
4. Pendiente: grabar el recorrido con Alejandra y guardar el clip fuera de los datos científicos. Las capturas automáticas respaldan el estado real del catálogo, pero no sustituyen la grabación.

Pesos de archivos fuente: relieve 588 KiB, ríos 44 KiB, satélite móvil 552 KiB, normales 680 KiB, satélite HD 1,9 MiB. La textura HD ya se difiere y no se precarga en móvil ni con ahorro de datos. Priorizar medición física antes de alterar el diseño o reducir la resolución.

## Guion técnico de 75 segundos

- 0–15 s: abrir `/?rio=Kaka`, mostrar dos observaciones históricas de 1998 y aclarar que no describen contaminación actual.
- 15–35 s: ir a la lista, abrir ficha y fuente; comparar seca/húmeda, señalando que faltan método y punto exacto.
- 35–50 s: abrir Respaldo; distinguir lectura de la fuente de validación científica. Mostrar borrador pendiente en Aportar.
- 50–65 s: mostrar el aviso de preparación en Instalar app, desactivar red, recargar `/?rio=Kaka` y abrir el atlas. La copia corresponde a la última versión preparada.
- 65–75 s: ante fallo de GPU usar el acceso a lista/2D. Si el equipo falla, abrir las capturas guardadas; usar el clip cuando se haya grabado.

No se simularon sesiones con usuarios, autorización institucional, revisión científica ni instalación en un dispositivo físico.

Sincronización Notion pendiente: la búsqueda del proyecto `Quri` en la conexión disponible no devolvió un destino verificable; se conserva esta documentación en el repositorio.
