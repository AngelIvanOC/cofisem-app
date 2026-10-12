// ============================================================
// Configuración de comisiones (ADMINISTRACION).
//
//  · Porcentajes: externas por "Tipo de vehículo" y GAMAN por producto
//    (nombre de la cobertura). Un cambio NO edita la fila: inserta una
//    nueva con su "vigente desde" — los vales ya pagados conservan el % con
//    el que se calcularon y los reportes viejos no cambian.
//  · Solicitudes de monto manual que mandan las encargadas desde
//    /comisiones: aprobar (el vale se captura con ese monto) o rechazar.
// ============================================================
import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import { Percent, Loader2, Check, X, History, Inbox, Pencil } from "lucide-react";
import Swal from "sweetalert2";
import { supabase } from "../../supabaseClient";
import { hoyISO } from "../../utils/fecha";
import { getState } from "../../auth.js";
import { TIPOS_VEHICULO } from "./comisionesCalculo";

const n = (v) => parseFloat(v) || 0;
const $ = (v) =>
  `$${n(v).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt = (d) =>
  d
    ? new Date(d.length > 10 ? d : d + "T00:00:00").toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";
const pctTxt = (p) =>
  p == null ? "—" : `${Number(p).toLocaleString("es-MX", { maximumFractionDigits: 3 })}%`;

export default function ConfiguracionComisiones() {
  const [tab, setTab] = useState("REGLAS");
  const [pendientes, setPendientes] = useState(0);

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#1447e6] flex items-center gap-2">
            <Percent className="w-6 h-6" />
            Configuración de comisiones
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Porcentaje de comisión por tipo de póliza y solicitudes de monto manual.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-gray-100 shadow-sm">
          {[
            { k: "REGLAS", label: "Porcentajes" },
            { k: "SOLICITUDES", label: "Solicitudes" },
          ].map((t) => (
            <button
              key={t.k}
              type="button"
              onClick={() => setTab(t.k)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                tab === t.k ? "bg-[#1447e6] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
              {t.k === "SOLICITUDES" && pendientes > 0 && (
                <span
                  className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    tab === t.k ? "bg-white/20" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {pendientes}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {tab === "REGLAS" ? <Reglas /> : null}
      {/* Montado siempre para que el contador de pendientes esté al día. */}
      <div className={tab === "SOLICITUDES" ? "" : "hidden"}>
        <Solicitudes onPendientes={setPendientes} />
      </div>
    </div>
  );
}

// ── Porcentajes ───────────────────────────────────────────────────────────
function Reglas() {
  const [reglas, setReglas] = useState([]);
  const [coberturas, setCoberturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editando, setEditando] = useState(null); // { ambito, clave, actual }
  const [historial, setHistorial] = useState(null); // clave abierta

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [r, c] = await Promise.all([
        supabase
          .from("comision_reglas")
          .select("id, ambito, clave, porcentaje, vigente_desde, nota, created_at")
          .order("vigente_desde", { ascending: false })
          .order("id", { ascending: false }),
        supabase.from("coberturas").select("nombre, prima_total, activa").order("prima_total"),
      ]);
      if (r.error) throw r.error;
      if (c.error) throw c.error;
      setReglas(r.data ?? []);
      setCoberturas(c.data ?? []);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const hoy = hoyISO();
  const vigente = (ambito, clave) =>
    reglas.find((x) => x.ambito === ambito && x.clave === clave && x.vigente_desde <= hoy) ?? null;
  const programada = (ambito, clave) =>
    reglas.find((x) => x.ambito === ambito && x.clave === clave && x.vigente_desde > hoy) ?? null;
  const historialDe = (ambito, clave) =>
    reglas.filter((x) => x.ambito === ambito && x.clave === clave);

  // GAMAN: todas las coberturas (activas primero, una por nombre) + cualquier
  // regla de un nombre que ya no exista.
  const productosGaman = useMemo(() => {
    const porNombre = new Map();
    for (const c of coberturas) {
      const prev = porNombre.get(c.nombre);
      if (!prev || (c.activa && !prev.activa)) porNombre.set(c.nombre, c);
    }
    for (const r of reglas) {
      if (r.ambito === "GAMAN" && !porNombre.has(r.clave))
        porNombre.set(r.clave, { nombre: r.clave, prima_total: null, activa: false });
    }
    // Primero las que ya tienen %, luego las activas sin %, al final las
    // que ya no existen; dentro de cada grupo por precio.
    const dia = hoyISO();
    const tienePct = (nombre) =>
      reglas.find((x) => x.ambito === "GAMAN" && x.clave === nombre && x.vigente_desde <= dia)
        ?.porcentaje != null;
    return [...porNombre.values()].sort(
      (a, b) =>
        tienePct(b.nombre) - tienePct(a.nombre) ||
        b.activa - a.activa ||
        n(a.prima_total) - n(b.prima_total),
    );
  }, [coberturas, reglas]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
      </div>
    );

  // Fila: nombre · % (con "desde" solo si hubo un cambio) · lápiz. Toda la
  // fila es clicable para editar; el historial se despliega debajo.
  const renderFila = ({ ambito, clave, detalle, inactiva }) => {
    const v = vigente(ambito, clave);
    const prog = programada(ambito, clave);
    const hist = historialDe(ambito, clave);
    const abierta = historial === `${ambito}|${clave}`;
    const editar = () => setEditando({ ambito, clave, actual: v?.porcentaje ?? null });
    return (
      <Fragment key={`${ambito}|${clave}`}>
        <tr
          onClick={editar}
          className={`group cursor-pointer transition-colors ${inactiva ? "opacity-60" : ""} hover:bg-[#1447e6]/[0.03]`}
        >
          <td className="px-5 py-2.5">
            <p className="font-semibold text-gray-700 leading-snug">{clave}</p>
            {detalle && <p className="text-[11px] text-gray-400">{detalle}</p>}
          </td>
          <td className="px-3 py-2.5 text-right whitespace-nowrap">
            {v?.porcentaje != null ? (
              <span className="text-sm font-bold text-[#1447e6]">{pctTxt(v.porcentaje)}</span>
            ) : (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                Sin %
              </span>
            )}
            {v && v.vigente_desde > "2000-01-01" && (
              <p className="text-[10px] text-gray-400">desde {fmt(v.vigente_desde)}</p>
            )}
            {prog && (
              <p className="text-[10px] text-blue-600">
                {pctTxt(prog.porcentaje)} desde {fmt(prog.vigente_desde)}
              </p>
            )}
          </td>
          <td className="pr-4 py-2.5 w-16">
            <div className="flex items-center justify-end gap-1">
              {hist.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHistorial(abierta ? null : `${ambito}|${clave}`);
                  }}
                  title="Historial de cambios"
                  className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"
                >
                  <History className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 group-hover:text-[#1447e6]">
                <Pencil className="w-3.5 h-3.5" />
              </span>
            </div>
          </td>
        </tr>
        {abierta &&
          hist.map((h) => (
            <tr key={h.id} className="bg-gray-50/70 text-[11px] text-gray-500">
              <td className="px-5 py-1.5 pl-8">
                {h.vigente_desde <= "2000-01-01" ? "Valor inicial" : `Desde ${fmt(h.vigente_desde)}`}
                {h.nota && <span className="text-gray-400"> · {h.nota}</span>}
              </td>
              <td className="px-3 py-1.5 text-right">{pctTxt(h.porcentaje)}</td>
              <td />
            </tr>
          ))}
      </Fragment>
    );
  };

  const renderTabla = (titulo, descripcion, children) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <p className="text-sm font-bold text-[#13193a]">{titulo}</p>
        <p className="text-xs text-gray-400 mt-0.5">{descripcion}</p>
      </div>
      <table className="w-full text-xs">
        <tbody className="divide-y divide-gray-50">{children}</tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
        {renderTabla(
          "Aseguradoras externas",
          "Por tipo de vehículo de la póliza. Se calcula sobre la prima neta de cada pago.",
          TIPOS_VEHICULO.map((t) => renderFila({ ambito: "EXTERNA", clave: t })),
        )}
        {renderTabla(
          "GAMAN",
          "Por producto (cobertura). Se calcula sobre la prima neta de cada pago.",
          productosGaman.map((c) =>
            renderFila({
              ambito: "GAMAN",
              clave: c.nombre,
              detalle: c.prima_total != null ? $(c.prima_total) : "ya no existe",
              inactiva: !c.activa,
            }),
          ),
        )}
      </div>

      {editando && (
        <ModalRegla
          regla={editando}
          onClose={() => setEditando(null)}
          onGuardado={() => {
            setEditando(null);
            cargar();
          }}
        />
      )}
    </div>
  );
}

