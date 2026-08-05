import React from "react";
import { useAuth } from "../hooks/useAuth";
import DirectorDashboard from "./DirectorDashboard";
import LiderDashboard from "./LiderDashboard";
import ColaboradorPortal from "./ColaboradorPortal";

export default function Inicio() {
  const { usuario } = useAuth();
  if (!usuario) return null;
  if (usuario.rol === "Director") return <DirectorDashboard />;
  if (usuario.rol === "Lider") return <LiderDashboard />;
  return <ColaboradorPortal />;
}
