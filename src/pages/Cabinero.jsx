import {ClipboardDocumentListIcon, HomeIcon} from '@heroicons/react/16/solid';
import{ CalendarIcon} from '@heroicons/react/16/solid';
export default function Dashboard() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-56 bg-blue-900 flex flex-col py-6">
        <div className="flex items-center px-4 py-3 text-white hover:bg-blue-800 cursor-pointer">
          <HomeIcon className="h-6 w-6 mr-3" />
          <span className="text-sm font-medium">Inicio</span>
        </div>
        <div className="flex items-center px-4 py-3 text-white hover:bg-blue-800 cursor-pointer">
          <CalendarIcon className="h-6 w-6 mr-3" />
          <span className="text-sm font-medium">Reportar Siniestro</span>
        </div>
        <div className="flex items-center px-4 py-3 text-white hover:bg-blue-800 cursor-pointer">
          <ClipboardDocumentListIcon className="h-6 w-6 mr-3" />
          <span className="text-sm font-medium">Siniestros</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Resumen Cabina</h1>

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <MetricCard title="Reportados Hoy" value="8" change="+7.34% vs ayer" />
          <MetricCard title="Pendientes de Asignar" value="3" change="-3.18% vs semana pasada" />
          <MetricCard title="En Proceso" value="12" change="+0.32% retraso" />
          <MetricCard title="Cerrados Hoy" value="5" change="+7.34% vs ayer" />
        </div>

        {/* Latest Incidents */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Últimos Siniestros</h2>
            <input
              type="text"
              placeholder="Buscar..."
              className="border rounded px-3 py-1 text-sm"
            />
          </div>

          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="px-4 py-2">Folio</th>
                <th className="px-4 py-2">Asegurado</th>
                <th className="px-4 py-2">Vehículo</th>
                <th className="px-4 py-2">Ubicación</th>
                <th className="px-4 py-2">Ajustador</th>
                <th className="px-4 py-2">Estatus</th>
              </tr>
            </thead>
            <tbody>
              <IncidentRow folio="SN-10234" asegurado="Carlos Gómez" vehiculo="Toyota Corolla" ubicacion="Jiutepec, Mor" ajustador="Félix Hernández" estatus="Completado" color="green" />
              <IncidentRow folio="SN-10231" asegurado="Carlos Gómez" vehiculo="Toyota Corolla" ubicacion="Jiutepec, Mor" ajustador="Sin Asignar" estatus="Pendiente" color="yellow" />
              <IncidentRow folio="SN-10227" asegurado="Carlos Gómez" vehiculo="Toyota Corolla" ubicacion="Jiutepec, Mor" ajustador="Félix Hernández" estatus="Cancelado" color="red" />
              <IncidentRow folio="SN-10220" asegurado="Carlos Gómez" vehiculo="Toyota Corolla" ubicacion="Jiutepec, Mor" ajustador="Sin Asignar" estatus="Pendiente" color="yellow" />
              <IncidentRow folio="SN-10215" asegurado="Carlos Gómez" vehiculo="Toyota Corolla" ubicacion="Jiutepec, Mor" ajustador="Félix Hernández" estatus="Completado" color="green" />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* Metric Card Component */
function MetricCard({ title, value, change }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500">{change}</p>
    </div>
  );
}

/* Incident Row Component */
function IncidentRow({ folio, asegurado, vehiculo, ubicacion, ajustador, estatus, color }) {
  const statusColors = {
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
  };

  return (
    <tr className="border-b">
      <td className="px-4 py-2">{folio}</td>
      <td className="px-4 py-2">{asegurado}</td>
      <td className="px-4 py-2">{vehiculo}</td>
      <td className="px-4 py-2">{ubicacion}</td>
      <td className="px-4 py-2">{ajustador}</td>
      <td className="px-4 py-2">
        <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[color]}`}>
          {estatus}
        </span>
      </td>
    </tr>
  );
}