function ModalRegla({ regla, onClose, onGuardado }) {
  const [pct, setPct] = useState(regla.actual ?? "");
  // Un cambio solo puede aplicar de MAÑANA en adelante: nunca toca pólizas
  // ya creadas (también lo exige la BD).
  const [manana] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return hoyISO(d);
  });
  const [desde, setDesde] = useState(manana);
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  async function guardar() {
    const valor = pct === "" ? null : Number(pct);
    if (valor != null && (Number.isNaN(valor) || valor < 0 || valor > 100))
      return setError("El porcentaje debe estar entre 0 y 100.");
    if (!desde) return setError("Indica desde qué fecha aplica.");
    if (desde < manana) return setError("El cambio solo puede aplicar a partir de mañana.");
    setGuardando(true);
    setError(null);
    try {
      const { error: err } = await supabase.from("comision_reglas").insert({
        ambito: regla.ambito,
        clave: regla.clave,
        porcentaje: valor,
        vigente_desde: desde,
        nota: nota.trim() || null,
        creado_por: getState().usuario?.id ?? null,
      });
      if (err) throw err;
      onGuardado();
    } catch (e) {
      setError(
        e.code === "23505"
          ? "Ya hay un cambio registrado para esa misma fecha. Elige otra fecha."
          : e.message,
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-bold text-[#1447e6]">% de comisión</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {regla.ambito === "GAMAN" ? "GAMAN · " : "Tipo de vehículo · "}
            {regla.clave}
          </p>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                Porcentaje
              </span>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.001"
                  value={pct}
                  onChange={(e) => setPct(e.target.value)}
                  placeholder="Sin %"
                  autoFocus
                  className="w-full pl-3 pr-7 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </label>
            <label className="block">
              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                Aplica desde
              </span>
              <input
                type="date"
                min={manana}
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6]"
              />
            </label>
          </div>
          <p className="text-[11px] text-gray-400 -mt-2">
            Aplica a las pólizas que se registren desde esa fecha. Las ya creadas, aunque
            tengan pagos pendientes, conservan su % actual. Deja el % vacío para quitar la regla.
          </p>
          <label className="block">
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              Nota (opcional)
            </span>
            <input
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ej. acuerdo de octubre"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6]"
            />
          </label>
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="px-5 py-2.5 rounded-xl bg-[#1447e6] hover:bg-[#0f36b3] text-white text-sm font-bold disabled:opacity-50"
            >
              {guardando ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Solicitudes de monto manual ───────────────────────────────────────────
function Solicitudes({ onPendientes }) {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resolviendo, setResolviendo] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from("comision_solicitudes")
        .select(
          `id, num_cuota, monto, motivo, estatus, nota_resolucion, created_at, resuelto_at,
           solicitante:usuarios!comision_solicitudes_solicitado_por_fkey(nombre, apellido),
           polizas_cofisem(numero_poliza, aseguradora, vendedor_nombre, asegurado_nombre, oficinas(nombre))`,
        )
        .order("created_at", { ascending: false })
        .limit(100);
      if (err) throw err;
      setLista(data ?? []);
      onPendientes((data ?? []).filter((s) => s.estatus === "PENDIENTE").length);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [onPendientes]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function resolver(s, estatus) {
    let nota = null;
    if (estatus === "RECHAZADA") {
      const { value, isConfirmed } = await Swal.fire({
        title: "Rechazar solicitud",
        input: "text",
        inputLabel: "Motivo del rechazo (lo verá la encargada)",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Rechazar",
        cancelButtonText: "Cancelar",
      });
      if (!isConfirmed) return;
      nota = value?.trim() || null;
    } else {
      const { isConfirmed } = await Swal.fire({
        icon: "question",
        title: "Autorizar monto manual",
        html: `Se podrá capturar el vale del pago <b>${s.num_cuota}</b> de la póliza <b>${s.polizas_cofisem?.numero_poliza ?? "—"}</b> por <b>${$(s.monto)}</b>.`,
        showCancelButton: true,
        confirmButtonColor: "#13193a",
        confirmButtonText: "Autorizar",
        cancelButtonText: "Cancelar",
      });
      if (!isConfirmed) return;
    }
    setResolviendo(s.id);
    try {
      const { data, error: err } = await supabase
        .from("comision_solicitudes")
        .update({
          estatus,
          nota_resolucion: nota,
          resuelto_por: getState().usuario?.id ?? null,
          resuelto_at: new Date().toISOString(),
        })
        .eq("id", s.id)
        .eq("estatus", "PENDIENTE")
        .select("id");
      if (err) throw err;
      if (!data?.length) throw new Error("No se pudo actualizar (¿ya estaba resuelta o no tienes permiso?).");
      await cargar();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message, confirmButtonColor: "#13193a" });
    } finally {
      setResolviendo(null);
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
      </div>
    );

  const pendientes = lista.filter((s) => s.estatus === "PENDIENTE");
  const resueltas = lista.filter((s) => s.estatus !== "PENDIENTE");
  const nombre = (u) => [u?.nombre, u?.apellido].filter(Boolean).join(" ") || "—";

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-sm font-bold text-[#13193a]">Pendientes</p>
        </div>
        {pendientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-400">
            <Inbox className="w-7 h-7" />
            <span className="text-sm font-semibold">Sin solicitudes pendientes.</span>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pendientes.map((s) => (
              <div key={s.id} className="px-5 py-3.5 flex items-start justify-between gap-4">
                <div className="min-w-0 text-xs">
                  <p className="text-sm font-bold text-gray-800">
                    {$(s.monto)}
                    <span className="ml-2 font-mono text-[#1447e6]">{s.polizas_cofisem?.numero_poliza ?? "—"}</span>
                    <span className="ml-1 text-gray-400 font-normal">· pago {s.num_cuota}</span>
                  </p>
                  <p className="text-gray-500 mt-0.5">
                    {s.polizas_cofisem?.aseguradora} · Vendedor {s.polizas_cofisem?.vendedor_nombre || "—"} ·{" "}
                    {s.polizas_cofisem?.oficinas?.nombre ?? "—"}
                  </p>
                  <p className="text-gray-600 mt-1 italic">“{s.motivo}”</p>
                  <p className="text-gray-400 mt-0.5">
                    Solicitó {nombre(s.solicitante)} · {fmt(s.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={resolviendo === s.id}
                    onClick={() => resolver(s, "RECHAZADA")}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-500 hover:text-red-600 text-[11px] font-bold disabled:opacity-50"
                  >
                    <X className="w-3 h-3" /> Rechazar
                  </button>
                  <button
                    type="button"
                    disabled={resolviendo === s.id}
                    onClick={() => resolver(s, "APROBADA")}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1447e6] hover:bg-[#0f36b3] text-white text-[11px] font-bold disabled:opacity-50"
                  >
                    <Check className="w-3 h-3" /> Autorizar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {resueltas.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-[#13193a]">Resueltas recientemente</p>
          </div>
          <table className="w-full text-xs">
            <tbody className="divide-y divide-gray-50">
              {resueltas.map((s) => (
                <tr key={s.id}>
                  <td className="px-5 py-2 font-mono text-[#1447e6]">{s.polizas_cofisem?.numero_poliza ?? "—"}</td>
                  <td className="px-3 py-2 text-gray-500">pago {s.num_cuota}</td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-700">{$(s.monto)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.estatus === "APROBADA" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                      }`}
                    >
                      {s.estatus === "APROBADA" ? "Autorizada" : "Rechazada"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-400 max-w-[260px] truncate">{s.nota_resolucion || s.motivo}</td>
                  <td className="px-5 py-2 text-gray-400 text-right">{fmt(s.resuelto_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
