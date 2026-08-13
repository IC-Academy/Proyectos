import React, { useMemo, useState } from "react";
import { useApp } from "../context/useApp";
import { Modal, AlertBox } from "./ui";
import { evaluarSmart, type InsumoSmart } from "../services/smartAi";

const PASOS = [
  { letra: "S", titulo: "Específico" },
  { letra: "M", titulo: "Medible" },
  { letra: "A", titulo: "Alcanzable" },
  { letra: "R", titulo: "Relevante" },
  { letra: "T", titulo: "Temporal" },
  { letra: "IA", titulo: "Revisión" },
];

interface FormState {
  nombreCorto: string;
  descripcion: string;
  resultadoEsperado: string;
  indicador: string;
  lineaBase: string;
  meta: string;
  unidad: string;
  relevanciaEstrategica: string;
  evidenciaEsperada: string;
  riesgosIniciales: string;
  fechaInicio: string;
  fechaFin: string;
  periodoId: string;
  areas: { areaId: string; ponderacion: number }[];
}

export function SmartWizardModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { db, usuarioActual, store } = useApp();
  const periodoActivo = db.periodos.find((p) => p.activo) ?? db.periodos[0];
  const [paso, setPaso] = useState(0);
  const [ia, setIa] = useState<ReturnType<typeof evaluarSmart> | null>(null);
  const [form, setForm] = useState<FormState>(() => ({
    nombreCorto: "",
    descripcion: "",
    resultadoEsperado: "",
    indicador: "",
    lineaBase: "",
    meta: "",
    unidad: "",
    relevanciaEstrategica: "",
    evidenciaEsperada: "",
    riesgosIniciales: "",
    fechaInicio: periodoActivo?.fechaInicio ?? "",
    fechaFin: periodoActivo?.fechaFin ?? "",
    periodoId: periodoActivo?.periodoId ?? "",
    areas: [],
  }));

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setIa(null);
  }

  function toggleArea(areaId: string) {
    setForm((f) => {
      const existe = f.areas.some((a) => a.areaId === areaId);
      const areas = existe ? f.areas.filter((a) => a.areaId !== areaId) : [...f.areas, { areaId, ponderacion: 0 }];
      return { ...f, areas };
    });
    setIa(null);
  }

  function setPonderacion(areaId: string, valor: number) {
    setForm((f) => ({ ...f, areas: f.areas.map((a) => (a.areaId === areaId ? { ...a, ponderacion: valor } : a)) }));
    setIa(null);
  }

  const insumo: InsumoSmart = useMemo(
    () => ({
      nombreCorto: form.nombreCorto,
      descripcion: form.descripcion,
      resultadoEsperado: form.resultadoEsperado,
      indicador: form.indicador,
      lineaBase: form.lineaBase === "" ? null : Number(form.lineaBase),
      meta: form.meta === "" ? null : Number(form.meta),
      unidad: form.unidad,
      fechaInicio: form.fechaInicio,
      fechaFin: form.fechaFin,
      relevanciaEstrategica: form.relevanciaEstrategica,
      evidenciaEsperada: form.evidenciaEsperada,
      areas: form.areas.map((a) => ({ areaId: a.areaId, nombre: db.areas.find((x) => x.areaId === a.areaId)?.nombre ?? "", ponderacion: a.ponderacion })),
    }),
    [form, db.areas]
  );

  const sumaPonderacion = form.areas.reduce((s, a) => s + a.ponderacion, 0);

  function correr() {
    setIa(evaluarSmart(insumo));
  }

  function aplicarSugerencia() {
    if (ia) set("descripcion", ia.redaccionSugerida);
  }

  function crear() {
    const evaluacion = ia ?? evaluarSmart(insumo);
    if (evaluacion.bloqueante || !usuarioActual) return;
    const objetivoId = store.crearObjetivo(
      {
        nombreCorto: form.nombreCorto,
        descripcion: form.descripcion,
        resultadoEsperado: form.resultadoEsperado,
        indicador: form.indicador,
        lineaBase: Number(form.lineaBase),
        meta: Number(form.meta),
        unidad: form.unidad,
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
        periodoId: form.periodoId,
        anioFiscal: db.periodos.find((p) => p.periodoId === form.periodoId)?.anioFiscal ?? "",
        relevanciaEstrategica: form.relevanciaEstrategica,
        evidenciaEsperada: form.evidenciaEsperada,
        riesgosIniciales: form.riesgosIniciales,
        responsablePrincipalId: usuarioActual.usuarioId,
        smartScore: evaluacion.puntaje,
      },
      form.areas,
      usuarioActual.usuarioId
    );
    void objetivoId;
    onClose();
    setPaso(0);
    setForm((f) => ({ ...f, nombreCorto: "", descripcion: "", indicador: "", lineaBase: "", meta: "", areas: [] }));
  }

  const puedeAvanzar = () => {
    if (paso === 0) return form.nombreCorto.trim().length > 2 && form.descripcion.trim().length > 10;
    if (paso === 1) return form.indicador.trim().length > 0 && form.lineaBase !== "" && form.meta !== "";
    if (paso === 2) return form.areas.length > 0;
    if (paso === 3) return form.relevanciaEstrategica.trim().length > 5;
    if (paso === 4) return !!form.fechaInicio && !!form.fechaFin;
    return true;
  };

  const footer = (
    <>
      <button className="btn btn-secondary" onClick={() => (paso === 0 ? onClose() : setPaso((p) => p - 1))}>
        {paso === 0 ? "Cancelar" : "Atrás"}
      </button>
      {paso < 5 ? (
        <button className="btn btn-primary" disabled={!puedeAvanzar()} onClick={() => setPaso((p) => p + 1)}>
          Siguiente
        </button>
      ) : (
        <button className="btn btn-primary" disabled={(ia ?? evaluarSmart(insumo)).bloqueante} onClick={crear}>
          Crear objetivo
        </button>
      )}
    </>
  );

  return (
    <Modal open={open} onClose={onClose} title="Constructor SMART de objetivos" sub="Asistente guiado para Dirección — el avance nunca se captura manualmente." wide footer={footer}>
      <div className="wizard-steps" style={{ padding: 0, marginBottom: 18 }}>
        {PASOS.map((p, i) => (
          <div key={p.letra} className={`wizard-step ${i === paso ? "active" : i < paso ? "done" : ""}`} onClick={() => i < paso && setPaso(i)} style={{ cursor: i < paso ? "pointer" : "default" }}>
            {p.letra}
          </div>
        ))}
      </div>

      {paso === 0 && (
        <div>
          <div className="smart-letter-card">
            <div className="smart-letter-badge">S</div>
            <div>
              <h4>Específico</h4>
              <p>Describe con claridad qué se quiere lograr: el problema u oportunidad y el resultado concreto esperado.</p>
            </div>
          </div>
          <div className="field">
            <label>Nombre corto del objetivo</label>
            <input value={form.nombreCorto} onChange={(e) => set("nombreCorto", e.target.value)} placeholder="Aumentar 30% las ventas" />
          </div>
          <div className="field">
            <label>Descripción inicial</label>
            <textarea value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} placeholder="Incrementar las ventas cerradas de 100 a 130 durante el año fiscal..." />
          </div>
          <div className="field">
            <label>Resultado esperado</label>
            <textarea value={form.resultadoEsperado} onChange={(e) => set("resultadoEsperado", e.target.value)} placeholder="Cerrar el año fiscal con 130 ventas." />
          </div>
        </div>
      )}

      {paso === 1 && (
        <div>
          <div className="smart-letter-card">
            <div className="smart-letter-badge">M</div>
            <div>
              <h4>Medible</h4>
              <p>Define el indicador que se va a monitorear, su línea base actual y la meta cuantificable a alcanzar.</p>
            </div>
          </div>
          <div className="form-grid">
            <div className="field full">
              <label>Indicador</label>
              <input value={form.indicador} onChange={(e) => set("indicador", e.target.value)} placeholder="Ventas cerradas" />
            </div>
            <div className="field">
              <label>Línea base</label>
              <input type="number" value={form.lineaBase} onChange={(e) => set("lineaBase", e.target.value)} placeholder="100" />
            </div>
            <div className="field">
              <label>Meta</label>
              <input type="number" value={form.meta} onChange={(e) => set("meta", e.target.value)} placeholder="130" />
            </div>
            <div className="field full">
              <label>Unidad</label>
              <input value={form.unidad} onChange={(e) => set("unidad", e.target.value)} placeholder="ventas" />
            </div>
          </div>
        </div>
      )}

      {paso === 2 && (
        <div>
          <div className="smart-letter-card">
            <div className="smart-letter-badge">A</div>
            <div>
              <h4>Alcanzable</h4>
              <p>Selecciona las áreas responsables y distribuye su ponderación. La suma debe ser 100%.</p>
            </div>
          </div>
          {db.areas.filter((a) => a.areaId !== "AR-DG").map((a) => {
            const sel = form.areas.find((x) => x.areaId === a.areaId);
            return (
              <div className="area-weight-row" key={a.areaId}>
                <label className="checkbox-row" style={{ flex: 1 }}>
                  <input type="checkbox" checked={!!sel} onChange={() => toggleArea(a.areaId)} />
                  <span className="name">{a.nombre}</span>
                </label>
                <input type="number" disabled={!sel} value={sel?.ponderacion ?? 0} onChange={(e) => setPonderacion(a.areaId, Number(e.target.value))} placeholder="%" />
                <span className="small-text">%</span>
              </div>
            );
          })}
          <div className={`weight-sum-bar`} style={{ color: sumaPonderacion === 100 ? "var(--green-600)" : "var(--red-600)" }}>
            Suma de ponderaciones: {sumaPonderacion}% {sumaPonderacion === 100 ? "✓" : "— debe ser 100%"}
          </div>
          <div className="divider" />
          <div className="field">
            <label>Evidencia esperada</label>
            <textarea value={form.evidenciaEsperada} onChange={(e) => set("evidenciaEsperada", e.target.value)} placeholder="Reportes de CRM, cierres facturados..." />
          </div>
          <div className="field">
            <label>Riesgos iniciales</label>
            <textarea value={form.riesgosIniciales} onChange={(e) => set("riesgosIniciales", e.target.value)} placeholder="Rotación de cartera, capacidad operativa..." />
          </div>
        </div>
      )}

      {paso === 3 && (
        <div>
          <div className="smart-letter-card">
            <div className="smart-letter-badge">R</div>
            <div>
              <h4>Relevante</h4>
              <p>Explica cómo se relaciona este objetivo con la estrategia general de la organización.</p>
            </div>
          </div>
          <div className="field">
            <label>Relevancia estratégica</label>
            <textarea value={form.relevanciaEstrategica} onChange={(e) => set("relevanciaEstrategica", e.target.value)} placeholder="Sostiene el plan de crecimiento anual..." />
          </div>
        </div>
      )}

      {paso === 4 && (
        <div>
          <div className="smart-letter-card">
            <div className="smart-letter-badge">T</div>
            <div>
              <h4>Temporal</h4>
              <p>Define la fecha de inicio, la fecha límite y el año fiscal al que pertenece el objetivo.</p>
            </div>
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Fecha inicial</label>
              <input type="date" value={form.fechaInicio} onChange={(e) => set("fechaInicio", e.target.value)} />
            </div>
            <div className="field">
              <label>Fecha final</label>
              <input type="date" value={form.fechaFin} onChange={(e) => set("fechaFin", e.target.value)} />
            </div>
            <div className="field full">
              <label>Periodo / año fiscal</label>
              <select value={form.periodoId} onChange={(e) => set("periodoId", e.target.value)}>
                {db.periodos.map((p) => (
                  <option key={p.periodoId} value={p.periodoId}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {paso === 5 && (
        <div>
          <div className="flex-between" style={{ marginBottom: 14 }}>
            <div>
              <div className="section-title">Revisión con IA simulada</div>
              <div className="small-text">Motor de reglas 100% local: evalúa cada componente SMART y explica su calificación.</div>
            </div>
            <button className="btn btn-primary" onClick={correr}>
              ✨ Mejorar con IA
            </button>
          </div>

          {!ia && <AlertBox tipo="info">Presiona "Mejorar con IA" para evaluar el objetivo antes de crearlo.</AlertBox>}

          {ia && (
            <div className="grid-2">
              <div className="smart-score-panel">
                <div className="flex-gap" style={{ marginBottom: 14 }}>
                  <div className="smart-score-ring" style={{ background: ia.puntaje >= 80 ? "var(--green-600)" : ia.puntaje >= 55 ? "var(--yellow-600)" : "var(--red-600)" }}>
                    {ia.puntaje}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>Calificación SMART</div>
                    <div className="small-text">{ia.bloqueante ? "No cumple los requisitos mínimos para crearse." : "Cumple los requisitos mínimos."}</div>
                  </div>
                </div>
                {[
                  ["S · Específico", ia.especifico],
                  ["M · Medible", ia.medible],
                  ["A · Alcanzable", ia.alcanzable],
                  ["R · Relevante", ia.relevante],
                  ["T · Temporal", ia.temporal],
                ].map(([label, res]: any) => (
                  <div className="smart-check-row" key={label}>
                    <span className={`smart-check-ic ${res.ok ? "ok" : "bad"}`}>{res.ok ? "✓" : "✕"}</span>
                    <div>
                      <b style={{ fontSize: 12.8 }}>{label}</b>
                      <div className="small-text">{res.mensaje}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                {ia.faltantes.length > 0 && (
                  <AlertBox tipo="warn">
                    <b>Información faltante:</b>
                    <ul style={{ marginTop: 6 }}>
                      {ia.faltantes.map((f, i) => (
                        <li key={i} className="small-text" style={{ listStyle: "disc", marginLeft: 16 }}>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </AlertBox>
                )}
                <div className="card" style={{ marginTop: 12, background: "var(--gray-50)" }}>
                  <div className="card-title" style={{ marginBottom: 8 }}>
                    Redacción sugerida
                  </div>
                  <p className="small-text" style={{ lineHeight: 1.6 }}>
                    {ia.redaccionSugerida}
                  </p>
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: 10 }} onClick={aplicarSugerencia}>
                    Aplicar esta redacción
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </Modal>
  );
}
