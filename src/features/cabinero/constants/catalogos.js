export const CAUSAS = [
  "Colisión con vehículo",
  "Colisión con objeto fijo",
  "Volcadura",
  "Robo total",
  "Robo parcial",
  "Incendio",
  "Daño por granizo",
  "Daño por inundación",
  "Atropellamiento",
  "Otro",
];

export const CIRCUNSTANCIAS = [
  "En movimiento",
  "Estacionado",
  "Maniobra de reversa",
  "Cruce de intersección",
  "Cambio de carril",
  "Vía rápida",
  "Zona urbana",
  "Carretera",
  "Estacionamiento privado",
  "Otra",
];

export const AJUSTADORES_FORM = [
  "Félix Hernández",
  "Luis Martínez",
  "Ana García",
  "Roberto Díaz",
  "Alicia Hernández Vargas",
];

export const TERCERO_VACIO = () => ({
  id: Date.now() + Math.random(),
  vehiculoDesc: "",
  vehiculoTipo: "",
  vehiculoColor: "",
  vehiculoModelo: "",
  vehiculoPlacas: "",
  vehiculoSerie: "",
  vehiculoMotor: "",
});
