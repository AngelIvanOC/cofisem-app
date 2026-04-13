// ============================================================
// src/pages/administracion/AdminUsuarios.jsx
// Administración: Crear y gestionar usuarios del sistema
// ============================================================
import { useState, useRef } from "react";

const ROLES   = ["OPERADOR","ANALISTA","CABINERO_SINIESTROS","AJUSTADOR","SUPERVISOR_SINIESTROS","VENTAS","ADMINISTRACION"];
const OFICINAS = ["COFISEM AV. E.ZAPATA","OFICINA CIVAC","COFISEM TEMIXCO","COFISEM CUAUTLA","TODAS (Admin)"];

const ROL_CLS = {
  "OPERADOR":              "bg-blue-50    text-blue-700    border-blue-200",
  "ANALISTA":              "bg-indigo-50  text-indigo-700  border-indigo-200",
  "ADMINISTRACION":        "bg-purple-50  text-purple-700  border-purple-200",
  "CABINERO_SINIESTROS":   "bg-emerald-50 text-emerald-700 border-emerald-200",
  "AJUSTADOR":             "bg-teal-50    text-teal-700    border-teal-200",
  "SUPERVISOR_SINIESTROS": "bg-amber-50   text-amber-700   border-amber-200",
  "VENTAS":                "bg-orange-50  text-orange-700  border-orange-200",
};

const formatRol = (r) => r.split("_").map(w => w[0]+w.slice(1).toLowerCase()).join(" ");

const USUARIOS_MOCK = [
  { id:"USR-001", nombre:"Laura",     apellido:"Rosher",  email:"laura@cofisem.mx",     rol:"OPERADOR",    oficina:"COFISEM AV. E.ZAPATA", activo:true,  creadoEl:"01/01/2025" },
  { id:"USR-002", nombre:"Marco",     apellido:"Cruz",    email:"marco@cofisem.mx",     rol:"OPERADOR",    oficina:"OFICINA CIVAC",        activo:true,  creadoEl:"01/01/2025" },
  { id:"USR-003", nombre:"Carlos",    apellido:"Soto",    email:"carlos@cofisem.mx",    rol:"OPERADOR",    oficina:"COFISEM TEMIXCO",      activo:true,  creadoEl:"15/02/2025" },
  { id:"USR-004", nombre:"Patricia",  apellido:"Morales", email:"patricia@cofisem.mx",  rol:"OPERADOR",    oficina:"COFISEM CUAUTLA",      activo:true,  creadoEl:"15/02/2025" },
  { id:"USR-005", nombre:"Ana",       apellido:"Pérez",   email:"ana.analista@cofisem.mx",rol:"ANALISTA",  oficina:"TODAS (Admin)",        activo:true,  creadoEl:"01/01/2025" },
  { id:"USR-006", nombre:"José",      apellido:"Ramírez", email:"jose.analista@cofisem.mx",rol:"ANALISTA", oficina:"TODAS (Admin)",        activo:false, creadoEl:"01/03/2025" },
  { id:"USR-007", nombre:"Roberto",   apellido:"Vega",    email:"roberto@cofisem.mx",   rol:"AJUSTADOR",   oficina:"OFICINA CIVAC",        activo:true,  creadoEl:"10/01/2025" },
  { id:"USR-008", nombre:"Sofía",     apellido:"Torres",  email:"sofia@cofisem.mx",     rol:"AJUSTADOR",   oficina:"COFISEM AV. E.ZAPATA", activo:true,  creadoEl:"10/01/2025" },
  { id:"USR-009", nombre:"Miguel",    apellido:"Luna",    email:"miguel@cofisem.mx",    rol:"CABINERO_SINIESTROS", oficina:"OFICINA CIVAC",activo:true,  creadoEl:"01/02/2025" },
  { id:"USR-010", nombre:"Elena",     apellido:"Fuentes", email:"elena@cofisem.mx",     rol:"VENTAS",      oficina:"COFISEM TEMIXCO",      activo:true,  creadoEl:"01/03/2025" },
  { id:"USR-011", nombre:"Héctor",    apellido:"Díaz",    email:"hector@cofisem.mx",    rol:"SUPERVISOR_SINIESTROS",oficina:"TODAS (Admin)",activo:true, creadoEl:"01/01/2025" },
  { id:"USR-012", nombre:"Valentina", apellido:"Ruiz",    email:"val@cofisem.mx",       rol:"ADMINISTRACION",oficina:"TODAS (Admin)",      activo:true,  creadoEl:"01/01/2025" },
];

