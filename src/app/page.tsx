import { project } from "../lib/project";

export default function HomePage() {
  return (
    <main>
      <p>{project.challenge}</p>
      <h1>{project.name}</h1>
      <p>{project.description}</p>
      <p>Base de desarrollo · Cuenca piloto del Beni</p>
    </main>
  );
}
