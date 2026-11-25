import { project } from "../../../lib/project";

export function GET() {
  return Response.json(
    { status: "ok", service: project.slug },
    { headers: { "Cache-Control": "no-store" } },
  );
}
