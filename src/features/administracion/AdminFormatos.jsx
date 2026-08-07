// ============================================================
// src/features/administracion/AdminFormatos.jsx
// Generador independiente de Pase Taller / Pase Médico para
// ADMINISTRACION — a diferencia del paso "Documentos"/"Lesionados"
// del ajustador (que arma estos PDFs a partir de un siniestro ya
// capturado en BD), aquí se piden a mano solo los datos que el PDF
// necesita para dibujarse (mismo componente PaseTallerPDF/PaseMedicoPDF
// que usa el ajustador) y se descarga directo, sin crear ni tocar
// ningún siniestro. El mapa de daños usa el mismo componente
// DanosMarcadores que el ajustador (mismas fotos, mismos puntos
// arrastrables) pero guarda los marcadores solo en memoria del
// formulario, no en BD. No incluye firmas digitalizadas (esas solo
// existen dentro del flujo del ajustador) — el pase sale en blanco en
// esa zona para firmarse a mano si hace falta.
//
// La vista previa NO se genera sola mientras se escribe: el Pase
// Taller incrusta 10 imágenes de referencia (~2MB cada una, el mapa de
// daños en blanco) y @react-pdf/renderer recalcula todo el layout cada
// vez, así que mantenerla "en vivo" trababa el navegador con cada
// tecla. Se genera solo cuando el admin presiona "Ver vista previa".
// ============================================================
import { useState, useEffect, useMemo, useRef } from "react";
import Swal from "sweetalert2";
import { Ticket, Wrench, Stethoscope, Download, Loader2, RefreshCw, Eye } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import PaseTallerPDF from "../../components/pdf/PaseTallerPDF";
import PaseMedicoPDF from "../../components/pdf/PaseMedicoPDF";
import { fetchTalleres, fetchHospitales } from "../../services/servicios";
import { marcadoresPorLabel } from "../../services/pasePdf";
import { Campo, ToggleRow, Sep, REGIONES_CUERPO } from "../ajustador/shared";
import DanosMarcadores from "../ajustador/danos/DanosMarcadores";

