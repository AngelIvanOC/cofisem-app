export const NAV_POR_ROL = {

  // ── OPERADOR ──────────────────────────────────────────────
  OPERADOR: [
    { label: "Inicio",     path: "/gaman/dashboard",  icon: "home"        },
    { label: "Clientes",   path: "/gaman/clientes",   icon: "users"       },
    { label: "Pólizas",   path: "/gaman/polizas",    icon: "file-text"   },
    { label: "Vendedores", path: "/gaman/vendedores", icon: "hard-hat"    },
    { label: "Pagos",      path: "/gaman/pagos",      icon: "credit-card" },
  ],

  // ── ANALISTA ──────────────────────────────────────────────
  ANALISTA: [
    { label: "Inicio",       path: "/gaman/dashboard",    icon: "home"       },
    { label: "Pólizas",      path: "/gaman/polizas",      icon: "file-text"  },
    { label: "Pagos",        path: "/gaman/pagos",        icon: "credit-card"},
    { label: "Reportes",     path: "/gaman/reportes",     icon: "bar-chart"  },
    { label: "Corte diario", path: "/gaman/corte-diario", icon: "calendar"   },
  ],

  // ── ADMINISTRACIÓN ────────────────────────────────────────
  ADMINISTRACION: [
    { label: "Inicio",       path: "/gaman/dashboard",    icon: "home"       },
    { label: "Pólizas",      path: "/gaman/polizas",      icon: "file-text"  },
    { label: "Pagos",        path: "/gaman/pagos",        icon: "credit-card"},
    { label: "Usuarios",     path: "/gaman/usuarios",     icon: "shield"     },
    { label: "Reportes",     path: "/gaman/reportes",     icon: "bar-chart"  },
    { label: "Clientes",     path: "/gaman/clientes",     icon: "users"      },
    { label: "Vendedores",   path: "/gaman/vendedores",   icon: "hard-hat"   },
    { label: "Corte diario", path: "/gaman/corte-diario", icon: "calendar"   },
  ],

  // ── CABINERO SINIESTROS ───────────────────────────────────
  CABINERO_SINIESTROS: [
    { label: "Inicio",             path: "/gaman/dashboard",        icon: "home"       },
    { label: "Reportar siniestro", path: "/gaman/siniestros/nuevo", icon: "plus-circle"},
    { label: "Siniestros",         path: "/gaman/siniestros",       icon: "clipboard"  },
  ],

  // ── AJUSTADOR ─────────────────────────────────────────────
  AJUSTADOR: [
    { label: "Inicio",         path: "/gaman/dashboard",  icon: "home"      },
    { label: "Mis siniestros", path: "/gaman/siniestros", icon: "clipboard" },
  ],

  // ── SUPERVISOR SINIESTROS ─────────────────────────────────
  SUPERVISOR_SINIESTROS: [
    { label: "Inicio",      path: "/gaman/dashboard",          icon: "home"      },
    { label: "Siniestros",  path: "/gaman/siniestros",          icon: "clipboard" },
    { label: "Ajustadores", path: "/gaman/ajustadores",         icon: "users"     },
    { label: "Reportes",    path: "/gaman/reportes-siniestros", icon: "bar-chart" },
  ],

  // ── VENTAS ────────────────────────────────────────────────
  VENTAS: [
    { label: "Inicio",       path: "/gaman/dashboard",           icon: "home"       },
    { label: "Metas",        path: "/gaman/ventas-metas",        icon: "bar-chart"  },
    { label: "Reportes",     path: "/gaman/ventas-reportes",     icon: "trending-up"},
    { label: "Vendedores",   path: "/gaman/ventas-vendedores",   icon: "users"      },
    { label: "Cotizaciones", path: "/gaman/ventas-cotizaciones", icon: "file-text"  },
  ],
};
