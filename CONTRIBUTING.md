# Cómo contribuir

1. Crea una rama de trabajo desde `main`.
2. Limita el cambio a una sección o a una responsabilidad técnica.
3. Ejecuta `npm ci --ignore-scripts` y `npm run check` (incluye `npm run datos`).
4. Abre una solicitud de cambios con el resultado de la verificación y una descripción del recorrido modificado.

Una ficha de evidencia indica fuente, página o tabla, tipo de muestra, fecha, precisión y autorización. Presenta los datos ilustrativos con su estado y mantén los expedientes sensibles en el flujo de acceso autorizado.

## Cambiar una cifra o una ficha

1. Edita `docs/fuentes/MATRIZ_CIFRAS.csv` o `REGISTRO_FUENTES.csv` y, si cambia lo que se dice, su `redaccion_segura`.
2. Actualiza `src/lib/evidence.ts` con la misma información y, si hace falta, la ficha en `src/lib/catalog.ts`.
3. Una cifra solo pasa a «verificada en la fuente original» si alguien abrió el documento y anotó la página o la tabla.
4. Ejecuta `npm run datos`: falla si falta una fuente, un límite o un enlace `https`, o si el CSV y la app difieren en título, URL, estado, valor o frase segura.
