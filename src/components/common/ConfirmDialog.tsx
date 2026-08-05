import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface Props {
  abierto: boolean;
  titulo: string;
  mensaje: React.ReactNode;
  onConfirmar: () => void;
  onCancelar: () => void;
  textoConfirmar?: string;
  peligroso?: boolean;
}

export function ConfirmDialog({ abierto, titulo, mensaje, onConfirmar, onCancelar, textoConfirmar = "Confirmar", peligroso = false }: Props) {
  return (
    <Modal
      abierto={abierto}
      onClose={onCancelar}
      titulo={titulo}
      ancho="sm"
      footer={
        <>
          <Button variante="secundario" onClick={onCancelar}>
            Cancelar
          </Button>
          <Button variante={peligroso ? "peligro" : "primario"} onClick={onConfirmar}>
            {textoConfirmar}
          </Button>
        </>
      }
    >
      <div className="text-sm text-slate-600">{mensaje}</div>
    </Modal>
  );
}
