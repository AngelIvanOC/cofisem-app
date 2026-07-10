// ============================================================
// src/features/ajustador/croquis/iconCatalog.js
// Catálogo de elementos disponibles en el editor de croquis.
// ============================================================

export const CATEGORIAS = [
  {
    id: "vehiculos",
    label: "Vehículos",
    items: [
      { tipo: "sedan", label: "Sedán", colores: ["#2563eb", "#dc2626", "#111827", "#f8fafc", "#6b7280"] },
      { tipo: "suv", label: "SUV", colores: ["#374151", "#1d4ed8", "#7c2d12", "#f8fafc"] },
      { tipo: "pickup", label: "Pickup", colores: ["#b91c1c", "#1f2937", "#f8fafc", "#0f766e"] },
      { tipo: "moto", label: "Motocicleta", colores: ["#111827", "#dc2626", "#2563eb"] },
      { tipo: "camion", label: "Camión de carga", colores: ["#4b5563", "#1d4ed8", "#b91c1c"] },
      { tipo: "autobus", label: "Autobús", colores: ["#0ea5e9", "#16a34a", "#f97316"] },
      { tipo: "ambulancia", label: "Ambulancia", colores: null },
    ],
  },
  {
    id: "senalamientos",
    label: "Señalamientos",
    items: [
      { tipo: "alto", label: "Alto", colores: null },
      { tipo: "ceda", label: "Ceda el paso", colores: null },
      { tipo: "semaforo", label: "Semáforo", colores: null },
      { tipo: "cruce_peatonal", label: "Cruce peatonal", colores: null },
      { tipo: "curva", label: "Curva peligrosa", colores: null },
    ],
  },
  {
    id: "elementos",
    label: "Elementos de vía",
    items: [
      { tipo: "arbol", label: "Árbol", colores: null },
      { tipo: "poste", label: "Poste", colores: null },
      { tipo: "cono", label: "Cono", colores: null },
      { tipo: "hidrante", label: "Hidrante", colores: null },
    ],
  },
  {
    id: "efectos",
    label: "Efectos",
    items: [
      { tipo: "flecha", label: "Flecha de dirección", colores: ["#111827", "#dc2626", "#2563eb"] },
      { tipo: "impacto", label: "Punto de impacto", colores: null },
      { tipo: "derrape", label: "Marca de derrape", colores: null },
      { tipo: "texto", label: "Texto", colores: null },
    ],
  },
];

export const CATALOGO_POR_TIPO = Object.fromEntries(
  CATEGORIAS.flatMap((cat) => cat.items.map((item) => [item.tipo, item]))
);

export const PLANTILLAS = [
  { id: "cruce", label: "Cruce" },
  { id: "recta", label: "Recta" },
  { id: "original", label: "Mi diseño" },
];
