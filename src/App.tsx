import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { RequireAuth } from "./components/layout/RequireAuth";
import { Layout } from "./components/layout/Layout";
import { ToastContainer } from "./components/common/Toast";
import Login from "./pages/Login";
import Inicio from "./pages/Inicio";
import ObjetivosEstrategicos from "./pages/ObjetivosEstrategicos";
import ObjetivoDetalle from "./pages/ObjetivoDetalle";
import MiEquipo from "./pages/MiEquipo";
import MisActividades from "./pages/MisActividades";
import GanttView from "./pages/Gantt";
import Aprobaciones from "./pages/Aprobaciones";
import Alertas from "./pages/Alertas";
import Reportes from "./pages/Reportes";
import Configuracion from "./pages/Configuracion";

export default function App() {
  return (
    <AppProvider>
      <ToastContainer />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route path="/inicio" element={<Inicio />} />
              <Route path="/objetivos" element={<ObjetivosEstrategicos />} />
              <Route path="/objetivos/:id" element={<ObjetivoDetalle />} />
              <Route path="/equipo" element={<MiEquipo />} />
              <Route path="/actividades" element={<MisActividades />} />
              <Route path="/gantt" element={<GanttView />} />
              <Route path="/aprobaciones" element={<Aprobaciones />} />
              <Route path="/alertas" element={<Alertas />} />
              <Route path="/reportes" element={<Reportes />} />
              <Route path="/configuracion" element={<Configuracion />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
