// ============================================================
// src/shared/data/mexicoMunicipios.js
// Dataset estático de Estados → Municipios de México
//
// FUTURO: Para cargar Colonias por CP o calles específicas, integrar:
//   • Copomex:  https://api.copomex.com  (gratis con registro)
//   • Sepomex:  https://api-sepomex.hckdrk.mx (oficial, gratis)
//
// Ejemplo de fetch para colonias por CP (a futuro):
//   fetch(`https://api-sepomex.hckdrk.mx/query/info_cp/${cp}?type=simplified`)
// ============================================================

export const ESTADOS_MUNICIPIOS = {
  "Aguascalientes": [
    "Aguascalientes","Asientos","Calvillo","Cosío","Jesús María","Pabellón de Arteaga",
    "Rincón de Romos","San José de Gracia","Tepezalá","San Francisco de los Romo",
    "El Llano"
  ],
  "Baja California": [
    "Ensenada","Mexicali","Tecate","Tijuana","Playas de Rosarito","San Quintín","San Felipe"
  ],
  "Baja California Sur": [
    "Comondú","Mulegé","La Paz","Los Cabos","Loreto"
  ],
  "Campeche": [
    "Calkiní","Campeche","Carmen","Champotón","Hecelchakán","Hopelchén","Palizada",
    "Tenabo","Escárcega","Calakmul","Candelaria","Seybaplaya","Dzitbalché"
  ],
  "Chiapas": [
    "Tuxtla Gutiérrez","San Cristóbal de las Casas","Tapachula","Comitán de Domínguez",
    "Palenque","Ocosingo","Chiapa de Corzo","Villaflores","Tonalá","Pichucalco","Cintalapa",
    "Arriaga","Huixtla","Mapastepec","Motozintla","Pijijiapan","Berriozábal","Yajalón"
  ],
  "Chihuahua": [
    "Chihuahua","Juárez","Cuauhtémoc","Delicias","Hidalgo del Parral","Camargo","Jiménez",
    "Nuevo Casas Grandes","Meoqui","Ojinaga","Bocoyna","Aldama","Buenaventura","Ascensión",
    "Madera"
  ],
  "Ciudad de México": [
    "Álvaro Obregón","Azcapotzalco","Benito Juárez","Coyoacán","Cuajimalpa de Morelos",
    "Cuauhtémoc","Gustavo A. Madero","Iztacalco","Iztapalapa","La Magdalena Contreras",
    "Miguel Hidalgo","Milpa Alta","Tláhuac","Tlalpan","Venustiano Carranza","Xochimilco"
  ],
  "Coahuila": [
    "Saltillo","Torreón","Monclova","Piedras Negras","Acuña","Frontera","San Pedro",
    "Matamoros","Sabinas","Múzquiz","Parras","Ramos Arizpe","Allende","Castaños","Nava"
  ],
  "Colima": [
    "Colima","Villa de Álvarez","Manzanillo","Tecomán","Coquimatlán","Comala","Cuauhtémoc",
    "Armería","Ixtlahuacán","Minatitlán"
  ],
  "Durango": [
    "Durango","Gómez Palacio","Lerdo","Santiago Papasquiaro","El Salto (Pueblo Nuevo)",
    "Vicente Guerrero","Cuencamé","Nuevo Ideal","Mapimí","Tlahualilo","Nombre de Dios",
    "Canatlán","Guadalupe Victoria"
  ],
  "Estado de México": [
    "Toluca","Ecatepec de Morelos","Naucalpan de Juárez","Nezahualcóyotl","Tlalnepantla de Baz",
    "Cuautitlán Izcalli","Atizapán de Zaragoza","Tultitlán","Coacalco de Berriozábal","Chimalhuacán",
    "Ixtapaluca","Valle de Chalco Solidaridad","Chalco","Texcoco","Metepec","La Paz","Nicolás Romero",
    "Huixquilucan","Cuautitlán","Tecámac","Zumpango","Tepotzotlán","Lerma","San Mateo Atenco",
    "Otzolotepec","Almoloya de Juárez"
  ],
  "Guanajuato": [
    "León","Irapuato","Celaya","Salamanca","Guanajuato","San Miguel de Allende","Silao",
    "Pénjamo","Valle de Santiago","Acámbaro","San Francisco del Rincón","Dolores Hidalgo",
    "Cortazar","Apaseo el Grande","Apaseo el Alto","Comonfort","Romita","Abasolo","Moroleón",
    "Uriangato","Yuriria"
  ],
  "Guerrero": [
    "Acapulco de Juárez","Chilpancingo de los Bravo","Iguala de la Independencia","Taxco de Alarcón",
    "Zihuatanejo de Azueta","Tlapa de Comonfort","Coyuca de Benítez","Chilapa de Álvarez",
    "Tixtla de Guerrero","Petatlán","Ometepec","Tecpan de Galeana","Ayutla de los Libres"
  ],
  "Hidalgo": [
    "Pachuca de Soto","Tulancingo de Bravo","Mineral de la Reforma","Tula de Allende",
    "Huejutla de Reyes","Tepeji del Río de Ocampo","Tizayuca","Ixmiquilpan","Actopan",
    "Apan","Atotonilco el Grande","Zimapán","Huichapan","Mixquiahuala de Juárez"
  ],
  "Jalisco": [
    "Guadalajara","Zapopan","San Pedro Tlaquepaque","Tonalá","Tlajomulco de Zúñiga","El Salto",
    "Puerto Vallarta","Lagos de Moreno","Tepatitlán de Morelos","Ocotlán","Ciudad Guzmán (Zapotlán el Grande)",
    "La Barca","Autlán de Navarro","Ameca","Arandas","Chapala","Tequila","Tala","Ahualulco de Mercado"
  ],
  "Michoacán": [
    "Morelia","Uruapan","Zamora","Lázaro Cárdenas","Apatzingán","Zitácuaro","Hidalgo","La Piedad",
    "Pátzcuaro","Sahuayo","Maravatío","Jiquilpan","Jacona","Tacámbaro","Tarímbaro","Puruándiro",
    "Zinapécuaro","Yurécuaro","Coalcomán"
  ],
  "Morelos": [
    "Cuernavaca","Jiutepec","Cuautla","Temixco","Yautepec","Emiliano Zapata","Xochitepec",
    "Ayala","Puente de Ixtla","Tepoztlán","Tlaltizapán","Yecapixtla","Zacatepec","Tlayacapan",
    "Tetecala","Mazatepec","Coatlán del Río","Miacatlán","Atlatlahucan","Totolapan","Tlalnepantla",
    "Huitzilac","Tepalcingo","Jojutla","Jonacatepec","Tetela del Volcán","Ocuituco","Axochiapan",
    "Amacuzac","Coatetelco","Hueyapan","Xoxocotla","Tetelcingo","Temoac"
  ],
  "Nayarit": [
    "Tepic","Bahía de Banderas","Santiago Ixcuintla","Compostela","Xalisco","Tuxpan","Acaponeta",
    "Ruiz","Ahuacatlán","Ixtlán del Río","San Blas","Rosamorada"
  ],
  "Nuevo León": [
    "Monterrey","Guadalupe","San Nicolás de los Garza","Apodaca","General Escobedo","Santa Catarina",
    "San Pedro Garza García","Juárez","García","Cadereyta Jiménez","Linares","Montemorelos",
    "Sabinas Hidalgo","Salinas Victoria","Allende","Santiago","Hualahuises","Pesquería"
  ],
  "Oaxaca": [
    "Oaxaca de Juárez","San Juan Bautista Tuxtepec","Salina Cruz","Juchitán de Zaragoza",
    "Santa Cruz Xoxocotlán","Santa Lucía del Camino","Huajuapan de León","Santo Domingo Tehuantepec",
    "Loma Bonita","Pinotepa Nacional","Matías Romero","San Pedro Mixtepec","Puerto Escondido",
    "Putla Villa de Guerrero"
  ],
  "Puebla": [
    "Puebla","Tehuacán","San Martín Texmelucan","Atlixco","San Pedro Cholula","San Andrés Cholula",
    "Cuautlancingo","Amozoc","Huauchinango","Teziutlán","Izúcar de Matamoros","Acatzingo","Zacatlán",
    "Libres","Acatlán","Tepeaca","Tlatlauquitepec","Xicotepec","Chignahuapan","Ajalpan"
  ],
  "Querétaro": [
    "Querétaro","San Juan del Río","Corregidora","El Marqués","Tequisquiapan","Cadereyta de Montes",
    "Pedro Escobedo","Amealco de Bonfil","Ezequiel Montes","Jalpan de Serra","Huimilpan","Colón",
    "Pinal de Amoles","Tolimán"
  ],
  "Quintana Roo": [
    "Benito Juárez (Cancún)","Othón P. Blanco (Chetumal)","Solidaridad (Playa del Carmen)",
    "Tulum","Cozumel","Felipe Carrillo Puerto","Bacalar","Isla Mujeres","Lázaro Cárdenas",
    "José María Morelos","Puerto Morelos"
  ],
  "San Luis Potosí": [
    "San Luis Potosí","Soledad de Graciano Sánchez","Ciudad Valles","Matehuala","Rioverde",
    "Tamazunchale","Ébano","Tamuín","Cerritos","Salinas","Villa de Reyes","Mexquitic de Carmona",
    "Santa María del Río","Charcas","Cárdenas"
  ],
  "Sinaloa": [
    "Culiacán","Mazatlán","Ahome (Los Mochis)","Guasave","Navolato","El Fuerte","Salvador Alvarado (Guamúchil)",
    "Escuinapa","Rosario","Sinaloa de Leyva","Mocorito","Angostura","Concordia","San Ignacio","Elota","Cosalá"
  ],
  "Sonora": [
    "Hermosillo","Cajeme (Ciudad Obregón)","Nogales","San Luis Río Colorado","Navojoa","Guaymas",
    "Agua Prieta","Caborca","Empalme","Puerto Peñasco","Huatabampo","Etchojoa","Cananea","Magdalena",
    "Nacozari de García","Álamos"
  ],
  "Tabasco": [
    "Centro (Villahermosa)","Cárdenas","Comalcalco","Huimanguillo","Macuspana","Tenosique",
    "Paraíso","Cunduacán","Teapa","Nacajuca","Centla","Balancán","Emiliano Zapata","Jalpa de Méndez",
    "Tacotalpa","Jonuta","Jalapa"
  ],
  "Tamaulipas": [
    "Reynosa","Matamoros","Nuevo Laredo","Tampico","Ciudad Victoria","Ciudad Madero","Altamira",
    "Río Bravo","Valle Hermoso","San Fernando","Mante","Xicoténcatl","González","Soto la Marina",
    "Miguel Alemán"
  ],
  "Tlaxcala": [
    "Tlaxcala","Apizaco","Huamantla","Calpulalpan","Chiautempan","San Pablo del Monte","Zacatelco",
    "Tlaxco","Contla de Juan Cuamatzi","Papalotla de Xicohténcatl","Tetla de la Solidaridad","Ixtacuixtla"
  ],
  "Veracruz": [
    "Veracruz","Xalapa","Coatzacoalcos","Córdoba","Poza Rica de Hidalgo","Minatitlán","Orizaba",
    "Tuxpan","San Andrés Tuxtla","Boca del Río","Papantla","Acayucan","Martínez de la Torre",
    "Cosoleacaque","Pánuco","Cardel (La Antigua)","Nogales","Río Blanco","Fortín","Huatusco",
    "Tierra Blanca","Las Choapas","Perote"
  ],
  "Yucatán": [
    "Mérida","Kanasín","Valladolid","Tizimín","Progreso","Umán","Tekax","Ticul","Motul","Hunucmá",
    "Izamal","Maxcanú","Espita","Oxkutzcab","Peto","Acanceh","Chemax","Conkal"
  ],
  "Zacatecas": [
    "Zacatecas","Guadalupe","Fresnillo","Jerez","Sombrerete","Río Grande","Calera","Loreto",
    "Pinos","Ojocaliente","Concepción del Oro","Juan Aldama","Villanueva","Valparaíso","Nochistlán de Mejía"
  ],
};

export const ESTADOS_MX = Object.keys(ESTADOS_MUNICIPIOS).sort();

// Helper: obtener municipios de un estado (ordenados alfabéticamente)
export function getMunicipios(estado) {
  return [...(ESTADOS_MUNICIPIOS[estado] ?? [])].sort();
}

// ============================================================
// FUTURO: integración con API de colonias por CP
// ============================================================
// Cuando quieras cargar colonias dinámicamente, reemplaza esta función:
//
// export async function getColoniasPorCP(cp) {
//   const r = await fetch(`https://api-sepomex.hckdrk.mx/query/info_cp/${cp}?type=simplified`);
//   const data = await r.json();
//   return data.response.asentamiento ?? [];
// }
//
// Por ahora la dejamos como string libre en el formulario.
