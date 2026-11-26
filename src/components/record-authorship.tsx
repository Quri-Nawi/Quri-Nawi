import { authorshipFor, relatedRecords } from "../lib/authorship";
import type { CatalogRecord, SourceLinks } from "../lib/public-catalog";

export function RecordAuthorship({ record, records, sourceLinks, onRelated, onRiver }: {
  record: CatalogRecord;
  records: readonly CatalogRecord[];
  sourceLinks: SourceLinks;
  onRelated: (id: string) => void;
  onRiver: (river: CatalogRecord["area"]) => void;
}) {
  const entry = authorshipFor(record.id);
  // El catálogo público puede cambiar antes que esta atribución editorial.
  const documented = entry && [entry.workId, ...entry.credits.map((credit) => credit.sourceId)]
    .every((id) => record.sourceIds.includes(id) && sourceLinks[id]);
  const linked = documented ? relatedRecords(entry, records).filter((item) => item.sourceIds.includes(entry.workId)) : [];
  const related = linked.filter((item) => item.id !== record.id);

  return <details className="record-authorship">
    <summary>Autoría y créditos</summary>
    {documented ? <>
      <p><strong>Obra citada:</strong> {entry.workLabel}. <a href={sourceLinks[entry.workId].url} target="_blank" rel="noreferrer">Fuente {entry.workId} ↗</a></p>
      <p><strong>En este catálogo:</strong> 1 obra citada en {linked.length}{" "}{linked.length === 1 ? "ficha" : "fichas"}. Es un conteo de registros de Quri-Ñawi, no de publicaciones ni citas científicas.</p>
      {entry.credits.length ? <ul className="author-credits">{entry.credits.map((credit) => <li key={credit.name}>
        <strong>{credit.name}</strong><span>{credit.role}</span>
        {credit.kind !== "organization" && <span>Institución en la fuente: {credit.institution ?? "no documentada"}</span>}
        {credit.kind !== "organization" && <span>{credit.profileUrl ? <a href={credit.profileUrl} target="_blank" rel="noreferrer">ORCID o perfil institucional ↗</a> : "ORCID o perfil institucional: no documentado"}</span>}
        <a href={sourceLinks[credit.sourceId].url} target="_blank" rel="noreferrer">Procedencia {credit.sourceId} ↗</a>
      </li>)}</ul> : <p>Autoría individual: no documentada en la fuente consultada.</p>}
      <p className="authorship-note">{entry.note}</p>
      {related.length > 0 && <div className="related-records"><strong>Otras fichas de la misma obra:</strong> {related.map((item) => <button key={item.id} type="button" className="text-button" onClick={() => onRelated(item.id)}>{item.id} · {item.area}</button>)}</div>}
    </> : <p>Autoría de esta versión: todavía sin vínculo documental validado. Consulta las fuentes de la ficha.</p>}
    <p className="authorship-note"><strong>Roles:</strong> autoría firma la obra; aportante propone incorporarla al catálogo; revisor comprueba los campos antes de autorizarla. Aportante y revisor de esta ficha: no documentados.</p>
    <button className="text-button" type="button" onClick={() => onRiver(record.area)}>Volver al río {record.area} ↑</button>
  </details>;
}
