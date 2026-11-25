import { records } from "../../../lib/catalog";
import { project } from "../../../lib/project";

export function GET() {
  return Response.json({
    catalog: project.name,
    scope: "Cuenca piloto del Beni. Fuentes enlazadas para una primera versión.",
    records,
  });
}
