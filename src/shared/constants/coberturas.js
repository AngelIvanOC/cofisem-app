// ============================================================
// src/shared/constants/coberturas.js
// Catálogo de coberturas — fuente única de verdad para TODOS los roles
// ============================================================

export const COBERTURAS_CATALOGO = {
  "TAXI BÁSICA 2500": {
    uso: "SERVICIO PÚBLICO",
    coberturas: [
      { desc: "Resp. Civil a Terceros Bienes y Personas",   monto: "$1,700,000.00",       ded: "0.00", prima: 572.85 },
      { desc: "Resp. Civil Complementaria Personas",        monto: "$3,000,000.00",       ded: "0.00", prima: 105.18 },
      { desc: "Gastos Médicos Conductor y Familiares",      monto: "$50,000.00",          ded: "0.00", prima: 154.83 },
      { desc: "Muerte de Conductor x/AA",                   monto: "$50,000.00",          ded: "0.00", prima: 69.84  },
      { desc: "Gastos Legales",                              monto: "AMPARADOS",           ded: "0.00", prima: 300.75 },
      { desc: "Resp. Civil Viajero",                         monto: "5,000 UMAS/Pasajero", ded: "0.00", prima: 293.09 },
    ],
    primaNeta: 1496.55,
    derechos: 400.00,
    iva: 303.45,
    total: 2200.00,
    formasPago: ["CONTADO", "2 PARCIALES", "4 PARCIALES"],
  },
  "TAXI BÁSICA PAGOS 2700": {
    uso: "SERVICIO PÚBLICO",
    coberturas: [
      { desc: "Resp. Civil a Terceros Bienes y Personas",   monto: "$1,700,000.00",       ded: "0.00", prima: 620.00 },
      { desc: "Resp. Civil Complementaria Personas",        monto: "$3,000,000.00",       ded: "0.00", prima: 115.00 },
      { desc: "Gastos Médicos Conductor y Familiares",      monto: "$50,000.00",          ded: "0.00", prima: 170.00 },
      { desc: "Muerte de Conductor x/AA",                   monto: "$50,000.00",          ded: "0.00", prima: 75.00  },
      { desc: "Gastos Legales",                              monto: "AMPARADOS",           ded: "0.00", prima: 310.00 },
      { desc: "Resp. Civil Viajero",                         monto: "5,000 UMAS/Pasajero", ded: "0.00", prima: 310.00 },
    ],
    primaNeta: 1600.00,
    derechos: 400.00,
    iva: 320.00,
    total: 2320.00,
    formasPago: ["CONTADO", "2 PARCIALES", "4 PARCIALES", "6 PARCIALES"],
  },
  "SERV. PÚB. 50/50 GAMAN 2": {
    uso: "SERVICIO PÚBLICO",
    coberturas: [
      { desc: "Resp. Civil a Terceros Bienes y Personas",   monto: "$2,000,000.00",       ded: "0.00", prima: 680.00 },
      { desc: "Resp. Civil Complementaria Personas",        monto: "$3,500,000.00",       ded: "0.00", prima: 130.00 },
      { desc: "Gastos Médicos Conductor y Familiares",      monto: "$80,000.00",          ded: "0.00", prima: 190.00 },
      { desc: "Muerte de Conductor x/AA",                   monto: "$80,000.00",          ded: "0.00", prima: 90.00  },
      { desc: "Gastos Legales",                              monto: "AMPARADOS",           ded: "0.00", prima: 350.00 },
      { desc: "Resp. Civil Viajero",                         monto: "5,000 UMAS/Pasajero", ded: "0.00", prima: 350.00 },
    ],
    primaNeta: 1790.00,
    derechos: 400.00,
    iva: 358.00,
    total: 2548.00,
    formasPago: ["CONTADO", "4 PARCIALES"],
  },
  "COBERTURA APP (UBER, DIDI)": {
    uso: "APP",
    coberturas: [
      { desc: "Resp. Civil a Terceros Bienes y Personas",   monto: "$3,000,000.00",       ded: "0.00", prima: 850.00 },
      { desc: "Resp. Civil Complementaria Personas",        monto: "$4,000,000.00",       ded: "0.00", prima: 220.00 },
      { desc: "Gastos Médicos Conductor y Familiares",      monto: "$100,000.00",         ded: "0.00", prima: 250.00 },
      { desc: "Muerte de Conductor x/AA",                   monto: "$100,000.00",         ded: "0.00", prima: 120.00 },
      { desc: "Gastos Legales",                              monto: "AMPARADOS",           ded: "0.00", prima: 400.00 },
      { desc: "Resp. Civil Viajero",                         monto: "5,000 UMAS/Pasajero", ded: "0.00", prima: 420.00 },
    ],
    primaNeta: 2260.00,
    derechos: 450.00,
    iva: 432.80,
    total: 3142.80,
    formasPago: ["CONTADO", "4 PARCIALES", "TRIMESTRAL"],
  },
};

export const TIPOS_COBERTURA = Object.keys(COBERTURAS_CATALOGO);
