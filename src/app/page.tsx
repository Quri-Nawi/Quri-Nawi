import Image from "next/image";
import { Atlas } from "../components/atlas";
import { BasinHero } from "../components/basin-hero";
import { Contribution } from "../components/contribution";
import { Guide } from "../components/guide";
import { InstallApp } from "../components/install-app";
import { ProjectSections } from "../components/project-sections";
import { project } from "../lib/project";

export default function HomePage() {
  return (
    <>
      <a className="skip-link" href="#contenido">Ir al contenido</a>
      <header className="site-header over-map" id="inicio">
        <div className="header-inner">
          <a className="brand" href="#inicio" aria-label={project.name + ", inicio"}>
            <Image src="/brand/quri-nawi.png" alt="" width={48} height={39} unoptimized />
            <span>{project.name}</span>
          </a>
          <nav className="main-nav" aria-label="Navegación principal">
            <a href="#explorar">Explorar</a><a href="#comparar">Comparar</a><a href="#metodo">Método</a><a href="#aportar">Aportar</a>
          </nav>
          <InstallApp />
        </div>
      </header>
      <main id="contenido" tabIndex={-1}>
        <BasinHero />
        <div className="section-inner guide-strip"><p>¿Primera vez? Sigue el recorrido de tres pasos.</p><Guide /></div>
        <Atlas />
        <ProjectSections />
        <Contribution />
      </main>
      <footer className="site-footer">
        <div className="section-inner footer-inner">
          <div><strong>{project.name}</strong><p>Atlas de evidencia sobre mercurio · Equipo {project.team}</p></div>
          <nav aria-label="Pie de página"><a href="#metodo">Método</a><a href="#impacto">Impacto</a><a href="#agentes">Agentes</a><a href="#escala">Escala</a><a href="#inicio">Volver arriba ↑</a></nav>
          <a className="event" href="https://gold4good.info.bo/site/" target="_blank" rel="noreferrer">
            <Image src="/brand/gold-for-good.svg" alt="Gold for Good Hackathon" width={88} height={58} unoptimized />
            <span>Desarrollado durante la hackathon<br />Bolivia 2026 · ORO-3.3</span>
          </a>
        </div>
      </footer>
    </>
  );
}
