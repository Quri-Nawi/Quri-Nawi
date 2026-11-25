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

## ✨ Qué puedes hacer hoy

<table>
  <tr>
    <td width="62%"><img src="docs/assets/atlas.jpg" alt="Atlas de la cuenca del Beni con los ríos Kaka, Beni y Madre de Dios y la lista filtrable de fichas"></td>
    <td>
      <h3>🗺️ Explorar la cuenca</h3>
      Selecciona un río en el atlas o filtra por territorio y tipo de muestra. Cada ficha abre su nota, la fecha de muestreo y el enlace a la fuente.
      <br><br>
      Alterna entre <b>Mapa</b> y <b>Relieve 3D</b>. La geometría es esquemática y las ubicaciones, aproximadas.
    </td>
  </tr>
  <tr>
    <td><img src="docs/assets/comparar.jpg" alt="Comparación de dos observaciones de sedimentos del Kaka: 0,088 y 0,214 µg/g"></td>
    <td>
      <h3>⚖️ Comparar dos registros</h3>
      Pon dos fichas lado a lado. En el caso del Kaka, la app recuerda que ambas observaciones son de 1998, vienen de la misma revisión y les falta el método y el punto exacto.
    </td>
  </tr>
  <tr>
    <td align="center"><img src="docs/assets/celular.jpg" alt="Curinawi en un celular" width="300"></td>
    <td>
      <h3>📱 Llevarla en el celular</h3>
      La interfaz se adapta a pantallas pequeñas y se instala como app desde <b>Instalar app</b>.
      <br><br>
      <h3>🧭 Recorrido con Quri</h3>
      Una guía de tres pasos lleva de la exploración a la comparación y al aporte.
      <br><br>
      <h3>✍️ Proponer un estudio</h3>
      Guarda el título, el DOI o enlace y el territorio como borrador para revisión.
    </td>
  </tr>
</table>

```mermaid
flowchart LR
    A["🗺️ Explorar el atlas"] --> B["🔎 Filtrar por territorio<br>o tipo de muestra"]
    B --> C["📄 Ver ficha y abrir fuente"]
    C --> D["⚖️ Comparar dos fichas"]
    D --> E["✍️ Proponer un estudio"]
    E --> F[("💾 Borrador local<br>pendiente de revisión")]
```
