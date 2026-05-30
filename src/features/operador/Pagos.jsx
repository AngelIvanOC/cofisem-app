import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../supabaseClient";
import { fetchTodasVersionesConfig, configParaFecha } from "../../services/configuracion";
// generarCuotasPoliza ya no se llama aquí — los pagos se insertan por migración
import { usePagination } from "../../hooks/usePagination";
import Paginator from "../../components/Paginator";
import {
  Banknote, Check, Clock, Eye, Loader2, Lock, Receipt, Search, X,
} from "lucide-react";


function isoAMX(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

function isoAMXCorto(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y.slice(-2)}`;
}

function calcularImportesRecibo(poliza, cuota) {
  if (poliza.formaPago === 'CONTADO') {
    return {
      primaNeta:        poliza.primaNeta,
      gastosExpedicion: poliza.derechos,
      iva:              poliza.iva,
      total:            poliza.primaTotal,
      importe:          cuota.monto,
    };
  }
  if (cuota.num === 1) {
    const total = cuota.monto + poliza.derechos + poliza.iva;
    return { primaNeta: cuota.monto, gastosExpedicion: poliza.derechos, iva: poliza.iva, total, importe: total };
  }
  return { primaNeta: cuota.monto, gastosExpedicion: 0, iva: 0, total: cuota.monto, importe: cuota.monto };
}

function abrirRecibo(poliza, cuota, operador) {
  const hoy = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const importes = calcularImportesRecibo(poliza, cuota);
  const cl = poliza.clienteData ?? {};
  const datos = {
    constancia: poliza.id, oficina: poliza.oficina, noRecibo: cuota.id,
    asegurado: poliza.asegurado,
    calle: cl.calle ?? cl.direccion ?? '', numExt: cl.numero_ext ?? '',
    numInt: cl.numero_int ?? '', colonia: cl.colonia ?? '',
    municipio: cl.ciudad ?? '', estado: cl.estado ?? '',
    cp: cl.cp ?? '', rfc: cl.rfc ?? '', curp: cl.curp ?? '',
    ...importes,
    vencimiento: isoAMXCorto(poliza.fechaFin),
    pagoDe: cuota.num, pagoTotal: poliza.formaPago === 'CONTADO' ? 1 : 4,
    formaPago: poliza.formaPago, fechaRecibo: hoy,
    vigenciaDesde: poliza.fechaInicio ? `${isoAMX(poliza.fechaInicio)} ${poliza.horaInicio}` : '',
    vigenciaHasta: poliza.fechaFin    ? `${isoAMXCorto(poliza.fechaFin)} ${poliza.horaFin}`  : '',
    conducto: poliza.conducto, operador: operador ?? '',
  };
  localStorage.setItem('recibo_data', JSON.stringify(datos));
  window.open('/gaman/recibo-preview', '_blank');
}

// Estatus efectivo de una cuota para display
function estatusEfectivo(cuota) {
  if (cuota.estatus === 'PAGADO') return 'PAGADO';
  if (cuota.estatus === 'ADEUDO') return 'ADEUDO';
  const vto = new Date(cuota.vto.split('/').reverse().join('-') + 'T12:00:00');
  if (vto < new Date()) return 'VENCIDO';
  return 'PENDIENTE';
}

function CuotaBadge({ cuota }) {
  const est = estatusEfectivo(cuota);
  const map = {
    PAGADO:   "bg-emerald-50 text-emerald-700 border-emerald-200",
    ADEUDO:   "bg-blue-50 text-blue-700 border-blue-200",
    VENCIDO:  "bg-red-50 text-red-600 border-red-200",
    PENDIENTE:"bg-amber-50 text-amber-700 border-amber-200",
  };
  const labels = { PAGADO: "Pagado", ADEUDO: "Adeudo", VENCIDO: "Vencida", PENDIENTE: "Pendiente" };
  return <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${map[est]}`}>{labels[est]}</span>;
}