const USUARIO_VACIO = { nombre:"", apellido:"", email:"", password:"", rol:"OPERADOR", oficina:"COFISEM AV. E.ZAPATA" };

function ModalUsuario({ usuario, onClose, onGuardar, esNuevo }) {
  const [form, setForm] = useState(usuario ?? USUARIO_VACIO);
  const [procesando, setProcesando] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const inpCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all";
  const selCls = `${inpCls} cursor-pointer`;

  const valido = form.nombre && form.apellido && form.email && form.rol && form.oficina && (esNuevo ? form.password : true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter:"blur(8px)", backgroundColor:"rgba(10,15,40,0.55)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="w-9 h-9 rounded-xl bg-[#13193a]/8 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-[#13193a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-[#13193a]">{esNuevo ? "Nuevo usuario" : "Editar usuario"}</h2>
            {!esNuevo && <p className="text-xs text-gray-400 mt-0.5">{form.email}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Nombre */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Nombre <span className="text-red-400">*</span></label>
              <input value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Nombre" className={inpCls}/>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Apellido <span className="text-red-400">*</span></label>
              <input value={form.apellido} onChange={e => set("apellido", e.target.value)} placeholder="Apellido" className={inpCls}/>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Correo electrónico <span className="text-red-400">*</span></label>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="usuario@cofisem.mx" className={inpCls}/>
          </div>

          {/* Password (solo en alta) */}
          {esNuevo && (
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Contraseña temporal <span className="text-red-400">*</span></label>
              <input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="Mínimo 8 caracteres" className={inpCls}/>
              <p className="text-[11px] text-gray-400 mt-1.5">El usuario deberá cambiarla en su primer inicio de sesión.</p>
            </div>
          )}

          {/* Rol */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Rol <span className="text-red-400">*</span></label>
            <select value={form.rol} onChange={e => set("rol", e.target.value)} className={selCls}>
              {ROLES.map(r => <option key={r} value={r}>{formatRol(r)}</option>)}
            </select>
            {form.rol && (
              <p className="text-[11px] text-gray-400 mt-1.5">
                {form.rol === "ADMINISTRACION"       && "Acceso total al sistema."}
                {form.rol === "ANALISTA"             && "Ve todas las oficinas. Aplica pólizas y pagos."}
                {form.rol === "OPERADOR"             && "Gestiona su oficina. Cotiza y tramita pólizas."}
                {form.rol === "CABINERO_SINIESTROS"  && "Reporta y consulta siniestros."}
                {form.rol === "AJUSTADOR"            && "Atiende siniestros asignados en campo."}
                {form.rol === "SUPERVISOR_SINIESTROS"&& "Supervisa y reasigna siniestros."}
                {form.rol === "VENTAS"               && "Consulta metas y reportes de ventas."}
              </p>
            )}
          </div>

          {/* Oficina */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Oficina <span className="text-red-400">*</span></label>
            <select value={form.oficina} onChange={e => set("oficina", e.target.value)} className={selCls}>
              {OFICINAS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button
            onClick={() => { setProcesando(true); setTimeout(() => onGuardar(form), 700); }}
            disabled={!valido || procesando}
            className="flex-1 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#13193a]/15">
            {procesando
              ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Guardando...</>
              : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>{esNuevo ? "Crear usuario" : "Guardar cambios"}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────
export default function AdminUsuarios() {
  const [usuarios, setUsuarios]       = useState(USUARIOS_MOCK);
  const [busqueda, setBusqueda]       = useState("");
  const [filtroRol, setFiltroRol]     = useState("Todos");
  const [filtroOficina, setFiltroOficina] = useState("Todas");
  const [filtroActivo, setFiltroActivo]   = useState("Todos");
  const [modal, setModal]             = useState(null);  // null | "nuevo" | "editar"
  const [usuarioSel, setUsuarioSel]   = useState(null);

  const filtrados = usuarios.filter(u => {
    const mb = u.nombre.toLowerCase().includes(busqueda.toLowerCase()) || u.apellido.toLowerCase().includes(busqueda.toLowerCase()) || u.email.toLowerCase().includes(busqueda.toLowerCase());
    const mr = filtroRol    === "Todos"  || u.rol     === filtroRol;
    const mo = filtroOficina === "Todas" || u.oficina === filtroOficina;
    const ma = filtroActivo  === "Todos" || (filtroActivo === "Activos" ? u.activo : !u.activo);
    return mb && mr && mo && ma;
  });

  const toggleActivo = (id) => setUsuarios(us => us.map(u => u.id === id ? { ...u, activo: !u.activo } : u));

  const onGuardar = (form) => {
    if (modal === "nuevo") {
      const nuevoId = `USR-${String(usuarios.length + 1).padStart(3, "0")}`;
      setUsuarios(us => [...us, { ...form, id: nuevoId, activo: true, creadoEl: new Date().toLocaleDateString("es-MX") }]);
    } else {
      setUsuarios(us => us.map(u => u.id === usuarioSel.id ? { ...u, ...form } : u));
    }
    setModal(null); setUsuarioSel(null);
  };

  const selCls = "px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none";

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Usuarios</h1>
          <p className="text-gray-400 text-sm mt-0.5">Gestión de accesos al sistema</p>
        </div>
        <button onClick={() => { setUsuarioSel(null); setModal("nuevo"); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all shadow-lg shadow-[#13193a]/15">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          Nuevo usuario
        </button>
      </div>

      {/* Resumen por rol */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {ROLES.map(r => {
          const cnt = usuarios.filter(u => u.rol === r && u.activo).length;
          const cls = ROL_CLS[r] ?? "bg-gray-100 text-gray-600 border-gray-200";
          return (
            <button key={r} onClick={() => setFiltroRol(r === filtroRol ? "Todos" : r)}
              className={`${cls} border rounded-xl p-3 text-left hover:shadow-sm transition-all ${filtroRol === r ? "ring-2 ring-offset-1 ring-current/30" : ""}`}>
              <p className="text-xl font-bold">{cnt}</p>
              <p className="text-[10px] font-semibold mt-0.5 leading-tight">{formatRol(r)}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filtros */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 px-5 py-4 border-b border-gray-100">
          <div className="lg:col-span-2 relative">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Nombre o correo..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] bg-white"/>
          </div>
          <select value={filtroRol}     onChange={e => setFiltroRol(e.target.value)}     className={selCls}>{["Todos",...ROLES.map(r=>r)].map(r => <option key={r} value={r}>{r === "Todos" ? "Todos los roles" : formatRol(r)}</option>)}</select>
          <select value={filtroOficina} onChange={e => setFiltroOficina(e.target.value)} className={selCls}>{["Todas",...OFICINAS].map(o => <option key={o}>{o}</option>)}</select>
          <select value={filtroActivo}  onChange={e => setFiltroActivo(e.target.value)}  className={selCls}>{["Todos","Activos","Inactivos"].map(o => <option key={o}>{o}</option>)}</select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["","Usuario","Email","Rol","Oficina","Creado","Estado","Acciones"].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtrados.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-sm text-gray-400">No se encontraron usuarios.</td></tr>
              ) : filtrados.map(u => (
                <tr key={u.id} className={`hover:bg-gray-50/60 transition-colors ${!u.activo ? "opacity-60" : ""}`}>
                  {/* Avatar */}
                  <td className="px-5 py-3.5">
                    <div className="w-8 h-8 rounded-full bg-[#13193a] text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {u.nombre[0]}{u.apellido[0]}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-xs font-semibold text-[#13193a]">{u.nombre} {u.apellido}</p>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">{u.id}</p>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border ${ROL_CLS[u.rol] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
                      {formatRol(u.rol)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500 max-w-32 truncate">{u.oficina}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">{u.creadoEl}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => toggleActivo(u.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${u.activo ? "bg-emerald-500" : "bg-gray-200"}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${u.activo ? "translate-x-4.5" : "translate-x-0.5"}`}/>
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => { setUsuarioSel(u); setModal("editar"); }}
                      className="flex items-center gap-1.5 text-xs font-bold text-[#13193a] border border-[#13193a]/20 px-3 py-1.5 rounded-xl hover:bg-[#13193a]/5 transition-all">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">{filtrados.length} usuarios — {usuarios.filter(u=>u.activo).length} activos</p>
        </div>
      </div>

      {(modal === "nuevo" || modal === "editar") && (
        <ModalUsuario
          usuario={modal === "editar" ? usuarioSel : null}
          esNuevo={modal === "nuevo"}
          onClose={() => { setModal(null); setUsuarioSel(null); }}
          onGuardar={onGuardar}
        />
      )}
    </div>
  );
}