// ============================================================
// src/shared/hooks/useFiltros.js
// Hook genérico para manejar estado de búsqueda + filtros
// ============================================================
import { useState, useMemo } from "react";

/**
 * @param {Array}    datos      - Array original de datos
 * @param {Function} filtrarFn  - (item, filtros) => boolean
 * @param {Object}   inicial    - Estado inicial de filtros { busqueda: "", ... }
 */
export function useFiltros(datos, filtrarFn, inicial = { busqueda: "" }) {
  const [filtros, setFiltros] = useState(inicial);

  const setFiltro = (clave, valor) =>
    setFiltros((prev) => ({ ...prev, [clave]: valor }));

  const limpiar = () => setFiltros(inicial);

  const filtrados = useMemo(
    () => datos.filter((item) => filtrarFn(item, filtros)),
    [datos, filtros, filtrarFn]
  );

  return { filtros, setFiltro, limpiar, filtrados };
}
