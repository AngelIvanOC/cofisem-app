// ============================================================
// src/features/ajustador/tercero/useTercerosState.js
// Estado de TODOS los terceros de un siniestro — vivía dentro de
// SeccionTercero.jsx, se sube a un hook para que el Hub (que ahora
// muestra una caja por cada tercero directo, sin pantalla intermedia)
// y TerceroDetalle.jsx (el detalle de un tercero) compartan la misma
// fuente de datos y el mismo guardado (guardarPartesInvolucradas
// reconcilia toda la colección, no un tercero a la vez).
// ============================================================
import { useState, useEffect, useCallback } from "react";
import { guardarPartesInvolucradas, fetchPartesInvolucradas } from "../../../services/siniestros";

export const datosAfectadoVacio = () => ({
  _dbId: null,
  tipoTercero: "",
  nombre: "", edad: "", sexo: "", telefono: "", email: "",
  rfc: "", curp: "", direccion: "",
  direccionEstado: "", direccionMunicipio: "", direccionColonia: "", direccionCp: "", direccionCalle: "", direccionNumero: "",
  vehiculo: "", vehiculoMarca: "", vehiculoSubmarca: "", anio: "", color: "", placas: "", serie: "",
  vehiculoTipo: "", vehiculoMotor: "",
  aseguradora: "", polizaTercero: "",
  reporteTercero: "", coberturaTercero: "", vencimientoTercero: "", ajustadorTercero: "",
  licenciaTipo: "", licenciaNumero: "", licenciaFechaExp: "", licenciaLugarExp: "",
  licenciaPermanente: true, licenciaFechaVigencia: "",
  descripcionDano: "", abrirReserva: null, montoEstimado: "",
  danosSiniestro: {}, danosPreexistente: {},
  declaracion: "",
  solicitoGrua: null,
});

export default function useTercerosState(siniestroId) {
  const [afectadosIds, setAfectadosIds] = useState([]);
  const [afectados,    setAfectados]    = useState({});
  const [originalTerceros, setOriginalTerceros] = useState({});
  const [cargando, setCargando] = useState(true);

  const [guardando,    setGuardando]    = useState(false);
  const [errorGuardar, setErrorGuardar] = useState(null);
  const [guardadoOk,   setGuardadoOk]   = useState(false);

  const cargar = useCallback(() => {
    return fetchPartesInvolucradas(siniestroId).then(({ terceros }) => {
      const ids = terceros.map((_, i) => `AF${i + 1}`);
      const map = {};
      terceros.forEach((t, i) => { map[ids[i]] = t; });
      setAfectadosIds(ids);
      setAfectados(map);
      setOriginalTerceros(map);
    });
  }, [siniestroId]);

  useEffect(() => {
    cargar().catch(() => {}).finally(() => setCargando(false));
  }, [cargar]);

  const agregarAfectado = () => {
    const n  = afectadosIds.length + 1;
    const id = `AF${n}`;
    setAfectadosIds((ids) => [...ids, id]);
    setAfectados((a) => ({ ...a, [id]: datosAfectadoVacio() }));
    return id;
  };

  const eliminarAfectado = (id) => {
    setAfectadosIds((ids) => ids.filter((x) => x !== id));
    setAfectados((a) => { const n = { ...a }; delete n[id]; return n; });
  };

  const actualizarDato = useCallback((id, campo, valor) => {
    setAfectados((a) => ({ ...a, [id]: { ...a[id], [campo]: valor } }));
  }, []);

  // Guarda la colección COMPLETA de terceros — cualquier módulo puede
  // disparar esto, no solo un guardado parcial del tercero que se está
  // viendo (mismo comportamiento que el paso único de antes,
  // CapturaEvidencia.jsx).
  const guardarTodo = async () => {
    setGuardando(true);
    setErrorGuardar(null);
    setGuardadoOk(false);
    try {
      await guardarPartesInvolucradas(siniestroId, { cambiosNA: {}, afectadosIds, afectados, originalTerceros });
      // Refresca _dbId de los terceros recién insertados para que
      // Lesionados/fotos ya puedan ligarse a un id real.
      await cargar();
      setGuardadoOk(true);
    } catch (err) {
      setErrorGuardar(err.message ?? "Error al guardar el tercero");
    } finally {
      setGuardando(false);
    }
  };

  return {
    afectadosIds, afectados, cargando,
    agregarAfectado, eliminarAfectado, actualizarDato,
    guardarTodo, guardando, errorGuardar, guardadoOk,
  };
}
