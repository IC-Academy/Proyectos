import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function RequireAuth() {
  const { estaAutenticado } = useAuth();
  if (!estaAutenticado) return <Navigate to="/" replace />;
  return <Outlet />;
}
