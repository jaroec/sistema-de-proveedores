import { useState, useMemo } from 'react';
import { 
  FileText,
  Filter,
  Building2,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, addDays } from 'date-fns';
import type { AppState, FacturaProveedor, TipoPago } from '@/types';

interface FacturasProveedoresProps {
  storage: {
    data: AppState;
    addFacturaProveedor: (factura: Omit<FacturaProveedor, 'id' | 'estado' | 'montoPagadoVES' | 'montoPagadoUSD' | 'saldoPendienteVES' | 'saldoPendienteUSD'>) => FacturaProveedor;
    getTasaActual: () => number;
  };
  onVerProveedor: (proveedorId: string) => void;
}

export default function FacturasProveedores({ storage, onVerProveedor }: FacturasProveedoresProps) {
  const { data, addFacturaProveedor, getTasaActual } = storage;
  const [filtroProveedor, setFiltroProveedor] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [showNuevaFactura, setShowNuevaFactura] = useState(false);

  const tasaActual = getTasaActual();

  // Formulario nueva factura
  const [nuevaFactura, setNuevaFactura] = useState({
    proveedorId: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    montoVES: 0,
    montoUSD: 0,
    tipoPago: 'contado' as TipoPago,
    diasCredito: 7,
  });

  // Filtrar facturas
  const facturasFiltradas = useMemo(() => {
    return data.facturasProveedores
      .filter(f => {
        // Filtro por proveedor
        if (filtroProveedor !== 'todos' && f.proveedorId !== filtroProveedor) {
          return false;
        }
        // Filtro por estado
        if (filtroEstado !== 'todos' && f.estado !== filtroEstado) {
          return false;
        }
        // Filtro por fecha desde
        if (filtroFechaDesde && new Date(f.fecha) < new Date(filtroFechaDesde)) {
          return false;
        }
        // Filtro por fecha hasta
        if (filtroFechaHasta && new Date(f.fecha) > new Date(filtroFechaHasta)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [data.facturasProveedores, filtroProveedor, filtroEstado, filtroFechaDesde, filtroFechaHasta]);

  // Totales
  const totales = useMemo(() => {
    const totalFacturado = facturasFiltradas.reduce((sum, f) => sum + f.montoUSD, 0);
    const totalPagado = facturasFiltradas.reduce((sum, f) => sum + f.montoPagadoUSD, 0);
    const saldoPendiente = facturasFiltradas.reduce((sum, f) => sum + f.saldoPendienteUSD, 0);
    return { totalFacturado, totalPagado, saldoPendiente };
  }, [facturasFiltradas]);

  const handleCrearFactura = () => {
    if (!nuevaFactura.proveedorId) return;
    
    const fechaVencimiento = nuevaFactura.tipoPago === 'credito' 
      ? addDays(new Date(nuevaFactura.fecha), nuevaFactura.diasCredito).toISOString()
      : undefined;

    addFacturaProveedor({
      ...nuevaFactura,
      tasaCambio: tasaActual,
      fechaVencimiento,
    });
    
    setNuevaFactura({
      proveedorId: '',
      fecha: format(new Date(), 'yyyy-MM-dd'),
      montoVES: 0,
      montoUSD: 0,
      tipoPago: 'contado',
      diasCredito: 7,
    });
    setShowNuevaFactura(false);
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

  const limpiarFiltros = () => {
    setFiltroProveedor('todos');
    setFiltroEstado('todos');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Facturas de Proveedores</h1>
          <p className="text-slate-400 text-sm">Todas las facturas con filtros avanzados</p>
        </div>
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
                <Label className="text-slate-300">Proveedor</Label>
                <Select 
                  value={nuevaFactura.proveedorId} 
                  onValueChange={v => setNuevaFactura({...nuevaFactura, proveedorId: v})}
                >
                  <SelectTrigger className="futuristic-input mt-1">
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    {data.proveedores.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nombreEmpresa}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-sm text-slate-400 mb-1">Total Facturado</p>
          <h3 className="text-2xl font-bold text-white">${totales.totalFacturado.toLocaleString()}</h3>
        </div>
        <div className="stat-card">
          <p className="text-sm text-slate-400 mb-1">Total Pagado</p>
          <h3 className="text-2xl font-bold text-emerald-400">${totales.totalPagado.toLocaleString()}</h3>
        </div>
        <div className="stat-card">
          <p className="text-sm text-slate-400 mb-1">Saldo Pendiente</p>
          <h3 className="text-2xl font-bold text-red-400">${totales.saldoPendiente.toLocaleString()}</h3>
        </div>
      </div>

      {/* Filtros */}
      <div className="glass-card p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-white">Filtros</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label className="text-slate-400 text-xs mb-1 block">Proveedor</Label>
            <Select value={filtroProveedor} onValueChange={setFiltroProveedor}>
              <SelectTrigger className="futuristic-input">
                <SelectValue placeholder="Todos los proveedores" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/10">
                <SelectItem value="todos">Todos los proveedores</SelectItem>
                {data.proveedores.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.nombreEmpresa}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-400 text-xs mb-1 block">Estado</Label>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="futuristic-input">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/10">
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="parcial">Parcial</SelectItem>
                <SelectItem value="pagada">Pagada</SelectItem>
                <SelectItem value="vencida">Vencida</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-400 text-xs mb-1 block">Desde</Label>
            <Input
              type="date"
              value={filtroFechaDesde}
              onChange={e => setFiltroFechaDesde(e.target.value)}
              className="futuristic-input"
            />
          </div>

          <div>
            <Label className="text-slate-400 text-xs mb-1 block">Hasta</Label>
            <Input
              type="date"
              value={filtroFechaHasta}
              onChange={e => setFiltroFechaHasta(e.target.value)}
              className="futuristic-input"
            />
          </div>
        </div>

        {(filtroProveedor !== 'todos' || filtroEstado !== 'todos' || filtroFechaDesde || filtroFechaHasta) && (
          <Button variant="ghost" onClick={limpiarFiltros} className="text-slate-400 hover:text-white text-sm">
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Lista de facturas */}
      <div className="space-y-3">
        {facturasFiltradas.map(factura => {
          const proveedor = data.proveedores.find(p => p.id === factura.proveedorId);
          
          return (
            <div key={factura.id} className="glass-card p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-white">
                      {format(parseISO(factura.fecha), 'dd/MM/yyyy')}
                    </span>
                    {getEstadoBadge(factura.estado)}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <button 
                      onClick={() => onVerProveedor(factura.proveedorId)}
                      className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                    >
                      <Building2 className="w-4 h-4" />
                      {proveedor?.nombreEmpresa || 'N/A'}
                    </button>
                    {factura.fechaVencimiento && (
                      <span className={`flex items-center gap-1 ${
                        factura.estado === 'vencida' ? 'text-red-400' : 'text-slate-400'
                      }`}>
                        <Clock className="w-4 h-4" />
                        Vence: {format(parseISO(factura.fechaVencimiento), 'dd/MM/yyyy')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">${factura.montoUSD.toFixed(2)}</p>
                    <p className="text-sm text-slate-400">Bs. {factura.montoVES.toFixed(2)}</p>
                  </div>

                  {factura.estado !== 'pagada' && (
                    <div className="text-right min-w-[120px]">
                      <p className="text-sm text-slate-400">Saldo:</p>
                      <p className="text-lg font-bold text-red-400">${factura.saldoPendienteUSD.toFixed(2)}</p>
                    </div>
                  )}

                  {factura.estado === 'pagada' && (
                    <div className="text-right">
                      <Badge className="bg-emerald-500/20 text-emerald-400">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Pagada
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {facturasFiltradas.length === 0 && (
          <div className="text-center py-12 glass-card">
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-lg font-medium text-white mb-2">No hay facturas</h3>
            <p className="text-slate-400">No se encontraron facturas con los filtros aplicados</p>
          </div>
        )}
      </div>

      {/* Contador de resultados */}
      {facturasFiltradas.length > 0 && (
        <p className="text-sm text-slate-400 text-center">
          Mostrando {facturasFiltradas.length} factura{facturasFiltradas.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
