import type { Rol } from "../../types";
import {
  LayoutDashboard,
  Target,
  Users,
  ListChecks,
  Building2,
  GanttChartSquare,
  CheckSquare,
  Bell,
  BarChart3,
  Settings,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

export function navPorRol(rol: Rol): NavItem[] {
  const inicio: NavItem = { to: "/inicio", label: "Inicio", icon: LayoutDashboard };
  const alertas: NavItem = { to: "/alertas", label: "Alertas", icon: Bell };
  const configuracion: NavItem = { to: "/configuracion", label: "Configuración", icon: Settings };

  if (rol === "Director") {
    return [
      inicio,
      { to: "/objetivos", label: "Objetivos estratégicos", icon: Building2 },
      { to: "/gantt", label: "Gantt", icon: GanttChartSquare },
      { to: "/aprobaciones", label: "Aprobaciones", icon: CheckSquare },
      alertas,
      { to: "/reportes", label: "Reportes", icon: BarChart3 },
      configuracion,
    ];
  }
  if (rol === "Lider") {
    return [
      inicio,
      { to: "/objetivos", label: "Mis objetivos", icon: Target },
      { to: "/equipo", label: "Mi equipo", icon: Users },
      { to: "/gantt", label: "Gantt", icon: GanttChartSquare },
      { to: "/aprobaciones", label: "Aprobaciones", icon: CheckSquare },
      alertas,
      { to: "/reportes", label: "Reportes", icon: BarChart3 },
      configuracion,
    ];
  }
  return [
    inicio,
    { to: "/actividades", label: "Mis actividades", icon: ListChecks },
    alertas,
    configuracion,
  ];
}
