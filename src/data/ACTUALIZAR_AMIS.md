# Actualizar catálogo AMIS de vehículos

## Cuando llegue una nueva versión del Excel AMIS

### Requisitos previos
- Node.js instalado
- Paquete `xlsx` instalado globalmente (`npm install -g xlsx`)
- `psql` instalado (ya está en esta máquina)
- Cadena de conexión a Supabase (Settings → Database → URI)

---

### Paso 0 — Solo la primera vez: restricción UNIQUE (ya ejecutada)

Esto garantiza que nunca se duplique un CVE con el mismo año.
Ejecuta **una sola vez** en el SQL Editor de Supabase:

```sql
ALTER TABLE public.vehiculos_amis
  ADD CONSTRAINT vehiculos_amis_cve_anio_key UNIQUE (cve, anio);
```

Si ya existe, Supabase lo dirá y puedes ignorar el error.

---

### Paso 1 — Coloca el nuevo Excel

Pon el archivo en esta carpeta con el nombre exacto:
```
src/data/AMIS.xlsx
```

Las columnas deben seguir el mismo formato:
- A, B → ignorar
- C (CVE) → código AMIS numérico
- D (MR) → abreviatura de marca
- E (Marca) → nombre completo de la marca
- F (Tipo) → modelo del vehículo
- G (Descripcion) → descripción corta (versión)
- H (Descripcion) → descripción larga (se guarda en polizas.descripcion)
- I (MOD) → año del vehículo

---

### Paso 2 — Genera el SQL

Abre una terminal en la raíz del proyecto y ejecuta:

```bash
node -e "
const x=require('xlsx');
const fs=require('fs');
const wb=x.readFile('src/data/AMIS.xlsx');
const ws=wb.Sheets[wb.SheetNames[0]];
const rows=x.utils.sheet_to_json(ws,{header:1}).slice(1).filter(r=>r[2]&&r[4]&&r[5]&&r[8]);
const esc=v=>v==null?'NULL':\"'\"+ String(v).replace(/'/g,\"''\")+ \"'\";
const CONFLICT='ON CONFLICT (cve, anio) DO NOTHING';
const header='INSERT INTO public.vehiculos_amis (cve, mr, marca, tipo, dc, dl, anio) VALUES\n';
const vals=rows.map(r=>'('+[r[2],esc(r[3]),esc(r[4]),esc(r[5]),esc(r[6]),esc(r[7]),r[8]].join(',')+')');
const BLOQUE=500;
const partes=[];
for(let i=0;i<vals.length;i+=BLOQUE) partes.push(vals.slice(i,i+BLOQUE).join(',\n'));
const sql=partes.map(p=>header+p+'\n'+CONFLICT+';').join('\n')+'\n';
fs.writeFileSync('src/data/vehiculos_amis.sql', sql);
console.log('Generado:', rows.length, 'registros en el SQL');
"
```

El SQL resultante usa `ON CONFLICT (cve, anio) DO NOTHING`, lo que significa:
- **CVE + año ya existe** → se ignora silenciosamente (no sobreescribe)
- **CVE + año nuevo** → se inserta (aunque el CVE ya exista en otro año)
- **CVE completamente nuevo** → se inserta

---

### Paso 3 — Carga a la base de datos

```bash
psql "postgresql://postgres:TU_PASSWORD@db.dwozudsdprnlgimluzup.supabase.co:5432/postgres" -f "src/data/vehiculos_amis.sql"
```

Verás `INSERT 0 N` donde N puede ser menor al total del Excel — eso es correcto,
significa que esos registros ya existían y fueron omitidos.

> **Nunca hagas TRUNCATE de esta tabla.** Las pólizas emitidas dependen de los
> registros existentes para consultar datos del vehículo. Solo se agregan filas,
> nunca se borran.

---

### Paso 4 — Limpieza

Borra los archivos temporales:
```
src/data/AMIS.xlsx
src/data/vehiculos_amis.sql
```

---

### Notas importantes

- El catálogo AMIS es **solo de append** (agregar). Nunca se trunca ni se borran filas.
- El caché en memoria de `vehiculos.js` se limpia solo al recargar la app — no se necesita ningún cambio en el código.
- Las pólizas ya emitidas no se ven afectadas por nuevas entradas en el catálogo.
