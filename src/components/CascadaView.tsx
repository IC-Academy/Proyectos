import React, { useMemo, useState } from "react";
import { useApp } from "../context/useApp";
import { construirCascada, type NodoCascada } from "../services/selectors";
import { detectarCuellosDeBotella } from "../services/bottleneck";
import { Badge, ProgressBar } from "./ui";
import { colorPorEstado } from "../utils/badges";

const TIPO_LABEL: Record<string, string> = { objetivo: "Objetivo", area: "Área", proyecto: "Proyecto", actividad: "Actividad" };
const TIPO_COLOR: Record<string, string> = { objetivo: "badge-blue", area: "badge-purple", proyecto: "badge-gray", actividad: "badge-gray" };

function Nodo({ nodo, nivel, seleccionado, onSeleccionar }: { nodo: NodoCascada; nivel: number; seleccionado: string | null; onSeleccionar: (n: NodoCascada) => void }) {
  const [abierto, setAbierto] = useState(nivel < 2);
  const tieneHijos = nodo.hijos.length > 0;
  const desviacion = nodo.avance - nodo.avanceEsperado;

  return (
    <div>
      <div className={`cascade-node ${seleccionado === nodo.id ? "selected" : ""}`}>
        <div className="cascade-node-head" onClick={() => onSeleccionar(nodo)}>
          {tieneHijos ? (
            <span
              className="cascade-toggle"
              onClick={(e) => {
                e.stopPropagation();
                setAbierto((a) => !a);
              }}
            >
              {abierto ? "−" : "+"}
            </span>
          ) : (
            <span className="cascade-toggle" style={{ opacity: 0.3 }}>
              •
            </span>
          )}
          <span className={`cascade-type-tag ${TIPO_COLOR[nodo.tipo]}`}>{TIPO_LABEL[nodo.tipo]}</span>
          <span className="cascade-node-name">{nodo.nombre}</span>
          {nodo.bloqueos > 0 && <Badge color="purple">🚫 {nodo.bloqueos}</Badge>}
          {desviacion <= -15 && <Badge color="red">Riesgo alto</Badge>}
          <span className="cascade-node-meta">{nodo.responsable !== "—" ? nodo.responsable : ""}</span>
          <span className="cascade-node-meta">Peso {nodo.ponderacion}%</span>
          <div className="cascade-node-progress">
            <ProgressBar value={nodo.avance} />
          </div>
        </div>
      </div>
      {tieneHijos && abierto && (
        <div className="cascade-children">
          {nodo.hijos.map((h) => (
            <Nodo key={h.id} nodo={h} nivel={nivel + 1} seleccionado={seleccionado} onSeleccionar={onSeleccionar} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CascadaView({ objetivoId }: { objetivoId: string }) {
  const { db } = useApp();
  const raiz = useMemo(() => construirCascada(db, objetivoId), [db, objetivoId]);
  const cuellos = useMemo(() => detectarCuellosDeBotella(objetivoId, db), [db, objetivoId]);
  const [seleccionado, setSeleccionado] = useState<NodoCascada | null>(null);

  if (!raiz) return <div className="empty-state">No se encontró el objetivo.</div>;
  const activo = seleccionado ?? raiz;
  const desviacion = activo.avance - activo.avanceEsperado;

  return (
    <div className="cascade-wrap">
      <div>
        <Nodo nodo={raiz} nivel={0} seleccionado={activo.id} onSeleccionar={setSeleccionado} />
      </div>
      <div className="side-panel">
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div>
              <div className="card-title">{activo.nombre}</div>
              <div className="card-sub">{TIPO_LABEL[activo.tipo]}</div>
            </div>
            <Badge color={colorPorEstado(activo.estado) as never}>{activo.estado !== "—" ? activo.estado : "Consolidado"}</Badge>
          </div>
          <div className="side-panel-row">
            <span className="k">Responsable</span>
            <span className="v">{activo.responsable}</span>
          </div>
          <div className="side-panel-row">
            <span className="k">Ponderación</span>
            <span className="v">{activo.ponderacion}%</span>
          </div>
          <div className="side-panel-row">
            <span className="k">Avance real</span>
            <span className="v">{activo.avance}%</span>
          </div>
          <div className="side-panel-row">
            <span className="k">Avance esperado</span>
            <span className="v">{Math.round(activo.avanceEsperado)}%</span>
          </div>
          <div className="side-panel-row">
            <span className="k">Desviación</span>
            <span className="v" style={{ color: desviacion < -8 ? "var(--red-600)" : "var(--green-600)" }}>
              {desviacion > 0 ? "+" : ""}
              {Math.round(desviacion)} pts
            </span>
          </div>
          <div className="side-panel-row">
            <span className="k">Bloqueos en subárbol</span>
            <span className="v">{activo.bloqueos}</span>
          </div>
          {activo.hijos.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div className="small-text" style={{ marginBottom: 6 }}>
                Contribución de hijos
              </div>
              {activo.hijos.map((h) => (
                <div key={h.id} className="side-panel-row">
                  <span className="k">{h.nombre}</span>
                  <span className="v">{h.avance}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {activo.id === raiz.id && (
          <div className="card">
            <div className="card-title" style={{ marginBottom: 10 }}>
              🔍 Cuello de botella detectado
            </div>
            {cuellos.length === 0 ? (
              <div className="small-text">No se detectan bloqueos relevantes: la cascada avanza dentro de lo esperado.</div>
            ) : (
              <div className="list-clean">
                {cuellos.slice(0, 3).map((c) => (
                  <div key={c.id} style={{ borderLeft: "3px solid var(--red-600)", paddingLeft: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{c.nombre}</div>
                    <div className="small-text">Responsable: {c.responsable}</div>
                    <ul style={{ marginTop: 4 }}>
                      {c.razones.map((r, i) => (
                        <li key={i} className="small-text" style={{ listStyle: "disc", marginLeft: 16 }}>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
