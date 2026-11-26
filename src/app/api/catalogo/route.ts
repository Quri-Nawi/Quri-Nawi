import { records, verificationLabel } from "../../../lib/catalog";
import { checkedOn } from "../../../lib/evidence";
import { project } from "../../../lib/project";

export function GET() {
  return Response.json({
    catalog: project.name,
    scope: "Cuenca piloto del Beni. Cada ficha indica su nivel de verificación, las cifras comprobadas, sus límites y las fuentes de /api/fuentes.",
    checked: checkedOn,
    verification: verificationLabel,
    evidence: "/api/fuentes",
    records,
  }, { headers: { "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600" } });
}
