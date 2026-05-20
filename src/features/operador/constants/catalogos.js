export const ESTADOS_MX = [
  "Aguascalientes","Baja California","Baja California Sur","Campeche","Chiapas","Chihuahua",
  "Ciudad de México","Coahuila","Colima","Durango","Estado de México","Guanajuato","Guerrero",
  "Hidalgo","Jalisco","Michoacán","Morelos","Nayarit","Nuevo León","Oaxaca","Puebla","Querétaro",
  "Quintana Roo","San Luis Potosí","Sinaloa","Sonora","Tabasco","Tamaulipas","Tlaxcala",
  "Veracruz","Yucatán","Zacatecas",
];

export const COLORES_VEHICULO = [
  "Blanco","Negro","Gris","Plata","Rojo","Azul","Verde","Amarillo","Naranja","Café","Beige","Otro",
];

export const CATALOGO_VEHICULOS = {
  Nissan: {
    Sedán:    ["Tsuru GSI","Sentra Sense","Versa Advance","Altima Exclusive"],
    SUV:      ["X-Trail Advance","Kicks Sense","Pathfinder"],
    Hatchback:["March Sense","Note SR"],
    Pickup:   ["NP300 Frontier","Frontier Pro-4X"],
  },
  Toyota: {
    Sedán:    ["Yaris Core","Corolla LE","Camry SE"],
    SUV:      ["RAV4 XLE","Highlander LE","Land Cruiser"],
    Hatchback:["Yaris Hatchback"],
    Pickup:   ["Hilux SR","Tacoma TRD"],
  },
  Volkswagen: {
    Sedán:    ["Vento Comfortline","Jetta Trendline","Passat Highline"],
    SUV:      ["Tiguan Comfortline","Teramont"],
    Hatchback:["Polo Comfortline","Gol Trendline"],
  },
  Chevrolet: {
    Sedán:    ["Aveo LS","Cavalier LT","Malibu LT"],
    SUV:      ["Tracker LT","Equinox LT","Captiva"],
    Hatchback:["Spark LT"],
    Pickup:   ["S10 Max","Silverado"],
  },
  Honda: {
    Sedán: ["City LX","Civic Turbo","Accord Sport"],
    SUV:   ["HR-V Prime","CR-V Touring"],
  },
};

export const MARCAS = Object.keys(CATALOGO_VEHICULOS);

export const CLIENTES_MOCK_NAMES = [
  "Angel Ivan Ortega Chaverría","María García López","Roberto Díaz Ramos",
  "Sofía Torres Ruiz","Juan Pérez Salinas","Carmen López Vargas",
];

export const VENDEDORES_MOCK_NAMES = ["ADMINISTRADOR","Laura Rosher","Marco A. Cruz","Carlos Soto"];

export const CONCESIONARIOS_MOCK = {
  "Angel Ivan Ortega Chaverría": [
    { id: "C001", label: "CON-MOR-1042 — Cuernavaca" },
    { id: "C002", label: "CON-MOR-1043 — Cuernavaca" },
  ],
  "María García López":  [{ id: "C003", label: "CON-JTP-0217 — Jiutepec" }],
  "Roberto Díaz Ramos":  [
    { id: "C004", label: "CON-TMX-0089 — Temixco" },
    { id: "C005", label: "CON-TMX-0090 — Temixco" },
  ],
  "Sofía Torres Ruiz":   [],
  "Juan Pérez Salinas":  [{ id: "C006", label: "CON-MOR-2001 — Cuernavaca" }],
  "Carmen López Vargas": [],
};
