// ============================================================
// src/config/navConfig.js — VERSIÓN FINAL
// Todas las rutas verificadas contra App.jsx y RUTAS_POR_ROL.
//
// REGLAS:
//  • Cada path aquí debe existir como <Route> en App.jsx
//  • Si una acción ocurre dentro de otra sección (modal/tab),
//    NO necesita entrada propia en el nav.
// ============================================================

export const NAV_POR_ROL = {

  // ── OPERADOR ──────────────────────────────────────────────
  // Cotizaciones = tab dentro de /polizas (OperadorPolizas)
  // El dashboard tiene acceso rápido a Cotizar / Nueva cotización
  OPERADOR: [
    { label: "Inicio",       path: "/dashboard",    icon: "home"       },
    { label: "Clientes",     path: "/clientes",     icon: "users"      },
    { label: "Pólizas",      path: "/polizas",      icon: "file-text"  },
    { label: "Vendedores",   path: "/vendedores",   icon: "hard-hat"   },
    { label: "Corte diario", path: "/corte-diario", icon: "calendar"   },
  ],

  // ── ANALISTA ──────────────────────────────────────────────
  ANALISTA: [
    { label: "Inicio",       path: "/dashboard",    icon: "home"       },
    { label: "Pólizas",      path: "/polizas",      icon: "file-text"  },
    { label: "Pagos",        path: "/pagos",        icon: "credit-card"},
    { label: "Reportes",     path: "/reportes",     icon: "bar-chart"  },
    { label: "Corte diario", path: "/corte-diario", icon: "calendar"   },
  ],

  // ── ADMINISTRACIÓN ────────────────────────────────────────
  // Endosos = tab dentro de /polizas (AdminPolizas)
  ADMINISTRACION: [
    { label: "Inicio",       path: "/dashboard",    icon: "home"       },
    { label: "Pólizas",      path: "/polizas",      icon: "file-text"  },
    { label: "Pagos",        path: "/pagos",        icon: "credit-card"},
    { label: "Usuarios",     path: "/usuarios",     icon: "shield"     },
    { label: "Reportes",     path: "/reportes",     icon: "bar-chart"  },
    { label: "Clientes",     path: "/clientes",     icon: "users"      },
    { label: "Vendedores",   path: "/vendedores",   icon: "hard-hat"   },
    { label: "Corte diario", path: "/corte-diario", icon: "calendar"   },
  ],

  // ── CABINERO SINIESTROS ───────────────────────────────────
  CABINERO_SINIESTROS: [
    { label: "Inicio",             path: "/dashboard",        icon: "home"       },
    { label: "Reportar siniestro", path: "/siniestros/nuevo", icon: "plus-circle"},
    { label: "Siniestros",         path: "/siniestros",       icon: "clipboard"  },
  ],

  // ── AJUSTADOR ─────────────────────────────────────────────
  // Documentación y Resolución = pasos internos de AjustadorSiniestros
  // El flujo de 4 pasos ocurre dentro de /siniestros — no necesitan ruta propia
  AJUSTADOR: [
    { label: "Inicio",         path: "/dashboard",  icon: "home"      },
    { label: "Mis siniestros", path: "/siniestros", icon: "clipboard" },
  ],

  // ── SUPERVISOR SINIESTROS ─────────────────────────────────
  // Reasignación ocurre en modal dentro de /siniestros (SupervisorSiniestros)
  SUPERVISOR_SINIESTROS: [
    { label: "Inicio",      path: "/dashboard",          icon: "home"      },
    { label: "Siniestros",  path: "/siniestros",          icon: "clipboard" },
    { label: "Ajustadores", path: "/ajustadores",         icon: "users"     },
    { label: "Reportes",    path: "/reportes-siniestros", icon: "bar-chart" },
  ],

  // ── VENTAS ────────────────────────────────────────────────
  // Prefijos /ventas-* evitan colisiones con /reportes de analista/admin
  VENTAS: [
    { label: "Inicio",       path: "/dashboard",           icon: "home"       },
    { label: "Metas",        path: "/ventas-metas",        icon: "bar-chart"  },
    { label: "Reportes",     path: "/ventas-reportes",     icon: "trending-up"},
    { label: "Vendedores",   path: "/ventas-vendedores",   icon: "users"      },
    { label: "Cotizaciones", path: "/ventas-cotizaciones", icon: "file-text"  },
  ],
};