const fs = require('fs');

// Map: substring of d= path → Lucide component name
const pathToIcon = [
  ['M12 4.5v15m7.5-7.5h-15',                           'Plus'],
  ['M12 5v14M5 12h14',                                  'Plus'],
  ['M21 21l-5.197-5.197m0 0A7.5 7.5 0',                'Search'],
  ['M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51',  'Eye'],
  ['M2.25 12s',                                          'Eye'],
  ['M2.25 12c',                                          'Eye'],
  ['M3.98 8.223A10.477 10.477',                         'EyeOff'],
  ['M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652',  'Pencil'],
  ['M15.232 5.232',                                      'Pencil'],
  ['M18.364 18.364A9 9 0 005.636 5.636',               'Ban'],
  ['M9 12.75L11.25 15 15 9.75M21 12',                   'CheckCircle2'],
  ['M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12',         'XCircle'],
  ['M6 18L18 6M6 6l12 12',                              'X'],
  ['M12 9v3.75m-9.303 3.376',                           'AlertTriangle'],
  ['M12 9v3.75m9.303 3.376',                            'AlertTriangle'],
  ['M2.25 18.75a60.07',                                 'Banknote'],
  ['M16.5 10.5V6.75a4.5 4.5 0 10-9',                   'Lock'],
  ['M5 13l4 4L19 7',                                    'Check'],
  ['M12 6v6l4 2',                                       'Clock'],
  ['M6.72 13.829',                                      'Receipt'],
  ['M13 7l5 5m0 0l-5 5m5-5H6',                         'ArrowRight'],
  ['M11.25 11.25l.041-.02a.75.75 0 011.063.852',       'Info'],
  ['M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18',          'FileText'],
  ['M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5',          'Ticket'],
  ['M8.25 4.5l7.5 7.5-7.5 7.5',                        'ChevronRight'],
  ['M15.75 19.5L8.25 12l7.5-7.5',                      'ChevronLeft'],
  ['M15 19l-7-7 7-7',                                   'ChevronLeft'],
  ['M15.75 6a3.75 3.75 0 11-7.5 0',                    'User'],
  ['M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375',  'ClipboardList'],
  ['M4 16v1a3 3 0 003 3h10',                            'Download'],
  ['M3 16.5v2.25A2.25',                                 'Download'],
  ['M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5',            'Calendar'],
];

function identifyIcon(svgBlock) {
  for (const [substr, comp] of pathToIcon) {
    if (svgBlock.includes(substr)) return comp;
  }
  return null;
}

function extractClassName(svgBlock) {
  const m = svgBlock.match(/className="([^"]+)"/);
  return m ? m[1] : '';
}

const files = [
  'src/features/operador/Polizas.jsx',
  'src/features/administracion/AdminPolizas.jsx',
  'src/features/operador/Pagos.jsx',
  'src/features/analista/AnalistaPolizas.jsx',
  'src/features/administracion/AdminUsuarios.jsx',
  'src/features/operador/OperadorDashboard.jsx',
  'src/features/operador/components/ResumenPoliza.jsx',
  'src/features/cabinero/SiniestroNuevo.jsx',
  'src/features/cabinero/components/FormSiniestro.jsx',
  'src/pages/VerificarPoliza.jsx',
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) { console.log('SKIP (not found):', filePath); return; }
  let src = fs.readFileSync(filePath, 'utf8');
  if (!src.includes('<svg')) { console.log('SKIP (no svg):', filePath); return; }

  const original = src;
  const usedIcons = new Set();
  let replaced = 0;
  let skipped = 0;

  // Replace SVG blocks
  src = src.replace(/<svg[\s\S]*?<\/svg>/g, (match) => {
    const comp = identifyIcon(match);
    if (!comp) { skipped++; return match; }
    const cls = extractClassName(match);
    usedIcons.add(comp);
    replaced++;
    return cls ? `<${comp} className="${cls}" />` : `<${comp} />`;
  });

  if (replaced === 0) { console.log('NO MATCH:', filePath, '(skipped:', skipped, ')'); return; }

  // Update lucide-react import
  if (src.includes('from "lucide-react"')) {
    src = src.replace(/import\s*\{([^}]+)\}\s*from\s*"lucide-react"/, (m, existing) => {
      const existingList = existing.split(',').map(s => s.trim()).filter(Boolean);
      const newIcons = [...usedIcons].filter(ic => !existingList.includes(ic));
      if (newIcons.length === 0) return m;
      const all = [...existingList, ...newIcons].sort();
      return `import {\n  ${all.join(', ')},\n} from "lucide-react"`;
    });
  } else {
    // Insert after last import line
    src = src.replace(/((?:import[^\n]+\n)+)/, (m) => {
      const sorted = [...usedIcons].sort();
      return m + `import { ${sorted.join(', ')} } from "lucide-react";\n`;
    });
  }

  fs.writeFileSync(filePath, src, 'utf8');
  console.log(`OK: ${filePath} — replaced ${replaced}, skipped ${skipped}, added icons: ${[...usedIcons].join(', ')}`);
});
