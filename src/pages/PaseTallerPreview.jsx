// ── SOLO DESARROLLO — eliminar antes de producción ───────────
// Acceso: /gaman/pase-taller-preview?id=35  (ruta pública, sin autenticación)
// Escribe el id del siniestro (columna "id" de la tabla siniestros)
// y se renderiza el PDF del Pase Taller tal como se descargaría.
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { PDFViewer } from "@react-pdf/renderer";
import PaseTallerPDF from "../components/pdf/PaseTallerPDF";
import { fetchPaseTallerData, buildPaseTallerPDF } from "../services/pasePdf";

export default function PaseTallerPreview() {
  const [params, setParams] = useSearchParams();
  const [idInput, setIdInput] = useState(params.get("id") ?? "");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const id = params.get("id");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setData(null);
    fetchPaseTallerData(Number(id))
      .then((raw) => setData(buildPaseTallerPDF(raw)))
      .catch((err) => setError(err.message ?? "Error al cargar el siniestro"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setParams(idInput ? { id: idInput } : {});
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="shrink-0 flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
        <label className="text-sm font-semibold text-gray-600">ID del siniestro:</label>
        <input
          type="number"
          value={idInput}
          onChange={(e) => setIdInput(e.target.value)}
          placeholder="Ej. 35"
          className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm w-32"
        />
        <button type="submit" className="px-4 py-1.5 rounded-lg bg-[#13193a] text-white text-sm font-bold">
          Ver
        </button>
        {loading && <span className="text-xs text-gray-400">Cargando...</span>}
        {error && <span className="text-xs text-red-500">{error}</span>}
      </form>

      <div className="flex-1 overflow-hidden">
        {data ? (
          <PDFViewer width="100%" height="100%" showToolbar style={{ border: "none" }}>
            <PaseTallerPDF data={data} />
          </PDFViewer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            {id ? "Cargando..." : "Escribe un ID de siniestro arriba y presiona \"Ver\"."}
          </div>
        )}
      </div>
    </div>
  );
}
