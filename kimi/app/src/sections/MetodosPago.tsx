import { useState } from 'react';
import { 
  Plus, 
  CreditCard, 
  DollarSign,
  TrendingUp,
  Building2,
  Wallet,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AppState, MetodoPago, Moneda } from '@/types';

interface MetodosPagoProps {
  storage: {
    data: AppState;
    addMetodoPago: (metodo: Omit<MetodoPago, 'id' | 'fechaRegistro' | 'saldoActual'>) => MetodoPago;
    updateMetodoPago: (id: string, updates: Partial<MetodoPago>) => void;
    deleteMetodoPago: (id: string) => void;
  };
}

export default function MetodosPago({ storage }: MetodosPagoProps) {
  const { data, addMetodoPago, deleteMetodoPago } = storage;
  const [showNuevoMetodo, setShowNuevoMetodo] = useState(false);

  const [nuevoMetodo, setNuevoMetodo] = useState({
    nombreBanco: '',
    saldoInicial: 0,
    tipoMoneda: 'VES' as Moneda,
    activo: true,
  });

  const handleCrearMetodo = () => {
    if (!nuevoMetodo.nombreBanco) return;
    addMetodoPago(nuevoMetodo);
    setNuevoMetodo({
      nombreBanco: '',
      saldoInicial: 0,
      tipoMoneda: 'VES',
      activo: true,
    });
    setShowNuevoMetodo(false);
  };

  // Calcular totales por moneda
  const cuentasVES = data.metodosPago.filter(m => m.tipoMoneda === 'VES');
  const cuentasUSD = data.metodosPago.filter(m => m.tipoMoneda === 'USD');
  
  const totalVES = cuentasVES.reduce((sum, m) => sum + m.saldoActual, 0);
  const totalUSD = cuentasUSD.reduce((sum, m) => sum + m.saldoActual, 0);
  
  // Calcular variación (saldo inicial vs actual)
  const totalInicialVES = cuentasVES.reduce((sum, m) => sum + m.saldoInicial, 0);
  const totalInicialUSD = cuentasUSD.reduce((sum, m) => sum + m.saldoInicial, 0);
  
  const variacionVES = totalInicialVES > 0 ? ((totalVES - totalInicialVES) / totalInicialVES) * 100 : 0;
  const variacionUSD = totalInicialUSD > 0 ? ((totalUSD - totalInicialUSD) / totalInicialUSD) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Métodos de Pago</h1>
          <p className="text-slate-400 text-sm">Cuentas bancarias y saldos disponibles</p>
        </div>
        <Dialog open={showNuevoMetodo} onOpenChange={setShowNuevoMetodo}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Cuenta
            </Button>
          </DialogTrigger>
          <DialogContent className="modal-content max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Nueva Cuenta Bancaria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-slate-300">Nombre del Banco / Cuenta</Label>
                <Input
                  value={nuevoMetodo.nombreBanco}
                  onChange={e => setNuevoMetodo({...nuevoMetodo, nombreBanco: e.target.value})}
                  className="futuristic-input mt-1"
                  placeholder="Ej: Banco de Venezuela, PayPal, Efectivo"
                />
              </div>
              <div>
                <Label className="text-slate-300">Tipo de Moneda</Label>
                <Select 
                  value={nuevoMetodo.tipoMoneda} 
                  onValueChange={(v: Moneda) => setNuevoMetodo({...nuevoMetodo, tipoMoneda: v})}
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
              <div>
                <Label className="text-slate-300">Saldo Inicial</Label>
                <Input
                  type="number"
                  value={nuevoMetodo.saldoInicial}
                  onChange={e => setNuevoMetodo({...nuevoMetodo, saldoInicial: parseFloat(e.target.value) || 0})}
                  className="futuristic-input mt-1"
                />
              </div>
              <Button onClick={handleCrearMetodo} className="w-full btn-primary">
                Crear Cuenta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumen Global */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="stat-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full -mr-16 -mt-16" />
          <div className="flex items-start justify-between relative">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total en Bolívares</p>
              <h3 className="text-3xl font-bold text-white">Bs. {totalVES.toLocaleString()}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={`${variacionVES >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {variacionVES >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {Math.abs(variacionVES).toFixed(1)}%
                </Badge>
                <span className="text-xs text-slate-500">{cuentasVES.length} cuenta{cuentasVES.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="stat-icon blue">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        </div>
        
        <div className="stat-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16" />
          <div className="flex items-start justify-between relative">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total en Dólares</p>
              <h3 className="text-3xl font-bold text-white">${totalUSD.toLocaleString()}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={`${variacionUSD >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {variacionUSD >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {Math.abs(variacionUSD).toFixed(1)}%
                </Badge>
                <span className="text-xs text-slate-500">{cuentasUSD.length} cuenta{cuentasUSD.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="stat-icon green">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Cuentas en Bolívares */}
      {cuentasVES.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Badge className="bg-cyan-500/20 text-cyan-400">VES</Badge>
            Cuentas en Bolívares
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cuentasVES.map(metodo => (
              <CuentaCard 
                key={metodo.id} 
                metodo={metodo} 
                onDelete={() => deleteMetodoPago(metodo.id)} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Cuentas en Dólares */}
      {cuentasUSD.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-400">USD</Badge>
            Cuentas en Dólares
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cuentasUSD.map(metodo => (
              <CuentaCard 
                key={metodo.id} 
                metodo={metodo} 
                onDelete={() => deleteMetodoPago(metodo.id)} 
              />
            ))}
          </div>
        </div>
      )}

      {data.metodosPago.length === 0 && (
        <div className="text-center py-12 glass-card">
          <CreditCard className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-lg font-medium text-white mb-2">No hay cuentas registradas</h3>
          <p className="text-slate-400 mb-4">Crea tu primera cuenta bancaria para comenzar</p>
          <Button onClick={() => setShowNuevoMetodo(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Crear Cuenta
          </Button>
        </div>
      )}
    </div>
  );
}

// Componente de tarjeta de cuenta individual
function CuentaCard({ metodo, onDelete }: { metodo: MetodoPago; onDelete: () => void }) {
  const variacion = metodo.saldoInicial > 0 
    ? ((metodo.saldoActual - metodo.saldoInicial) / metodo.saldoInicial) * 100 
    : 0;
  
  const esPositiva = variacion >= 0;
  const hayVariacion = Math.abs(metodo.saldoActual - metodo.saldoInicial) > 0.01;

  return (
    <div className="glass-card p-5 hover:border-cyan-500/30 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            metodo.tipoMoneda === 'USD' 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : 'bg-cyan-500/20 text-cyan-400'
          }`}>
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{metodo.nombreBanco}</h3>
            <Badge className={`mt-1 ${
              metodo.tipoMoneda === 'USD' 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : 'bg-cyan-500/20 text-cyan-400'
            }`}>
              {metodo.tipoMoneda}
            </Badge>
          </div>
        </div>
      </div>
      
      {/* Saldo destacado */}
      <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
        <p className="text-xs text-slate-400 mb-1">Saldo Disponible</p>
        <p className={`text-2xl font-bold ${
          metodo.saldoActual > 0 ? 'text-white' : 'text-red-400'
        }`}>
          {metodo.tipoMoneda === 'USD' ? '$' : 'Bs.'} {metodo.saldoActual.toLocaleString()}
        </p>
        
        {hayVariacion && (
          <div className="flex items-center gap-1 mt-2">
            <span className={`text-xs flex items-center ${esPositiva ? 'text-emerald-400' : 'text-red-400'}`}>
              {esPositiva ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {Math.abs(variacion).toFixed(1)}% vs inicial
            </span>
          </div>
        )}
      </div>

      {/* Detalles */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Saldo Inicial:</span>
          <span className="text-slate-400">
            {metodo.tipoMoneda === 'USD' ? '$' : 'Bs.'} {metodo.saldoInicial.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Diferencia:</span>
          <span className={metodo.saldoActual - metodo.saldoInicial >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            {metodo.saldoActual - metodo.saldoInicial >= 0 ? '+' : ''}
            {metodo.tipoMoneda === 'USD' ? '$' : 'Bs.'} {(metodo.saldoActual - metodo.saldoInicial).toLocaleString()}
          </span>
        </div>
      </div>

      <Button 
        variant="ghost" 
        size="sm" 
        className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        onClick={onDelete}
      >
        Eliminar Cuenta
      </Button>
    </div>
  );
}
