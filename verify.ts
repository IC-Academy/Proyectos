import { usuariosSemilla } from "./src/data/usuarios";
import { objetivosSemilla } from "./src/data/objetivos";
import { actividadesSemilla } from "./src/data/actividades";
import { actualizacionesSemilla } from "./src/data/actualizaciones";
import { delegacionesSemilla } from "./src/data/delegaciones";
import { bloqueosSemilla } from "./src/data/bloqueos";
import { evidenciasSemilla } from "./src/data/evidencias";
import { solicitudesCambioSemilla } from "./src/data/solicitudesCambio";
import { recalcularCascada } from "./src/utils/cascade";

let errores: string[] = [];
const usuarioIds = new Set(usuariosSemilla.map((u) => u.id));
const objetivoIds = new Set(objetivosSemilla.map((o) => o.id));
const actividadIds = new Set(actividadesSemilla.map((a) => a.id));

function chk(cond: boolean, msg: string) { if (!cond) errores.push(msg); }

// Usuarios: liderId debe existir y ser un Líder o Director
usuariosSemilla.forEach((u) => {
  if (u.liderId) chk(usuarioIds.has(u.liderId), `Usuario ${u.id} liderId inválido: ${u.liderId}`);
});

// Objetivos
objetivosSemilla.forEach((o) => {
  chk(usuarioIds.has(o.responsableId), `Objetivo ${o.id} responsableId inválido: ${o.responsableId}`);
  o.participantesIds.forEach((p) => chk(usuarioIds.has(p), `Objetivo ${o.id} participante inválido: ${p}`));
  if (o.parentId) chk(objetivoIds.has(o.parentId), `Objetivo ${o.id} parentId inválido: ${o.parentId}`);
  chk(o.fechaFin >= o.fechaInicio, `Objetivo ${o.id} fechaFin < fechaInicio`);
  chk(o.creadoPor ? usuarioIds.has(o.creadoPor) : true, `Objetivo ${o.id} creadoPor inválido`);
});

// Actividades
actividadesSemilla.forEach((a) => {
  chk(objetivoIds.has(a.objetivoId), `Actividad ${a.id} objetivoId inválido: ${a.objetivoId}`);
  chk(usuarioIds.has(a.responsablePropietarioId), `Actividad ${a.id} propietario inválido: ${a.responsablePropietarioId}`);
  chk(usuarioIds.has(a.responsableEjecutorId), `Actividad ${a.id} ejecutor inválido: ${a.responsableEjecutorId}`);
  if (a.parentId) chk(actividadIds.has(a.parentId), `Actividad ${a.id} parentId inválido: ${a.parentId}`);
  chk(a.fechaFin >= a.fechaInicio, `Actividad ${a.id} fechaFin < fechaInicio`);
  const obj = objetivosSemilla.find(o => o.id === a.objetivoId);
  chk(!!obj && obj.nivel === 3, `Actividad ${a.id} objetivoId no apunta a una iniciativa (nivel 3)`);
});

// Peso: verificar sumas por grupo de hermanos (reportando cualquier grupo != 100, esperado solo o-conversion)
const gruposObjetivo = new Map<string, number[]>();
objetivosSemilla.forEach((o) => {
  const key = o.parentId ?? "root";
  gruposObjetivo.set(key, [...(gruposObjetivo.get(key) ?? []), o.peso]);
});
console.log("--- Sumas de peso por grupo de objetivos (parentId) ---");
gruposObjetivo.forEach((pesos, key) => {
  const suma = pesos.reduce((a,b)=>a+b,0);
  console.log(`${key}: [${pesos.join(", ")}] = ${suma}${suma!==100 ? "  <-- distinto de 100" : ""}`);
});

const gruposActividad = new Map<string, number[]>();
actividadesSemilla.forEach((a) => {
  const key = a.parentId ?? `obj:${a.objetivoId}`;
  gruposActividad.set(key, [...(gruposActividad.get(key) ?? []), a.peso]);
});
console.log("--- Sumas de peso por grupo de actividades ---");
gruposActividad.forEach((pesos, key) => {
  const suma = pesos.reduce((a,b)=>a+b,0);
  console.log(`${key}: [${pesos.join(", ")}] = ${suma}${suma!==100 ? "  <-- distinto de 100" : ""}`);
});

