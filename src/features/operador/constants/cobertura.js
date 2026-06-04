export const OFICINA = { nombre: "COFISEM AV. E.ZAPATA", id: "civac", codigo: "0126" };

export const COBERTURA_BASICA = {
  nombre: "TAXI BÁSICA",
  uso: "SERVICIO PÚBLICO",
  coberturas: [
    { desc: "Resp. Civil a Terceros Bienes y Personas", monto: "$1,700,000.00", ded: "0.00" },
    { desc: "Resp. Civil Complementaria Personas",      monto: "$3,000,000.00", ded: "0.00" },
    { desc: "Gastos Médicos Conductor y Familiares",    monto: "$50,000.00",    ded: "0.00" },
    { desc: "Muerte de Conductor x/AA",                monto: "$50,000.00",    ded: "0.00" },
    { desc: "Gastos Legales",                          monto: "AMPARADOS",     ded: "0.00" },
    { desc: "Resp. Civil Viajero",                     monto: "5,000 UMAS/Pasajero", ded: "0.00" },
  ],
};

export const PRECIO_MATRIZ = {
  normal: {
    "CONTADO":     { total: 2500.00, primerPago: 2500.00, pagoSubs: 0,      nSubs: 0 },
    "4 PARCIALES": { total: 2674.00, primerPago:  799.00, pagoSubs: 625.00, nSubs: 3 },
  },
  gestor: {
    "CONTADO":     { total: 2200.00, primerPago: 2200.00, pagoSubs: 0,      nSubs: 0 },
    "4 PARCIALES": { total: 2200.00, primerPago:  550.00, pagoSubs: 550.00, nSubs: 3 },
  },
};

export const DERECHOS = 400.00;

export const PASOS = [
  { num: 1, titulo: "Cobertura" },
  { num: 2, titulo: "Vehículo" },
  { num: 3, titulo: "Cotización" },
  { num: 4, titulo: "Coberturas" },
  { num: 5, titulo: "Resumen" },
];

// Calcula pricing dinámico desde una cobertura de BD
export function calcularPrecioData(cobertura, formaPago, esGestor) {
  const primaTotal = parseFloat(cobertura.prima_total);
  if (formaPago !== "4 PARCIALES") {
    return { total: primaTotal, primerPago: primaTotal, pagoSubs: 0, nSubs: 0 };
  }
  if (esGestor) {
    const pago = +(primaTotal / 4).toFixed(2);
    return { total: primaTotal, primerPago: pago, pagoSubs: pago, nSubs: 3 };
  }
  // Normal 4 parciales: mismas proporciones que PRECIO_MATRIZ (799/2500, 625/2500)
  const primerPago = +(primaTotal * (799 / 2500)).toFixed(2);
  const pagoSubs   = +(primaTotal * (625 / 2500)).toFixed(2);
  const total      = +(primerPago + pagoSubs * 3).toFixed(2);
  return { total, primerPago, pagoSubs, nSubs: 3 };
}
