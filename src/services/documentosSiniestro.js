// ============================================================
// src/services/documentosSiniestro.js
// Inventario de los PDFs que genera un siniestro al cerrarse
// (Declaración, Pase Taller, Pase Médico) para volver a descargarlos
// después — cabinero, supervisor y ajustador (ver
// components/siniestros/DescargaDocumentosSiniestro.jsx).
//
// Solo arma la LISTA (quién, qué vehículo, qué folio); el PDF en sí se
// genera bajo demanda al picar cada renglón, con los mismos
// fetch*/build* que usa la pantalla de éxito del ajustador.
// ============================================================
import { supabase } from "../supabaseClient";
import { fetchLesionados } from "./siniestros";

const SEL_INVENTARIO = `
  id, numero_siniestro,
  pase_taller_numero, pase_taller_definicion, pase_taller_destino,
  pase_taller_taller_nombre, pase_taller_fecha_expedicion,
  polizas(
    placas, anio, notas,
    clientes(nombre, apellido),
    vehiculos_amis(marca, tipo, dl)
  ),
  siniestros_terceros(id, propietario_nombre, vehiculo_desc, vehiculo_placas)
`;

const nombreCompleto = (...partes) => partes.filter(Boolean).join(" ").trim();

function fmtFecha(str) {
  if (!str) return null;
  return new Date(str + "T12:00:00").toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// Participantes del siniestro en el mismo orden que usa la Declaración
// (terceros por id ascendente → AF1, AF2...). `participante_id` de un
// lesionado es "NA" (vehículo asegurado) o el id del tercero.
function armarParticipantes(s) {
  const p   = s.polizas ?? {};
  const veh = p.vehiculos_amis;
  const cl  = p.clientes ?? {};
  const vehiculoNA = veh?.dl
    || (veh ? nombreCompleto(veh.marca, veh.tipo, p.anio) : null)
    || p.notas
    || null;

  const asegurado = {
    id: "NA",
    etiqueta: "Vehículo asegurado",
    responsable: nombreCompleto(cl.nombre, cl.apellido) || "Asegurado",
    vehiculo: [vehiculoNA, p.placas].filter(Boolean).join(" · ") || null,
  };

  const terceros = [...(s.siniestros_terceros ?? [])]
    .sort((a, b) => a.id - b.id)
    .map((t, i) => ({
      id: String(t.id),
      etiqueta: `Tercero ${i + 1}`,
      responsable: t.propietario_nombre || `Tercero ${i + 1}`,
      vehiculo: [t.vehiculo_desc, t.vehiculo_placas].filter(Boolean).join(" · ") || null,
    }));

  return { asegurado, terceros };
}

// ── Inventario completo ──────────────────────────────────────
// Devuelve { numeroSiniestro, declaracion, pasesTaller, pasesMedicos },
// cada lista con items { key, tipo, refId, nombre, detalle, folio,
// grupo: { id, etiqueta, vehiculo } }. Todas son listas aunque hoy la
// Declaración sea única y el Pase Taller viva en columnas de
// `siniestros` (uno por siniestro) — la UI ya agrupa por vehículo, así
// que cuando haya un pase taller por tercero solo cambia este armado.
export async function fetchDocumentosSiniestro(siniestroId) {
  const [{ data: s, error }, lesionados] = await Promise.all([
    supabase.from("siniestros").select(SEL_INVENTARIO).eq("id", siniestroId).single(),
    fetchLesionados(siniestroId),
  ]);
  if (error) throw error;

  const { asegurado, terceros } = armarParticipantes(s);
  const porId = Object.fromEntries([asegurado, ...terceros].map((x) => [x.id, x]));
  const grupoDe = (x) => ({ id: x.id, etiqueta: x.etiqueta, vehiculo: x.vehiculo });

  // Declaración — un solo documento con todos los participantes.
  const declaracion = [{
    key: "declaracion",
    tipo: "declaracion",
    refId: s.id,
    nombre: asegurado.responsable,
    detalle: terceros.length
      ? `Incluye al asegurado y ${terceros.length} tercero${terceros.length !== 1 ? "s" : ""}`
      : "Incluye al asegurado",
    folio: null,
    grupo: null,
  }];

  // Pase Taller — mismo criterio que SeccionCierre: existe si se le
  // asignó folio. Si es de "Tercero", el PDF usa al primer tercero
  // (ver fetchPaseTallerData), así que aquí también.
  const pasesTaller = [];
  if (s.pase_taller_numero) {
    const esTercero = s.pase_taller_definicion === "Tercero";
    const dueno = esTercero ? (terceros[0] ?? asegurado) : asegurado;
    const destino = s.pase_taller_destino === "Domicilio"
      ? "Reparación a domicilio"
      : s.pase_taller_taller_nombre ? `Taller: ${s.pase_taller_taller_nombre}` : "Taller";
    pasesTaller.push({
      key: `taller-${s.id}`,
      tipo: "taller",
      refId: s.id,
      nombre: dueno.responsable,
      detalle: [destino, fmtFecha(s.pase_taller_fecha_expedicion)].filter(Boolean).join(" · "),
      folio: s.pase_taller_numero,
      grupo: grupoDe(dueno),
    });
  }

  // Pase Médico — uno por lesionado con folio asignado; se agrupan por
  // el vehículo en el que iba (puede haber varios por vehículo).
  const pasesMedicos = lesionados
    .filter((l) => l.pase_medico_numero)
    .map((l, i) => {
      const part = porId[String(l.participante_id ?? "NA")] ?? asegurado;
      return {
        key: `medico-${l.id}`,
        tipo: "medico",
        refId: l.id,
        nombre: l.nombre || `Lesionado ${i + 1}`,
        detalle: [l.hospital_asignado, fmtFecha(l.pase_medico_fecha_expedicion)].filter(Boolean).join(" · ") || null,
        folio: l.pase_medico_numero,
        grupo: grupoDe(part),
      };
    });

  return { numeroSiniestro: s.numero_siniestro, declaracion, pasesTaller, pasesMedicos };
}
