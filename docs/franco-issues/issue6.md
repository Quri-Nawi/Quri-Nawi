## Objetivo
Al seleccionar un río, Quri ayuda a entender qué hay en el catálogo, la fecha del hallazgo y qué falta verificar. Base actual: `guide.tsx` solo abre un diálogo de tres pasos.

## Tareas
- [ ] Proponer un personaje original y discreto acorde con el ojo/río de la marca. Mostrar un boceto antes de integrar.
- [ ] Añadir ayuda contextual y botón «Escuchar resumen» en el río o panel de fichas. La mascota puede minimizarse y respeta movimiento reducido.
- [ ] Redactar un guion de 30–45 segundos para Kaka y Beni desde las fichas, citando fuentes y separando muestreo de publicación.
- [ ] Indicar «faltan fichas en este catálogo» cuando corresponde y conservar las limitaciones de las semillas.
- [ ] Incorporar reproducir, pausar y detener, transcripción y cambio de río que detenga el audio anterior. La reproducción empieza por acción del usuario.
- [ ] Evaluar ElevenLabs con los créditos disponibles y registrar condiciones y atribución aplicables. Generar audios de guiones revisados y reutilizarlos por versión. Ofrecer lectura de texto si falla el audio.
- [ ] Guardar claves en servidor. Si el audio se genera por API, controlar longitud, cuota y caché.

## Aceptación
En móvil y escritorio se escucha el resumen del río seleccionado, se puede detener y leer el mismo texto. Se identifica el estado de revisión y la fuente del guion.

Referencias de proveedor [TTS](https://elevenlabs.io/docs/overview/capabilities/text-to-speech) y [planes](https://elevenlabs.io/pricing).

Responsable previsto **Franco**. Asignación GitHub pendiente de incorporación. Coordinar puntos de integración del mapa con el issue visual.

## Entrega y revisión
Trabajar en una rama y abrir un PR con referencia a este issue. Adjuntar capturas o evidencia de funcionamiento y los checks pertinentes. Solicitar revisión a **Omar (@OmarQV)**. El responsable puede proponer otra solución si explica cómo cumple los criterios. Prioridad P0 para el recorrido del pitch del 26/11, P1 después de completar ese recorrido.

## Alcance actualizado tras la revisión del 26/11

Este ajuste actualiza el alcance y la prioridad anteriores. Se conservan el responsable y la revisión por Omar.

Hoja de ruta según la priorización propuesta por Ale. El guion de cada río debe cotejarse con la ficha antes de producir voz. Kaka conserva observaciones de 1998 citadas en una revisión de 2025. Las fichas del Beni tienen distintas fechas y poblaciones. Reutilizar esas fechas y límites de cada ficha, sin generalizar que todo el Beni corresponde a 1998.

[Resolución de observaciones](https://github.com/Quri-Nawi/Quri-Nawi/blob/revision/observaciones-26-nov/docs/observaciones-26-nov.md).