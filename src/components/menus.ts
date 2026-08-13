// Definición de menús por rol, separada de Layout.tsx para que ese archivo
// solo exporte el componente (regla only-export-components / react-refresh).

export interface MenuItemDef {
  key: string;
  label: string;
  icon: string;
}

export const MENUS: Record<string, MenuItemDef[]> = {
  Administrador: [
    { key: "resumen", label: "Resumen", icon: "🏠" },
    { key: "usuarios", label: "Usuarios", icon: "👥" },
    { key: "areas", label: "Áreas", icon: "🏢" },
    { key: "periodos", label: "Periodos", icon: "🗓️" },
    { key: "configuracion", label: "Configuración", icon: "⚙️" },
    { key: "aprobaciones", label: "Aprobaciones", icon: "✅" },
    { key: "bitacora", label: "Bitácora", icon: "📜" },
    { key: "edd", label: "Integración EDD", icon: "🔗" },
  ],
  Direccion: [
    { key: "resumen", label: "Resumen ejecutivo", icon: "📊" },
    { key: "objetivos", label: "Objetivos estratégicos", icon: "🎯" },
    { key: "cascada", label: "Cascada", icon: "🌊" },
    { key: "gantt", label: "Gantt", icon: "📅" },
    { key: "alertas", label: "Alertas", icon: "🚨" },
    { key: "evidencias", label: "Evidencias", icon: "📎" },
  ],
  Lider: [
    { key: "mis-objetivos", label: "Mis objetivos", icon: "🎯" },
    { key: "proyectos", label: "Proyectos del área", icon: "📁" },
    { key: "equipo", label: "Mi equipo", icon: "👥" },
    { key: "actividades", label: "Actividades", icon: "📋" },
    { key: "solicitudes", label: "Solicitudes", icon: "🔁" },
    { key: "aprobaciones", label: "Aprobaciones", icon: "✅" },
    { key: "gantt", label: "Gantt", icon: "📅" },
  ],
  Colaborador: [
    { key: "resumen", label: "Mi resumen", icon: "🏠" },
    { key: "mis-objetivos", label: "Mis objetivos", icon: "🎯" },
    { key: "mis-actividades", label: "Mis actividades", icon: "📋" },
    { key: "mi-plan", label: "Mi plan", icon: "🗂️" },
    { key: "evidencias", label: "Evidencias", icon: "📎" },
    { key: "solicitudes", label: "Solicitudes", icon: "🔁" },
  ],
};

export const ROL_LABEL: Record<string, string> = {
  Administrador: "Administrador",
  Direccion: "Dirección",
  Lider: "Líder de área",
  Colaborador: "Colaborador",
};
