<p align="center">
  <img src="public/brand/curinawi.png" alt="Logo de Curinawi: un ojo verde con iris ocre atravesado por un río" width="150">
</p>

<h1 align="center">Curinawi</h1>

<p align="center">
  <b>Atlas de evidencia sobre mercurio · Cuenca del Beni, Bolivia</b><br>
  Explora estudios sobre mercurio, comprueba sus fuentes y decide qué falta investigar.
</p>

<p align="center">
  <a href="https://github.com/Quri-Nawi/Quri-Nawi/actions/workflows/ci.yml"><img alt="Verificación" src="https://github.com/Quri-Nawi/Quri-Nawi/actions/workflows/ci.yml/badge.svg?branch=main"></a>
  <img alt="Gold4Good · ORO-3.3" src="https://img.shields.io/badge/Gold4Good-ORO--3.3-C9A227?style=flat-square&labelColor=173B31">
  <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black">
  <img alt="TypeScript 6" src="https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="Node.js 24 LTS" src="https://img.shields.io/badge/Node.js-24_LTS-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white">
  <img alt="PWA instalable" src="https://img.shields.io/badge/PWA-instalable-5A0FC8?style=flat-square&logo=pwa&logoColor=white">
</p>

<p align="center">
  <img src="docs/assets/portada.jpg" alt="Portada de Curinawi con el título «Lo que sabemos del río» y una ilustración aérea de la cuenca del Beni" width="100%">
</p>

> [!NOTE]
> Curinawi es la aplicación del equipo **Golden Eye** para **Gold for Good · ORO-3.3**, «Mapa vivo de estudios y proyectos sobre mercurio». El piloto se centra en la cuenca del Beni y la primera consulta se plantea en el río Kaka.

## 📈 Avance al 25 de noviembre

La aplicación ya cubre el recorrido de consulta: explorar la cuenca, abrir la fuente, comparar dos fichas y proponer un estudio. La revisión humana, los permisos y la prueba con usuarios son el siguiente tramo.

| Bloque del plan | Estado | Qué funciona hoy | Qué falta |
| --- | :---: | --- | --- |
| 🗺️ **Catálogo y mapa** | ✅ | Atlas esquemático con vista de mapa y relieve 3D, búsqueda y filtros por territorio y tipo de muestra. | Filtro por especie cuando aplique. |
| 📖 **Fichas** | 🟡 | 6 fichas semilla con fuente enlazada y fechas de muestreo y publicación separadas. | Revisarlas y llegar a 5 estudios revisados con página o tabla de respaldo. |
| ⚖️ **Comparar evidencia** | 🟡 | Dos fichas lado a lado, con una nota que explica los límites de la comparación. | Analito, método y unidad como campos; señal de posibles duplicados. |
| ✍️ **Aportes** | 🟡 | Borradores en el navegador, con validación de DOI o enlace `https://` y control de repetidos. | Envío a revisión y persistencia en servidor. |
| 🧾 **Extracción y revisión** | ⏳ | — | Cargar un PDF, sugerir campos con página y corregir antes de publicar. |
| 🔐 **Permisos e historial** | ⏳ | Solo se sirven registros públicos. | Roles, historial, retiro y registros restringidos. |
| 📱 **PWA** | ✅ | Instalable. Tras la primera carga, la portada y el catálogo se consultan sin conexión. | — |
| 🤖 **Agentes** | 🟡 | Catálogo público en JSON en `/api/catalogo`. | Conectar el MCP de referencia a la misma vista. |
| 👥 **Validación con usuarios** | ⏳ | — | Prueba cronometrada y registro del ajuste realizado. |
| 🧪 **Calidad** | ✅ | CI con lint, tipos, compilación y `npm audit`; prueba HTTP de portada, API y PWA. | Pruebas en navegador. |

<sub>✅ listo · 🟡 en curso · ⏳ pendiente</sub>
