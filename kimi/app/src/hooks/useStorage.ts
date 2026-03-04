import { useState, useEffect, useCallback } from 'react';
import type { 
  AppState, 
  Cliente, 
  FacturaCliente, 
  AbonoCliente,
  Proveedor, 
  FacturaProveedor, 
  PagoProveedor,
  MetodoPago, 
  TasaCambio, 
  Gasto, 
  Ingreso, 
  Persona,
  Notificacion 
} from '@/types';

const STORAGE_KEY = 'financepro_data';

const initialState: AppState = {
  clientes: [],
  facturasClientes: [],
  abonosClientes: [],
  proveedores: [],
  facturasProveedores: [],
  pagosProveedores: [],
  metodosPago: [],
  tasasCambio: [],
  gastos: [],
  ingresos: [],
  personas: [],
  notificaciones: [],
};

export function useStorage() {
  const [data, setData] = useState<AppState>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setData({ ...initialState, ...parsed });
      } catch (e) {
        console.error('Error parsing stored data:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Guardar datos cuando cambien
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, isLoaded]);

  // ==================== CLIENTES ====================
  const addCliente = useCallback((cliente: Omit<Cliente, 'id' | 'fechaRegistro'>) => {
    const newCliente: Cliente = {
      ...cliente,
      id: crypto.randomUUID(),
      fechaRegistro: new Date().toISOString(),
    };
    setData(prev => ({ ...prev, clientes: [...prev.clientes, newCliente] }));
    return newCliente;
  }, []);

  const updateCliente = useCallback((id: string, updates: Partial<Cliente>) => {
    setData(prev => ({
      ...prev,
      clientes: prev.clientes.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  }, []);

  const deleteCliente = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      clientes: prev.clientes.filter(c => c.id !== id)
    }));
  }, []);

  // ==================== FACTURAS CLIENTES ====================
  const addFacturaCliente = useCallback((factura: Omit<FacturaCliente, 'id' | 'estado' | 'montoPagadoVES' | 'montoPagadoUSD' | 'saldoPendienteVES' | 'saldoPendienteUSD'>) => {
    const newFactura: FacturaCliente = {
      ...factura,
      id: crypto.randomUUID(),
      estado: 'pendiente',
      montoPagadoVES: 0,
      montoPagadoUSD: 0,
      saldoPendienteVES: factura.montoVES,
      saldoPendienteUSD: factura.montoUSD,
    };
    setData(prev => ({ ...prev, facturasClientes: [...prev.facturasClientes, newFactura] }));
    return newFactura;
  }, []);

  const updateFacturaCliente = useCallback((id: string, updates: Partial<FacturaCliente>) => {
    setData(prev => ({
      ...prev,
      facturasClientes: prev.facturasClientes.map(f => f.id === id ? { ...f, ...updates } : f)
    }));
  }, []);

  // ==================== ABONOS CLIENTES ====================
  const addAbonoCliente = useCallback((abono: Omit<AbonoCliente, 'id'>) => {
    const newAbono: AbonoCliente = {
      ...abono,
      id: crypto.randomUUID(),
    };
    
    setData(prev => {
      const factura = prev.facturasClientes.find(f => f.id === abono.facturaId);
      if (!factura) return prev;

      const newMontoPagadoVES = factura.montoPagadoVES + abono.montoVES;
      const newMontoPagadoUSD = factura.montoPagadoUSD + abono.montoUSD;
      const newSaldoPendienteVES = factura.montoVES - newMontoPagadoVES;
      const newSaldoPendienteUSD = factura.montoUSD - newMontoPagadoUSD;

      let newEstado: FacturaCliente['estado'] = 'parcial';
      if (newSaldoPendienteVES <= 0 && newSaldoPendienteUSD <= 0) {
        newEstado = 'pagada';
      }

      return {
        ...prev,
        abonosClientes: [...prev.abonosClientes, newAbono],
        facturasClientes: prev.facturasClientes.map(f => 
          f.id === abono.facturaId 
            ? { 
                ...f, 
                montoPagadoVES: newMontoPagadoVES,
                montoPagadoUSD: newMontoPagadoUSD,
                saldoPendienteVES: newSaldoPendienteVES,
                saldoPendienteUSD: newSaldoPendienteUSD,
                estado: newEstado
              } 
            : f
        )
      };
    });
    
    return newAbono;
  }, []);

  // ==================== PROVEEDORES ====================
  const addProveedor = useCallback((proveedor: Omit<Proveedor, 'id' | 'fechaRegistro'>) => {
    const newProveedor: Proveedor = {
      ...proveedor,
      id: crypto.randomUUID(),
      fechaRegistro: new Date().toISOString(),
    };
    setData(prev => ({ ...prev, proveedores: [...prev.proveedores, newProveedor] }));
    return newProveedor;
  }, []);

  const updateProveedor = useCallback((id: string, updates: Partial<Proveedor>) => {
    setData(prev => ({
      ...prev,
      proveedores: prev.proveedores.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  }, []);

  const deleteProveedor = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      proveedores: prev.proveedores.filter(p => p.id !== id)
    }));
  }, []);

  // ==================== FACTURAS PROVEEDORES ====================
  const addFacturaProveedor = useCallback((factura: Omit<FacturaProveedor, 'id' | 'estado' | 'montoPagadoVES' | 'montoPagadoUSD' | 'saldoPendienteVES' | 'saldoPendienteUSD'>) => {
    const newFactura: FacturaProveedor = {
      ...factura,
      id: crypto.randomUUID(),
      estado: 'pendiente',
      montoPagadoVES: 0,
      montoPagadoUSD: 0,
      saldoPendienteVES: factura.montoVES,
      saldoPendienteUSD: factura.montoUSD,
    };
    setData(prev => ({ ...prev, facturasProveedores: [...prev.facturasProveedores, newFactura] }));
    return newFactura;
  }, []);

  // ==================== PAGOS PROVEEDORES ====================
  const addPagoProveedor = useCallback((pago: Omit<PagoProveedor, 'id'>) => {
    const newPago: PagoProveedor = {
      ...pago,
      id: crypto.randomUUID(),
    };
    
    setData(prev => {
      const factura = prev.facturasProveedores.find(f => f.id === pago.facturaId);
      if (!factura) return prev;

      const newMontoPagadoVES = factura.montoPagadoVES + pago.montoVES;
      const newMontoPagadoUSD = factura.montoPagadoUSD + pago.montoUSD;
      const newSaldoPendienteVES = factura.montoVES - newMontoPagadoVES;
      const newSaldoPendienteUSD = factura.montoUSD - newMontoPagadoUSD;

      let newEstado: FacturaProveedor['estado'] = 'parcial';
      if (newSaldoPendienteVES <= 0 && newSaldoPendienteUSD <= 0) {
        newEstado = 'pagada';
      }

      // Descontar del método de pago (cuenta emisora)
      const metodo = prev.metodosPago.find(m => m.id === pago.cuentaEmisoraId);
      const montoDescontar = metodo?.tipoMoneda === 'VES' ? pago.montoVES : pago.montoUSD;

      return {
        ...prev,
        pagosProveedores: [...prev.pagosProveedores, newPago],
        facturasProveedores: prev.facturasProveedores.map(f => 
          f.id === pago.facturaId 
            ? { 
                ...f, 
                montoPagadoVES: newMontoPagadoVES,
                montoPagadoUSD: newMontoPagadoUSD,
                saldoPendienteVES: newSaldoPendienteVES,
                saldoPendienteUSD: newSaldoPendienteUSD,
                estado: newEstado
              } 
            : f
        ),
        metodosPago: prev.metodosPago.map(m => 
          m.id === pago.cuentaEmisoraId 
            ? { ...m, saldoActual: m.saldoActual - montoDescontar } 
            : m
        )
      };
    });
    
    return newPago;
  }, []);

  // ==================== MÉTODOS DE PAGO ====================
  const addMetodoPago = useCallback((metodo: Omit<MetodoPago, 'id' | 'fechaRegistro' | 'saldoActual'>) => {
    const newMetodo: MetodoPago = {
      ...metodo,
      id: crypto.randomUUID(),
      fechaRegistro: new Date().toISOString(),
      saldoActual: metodo.saldoInicial,
    };
    setData(prev => ({ ...prev, metodosPago: [...prev.metodosPago, newMetodo] }));
    return newMetodo;
  }, []);

  const updateMetodoPago = useCallback((id: string, updates: Partial<MetodoPago>) => {
    setData(prev => ({
      ...prev,
      metodosPago: prev.metodosPago.map(m => m.id === id ? { ...m, ...updates } : m)
    }));
  }, []);

  const deleteMetodoPago = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      metodosPago: prev.metodosPago.filter(m => m.id !== id)
    }));
  }, []);

  // ==================== TASA DE CAMBIO ====================
  const addTasaCambio = useCallback((tasa: Omit<TasaCambio, 'id'>) => {
    const newTasa: TasaCambio = {
      ...tasa,
      id: crypto.randomUUID(),
    };
    setData(prev => ({ ...prev, tasasCambio: [...prev.tasasCambio, newTasa] }));
    return newTasa;
  }, []);

  const getTasaActual = useCallback((): number => {
    if (data.tasasCambio.length === 0) return 0;
    const sorted = [...data.tasasCambio].sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
    return sorted[0].montoVES;
  }, [data.tasasCambio]);

  // ==================== GASTOS ====================
  const addGasto = useCallback((gasto: Omit<Gasto, 'id'>) => {
    const newGasto: Gasto = {
      ...gasto,
      id: crypto.randomUUID(),
    };
    
    setData(prev => {
      // Descontar del método de pago
      const metodo = prev.metodosPago.find(m => m.id === gasto.metodoPagoId);
      if (metodo) {
        const montoDescontar = metodo.tipoMoneda === 'VES' ? gasto.montoVES : gasto.montoUSD;
        return {
          ...prev,
          gastos: [...prev.gastos, newGasto],
          metodosPago: prev.metodosPago.map(m => 
            m.id === gasto.metodoPagoId 
              ? { ...m, saldoActual: m.saldoActual - montoDescontar } 
              : m
          )
        };
      }
      return { ...prev, gastos: [...prev.gastos, newGasto] };
    });
    
    return newGasto;
  }, []);

  // ==================== INGRESOS ====================
  const addIngreso = useCallback((ingreso: Omit<Ingreso, 'id'>) => {
    const newIngreso: Ingreso = {
      ...ingreso,
      id: crypto.randomUUID(),
    };
    
    setData(prev => {
      // Sumar a la cuenta receptora
      const metodo = prev.metodosPago.find(m => m.id === ingreso.cuentaReceptoraId);
      if (metodo) {
        const montoSumar = metodo.tipoMoneda === 'VES' ? ingreso.montoVES : ingreso.montoUSD;
        return {
          ...prev,
          ingresos: [...prev.ingresos, newIngreso],
          metodosPago: prev.metodosPago.map(m => 
            m.id === ingreso.cuentaReceptoraId 
              ? { ...m, saldoActual: m.saldoActual + montoSumar } 
              : m
          )
        };
      }
      return { ...prev, ingresos: [...prev.ingresos, newIngreso] };
    });
    
    return newIngreso;
  }, []);

  // ==================== PERSONAS ====================
  const addPersona = useCallback((persona: Omit<Persona, 'id' | 'fechaRegistro'>) => {
    const newPersona: Persona = {
      ...persona,
      id: crypto.randomUUID(),
      fechaRegistro: new Date().toISOString(),
    };
    setData(prev => ({ ...prev, personas: [...prev.personas, newPersona] }));
    return newPersona;
  }, []);

  const updatePersona = useCallback((id: string, updates: Partial<Persona>) => {
    setData(prev => ({
      ...prev,
      personas: prev.personas.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  }, []);

  const deletePersona = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      personas: prev.personas.filter(p => p.id !== id)
    }));
  }, []);

  // ==================== NOTIFICACIONES ====================
  const addNotificacion = useCallback((notificacion: Omit<Notificacion, 'id' | 'fecha' | 'leida'>) => {
    const newNotificacion: Notificacion = {
      ...notificacion,
      id: crypto.randomUUID(),
      fecha: new Date().toISOString(),
      leida: false,
    };
    setData(prev => ({ ...prev, notificaciones: [newNotificacion, ...prev.notificaciones] }));
    return newNotificacion;
  }, []);

  const marcarNotificacionLeida = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      notificaciones: prev.notificaciones.map(n => n.id === id ? { ...n, leida: true } : n)
    }));
  }, []);

  const eliminarNotificacion = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      notificaciones: prev.notificaciones.filter(n => n.id !== id)
    }));
  }, []);

  return {
    data,
    isLoaded,
    // Clientes
    addCliente,
    updateCliente,
    deleteCliente,
    // Facturas Clientes
    addFacturaCliente,
    updateFacturaCliente,
    // Abonos Clientes
    addAbonoCliente,
    // Proveedores
    addProveedor,
    updateProveedor,
    deleteProveedor,
    // Facturas Proveedores
    addFacturaProveedor,
    // Pagos Proveedores
    addPagoProveedor,
    // Métodos de Pago
    addMetodoPago,
    updateMetodoPago,
    deleteMetodoPago,
    // Tasa de Cambio
    addTasaCambio,
    getTasaActual,
    // Gastos
    addGasto,
    // Ingresos
    addIngreso,
    // Personas
    addPersona,
    updatePersona,
    deletePersona,
    // Notificaciones
    addNotificacion,
    marcarNotificacionLeida,
    eliminarNotificacion,
  };
}
