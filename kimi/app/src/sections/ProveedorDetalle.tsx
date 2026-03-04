import { useState, useMemo } from 'react';
import { 
  ArrowLeft,
  FileText,
  DollarSign,
  Plus,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, parseISO, addDays } from 'date-fns';
import type { AppState, FacturaProveedor, PagoProveedor, TipoPago, Moneda } from '@/types';

interface ProveedorDetalleProps {
  storage: {
    data: AppState;
    addFacturaProveedor: (factura: Omit<FacturaProveedor, 'id' | 'estado' | 'montoPagadoVES' | 'montoPagadoUSD' | 'saldoPendienteVES' | 'saldoPendienteUSD'>) => FacturaProveedor;
    addPagoProveedor: (pago: Omit<PagoProveedor, 'id'>) => PagoProveedor;
    getTasaActual: () => number;
  };
  proveedorId: string;
  onVolver: () => void;
}

export default function ProveedorDetalle({ storage, proveedorId, onVolver }: ProveedorDetalleProps) {
  const { data, addFacturaProveedor, addPagoProveedor, getTasaActual } = storage;
  const [showNuevaFactura, setShowNuevaFactura] = useState(false);
  const [showPago, setShowPago] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<FacturaProveedor | null>(null);

  const proveedor = data.proveedores.find(p => p.id === proveedorId);
  const tasaActual = getTasaActual();

  // Formulario nueva factura
  const [nuevaFactura, setNuevaFactura] = useState({
    fecha: format(new Date(), 'yyyy-MM-dd'),
    montoVES: 0,
    montoUSD: 0,
    tipoPago: 'contado' as TipoPago,
    diasCredito: 7,
  });

  // Formulario pago
  const [nuevoPago, setNuevoPago] = useState({
    facturaId: '',
    metodoPagoId: '',
    moneda: 'VES' as Moneda,
    monto: 0,
    tasa: tasaActual,
    montoConvertido: 0,
  });

  // Filtrar facturas y pagos del proveedor
  const facturasProveedor = useMemo(() => {
    return data.facturasProveedores
      .filter(f => f.proveedorId === proveedorId)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [data.facturasProveedores, proveedorId]);

  const pagosProveedor = useMemo(() => {
    return data.pagosProveedores
      .filter(p => p.proveedorId === proveedorId)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [data.pagosProveedores, proveedorId]);

  // Calcular totales
  const totales = useMemo(() => {
    const totalFacturado = facturasProveedor.reduce((sum, f) => sum + f.montoUSD, 0);
    const totalPagado = facturasProveedor.reduce((sum, f) => sum + f.montoPagadoUSD, 0);
    const saldoPendiente = facturasProveedor.reduce((sum, f) => sum + f.saldoPendienteUSD, 0);
    const facturasPendientes = facturasProveedor.filter(f => f.estado !== 'pagada').length;
    const facturasVencidas = facturasProveedor.filter(f => f.estado === 'vencida').length;
    
    return {
      totalFacturado,
      totalPagado,
      saldoPendiente,
      facturasPendientes,
      facturasVencidas,
    };
  }, [facturasProveedor]);

  if (!proveedor) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Proveedor no encontrado</p>
        <Button onClick={onVolver} className="mt-4 btn-primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>
    );
  }

  const handleCrearFactura = () => {
    const fechaVencimiento = nuevaFactura.tipoPago === 'credito' 
      ? addDays(new Date(nuevaFactura.fecha), nuevaFactura.diasCredito).toISOString()
      : undefined;

    addFacturaProveedor({
      ...nuevaFactura,
      proveedorId,
      tasaCambio: tasaActual,
      fechaVencimiento,
    });
    
    setNuevaFactura({
      fecha: format(new Date(), 'yyyy-MM-dd'),
      montoVES: 0,
      montoUSD: 0,
      tipoPago: 'contado',
      diasCredito: 7,
    });
    setShowNuevaFactura(false);
  };

  const handleCrearPago = () => {
    if (!nuevoPago.facturaId || !nuevoPago.metodoPagoId || nuevoPago.monto <= 0) return;

    const montoVES = nuevoPago.moneda === 'VES' ? nuevoPago.monto : nuevoPago.montoConvertido;
    const montoUSD = nuevoPago.moneda === 'USD' ? nuevoPago.monto : nuevoPago.monto / nuevoPago.tasa;

    addPagoProveedor({
      facturaId: nuevoPago.facturaId,
      proveedorId,
      fecha: new Date().toISOString(),
      metodoPagoId: nuevoPago.metodoPagoId,
      moneda: nuevoPago.moneda,
      montoVES,
      montoUSD,
      tasaCambio: nuevoPago.tasa,
      cuentaEmisoraId: nuevoPago.metodoPagoId,
    });

    setNuevoPago({
      facturaId: '',
      metodoPagoId: '',
      moneda: 'VES',
      monto: 0,
      tasa: tasaActual,
      montoConvertido: 0,
    });
    setShowPago(false);
    setFacturaSeleccionada(null);
  };

  const abrirPago = (factura: FacturaProveedor) => {
    setFacturaSeleccionada(factura);
    setNuevoPago({
      ...nuevoPago,
      facturaId: factura.id,
    });
    setShowPago(true);
  };

  const getEstadoBadge = (estado: FacturaProveedor['estado']) => {
    const styles = {
      pendiente: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      parcial: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      pagada: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      vencida: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    const icons = {
      pendiente: <Clock className="w-3 h-3 mr-1" />,
      parcial: <TrendingUp className="w-3 h-3 mr-1" />,
      pagada: <CheckCircle className="w-3 h-3 mr-1" />,
      vencida: <AlertCircle className="w-3 h-3 mr-1" />,
    };
    return (
      <Badge className={`flex items-center w-fit ${styles[estado]}`}>
        {icons[estado]}
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onVolver} className="text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">{proveedor.nombreEmpresa}</h1>
          <p className="text-slate-400 text-sm">{proveedor.rif}</p>
        </div>
      </div>

      {/* Resumen del proveedor */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-sm text-slate-400 mb-1">Total Facturado</p>
          <h3 className="text-xl font-bold text-white">${totales.totalFacturado.toLocaleString()}</h3>
        </div>
        <div className="stat-card">
          <p className="text-sm text-slate-400 mb-1">Total Pagado</p>
          <h3 className="text-xl font-bold text-emerald-400">${totales.totalPagado.toLocaleString()}</h3>
        </div>
        <div className="stat-card">
          <p className="text-sm text-slate-400 mb-1">Saldo Pendiente</p>
          <h3 className={`text-xl font-bold ${totales.saldoPendiente > 0 ? 'text-red-400' : 'text-white'}`}>
            ${totales.saldoPendiente.toLocaleString()}
          </h3>
        </div>
        <div className="stat-card">
          <p className="text-sm text-slate-400 mb-1">Facturas Pendientes</p>
          <h3 className="text-xl font-bold text-white">{totales.facturasPendientes}</h3>
          {totales.facturasVencidas > 0 && (
            <p className="text-xs text-red-400 mt-1">{totales.facturasVencidas} vencidas</p>
          )}
        </div>
      </div>

      {/* Tabs de Facturas y Pagos */}
      <Tabs defaultValue="facturas" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-slate-800/50 border border-white/10">
            <TabsTrigger value="facturas" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <FileText className="w-4 h-4 mr-2" />
              Facturas ({facturasProveedor.length})
            </TabsTrigger>
            <TabsTrigger value="pagos" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <DollarSign className="w-4 h-4 mr-2" />
              Pagos ({pagosProveedor.length})
            </TabsTrigger>
          </TabsList>

          <Dialog open={showNuevaFactura} onOpenChange={setShowNuevaFactura}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Factura
              </Button>
            </DialogTrigger>
            <DialogContent className="modal-content max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-white text-xl">Nueva Factura de Proveedor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label className="text-slate-300">Fecha</Label>
                  <Input
                    type="date"
                    value={nuevaFactura.fecha}
                    onChange={e => setNuevaFactura({...nuevaFactura, fecha: e.target.value})}
                    className="futuristic-input mt-1"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Monto (VES)</Label>
                    <Input
                      type="number"
                      value={nuevaFactura.montoVES}
                      onChange={e => {
                        const ves = parseFloat(e.target.value) || 0;
                        const usd = tasaActual > 0 ? ves / tasaActual : 0;
                        setNuevaFactura({...nuevaFactura, montoVES: ves, montoUSD: usd});
                      }}
                      className="futuristic-input mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Monto (USD)</Label>
                    <Input
                      type="number"
                      value={nuevaFactura.montoUSD.toFixed(2)}
                      readOnly
                      className="futuristic-input mt-1 bg-slate-800/50"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300">Tipo de Pago</Label>
                  <Select 
                    value={nuevaFactura.tipoPago} 
                    onValueChange={(v: TipoPago) => setNuevaFactura({...nuevaFactura, tipoPago: v})}
                  >
                    <SelectTrigger className="futuristic-input mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10">
                      <SelectItem value="contado">De Contado</SelectItem>
                      <SelectItem value="credito">A Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {nuevaFactura.tipoPago === 'credito' && (
                  <div>
                    <Label className="text-slate-300">Días de Crédito</Label>
                    <Input
                      type="number"
                      value={nuevaFactura.diasCredito}
                      onChange={e => setNuevaFactura({...nuevaFactura, diasCredito: parseInt(e.target.value) || 7})}
                      className="futuristic-input mt-1"
                    />
                  </div>
                )}

                <Button onClick={handleCrearFactura} className="w-full btn-primary">
                  Crear Factura
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="facturas" className="mt-0">
          <div className="space-y-3">
            {facturasProveedor.map(factura => (
              <div 
                key={factura.id} 
                className="glass-card p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-white">
                        {format(parseISO(factura.fecha), 'dd/MM/yyyy')}
                      </span>
                      {getEstadoBadge(factura.estado)}
                    </div>
                    {factura.fechaVencimiento && (
                      <p className="text-sm text-slate-400 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Vence: {format(parseISO(factura.fechaVencimiento), 'dd/MM/yyyy')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">${factura.montoUSD.toFixed(2)}</p>
                    <p className="text-sm text-slate-400">Bs. {factura.montoVES.toFixed(2)}</p>
                  </div>
                </div>

                {factura.estado !== 'pagada' && (
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">
                        Pagado: ${factura.montoPagadoUSD.toFixed(2)} / 
                        Saldo: <span className="text-red-400">${factura.saldoPendienteUSD.toFixed(2)}</span>
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      className="btn-primary"
                      onClick={() => abrirPago(factura)}
                    >
                      <DollarSign className="w-4 h-4 mr-1" />
                      Pagar
                    </Button>
                  </div>
                )}

                {factura.estado === 'pagada' && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-sm text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Factura pagada completamente
                    </p>
                  </div>
                )}
              </div>
            ))}

            {facturasProveedor.length === 0 && (
              <div className="text-center py-12 glass-card">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-lg font-medium text-white mb-2">No hay facturas</h3>
                <p className="text-slate-400">Este proveedor aún no tiene facturas registradas</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pagos" className="mt-0">
          <div className="space-y-3">
            {pagosProveedor.map(pago => {
              const factura = facturasProveedor.find(f => f.id === pago.facturaId);
              const metodo = data.metodosPago.find(m => m.id === pago.metodoPagoId);
              
              return (
                <div 
                  key={pago.id} 
                  className="glass-card p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-white">
                        Pago a factura del {factura ? format(parseISO(factura.fecha), 'dd/MM/yyyy') : 'N/A'}
                      </p>
                      <p className="text-sm text-slate-400">
                        {format(parseISO(pago.fecha), 'dd/MM/yyyy HH:mm')} • {metodo?.nombreBanco || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-400">${pago.montoUSD.toFixed(2)}</p>
                      <p className="text-sm text-slate-400">Bs. {pago.montoVES.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {pagosProveedor.length === 0 && (
              <div className="text-center py-12 glass-card">
                <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-lg font-medium text-white mb-2">No hay pagos</h3>
                <p className="text-slate-400">Este proveedor aún no tiene pagos registrados</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo de Pago */}
      <Dialog open={showPago} onOpenChange={setShowPago}>
        <DialogContent className="modal-content max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              Registrar Pago - Factura del {facturaSeleccionada ? format(parseISO(facturaSeleccionada.fecha), 'dd/MM/yyyy') : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-slate-800/50 rounded-lg p-3 mb-2">
              <p className="text-sm text-slate-400">Saldo pendiente:</p>
              <p className="text-xl font-bold text-red-400">
                ${facturaSeleccionada?.saldoPendienteUSD.toFixed(2)}
              </p>
            </div>

            <div>
              <Label className="text-slate-300">Cuenta Emisora (Método de Pago)</Label>
              <Select 
                value={nuevoPago.metodoPagoId} 
                onValueChange={v => setNuevoPago({...nuevoPago, metodoPagoId: v})}
              >
                <SelectTrigger className="futuristic-input mt-1">
                  <SelectValue placeholder="Seleccionar cuenta" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  {data.metodosPago.filter(m => m.saldoActual > 0).map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nombreBanco} ({m.tipoMoneda}) - Saldo: {m.tipoMoneda === 'USD' ? '$' : 'Bs.'} {m.saldoActual.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Moneda de Pago</Label>
              <Select 
                value={nuevoPago.moneda} 
                onValueChange={(v: Moneda) => setNuevoPago({...nuevoPago, moneda: v})}
              >
                <SelectTrigger className="futuristic-input mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="VES">Bolívares (VES)</SelectItem>
                  <SelectItem value="USD">Dólares (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {nuevoPago.moneda === 'VES' ? (
              <>
                <div>
                  <Label className="text-slate-300">Monto (VES)</Label>
                  <Input
                    type="number"
                    value={nuevoPago.monto}
                    onChange={e => {
                      const monto = parseFloat(e.target.value) || 0;
                      const convertido = nuevoPago.tasa > 0 ? monto / nuevoPago.tasa : 0;
                      setNuevoPago({...nuevoPago, monto, montoConvertido: convertido});
                    }}
                    className="futuristic-input mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Tasa</Label>
                  <Input
                    type="number"
                    value={nuevoPago.tasa}
                    onChange={e => {
                      const tasa = parseFloat(e.target.value) || 0;
                      const convertido = tasa > 0 ? nuevoPago.monto / tasa : 0;
                      setNuevoPago({...nuevoPago, tasa, montoConvertido: convertido});
                    }}
                    className="futuristic-input mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Monto en USD (Auto)</Label>
                  <Input
                    type="number"
                    value={nuevoPago.montoConvertido.toFixed(2)}
                    readOnly
                    className="futuristic-input mt-1 bg-slate-800/50"
                  />
                </div>
              </>
            ) : (
              <div>
                <Label className="text-slate-300">Monto (USD)</Label>
                <Input
                  type="number"
                  value={nuevoPago.monto}
                  onChange={e => setNuevoPago({...nuevoPago, monto: parseFloat(e.target.value) || 0})}
                  className="futuristic-input mt-1"
                />
              </div>
            )}

            <Button onClick={handleCrearPago} className="w-full btn-primary">
              Registrar Pago
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
