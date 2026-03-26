// ============================================================
// src/shared/constants/mockData.js
// Datos de ejemplo reutilizables — reemplazar con llamadas reales a Supabase
// ============================================================

export const CLIENTES_MOCK = [
  { id: 1, nombre: "Angel Ivan Ortega Chaverría",  rfc: "OACA900312HM",  telefono: "777 792 1225", email: "angel@mail.com",   polizas: 2, activo: true  },
  { id: 2, nombre: "María García López",            rfc: "GALM850601HM",  telefono: "777 100 3344", email: "maria@mail.com",   polizas: 1, activo: true  },
  { id: 3, nombre: "Roberto Díaz Ramos",            rfc: "DIRR780910HM",  telefono: "777 234 5678", email: "roberto@mail.com", polizas: 3, activo: true  },
  { id: 4, nombre: "Sofía Torres Ruiz",             rfc: "TORS920420HM",  telefono: "777 456 7890", email: "sofia@mail.com",   polizas: 1, activo: false },
  { id: 5, nombre: "Juan Pérez Salinas",            rfc: "PESJ881125HM",  telefono: "777 654 3210", email: "juan@mail.com",    polizas: 0, activo: true  },
  { id: 6, nombre: "Carmen López Vargas",           rfc: "LOVC760305HM",  telefono: "777 111 2233", email: "carmen@mail.com",  polizas: 1, activo: true  },
];

export const POLIZAS_MOCK = [
  { id: "3413241", asegurado: "Angel Ivan Ortega",  cobertura: "COBERTURA APP (UBER, DIDI)", vendedor: "Laura Rosher",  prima: 3142.80, vence: "13/03/2027", estatus: "Vigente",    forma: "Trimestral",  uso: "DIDI", placas: "TRAMITE"  },
  { id: "3413198", asegurado: "María García López", cobertura: "TAXI BÁSICA 2500",           vendedor: "Marco A. Cruz", prima: 2200.00, vence: "12/03/2027", estatus: "Vigente",    forma: "Contado",     uso: "TAXI", placas: "VRM-123A" },
  { id: "3413167", asegurado: "Roberto Díaz Ramos", cobertura: "SERV. PÚB. 50/50 GAMAN 2",  vendedor: "Laura Rosher",  prima: 2548.00, vence: "11/03/2027", estatus: "Vigente",    forma: "4 Parciales", uso: "TAXI", placas: "CHM-456B" },
  { id: "3411002", asegurado: "Carmen López",       cobertura: "TAXI BÁSICA 2500",           vendedor: "Carlos Soto",   prima: 2200.00, vence: "20/03/2026", estatus: "Por vencer", forma: "Contado",     uso: "TAXI", placas: "PQR-789C" },
];

export const VENDEDORES_TABLA_MOCK = [
  { id: 1, folio: "T0455", nombre: "Laura Rosher García",   telefono: "777 111 2233", email: "laura@cofisem.com",    polizasMes: 18, activo: true  },
  { id: 2, folio: "T0312", nombre: "Marco Antonio Cruz",    telefono: "777 444 5566", email: "marco@cofisem.com",    polizasMes: 12, activo: true  },
  { id: 3, folio: "T0289", nombre: "Carlos Soto Vargas",    telefono: "777 777 8899", email: "carlos@cofisem.com",   polizasMes: 9,  activo: true  },
  { id: 4, folio: "T0201", nombre: "Patricia Morales Ruiz", telefono: "777 200 3344", email: "patricia@cofisem.com", polizasMes: 0,  activo: false },
];

export const COTIZACIONES_MOCK = [
  { id: "COT-012601000014", cliente: "Juan Pérez",   cobertura: "TAXI BÁSICA 2500",          total: 2200.00, fecha: "17/03/2026 10:15", vendedor: "Marco A. Cruz", guardada: true },
  { id: "COT-012601000012", cliente: "Rosa Mendoza", cobertura: "SERV. PÚB. 50/50 GAMAN 2", total: 2548.00, fecha: "16/03/2026 16:30", vendedor: "Laura Rosher",  guardada: true },
  { id: "COT-012601000009", cliente: "Pedro Ramos",  cobertura: "COBERTURA APP (UBER, DIDI)",total: 3142.80, fecha: "15/03/2026 09:00", vendedor: "Carlos Soto",   guardada: true },
];

export const POLIZAS_DIA_MOCK = [
  { no: 1, aseguradora: "QUALITAS", poliza: "3413241", fechaEmision: "13/03/2026", folio: "T0455", vendedor: "LAURA ROSHER",  asegurado: "Angel Ivan",   vale: 400,  primaAnual: 8385.69, primaNeta: 6318.92, primaPrimerPago: 2679.33, cobertura: "AMPLIA",  placas: "TRAMITE",  uso: "DIDI", tipo: "COCHE", no_pago: 1, formaPago: "TRIMESTRAL",  efectivo: 2679.33, cheque: 0, tdc: 0, autorizacion: "", polPendPago: 0, observaciones: "COMISION PAGADA POLIZA 960972454", fotos: "", factura: "", tCirc: "", identif: "", polAnt: "", otro: "" },
  { no: 2, aseguradora: "QUALITAS", poliza: "3413198", fechaEmision: "14/03/2026", folio: "T0312", vendedor: "MARCO A. CRUZ", asegurado: "María García", vale: 0,    primaAnual: 5500.00, primaNeta: 4200.00, primaPrimerPago: 2200.00, cobertura: "BÁSICA", placas: "VRM-123",  uso: "TAXI", tipo: "COCHE", no_pago: 1, formaPago: "CONTADO",    efectivo: 2200.00, cheque: 0, tdc: 0, autorizacion: "", polPendPago: 0, observaciones: "",                              fotos: "✓", factura: "", tCirc: "",  identif: "✓", polAnt: "✓", otro: "" },
  { no: 3, aseguradora: "GNP",      poliza: "3413167", fechaEmision: "14/03/2026", folio: "T0455", vendedor: "LAURA ROSHER",  asegurado: "Roberto Díaz", vale: 220,  primaAnual: 6200.00, primaNeta: 4900.00, primaPrimerPago: 2548.00, cobertura: "PÚB 50", placas: "CHM-456",  uso: "TAXI", tipo: "COCHE", no_pago: 1, formaPago: "4 PARCIALES", efectivo: 2328.00, cheque: 0, tdc: 0, autorizacion: "", polPendPago: 0, observaciones: "",                              fotos: "✓", factura: "", tCirc: "✓", identif: "✓", polAnt: "",  otro: "" },
];
