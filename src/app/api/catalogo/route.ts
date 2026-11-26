import { catalogVersion, records, verificationLabel } from "../../../lib/catalog";
import { checkedOn } from "../../../lib/evidence";
import { project } from "../../../lib/project";

export function GET() {
  return Response.json({
    catalog: project.name,
    scope: "Cuenca piloto del Beni. Cada ficha indica su nivel de verificación, las cifras comprobadas, sus límites y las fuentes de /api/fuentes.",
    checked: checkedOn,
    version: catalogVersion,
    consultedAt: new Date().toISOString(),
    provenance: { source: "Quri-Ñawi web revisada", kind: "semillas_pendientes_mcp", authority: "no_publicadas_en_goldeye_trace" },
    verification: verificationLabel,
    evidence: "/api/fuentes",
    records: records.map((record) => ({ ...record, version: catalogVersion, publicationStatus: "pendiente_revision_mcp" })),
  }, { headers: { "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600" } });
}
