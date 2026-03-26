import { useState } from "react";
import TablaSiniestros from "./TablaSiniestros";
import ModalDetalle    from "./ModalDetalle";

const SINIESTROS_INIT = [
  { folio:"SN-10234", asegurado:"Carlos Gómez",    vehiculo:"Sedan Rojo",    fecha:"19/03/2026 08:12", ubicacion:"Av. Morelos 145, CIVAC",       ajustador:"Félix Hernández", estatus:"Activo"      },
  { folio:"SN-10231", asegurado:"Ana Martínez",    vehiculo:"Taxi Blanco",   fecha:"18/03/2026 15:44", ubicacion:"Blvd. Cuauhnáhuac, km 4",      ajustador:null,              estatus:"Sin asignar" },
  { folio:"SN-10228", asegurado:"Roberto Díaz",    vehiculo:"Combi Gris",    fecha:"18/03/2026 11:30", ubicacion:"Centro Histórico, Cuernavaca", ajustador:null,              estatus:"Sin asignar" },
  { folio:"SN-10225", asegurado:"Laura González",  vehiculo:"Taxi Rojo",     fecha:"17/03/2026 09:05", ubicacion:"Col. Vista Hermosa, Temixco",  ajustador:"Luis Martínez",   estatus:"Asignado"    },
  { folio:"SN-10219", asegurado:"Miguel Ortega",   vehiculo:"Sedan Negro",   fecha:"16/03/2026 14:20", ubicacion:"Av. Plan de Ayala 380",         ajustador:"Ana García",      estatus:"Completado"  },
  { folio:"SN-10211", asegurado:"Patricia Ruiz",   vehiculo:"Taxi Azul",     fecha:"14/03/2026 10:50", ubicacion:"Paseo del Conquistador",        ajustador:"Roberto Vega",    estatus:"Completado"  },
  { folio:"SN-10208", asegurado:"Fernando López",  vehiculo:"Pickup Blanca", fecha:"13/03/2026 16:15", ubicacion:"Carretera federal 95",          ajustador:"Félix Hernández", estatus:"Activo"      },
];

export default function SiniestrosPage() {
  const [siniestros, setSiniestros] = useState(SINIESTROS_INIT);
  const [sel,        setSel]        = useState(null);
  const [busqueda,   setBusqueda]   = useState("");
  const [filtroEst,  setFiltroEst]  = useState("Todos");

  const asignar = (folio, nombre) => {
    setSiniestros((prev) => prev.map((s) => s.folio === folio ? { ...s, ajustador: nombre, estatus: "Asignado" } : s));
    setSel((prev) => prev ? { ...prev, ajustador: nombre, estatus: "Asignado" } : prev);
  };

  const filtrados = siniestros.filter((s) => {
    const mb = s.folio.includes(busqueda) || s.asegurado.toLowerCase().includes(busqueda.toLowerCase());
    const me = filtroEst === "Todos" || s.estatus === filtroEst;
    return mb && me;
  });

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Siniestros</h1>
        <p className="text-gray-400 text-sm mt-0.5">Gestión y asignación de ajustadores</p>
      </div>
      <TablaSiniestros
        siniestros={filtrados} busqueda={busqueda} onBusqueda={setBusqueda}
        filtroEstatus={filtroEst} onFiltroEstatus={setFiltroEst}
        onDetalle={setSel} total={siniestros.length}
      />
      {sel && <ModalDetalle s={sel} onClose={() => setSel(null)} onAsignar={asignar}/>}
    </div>
  );
}
