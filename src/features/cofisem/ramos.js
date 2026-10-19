// Ramo de la póliza COFISEM (polizas_cofisem.ramo). AUTOS es lo de siempre
// (vehículo, tipo/uso/servicio, fotos/factura/T. circulación). OTROS son
// pólizas sin vehículo; su cobertura es el producto y define la comisión
// (comision_reglas ambito 'RAMO', clave = cobertura).
export const RAMO_AUTOS = "AUTOS";
export const RAMO_OTROS = "OTROS";

export const COBERTURAS_OTROS_RAMOS = [
  "GASTOS MÉDICOS MAYORES",
  "VIDA",
  "DAÑOS",
];

export const esOtrosRamos = (p) => p?.ramo === RAMO_OTROS;

// Aseguradoras que solo venden autos: el ramo queda fijo en AUTOS.
export const ASEGURADORAS_SOLO_AUTOS = ["QUALITAS", "ANA", "GAMAN"];
export const esAseguradoraSoloAutos = (aseguradora) =>
  ASEGURADORAS_SOLO_AUTOS.includes(aseguradora);
