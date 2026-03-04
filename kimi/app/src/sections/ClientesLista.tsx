import { useState, useMemo } from 'react';
import { 
  Search, 
  Users,
  Eye,
  UserPlus,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AppState, Cliente, PlazoCredito } from '@/types';

interface ClientesListaProps {
  storage: {
    data: AppState;
    addCliente: (cliente: Omit<Cliente, 'id' | 'fechaRegistro'>) => Cliente;
  };
  onVerCliente: (clienteId: string) => void;
}

export default function ClientesLista({ storage, onVerCliente }: ClientesListaProps) {
  const { data, addCliente } = storage;
  const [searchTerm, setSearchTerm] = useState('');
  const [showNuevoCliente, setShowNuevoCliente] = useState(false);

  const [nuevoCliente, setNuevoCliente] = useState({
    rif: '',
    nombreEncargado: '',
    nombreNegocio: '',
    limiteCredito: 0,
    plazoCredito: 3 as PlazoCredito,
    activo: true,
  });

  // Calcular saldo deudor por cliente
  const clientesConSaldo = useMemo(() => {
    return data.clientes.map(cliente => {
      const facturasPendientes = data.facturasClientes.filter(f => 
        f.clienteId === cliente.id && f.estado !== 'pagada'
      );
      const saldoPendienteVES = facturasPendientes.reduce((sum, f) => sum + f.saldoPendienteVES, 0);
      const saldoPendienteUSD = facturasPendientes.reduce((sum, f) => sum + f.saldoPendienteUSD, 0);
      const totalFacturas = data.facturasClientes.filter(f => f.clienteId === cliente.id).length;
      const facturasVencidas = facturasPendientes.filter(f => f.estado === 'vencida').length;
      
      return {
        ...cliente,
        saldoPendienteVES,
        saldoPendienteUSD,
        totalFacturas,
        facturasPendientes: facturasPendientes.length,
        facturasVencidas,
        tieneDeuda: saldoPendienteUSD > 0,
      };
    });
  }, [data.clientes, data.facturasClientes]);

  const clientesFiltrados = clientesConSaldo.filter(c => 
    c.nombreNegocio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.rif.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nombreEncargado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCrearCliente = () => {
    if (!nuevoCliente.rif || !nuevoCliente.nombreNegocio) return;
    addCliente(nuevoCliente);
    setNuevoCliente({
      rif: '',
      nombreEncargado: '',
      nombreNegocio: '',
      limiteCredito: 0,
      plazoCredito: 3,
      activo: true,
    });
    setShowNuevoCliente(false);
  };

  // Totales
  const totalClientes = data.clientes.length;
  const clientesConDeuda = clientesConSaldo.filter(c => c.tieneDeuda).length;
  const totalPorCobrarUSD = clientesConSaldo.reduce((sum, c) => sum + c.saldoPendienteUSD, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-slate-400 text-sm">Gestión de clientes y sus saldos</p>
        </div>
        <Dialog open={showNuevoCliente} onOpenChange={setShowNuevoCliente}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <UserPlus className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="modal-content max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Nuevo Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-slate-300">RIF</Label>
                <Input
                  value={nuevoCliente.rif}
                  onChange={e => setNuevoCliente({...nuevoCliente, rif: e.target.value})}
                  className="futuristic-input mt-1"
                  placeholder="J-12345678-9"
                />
              </div>
              <div>
                <Label className="text-slate-300">Nombre del Negocio</Label>
                <Input
                  value={nuevoCliente.nombreNegocio}
                  onChange={e => setNuevoCliente({...nuevoCliente, nombreNegocio: e.target.value})}
                  className="futuristic-input mt-1"
                  placeholder="Nombre comercial"
                />
              </div>
              <div>
                <Label className="text-slate-300">Nombre del Encargado</Label>
                <Input
                  value={nuevoCliente.nombreEncargado}
                  onChange={e => setNuevoCliente({...nuevoCliente, nombreEncargado: e.target.value})}
                  className="futuristic-input mt-1"
                  placeholder="Nombre y apellido"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Límite de Crédito ($)</Label>
                  <Input
                    type="number"
                    value={nuevoCliente.limiteCredito}
                    onChange={e => setNuevoCliente({...nuevoCliente, limiteCredito: parseFloat(e.target.value) || 0})}
                    className="futuristic-input mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Plazo (días)</Label>
                  <Select 
                    value={nuevoCliente.plazoCredito.toString()} 
                    onValueChange={v => setNuevoCliente({...nuevoCliente, plazoCredito: parseInt(v) as PlazoCredito})}
                  >
                    <SelectTrigger className="futuristic-input mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10">
                      <SelectItem value="3">3 días</SelectItem>
                      <SelectItem value="5">5 días</SelectItem>
                      <SelectItem value="7">7 días</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleCrearCliente} className="w-full btn-primary">
                Crear Cliente
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
              <p className="text-sm text-slate-400 mb-1">Total Clientes</p>
              <h3 className="text-2xl font-bold text-white">{totalClientes}</h3>
            </div>
            <div className="stat-icon blue">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Clientes con Deuda</p>
              <h3 className="text-2xl font-bold text-white">{clientesConDeuda}</h3>
            </div>
            <div className="stat-icon yellow">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total por Cobrar</p>
              <h3 className="text-2xl font-bold text-white">${totalPorCobrarUSD.toLocaleString()}</h3>
            </div>
            <div className="stat-icon green">
              <TrendingUp className="w-5 h-5" />
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
          placeholder="Buscar cliente por nombre, RIF o encargado..."
          className="futuristic-input pl-10"
        />
      </div>

      {/* Lista de clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientesFiltrados.map(cliente => (
          <div 
            key={cliente.id} 
            className={`glass-card p-5 hover:border-cyan-500/30 transition-all duration-300 cursor-pointer ${
              cliente.tieneDeuda ? 'border-amber-500/20' : ''
            }`}
            onClick={() => onVerCliente(cliente.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{cliente.nombreNegocio}</h3>
                  <p className="text-sm text-slate-400">{cliente.rif}</p>
                </div>
              </div>
              {cliente.tieneDeuda && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                  Debe
                </Badge>
              )}
            </div>

            {/* Saldo deudor */}
            <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
              <p className="text-xs text-slate-400 mb-1">Saldo Pendiente</p>
              <p className={`text-xl font-bold ${cliente.tieneDeuda ? 'text-amber-400' : 'text-emerald-400'}`}>
                ${cliente.saldoPendienteUSD.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">
                Bs. {cliente.saldoPendienteVES.toLocaleString()}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center mb-4">
              <div className="bg-slate-800/30 rounded-lg p-2">
                <p className="text-lg font-bold text-white">{cliente.totalFacturas}</p>
                <p className="text-xs text-slate-400">Facturas</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-2">
                <p className={`text-lg font-bold ${cliente.facturasPendientes > 0 ? 'text-amber-400' : 'text-white'}`}>
                  {cliente.facturasPendientes}
                </p>
                <p className="text-xs text-slate-400">Pendientes</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-2">
                <p className={`text-lg font-bold ${cliente.facturasVencidas > 0 ? 'text-red-400' : 'text-white'}`}>
                  {cliente.facturasVencidas}
                </p>
                <p className="text-xs text-slate-400">Vencidas</p>
              </div>
            </div>

            {/* Info adicional */}
            <div className="flex items-center justify-between text-sm text-slate-400 mb-3">
              <span>Límite: ${cliente.limiteCredito.toLocaleString()}</span>
              <span>Plazo: {cliente.plazoCredito} días</span>
            </div>

            <div className="text-sm text-slate-400 mb-3">
              <span className="text-slate-500">Encargado:</span> {cliente.nombreEncargado || 'N/A'}
            </div>

            {/* Botón ver detalle */}
            <Button 
              variant="ghost" 
              className="w-full text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
              onClick={(e) => {
                e.stopPropagation();
                onVerCliente(cliente.id);
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver Historial
            </Button>
          </div>
        ))}
      </div>

      {clientesFiltrados.length === 0 && (
        <div className="text-center py-12 glass-card">
          <Users className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-lg font-medium text-white mb-2">No se encontraron clientes</h3>
          <p className="text-slate-400">Intenta con otra búsqueda o crea un nuevo cliente</p>
        </div>
      )}
    </div>
  );
}
