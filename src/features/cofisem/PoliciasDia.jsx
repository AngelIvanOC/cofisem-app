import { useState, useEffect, useRef, useMemo } from "react";
import {
  Plus,
  Pencil,
  Eye,
  ChevronLeft,
  ChevronRight,
  X as XIcon,
  FileSignature,
} from "lucide-react";
import Swal from "sweetalert2";
import { supabase } from "../../supabaseClient";
import CompletarPolizaModal, {
  ComprobanteField,
  FotosVehiculoField,
  evaluarCompletado,
} from "../corte/CompletarPolizaModal";
import {
  subirComprobante,
  verComprobante,
  MAX_COMPROBANTE_BYTES,
  COMPROBANTE_BUCKET,
} from "../../services/comprobantesPago";
import {
  subirDocumento,
  verDocumento,
  MAX_DOCUMENTO_BYTES,
  DOCUMENTACION_BUCKET,
} from "../../services/documentacionPoliza";
import { PAGOS_COMPROBANTE_BUCKET } from "../../services/comprobantesPagoCofisem";
import { fetchVendedores, crearVendedor } from "../../services/vendedores";
import { fetchCoberturasActivas } from "../../services/coberturas";
import SelectTypeahead from "../../components/SelectTypeahead";
import ModalNuevoVendedor from "../operador/components/ModalNuevoVendedor";
import ModalEndososPoliza from "./ModalEndososPoliza";
import { hoyISO } from "../../utils/fecha";