// Referencias cruzadas de otras entidades
actualizacionesSemilla.forEach((u) => {
  chk(usuarioIds.has(u.usuarioId), `Actualizacion ${u.id} usuarioId inválido`);
  const existe = u.tipoElemento === "actividad" ? actividadIds.has(u.elementoId) : objetivoIds.has(u.elementoId);
  chk(existe, `Actualizacion ${u.id} elementoId inválido: ${u.elementoId}`);
});
delegacionesSemilla.forEach((d) => {
  chk(actividadIds.has(d.actividadId), `Delegacion ${d.id} actividadId inválido`);
  chk(usuarioIds.has(d.usuarioOrigenId), `Delegacion ${d.id} origen inválido`);
  chk(usuarioIds.has(d.usuarioDestinoId), `Delegacion ${d.id} destino inválido`);
});
bloqueosSemilla.forEach((b) => {
  chk(actividadIds.has(b.actividadId), `Bloqueo ${b.id} actividadId inválido`);
  chk(usuarioIds.has(b.responsableAtenderId), `Bloqueo ${b.id} responsableAtenderId inválido`);
  chk(usuarioIds.has(b.reportadoPor), `Bloqueo ${b.id} reportadoPor inválido`);
});
evidenciasSemilla.forEach((e) => {
  chk(actividadIds.has(e.actividadId), `Evidencia ${e.id} actividadId inválido`);
  chk(usuarioIds.has(e.usuarioId), `Evidencia ${e.id} usuarioId inválido`);
});
solicitudesCambioSemilla.forEach((s) => {
  const existe = s.tipoElemento === "actividad" ? actividadIds.has(s.elementoId) : objetivoIds.has(s.elementoId);
  chk(existe, `SolicitudCambio ${s.id} elementoId inválido: ${s.elementoId}`);
  chk(usuarioIds.has(s.solicitadoPor), `SolicitudCambio ${s.id} solicitadoPor inválido`);
});

// Conteos requeridos por la especificación
console.log("--- Conteos ---");
console.log("Usuarios:", usuariosSemilla.length, "(1 director + 3 líderes + 8 colaboradores = 12)");
console.log("Directores:", usuariosSemilla.filter(u=>u.rol==="Director").length);
console.log("Líderes:", usuariosSemilla.filter(u=>u.rol==="Lider").length);
console.log("Colaboradores:", usuariosSemilla.filter(u=>u.rol==="Colaborador").length);
console.log("Objetivos estratégicos (nivel1):", objetivosSemilla.filter(o=>o.nivel===1).length);
console.log("Objetivos de área (nivel2):", objetivosSemilla.filter(o=>o.nivel===2).length);
console.log("Iniciativas (nivel3):", objetivosSemilla.filter(o=>o.nivel===3).length);
console.log("Actividades (nivel4):", actividadesSemilla.filter(a=>a.nivel===4).length);
console.log("Subactividades (nivel5):", actividadesSemilla.filter(a=>a.nivel===5).length);
console.log("Actualizaciones pendientes:", actualizacionesSemilla.filter(u=>u.estatusValidacion==="Pendiente").length);
console.log("Delegaciones:", delegacionesSemilla.length);
console.log("Bloqueos:", bloqueosSemilla.length);
console.log("Evidencias:", evidenciasSemilla.length);
console.log("Solicitudes de cambio:", solicitudesCambioSemilla.length);

// Probar el cálculo de cascada completo
const { objetivos: objCalc, actividades: actCalc, advertenciasPeso } = recalcularCascada(objetivosSemilla, actividadesSemilla);
console.log("--- Resultado de recalcularCascada ---");
objCalc.filter(o=>o.nivel===1).forEach(o => console.log(`${o.id} (${o.nombre}): avanceCalculado=${o.avanceCalculado}%`));
console.log("Advertencias de peso detectadas:", JSON.stringify(advertenciasPeso, null, 2));

console.log("\n=== ERRORES DE INTEGRIDAD ===");
if (errores.length === 0) console.log("Ninguno. Los datos semilla son consistentes.");
else errores.forEach(e => console.log("ERROR:", e));
