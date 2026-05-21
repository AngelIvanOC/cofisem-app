-- ============================================================
-- COFISEM — Migración de tablas
-- Pega este script COMPLETO en el SQL Editor de Supabase
-- y haz clic en "Run". Es seguro ejecutarlo varias veces.
-- ============================================================


-- ── 1. TABLA: clientes ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  id          bigint        PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nombre      text          NOT NULL,
  apellido    text,
  rfc         text          NOT NULL,
  curp        text,
  telefono    text,
  email       text,
  direccion   text,
  colonia     text,
  ciudad      text,
  estado      text,
  cp          text,
  activo      boolean       NOT NULL DEFAULT true,
  creado_por  uuid          REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz   NOT NULL DEFAULT now()
);

-- Agrega columnas que podrían faltar si la tabla ya existía
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS apellido   text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS curp       text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS colonia    text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS ciudad     text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS estado     text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cp         text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS activo     boolean NOT NULL DEFAULT true;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS creado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL;


-- ── 2. TABLA: vendedores ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendedores (
  id          bigint        PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nombre      text          NOT NULL,
  apellido    text,
  telefono    text,
  email       text,
  oficina     text,
  codigo      text,
  activo      boolean       NOT NULL DEFAULT true,
  creado_por  uuid          REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS apellido   text;
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS oficina    text;
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS codigo     text;
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS activo     boolean NOT NULL DEFAULT true;
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS creado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL;


-- ── 3. TABLA: polizas ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS polizas (
  id                 bigint       PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  numero_poliza      text,
  constancia         text         UNIQUE,

  -- Relaciones
  cliente_id         bigint       REFERENCES clientes(id)  ON DELETE RESTRICT,
  vendedor_id        bigint       REFERENCES vendedores(id) ON DELETE SET NULL,

  -- Vehículo
  marca              text,
  modelo             text,
  anio               int,
  placas             text,
  num_serie          text,
  num_motor          text,
  cod_amis           text,
  capacidad          text         DEFAULT '4 OCUPANTES',
  version            text,
  uso                text         DEFAULT 'SERVICIO PUBLICO',
  tipo_servicio      text         DEFAULT 'TAXI',

  -- Póliza
  aseguradora        text,
  tipo_poliza        text,
  cobertura          text,

  -- Prima
  prima_neta         numeric(10,2),
  prima_total        numeric(10,2),
  forma_pago         text,
  descuento          numeric(10,2) DEFAULT 0,
  recargo            numeric(10,2) DEFAULT 0,
  derechos           numeric(10,2) DEFAULT 400,
  iva                numeric(10,2),
  en_letras          text,

  -- Vigencia
  fecha_inicio       date,
  fecha_fin          date,
  hora_inicio        text         DEFAULT '00:00:00 hrs.',
  hora_fin           text         DEFAULT '23:59:59 hrs.',
  emision_hora       text,

  -- Datos del conductor (para el PDF)
  conductor_habitual text,
  conductor_sexo     text,
  conductor_edad     text,

  -- Extras
  cp_asegurado       text,
  uso_tarifario      text         DEFAULT '15',

  -- Control
  estatus            text         NOT NULL DEFAULT 'VIGENTE',
  creado_por         uuid         REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at         timestamptz  NOT NULL DEFAULT now()
);

-- Agrega columnas que podrían faltar si la tabla ya existía
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS numero_poliza      text;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS constancia         text;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS cliente_id         bigint REFERENCES clientes(id)  ON DELETE RESTRICT;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS vendedor_id        bigint REFERENCES vendedores(id) ON DELETE SET NULL;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS marca              text;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS modelo             text;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS anio               int;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS placas             text;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS num_serie          text;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS num_motor          text;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS cod_amis           text;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS capacidad          text DEFAULT '4 OCUPANTES';
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS version            text;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS uso                text DEFAULT 'SERVICIO PUBLICO';
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS tipo_servicio      text DEFAULT 'TAXI';
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS aseguradora        text;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS tipo_poliza        text;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS cobertura          text;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS prima_neta         numeric(10,2);
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS prima_total        numeric(10,2);
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS forma_pago         text;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS descuento          numeric(10,2) DEFAULT 0;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS recargo            numeric(10,2) DEFAULT 0;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS derechos           numeric(10,2) DEFAULT 400;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS iva                numeric(10,2);
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS en_letras          text;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS fecha_inicio       date;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS fecha_fin          date;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS hora_inicio        text DEFAULT '00:00:00 hrs.';
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS hora_fin           text DEFAULT '23:59:59 hrs.';
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS emision_hora       text;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS conductor_habitual text;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS conductor_sexo     text;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS conductor_edad     text;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS cp_asegurado       text;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS uso_tarifario      text DEFAULT '15';
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS estatus            text NOT NULL DEFAULT 'VIGENTE';
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS creado_por         uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Restricción UNIQUE en constancia (por si la tabla ya existía sin ella)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'polizas_constancia_key'
      AND conrelid = 'polizas'::regclass
  ) THEN
    ALTER TABLE polizas ADD CONSTRAINT polizas_constancia_key UNIQUE (constancia);
  END IF;
END $$;


-- ── 4. ÍNDICES de rendimiento ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_polizas_constancia   ON polizas (constancia);
CREATE INDEX IF NOT EXISTS idx_polizas_cliente_id   ON polizas (cliente_id);
CREATE INDEX IF NOT EXISTS idx_polizas_estatus      ON polizas (estatus);
CREATE INDEX IF NOT EXISTS idx_polizas_created_at   ON polizas (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clientes_rfc         ON clientes (rfc);
CREATE INDEX IF NOT EXISTS idx_vendedores_oficina   ON vendedores (oficina);
