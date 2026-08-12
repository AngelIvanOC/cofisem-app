-- ============================================================
-- COFISEM — Color por oficina
-- Pega este script en el SQL Editor de Supabase y haz clic en "Run".
-- Es seguro ejecutarlo varias veces.
-- ============================================================

ALTER TABLE oficinas ADD COLUMN IF NOT EXISTS color text;

COMMENT ON COLUMN oficinas.color IS 'Color hexadecimal (#RRGGBB) asignado a la oficina, usado para identificarla en las gráficas y tablas de Detalle de Primas.';
