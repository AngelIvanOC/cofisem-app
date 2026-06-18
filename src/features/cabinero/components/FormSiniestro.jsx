import { useState, useRef, useEffect } from "react";
import { INP, INP_RO, LBL } from "../constants/estilos";
import { CAUSAS, CIRCUNSTANCIAS } from "../constants/catalogos";
import { fetchAjustadores } from "../../../services/siniestros";
import Seccion from "./Seccion";
import DatoCard from "./DatoCard";
import SeccionConductorNA from "./SeccionConductorNA";
import SeccionLocalizacion from "./SeccionLocalizacion";
import { Check, CheckCircle2, ChevronLeft, Loader2 } from "lucide-react";

function generarFolio() {
  const n   = new Date();
  const yy  = String(n.getFullYear()).slice(-2);
  const mm  = String(n.getMonth() + 1).padStart(2, "0");
  const dd  = String(n.getDate()).padStart(2, "0");
  const rnd = String(Math.floor(100 + Math.random() * 900));
  return `${yy}${mm}${dd}${rnd}`;
}

export default function FormSiniestro({ poliza, onBack, onSubmit, loading }) {
  const nroReporteRef = useRef(generarFolio());
  const nroReporte    = nroReporteRef.current;

  const fechaHoy = new Date().toLocaleDateString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
  const horaActual = new Date().toLocaleTimeString("es-MX", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

  const [siniestro, setSiniestro] = useState({
    causa: "", circunstancia: "", detalles: "", ajustador: "", ajustadorId: null,
  });
  const setS = (k, v) => setSiniestro((s) => ({ ...s, [k]: v }));

  const [ajustadores,         setAjustadores]         = useState([]);
  const [ajustadoresCargando, setAjustadoresCargando] = useState(true);
  useEffect(() => {
    fetchAjustadores()
      .then(setAjustadores)
      .catch(() => {})
      .finally(() => setAjustadoresCargando(false));
  }, []);

  const [conductorNA, setConductorNA] = useState({
    nombre: "", telefono: "", esTercero: false,
    contactoExtraNombre: "", contactoExtraTelefono: "",
  });

  const [localizacion, setLocalizacion] = useState({
    estado: "", municipio: "", cp: "", colonia: "", calle: "", numero: "", referencia: "",
  });

  return (
    <div className="space-y-4 pb-10">
      {/* Banner póliza confirmada */}
      <div className="bg-[#13193a] rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-emerald-400 text-[11px] font-bold uppercase tracking-widest">Póliza confirmada</p>
            <p className="text-white font-bold font-mono text-sm mt-0.5">{poliza.numero}</p>
            <p className="text-white/50 text-xs mt-0.5 max-w-xs truncate">{poliza.titular}</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="text-white/35 text-[11px]">Nro. Reporte</p>
            <p className="text-white font-bold font-mono text-xl leading-none mt-0.5">{nroReporte}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-white/35 text-[11px]">Fecha y Hora</p>
            <p className="text-white/70 text-xs mt-0.5">{fechaHoy} · {horaActual}</p>
          </div>
          <button
            onClick={onBack}
            className="text-white/35 hover:text-white text-xs underline underline-offset-2 transition-colors shrink-0"
          >
            Cambiar
          </button>
        </div>
      </div>

      {/* Titular */}
      <Seccion titulo="Titular — Certificado">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LBL}>Certificado / Póliza</label>
            <input readOnly value={poliza.numero} className={INP_RO} />
          </div>
          <div>
            <label className={LBL}>Titular</label>
            <input readOnly value={poliza.titular} className={INP_RO} />
          </div>
        </div>
      </Seccion>

      {/* Vehículo asegurado */}
      <Seccion titulo="Vehículo Asegurado">
        <div className="space-y-3">
          <p className="text-sm font-bold text-[#13193a]">{poliza.vehiculo.descripcion}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {[
              { k: "Modelo",    v: poliza.vehiculo.modelo    },
              { k: "Placas",    v: poliza.vehiculo.placas    },
              { k: "Serie",     v: poliza.vehiculo.serie     },
              { k: "Motor",     v: poliza.vehiculo.motor     },
              { k: "Capacidad", v: poliza.vehiculo.capacidad },
            ].map((c) => (
              <DatoCard key={c.k} label={c.k} value={c.v} />
            ))}
          </div>
        </div>
      </Seccion>

      {/* Conductor del asegurado */}
      <SeccionConductorNA data={conductorNA} onChange={setConductorNA} />

      {/* Información del siniestro */}
      <Seccion titulo="Información del Siniestro">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LBL}>Causa</label>
              <select value={siniestro.causa} onChange={(e) => setS("causa", e.target.value)} className={INP}>
                <option value="">Selecciona una causa</option>
                {CAUSAS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={LBL}>Circunstancia</label>
              <select value={siniestro.circunstancia} onChange={(e) => setS("circunstancia", e.target.value)} className={INP}>
                <option value="">Selecciona una circunstancia</option>
                {CIRCUNSTANCIAS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={LBL}>Descripción del siniestro</label>
            <textarea
              value={siniestro.detalles}
              onChange={(e) => setS("detalles", e.target.value)}
              rows={3}
              placeholder="Describe lo que ocurrió con el mayor detalle posible..."
              className={INP + " resize-none"}
            />
          </div>
        </div>
      </Seccion>

      {/* Localización */}
      <SeccionLocalizacion data={localizacion} onChange={setLocalizacion} />

      {/* Ajustador */}
      <Seccion titulo="Ajustador Asignado">
        <div className="max-w-xs">
          <label className={LBL}>Selecciona el ajustador</label>
          <select
            value={siniestro.ajustadorId ?? ""}
            onChange={(e) => {
              const aj = ajustadores.find((a) => a.id === e.target.value);
              setSiniestro((s) => ({
                ...s,
                ajustadorId: aj?.id   ?? null,
                ajustador:   aj?.nombre ?? "",
              }));
            }}
            disabled={ajustadoresCargando}
            className={INP}
          >
            <option value="">{ajustadoresCargando ? "Cargando..." : "Selecciona un ajustador"}</option>
            {ajustadores.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
        </div>
      </Seccion>

      {/* Acciones */}
      <p className="text-xs text-gray-400"><span className="text-red-400 font-bold">*</span> Campos obligatorios</p>
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Regresar
        </button>
        <button
          type="button"
          onClick={() => onSubmit({ ...siniestro, nroReporte, conductorNA, localizacion })}
          disabled={loading}
          className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all disabled:opacity-60 shadow-lg shadow-[#13193a]/15"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin w-4 h-4" />
              Generando reporte...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Generar Reporte
            </>
          )}
        </button>
      </div>
    </div>
  );
}
