import ColaboradorPortal from "./ColaboradorPortal";

// La vista "Mis actividades" del menú lateral reutiliza el mismo portal de
// compromisos del colaborador; ambas rutas apuntan a la misma experiencia.
export default function MisActividades() {
  return <ColaboradorPortal />;
}
