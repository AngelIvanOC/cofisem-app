// ============================================================
// EJECUTA ESTE SCRIPT UNA SOLA VEZ para generar los
// archivos placeholder de todas las páginas.
//
// Corre desde la raíz del proyecto:
//   node create-pages.mjs
// ============================================================

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const PAGES_DIR = "./src/pages";

const pages = [
  { file: "Dashboard.jsx",      title: "Dashboard" },
  { file: "Clientes.jsx",       title: "Clientes" },
  { file: "Polizas.jsx",        title: "Pólizas" },
  { file: "Cotizaciones.jsx",   title: "Cotizaciones" },
  { file: "Vendedores.jsx",     title: "Vendedores" },
  { file: "Pagos.jsx",          title: "Pagos" },
  { file: "Reportes.jsx",       title: "Reportes" },
  { file: "Endosos.jsx",        title: "Endosos" },
  { file: "Usuarios.jsx",       title: "Usuarios" },
  { file: "Siniestros.jsx",     title: "Siniestros" },
  { file: "SiniestroNuevo.jsx", title: "Reportar Siniestro" },
  { file: "Documentacion.jsx",  title: "Documentación" },
  { file: "Resolucion.jsx",     title: "Resolución" },
  { file: "Reasignacion.jsx",   title: "Reasignación" },
  { file: "Metas.jsx",          title: "Metas de Ventas" },
];

// Crear carpeta si no existe
if (!existsSync(PAGES_DIR)) mkdirSync(PAGES_DIR, { recursive: true });

pages.forEach(({ file, title }) => {
  const path = join(PAGES_DIR, file);
  if (existsSync(path)) {
    console.log(`⏭  Ya existe: ${file}`);
    return;
  }

  const content = `// TODO: Implementar página ${title}
export default function ${file.replace(".jsx", "")}({ rolNombre, usuario }) {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#13193a]">${title}</h1>
        <p className="text-gray-400 text-sm mt-1">Sección en construcción</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm">Próximamente: <strong className="text-gray-600">${title}</strong></p>
      </div>
    </div>
  );
}
`;
  writeFileSync(path, content);
  console.log(`✅ Creado: ${file}`);
});

console.log("\n🎉 Listo. Todas las páginas generadas en src/pages/");
