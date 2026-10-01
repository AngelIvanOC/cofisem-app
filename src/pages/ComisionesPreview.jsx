import { useState } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import ComisionesPDF from "../components/pdf/ComisionesPDF";

// Los datos los deja ReporteComisiones en localStorage justo antes de abrir
// esta pestaña.
function leerDatos() {
  try {
    const raw = localStorage.getItem("comisiones_pdf_data");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function ComisionesPreview() {
  const [datos] = useState(leerDatos);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex-1 overflow-hidden">
        <PDFViewer width="100%" height="100%" showToolbar style={{ border: "none" }}>
          <ComisionesPDF datos={datos ?? undefined} />
        </PDFViewer>
      </div>
    </div>
  );
}