const CAUSAS_LESION = ["Atropello", "Colisión"];
const ESTADOS_LESIONADO = ["Conciente", "Inconciente"];
const TIPOS_LESION = ["Contusión", "Herida"];
const MOTIVOS_TRASLADO = ["Incapacidad para Deambular", "Inconciencia"];

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}
function fmtFechaDMA(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── Panel de vista previa bajo demanda ──────────────────────────
// No usa <PDFViewer> (que regenera el PDF solo con que su prop
// `children` cambie de referencia — pasaba en cada tecla aunque el
// contenido fuera el mismo). Aquí se genera el blob una sola vez, al
// presionar el botón, con pdf(...).toBlob() — igual que el botón de
// descarga — y se muestra en un <iframe> normal; escribir en el
// formulario ya no dispara ningún trabajo de PDF.
function PanelVistaPrevia({ generarBlob }) {
  const [url, setUrl] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const urlRef = useRef(null);

  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  const handleGenerar = async () => {
    setCargando(true);
    setError(null);
    try {
      const blob = await generarBlob();
      const nuevaUrl = URL.createObjectURL(blob);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = nuevaUrl;
      setUrl(nuevaUrl);
    } catch (e) {
      setError(e.message ?? "No se pudo generar la vista previa");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {url && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 shrink-0">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Vista previa</span>
          <button
            type="button"
            onClick={handleGenerar}
            disabled={cargando}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-[#13193a] hover:bg-gray-50 transition-all disabled:opacity-60"
          >
            {cargando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Actualizar
          </button>
        </div>
      )}
      <div className="flex-1 min-h-0">
        {url ? (
          <iframe src={url} title="Vista previa del pase" className="w-full h-full border-0" />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-8">
            <Eye className="w-8 h-8 text-gray-300" />
            <p className="text-sm text-gray-400 max-w-xs">Completa lo que necesites y ábrela cuando quieras revisarla.</p>
            <button
              type="button"
              onClick={handleGenerar}
              disabled={cargando}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#13193a] text-white text-sm font-bold hover:bg-[#1e2a50] transition-all disabled:opacity-60 disabled:cursor-wait"
            >
              {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              {cargando ? "Generando..." : "Ver vista previa"}
            </button>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

async function descargarPDF(Documento, data, fileName) {
  const blob = await pdf(<Documento data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Botón "Descargar PDF" ───────────────────────────────────────
function BotonDescargar({ onDescargar, label }) {
  const [cargando, setCargando] = useState(false);
  return (
    <button
      type="button"
      disabled={cargando}
      onClick={async () => {
        setCargando(true);
        try {
          await onDescargar();
        } catch (e) {
          Swal.fire({ icon: "error", title: "No se pudo generar el PDF", text: e.message, confirmButtonColor: "#13193a" });
        } finally {
          setCargando(false);
        }
      }}
      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#13193a] text-white text-sm font-bold hover:bg-[#1e2a50] transition-all disabled:opacity-60 disabled:cursor-wait shrink-0"
    >
      {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {cargando ? "Generando..." : label}
    </button>
  );
}

// ── Layout de dos paneles: formulario a la izquierda, PDF a la
// derecha — en pantallas angostas se apilan (el PDF queda con una
// altura fija razonable para no forzar scroll infinito). ──────────
function PanelDivido({ form, preview }) {
  return (
    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="overflow-y-auto pr-1 space-y-4 lg:max-h-[calc(100vh-230px)]">{form}</div>
      <div className="rounded-2xl border border-gray-200 overflow-hidden bg-gray-100 h-[70vh] lg:h-auto lg:max-h-[calc(100vh-230px)]">
        {preview}
      </div>
    </div>
  );
}

// ================================================================
// PASE TALLER
// ================================================================
const TALLER_INICIAL = {
  numeroSiniestro: "", placas: "",
  tipoInteresado: "asegurado",
  polizaNumero: "", polizaFecha: "",
  interesadoNombre: "", interesadoTelefono: "",
  deducible: "No",
  ajustadorNombre: "", ajustadorTelefono: "",
  clave: "", numeroPase: "",
  vehiculoMarca: "", vehiculoSubmarca: "", vehiculoTipo: "", vehiculoModelo: "", vehiculoPuertas: "", vehiculoColor: "",
  destino: "Taller",
  tallerIdx: "", tallerNombre: "", tallerCalle: "", tallerColonia: "", tallerTelefono: "",
  danosSiniestro: {}, danosPreexistente: {},
  ordenCondicionada: "",
  municipio: "", fechaExpedicion: hoyISO(),
};

function buildTallerData(f) {
  return {
    numeroSiniestro: f.numeroSiniestro,
    placas: f.placas,
    tipoInteresado: f.tipoInteresado,
    poliza: { numero: f.polizaNumero, fecha: f.polizaFecha },
    interesado: { nombre: f.interesadoNombre },
    deducible: f.deducible,
    ajustador: { nombre: f.ajustadorNombre },
    clave: f.clave,
    numeroPase: f.numeroPase,
    vehiculo: {
      marca: f.vehiculoMarca, submarca: f.vehiculoSubmarca, tipo: f.vehiculoTipo,
      modelo: f.vehiculoModelo, puertas: f.vehiculoPuertas, color: f.vehiculoColor,
    },
    destino: f.destino === "Domicilio" ? "domicilio" : "taller",
    taller: { nombre: f.tallerNombre, calle: f.tallerCalle, colonia: f.tallerColonia, telefono: f.tallerTelefono },
    ordenCondicionada: f.ordenCondicionada,
    lugarFecha: [f.municipio, fmtFechaDMA(f.fechaExpedicion)].filter(Boolean).join(", "),
    danosSiniestroMarcadores: marcadoresPorLabel(f.danosSiniestro),
    danosPreexistentesMarcadores: marcadoresPorLabel(f.danosPreexistente),
    ajustadorFirma: { nombre: f.ajustadorNombre, telefono: f.ajustadorTelefono },
    interesadoFirma: { nombre: f.interesadoNombre, telefono: f.interesadoTelefono },
  };
}

function GeneradorPaseTaller() {
  const [f, setF] = useState(TALLER_INICIAL);
  const set = (patch) => setF((v) => ({ ...v, ...patch }));
  const [talleres, setTalleres] = useState([]);

  useEffect(() => { fetchTalleres().then(setTalleres).catch(() => {}); }, []);

  const data = useMemo(() => buildTallerData(f), [f]);
  const manual = f.tallerIdx === "manual";

  const handleTallerSelect = (val) => {
    if (val !== "manual" && val !== "") {
      const t = talleres.find((x) => String(x.id) === val);
      if (t) set({ tallerIdx: val, tallerNombre: t.nombre, tallerTelefono: t.telefono, tallerCalle: t.calle, tallerColonia: t.colonia });
    } else if (val === "manual") {
      set({ tallerIdx: val, tallerNombre: "", tallerTelefono: "", tallerCalle: "", tallerColonia: "" });
    } else {
      set({ tallerIdx: val });
    }
  };

  const form = (
    <>
      <Sep label="Siniestro y póliza" />
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Número de siniestro" placeholder="SRC-2026..." value={f.numeroSiniestro} onChange={(v) => set({ numeroSiniestro: v })} />
        <Campo label="Placas" placeholder="MOR-123-A" value={f.placas} onChange={(v) => set({ placas: v })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Número de póliza" value={f.polizaNumero} onChange={(v) => set({ polizaNumero: v })} />
        <Campo label="Fecha de póliza" type="date" value={f.polizaFecha} onChange={(v) => set({ polizaFecha: v })} />
      </div>

      <Sep label="Interesado" />
      <ToggleRow label="Tipo de interesado" options={["Asegurado", "Tercero"]} current={f.tipoInteresado === "asegurado" ? "Asegurado" : "Tercero"} onPick={(v) => set({ tipoInteresado: v === "Asegurado" ? "asegurado" : "tercero" })} />
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Nombre del interesado" value={f.interesadoNombre} onChange={(v) => set({ interesadoNombre: v })} />
        <Campo label="Teléfono" type="tel" value={f.interesadoTelefono} onChange={(v) => set({ interesadoTelefono: v })} />
      </div>

      <Sep label="Ajustador / deducible" />
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Nombre del ajustador" value={f.ajustadorNombre} onChange={(v) => set({ ajustadorNombre: v })} />
        <Campo label="Teléfono" type="tel" value={f.ajustadorTelefono} onChange={(v) => set({ ajustadorTelefono: v })} />
      </div>
      <ToggleRow label="¿Aplica deducible?" options={["Sí", "No"]} current={f.deducible} onPick={(v) => set({ deducible: v })} />

      <Sep label="Datos del pase" />
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Número de pase" placeholder="Ej. OT00123" value={f.numeroPase} onChange={(v) => set({ numeroPase: v })} />
        <Campo label="Clave" placeholder="000" value={f.clave} onChange={(v) => set({ clave: v })} />
      </div>

      <Sep label="Vehículo" />
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Marca" value={f.vehiculoMarca} onChange={(v) => set({ vehiculoMarca: v })} />
        <Campo label="Submarca" value={f.vehiculoSubmarca} onChange={(v) => set({ vehiculoSubmarca: v })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Tipo (carrocería)" placeholder="Sedán, Pickup..." value={f.vehiculoTipo} onChange={(v) => set({ vehiculoTipo: v })} />
        <Campo label="Modelo (año)" value={f.vehiculoModelo} onChange={(v) => set({ vehiculoModelo: v })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Puertas" value={f.vehiculoPuertas} onChange={(v) => set({ vehiculoPuertas: v })} />
        <Campo label="Color" value={f.vehiculoColor} onChange={(v) => set({ vehiculoColor: v })} />
      </div>

      <Sep label="Destino y taller" />
      <ToggleRow label="Destino del vehículo" options={["Taller", "Domicilio"]} current={f.destino} onPick={(v) => set({ destino: v })} />
      {f.destino === "Taller" && (
        <>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Taller asignado</label>
            <select value={f.tallerIdx} onChange={(e) => handleTallerSelect(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all">
              <option value="">Selecciona un taller...</option>
              {talleres.map((t) => <option key={t.id} value={String(t.id)}>{t.nombre}</option>)}
              <option value="manual">Otro taller (capturar manualmente)</option>
            </select>
          </div>
          {manual && (
            <div className="space-y-3 bg-gray-50 rounded-xl p-3">
              <Campo label="Nombre del taller" value={f.tallerNombre} onChange={(v) => set({ tallerNombre: v })} />
              <Campo label="Teléfono" type="tel" value={f.tallerTelefono} onChange={(v) => set({ tallerTelefono: v })} />
              <Campo label="Calle, No. Exterior e interior" value={f.tallerCalle} onChange={(v) => set({ tallerCalle: v })} />
              <Campo label="Colonia" value={f.tallerColonia} onChange={(v) => set({ tallerColonia: v })} />
            </div>
          )}
        </>
      )}

      <Sep label="Mapa de daños" />
      <div className="space-y-3">
        <DanosMarcadores titulo="Daños del Siniestro" value={f.danosSiniestro} onChange={(v) => set({ danosSiniestro: v })} />
        <DanosMarcadores titulo="Daños Preexistentes" value={f.danosPreexistente} onChange={(v) => set({ danosPreexistente: v })} soloNota />
      </div>

      <Sep label="Orden y expedición" />
      <Campo label="Orden condicionada a" rows={3} placeholder="Ej. Pago en efectivo de $... en..." value={f.ordenCondicionada} onChange={(v) => set({ ordenCondicionada: v })} />
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Municipio / lugar" value={f.municipio} onChange={(v) => set({ municipio: v })} />
        <Campo label="Fecha de expedición" type="date" value={f.fechaExpedicion} onChange={(v) => set({ fechaExpedicion: v })} />
      </div>

      <div className="pt-2">
        <BotonDescargar
          label="Descargar Pase Taller (PDF)"
          onDescargar={() => descargarPDF(PaseTallerPDF, data, `pase-taller-${f.numeroSiniestro || "formato"}.pdf`)}
        />
      </div>
    </>
  );

  return <PanelDivido form={form} preview={<PanelVistaPrevia generarBlob={() => pdf(<PaseTallerPDF data={data} />).toBlob()} />} />;
}

// ================================================================
// PASE MÉDICO
// ================================================================
const MEDICO_INICIAL = {
  numeroSiniestro: "", numeroPase: "",
  fechaExpedicion: hoyISO(), fechaPercance: "",
  aseguradoNombre: "",
  polizaNumero: "", polizaVigencia: "", polizaRiesgo: "",
  lesionadoNombre: "", lesionadoDomicilio: "", lesionadoTelefono: "",
  causaLesion: "", estadoLesionado: "", tipoLesion: "", regionCuerpo: [],
  primerosAuxilios: null, motivoTraslado: "",
  hospitalIdx: "", hospitalNombre: "", hospitalTelefono: "", hospitalDomicilio: "",
  ajustadorNombre: "", ajustadorTelefono: "", ajustadorDomicilio: "",
};

function buildMedicoData(f) {
  return {
    numeroSiniestro: f.numeroSiniestro,
    numeroPase: f.numeroPase,
    fechaExpedicion: f.fechaExpedicion,
    fechaPercance: f.fechaPercance,
    asegurado: { nombre: f.aseguradoNombre },
    poliza: { numero: f.polizaNumero, vigencia: f.polizaVigencia, riesgo: f.polizaRiesgo },
    lesionado: {
      nombre: f.lesionadoNombre, domicilio: f.lesionadoDomicilio, telefono: f.lesionadoTelefono,
      causaLesion: f.causaLesion, estadoLesionado: f.estadoLesionado, tipoLesion: f.tipoLesion,
      regionCuerpo: f.regionCuerpo, primerosAuxilios: f.primerosAuxilios, motivoTraslado: f.motivoTraslado,
    },
    medico: { nombre: f.hospitalNombre, telefono: f.hospitalTelefono, domicilio: f.hospitalDomicilio },
    ajustador: { nombre: f.ajustadorNombre, telefono: f.ajustadorTelefono, domicilio: f.ajustadorDomicilio },
  };
}

function GeneradorPaseMedico() {
  const [f, setF] = useState(MEDICO_INICIAL);
  const set = (patch) => setF((v) => ({ ...v, ...patch }));
  const [hospitales, setHospitales] = useState([]);

  useEffect(() => { fetchHospitales().then(setHospitales).catch(() => {}); }, []);

  const data = useMemo(() => buildMedicoData(f), [f]);
  const manualHospital = f.hospitalIdx === "manual";

  const toggleRegion = (zona) => {
    const activa = f.regionCuerpo.includes(zona);
    set({ regionCuerpo: activa ? f.regionCuerpo.filter((z) => z !== zona) : [...f.regionCuerpo, zona] });
  };

  const handleHospitalSelect = (val) => {
    if (val !== "manual" && val !== "") {
      const h = hospitales.find((x) => String(x.id) === val);
      set({ hospitalIdx: val, hospitalNombre: h?.nombre || "", hospitalTelefono: h?.telefono || "", hospitalDomicilio: h?.domicilio || "" });
    } else if (val === "manual") {
      set({ hospitalIdx: val, hospitalNombre: "", hospitalTelefono: "", hospitalDomicilio: "" });
    } else {
      set({ hospitalIdx: val });
    }
  };

  const form = (
    <>
      <Sep label="Siniestro y póliza" />
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Número de siniestro" value={f.numeroSiniestro} onChange={(v) => set({ numeroSiniestro: v })} />
        <Campo label="Número de pase" placeholder="Ej. OAAM001" value={f.numeroPase} onChange={(v) => set({ numeroPase: v })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Fecha de expedición" type="date" value={f.fechaExpedicion} onChange={(v) => set({ fechaExpedicion: v })} />
        <Campo label="Fecha del percance" type="date" value={f.fechaPercance} onChange={(v) => set({ fechaPercance: v })} />
      </div>
      <Campo label="Nombre del asegurado" value={f.aseguradoNombre} onChange={(v) => set({ aseguradoNombre: v })} />
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Número de póliza" value={f.polizaNumero} onChange={(v) => set({ polizaNumero: v })} />
        <Campo label="Vigencia" type="date" value={f.polizaVigencia} onChange={(v) => set({ polizaVigencia: v })} />
      </div>
      <Campo label="Riesgo / cobertura" value={f.polizaRiesgo} onChange={(v) => set({ polizaRiesgo: v })} />

      <Sep label="Lesionado" />
      <Campo label="Nombre del lesionado" value={f.lesionadoNombre} onChange={(v) => set({ lesionadoNombre: v })} />
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Domicilio" value={f.lesionadoDomicilio} onChange={(v) => set({ lesionadoDomicilio: v })} />
        <Campo label="Teléfono" type="tel" value={f.lesionadoTelefono} onChange={(v) => set({ lesionadoTelefono: v })} />
      </div>

      <Sep label="Datos de la lesión" />
      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Región del cuerpo afectada</label>
        <div className="flex gap-2 flex-wrap">
          {REGIONES_CUERPO.map((zona) => (
            <button key={zona} type="button" onClick={() => toggleRegion(zona)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${f.regionCuerpo.includes(zona) ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200"}`}>
              {zona}
            </button>
          ))}
        </div>
      </div>
      <ToggleRow label="Causa de la lesión" options={CAUSAS_LESION} current={f.causaLesion} onPick={(v) => set({ causaLesion: v })} />
      <ToggleRow label="Estado del lesionado" options={ESTADOS_LESIONADO} current={f.estadoLesionado} onPick={(v) => set({ estadoLesionado: v })} />
      <ToggleRow label="Tipo de lesión" options={TIPOS_LESION} current={f.tipoLesion} onPick={(v) => set({ tipoLesion: v })} />
      <ToggleRow
        label="¿Recibió atención de primeros auxilios?"
        options={["Sí", "No"]}
        current={f.primerosAuxilios === true ? "Sí" : f.primerosAuxilios === false ? "No" : null}
        onPick={(v) => set({ primerosAuxilios: v === "Sí" })}
      />
      <ToggleRow
        label="Motivo de traslado en ambulancia"
        options={MOTIVOS_TRASLADO}
        current={f.motivoTraslado}
        onPick={(v) => set({ motivoTraslado: v === f.motivoTraslado ? "" : v })}
      />

      <Sep label="Hospital / clínica asignada" />
      <select value={f.hospitalIdx} onChange={(e) => handleHospitalSelect(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all">
        <option value="">Selecciona...</option>
        {hospitales.map((h) => <option key={h.id} value={String(h.id)}>{h.nombre}</option>)}
        <option value="manual">Otro (capturar manualmente)</option>
      </select>
      {manualHospital && (
        <div className="space-y-3 bg-gray-50 rounded-xl p-3">
          <Campo label="Nombre del hospital/clínica" value={f.hospitalNombre} onChange={(v) => set({ hospitalNombre: v })} />
          <Campo label="Teléfono" type="tel" value={f.hospitalTelefono} onChange={(v) => set({ hospitalTelefono: v })} />
          <Campo label="Domicilio" value={f.hospitalDomicilio} onChange={(v) => set({ hospitalDomicilio: v })} />
        </div>
      )}

      <Sep label="Ajustador" />
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Nombre" value={f.ajustadorNombre} onChange={(v) => set({ ajustadorNombre: v })} />
        <Campo label="Teléfono" type="tel" value={f.ajustadorTelefono} onChange={(v) => set({ ajustadorTelefono: v })} />
      </div>
      <Campo label="Domicilio de la oficina" value={f.ajustadorDomicilio} onChange={(v) => set({ ajustadorDomicilio: v })} />

      <div className="pt-2">
        <BotonDescargar
          label="Descargar Pase Médico (PDF)"
          onDescargar={() => descargarPDF(PaseMedicoPDF, data, `pase-medico-${f.numeroSiniestro || "formato"}.pdf`)}
        />
      </div>
    </>
  );

  return <PanelDivido form={form} preview={<PanelVistaPrevia generarBlob={() => pdf(<PaseMedicoPDF data={data} />).toBlob()} />} />;
}

// ================================================================
// PÁGINA — selector de formato + panel activo
// ================================================================
export default function AdminFormatos() {
  const [tipo, setTipo] = useState("taller");

  return (
    <div className="p-6 h-full flex flex-col gap-5 bg-gray-50">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-[#13193a]/8 flex items-center justify-center shrink-0">
          <Ticket className="w-5 h-5 text-[#13193a]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Formatos y pases</h1>
          <p className="text-gray-400 text-sm mt-0.5">Genera un Pase de Taller o un Pase Médico llenando solo los datos necesarios.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 flex gap-1.5 w-fit">
        <button
          onClick={() => setTipo("taller")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tipo === "taller" ? "bg-[#13193a] text-white" : "text-gray-500 hover:bg-gray-50"}`}
        >
          <Wrench className="w-4 h-4" /> Pase de Taller
        </button>
        <button
          onClick={() => setTipo("medico")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tipo === "medico" ? "bg-[#13193a] text-white" : "text-gray-500 hover:bg-gray-50"}`}
        >
          <Stethoscope className="w-4 h-4" /> Pase Médico
        </button>
      </div>

      {tipo === "taller" ? <GeneradorPaseTaller /> : <GeneradorPaseMedico />}
    </div>
  );
}
