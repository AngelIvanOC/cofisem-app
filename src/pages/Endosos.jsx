// TODO: Implementar página Endosos
export default function Endosos({ rolNombre, usuario }) {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#13193a]">Endosos</h1>
        <p className="text-gray-400 text-sm mt-1">Sección en construcción</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm">Próximamente: <strong className="text-gray-600">Endosos</strong></p>
      </div>
    </div>
  );
}
