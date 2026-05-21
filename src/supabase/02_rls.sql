-- ============================================================
-- COFISEM — Row Level Security (RLS)
-- Ejecuta DESPUÉS de 01_tablas.sql
-- ============================================================


-- ── Habilitar RLS en las tres tablas ─────────────────────────
ALTER TABLE clientes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE polizas   ENABLE ROW LEVEL SECURITY;


-- ── clientes: acceso completo para usuarios autenticados ─────
DROP POLICY IF EXISTS "clientes_auth_all" ON clientes;
CREATE POLICY "clientes_auth_all" ON clientes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ── vendedores: acceso completo para usuarios autenticados ───
DROP POLICY IF EXISTS "vendedores_auth_all" ON vendedores;
CREATE POLICY "vendedores_auth_all" ON vendedores
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ── polizas: acceso completo para usuarios autenticados ──────
DROP POLICY IF EXISTS "polizas_auth_all" ON polizas;
CREATE POLICY "polizas_auth_all" ON polizas
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── polizas: lectura pública para verificación por QR ────────
-- Permite que /verificar/:constancia funcione sin login
DROP POLICY IF EXISTS "polizas_anon_select" ON polizas;
CREATE POLICY "polizas_anon_select" ON polizas
  FOR SELECT
  TO anon
  USING (true);
