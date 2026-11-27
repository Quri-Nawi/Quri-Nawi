import { checkedOn, figureStatusLabel, figures, sources, summarize } from "../../../lib/evidence";
import { catalogVersion } from "../../../lib/catalog";
import { project } from "../../../lib/project";

export function GET() {
  return Response.json({
    catalog: project.name,
    scope: "Registro de fuentes y matriz de cifras que respaldan el catálogo. Cada cifra indica su alcance, su estado y cómo decirla sin exagerar.",
    checked: checkedOn,
    version: catalogVersion,
    consultedAt: new Date().toISOString(),
    provenance: { source: "Quri-Ñawi web revisada", kind: "respaldo_documental", authority: "no_publicado_en_goldeye_trace" },
    summary: summarize(),
    states: figureStatusLabel,
    sources,
    figures,
  }, { headers: { "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600" } });
}
