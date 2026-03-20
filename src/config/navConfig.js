// ============================================================
// src/config/navConfig.js
// ── Fixes:
//   • "Reportar Sin." → "Reportar Siniestro" (label completo)
//   • Eliminado `exact: true` (no lo usa el Sidebar, era dead code)
//   • Orden lógico en ADMINISTRACION: primero las más usadas
// ============================================================

export const NAV_POR_ROL = {

  OPERADOR: [
  { label: "Inicio",       path: "/dashboard",    icon: "home"        },
  { label: "Clientes",     path: "/clientes",     icon: "users"       },
  { label: "Pólizas",      path: "/polizas",      icon: "file-text"   },
  { label: "Vendedores",   path: "/vendedores",   icon: "hard-hat"    },
  { label: "Corte diario", path: "/corte-diario", icon: "calendar"    },
],

  ANALISTA: [
  { label: "Inicio",        path: "/dashboard",    icon: "home"        },
  { label: "Pólizas",       path: "/polizas",      icon: "file-text"   },
  { label: "Pagos",         path: "/pagos",         icon: "credit-card" },
  { label: "Reportes",      path: "/reportes",     icon: "bar-chart"   },
  { label: "Corte diario",  path: "/corte-diario", icon: "calendar"    },
],

  ADMINISTRACION: [
  { label: "Inicio",       path: "/dashboard",    icon: "home"        },
  { label: "Pólizas",      path: "/polizas",      icon: "file-text"   },
  { label: "Endosos",      path: "/endosos",      icon: "edit"        },
  { label: "Pagos",        path: "/pagos",        icon: "credit-card" },
  { label: "Usuarios",     path: "/usuarios",     icon: "shield"      },
  { label: "Reportes",     path: "/reportes",     icon: "bar-chart"   },
  { label: "Clientes",     path: "/clientes",     icon: "users"       },
  { label: "Vendedores",   path: "/vendedores",   icon: "hard-hat"    },
  { label: "Corte diario", path: "/corte-diario", icon: "calendar"    },
],

  CABINERO_SINIESTROS: [
    { label: "Inicio",             path: "/dashboard",        icon: "home"        },
    { label: "Reportar Siniestro", path: "/siniestros/nuevo", icon: "calendar"    },
    { label: "Siniestros",         path: "/siniestros",       icon: "edit-square" },
  ],

  AJUSTADOR: [
    { label: "Inicio",         path: "/dashboard",     icon: "home"          },
    { label: "Mis Siniestros", path: "/mis-siniestros",    icon: "clipboard"     },
    { label: "Documentación",  path: "/documentacion", icon: "upload"        },
    { label: "Resolución",     path: "/resolucion",    icon: "check-circle"  },
  ],

 SUPERVISOR_SINIESTROS: [
  { label:"Inicio",      path:"/dashboard",          icon:"home"      },
  { label:"Siniestros",  path:"/siniestros",          icon:"clipboard" },
  { label:"Ajustadores", path:"/ajustadores",         icon:"users"     },
  { label:"Reportes",    path:"/reportes-siniestros", icon:"bar-chart" },
],

  VENTAS: [
  { label:"Inicio",          path:"/dashboard",           icon:"home"       },
  { label:"Metas",           path:"/ventas-metas",        icon:"bar-chart"  },
  { label:"Reportes",        path:"/ventas-reportes",     icon:"trending-up"},
  { label:"Vendedores",      path:"/ventas-vendedores",   icon:"users"      },
  { label:"Cotizaciones",    path:"/ventas-cotizaciones", icon:"file-text"  },
],
};