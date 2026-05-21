# Migraciones de Base de Datos — COFISEM

Aplica estos scripts en **orden** desde el SQL Editor de Supabase.

---

## Paso 1 — Abrir el SQL Editor

1. Ve a [supabase.com](https://supabase.com) → Tu proyecto
2. Barra izquierda → **SQL Editor**
3. Haz clic en **+ New query**

---

## Paso 2 — Ejecutar `01_tablas.sql`

1. Copia todo el contenido de `01_tablas.sql`
2. Pégalo en el SQL Editor
3. Haz clic en **Run** (▶)
4. Debes ver: `Success. No rows returned`

Esto crea/actualiza las tablas:
- **`clientes`** — con `apellido`, `curp`, `colonia`, `ciudad`, `estado`, `cp`, `activo`
- **`vendedores`** — con `apellido`, `oficina`, `codigo`, `activo`
- **`polizas`** — con `constancia`, `num_serie`, `num_motor`, `cod_amis`, `prima_neta`, `derechos`, `iva`, `en_letras`, `hora_inicio`, `hora_fin`, `emision_hora`, `uso_tarifario`, `conductor_*`, y más

---

## Paso 3 — Ejecutar `02_rls.sql`

1. Abre una nueva query (+ New query)
2. Copia todo el contenido de `02_rls.sql`
3. Pégalo y haz clic en **Run**

Esto configura:
- Usuarios autenticados → acceso completo a `clientes`, `vendedores`, `polizas`
- Usuarios anónimos → solo lectura en `polizas` (para que el QR de verificación funcione sin login)

---

## Paso 4 — Verificar la tabla `polizas`

Abre una nueva query y ejecuta esto para confirmar que todas las columnas existen:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'polizas'
ORDER BY ordinal_position;
```

Debes ver al menos estas columnas:

| Columna | Tipo |
|---|---|
| id | bigint |
| numero_poliza | text |
| constancia | text |
| cliente_id | bigint |
| vendedor_id | bigint |
| marca | text |
| modelo | text |
| anio | integer |
| placas | text |
| num_serie | text |
| num_motor | text |
| cod_amis | text |
| capacidad | text |
| version | text |
| uso | text |
| tipo_servicio | text |
| aseguradora | text |
| tipo_poliza | text |
| cobertura | text |
| prima_neta | numeric |
| prima_total | numeric |
| forma_pago | text |
| descuento | numeric |
| recargo | numeric |
| derechos | numeric |
| iva | numeric |
| en_letras | text |
| fecha_inicio | date |
| fecha_fin | date |
| hora_inicio | text |
| hora_fin | text |
| emision_hora | text |
| conductor_habitual | text |
| conductor_sexo | text |
| conductor_edad | text |
| cp_asegurado | text |
| uso_tarifario | text |
| estatus | text |
| creado_por | uuid |
| created_at | timestamptz |

---

## Paso 5 — Verificar RLS

```sql
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('clientes', 'vendedores', 'polizas')
ORDER BY tablename, policyname;
```

Debes ver 4 políticas:
- `clientes_auth_all` — authenticated, ALL
- `vendedores_auth_all` — authenticated, ALL
- `polizas_auth_all` — authenticated, ALL
- `polizas_anon_select` — anon, SELECT

---

## Errores comunes y soluciones

### `column polizas.constancia does not exist`
→ Ejecuta `01_tablas.sql` de nuevo.

### `new row violates row-level security policy`
→ El usuario no está autenticado, o ejecuta `02_rls.sql` de nuevo.

### `violates foreign key constraint`
→ El `cliente_id` o `vendedor_id` no existe en su tabla. Crea primero el cliente/vendedor.

### `duplicate key value violates unique constraint "polizas_constancia_key"`
→ Ya existe una póliza con esa constancia (no debería ocurrir normalmente).

---

## Notas

- Estos scripts son **idempotentes** — puedes ejecutarlos varias veces sin problema.
- El campo `creado_por` guarda el UUID del usuario de Supabase Auth que creó el registro.
- La columna `constancia` sigue el formato `DDMMYYseqglobal-seqcliente`, ejemplo: `200526000000001-01`.
