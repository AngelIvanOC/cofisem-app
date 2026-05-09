import { POLIZAS_MOCK } from "../data/polizasMock";

export function detectarTipo(val) {
  const v = val.trim();
  if (!v) return null;
  if (/^[A-Z0-9]{17}$/i.test(v)) return "serie";
  if (/^[A-Z]{2,3}\d{3,4}[A-Z]?$/i.test(v) && v.length <= 8) return "placas";
  if (/^\d{5,9}$/.test(v)) return "reporte";
  return "poliza";
}

export const TIPO_ICON  = { poliza: "🔑", serie: "🔢", placas: "🚗", reporte: "📋" };
export const TIPO_LABEL = { poliza: "Póliza", serie: "No. Serie", placas: "Placas", reporte: "Reporte" };

export async function buscarPoliza(valor) {
  await new Promise((r) => setTimeout(r, 500));
  const v    = valor.trim().toLowerCase();
  const tipo = detectarTipo(valor);
  return (
    POLIZAS_MOCK.find((p) => {
      if (tipo === "serie")   return p.vehiculo.serie.toLowerCase().includes(v);
      if (tipo === "placas")  return p.vehiculo.placas.toLowerCase().includes(v);
      if (tipo === "reporte") return p.siniestros.some((s) => s.reporte.includes(v));
      return p.numero.toLowerCase().includes(v);
    }) ?? null
  );
}
