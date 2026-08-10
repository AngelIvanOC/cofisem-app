// ============================================================
// src/hooks/useHistorialSiniestro.js
// Datos reales de la línea de tiempo de un siniestro — compartido
// entre cabinero y supervisor para que ambos funcionen igual (mismos
// 5 pasos, mismo Realtime), pero cada uno pinta su propio diseño con
// estos datos. NO es un componente visual a propósito.
// ============================================================
import { useState, useEffect } from "react";
import { fetchHistorial } from "../services/siniestros";
import { supabase } from "../supabaseClient";

// 5 pasos — la unión de lo que cada rol necesitaba: Reportado (cabina),
// Asignado (supervisor/cabina), Arribo y En proceso (ajustador — ver
// registrarArribo en services/evidencias.js, que registra ambos 1s
// aparte aunque ocurran en el mismo instante real), Cerrado (ajustador).
export const PASOS_TIMELINE = [
  { estatus: "Reportado",  label: "Reportado" },
  { estatus: "Asignado",   label: "Asignado" },
  { estatus: "Arribo",     label: "Arribo" },
  { estatus: "En proceso", label: "En proceso" },
  { estatus: "Cerrado",    label: "Cerrado" },
];

export function useHistorialSiniestro(siniestroId) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchHistorial(siniestroId)
      .then((h) => { if (mounted) setHistorial(h); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });

    const ch = supabase
      .channel(`historial-${siniestroId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "siniestros_historial",
        filter: `siniestro_id=eq.${siniestroId}`,
      }, (payload) => {
        setHistorial((prev) => {
          if (prev.some((h) => h.id === payload.new.id)) return prev;
          return [...prev, payload.new].sort((a, b) => new Date(a.cambiado_at) - new Date(b.cambiado_at));
        });
      })
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [siniestroId]);

  return { historial, loading };
}