// ── Modal confirmar pago (operador → ADEUDO) ──────────────────
function ModalAplicarPago({ poliza, cuota, onClose, onAplicar }) {
  const [fecha,     setFecha]    = useState(new Date().toISOString().split("T")[0]);
  const [monto,     setMonto]    = useState(cuota.monto.toFixed(2));
  const [aplicando, setAplicando]= useState(false);

  const handleAplicar = async () => {
    setAplicando(true);
    try {
      await onAplicar({ cuotaId: cuota.id, polizaId: poliza.polizaId, fecha, monto: parseFloat(monto) });
    } catch (e) {
      alert("Error al confirmar pago: " + e.message);
      setAplicando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter:"blur(8px)", backgroundColor:"rgba(10,15,40,0.55)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold text-[#13193a]">Recibir pago</h2>
            <p className="text-xs text-gray-400 mt-0.5">Cuota {cuota.num} · Póliza <span className="font-mono">{poliza.id}</span></p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Asegurado</span>
              <span className="font-semibold text-[#13193a]">{poliza.asegurado}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Cuota</span>
              <span className="font-semibold text-[#13193a]">{cuota.num} de {poliza.formaPago === 'CONTADO' ? 1 : 4}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Fecha límite</span>
              <span className="font-semibold text-amber-700">{cuota.vto}</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Monto recibido</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
              <input type="number" step="0.01" min="0" value={monto} onChange={e => setMonto(e.target.value)}
                className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]"/>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Fecha de recepción</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]"/>
          </div>

          <p className="text-[11px] text-gray-400 text-center">
            El pago quedará como <strong>ADEUDO</strong> hasta que el analista lo confirme.
          </p>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button onClick={handleAplicar} disabled={aplicando || !monto || !fecha}
            className="flex-1 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#13193a]/15">
            {aplicando
              ? <><Loader2 className="animate-spin w-4 h-4" />Confirmando...</>
              : <><Banknote className="w-4 h-4" />Recibir</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal historial de póliza ─────────────────────────────────
function ModalHistorial({ poliza, onClose, onAplicar, operador }) {
  const [cuotaSel, setCuotaSel] = useState(null);

  // Póliza bloqueada: VENCIDA o ANULADA — no se pueden registrar ni aplicar pagos
  const polizaBloq = ['VENCIDA', 'ANULADA'].includes(poliza.estatusPoliza);

  const totalCuotas = poliza.formaPago === 'CONTADO' ? 1 : 4;
  const pagadas    = poliza.cuotas.filter(c => c.estatus === 'PAGADO').length;
  const enAdeudo   = poliza.cuotas.filter(c => c.estatus === 'ADEUDO').length;
  const total      = poliza.cuotas.reduce((s, c) => s + c.monto, 0);
  const cobrado    = poliza.cuotas.filter(c => c.estatus === 'PAGADO').reduce((s, c) => s + c.monto, 0);
  const adeudoMonto= poliza.cuotas.filter(c => c.estatus === 'ADEUDO').reduce((s, c) => s + c.monto, 0);
  const porCobrar  = poliza.cuotas.filter(c => c.estatus === 'PENDIENTE').reduce((s, c) => s + c.monto, 0);

  const primerPendienteId = poliza.cuotas.find(c => c.estatus === 'PENDIENTE')?.id;

  // Si la emisión del primer pago tiene > 45 días, bloquear cobro
  const diasDesdeEmision = (() => {
    const primera = poliza.cuotas[0]?.vto; // DD/MM/YYYY (fecha emisión cuota 1)
    if (!primera) return 0;
    const [dd, mm, yyyy] = primera.split('/');
    const emision = new Date(`${yyyy}-${mm}-${dd}T12:00:00`);
    const hoy = new Date(); hoy.setHours(12, 0, 0, 0);
    return Math.floor((hoy - emision) / 86_400_000);
  })();
  const bloqueada = diasDesdeEmision > 45;

  const handleAplicar = async (data) => {
    await onAplicar(data);
    setCuotaSel(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backdropFilter:"blur(8px)", backgroundColor:"rgba(10,15,40,0.55)" }}
        onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <div>
              <h2 className="text-sm font-bold text-[#13193a]">Pagos y cuotas</h2>
              <p className="text-xs text-gray-400 mt-0.5">Póliza <span className="font-mono font-bold">{poliza.id}</span> · {poliza.asegurado}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label:"Forma de pago", value: poliza.formaPago,                mono: false },
                { label:"Cobrado",       value:`$${cobrado.toFixed(2)}`,          mono: true  },
                { label:"En adeudo",     value:`$${adeudoMonto.toFixed(2)}`,      mono: true  },
                { label:"Por cobrar",    value:`$${porCobrar.toFixed(2)}`,        mono: true  },
              ].map(f => (
                <div key={f.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{f.label}</p>
                  <p className={`text-sm font-bold ${f.mono ? "font-mono text-[#13193a]" : "text-[#13193a]"}`}>{f.value}</p>
                </div>
              ))}
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>{pagadas} de {totalCuotas} cuotas cobradas · {enAdeudo > 0 ? `${enAdeudo} en adeudo` : ''}</span>
                <span>{Math.round(((pagadas + enAdeudo) / totalCuotas) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500 transition-all" style={{ width:`${(pagadas / totalCuotas) * 100}%` }}/>
                <div className="h-full bg-blue-400 transition-all"    style={{ width:`${(enAdeudo / totalCuotas) * 100}%` }}/>
              </div>
            </div>

            {/* Aviso de póliza VENCIDA o ANULADA */}
            {polizaBloq && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 text-xs font-semibold">
                <Lock className="w-4 h-4 shrink-0" />
                Póliza {poliza.estatusPoliza} — no se pueden registrar pagos
              </div>
            )}

            {/* Aviso de bloqueo por 45 días */}
            {!polizaBloq && bloqueada && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 text-xs font-semibold">
                <Lock className="w-4 h-4 shrink-0" />
                Póliza con {diasDesdeEmision} días desde la primera emisión — cobro bloqueado (máx. 45 días)
              </div>
            )}

            <div className="space-y-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Cuotas</p>
              {poliza.cuotas.map(c => {
                const est           = estatusEfectivo(c);
                const mostrarRecibo = c.estatus === 'PAGADO' || c.estatus === 'ADEUDO' || c.id === primerPendienteId;
                const esPendiente   = c.estatus === 'PENDIENTE';
                // Sombrear fila si está bloqueada (por estatus o por 45 días) y aún no fue pagada
                const filaBloqueada = (polizaBloq || bloqueada) && esPendiente;
                return (
                  <div key={c.id}
                    className={["flex items-center justify-between gap-3 p-4 rounded-2xl border transition-all",
                      filaBloqueada                                    ? "bg-gray-50 border-gray-200 opacity-60" :
                      c.estatus === 'PAGADO'                           ? "bg-emerald-50/50 border-emerald-100"  :
                      c.estatus === 'ADEUDO'                           ? "bg-blue-50/50 border-blue-100"        :
                      est       === 'VENCIDO'                          ? "bg-red-50/50 border-red-100"          :
                                                                          "bg-white border-gray-200 hover:border-gray-300",
                    ].join(" ")}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={["w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                        filaBloqueada                                    ? "bg-gray-200 text-gray-400"    :
                        c.estatus === 'PAGADO'                           ? "bg-emerald-500 text-white"    :
                        c.estatus === 'ADEUDO'                           ? "bg-blue-500 text-white"       :
                        est       === 'VENCIDO'                          ? "bg-red-500 text-white"        :
                                                                            "bg-gray-100 text-gray-600",
                      ].join(" ")}>
                        {c.estatus === 'PAGADO'
                          ? <Check className="w-4 h-4" />
                          : c.estatus === 'ADEUDO'
                            ? <Clock className="w-4 h-4" />
                            : c.num}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold ${filaBloqueada ? "text-gray-400" : "text-[#13193a]"}`}>${c.monto.toFixed(2)}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <p className="text-xs text-gray-400">Vto. {c.vigencia ?? c.vto}</p>
                          {(c.estatus === 'PAGADO' || c.estatus === 'ADEUDO') && c.fechaPago && (
                            <><span className="text-gray-300">·</span>
                            <p className="text-xs text-blue-600">Recibido {c.fechaPago}</p></>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <CuotaBadge cuota={c}/>
                      {esPendiente && (
                        <button
                          disabled={polizaBloq || bloqueada}
                          onClick={() => !polizaBloq && !bloqueada && setCuotaSel(c)}
                          className={["flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                            (polizaBloq || bloqueada)
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-[#13193a] text-white hover:bg-[#1e2a50]",
                          ].join(" ")}>
                          <Banknote className="w-3.5 h-3.5" />
                          Recibir
                        </button>
                      )}
                      {mostrarRecibo && !polizaBloq && (
                        <button onClick={() => abrirRecibo(poliza, c, operador)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all">
                          <Receipt className="w-3.5 h-3.5" />
                          Recibo
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {cuotaSel && (
        <ModalAplicarPago
          poliza={poliza}
          cuota={cuotaSel}
          onClose={() => setCuotaSel(null)}
          onAplicar={handleAplicar}
        />
      )}
    </>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function OperadorPagos({ usuario }) {
  const [rows,           setRows]          = useState([]);
  const [loading,        setLoading]       = useState(true);
  const [oficinas,       setOficinas]      = useState(["Todas"]);
  const [vendedores,     setVendedores]    = useState(["Todos"]);
  const [busqueda,       setBusqueda]      = useState("");
  const [filtroOficina,   setFiltroOficina]   = useState("Todas");
  const [filtroVendedor,  setFiltroVendedor]  = useState("Todos");
  const [filtroFormaPago, setFiltroFormaPago] = useState("Todas");
  const [filtroEstado,    setFiltroEstado]    = useState("Todos");
  const [polizaSel,      setPolizaSel]     = useState(null);

  const operador = usuario?.id_muestra ?? '';

  // Convierte un pago DB en el objeto cuota que usan los componentes
  function mapCuota(c, idx) {
    // vto = fecha de emisión (cuando se generó el cobro) — para lógica interna
    // vigencia = vto + 7 días — lo que se muestra como "Vto." al usuario
    const vtoISO = c.fecha_vencimiento ?? '';
    const vigencia = vtoISO ? (() => {
      const d = new Date(vtoISO + 'T12:00:00');
      d.setDate(d.getDate() + 7);
      return isoAMX(d.toISOString().split('T')[0]);
    })() : null;
    return {
      id:         c.id,
      num:        idx + 1,
      vto:        isoAMX(vtoISO),   // emisión — usado en cálculos de vencimiento
      vigencia:   vigencia,          // vigencia = emisión + 7d — mostrada al usuario
      monto:      Number(c.monto),
      estatus:    c.estatus ?? 'PENDIENTE',
      pagado:     c.estatus === 'PAGADO',
      fechaPago:  c.fecha_pago ? isoAMX(c.fecha_pago) : null,
      forma:      c.forma_pago  ?? null,
      referencia: c.referencia  ?? null,
    };
  }

  // Carga todos los pagos en páginas de 1000 (supera el límite de Supabase)
  // y actualiza las filas en segundo plano conforme llegan los datos.
  const cargarPagosBackground = useCallback(async () => {
    const PAGE = 1000;
    let desde  = 0;
    let acum   = {};   // polizaId → [pago, ...]

    while (true) {
      const { data, error } = await supabase
        .from('pagos')
        .select('id, poliza_id, monto, fecha_pago, fecha_vencimiento, estatus, forma_pago, referencia')
        .range(desde, desde + PAGE - 1)
        .order('fecha_vencimiento', { ascending: true });

      if (error || !data || data.length === 0) break;

      for (const p of data) {
        if (!acum[p.poliza_id]) acum[p.poliza_id] = [];
        acum[p.poliza_id].push(p);
      }

      // Aplicar lo que llegó hasta ahora (actualización progresiva)
      const snap = { ...acum };
      setRows(prev => prev.map(r => {
        const pagos = snap[r.polizaId];
        if (!pagos) return r;
        return { ...r, cuotas: pagos.map(mapCuota) };
      }));

      if (data.length < PAGE) break;
      desde += PAGE;
    }
  }, []);

  // 1. Carga la lista de pólizas (rápido — aparecen de inmediato)
  // 2. Dispara la carga de pagos en segundo plano
  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [versionesConfig, { data: polizasDB, error }] = await Promise.all([
        fetchTodasVersionesConfig(),
        supabase
        .from('polizas')
        .select(`
          id, constancia, numero_poliza, forma_pago,
          fecha_inicio, fecha_fin, hora_inicio, hora_fin, estatus,
          clientes(nombre, apellido, rfc, curp, direccion, calle, numero_ext, numero_int, colonia, ciudad, estado, cp),
          oficinas(id, nombre),
          vendedores(nombre, apellido, codigo),
          coberturas(nombre, prima_neta, prima_total)
        `)
        .neq('estatus', 'COTIZACION')
        .order('fecha_inicio', { ascending: false }),
      ]);
      if (error) throw error;

      const rowsBuilt = (polizasDB ?? []).map(pol => {
        const cfg        = configParaFecha(versionesConfig, pol.fecha_inicio);
        const derechos   = cfg.derechos_emision ?? 400;
        const ivaPct     = cfg.iva_pct          ?? 16;
        const nombreCliente  = [pol.clientes?.nombre, pol.clientes?.apellido].filter(Boolean).join(' ');
        const nombreVendedor = pol.vendedores
          ? [pol.vendedores.nombre, pol.vendedores.apellido].filter(Boolean).join(' ')
          : 'GAMAN';
        const primaNeta = Number(pol.coberturas?.prima_neta ?? 0);
        const iva       = +((primaNeta + derechos) * (ivaPct / 100)).toFixed(2);
        return {
          id:          pol.constancia ?? pol.numero_poliza ?? String(pol.id),
          polizaId:    pol.id,
          asegurado:   nombreCliente,
          oficina:     pol.oficinas?.nombre ?? '',
          cobertura:   pol.coberturas?.nombre || '',
          vendedor:    nombreVendedor,
          formaPago:   pol.forma_pago,
          primaTotal:  Number(pol.coberturas?.prima_total ?? 0),
          primaNeta,
          iva,
          derechos,
          fechaInicio: pol.fecha_inicio ?? '',
          fechaFin:    pol.fecha_fin    ?? '',
          horaInicio:  pol.hora_inicio  ?? '00:00:00 hrs.',
          horaFin:     pol.hora_fin     ?? '23:59:59 hrs.',
          conducto:      pol.vendedores?.codigo || '-',
          clienteData:   pol.clientes ?? {},
          estatusPoliza: pol.estatus ?? 'VIGENTE',
          cuotas:        null,
        };
      });

      const oficinasSet   = [...new Set((polizasDB ?? []).map(p => p.oficinas?.nombre).filter(Boolean))];
      const vendedoresSet = [...new Set(rowsBuilt.map(r => r.vendedor).filter(Boolean))];
      setOficinas(["Todas", ...oficinasSet]);
      setVendedores(["Todos", ...vendedoresSet]);
      setRows(rowsBuilt);
      setPolizaSel(null);
    } catch (err) {
      console.error('Error cargando pagos:', err);
    } finally {
      setLoading(false);
    }
  }, [cargarPagosBackground]);

  // Carga las cuotas de una póliza específica y abre el modal
  const abrirCuotas = useCallback(async (pol) => {
    // Si ya están cargadas, abrir directamente
    if (pol.cuotas !== null) { setPolizaSel(pol); return; }

    // Abrir modal con estado "cargando"
    setPolizaSel({ ...pol, cuotas: [] });

    const { data, error } = await supabase
      .from('pagos')
      .select('*')
      .eq('poliza_id', pol.polizaId)
      .order('fecha_vencimiento', { ascending: true });

    if (error) { console.error('Error cargando cuotas:', error); return; }

    const cuotas = (data ?? []).map(mapCuota);

    // Cachear en rows para no volver a pedir
    setRows(prev => prev.map(r => r.polizaId === pol.polizaId ? { ...r, cuotas } : r));
    setPolizaSel(prev => prev?.polizaId === pol.polizaId ? { ...prev, cuotas } : prev);
  }, []);

  useEffect(() => {
    // Carga lista de pólizas, luego pagos en segundo plano
    cargar().then(() => cargarPagosBackground());
  }, [cargar, cargarPagosBackground]);

  const aplicarPago = async ({ cuotaId, polizaId, fecha, monto }) => {
    const { error } = await supabase.from('pagos').update({
      estatus:      'ADEUDO',
      fecha_pago:   fecha,
      monto:        parseFloat(monto),
      recibido_por: usuario?.id ?? null,
    }).eq('id', cuotaId);
    if (error) throw error;
    // Recargar cuotas del modal si está abierto
    if (polizaSel) {
      const { data: cuotasNew } = await supabase
        .from('pagos').select('*').eq('poliza_id', polizaSel.polizaId)
        .order('fecha_vencimiento', { ascending: true });
      const cuotas = (cuotasNew ?? []).map(mapCuota);
      setRows(prev => prev.map(r => r.polizaId === polizaSel.polizaId ? { ...r, cuotas } : r));
      setPolizaSel(prev => prev ? { ...prev, cuotas } : null);
    }
  };

  const hoy = new Date();

  const filtradas = useMemo(() => {
    const b = busqueda.toLowerCase();
    return rows.filter(p => {
      const matchBusq = p.id.toLowerCase().includes(b) || p.asegurado.toLowerCase().includes(b);
      const matchOfic = filtroOficina  === "Todas" || p.oficina    === filtroOficina;
      const matchVend = filtroVendedor === "Todos"  || p.vendedor   === filtroVendedor;
      const matchFp   = filtroFormaPago === "Todas" || p.formaPago  === filtroFormaPago;
      const pendientes = p.cuotas ? p.cuotas.filter(c => c.estatus === 'PENDIENTE').length : -1;
      const matchEst  = filtroEstado === "Todos"
        || (filtroEstado === "Con pendientes" && (pendientes === -1 || pendientes > 0))
        || (filtroEstado === "Al corriente"   && pendientes === 0);
      return matchBusq && matchOfic && matchVend && matchFp && matchEst;
    });
  }, [rows, busqueda, filtroOficina, filtroVendedor, filtroFormaPago, filtroEstado]);

  const { paginated: pagosPag, page: pagePagos, setPage: setPagePagos, totalPages: totalPagesPagos, total: totalPagos } = usePagination(filtradas);

  // Métricas solo sobre cuotas ya cargadas
  const cargadas       = rows.filter(p => p.cuotas !== null);
  const totalCobrado   = cargadas.flatMap(p => p.cuotas.filter(c => c.estatus === 'PAGADO')).reduce((s, c) => s + c.monto, 0);
  const totalAdeudo    = cargadas.flatMap(p => p.cuotas.filter(c => c.estatus === 'ADEUDO')).reduce((s, c) => s + c.monto, 0);
  const cuotasPend     = cargadas.flatMap(p => p.cuotas.filter(c => c.estatus === 'PENDIENTE')).length;
  const cuotasVencidas = cargadas.flatMap(p =>
    p.cuotas.filter(c => c.estatus === 'PENDIENTE' && new Date(c.vto.split("/").reverse().join("-") + 'T12:00:00') < hoy)
  ).length;

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Pagos</h1>
        <p className="text-gray-400 text-sm mt-0.5">Recepción y registro de pagos de cuotas</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:"Total cobrado",   value:`$${totalCobrado.toLocaleString("es-MX", {minimumFractionDigits:2})}`, accent:"emerald" },
          { label:"En adeudo",       value:`$${totalAdeudo.toLocaleString("es-MX",  {minimumFractionDigits:2})}`, accent:"blue"    },
          { label:"Por cobrar",      value: cuotasPend,     accent:"amber" },
          { label:"Cuotas vencidas", value: cuotasVencidas, accent:"red"   },
        ].map(m => {
          const c = {
            emerald:"bg-emerald-50 text-emerald-700 border-emerald-100",
            blue:   "bg-blue-50 text-blue-700 border-blue-100",
            amber:  "bg-amber-50 text-amber-700 border-amber-100",
            red:    "bg-red-50 text-red-600 border-red-100",
          };
          return (
            <div key={m.label} className={`${c[m.accent]} border rounded-2xl p-4`}>
              <p className="text-xl font-bold tabular-nums">{m.value}</p>
              <p className="text-xs font-semibold mt-0.5 opacity-80">{m.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-end gap-2 px-5 py-3 border-b border-gray-100">
          {/* Búsqueda */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">Buscar</span>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Póliza o asegurado..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] w-44 bg-white"/>
            </div>
          </div>
          {[
            { label:"Oficina",      value:filtroOficina,   set:setFiltroOficina,   opts:oficinas.map(o=>[o, o==="Todas"?"Todas las oficinas":o]) },
            { label:"Vendedor",     value:filtroVendedor,  set:setFiltroVendedor,  opts:vendedores.map(v=>[v, v==="Todos"?"Todos los vendedores":v]) },
            { label:"Forma de pago",value:filtroFormaPago, set:setFiltroFormaPago, opts:[["Todas","Todas"],["CONTADO","Contado"],["PARCIALES","Parciales"]] },
            { label:"Estado",       value:filtroEstado,    set:setFiltroEstado,    opts:[["Todos","Todos"],["Con pendientes","Con pendientes"],["Al corriente","Al corriente"]] },
          ].map(({ label, value, set, opts }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">{label}</span>
              <select value={value} onChange={e => set(e.target.value)}
                className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 max-w-[150px]">
                {opts.map(([v, lbl]) => <option key={v} value={v}>{lbl}</option>)}
              </select>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["Póliza","Asegurado","Oficina","Cobertura","Forma pago","Cuotas","Cobrado","Por cobrar",""].map((h, i) => (
                  <th key={i} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-1 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12 text-sm text-gray-400">Cargando...</td></tr>
              ) : filtradas.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-sm text-gray-400">No se encontraron pólizas.</td></tr>
              ) : pagosPag.map((p, i) => {
                const totalCuotas = p.formaPago === 'CONTADO' ? 1 : 4;
                const cargadas    = p.cuotas !== null;
                const cuotas      = p.cuotas ?? [];
                const pagadas     = cuotas.filter(c => c.estatus === 'PAGADO').length;
                const cobrado     = cuotas.filter(c => c.estatus === 'PAGADO').reduce((s, c) => s + c.monto, 0);
                const porCobrar   = cuotas.filter(c => c.estatus === 'PENDIENTE').reduce((s, c) => s + c.monto, 0);
                const hayVencida  = cuotas.some(c =>
                  c.estatus === 'PENDIENTE' &&
                  new Date(c.vto.split("/").reverse().join("-") + 'T12:00:00') < hoy
                );
                const polizaBloq  = ['VENCIDA','ANULADA'].includes(p.estatusPoliza);
                return (
                  <tr key={i} className={`transition-colors ${polizaBloq ? 'opacity-60 bg-gray-50/80' : 'hover:bg-gray-50/60'}`}>
                    <td className="px-5 py-1 font-mono text-xs font-bold text-[#13193a]">{p.id}</td>
                    <td className="px-5 py-1 text-xs font-semibold text-gray-700 whitespace-nowrap">{p.asegurado}</td>
                    <td className="px-5 py-1 text-xs text-gray-500 max-w-32 truncate">{p.oficina}</td>
                    <td className="px-5 py-1 text-xs text-gray-500 max-w-36 truncate">{p.cobertura}</td>
                    <td className="px-5 py-1 text-xs text-gray-500">
                      <div className="flex flex-col gap-0.5">
                        <span>{p.formaPago}</span>
                        {polizaBloq && (
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{p.estatusPoliza}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-1">
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                          {Array.from({ length: totalCuotas }, (_, idx) => {
                            const c = cargadas ? cuotas[idx] : undefined;
                            return (
                              <div key={idx} className={`w-2.5 h-2.5 rounded-full ${
                                !cargadas                      ? "bg-gray-100"    :
                                !c                             ? "bg-gray-200"    :
                                c.estatus === 'PAGADO'         ? "bg-emerald-500" :
                                c.estatus === 'ADEUDO'         ? "bg-blue-400"    :
                                hayVencida                     ? "bg-red-400"     :
                                                                  "bg-gray-200"
                              }`}/>
                            );
                          })}
                        </div>
                        <span className="text-[11px] text-gray-500">
                          {cargadas ? `${pagadas}/${totalCuotas}` : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-1 text-xs font-bold text-emerald-700">
                      {cargadas ? `$${cobrado.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-5 py-1">
                      {!cargadas ? <span className="text-xs text-gray-300">—</span>
                        : porCobrar > 0
                          ? <span className={`text-xs font-bold ${hayVencida ? "text-red-600" : "text-amber-700"}`}>${porCobrar.toFixed(2)}</span>
                          : <span className="text-xs text-emerald-600 font-semibold">Al corriente</span>}
                    </td>
                    <td className="px-5 py-1">
                      <button onClick={() => abrirCuotas(p)}
                        className="flex items-center gap-1.5 text-xs font-bold text-[#13193a] border border-[#13193a]/20 px-3 py-1.5 rounded-xl hover:bg-[#13193a]/5 transition-all whitespace-nowrap">
                        <Eye className="w-3.5 h-3.5" />
                        Ver cuotas
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Paginator page={pagePagos} totalPages={totalPagesPagos} total={totalPagos} pageSize={10} onPage={setPagePagos} />
      </div>

      {polizaSel && (
        <ModalHistorial
          poliza={polizaSel}
          onClose={() => setPolizaSel(null)}
          onAplicar={aplicarPago}
          operador={operador}
        />
      )}
    </div>
  );
}
