export const STATUS = {
  Vigente:      "bg-emerald-50 text-emerald-700",
  "Por vencer": "bg-amber-50 text-amber-700",
  Cancelada:    "bg-gray-100 text-gray-500",
};

export const ULTIMAS = [
  { poliza: "3413241", asegurado: "Angel Ivan Ortega",   cobertura: "APP (UBER/DIDI)",    prima: "$3,142", hora: "09:15", estatus: "Vigente"    },
  { poliza: "3413198", asegurado: "María García López",  cobertura: "TAXI BÁSICA 2500",   prima: "$2,200", hora: "10:42", estatus: "Vigente"    },
  { poliza: "3413167", asegurado: "Roberto Díaz Ramos",  cobertura: "SERV. PÚB. GAMAN",  prima: "$2,548", hora: "11:30", estatus: "Vigente"    },
  { poliza: "3411002", asegurado: "Carmen López Vargas", cobertura: "TAXI BÁSICA 2500",   prima: "$2,200", hora: "13:05", estatus: "Por vencer" },
];

export const COTIZACIONES_DASH = [
  { id: "COT-0341", cliente: "Juan Pérez",    cobertura: "TAXI BÁSICA 2500",  prima: "$2,200", fecha: "Hoy 10:15"   },
  { id: "COT-0340", cliente: "Rosa Mendoza",  cobertura: "SERV. PÚB. 50/50", prima: "$2,548", fecha: "Ayer 16:30"  },
  { id: "COT-0339", cliente: "Pedro Ramos",   cobertura: "APP (UBER/DIDI)",   prima: "$3,142", fecha: "15/03 09:00" },
];

export const POR_VENCER = [
  { poliza: "3411002", asegurado: "Carmen López",   dias: 3 },
  { poliza: "3410888", asegurado: "José Martínez",  dias: 5 },
  { poliza: "3410755", asegurado: "Ana Gutiérrez",  dias: 7 },
];

export const SPARK_POLIZAS = [3, 5, 4, 7, 6, 8, 8];
export const SPARK_COBRO   = [4200, 6800, 5500, 9200, 7800, 11400, 13573];
