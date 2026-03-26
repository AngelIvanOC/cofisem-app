// ============================================================
// src/features/analista/polizas/PolizasPage.jsx
// Analista: consultar y cambiar estatus — todas las oficinas
// ============================================================
import { useState } from "react";
import TablaPolizas from "./TablaPolizas";
import ModalPoliza from "./ModalPoliza";

export default function AnalistaPolizas() {
  const [polizaSel, setPolizaSel] = useState(null);
  const [polizas,   setPolizas]   = useState(null); // se maneja internamente en TablaPolizas

  const onGuardar = (updated) => {
    // En producción: supabase.from("polizas").update(...)
    setPolizaSel(null);
  };

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Pólizas</h1>
        <p className="text-gray-400 text-sm mt-0.5">Consulta, aplicación y cambio de estatus — todas las oficinas</p>
      </div>

      <TablaPolizas onSeleccionar={setPolizaSel} />

      {polizaSel && (
        <ModalPoliza
          poliza={polizaSel}
          onClose={() => setPolizaSel(null)}
          onGuardar={onGuardar}
        />
      )}
    </div>
  );
}
