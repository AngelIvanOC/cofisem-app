import { detectarTipoBusqueda, buscarPolizaParaSiniestro } from "../../../services/siniestros";

export function detectarTipo(val) {
  return val.trim() ? detectarTipoBusqueda(val) : null;
}

export const TIPO_ICON  = { poliza: "🔑", serie: "🔢", placas: "🚗", reporte: "📋" };
export const TIPO_LABEL = { poliza: "Póliza", serie: "No. Serie", placas: "Placas", reporte: "Reporte" };

export async function buscarPoliza(valor) {
  return buscarPolizaParaSiniestro(valor);
}
