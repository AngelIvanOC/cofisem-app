// Familias de coberturas vinculadas: grupos de 2-3 registros de BD que
// representan UN mismo paquete con variantes de precio según forma de pago
// y tipo de cliente (normal vs gestor).
//
// raiz      → ID que aparece en la lista del paso 1 (lo que el operador selecciona)
// contado   → ID a usar cuando: normal + CONTADO
// parciales → ID a usar cuando: normal + 4 PARCIALES
// gestor    → ID a usar cuando: gestor (cualquier forma de pago)
//
// Los IDs de "parciales" y "gestor" se ocultan de la lista del paso 1.

export const FAMILIAS = [
  {
    nombre:    "Paquete Base Gaman",
    raiz:      "7951652e-c3fe-49ec-a65f-7ed35317c46c",
    contado:   "7951652e-c3fe-49ec-a65f-7ed35317c46c",
    parciales: "d6d0ca76-8192-4b7f-a4b9-b702c74e4b4c",
    gestor:    "5d1860b6-ed72-442a-9a31-2a52d12d2b37",
  },
];

// ── Oficinas con esquema de cobro propio ──────────────────────────────────
// Algunas oficinas usan SU PROPIA cobertura (una fila de `coberturas` con
// `oficina_id` = <id de la oficina>) para toda la familia, y NO muestran el
// switch Normal/Gestor.
//
// Hoy: COFISEM JIUTEPEC (oficina_id 5). Su cobertura propia es un clon de la
// raíz de $2,500 pero con `regla_pago = 'COSTOS_DIVIDIDOS'`, de modo que:
//   • CONTADO      → un pago de $2,500
//   • 4 PARCIALES  → 4 pagos IGUALES de $625 (no 799 + 3×625)
// El resto de oficinas NO se ve afectado: siguen con 799 + 3×625 en normal.
//
// `coberturaId` es el UUID conocido del clon (ruta rápida). Si el admin le
// cambia el precio, ese UUID cambia (ver AdminConfiguracion → "Nueva versión"),
// por eso `coberturaPropiaOficina` también sabe resolverla por `oficina_id`.
export const OFICINAS_COBERTURA_PROPIA = {
  5: {
    familiaRaiz:     "7951652e-c3fe-49ec-a65f-7ed35317c46c",
    coberturaId:     "694af1a1-b88a-4c0f-8695-138982a8f9ec",
    ocultarTipoCuota: true,
  },
};

// Lookup inverso: cualquier ID de variante → su familia
export const ID_A_FAMILIA = FAMILIAS.reduce((acc, fam) => {
  [fam.contado, fam.parciales, fam.gestor].forEach(id => { acc[id] = fam; });
  return acc;
}, {});
// Las coberturas propias de oficina también pertenecen a su familia raíz,
// para que el paso 1 las reconozca como "la familia está seleccionada" y para
// que `resolverCobertura` no las trate como coberturas sueltas.
Object.values(OFICINAS_COBERTURA_PROPIA).forEach(cfg => {
  const fam = FAMILIAS.find(f => f.raiz === cfg.familiaRaiz);
  if (fam && cfg.coberturaId) ID_A_FAMILIA[cfg.coberturaId] = fam;
});

// IDs que NO deben aparecer en la lista del paso 1
export const IDS_OCULTOS = new Set([
  ...FAMILIAS.flatMap(fam =>
    [fam.parciales, fam.gestor].filter(id => id !== fam.raiz)
  ),
  ...Object.values(OFICINAS_COBERTURA_PROPIA)
    .map(cfg => cfg.coberturaId)
    .filter(Boolean),
]);

// Devuelve la cobertura propia de una oficina (objeto completo de
// `todasCoberturas`) o null si la oficina no tiene esquema propio o el
// catálogo aún no carga. Resuelve 1º por UUID conocido y 2º por `oficina_id`
// (así sobrevive a un cambio de precio hecho desde el panel de admin, que
// genera un UUID nuevo pero conserva `oficina_id`).
export function coberturaPropiaOficina(oficinaId, todasCoberturas) {
  const cfg = OFICINAS_COBERTURA_PROPIA[oficinaId];
  if (!cfg) return null;
  const lista = todasCoberturas ?? [];
  return (
    lista.find(c => c.id === cfg.coberturaId) ||
    lista.find(c => c.oficina_id === oficinaId) ||
    null
  );
}

// Resuelve qué cobertura real usar según (forma de pago, tipo de cliente, oficina).
// Para coberturas fuera de una familia, mantiene la lógica legada de id_par.
export function resolverCobertura(cobActual, formaPago, esGestor, todasCoberturas, oficinaId = null) {
  if (!cobActual) return null;

  const familia = ID_A_FAMILIA[cobActual.id];
  if (familia) {
    // Oficina con cobertura propia: TODA la familia usa esa fila,
    // sin importar la forma de pago ni el tipo de cuota.
    const cfg = OFICINAS_COBERTURA_PROPIA[oficinaId];
    if (cfg && cfg.familiaRaiz === familia.raiz) {
      const propia = coberturaPropiaOficina(oficinaId, todasCoberturas);
      if (propia) return propia;
      // Catálogo aún no carga: no degradar a la cobertura equivocada.
      return cobActual;
    }

    const targetId = esGestor
      ? familia.gestor
      : formaPago === "CONTADO"
        ? familia.contado
        : familia.parciales;
    if (targetId === cobActual.id) return cobActual;
    return todasCoberturas.find(c => c.id === targetId) ?? cobActual;
  }

  return cobActual;
}
