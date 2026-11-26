# Respaldo de datos de Quri-Ñawi

Comprobado el **26 de noviembre de 2026**. Esta carpeta es la fuente única de las cifras del proyecto: la aplicación, la API (`/api/fuentes`) y la documentación leen o citan estos mismos registros.

## Contenido

| Archivo | Contenido |
| --- | --- |
| [REGISTRO_FUENTES.csv](REGISTRO_FUENTES.csv) | 52 fuentes con enlace o DOI, tipo de fuente y cómo se comprobó cada una. |
| [MATRIZ_CIFRAS.csv](MATRIZ_CIFRAS.csv) | 40 cifras con valor, alcance, fuente, estado y redacción recomendada. |
| [REDACCION_DE_CIFRAS.md](REDACCION_DE_CIFRAS.md) | Cómo citar cada cifra y cuáles no deben usarse. |
| [CONFLICTOS.md](CONFLICTOS.md) | Dónde las fuentes se contradicen y qué lectura se adopta. |
| [COMPROBACION_DE_FUENTES.md](COMPROBACION_DE_FUENTES.md) | Qué se comprobó de cada fuente el 26-nov-2026 y con qué límite. |
| [LIMITES_Y_MANTENIMIENTO.md](LIMITES_Y_MANTENIMIENTO.md) | Qué no se puede afirmar con estas fuentes y cómo se mantiene el registro. |

## Estados de las cifras

| Estado | Cifras | Significado |
| --- | :---: | --- |
| Verificada en la fuente original | 13 | Se leyó el documento original (página o tabla citada). |
| Verificada en fuentes secundarias | 11 | Se leyó la nota o reseña que la cita, no el informe original. Se cita con «según…». |
| Respaldo parcial | 4 | Una sola fuente o alcances distintos. Se cita con su límite. |
| Fuentes en conflicto | 6 | Dos fuentes dan valores distintos. Ver CONFLICTOS.md. |
| No verificada | 2 | No se usa como cifra pública. |
| Supuesto, ejemplo o advertencia | 4 | Dato propio del equipo, ilustrativo o que no debe mezclarse con otros. |

## Fuentes por categoría

| Categoría | Fuentes |
| --- | :---: |
| Salud humana | 8 |
| Comercio de mercurio | 8 |
| Método | 7 |
| Escala regional | 5 |
| Minería | 4 |
| Financiamiento | 4 |
| Sedimentos | 3 |
| Política pública | 2 |
| Peces | 2 |
| Economía | 2 |
| Datos macro | 2 |
| Dosis-respuesta | 1 |
| Tecnología | 1 |
| Actores | 1 |
| Geografía | 1 |
| Código | 1 |

## Uso

1. Toda cifra publicada en la aplicación o en la documentación se identifica por su ID en `MATRIZ_CIFRAS.csv` y usa su columna `redaccion_segura`.
2. Si el estado es conflicto, parcial o advertencia, la cifra se cita con su límite. Si es no verificada, no se cita.
3. Para cambiar una cifra, se edita el CSV y `src/lib/evidence.ts` con el mismo texto y se ejecuta `npm run datos`, que falla si no coinciden o si algo no cuadra (ver [CONTRIBUTING.md](../../CONTRIBUTING.md)).

Los CSV usan UTF-8 con marca de orden de bytes para que Excel muestre bien los acentos.
