import { useState, useMemo } from 'react';
import { 
  Search, 
  Truck,
  Eye,
  Building2,
  Plus,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { AppState, Proveedor } from '@/types';

interface ProveedoresListaProps {
  storage: {
    data: AppState;
    addProveedor: (proveedor: Omit<Proveedor, 'id' | 'fechaRegistro'>) => Proveedor;
  };
  onVerProveedor: (proveedorId: string) => void;
}

export default function ProveedoresLista({ storage, onVerProveedor }: ProveedoresListaProps) {
  const { data, addProveedor } = storage;
  const [searchTerm, setSearchTerm] = useState('');
  const [showNuevoProveedor, setShowNuevoProveedor] = useState(false);

  const [nuevoProveedor, setNuevoProveedor] = useState({
    nombreEmpresa: '',
    rif: '',
    activo: true,
  });

  // Calcular saldo deudor por proveedor
  const proveedoresConSaldo = useMemo(() => {
    return data.proveedores.map(proveedor => {
      const facturasPendientes = data.facturasProveedores.filter(f => 
        f.proveedorId === proveedor.id && f.estado !== 'pagada'
      );
      const saldoPendienteVES = facturasPendientes.reduce((sum, f) => sum + f.saldoPendienteVES, 0);
      const saldoPendienteUSD = facturasPendientes.reduce((sum, f) => sum + f.saldoPendienteUSD, 0);
      const totalFacturas = data.facturasProveedores.filter(f => f.proveedorId === proveedor.id).length;
      const facturasVencidas = facturasPendientes.filter(f => f.estado === 'vencida').length;
      
      return {
        ...proveedor,
        saldoPendienteVES,
        saldoPendienteUSD,
        totalFacturas,
        facturasPendientes: facturasPendientes.length,
        facturasVencidas,
        tieneDeuda: saldoPendienteUSD > 0,
      };
    });
  }, [data.proveedores, data.facturasProveedores]);

  const proveedoresFiltrados = proveedoresConSaldo.filter(p => 
    p.nombreEmpresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.rif.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCrearProveedor = () => {
    if (!nuevoProveedor.rif || !nuevoProveedor.nombreEmpresa) return;
    addProveedor(nuevoProveedor);
    setNuevoProveedor({
      nombreEmpresa: '',
      rif: '',
      activo: true,
    });
    setShowNuevoProveedor(false);
  };

  // Totales
  const totalProveedores = data.proveedores.length;
  const proveedoresConDeuda = proveedoresConSaldo.filter(p => p.tieneDeuda).length;
  const totalPorPagarUSD = proveedoresConSaldo.reduce((sum, p) => sum + p.saldoPendienteUSD, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Proveedores</h1>
          <p className="text-slate-400 text-sm">Gestión de proveedores y sus saldos</p>
        </div>
        <Dialog open={showNuevoProveedor} onOpenChange={setShowNuevoProveedor}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="modal-content max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Nuevo Proveedor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-slate-300">Nombre de la Empresa</Label>
                <Input
                  value={nuevoProveedor.nombreEmpresa}
                  onChange={e => setNuevoProveedor({...nuevoProveedor, nombreEmpresa: e.target.value})}
                  className="futuristic-input mt-1"
                  placeholder="Nombre de la empresa"
                />
              </div>
              <div>
                <Label className="text-slate-300">RIF</Label>
                <Input
                  value={nuevoProveedor.rif}
                  onChange={e => setNuevoProveedor({...nuevoProveedor, rif: e.target.value})}
                  className="futuristic-input mt-1"
                  placeholder="J-12345678-9"
                />
              </div>
              <Button onClick={handleCrearProveedor} className="w-full btn-primary">
                Crear Proveedor
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Proveedores</p>
              <h3 className="text-2xl font-bold text-white">{totalProveedores}</h3>
            </div>
            <div className="stat-icon blue">
              <Truck className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Con Deuda</p>
              <h3 className="text-2xl font-bold text-white">{proveedoresConDeuda}</h3>
            </div>
            <div className="stat-icon yellow">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total por Pagar</p>
              <h3 className="text-2xl font-bold text-red-400">${totalPorPagarUSD.toLocaleString()}</h3>
            </div>
            <div className="stat-icon red">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar proveedor por nombre o RIF..."
          className="futuristic-input pl-10"
        />
      </div>

      {/* Lista de proveedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {proveedoresFiltrados.map(proveedor => (
          <div 
            key={proveedor.id} 
            className={`glass-card p-5 hover:border-cyan-500/30 transition-all duration-300 cursor-pointer ${
              proveedor.tieneDeuda ? 'border-red-500/20' : ''
            }`}
            onClick={() => onVerProveedor(proveedor.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{proveedor.nombreEmpresa}</h3>
                  <p className="text-sm text-slate-400">{proveedor.rif}</p>
                </div>
              </div>
              {proveedor.tieneDeuda && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  Debe
                </Badge>
              )}
            </div>

            {/* Saldo deudor */}
            <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
              <p className="text-xs text-slate-400 mb-1">Saldo Pendiente</p>
              <p className={`text-xl font-bold ${proveedor.tieneDeuda ? 'text-red-400' : 'text-emerald-400'}`}>
                ${proveedor.saldoPendienteUSD.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">
                Bs. {proveedor.saldoPendienteVES.toLocaleString()}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center mb-4">
              <div className="bg-slate-800/30 rounded-lg p-2">
                <p className="text-lg font-bold text-white">{proveedor.totalFacturas}</p>
                <p className="text-xs text-slate-400">Facturas</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-2">
                <p className={`text-lg font-bold ${proveedor.facturasPendientes > 0 ? 'text-amber-400' : 'text-white'}`}>
                  {proveedor.facturasPendientes}
                </p>
                <p className="text-xs text-slate-400">Pendientes</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-2">
                <p className={`text-lg font-bold ${proveedor.facturasVencidas > 0 ? 'text-red-400' : 'text-white'}`}>
                  {proveedor.facturasVencidas}
                </p>
                <p className="text-xs text-slate-400">Vencidas</p>
              </div>
            </div>

            {/* Botón ver detalle */}
            <Button 
              variant="ghost" 
              className="w-full text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
              onClick={(e) => {
                e.stopPropagation();
                onVerProveedor(proveedor.id);
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver Historial
            </Button>
          </div>
        ))}
      </div>

      {proveedoresFiltrados.length === 0 && (
        <div className="text-center py-12 glass-card">
          <Truck className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-lg font-medium text-white mb-2">No se encontraron proveedores</h3>
          <p className="text-slate-400">Intenta con otra búsqueda o crea un nuevo proveedor</p>
        </div>
      )}
    </div>
  );
}