const HOY_ISO = hoyISO();
const HOY_LABEL = new Date().toLocaleDateString("es-MX", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

// Límites de calendario para fecha de emisión / inicio de vigencia —
// desactivados por ahora a pedido del usuario, se dejan listos para
// reactivar cuando se vuelvan a necesitar.
// function isoMasDias(dias) {
//   const d = new Date();
//   d.setDate(d.getDate() + dias);
//   return d.toISOString().split("T")[0];
// }
// const FECHA_EMISION_MIN = isoMasDias(-2);
// const FECHA_EMISION_MAX = HOY_ISO;
// const VIGENCIA_MIN = HOY_ISO;
// const VIGENCIA_MAX = isoMasDias(30);

const FORMA_PAGO_OPT = [
  "CONTADO",
  "4 PARCIALES",
  "TRIMESTRAL",
  "CUATRIMESTRAL",
  "SEMESTRAL",
  "MENSUAL",
];
// En modo "No tengo la póliza" también se permite CONTADO: representa un
// pago único ("1 de 1") de una póliza que nunca quedó registrada — se
// deja la constancia incompleta igual que las demás formas de pago, solo
// que aquí no hay cuota 2+ que elegir (ver "Cuota a registrar" abajo).
const FORMA_PAGO_OPT_PARCIAL = FORMA_PAGO_OPT;
const COBERTURA_OPT = ["AMPLIA", "LIMITADA", "BÁSICA", "OBLIGATORIO", "OTRA"];

// Columnas de la tabla. Anchos suman 100% y la tabla es table-fixed para
// que NO se muevan al filtrar. El ojo abre el detalle completo (solo
// lectura); el lápiz edita.
const COLUMNAS_TABLA = [
  { label: "Póliza", width: "11%", align: "left" },
  { label: "Aseguradora", width: "8%", align: "left" },
  { label: "Asegurado", width: "10%", align: "left" },
  { label: "Cobertura", width: "8%", align: "left" },
  { label: "Plan", width: "8%", align: "left" },
  { label: "Método", width: "7%", align: "left" },
  { label: "Cuota", width: "4%", align: "center" },
  { label: "Corte", width: "8%", align: "left" },
  { label: "Prima total", width: "8%", align: "right" },
  { label: "1er pago", width: "8%", align: "right" },
  { label: "Estado", width: "7%", align: "left" },
  { label: "Acciones", width: "13%", align: "right" },
];
const POR_PAGINA = 10;

// Catálogo Aseguradora → Uso → Servicio. El Uso se filtra por aseguradora
// y el Servicio se filtra por aseguradora + uso. Ajusta aquí si algún
// combo no coincide exacto — el texto se guarda tal cual en
// polizas_cofisem.uso / polizas_cofisem.servicio.
const USO_SERVICIO_CATALOGO = [
  { aseguradora: "QUALITAS", uso: "NORMAL", servicio: "PARTICULAR" },
  { aseguradora: "QUALITAS", uso: "CARGA", servicio: "PUB. FEDERAL (CARGA)" },
  { aseguradora: "QUALITAS", uso: "PERSONAL", servicio: "PARTICULAR" },
  { aseguradora: "QUALITAS", uso: "TAXI/VAN TURISMO", servicio: "PUBLICO" },
  { aseguradora: "QUALITAS", uso: "TAXI", servicio: "PUBLICO" },
  { aseguradora: "QUALITAS", uso: "AUTO REGULARIZADO", servicio: "PARTICULAR" },
  {
    aseguradora: "QUALITAS",
    uso: "PKP PER REGULARIZADO",
    servicio: "PARTICULAR",
  },
  { aseguradora: "QUALITAS", uso: "COL.URB/FORA", servicio: "PUBLICO" },
  { aseguradora: "QUALITAS", uso: "CARGA", servicio: "PARTICULAR" },
  { aseguradora: "ANA", uso: "PARICULAR", servicio: "PARTICULAR" },
  { aseguradora: "ANA", uso: "CARGA", servicio: "COMERCIAL" },
  { aseguradora: "BANORTE", uso: "TAXI", servicio: "PUBLICO LOCAL" },
  { aseguradora: "BANORTE", uso: "CONDUCTOR APP", servicio: "PARTICULAR" },
  { aseguradora: "BANORTE", uso: "PARICULAR", servicio: "PARTICULAR" },
  { aseguradora: "GAMAN", uso: "SERVICIO", servicio: "PUBLICO" },
  { aseguradora: "HDI", uso: "CARGA COMERCIAL", servicio: "PARTICULAR" },
  { aseguradora: "SURA", uso: "PARTICULAR", servicio: "SERVICIO PARTICULAR" },
];

// Entre cuántos pagos se reparte la Prima T. Anual según la forma de pago —
// solo se usa para SUGERIR la Prima 1er Pago; el campo se queda libre para
// que el operador lo corrija a mano si el primer pago es distinto (p.ej.
// cuesta más que las demás parcialidades).
const DIVISOR_PAGO = {
  CONTADO: 1,
  MENSUAL: 12,
  SEMESTRAL: 2,
  TRIMESTRAL: 4,
  CUATRIMESTRAL: 3,
  "4 PARCIALES": 4,
};
function calcularPrimerPago(primaAnual, formaPago) {
  const anual = parseFloat(primaAnual) || 0;
  if (!anual) return "";
  const divisor = DIVISOR_PAGO[formaPago] ?? 1;
  return (anual / divisor).toFixed(2);
}

const TIPO_OPT = [
  "AUTO",
  "TAXI",
  "COLECTIVO",
  "APP",
  "PICKUP",
  "CAMION",
  "EQUIPO PESADO",
  "MOTO",
  "CUATRIMOTO",
  "OTRO",
];

const FORM_VACIO = {
  aseguradora: "",
  numero_poliza: "",
  tipo_persona: "FISICA",
  folio: "",
  cobertura: "",
  uso: "",
  servicio: "",
  forma_pago: "CONTADO",
  fecha_emision: HOY_ISO,
  vigencia_inicio: HOY_ISO,
  vigencia_fin: "",
  asegurado_nombre_pila: "",
  asegurado_apellido_paterno: "",
  asegurado_apellido_materno: "",
  telefono: "",
  vendedor_id: null,
  placas: "",
  num_serie: "",
  tipo: "AUTO",
  prima_anual: "",
  prima_neta: "",
  prima_primer_pago: "",
  prima_primer_pago_neta: "",
  pol_pend_pago: "",
  efectivo: "",
  cheque: "",
  tdc: "",
  autorizacion: "",
  fotos_path: null,
  factura_path: null,
  t_circ_path: null,
  identif_path: null,
  identif_reverso_path: null,
  pol_ant_path: null,
  otro_path: null,
  acta_constitutiva_path: null,
  poderes_path: null,
  comprobante_domicilio_path: null,
  constancia_fiscal_path: null,
  fotos_verificado: false,
  fotos_verificado_nota: "",
  observaciones: "",
  comprobante_tdc_path: null,
  comprobante_cheque_path: null,
};

const esPersonaMoral = (tipoPersona) => tipoPersona === "MORAL";

const esAmpliaOLimitada = (cobertura) =>
  /AMPLIA|LIMITADA/i.test(cobertura || "");

const inpCls =
  "w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6] transition-all";
const lblCls =
  "block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5";
const n = (v) => parseFloat(v) || 0;
const fmt = (d) =>
  d
    ? new Date(d + "T00:00:00").toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";
const $ = (v) => `$${n(v).toFixed(2)}`;

// "FRANCISCO GUTIERREZ GARCIA" → "FRANCISCO G. G." (primer nombre completo,
// el resto —segundo nombre y apellidos— a inicial).
const abreviarNombre = (nombre) => {
  const partes = (nombre || "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "—";
  const [primero, ...resto] = partes;
  return [primero, ...resto.map((x) => x.charAt(0).toUpperCase() + ".")].join(
    " ",
  );
};

// Cómo se cobró: se deduce de los montos capturados. Puede ser combinado.
const metodoPago = (p) => {
  const usados = [];
  if (n(p.efectivo) > 0) usados.push("Efectivo");
  if (n(p.tdc) > 0) usados.push("Tarjeta");
  if (n(p.cheque) > 0) usados.push("Transf.");
  if (usados.length) return usados.join(" + ");
  if (n(p.pol_pend_pago) > 0) return "Pendiente";
  return "—";
};
function SeccionHeader({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
        {children}
      </p>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

export default function PoliciasDia({ usuario }) {
  const [polizas, setPolizas] = useState([]);
  const [aseguradoras, setAseguradoras] = useState([]);
  const [coberturasGaman, setCoberturasGaman] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState("lista"); // "lista" | "form"
  const [modo, setModo] = useState("COMPLETA"); // "COMPLETA" | "PARCIAL"
  const [numCuotaParcial, setNumCuotaParcial] = useState("");
  const [form, setForm] = useState({ ...FORM_VACIO });
  const [conVendedor, setConVendedor] = useState(false);
  const [modalVendedorAbierto, setModalVendedorAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [modalRow, setModalRow] = useState(null);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(null); // solo lectura
  const [modalEndososRow, setModalEndososRow] = useState(null); // endosos manuales de la póliza
  const [subiendoComprobante, setSubiendoComprobante] = useState(null); // 'tdc' | 'cheque' | null
  const [subiendoDocumento, setSubiendoDocumento] = useState(null); // 'fotos' | 'factura' | ... | null
  const [corteInfo, setCorteInfo] = useState(null);
  const [fechaCorteSel, setFechaCorteSel] = useState(HOY_ISO);
  const [corteDestinoInfo, setCorteDestinoInfo] = useState(null);
  const [fechaVista, setFechaVista] = useState(HOY_ISO);
  // "DIA" = pólizas de un día concreto (selector de fecha, comportamiento
  // original). "TODAS" = todas las pólizas de la oficina, con buscador y
  // filtros, y una columna "Día del corte".
  const [modoLista, setModoLista] = useState("DIA");
  const [busqueda, setBusqueda] = useState("");
  const [filtroAseg, setFiltroAseg] = useState("");
  const [filtroEstado, setFiltroEstado] = useState(""); // "" | "COMPLETA" | "PENDIENTE"
  const [fechaFiltro, setFechaFiltro] = useState(""); // filtro de día en modo "Todas" (vacío = todas)
  const [pagina, setPagina] = useState(1);
  const compUuidsRef = useRef({});

  const oficina = usuario?.oficinas?.nombre ?? "OFICINA";
  const corteCerrado = !!corteInfo?.cerrado;

  useEffect(() => {
    cargarAseguradoras();
    cargarCorteInfo();
    cargarVendedores();
    cargarCoberturasGaman();
  }, []);

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaVista, modoLista]);

  useEffect(() => {
    let activo = true;
    (async () => {
      let query = supabase
        .from("corte_efectivo_entrega")
        .select("*")
        .eq("fecha_corte", fechaCorteSel);
      query = usuario?.oficina_id
        ? query.eq("oficina_id", usuario.oficina_id)
        : query.is("oficina_id", null);
      const { data } = await query.maybeSingle();
      if (activo) setCorteDestinoInfo(data ?? null);
    })();
    return () => {
      activo = false;
    };
  }, [fechaCorteSel, usuario?.oficina_id]);

  const corteDestinoCerrado = !!corteDestinoInfo?.cerrado;

  // "No tengo la póliza" + cuota 1 (contado "1 de 1" o la 1 de cualquier
  // parcialidad) = se está creando la póliza incompleta cuando debería
  // haber entrado completa. Se exige explicar el motivo en Observaciones
  // antes de poder registrar.
  const exigeMotivoIncompleta =
    modo === "PARCIAL" && Number(numCuotaParcial) === 1;

  async function cargarCorteInfo() {
    let query = supabase
      .from("corte_efectivo_entrega")
      .select("*")
      .eq("fecha_corte", HOY_ISO);
    query = usuario?.oficina_id
      ? query.eq("oficina_id", usuario.oficina_id)
      : query.is("oficina_id", null);
    const { data } = await query.maybeSingle();
    setCorteInfo(data ?? null);
  }

  async function cargarAseguradoras() {
    const { data } = await supabase
      .from("aseguradoras")
      .select("id, nombre")
      .order("nombre", { ascending: true });
    if (data) setAseguradoras(data.map((a) => a.nombre).filter(Boolean));
  }

  // Aseguradora GAMAN: la cobertura no es una categoría genérica (Amplia/
  // Limitada/Básica) sino el nombre real del producto — se jala del mismo
  // catálogo que usa la emisión de pólizas en GAMAN, para no perder
  // precisión ni desincronizarse si allá cambian los nombres.
  async function cargarCoberturasGaman() {
    try {
      const data = await fetchCoberturasActivas();
      setCoberturasGaman((data ?? []).map((c) => c.nombre).filter(Boolean));
    } catch (e) {
      setErrorMsg(e.message);
    }
  }

  // Vendedores de GAMAN y COFISEM son la misma lista — sin filtrar por oficina.
  async function cargarVendedores() {
    try {
      const data = await fetchVendedores();
      setVendedores(data ?? []);
    } catch (e) {
      setErrorMsg(e.message);
    }
  }

  function onGuardarVendedor(vendedorObj) {
    setVendedores((vs) => [...vs, vendedorObj]);
    setF("vendedor_id", vendedorObj.id);
    setModalVendedorAbierto(false);
  }

  async function cargar() {
    setLoading(true);
    try {
      let query = supabase
        .from("polizas_cofisem")
        .select(
          "*, creador:usuarios!corte_registros_creado_por_fkey(nombre, apellido)",
        );
      // Pólizas de TODA la oficina (las lleva la encargada).
      if (usuario?.oficina_id)
        query = query.eq("oficina_id", usuario.oficina_id);
      if (modoLista === "DIA") {
        query = query
          .eq("fecha_corte", fechaVista)
          .order("created_at", { ascending: true });
      } else {
        // Todas: más recientes primero, por día de corte.
        query = query
          .order("fecha_corte", { ascending: false })
          .order("created_at", { ascending: true });
      }
      const { data, error } = await query;
      if (error) throw error;
      setPolizas(data ?? []);
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Buscador + filtros — se aplican en cliente en AMBOS modos, para que
  // escribir en el buscador solo filtre y nunca cambie nada de la vista.
  const polizasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return polizas.filter((p) => {
      if (filtroAseg && p.aseguradora !== filtroAseg) return false;
      if (filtroEstado === "COMPLETA" && !p.completado) return false;
      if (filtroEstado === "PENDIENTE" && p.completado) return false;
      if (modoLista === "TODAS" && fechaFiltro && p.fecha_corte !== fechaFiltro)
        return false;
      if (!q) return true;
      return [
        p.numero_poliza,
        p.asegurado_nombre,
        p.vendedor_nombre,
        p.folio,
        p.cobertura,
      ].some((v) => (v || "").toString().toLowerCase().includes(q));
    });
  }, [modoLista, polizas, busqueda, filtroAseg, filtroEstado, fechaFiltro]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(polizasFiltradas.length / POR_PAGINA),
  );
  const paginaSegura = Math.min(pagina, totalPaginas);
  const polizasPagina = polizasFiltradas.slice(
    (paginaSegura - 1) * POR_PAGINA,
    paginaSegura * POR_PAGINA,
  );
  const totalPrimerPago = polizasFiltradas.reduce(
    (s, p) => s + n(p.prima_primer_pago),
    0,
  );

  // Cualquier cambio de filtro / modo vuelve a la página 1.
  useEffect(() => {
    setPagina(1);
  }, [modoLista, busqueda, filtroAseg, filtroEstado, fechaFiltro, fechaVista]);

  const asegurasEnLista = useMemo(
    () =>
      [...new Set(polizas.map((p) => p.aseguradora).filter(Boolean))].sort(),
    [polizas],
  );

  const setF = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const usosDisponibles = useMemo(
    () => [
      ...new Set(
        USO_SERVICIO_CATALOGO.filter(
          (c) => c.aseguradora === form.aseguradora,
        ).map((c) => c.uso),
      ),
    ],
    [form.aseguradora],
  );
  const serviciosDisponibles = useMemo(
    () => [
      ...new Set(
        USO_SERVICIO_CATALOGO.filter(
          (c) => c.aseguradora === form.aseguradora && c.uso === form.uso,
        ).map((c) => c.servicio),
      ),
    ],
    [form.aseguradora, form.uso],
  );
  // Solo son obligatorios si la aseguradora elegida (o el uso elegido)
  // tiene opciones en el catálogo — si no hay match, el campo se deja
  // libre y no bloquea el guardado.
  const usoObligatorio = usosDisponibles.length > 0;
  const servicioObligatorio = serviciosDisponibles.length > 0;
  const coberturaOpts =
    form.aseguradora === "GAMAN" ? coberturasGaman : COBERTURA_OPT;

  function handleNueva() {
    setForm({ ...FORM_VACIO });
    setFechaCorteSel(HOY_ISO);
    setConVendedor(false);
    setErrorMsg(null);
    setModo("COMPLETA");
    setNumCuotaParcial("");
    compUuidsRef.current = {};
    setVista("form");
  }

  function cambiarModo(nuevo) {
    setModo(nuevo);
    setNumCuotaParcial(
      nuevo === "PARCIAL" && form.forma_pago === "CONTADO" ? "1" : "",
    );
  }

  function getCompUuid(tipo) {
    if (!compUuidsRef.current[tipo])
      compUuidsRef.current[tipo] = crypto.randomUUID();
    return compUuidsRef.current[tipo];
  }

  async function handleComprobanteChange(tipo, file) {
    if (file.size > MAX_COMPROBANTE_BYTES) {
      setErrorMsg("El archivo es muy grande (máx. 8 MB).");
      return;
    }
    setErrorMsg(null);
    setSubiendoComprobante(tipo);
    try {
      const uuid = getCompUuid(tipo);
      const basePath = `${usuario?.oficina_id ?? "sin-oficina"}/${HOY_ISO}/nueva-${uuid}/${tipo}`;
      const path = await subirComprobante(basePath, file);
      setF(`comprobante_${tipo}_path`, path);
    } catch (e) {
      setErrorMsg("No se pudo subir el comprobante: " + e.message);
    } finally {
      setSubiendoComprobante(null);
    }
  }

  async function handleVer(path) {
    try {
      await verComprobante(path);
    } catch (e) {
      setErrorMsg("No se pudo abrir el comprobante: " + e.message);
    }
  }

  async function handleDocumentoChange(tipo, file) {
    if (file.size > MAX_DOCUMENTO_BYTES) {
      setErrorMsg("El archivo es muy grande (máx. 8 MB).");
      return;
    }
    setErrorMsg(null);
    setSubiendoDocumento(tipo);
    try {
      const uuid = getCompUuid(tipo);
      const basePath = `${usuario?.oficina_id ?? "sin-oficina"}/${HOY_ISO}/nueva-${uuid}/${tipo}`;
      const path = await subirDocumento(basePath, file);
      setF(`${tipo}_path`, path);
    } catch (e) {
      setErrorMsg("No se pudo subir el documento: " + e.message);
    } finally {
      setSubiendoDocumento(null);
    }
  }

  async function handleVerDocumento(path) {
    try {
      await verDocumento(path);
    } catch (e) {
      setErrorMsg("No se pudo abrir el documento: " + e.message);
    }
  }

  async function handleGuardar(e) {
    e.preventDefault();
    if (guardando) return;
    if (corteDestinoCerrado) {
      setErrorMsg("No puedes registrar en un corte ya cerrado.");
      return;
    }
    const esParcial = modo === "PARCIAL";
    if (esParcial && (!form.forma_pago || !numCuotaParcial)) {
      setErrorMsg(
        "Selecciona la forma de pago y qué número de cuota vienes a registrar.",
      );
      return;
    }
    if (exigeMotivoIncompleta && !form.observaciones.trim()) {
      setErrorMsg(
        "Indica en Observaciones por qué esta póliza no se registra completa.",
      );
      return;
    }
    setGuardando(true);
    setErrorMsg(null);
    try {
      // Candado anti-duplicados: "Nueva póliza" solo sirve para el
      // PRIMER registro de una aseguradora + no. de póliza (completo o
      // parcial) — en cuanto existe cualquiera de los dos, la póliza ya
      // quedó creada en el sistema y sus siguientes cuotas se marcan
      // desde Pagos (ya aparecen ahí solas, generadas por el trigger),
      // nunca volviendo a "Nueva póliza". Revisa en todo el sistema, no
      // solo lo del operador actual.
      const numeroPolizaNorm = form.numero_poliza.trim().toUpperCase();
      const { data: existentes, error: errDup } = await supabase
        .from("polizas_cofisem")
        .select("id")
        .eq("aseguradora", form.aseguradora)
        .eq("numero_poliza", numeroPolizaNorm)
        .limit(1);
      if (errDup) throw errDup;
      if ((existentes ?? []).length > 0) {
        setGuardando(false);
        await Swal.fire({
          icon: "warning",
          title: "Esa póliza ya existe",
          html: `La póliza <strong>${numeroPolizaNorm}</strong> de <strong>${form.aseguradora}</strong> ya está registrada en el sistema.<br/><br/>Si vienes a cobrar una cuota siguiente, regístrala desde <strong>Pagos</strong>, no aquí.`,
          confirmButtonColor: "#1447e6",
        });
        return;
      }
      const vendedorSel = conVendedor
        ? vendedores.find((v) => v.id === form.vendedor_id)
        : null;
      const vendedorId = vendedorSel?.id ?? 1; // 1 = COFISEM (sin vendedor específico)
      const vendedorNombre = vendedorSel
        ? `${vendedorSel.nombre} ${vendedorSel.apellido || ""}`.trim()
        : "COFISEM";
      const asegurado_nombre = [
        form.asegurado_nombre_pila,
        form.asegurado_apellido_paterno,
        form.asegurado_apellido_materno,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      const payload = esParcial
        ? {
            // Registro parcial: sin vigencia, vehículo ni documentación
            // (no se tienen) — pero el tipo de pago de esta cuota sí se
            // captura aquí mismo, igual que la cuota 1 de una póliza
            // completa.
            aseguradora: form.aseguradora,
            numero_poliza: form.numero_poliza,
            tipo_persona: form.tipo_persona,
            folio: form.folio || null,
            cobertura: form.cobertura || null,
            uso: form.uso || null,
            servicio: form.servicio || null,
            forma_pago: form.forma_pago,
            fecha_emision: HOY_ISO,
            vigencia_inicio: null,
            vigencia_fin: null,
            asegurado_nombre,
            asegurado_nombre_pila: form.asegurado_nombre_pila || null,
            asegurado_apellido_paterno: form.asegurado_apellido_paterno || null,
            asegurado_apellido_materno: form.asegurado_apellido_materno || null,
            telefono: form.telefono || null,
            vendedor_id: vendedorId,
            vendedor_nombre: vendedorNombre,
            placas: null,
            num_serie: null,
            tipo: null,
            autorizacion: form.autorizacion || null,
            observaciones: form.observaciones || null,
            fecha_corte: fechaCorteSel,
            oficina_id: usuario?.oficina_id ?? null,
            creado_por: usuario?.id ?? null,
            completado: evaluarCompletado(form, { registroParcial: true }),
            registro_parcial: true,
            // Cuál cuota es esta — para que las tablas de corte puedan
            // mostrar "Cuota 3" en vez de asumir que es la 1.
            num_cuota_pago: Number(numCuotaParcial),
            prima_anual: n(form.prima_anual),
            prima_neta: n(form.prima_neta),
            prima_primer_pago: n(form.prima_primer_pago),
            prima_primer_pago_neta: n(form.prima_primer_pago_neta),
            pol_pend_pago: n(form.pol_pend_pago),
            efectivo: n(form.efectivo),
            cheque: n(form.cheque),
            tdc: n(form.tdc),
            comprobante_tdc_url: form.comprobante_tdc_path,
            comprobante_cheque_url: form.comprobante_cheque_path,
            fotos_url: null,
            factura_url: null,
            t_circ_url: null,
            identif_url: null,
            identif_reverso_url: null,
            pol_ant_url: null,
            otro_url: null,
            acta_constitutiva_url: null,
            poderes_url: null,
            comprobante_domicilio_url: null,
            constancia_fiscal_url: null,
          }
        : {
            aseguradora: form.aseguradora,
            numero_poliza: form.numero_poliza,
            tipo_persona: form.tipo_persona,
            folio: form.folio || null,
            cobertura: form.cobertura || null,
            uso: form.uso || null,
            servicio: form.servicio || null,
            forma_pago: form.forma_pago,
            fecha_emision: form.fecha_emision,
            vigencia_inicio: form.vigencia_inicio,
            vigencia_fin: form.vigencia_fin || null,
            asegurado_nombre,
            asegurado_nombre_pila: form.asegurado_nombre_pila || null,
            asegurado_apellido_paterno: form.asegurado_apellido_paterno || null,
            asegurado_apellido_materno: form.asegurado_apellido_materno || null,
            telefono: form.telefono || null,
            vendedor_id: vendedorId,
            vendedor_nombre: vendedorNombre,
            placas: form.placas || null,
            num_serie: form.num_serie ? form.num_serie.toUpperCase() : null,
            tipo: form.tipo,
            autorizacion: form.autorizacion || null,
            observaciones: form.observaciones || null,
            fecha_corte: fechaCorteSel,
            oficina_id: usuario?.oficina_id ?? null,
            creado_por: usuario?.id ?? null,
            completado: evaluarCompletado(form),
            prima_anual: n(form.prima_anual),
            prima_neta: n(form.prima_neta),
            prima_primer_pago: n(form.prima_primer_pago),
            prima_primer_pago_neta: n(form.prima_primer_pago_neta),
            pol_pend_pago: n(form.pol_pend_pago),
            efectivo: n(form.efectivo),
            cheque: n(form.cheque),
            tdc: n(form.tdc),
            comprobante_tdc_url: form.comprobante_tdc_path,
            comprobante_cheque_url: form.comprobante_cheque_path,
            fotos_url: form.fotos_path,
            factura_url: form.factura_path,
            t_circ_url: form.t_circ_path,
            identif_url: form.identif_path,
            identif_reverso_url: form.identif_reverso_path,
            pol_ant_url: form.pol_ant_path,
            otro_url: form.otro_path,
            acta_constitutiva_url: form.acta_constitutiva_path,
            poderes_url: form.poderes_path,
            comprobante_domicilio_url: form.comprobante_domicilio_path,
            constancia_fiscal_url: form.constancia_fiscal_path,
            fotos_verificado: form.fotos_verificado,
            fotos_verificado_nota: form.fotos_verificado
              ? form.fotos_verificado_nota || null
              : null,
          };

      // Las cuotas 2..N (para COMPLETA y PARCIAL) las genera solo el
      // trigger de BD generar_cuotas_cofisem() — tanto al crear como en
      // cualquier edición posterior de forma_pago/primas mientras el
      // corte siga abierto. Insertarlas aquí también duplicaría lo que
      // el trigger ya hace y chocaría con su unique constraint.
      const { data, error } = await supabase
        .from("polizas_cofisem")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;

      // Si quedó saldo pendiente del primer pago (o de la cuota que se
      // registra en modo parcial), se crea la cuota real en pagos_cofisem
      // para poder "Poner al corriente" después — el mismo mecanismo que
      // ya existe para cuotas 2+. No se toca polizas_cofisem.pol_pend_pago:
      // se queda como el registro histórico de cuánto se debía al vender.
      // El vencimiento se pone un día después de este corte para que no
      // aparezca duplicada hoy mismo (hoy ya se ve en Pólizas del día).
      if (n(form.pol_pend_pago) > 0) {
        const numCuotaPendiente = esParcial ? Number(numCuotaParcial) : 1;
        const fechaVenc = new Date(fechaCorteSel + "T00:00:00");
        fechaVenc.setDate(fechaVenc.getDate() + 1);
        const { error: errCuota } = await supabase
          .from("pagos_cofisem")
          .insert({
            poliza_cofisem_id: data.id,
            num_cuota: numCuotaPendiente,
            prima_total: n(form.prima_primer_pago),
            prima_neta: n(form.prima_primer_pago_neta),
            fecha_vencimiento: fechaVenc.toISOString().split("T")[0],
            estatus: "PENDIENTE",
            oficina_id: usuario?.oficina_id ?? null,
            operador_id: usuario?.id ?? null,
          });
        if (errCuota) throw errCuota;
      }

      setPolizas((prev) => [...prev, data]);
      setVista("lista");
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(p) {
    const { isConfirmed } = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar esta póliza?",
      html: `Se borrará por completo la póliza <strong>${p.numero_poliza || p.folio || "sin número"}</strong>: el registro, sus cuotas/pagos, su comisión (si tenía) y todos los comprobantes y documentos que se hayan subido.<br/><br/><strong>Esta acción no se puede deshacer.</strong>`,
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar todo",
      cancelButtonText: "Cancelar",
      focusCancel: true,
    });
    if (!isConfirmed) return;

    try {
      // Las rutas de Storage se guardan en polizas_cofisem, pagos_cofisem y
      // comisiones_cofisem — hay que leerlas ANTES de borrar el registro,
      // porque el DELETE en cascada se lleva las filas de pagos_cofisem y
      // comisiones_cofisem (FK on delete cascade) junto con sus URLs.
      const [{ data: cuotas }, { data: comisiones }] = await Promise.all([
        supabase
          .from("pagos_cofisem")
          .select(
            "comprobante_url, comprobante_vale_url, comprobante_cheque_url, comprobante_tdc_url, endoso_url",
          )
          .eq("poliza_cofisem_id", p.id),
        supabase
          .from("comisiones_cofisem")
          .select("comprobante_url")
          .eq("poliza_cofisem_id", p.id),
      ]);

      const docsPaths = [
        p.fotos_url,
        p.factura_url,
        p.t_circ_url,
        p.identif_url,
        p.identif_reverso_url,
        p.pol_ant_url,
        p.otro_url,
        p.acta_constitutiva_url,
        p.poderes_url,
        p.comprobante_domicilio_url,
        p.constancia_fiscal_url,
      ].filter(Boolean);
      const comprobantesPaths = [
        p.comprobante_tdc_url,
        p.comprobante_cheque_url,
        p.comprobante_vale_url,
        p.endoso_url,
        ...(comisiones ?? []).map((c) => c.comprobante_url),
      ].filter(Boolean);
      const pagosPaths = (cuotas ?? [])
        .flatMap((c) => [
          c.comprobante_url,
          c.comprobante_vale_url,
          c.comprobante_cheque_url,
          c.comprobante_tdc_url,
          c.endoso_url,
        ])
        .filter(Boolean);

      const { error } = await supabase
        .from("polizas_cofisem")
        .delete()
        .eq("id", p.id);
      if (error) throw error;

      const removals = [];
      if (docsPaths.length)
        removals.push(
          supabase.storage.from(DOCUMENTACION_BUCKET).remove(docsPaths),
        );
      if (comprobantesPaths.length)
        removals.push(
          supabase.storage.from(COMPROBANTE_BUCKET).remove(comprobantesPaths),
        );
      if (pagosPaths.length)
        removals.push(
          supabase.storage.from(PAGOS_COMPROBANTE_BUCKET).remove(pagosPaths),
        );
      if (removals.length) await Promise.allSettled(removals);

      setPolizas((prev) => prev.filter((row) => row.id !== p.id));
      Swal.fire({
        icon: "success",
        title: "Póliza eliminada",
        text: "Se borró el registro, sus pagos/comisión y sus archivos.",
        confirmButtonColor: "#13193a",
        timer: 3500,
        timerProgressBar: true,
      });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: e.message,
        confirmButtonColor: "#13193a",
      });
    }
  }

  // ── VISTA FORMULARIO ─────────────────────────────────────────
  if (vista === "form")
    return (
      <div className="p-6 min-h-full bg-gray-50">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setVista("lista")}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Cancelar
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1447e6]">Nueva póliza</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {oficina} · {HOY_LABEL}
            </p>
          </div>
        </div>

        {/* Corte destino */}
        <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <label className={lblCls}>
            ¿A qué corte se registra esta póliza?
          </label>
          <input
            type="date"
            value={fechaCorteSel}
            max={HOY_ISO}
            onChange={(e) => setFechaCorteSel(e.target.value)}
            className={inpCls + " sm:w-56"}
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Por defecto es hoy. Elige un día anterior si esta venta se debe
            registrar en un corte ya pasado.
          </p>
          {corteDestinoCerrado && (
            <p className="text-xs text-red-500 font-semibold mt-1.5">
              El corte de ese día ya está cerrado — no se puede registrar ahí.
            </p>
          )}
        </div>

        {/* Tengo / No tengo la póliza */}
        <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            ¿Qué vienes a registrar?
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => cambiarModo("COMPLETA")}
              className={`flex-1 text-left px-4 py-3 rounded-xl border-2 transition-all ${
                modo === "COMPLETA"
                  ? "border-[#1447e6] bg-[#1447e6]/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p
                className={`text-sm font-bold ${modo === "COMPLETA" ? "text-[#1447e6]" : "text-gray-600"}`}
              >
                Tengo la póliza
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Póliza nueva o su primer pago — se captura completa: vigencia,
                vehículo, documentación.
              </p>
            </button>
            <button
              type="button"
              onClick={() => cambiarModo("PARCIAL")}
              className={`flex-1 text-left px-4 py-3 rounded-xl border-2 transition-all ${
                modo === "PARCIAL"
                  ? "border-[#1447e6] bg-[#1447e6]/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p
                className={`text-sm font-bold ${modo === "PARCIAL" ? "text-[#1447e6]" : "text-gray-600"}`}
              >
                No tengo la póliza
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Vienen a pagar una cuota subsecuente (2+), o el pago único de
                contado, de una póliza que no quedó registrada — solo datos
                básicos.
              </p>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between">
            {errorMsg}
            <button
              onClick={() => setErrorMsg(null)}
              className="text-red-400 hover:text-red-600 ml-3"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleGuardar} className="space-y-6">
          {/* ── S1: Póliza ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <SeccionHeader>Datos de la póliza</SeccionHeader>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={lblCls}>Tipo de persona</label>
                <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
                  <button
                    type="button"
                    onClick={() => setF("tipo_persona", "FISICA")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      form.tipo_persona === "FISICA"
                        ? "bg-white text-[#1447e6] shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    Persona física
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        tipo_persona: "MORAL",
                        // Una empresa no tiene apellidos — se limpian para no
                        // arrastrar datos de un tipo de persona anterior.
                        asegurado_apellido_paterno: "",
                        asegurado_apellido_materno: "",
                      }))
                    }
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      form.tipo_persona === "MORAL"
                        ? "bg-white text-[#1447e6] shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    Persona moral
                  </button>
                </div>
              </div>
              <div>
                <label className={lblCls}>
                  Aseguradora <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.aseguradora}
                  onChange={(e) => {
                    const aseguradora = e.target.value;
                    // GAMAN solo emite pólizas de taxi de servicio público —
                    // se precargan para no obligar al operador a elegirlas
                    // manualmente cada vez (sigue siendo editable).
                    const esGaman = aseguradora === "GAMAN";
                    setForm((prev) => ({
                      ...prev,
                      aseguradora,
                      uso: esGaman ? "SERVICIO" : "",
                      servicio: esGaman ? "PUBLICO" : "",
                      tipo: esGaman ? "TAXI" : prev.tipo,
                      cobertura: "",
                    }));
                  }}
                  required
                  className={inpCls}
                >
                  <option value="">Selecciona...</option>
                  {aseguradoras.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lblCls}>
                  No. Póliza <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.numero_poliza}
                  onChange={(e) =>
                    setF("numero_poliza", e.target.value.toUpperCase())
                  }
                  required
                  placeholder="Ej. 3413241"
                  className={inpCls}
                />
              </div>
              <div>
                <label className={lblCls}>Folio</label>
                <input
                  value={form.folio}
                  onChange={(e) => setF("folio", e.target.value.toUpperCase())}
                  placeholder="Ej. T0455"
                  className={inpCls}
                />
              </div>
              <div>
                <label className={lblCls}>Cobertura</label>
                <select
                  value={form.cobertura}
                  onChange={(e) => setF("cobertura", e.target.value)}
                  disabled={!form.aseguradora}
                  className={inpCls}
                >
                  <option value="">
                    {!form.aseguradora
                      ? "Elige aseguradora primero"
                      : "Selecciona..."}
                  </option>
                  {coberturaOpts.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lblCls}>
                  Forma de pago{" "}
                  {modo === "PARCIAL" && (
                    <span className="text-red-400">*</span>
                  )}
                </label>
                <select
                  value={form.forma_pago}
                  required={modo === "PARCIAL"}
                  onChange={(e) => {
                    const forma_pago = e.target.value;
                    setNumCuotaParcial(
                      modo === "PARCIAL" && forma_pago === "CONTADO" ? "1" : "",
                    );
                    setForm((prev) => ({
                      ...prev,
                      forma_pago,
                      prima_primer_pago: calcularPrimerPago(
                        prev.prima_anual,
                        forma_pago,
                      ),
                      prima_primer_pago_neta: calcularPrimerPago(
                        prev.prima_neta,
                        forma_pago,
                      ),
                    }));
                  }}
                  className={inpCls}
                >
                  {modo === "PARCIAL" && (
                    <option value="">Selecciona...</option>
                  )}
                  {(modo === "PARCIAL"
                    ? FORMA_PAGO_OPT_PARCIAL
                    : FORMA_PAGO_OPT
                  ).map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              {modo === "PARCIAL" && form.forma_pago && (
                <div>
                  <label className={lblCls}>
                    Cuota a registrar <span className="text-red-400">*</span>
                  </label>
                  {form.forma_pago === "CONTADO" ? (
                    <div
                      className={
                        inpCls +
                        " bg-gray-50 text-gray-500 font-semibold cursor-default"
                      }
                    >
                      Pago de contado — 1 de 1
                    </div>
                  ) : (
                    <select
                      value={numCuotaParcial}
                      required
                      onChange={(e) => setNumCuotaParcial(e.target.value)}
                      className={inpCls}
                    >
                      <option value="">Selecciona...</option>
                      {/* Se ofrece desde la cuota 1: registrar la 1 aquí crea
                          la póliza igual que en "Tengo la póliza" (el trigger
                          genera las 2..N), solo que incompleta — por eso más
                          abajo se exige el motivo en Observaciones. */}
                      {Array.from(
                        { length: DIVISOR_PAGO[form.forma_pago] ?? 1 },
                        (_, idx) => idx + 1,
                      ).map((num) => (
                        <option key={num} value={num}>
                          Cuota {num} de {DIVISOR_PAGO[form.forma_pago]}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── S2: Vigencia (solo si tienes la póliza) ── */}
          {modo === "COMPLETA" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <SeccionHeader>Vigencia</SeccionHeader>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={lblCls}>Fecha de emisión</label>
                  <input
                    type="date"
                    value={form.fecha_emision}
                    // min={FECHA_EMISION_MIN}
                    // max={FECHA_EMISION_MAX}
                    onChange={(e) => setF("fecha_emision", e.target.value)}
                    className={inpCls}
                  />
                </div>
                <div>
                  <label className={lblCls}>Inicio de vigencia</label>
                  <input
                    type="date"
                    value={form.vigencia_inicio}
                    // min={VIGENCIA_MIN}
                    // max={VIGENCIA_MAX}
                    onChange={(e) => setF("vigencia_inicio", e.target.value)}
                    className={inpCls}
                  />
                </div>
                <div>
                  <label className={lblCls}>Fin de vigencia</label>
                  <input
                    type="date"
                    value={form.vigencia_fin}
                    onChange={(e) => setF("vigencia_fin", e.target.value)}
                    className={inpCls}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── S3: Asegurado ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <SeccionHeader>Asegurado y vendedor</SeccionHeader>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className={lblCls}>
                  {esPersonaMoral(form.tipo_persona)
                    ? "Nombre de la Empresa"
                    : "Nombre(s)"}{" "}
                  <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.asegurado_nombre_pila}
                  onChange={(e) =>
                    setF("asegurado_nombre_pila", e.target.value.toUpperCase())
                  }
                  required
                  placeholder={
                    esPersonaMoral(form.tipo_persona)
                      ? "Nombre de la Empresa"
                      : "Nombre(s)"
                  }
                  className={inpCls}
                />
              </div>
              {!esPersonaMoral(form.tipo_persona) && (
                <>
                  <div>
                    <label className={lblCls}>
                      Apellido paterno <span className="text-red-400">*</span>
                    </label>
                    <input
                      value={form.asegurado_apellido_paterno}
                      onChange={(e) =>
                        setF(
                          "asegurado_apellido_paterno",
                          e.target.value.toUpperCase(),
                        )
                      }
                      required
                      placeholder="Apellido paterno"
                      className={inpCls}
                    />
                  </div>
                  <div>
                    <label className={lblCls}>Apellido materno</label>
                    <input
                      value={form.asegurado_apellido_materno}
                      onChange={(e) =>
                        setF(
                          "asegurado_apellido_materno",
                          e.target.value.toUpperCase(),
                        )
                      }
                      placeholder="Apellido materno"
                      className={inpCls}
                    />
                  </div>
                </>
              )}
              <div>
                <label className={lblCls}>
                  Teléfono{" "}
                  <span className="text-red-400">{!conVendedor && "*"}</span>
                </label>
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={(e) => setF("telefono", e.target.value)}
                  required={!conVendedor}
                  placeholder="777 000 0000"
                  className={inpCls}
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className={lblCls} style={{ marginBottom: 0 }}>
                    Vendedor
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-xs text-gray-500 font-medium">
                      Con vendedor
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !conVendedor;
                        setConVendedor(next);
                        if (!next) setF("vendedor_id", null);
                      }}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${conVendedor ? "bg-[#1447e6]" : "bg-gray-300"}`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${conVendedor ? "translate-x-[18px]" : "translate-x-[3px]"}`}
                      />
                    </button>
                  </label>
                </div>
                {!conVendedor ? (
                  <input
                    type="text"
                    value="COFISEM"
                    disabled
                    className={
                      inpCls + " bg-gray-100 text-gray-400 cursor-not-allowed"
                    }
                  />
                ) : (
                  <div className="flex gap-2">
                    <SelectTypeahead
                      value={form.vendedor_id ?? ""}
                      onChange={(e) =>
                        setF(
                          "vendedor_id",
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      className={inpCls + " flex-1"}
                    >
                      <option value="">Selecciona un vendedor</option>
                      {vendedores
                        .filter((v) => v.activo && v.id !== 1)
                        .map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.nombre} {v.apellido || ""}
                            {v.codigo ? ` (${v.codigo})` : ""}
                          </option>
                        ))}
                    </SelectTypeahead>
                    <button
                      type="button"
                      onClick={() => setModalVendedorAbierto(true)}
                      className="shrink-0 w-10 h-10 rounded-xl bg-[#1447e6] hover:bg-[#0f36b3] text-white flex items-center justify-center transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── S4: Vehículo — Placas/Serie/Tipo solo si tienes la póliza;
              Uso y Servicio son obligatorios en ambos modos. ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <SeccionHeader>Vehículo</SeccionHeader>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {modo === "COMPLETA" && (
                <>
                  <div>
                    <label className={lblCls}>Placas</label>
                    <input
                      value={form.placas}
                      onChange={(e) =>
                        setF("placas", e.target.value.toUpperCase())
                      }
                      placeholder="Ej. ABC-123 o TRÁMITE"
                      className={inpCls}
                    />
                  </div>
                  <div>
                    <label className={lblCls}>Número de serie</label>
                    <input
                      value={form.num_serie}
                      onChange={(e) =>
                        setF("num_serie", e.target.value.toUpperCase())
                      }
                      placeholder="Opcional — VIN del vehículo"
                      className={inpCls}
                    />
                  </div>
                  <div>
                    <label className={lblCls}>
                      Tipo de vehículo <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={form.tipo}
                      required
                      onChange={(e) => setF("tipo", e.target.value)}
                      className={inpCls}
                    >
                      {TIPO_OPT.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className={lblCls}>
                  Uso{" "}
                  {usoObligatorio && <span className="text-red-400">*</span>}
                </label>
                <select
                  value={form.uso}
                  required={usoObligatorio}
                  disabled={!form.aseguradora}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      uso: e.target.value,
                      servicio: "",
                    }))
                  }
                  className={inpCls}
                >
                  <option value="">
                    {!form.aseguradora
                      ? "Elige aseguradora primero"
                      : usosDisponibles.length === 0
                        ? "Sin uso definido para esta aseguradora"
                        : "Selecciona..."}
                  </option>
                  {usosDisponibles.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lblCls}>
                  Servicio{" "}
                  {servicioObligatorio && (
                    <span className="text-red-400">*</span>
                  )}
                </label>
                <select
                  value={form.servicio}
                  required={servicioObligatorio}
                  disabled={!form.uso}
                  onChange={(e) => setF("servicio", e.target.value)}
                  className={inpCls}
                >
                  <option value="">
                    {!form.uso
                      ? "Elige uso primero"
                      : serviciosDisponibles.length === 0
                        ? "Sin servicio definido para este uso"
                        : "Selecciona..."}
                  </option>
                  {serviciosDisponibles.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── S5: Cobro ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <SeccionHeader>Montos y cobro</SeccionHeader>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                ...(modo === "COMPLETA"
                  ? [
                      { k: "prima_anual", label: "Prima T. Anual" },
                      { k: "prima_neta", label: "Prima Neta Anual" },
                    ]
                  : []),
                {
                  k: "prima_primer_pago",
                  label:
                    modo === "PARCIAL"
                      ? "Prima T. de la cuota"
                      : "Prima T. 1er Pago",
                  req: true,
                },
                {
                  k: "prima_primer_pago_neta",
                  label:
                    modo === "PARCIAL"
                      ? "Prima N. de la cuota"
                      : "Prima N. 1er Pago",
                  req: true,
                },
              ].map((f) => (
                <div key={f.k}>
                  <label className={lblCls}>
                    {f.label}
                    {f.req && (
                      <span className="ml-1 text-[8px] italic font-bold text-[#D97757]">
                        (Verifica antes de continuar)
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form[f.k]}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (f.k === "prima_anual") {
                          setForm((prev) => ({
                            ...prev,
                            prima_anual: v,
                            prima_primer_pago: calcularPrimerPago(
                              v,
                              prev.forma_pago,
                            ),
                          }));
                        } else if (f.k === "prima_neta") {
                          setForm((prev) => ({
                            ...prev,
                            prima_neta: v,
                            prima_primer_pago_neta: calcularPrimerPago(
                              v,
                              prev.forma_pago,
                            ),
                          }));
                        } else {
                          setF(f.k, v);
                        }
                      }}
                      placeholder="0.00"
                      className={inpCls + " pl-7"}
                    />
                  </div>
                </div>
              ))}
              {[
                { k: "efectivo", label: "Efectivo" },
                { k: "cheque", label: "Transf / Dep." },
                { k: "tdc", label: "T. Crédito/Déb." },
                { k: "pol_pend_pago", label: "Pól. Pend. Pago" },
              ].map((f) => (
                <div key={f.k}>
                  <label className={lblCls}>{f.label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form[f.k]}
                      onChange={(e) => setF(f.k, e.target.value)}
                      placeholder="0.00"
                      className={inpCls + " pl-7"}
                    />
                  </div>
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className={lblCls}>Autorización</label>
                <input
                  value={form.autorizacion}
                  onChange={(e) =>
                    setF("autorizacion", e.target.value.toUpperCase())
                  }
                  placeholder="Código de autorización"
                  className={inpCls}
                />
              </div>
            </div>

            {(n(form.cheque) > 0 || n(form.tdc) > 0) && (
              <div className="mt-4 space-y-2">
                {n(form.cheque) > 0 && (
                  <ComprobanteField
                    obligatorio={false}
                    label="Comprobante de cheque / depósito / transferencia"
                    path={form.comprobante_cheque_path}
                    subiendo={subiendoComprobante === "cheque"}
                    onFile={(f) => handleComprobanteChange("cheque", f)}
                    onVer={() => handleVer(form.comprobante_cheque_path)}
                  />
                )}
                {n(form.tdc) > 0 && (
                  <ComprobanteField
                    obligatorio={false}
                    label="Comprobante de la terminal (ticket TDC)"
                    path={form.comprobante_tdc_path}
                    subiendo={subiendoComprobante === "tdc"}
                    onFile={(f) => handleComprobanteChange("tdc", f)}
                    onVer={() => handleVer(form.comprobante_tdc_path)}
                  />
                )}
                <p className="text-[11px] text-gray-400">
                  Si no los adjuntas ahora, podrás completarlos después desde la
                  tabla.
                </p>
              </div>
            )}
          </div>

          {/* ── S6: Documentación (solo si tienes la póliza) ── */}
          {modo === "COMPLETA" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <SeccionHeader>Documentación recibida</SeccionHeader>
              <p className="text-[11px] text-gray-400 -mt-2 mb-4">
                Opcional por ahora — puedes dejarla pendiente y subirla después,
                pero para cerrar el corte se exige identificación
                {esAmpliaOLimitada(form.cobertura)
                  ? ", fotos del vehículo (cobertura amplia/limitada) y al menos una de Factura, T. Circulación o Póliza anterior."
                  : " y al menos una de Fotos, Factura, T. Circulación o Póliza anterior."}
                {esPersonaMoral(form.tipo_persona) &&
                  " Por ser persona moral, también se exigen Acta constitutiva, Poderes, Comprobante de domicilio y Constancia de situación fiscal."}
              </p>
              <div className="space-y-2">
                <ComprobanteField
                  label="Identificación (frente)"
                  path={form.identif_path}
                  subiendo={subiendoDocumento === "identif"}
                  onFile={(f) => handleDocumentoChange("identif", f)}
                  onVer={() => handleVerDocumento(form.identif_path)}
                  obligatorio={esPersonaMoral(form.tipo_persona)}
                />
                <ComprobanteField
                  label="Identificación (reverso)"
                  path={form.identif_reverso_path}
                  subiendo={subiendoDocumento === "identif_reverso"}
                  onFile={(f) => handleDocumentoChange("identif_reverso", f)}
                  onVer={() => handleVerDocumento(form.identif_reverso_path)}
                  obligatorio={false}
                />
                <FotosVehiculoField
                  path={form.fotos_path}
                  verificado={form.fotos_verificado}
                  nota={form.fotos_verificado_nota}
                  subiendo={subiendoDocumento === "fotos"}
                  onFile={(f) => handleDocumentoChange("fotos", f)}
                  onVer={() => handleVerDocumento(form.fotos_path)}
                  onToggleVerificado={(v) => setF("fotos_verificado", v)}
                  onNotaChange={(v) => setF("fotos_verificado_nota", v)}
                  obligatorio={false}
                />
                <ComprobanteField
                  label="Factura"
                  path={form.factura_path}
                  subiendo={subiendoDocumento === "factura"}
                  onFile={(f) => handleDocumentoChange("factura", f)}
                  onVer={() => handleVerDocumento(form.factura_path)}
                  obligatorio={false}
                />
                <ComprobanteField
                  label="Tarjeta de circulación"
                  path={form.t_circ_path}
                  subiendo={subiendoDocumento === "t_circ"}
                  onFile={(f) => handleDocumentoChange("t_circ", f)}
                  onVer={() => handleVerDocumento(form.t_circ_path)}
                  obligatorio={false}
                />
                <ComprobanteField
                  label="Póliza anterior"
                  path={form.pol_ant_path}
                  subiendo={subiendoDocumento === "pol_ant"}
                  onFile={(f) => handleDocumentoChange("pol_ant", f)}
                  onVer={() => handleVerDocumento(form.pol_ant_path)}
                  obligatorio={false}
                />
                <ComprobanteField
                  label="Otro"
                  path={form.otro_path}
                  subiendo={subiendoDocumento === "otro"}
                  onFile={(f) => handleDocumentoChange("otro", f)}
                  onVer={() => handleVerDocumento(form.otro_path)}
                  obligatorio={false}
                />
                {esPersonaMoral(form.tipo_persona) && (
                  <>
                    <ComprobanteField
                      label="Acta constitutiva"
                      path={form.acta_constitutiva_path}
                      subiendo={subiendoDocumento === "acta_constitutiva"}
                      onFile={(f) =>
                        handleDocumentoChange("acta_constitutiva", f)
                      }
                      onVer={() =>
                        handleVerDocumento(form.acta_constitutiva_path)
                      }
                    />
                    <ComprobanteField
                      label="Poderes"
                      path={form.poderes_path}
                      subiendo={subiendoDocumento === "poderes"}
                      onFile={(f) => handleDocumentoChange("poderes", f)}
                      onVer={() => handleVerDocumento(form.poderes_path)}
                    />
                    <ComprobanteField
                      label="Comprobante de domicilio"
                      path={form.comprobante_domicilio_path}
                      subiendo={subiendoDocumento === "comprobante_domicilio"}
                      onFile={(f) =>
                        handleDocumentoChange("comprobante_domicilio", f)
                      }
                      onVer={() =>
                        handleVerDocumento(form.comprobante_domicilio_path)
                      }
                    />
                    <ComprobanteField
                      label="Constancia de situación fiscal"
                      path={form.constancia_fiscal_path}
                      subiendo={subiendoDocumento === "constancia_fiscal"}
                      onFile={(f) =>
                        handleDocumentoChange("constancia_fiscal", f)
                      }
                      onVer={() =>
                        handleVerDocumento(form.constancia_fiscal_path)
                      }
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── S7: Observaciones ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <SeccionHeader>
              Observaciones
              {exigeMotivoIncompleta && (
                <span className="ml-1 text-[8px] italic font-bold text-[#D97757] whitespace-normal">
                  (Indica porque ingresas una póliza incompleta con cuota 1)
                </span>
              )}
            </SeccionHeader>
            <textarea
              rows={3}
              value={form.observaciones}
              onChange={(e) => setF("observaciones", e.target.value)}
              required={exigeMotivoIncompleta}
              placeholder={
                exigeMotivoIncompleta
                  ? "Obligatorio: explica por qué la póliza no se registra completa..."
                  : "Notas adicionales, irregularidades, comentarios..."
              }
              className={inpCls + " resize-none"}
            />
          </div>

          {/* ── Acciones ── */}
          <div className="flex items-center justify-end gap-3 pb-6">
            <button
              type="button"
              onClick={() => setVista("lista")}
              className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1447e6] hover:bg-[#0f36b3] text-white text-sm font-bold disabled:opacity-50 transition-all shadow-sm shadow-[#1447e6]/15"
            >
              {guardando ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Guardando...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Registrar póliza
                </>
              )}
            </button>
          </div>
        </form>

        {modalVendedorAbierto && (
          <ModalNuevoVendedor
            onClose={() => setModalVendedorAbierto(false)}
            onGuardar={onGuardarVendedor}
            usuarioId={usuario?.id}
            oficina={oficina}
          />
        )}
      </div>
    );

  // ── VISTA LISTA ───────────────────────────────────────────────
  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[#1447e6]">Pólizas</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {oficina}
            </span>
            <span className="text-xs text-gray-400">
              {modoLista === "DIA"
                ? `Corte del ${fmt(fechaVista)}`
                : fechaFiltro
                  ? `Corte del ${fmt(fechaFiltro)}`
                  : "Todas las fechas"}
            </span>
            {corteCerrado && (
              <span className="text-[11px] font-bold text-gray-500 bg-gray-200 px-2.5 py-1 rounded-full">
                🔒 Corte cerrado
              </span>
            )}
          </div>
        </div>
        {!corteCerrado && (
          <button
            onClick={handleNueva}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1447e6] text-white text-sm font-semibold hover:bg-[#0f36b3] transition-all shadow-sm shadow-[#1447e6]/15"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Nueva póliza
          </button>
        )}
      </div>

      {/* Barra de controles — misma forma en ambos modos: al cambiar de
          "Por día" a "Todas" o al escribir en el buscador NADA se mueve. */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center rounded-xl border border-gray-200 bg-white p-1 shrink-0">
          {[
            { k: "DIA", label: "Por día" },
            { k: "TODAS", label: "Todas" },
          ].map((o) => (
            <button
              key={o.k}
              type="button"
              onClick={() => setModoLista(o.k)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                modoLista === o.k
                  ? "bg-[#1447e6] text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar póliza, asegurado, vendedor, folio…"
          className="flex-1 min-w-[220px] px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6]"
        />

        <select
          value={filtroAseg}
          onChange={(e) => setFiltroAseg(e.target.value)}
          className="shrink-0 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6]"
        >
          <option value="">Todas las aseguradoras</option>
          {asegurasEnLista.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="shrink-0 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6]"
        >
          <option value="">Todos los estados</option>
          <option value="COMPLETA">Completas</option>
          <option value="PENDIENTE">Pendientes</option>
        </select>

        <input
          type="date"
          max={HOY_ISO}
          value={modoLista === "DIA" ? fechaVista : fechaFiltro}
          onChange={(e) =>
            modoLista === "DIA"
              ? setFechaVista(e.target.value || HOY_ISO)
              : setFechaFiltro(e.target.value)
          }
          title={
            modoLista === "DIA"
              ? "Día de corte que se muestra"
              : "Filtrar por día de corte (vacío = todos)"
          }
          className="shrink-0 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6]"
        />
      </div>

      {corteCerrado && (
        <div className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600">
          El corte de hoy ya está cerrado — puedes seguir viéndolo, pero ya no
          se puede agregar, editar ni eliminar nada.
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          {errorMsg}
          <button
            onClick={() => setErrorMsg(null)}
            className="text-red-400 hover:text-red-600 ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-xs table-fixed">
          <colgroup>
            {COLUMNAS_TABLA.map((c, idx) => (
              <col key={idx} style={{ width: c.width }} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {COLUMNAS_TABLA.map((c, idx) => (
                <th
                  key={idx}
                  className={`text-[10px] font-bold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap ${
                    c.align === "right"
                      ? "text-right"
                      : c.align === "center"
                        ? "text-center"
                        : "text-left"
                  }`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td
                  colSpan={COLUMNAS_TABLA.length}
                  className="h-[440px] text-center align-middle text-sm text-gray-400"
                >
                  <span className="inline-flex items-center gap-2">
                    <svg
                      className="animate-spin w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Cargando…
                  </span>
                </td>
              </tr>
            ) : polizasPagina.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNAS_TABLA.length}
                  className="h-[440px] text-center align-middle text-sm text-gray-400"
                >
                  {busqueda ||
                  filtroAseg ||
                  filtroEstado ||
                  (modoLista === "TODAS" && fechaFiltro)
                    ? "Ninguna póliza coincide con la búsqueda o los filtros."
                    : modoLista === "TODAS"
                      ? "Aún no hay pólizas registradas en esta oficina."
                      : "Sin pólizas registradas este día."}
                </td>
              </tr>
            ) : (
              <>
                {polizasPagina.map((p) => (
                  <tr
                    key={p.id}
                    className="h-11 hover:bg-gray-50/60 transition-colors"
                  >
                    <td
                      className="px-4 font-mono font-bold text-[#1447e6] truncate"
                      title={p.numero_poliza || "—"}
                    >
                      {p.numero_poliza || "—"}
                    </td>
                    <td className="px-4 font-semibold text-gray-700 truncate">
                      {p.aseguradora || "—"}
                    </td>
                    <td
                      className="px-4 text-gray-700 truncate"
                      title={p.asegurado_nombre || "—"}
                    >
                      {abreviarNombre(p.asegurado_nombre)}
                    </td>
                    <td
                      className="px-4 text-gray-500 truncate"
                      title={p.cobertura || "—"}
                    >
                      {p.cobertura || "—"}
                    </td>
                    <td
                      className="px-4 text-gray-500 truncate"
                      title={p.forma_pago || "—"}
                    >
                      {p.forma_pago || "—"}
                    </td>
                    <td
                      className="px-4 text-gray-600 truncate"
                      title={metodoPago(p)}
                    >
                      {metodoPago(p)}
                    </td>
                    <td className="px-4 text-center font-bold text-gray-500">
                      {p.num_cuota_pago ?? 1}
                    </td>
                    <td className="px-4 text-gray-500 whitespace-nowrap">
                      {fmt(p.fecha_corte)}
                    </td>
                    <td className="px-4 text-right text-gray-700 tabular-nums">
                      {$(p.prima_anual)}
                    </td>
                    <td className="px-4 text-right font-bold text-emerald-700 tabular-nums">
                      {$(p.prima_primer_pago)}
                    </td>
                    <td className="px-4">
                      <span
                        className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          p.completado
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {p.completado ? "Completa" : "Incompleta"}
                      </span>
                    </td>
                    <td className="px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          title="Ver detalle"
                          onClick={() => setModalDetalle(p)}
                          className="w-7 h-7 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-[#1447e6] transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Endosos"
                          onClick={() => setModalEndososRow(p)}
                          className="w-7 h-7 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-[#1447e6] transition-colors"
                        >
                          <FileSignature className="w-3.5 h-3.5" />
                        </button>
                        {!corteCerrado && (
                          <button
                            type="button"
                            title="Editar todos los datos de la póliza"
                            onClick={() => {
                              // El lápiz siempre abre en modo edición
                              // (soloEditar=true): muestra la fecha de corte
                              // hasta arriba y toda la identidad de la póliza.
                              // "Completar" es otra acción (botón de /corte),
                              // no esta.
                              setModalEditar(true);
                              setModalRow(p);
                            }}
                            className="w-7 h-7 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-[#1447e6] transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!corteCerrado && (
                          <button
                            type="button"
                            title="Eliminar"
                            onClick={() => handleEliminar(p)}
                            className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {Array.from({
                  length: POR_PAGINA - polizasPagina.length,
                }).map((_, k) => (
                  <tr key={`pad-${k}`} className="h-11">
                    <td colSpan={COLUMNAS_TABLA.length} />
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>

        {/* Pie: conteo + total + paginación (siempre presente) */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/50 text-xs">
          <span className="text-gray-500">
            <strong className="text-gray-700">{polizasFiltradas.length}</strong>{" "}
            registros · 1er pago total{" "}
            <strong className="text-emerald-700 tabular-nums">
              {$(totalPrimerPago)}
            </strong>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={paginaSegura <= 1}
              className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-gray-500 tabular-nums">
              {paginaSegura} / {totalPaginas}
            </span>
            <button
              type="button"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaSegura >= totalPaginas}
              className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <CompletarPolizaModal
        row={modalRow}
        usuario={usuario}
        soloEditar={modalEditar}
        onClose={() => {
          setModalRow(null);
          setModalEditar(false);
        }}
        onSaved={(data) => {
          // En modo "Todas" la póliza sigue en la lista aunque cambie de
          // corte. En modo "Por día", si al editar se movió a otro día ya
          // no pertenece a la vista actual y se quita.
          setPolizas((prev) =>
            modoLista === "TODAS" || data.fecha_corte === fechaVista
              ? prev.map((p) => (p.id === data.id ? data : p))
              : prev.filter((p) => p.id !== data.id),
          );
          setModalRow(null);
          setModalEditar(false);
        }}
      />

      <DetallePolizaModal
        row={modalDetalle}
        onClose={() => setModalDetalle(null)}
      />

      <ModalEndososPoliza
        poliza={modalEndososRow}
        usuario={usuario}
        corteCerrado={corteCerrado}
        onClose={() => setModalEndososRow(null)}
      />
    </div>
  );
}

// ── Modal de solo lectura: todo el detalle de la póliza ──────────
function DetallePolizaModal({ row, onClose }) {
  if (!row) return null;
  const p = row;
  const creador = p.creador
    ? [p.creador.nombre, p.creador.apellido].filter(Boolean).join(" ")
    : "—";

  const Campo = ({ label, children }) => (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm text-gray-700 mt-0.5 break-words">
        {children ?? "—"}
      </p>
    </div>
  );
  const Seccion = ({ titulo, children }) => (
    <div>
      <p className="text-[11px] font-bold text-[#1447e6] uppercase tracking-wide mb-2">
        {titulo}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
        {children}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[88vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#1447e6]">
              Detalle de póliza
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              <span className="font-mono font-semibold text-gray-600">
                {p.numero_poliza || "—"}
              </span>{" "}
              · {p.asegurado_nombre || "—"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                p.completado
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {p.completado ? "Completa" : "Incompleta"}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <Seccion titulo="Póliza">
            <Campo label="Número">{p.numero_poliza}</Campo>
            <Campo label="Folio">{p.folio}</Campo>
            <Campo label="Aseguradora">{p.aseguradora}</Campo>
            <Campo label="Tipo de persona">
              {p.tipo_persona === "MORAL" ? "Persona moral" : "Persona física"}
            </Campo>
            <Campo label="Cobertura">{p.cobertura}</Campo>
            <Campo label="F. emisión">{fmt(p.fecha_emision)}</Campo>
            <Campo label="Vigencia">
              {fmt(p.vigencia_inicio)} – {fmt(p.vigencia_fin)}
            </Campo>
            <Campo label="Día de corte">{fmt(p.fecha_corte)}</Campo>
          </Seccion>

          <Seccion titulo="Asegurado y vehículo">
            <Campo label="Asegurado">{p.asegurado_nombre}</Campo>
            <Campo label="Teléfono">{p.telefono}</Campo>
            <Campo label="Placas">{p.placas}</Campo>
            <Campo label="Núm. serie">{p.num_serie}</Campo>
            <Campo label="Tipo / uso / servicio">
              {[p.tipo, p.uso, p.servicio].filter(Boolean).join(" · ") || "—"}
            </Campo>
          </Seccion>

          <Seccion titulo="Pago">
            <Campo label="Plan">{p.forma_pago}</Campo>
            <Campo label="Método">{metodoPago(p)}</Campo>
            <Campo label="Cuota">{p.num_cuota_pago ?? 1}</Campo>
            <Campo label="Prima total anual">{$(p.prima_anual)}</Campo>
            <Campo label="Prima neta anual">{$(p.prima_neta)}</Campo>
            <Campo label="1er pago total">{$(p.prima_primer_pago)}</Campo>
            <Campo label="1er pago neta">{$(p.prima_primer_pago_neta)}</Campo>
            <Campo label="Efectivo">{$(p.efectivo)}</Campo>
            <Campo label="Cheque / dep.">{$(p.cheque)}</Campo>
            <Campo label="T. crédito/déb.">{$(p.tdc)}</Campo>
            <Campo label="Pól. pend. pago">{$(p.pol_pend_pago)}</Campo>
          </Seccion>

          <Seccion titulo="Otros">
            <Campo label="Vendedor">{p.vendedor_nombre}</Campo>
            <Campo label="Emitió / capturó">{creador}</Campo>
            <Campo label="Observaciones">{p.observaciones}</Campo>
          </Seccion>
        </div>
      </div>
    </div>
  );
}
