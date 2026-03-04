import { useEffect, useCallback } from 'react';
import { format, addDays, isBefore, isEqual, parseISO } from 'date-fns';
import type { FacturaCliente, FacturaProveedor, Notificacion } from '@/types';

interface UseNotificacionesProps {
  facturasClientes: FacturaCliente[];
  facturasProveedores: FacturaProveedor[];
  clientes: { id: string; nombreNegocio: string }[];
  proveedores: { id: string; nombreEmpresa: string }[];
  notificaciones: Notificacion[];
  addNotificacion: (notificacion: Omit<Notificacion, 'id' | 'fecha' | 'leida'>) => void;
}

export function useNotificaciones({
  facturasClientes,
  facturasProveedores,
  clientes,
  proveedores,
  notificaciones,
  addNotificacion,
}: UseNotificacionesProps) {
  
  const verificarVencimientos = useCallback(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Verificar facturas de clientes
    facturasClientes.forEach(factura => {
      if (factura.estado === 'pagada' || !factura.fechaVencimiento) return;
      
      const fechaVenc = parseISO(factura.fechaVencimiento);
      fechaVenc.setHours(0, 0, 0, 0);
      
      const cliente = clientes.find(c => c.id === factura.clienteId);
      if (!cliente) return;
      
      // Verificar si ya existe notificación para esta factura hoy
      const notifExistente = notificaciones.find(n => 
        n.entidadId === factura.id && 
        n.entidadTipo === 'cliente' &&
        format(parseISO(n.fecha), 'yyyy-MM-dd') === format(hoy, 'yyyy-MM-dd')
      );
      
      if (notifExistente) return;
      
      // Factura vencida
      if (isBefore(fechaVenc, hoy) || isEqual(fechaVenc, hoy)) {
        addNotificacion({
          tipo: 'vencida',
          titulo: 'Factura Vencida',
          mensaje: `La factura ${factura.numeroFactura} de ${cliente.nombreNegocio} ha vencido. Saldo pendiente: $${factura.saldoPendienteUSD.toFixed(2)} / Bs. ${factura.saldoPendienteVES.toFixed(2)}`,
          entidadId: factura.id,
          entidadTipo: 'cliente',
        });
      } else {
        // Factura por vencer (1 día antes)
        const unDiaAntes = addDays(fechaVenc, -1);
        if (isEqual(unDiaAntes, hoy)) {
          addNotificacion({
            tipo: 'vencimiento',
            titulo: 'Factura por Vencer',
            mensaje: `La factura ${factura.numeroFactura} de ${cliente.nombreNegocio} vence mañana. Saldo pendiente: $${factura.saldoPendienteUSD.toFixed(2)} / Bs. ${factura.saldoPendienteVES.toFixed(2)}`,
            entidadId: factura.id,
            entidadTipo: 'cliente',
          });
        }
      }
    });
    
    // Verificar facturas de proveedores
    facturasProveedores.forEach(factura => {
      if (factura.estado === 'pagada' || !factura.fechaVencimiento) return;
      
      const fechaVenc = parseISO(factura.fechaVencimiento);
      fechaVenc.setHours(0, 0, 0, 0);
      
      const proveedor = proveedores.find(p => p.id === factura.proveedorId);
      if (!proveedor) return;
      
      // Verificar si ya existe notificación para esta factura hoy
      const notifExistente = notificaciones.find(n => 
        n.entidadId === factura.id && 
        n.entidadTipo === 'proveedor' &&
        format(parseISO(n.fecha), 'yyyy-MM-dd') === format(hoy, 'yyyy-MM-dd')
      );
      
      if (notifExistente) return;
      
      // Factura vencida
      if (isBefore(fechaVenc, hoy) || isEqual(fechaVenc, hoy)) {
        addNotificacion({
          tipo: 'vencida',
          titulo: 'Factura de Proveedor Vencida',
          mensaje: `La factura de ${proveedor.nombreEmpresa} ha vencido. Saldo pendiente: $${factura.saldoPendienteUSD.toFixed(2)} / Bs. ${factura.saldoPendienteVES.toFixed(2)}`,
          entidadId: factura.id,
          entidadTipo: 'proveedor',
        });
      } else {
        // Factura por vencer (1 día antes)
        const unDiaAntes = addDays(fechaVenc, -1);
        if (isEqual(unDiaAntes, hoy)) {
          addNotificacion({
            tipo: 'vencimiento',
            titulo: 'Factura de Proveedor por Vencer',
            mensaje: `La factura de ${proveedor.nombreEmpresa} vence mañana. Saldo pendiente: $${factura.saldoPendienteUSD.toFixed(2)} / Bs. ${factura.saldoPendienteVES.toFixed(2)}`,
            entidadId: factura.id,
            entidadTipo: 'proveedor',
          });
        }
      }
    });
  }, [facturasClientes, facturasProveedores, clientes, proveedores, notificaciones, addNotificacion]);

  useEffect(() => {
    verificarVencimientos();
    // Verificar cada hora
    const interval = setInterval(verificarVencimientos, 3600000);
    return () => clearInterval(interval);
  }, [verificarVencimientos]);

  return { verificarVencimientos };
}
