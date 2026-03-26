// ============================================================
// src/features/administracion/usuarios/UsuariosPage.jsx
// Admin: Crear y gestionar usuarios del sistema
// ============================================================
import { useState } from "react";
import Modal from "../../../shared/ui/Modal";
import Buscador, { FiltroSelect } from "../../../shared/ui/Buscador";
import { TablaBase, TablaScroll, Th, Td, FilaVacia } from "../../../shared/ui/TablaBase";
import FormUsuario from "./FormUsuario";

const ROLES = ["OPERADOR","ANALISTA","CABINERO_SINIESTROS","AJUSTADOR","SUPERVISOR_SINIESTROS","VENTAS","ADMINISTRACION"];
const formatRol = (r) => r.split("_").map((w) => w[0] + w.slice(1).toLowerCase()).join(" ");

const ROL_CLS = {
  OPERADOR:              "bg-blue-50    text-blue-700    border-blue-200",
  ANALISTA:              "bg-indigo-50  text-indigo-700  border-indigo-200",
  ADMINISTRACION:        "bg-purple-50  text-purple-700  border-purple-200",
  CABINERO_SINIESTROS:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  AJUSTADOR:             "bg-teal-50    text-teal-700    border-teal-200",
  SUPERVISOR_SINIESTROS: "bg-amber-50   text-amber-700   border-amber-200",
  VENTAS:                "bg-orange-50  text-orange-700  border-orange-200",
};

const USUARIOS_INIT = [
  { id:"USR-001", nombre:"Laura",     apellido:"Rosher",  email:"laura@cofisem.mx",     rol:"OPERADOR",    oficina:"COFISEM AV. E.ZAPATA", activo:true,  creadoEl:"01/01/2025" },
  { id:"USR-002", nombre:"Marco",     apellido:"Cruz",    email:"marco@cofisem.mx",     rol:"OPERADOR",    oficina:"OFICINA CIVAC",        activo:true,  creadoEl:"01/01/2025" },
  { id:"USR-003", nombre:"Carlos",    apellido:"Soto",    email:"carlos@cofisem.mx",    rol:"OPERADOR",    oficina:"COFISEM TEMIXCO",      activo:true,  creadoEl:"15/02/2025" },
  { id:"USR-004", nombre:"Patricia",  apellido:"Morales", email:"patricia@cofisem.mx",  rol:"OPERADOR",    oficina:"COFISEM CUAUTLA",      activo:true,  creadoEl:"15/02/2025" },
  { id:"USR-005", nombre:"Ana",       apellido:"Pérez",   email:"ana@cofisem.mx",       rol:"ANALISTA",    oficina:"TODAS (Admin)",        activo:true,  creadoEl:"01/01/2025" },
  { id:"USR-006", nombre:"José",      apellido:"Ramírez", email:"jose@cofisem.mx",      rol:"ANALISTA",    oficina:"TODAS (Admin)",        activo:false, creadoEl:"01/03/2025" },
  { id:"USR-007", nombre:"Roberto",   apellido:"Vega",    email:"roberto@cofisem.mx",   rol:"AJUSTADOR",   oficina:"OFICINA CIVAC",        activo:true,  creadoEl:"10/01/2025" },
  { id:"USR-008", nombre:"Elena",     apellido:"Fuentes", email:"elena@cofisem.mx",     rol:"VENTAS",      oficina:"COFISEM TEMIXCO",      activo:true,  creadoEl:"01/03/2025" },
  { id:"USR-009", nombre:"Héctor",    apellido:"Díaz",    email:"hector@cofisem.mx",    rol:"SUPERVISOR_SINIESTROS", oficina:"TODAS (Admin)", activo:true, creadoEl:"01/01/2025" },
  { id:"USR-010", nombre:"Valentina", apellido:"Ruiz",    email:"val@cofisem.mx",       rol:"ADMINISTRACION",oficina:"TODAS (Admin)",     activo:true,  creadoEl:"01/01/2025" },
];

const FORM_VACIO = { nombre:"", apellido:"", email:"", password:"", rol:"OPERADOR", oficina:"COFISEM AV. E.ZAPATA" };

