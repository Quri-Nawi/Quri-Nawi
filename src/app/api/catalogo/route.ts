import { records, seedRecords, reviewedPublications, verificationLabel } from "../../../lib/catalog";
import { checkedOn } from "../../../lib/evidence";
import { project } from "../../../lib/project";

export function GET() {
  return Response.json({
    catalog: project.name,
    scope: "Cuenca piloto del Beni. Cada ficha indica su nivel de verificación, las cifras comprobadas, sus límites y las fuentes de /api/fuentes.",
    checked: checkedOn,
    verification: verificationLabel,
    evidence: "/api/fuentes",
    review: {
      procedure: "PR con revisión humana; la aceptación en D1 no publica una ficha.",
      seeds: seedRecords.map(({ id }) => ({ id, institutionalReview: "pendiente", origin: "semilla-documental" })),
      publications: reviewedPublications.map(({ proposalId, record, version, review, metadata, permission, history }) => ({ id: record.id, proposalId, version, review, metadata, permission, history })),
    },
    records,
  }, { headers: { "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600" } });
}
