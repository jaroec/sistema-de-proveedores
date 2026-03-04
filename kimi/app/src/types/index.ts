// Tipos principales de la aplicación FinancePro

export type Moneda = 'VES' | 'USD';
export type TipoPago = 'contado' | 'credito';
export type PlazoCredito = 3 | 5 | 7;
export type TipoGasto = 'papeles' | 'viaticos' | 'mantenimiento' | 'otros';
export type RolPersona = 'admin' | 'vendedor' | 'contador' | 'otro';

// ==================== CLIENTES ====================
export interface Cliente {
  id: string;
  rif: string;
  nombreEncargado: string;
  nombreNegocio: string;
  limiteCredito: number;
  plazoCredito: PlazoCredito;
  fechaRegistro: string;
  activo: boolean;
}

export interface FacturaCliente {
  id: string;
  numeroFactura: string;
  clienteId: string;
  fecha: string;
  montoVES: number;
  montoUSD: number;
  tasaCambio: number;
  tipoPago: TipoPago;
  plazoCredito?: PlazoCredito;
  fechaVencimiento?: string;
  estado: 'pendiente' | 'parcial' | 'pagada' | 'vencida';
  montoPagadoVES: number;
  montoPagadoUSD: number;
  saldoPendienteVES: number;
  saldoPendienteUSD: number;
}

export interface AbonoCliente {
  id: string;
  facturaId: string;
  clienteId: string;
  fecha: string;
  metodoPagoId: string;
  moneda: Moneda;
  montoVES: number;
  montoUSD: number;
  tasaCambio: number;
  cuentaReceptoraId: string;
}

// ==================== PROVEEDORES ====================
export interface Proveedor {
  id: string;
  nombreEmpresa: string;
  rif: string;
  fechaRegistro: string;
  activo: boolean;
}

export interface FacturaProveedor {
  id: string;
  proveedorId: string;
  fecha: string;
  montoVES: number;
  montoUSD: number;
  tasaCambio: number;
  tipoPago: TipoPago;
  diasCredito?: number;
  fechaVencimiento?: string;
  estado: 'pendiente' | 'parcial' | 'pagada' | 'vencida';
  montoPagadoVES: number;
  montoPagadoUSD: number;
  saldoPendienteVES: number;
  saldoPendienteUSD: number;
}

export interface PagoProveedor {
  id: string;
  facturaId: string;
  proveedorId: string;
  fecha: string;
  metodoPagoId: string;
  moneda: Moneda;
  montoVES: number;
  montoUSD: number;
  tasaCambio: number;
  cuentaEmisoraId: string;
}

// ==================== MÉTODOS DE PAGO ====================
export interface MetodoPago {
  id: string;
  nombreBanco: string;
  saldoInicial: number;
  saldoActual: number;
  tipoMoneda: Moneda;
  fechaRegistro: string;
  activo: boolean;
}

// ==================== TASA DE CAMBIO ====================
export interface TasaCambio {
  id: string;
  fecha: string;
  montoVES: number;
}

// ==================== GASTOS ====================
export interface Gasto {
  id: string;
  personaId: string;
  tipoGasto: TipoGasto;
  descripcion: string;
  fecha: string;
  montoVES: number;
  montoUSD: number;
  tasaCambio: number;
  metodoPagoId: string;
}

// ==================== INGRESOS ====================
export interface Ingreso {
  id: string;
  fecha: string;
  montoVES: number;
  montoUSD: number;
  tasaCambio: number;
  cuentaReceptoraId: string;
  descripcion: string;
}

// ==================== PERSONAS ====================
export interface Persona {
  id: string;
  nombres: string;
  rol: RolPersona;
  fechaRegistro: string;
  activo: boolean;
}

// ==================== NOTIFICACIONES ====================
export interface Notificacion {
  id: string;
  tipo: 'vencimiento' | 'vencida' | 'limite_credito';
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  entidadId: string;
  entidadTipo: 'cliente' | 'proveedor';
}

// ==================== ESTADOS DEL SISTEMA ====================
export interface AppState {
  clientes: Cliente[];
  facturasClientes: FacturaCliente[];
  abonosClientes: AbonoCliente[];
  proveedores: Proveedor[];
  facturasProveedores: FacturaProveedor[];
  pagosProveedores: PagoProveedor[];
  metodosPago: MetodoPago[];
  tasasCambio: TasaCambio[];
  gastos: Gasto[];
  ingresos: Ingreso[];
  personas: Persona[];
  notificaciones: Notificacion[];
}

// ==================== REPORTES ====================
export interface ResumenFinanciero {
  totalCuentasPorCobrarVES: number;
  totalCuentasPorCobrarUSD: number;
  totalCuentasPorPagarVES: number;
  totalCuentasPorPagarUSD: number;
  totalGastosVES: number;
  totalGastosUSD: number;
  totalIngresosVES: number;
  totalIngresosUSD: number;
  saldoTotalVES: number;
  saldoTotalUSD: number;
}

export interface EstadisticaMensual {
  mes: string;
  ingresosVES: number;
  ingresosUSD: number;
  gastosVES: number;
  gastosUSD: number;
  facturasEmitidas: number;
  facturasPagadas: number;
}