export default function UsuariosPage() {
  const [usuarios,      setUsuarios]      = useState(USUARIOS_INIT);
  const [busqueda,      setBusqueda]      = useState("");
  const [filtroRol,     setFiltroRol]     = useState("Todos");
  const [filtroActivo,  setFiltroActivo]  = useState("Todos");
  const [modal,         setModal]         = useState(null);
  const [usuarioSel,    setUsuarioSel]    = useState(null);
  const [form,          setForm]          = useState(FORM_VACIO);
  const [loading,       setLoading]       = useState(false);

  const setF = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const abrirNuevo = () => { setForm(FORM_VACIO); setUsuarioSel(null); setModal("nuevo"); };
  const abrirEditar = (u) => { setForm({ nombre: u.nombre, apellido: u.apellido, email: u.email, password: "", rol: u.rol, oficina: u.oficina }); setUsuarioSel(u); setModal("editar"); };
  const toggleActivo = (id) => setUsuarios((us) => us.map((u) => u.id === id ? { ...u, activo: !u.activo } : u));

  const guardar = () => {
    setLoading(true);
    setTimeout(() => {
      if (modal === "nuevo") {
        const id = `USR-${String(usuarios.length + 1).padStart(3, "0")}`;
        setUsuarios((us) => [...us, { ...form, id, activo: true, creadoEl: new Date().toLocaleDateString("es-MX") }]);
      } else {
        setUsuarios((us) => us.map((u) => u.id === usuarioSel.id ? { ...u, ...form } : u));
      }
      setModal(null);
      setLoading(false);
    }, 600);
  };

  const filtrados = usuarios.filter((u) => {
    const mb = u.nombre.toLowerCase().includes(busqueda.toLowerCase()) || u.apellido.toLowerCase().includes(busqueda.toLowerCase()) || u.email.toLowerCase().includes(busqueda.toLowerCase());
    const mr = filtroRol    === "Todos"   || u.rol    === filtroRol;
    const ma = filtroActivo === "Todos"   || (filtroActivo === "Activos" ? u.activo : !u.activo);
    return mb && mr && ma;
  });

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Usuarios</h1>
          <p className="text-gray-400 text-sm mt-0.5">Gestión de accesos al sistema</p>
        </div>
        <button onClick={abrirNuevo} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all shadow-lg shadow-[#13193a]/15">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          Nuevo usuario
        </button>
      </div>

      {/* Resumen por rol */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {ROLES.map((r) => {
          const cnt = usuarios.filter((u) => u.rol === r && u.activo).length;
          return (
            <button key={r} onClick={() => setFiltroRol(r === filtroRol ? "Todos" : r)} className={`${ROL_CLS[r] ?? "bg-gray-100 text-gray-600 border-gray-200"} border rounded-xl p-3 text-left hover:shadow-sm transition-all ${filtroRol === r ? "ring-2 ring-offset-1 ring-current/30" : ""}`}>
              <p className="text-xl font-bold">{cnt}</p>
              <p className="text-[10px] font-semibold mt-0.5 leading-tight">{formatRol(r)}</p>
            </button>
          );
        })}
      </div>

      <TablaBase footer={<p className="text-xs text-gray-400">{filtrados.length} usuarios — {usuarios.filter((u) => u.activo).length} activos</p>}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-5 py-4 border-b border-gray-100">
          <div className="lg:col-span-2"><Buscador value={busqueda} onChange={setBusqueda} placeholder="Nombre o correo..." /></div>
          <FiltroSelect value={filtroRol}    onChange={setFiltroRol}    opciones={["Todos", ...ROLES.map((r) => ({ value: r, label: formatRol(r) }))]} />
          <FiltroSelect value={filtroActivo} onChange={setFiltroActivo} opciones={["Todos", "Activos", "Inactivos"]} />
        </div>

        <TablaScroll>
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <Th></Th><Th>Usuario</Th><Th>Email</Th><Th>Rol</Th>
              <Th>Oficina</Th><Th>Creado</Th><Th>Estado</Th><Th>Acciones</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtrados.length === 0 ? <FilaVacia cols={8} mensaje="No se encontraron usuarios." /> : filtrados.map((u) => (
              <tr key={u.id} className={`hover:bg-gray-50/60 transition-colors ${!u.activo ? "opacity-60" : ""}`}>
                <Td>
                  <div className="w-8 h-8 rounded-full bg-[#13193a] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {u.nombre[0]}{u.apellido[0]}
                  </div>
                </Td>
                <Td>
                  <p className="text-xs font-semibold text-[#13193a]">{u.nombre} {u.apellido}</p>
                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">{u.id}</p>
                </Td>
                <Td className="text-xs text-gray-500">{u.email}</Td>
                <Td>
                  <span className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border ${ROL_CLS[u.rol] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
                    {formatRol(u.rol)}
                  </span>
                </Td>
                <Td className="text-xs text-gray-500 max-w-32 truncate">{u.oficina}</Td>
                <Td className="text-xs text-gray-400">{u.creadoEl}</Td>
                <Td>
                  <button onClick={() => toggleActivo(u.id)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${u.activo ? "bg-emerald-500" : "bg-gray-200"}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${u.activo ? "translate-x-4.5" : "translate-x-0.5"}`} />
                  </button>
                </Td>
                <Td>
                  <button onClick={() => abrirEditar(u)} className="flex items-center gap-1.5 text-xs font-bold text-[#13193a] border border-[#13193a]/20 px-3 py-1.5 rounded-xl hover:bg-[#13193a]/5 transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
                    Editar
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TablaScroll>
      </TablaBase>

      {(modal === "nuevo" || modal === "editar") && (
        <Modal onClose={() => setModal(null)} title={modal === "nuevo" ? "Nuevo usuario" : "Editar usuario"} subtitle={modal === "editar" ? form.email : undefined}>
          <FormUsuario form={form} setF={setF} onGuardar={guardar} onCancelar={() => setModal(null)} esNuevo={modal === "nuevo"} loading={loading} />
        </Modal>
      )}
    </div>
  );
}
