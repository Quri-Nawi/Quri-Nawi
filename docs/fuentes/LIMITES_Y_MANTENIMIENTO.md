# Límites declarados y mantenimiento

Lo que este registro no puede respaldar hoy, con la redacción que se puede usar sin riesgo.

## Límites declarados

| Tema | Qué se sabe | Redacción |
| --- | --- | --- |
| Informe original de CEJIS (2021) | Se leyó la nota de Mongabay Latam que lo cita (F14). | «Según CEJIS, citado por Mongabay Latam…» |
| Informe original de CPILAP (2023) | Se leyeron tres notas de prensa (S09, S10, S47). | «Según un estudio de CPILAP con la UMSA, reportado por…» |
| Referencia original de los sedimentos del Kaka (1998) | La revisión de 2025 las cita sin nombrar la referencia; el repositorio del IRD estaba en mantenimiento el 26-nov-2026. | «Observaciones de 1998 citadas en una revisión de 2025; faltan el método y el punto exacto.» |
| Vigencia de planetGOLD Bolivia | La web oficial no da fechas del programa (F27). | «Programa de ONUDI y el GEF…», sin decir «vigente». |
| DOI del artículo de Valdivieso (10.53287/txwi4260fn20c) | doi.org no respondió el 26-nov-2026. | Citar por título y revista, sin afirmar su contenido. |
| Revisión por pares del informe de CEDIB | No declarada (F40). | «Informe técnico en formato de artículo», no «artículo revisado por pares». |
| Fondos para escalar y serie del INE | No verificados (F31, F19). | No se usan como cifras. |
| Presupuesto del piloto | Supuesto del equipo (F32). | «Estimación del equipo». |

## Mantenimiento

- **Cuándo revisar:** antes de cada publicación y al incorporar una ficha nueva.
- **Cómo cambiar una cifra:** editar el CSV y `src/lib/evidence.ts` con el mismo texto y ejecutar `npm run datos`. Si falta una fuente, un límite o un enlace https, la verificación falla.
- **Quién decide:** una cifra pasa a «verificada en la fuente original» solo cuando alguien abrió el documento y anotó la página o tabla.
- **Cuándo se retira una cifra:** si una fuente se corrige o se retracta, la cifra baja a «parcial» o «no verificada» y su redacción cambia en el mismo cambio.
