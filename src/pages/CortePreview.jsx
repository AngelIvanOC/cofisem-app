import { useEffect, useState } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import CortePDF from "../components/pdf/CortePDF";

export default function CortePreview() {
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("corte_pdf_data");
      if (raw) setDatos(JSON.parse(raw));
    } catch (e) {}
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex-1 overflow-hidden">
        <PDFViewer width="100%" height="100%" showToolbar style={{ border: "none" }}>
          <CortePDF datos={datos ?? undefined} />
        </PDFViewer>
      </div>
    </div>
  );
}
