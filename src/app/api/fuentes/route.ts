import { checkedOn, figureStatusLabel, figures, sources, summarize } from "../../../lib/evidence";
import { project } from "../../../lib/project";

export function GET() {
  return Response.json({
    catalog: project.name,
    scope: "Registro de fuentes y matriz de cifras que respaldan el catálogo. Cada cifra indica su alcance, su estado y cómo decirla sin exagerar.",
    checked: checkedOn,
    summary: summarize(),
    states: figureStatusLabel,
    sources,
    figures,
  }, { headers: { "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600" } });
}
