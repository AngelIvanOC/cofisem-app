import xlsx from 'xlsx';
import fs from 'fs';

const wb = xlsx.readFile('src/data/AMIS.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];

const rows = xlsx.utils
  .sheet_to_json(ws, { header: 1 })
  .slice(1)
  .filter(r => r[2] && r[4] && r[5] && r[8]);

const esc = v =>
  v == null
    ? 'NULL'
    : "'" + String(v).replace(/'/g, "''") + "'";

const CONFLICT = 'ON CONFLICT (cve, anio) DO NOTHING';

const header =
  'INSERT INTO public.vehiculos_amis (cve, mr, marca, tipo, dc, dl, anio) VALUES\n';

const vals = rows.map(r =>
  '(' +
  [
    r[2],
    esc(r[3]),
    esc(r[4]),
    esc(r[5]),
    esc(r[6]),
    esc(r[7]),
    r[8]
  ].join(',') +
  ')'
);

const BLOQUE = 500;
const partes = [];

for (let i = 0; i < vals.length; i += BLOQUE) {
  partes.push(vals.slice(i, i + BLOQUE).join(',\n'));
}

const sql =
  partes.map(p => header + p + '\n' + CONFLICT + ';').join('\n') +
  '\n';

fs.writeFileSync(
  'src/data/vehiculos_amis.sql',
  sql
);

console.log(
  'Generado:',
  rows.length,
  'registros en el SQL'
);