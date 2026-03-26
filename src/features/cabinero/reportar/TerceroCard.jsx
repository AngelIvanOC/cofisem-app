import { CampoTexto } from "../../../shared/forms/Campos";
export default function TerceroCard({ tercero, onChange }) {
  const set = (k, v) => onChange({ ...tercero, [k]: v });
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-[#13193a]">Datos del tercero</p>
        <span className="text-[11px] text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">Opcional</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CampoTexto label="Nombre completo" value={tercero.nombre}   onChange={(v) => set("nombre",v)}   placeholder="Nombre del tercero"/>
        <CampoTexto label="Teléfono"        value={tercero.telefono} onChange={(v) => set("telefono",v)} placeholder="10 dígitos"/>
        <CampoTexto label="Placas"          value={tercero.placas}   onChange={(v) => set("placas",v)}   placeholder="Placas del vehículo"/>
        <CampoTexto label="Marca / Modelo"  value={tercero.modelo}   onChange={(v) => set("modelo",v)}   placeholder="Ej. Nissan Sentra"/>
        <div className="col-span-2">
          <CampoTexto label="Descripción de daños" value={tercero.danos} onChange={(v) => set("danos",v)} placeholder="Describe los daños al tercero..." rows={2}/>
        </div>
      </div>
    </div>
  );
}
