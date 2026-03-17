export const NAV_POR_ROL = {

  OPERADOR: [
    { label: "Inicio",       path: "/dashboard",    icon: "home" },
    { label: "Clientes",     path: "/clientes",     icon: "users" },
    { label: "Pólizas",      path: "/polizas",      icon: "file-text" },
    { label: "Cotizaciones", path: "/cotizaciones", icon: "dollar-sign" },
    { label: "Vendedores",   path: "/vendedores",   icon: "hard-hat" },
  ],

  ANALISTA: [
    { label: "Inicio",   path: "/dashboard", icon: "home" },
    { label: "Pólizas",  path: "/polizas",   icon: "file-text" },
    { label: "Pagos",    path: "/pagos",     icon: "credit-card" },
    { label: "Reportes", path: "/reportes",  icon: "bar-chart" },
  ],

  ADMINISTRACION: [
    { label: "Inicio",     path: "/dashboard",  icon: "home" },
    { label: "Pólizas",    path: "/polizas",    icon: "file-text" },
    { label: "Endosos",    path: "/endosos",    icon: "edit" },
    { label: "Pagos",      path: "/pagos",      icon: "credit-card" },
    { label: "Usuarios",   path: "/usuarios",   icon: "shield" },
    { label: "Reportes",   path: "/reportes",   icon: "bar-chart" },
    { label: "Clientes",   path: "/clientes",   icon: "users" },
    { label: "Vendedores", path: "/vendedores", icon: "hard-hat" },
  ],

  CABINERO_SINIESTROS: [
    { label: "Inicio",        path: "/dashboard",        icon: "home",        exact: true },
    { label: "Reportar Sin.", path: "/siniestros/nuevo", icon: "calendar",    exact: true },
    { label: "Siniestros",    path: "/siniestros",       icon: "edit-square", exact: true },
  ],

  AJUSTADOR: [
    { label: "Inicio",         path: "/dashboard",     icon: "home" },
    { label: "Mis Siniestros", path: "/siniestros",    icon: "clipboard" },
    { label: "Documentación",  path: "/documentacion", icon: "upload" },
    { label: "Resolución",     path: "/resolucion",    icon: "check-circle" },
  ],

  SUPERVISOR_SINIESTROS: [
    { label: "Inicio",       path: "/dashboard",    icon: "home" },
    { label: "Siniestros",   path: "/siniestros",   icon: "clipboard" },
    { label: "Reasignación", path: "/reasignacion", icon: "refresh-cw" },
    { label: "Reportes",     path: "/reportes",     icon: "bar-chart" },
  ],

  VENTAS: [
    { label: "Inicio",   path: "/dashboard", icon: "home" },
    { label: "Metas",    path: "/metas",     icon: "target" },
    { label: "Reportes", path: "/reportes",  icon: "bar-chart" },
  ],
};