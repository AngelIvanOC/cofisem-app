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

// Lookup inverso: cualquier ID de variante → su familia
export const ID_A_FAMILIA = FAMILIAS.reduce((acc, fam) => {
  [fam.contado, fam.parciales, fam.gestor].forEach(id => { acc[id] = fam; });
  return acc;
}, {});

// IDs que NO deben aparecer en la lista del paso 1
export const IDS_OCULTOS = new Set(
  FAMILIAS.flatMap(fam =>
    [fam.parciales, fam.gestor].filter(id => id !== fam.raiz)
  )
);

// Resuelve qué cobertura real usar según (forma de pago, tipo de cliente).
// Para coberturas fuera de una familia, mantiene la lógica legada de id_par.
export function resolverCobertura(cobActual, formaPago, esGestor, todasCoberturas) {
  if (!cobActual) return null;

  const familia = ID_A_FAMILIA[cobActual.id];
  if (familia) {
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
