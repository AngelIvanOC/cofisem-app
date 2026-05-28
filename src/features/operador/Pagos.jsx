import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import { generarCuotasPoliza } from "../../services/polizas";


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
    pagoDe: cuota.num, pagoTotal: poliza.cuotas.length,
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
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
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
              <span className="font-semibold text-[#13193a]">{cuota.num} de {poliza.cuotas.length}</span>
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
              ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Confirmando...</>
              : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/></svg>Recibir</>
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

  const pagadas    = poliza.cuotas.filter(c => c.estatus === 'PAGADO').length;
  const enAdeudo   = poliza.cuotas.filter(c => c.estatus === 'ADEUDO').length;
  const total      = poliza.cuotas.reduce((s, c) => s + c.monto, 0);
  const cobrado    = poliza.cuotas.filter(c => c.estatus === 'PAGADO').reduce((s, c) => s + c.monto, 0);
  const adeudoMonto= poliza.cuotas.filter(c => c.estatus === 'ADEUDO').reduce((s, c) => s + c.monto, 0);
  const porCobrar  = poliza.cuotas.filter(c => c.estatus === 'PENDIENTE').reduce((s, c) => s + c.monto, 0);

  const primerPendienteId = poliza.cuotas.find(c => c.estatus === 'PENDIENTE')?.id;

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
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
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
                <span>{pagadas} de {poliza.cuotas.length} cuotas cobradas · {enAdeudo > 0 ? `${enAdeudo} en adeudo` : ''}</span>
                <span>{Math.round(((pagadas + enAdeudo) / poliza.cuotas.length) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500 transition-all" style={{ width:`${(pagadas / poliza.cuotas.length) * 100}%` }}/>
                <div className="h-full bg-blue-400 transition-all"    style={{ width:`${(enAdeudo / poliza.cuotas.length) * 100}%` }}/>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Cuotas</p>
              {poliza.cuotas.map(c => {
                const est     = estatusEfectivo(c);
                const mostrarRecibo = c.estatus === 'PAGADO' || c.estatus === 'ADEUDO' || c.id === primerPendienteId;
                return (
                  <div key={c.id}
                    className={["flex items-center justify-between gap-3 p-4 rounded-2xl border transition-all",
                      c.estatus === 'PAGADO' ? "bg-emerald-50/50 border-emerald-100" :
                      c.estatus === 'ADEUDO' ? "bg-blue-50/50 border-blue-100"       :
                      est       === 'VENCIDO'? "bg-red-50/50 border-red-100"         :
                                               "bg-white border-gray-200 hover:border-gray-300",
                    ].join(" ")}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={["w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                        c.estatus === 'PAGADO' ? "bg-emerald-500 text-white" :
                        c.estatus === 'ADEUDO' ? "bg-blue-500 text-white"   :
                        est       === 'VENCIDO'? "bg-red-500 text-white"    :
                                                 "bg-gray-100 text-gray-600",
                      ].join(" ")}>
                        {c.estatus === 'PAGADO'
                          ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                          : c.estatus === 'ADEUDO'
                            ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"/><circle cx="12" cy="12" r="9" strokeWidth="2"/></svg>
                            : c.num}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#13193a]">${c.monto.toFixed(2)}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <p className="text-xs text-gray-400">Vto. {c.vto}</p>
                          {(c.estatus === 'PAGADO' || c.estatus === 'ADEUDO') && c.fechaPago && (
                            <><span className="text-gray-300">·</span>
                            <p className="text-xs text-blue-600">Recibido {c.fechaPago}</p></>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <CuotaBadge cuota={c}/>
                      {c.estatus === 'PENDIENTE' && (
                        <button onClick={() => setCuotaSel(c)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#13193a] text-white text-xs font-bold hover:bg-[#1e2a50] transition-all">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/></svg>
                          Recibir
                        </button>
                      )}
                      {mostrarRecibo && (
                        <button onClick={() => abrirRecibo(poliza, c, operador)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.055 48.055 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"/>
                          </svg>
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
  const [filtroOficina,  setFiltroOficina] = useState("Todas");
  const [filtroVendedor, setFiltroVendedor]= useState("Todos");
  const [filtroEstado,   setFiltroEstado]  = useState("Todos");
  const [polizaSel,      setPolizaSel]     = useState(null);

  const operador = usuario?.id_muestra ?? '';

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: polizasDB, error: e1 }, { data: pagosDB, error: e2 }] = await Promise.all([
        supabase.from('polizas')
          .select(`
            id, constancia, numero_poliza, forma_pago,
            prima_neta, prima_total, iva, derechos,
            fecha_inicio, fecha_fin, hora_inicio, hora_fin, estatus,
            clientes(nombre, apellido, rfc, curp, direccion, calle, numero_ext, numero_int, colonia, ciudad, estado, cp),
            oficinas(id, nombre),
            vendedores(nombre, apellido, codigo)
          `)
          .neq('estatus', 'COTIZACION')
          .order('created_at', { ascending: false }),
        supabase.from('pagos')
          .select('*')
          .order('fecha_vencimiento', { ascending: true }),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;

      let pagosPorPoliza = {};
      for (const p of pagosDB ?? []) {
        if (!pagosPorPoliza[p.poliza_id]) pagosPorPoliza[p.poliza_id] = [];
        pagosPorPoliza[p.poliza_id].push(p);
      }

      const sinCuotas = (polizasDB ?? []).filter(p => !pagosPorPoliza[p.id] && p.fecha_inicio);
      for (const p of sinCuotas) {
        const esGestor = p.forma_pago === '4 PARCIALES' && Number(p.prima_total) === 2200;
        try {
          await generarCuotasPoliza(p.id, p.forma_pago, p.prima_total, p.fecha_inicio, esGestor);
        } catch (err) {
          console.error('generarCuotasPoliza', p.id, err);
        }
      }

      let pagosFinales = pagosDB ?? [];
      if (sinCuotas.length > 0) {
        const { data: nuevosPagos } = await supabase
          .from('pagos').select('*').order('fecha_vencimiento', { ascending: true });
        pagosFinales = nuevosPagos ?? [];
        pagosPorPoliza = {};
        for (const p of pagosFinales) {
          if (!pagosPorPoliza[p.poliza_id]) pagosPorPoliza[p.poliza_id] = [];
          pagosPorPoliza[p.poliza_id].push(p);
        }
      }

      const rowsBuilt = (polizasDB ?? []).map(pol => {
        const cuotas = (pagosPorPoliza[pol.id] ?? []).map((c, idx) => ({
          id:         c.id,
          num:        idx + 1,
          vto:        isoAMX(c.fecha_vencimiento),
          monto:      Number(c.monto),
          estatus:    c.estatus ?? 'PENDIENTE',
          pagado:     c.estatus === 'PAGADO',
          fechaPago:  c.fecha_pago ? isoAMX(c.fecha_pago) : null,
          forma:      c.forma_pago  ?? null,
          referencia: c.referencia  ?? null,
        }));
        const nombreCliente  = [pol.clientes?.nombre, pol.clientes?.apellido].filter(Boolean).join(' ');
        const nombreVendedor = pol.vendedores
          ? [pol.vendedores.nombre, pol.vendedores.apellido].filter(Boolean).join(' ')
          : 'GAMAN';
        return {
          id:          pol.constancia ?? pol.numero_poliza ?? String(pol.id),
          polizaId:    pol.id,
          asegurado:   nombreCliente,
          oficina:     pol.oficinas?.nombre ?? '',
          cobertura:   'TAXI BÁSICA 2500',
          vendedor:    nombreVendedor,
          formaPago:   pol.forma_pago,
          primaTotal:  Number(pol.prima_total ?? 0),
          primaNeta:   Number(pol.prima_neta  ?? 0),
          iva:         Number(pol.iva         ?? 0),
          derechos:    Number(pol.derechos    ?? 400),
          fechaInicio: pol.fecha_inicio ?? '',
          fechaFin:    pol.fecha_fin    ?? '',
          horaInicio:  pol.hora_inicio  ?? '00:00:00 hrs.',
          horaFin:     pol.hora_fin     ?? '23:59:59 hrs.',
          conducto:    pol.vendedores?.codigo || '-',
          clienteData: pol.clientes ?? {},
          cuotas,
        };
      }).filter(r => r.cuotas.length > 0);

      const oficinasSet   = [...new Set((polizasDB ?? []).map(p => p.oficinas?.nombre).filter(Boolean))];
      const vendedoresSet = [...new Set(rowsBuilt.map(r => r.vendedor).filter(Boolean))];
      setOficinas(["Todas", ...oficinasSet]);
      setVendedores(["Todos", ...vendedoresSet]);
      setRows(rowsBuilt);
      setPolizaSel(prev => prev ? (rowsBuilt.find(r => r.polizaId === prev.polizaId) ?? null) : null);
    } catch (err) {
      console.error('Error cargando pagos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const aplicarPago = async ({ cuotaId, polizaId, fecha, monto }) => {
    const { error } = await supabase.from('pagos').update({
      estatus:      'ADEUDO',
      fecha_pago:   fecha,
      monto:        parseFloat(monto),
      recibido_por: usuario?.id ?? null,
    }).eq('id', cuotaId);
    if (error) throw error;
    await cargar();
  };

  const hoy = new Date();

  const filtradas = rows.filter(p => {
    const matchBusq = p.id.toLowerCase().includes(busqueda.toLowerCase())
      || p.asegurado.toLowerCase().includes(busqueda.toLowerCase());
    const matchOfic = filtroOficina  === "Todas" || p.oficina  === filtroOficina;
    const matchVend = filtroVendedor === "Todos"  || p.vendedor === filtroVendedor;
    const pendientes = p.cuotas.filter(c => c.estatus === 'PENDIENTE').length;
    const matchEst  = filtroEstado === "Todos"
      || (filtroEstado === "Con pendientes" && pendientes > 0)
      || (filtroEstado === "Al corriente"   && pendientes === 0);
    return matchBusq && matchOfic && matchVend && matchEst;
  });

  const totalCobrado   = rows.flatMap(p => p.cuotas.filter(c => c.estatus === 'PAGADO')).reduce((s, c) => s + c.monto, 0);
  const totalAdeudo    = rows.flatMap(p => p.cuotas.filter(c => c.estatus === 'ADEUDO')).reduce((s, c) => s + c.monto, 0);
  const cuotasPend     = rows.flatMap(p => p.cuotas.filter(c => c.estatus === 'PENDIENTE')).length;
  const cuotasVencidas = rows.flatMap(p =>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-5 py-4 border-b border-gray-100">
          <div className="relative lg:col-span-1">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
            </svg>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Póliza o asegurado..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] bg-white"/>
          </div>
          <div>
            <select value={filtroOficina} onChange={e => setFiltroOficina(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none">
              {oficinas.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <select value={filtroVendedor} onChange={e => setFiltroVendedor(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none">
              {vendedores.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none">
              {["Todos", "Con pendientes", "Al corriente"].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["Póliza","Asegurado","Oficina","Cobertura","Forma pago","Cuotas","Cobrado","Por cobrar",""].map((h, i) => (
                  <th key={i} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12 text-sm text-gray-400">Cargando...</td></tr>
              ) : filtradas.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-sm text-gray-400">No se encontraron pólizas.</td></tr>
              ) : filtradas.map((p, i) => {
                const pagadas   = p.cuotas.filter(c => c.estatus === 'PAGADO').length;
                const cobrado   = p.cuotas.filter(c => c.estatus === 'PAGADO').reduce((s, c) => s + c.monto, 0);
                const porCobrar = p.cuotas.filter(c => c.estatus === 'PENDIENTE').reduce((s, c) => s + c.monto, 0);
                const hayVencida= p.cuotas.some(c =>
                  c.estatus === 'PENDIENTE' &&
                  new Date(c.vto.split("/").reverse().join("-") + 'T12:00:00') < hoy
                );
                return (
                  <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-[#13193a]">{p.id}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-gray-700 whitespace-nowrap">{p.asegurado}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 max-w-32 truncate">{p.oficina}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 max-w-36 truncate">{p.cobertura}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{p.formaPago}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                          {p.cuotas.map(c => (
                            <div key={c.id} className={`w-2.5 h-2.5 rounded-full ${
                              c.estatus === 'PAGADO' ? "bg-emerald-500" :
                              c.estatus === 'ADEUDO' ? "bg-blue-400"   :
                              hayVencida             ? "bg-red-400"    :
                                                       "bg-gray-200"
                            }`}/>
                          ))}
                        </div>
                        <span className="text-[11px] text-gray-500">{pagadas}/{p.cuotas.length}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-bold text-emerald-700">${cobrado.toFixed(2)}</td>
                    <td className="px-5 py-3.5">
                      {porCobrar > 0
                        ? <span className={`text-xs font-bold ${hayVencida ? "text-red-600" : "text-amber-700"}`}>${porCobrar.toFixed(2)}</span>
                        : <span className="text-xs text-emerald-600 font-semibold">Al corriente</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => setPolizaSel(p)}
                        className="flex items-center gap-1.5 text-xs font-bold text-[#13193a] border border-[#13193a]/20 px-3 py-1.5 rounded-xl hover:bg-[#13193a]/5 transition-all whitespace-nowrap">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.641 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        Ver cuotas
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">Mostrando <strong className="text-gray-600">{filtradas.length}</strong> pólizas</p>
        </div>
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
