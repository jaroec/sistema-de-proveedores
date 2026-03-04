import { useState } from 'react';
import { 
  Plus, 
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import type { AppState, Gasto, TipoGasto } from '@/types';

interface GastosProps {
  storage: {
    data: AppState;
    addGasto: (gasto: Omit<Gasto, 'id'>) => Gasto;
    getTasaActual: () => number;
  };
}

const tiposGasto: { value: TipoGasto; label: string }[] = [
  { value: 'papeles', label: 'Papeles' },
  { value: 'viaticos', label: 'Viáticos' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'otros', label: 'Otros' },
];

export default function Gastos({ storage }: GastosProps) {
  const { data, addGasto, getTasaActual } = storage;
  const [showNuevoGasto, setShowNuevoGasto] = useState(false);

  const [nuevoGasto, setNuevoGasto] = useState({
    personaId: '',
    tipoGasto: 'otros' as TipoGasto,
    descripcion: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    montoVES: 0,
    montoUSD: 0,
    metodoPagoId: '',
  });

  const tasaActual = getTasaActual();

  const handleCrearGasto = () => {
    if (!nuevoGasto.personaId || !nuevoGasto.metodoPagoId || nuevoGasto.montoVES <= 0) return;

    addGasto({
      ...nuevoGasto,
      tasaCambio: tasaActual,
    });

    setNuevoGasto({
      personaId: '',
      tipoGasto: 'otros',
      descripcion: '',
      fecha: format(new Date(), 'yyyy-MM-dd'),
      montoVES: 0,
      montoUSD: 0,
      metodoPagoId: '',
    });
    setShowNuevoGasto(false);
  };

  const totalGastosVES = data.gastos.reduce((sum, g) => sum + g.montoVES, 0);
  const totalGastosUSD = data.gastos.reduce((sum, g) => sum + g.montoUSD, 0);

  const gastosOrdenados = [...data.gastos].sort((a, b) => 
    new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Gastos</h1>
          <p className="text-slate-400 text-sm">Registro de gastos operativos</p>
        </div>
        <Dialog open={showNuevoGasto} onOpenChange={setShowNuevoGasto}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Gasto
            </Button>
          </DialogTrigger>
          <DialogContent className="modal-content max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Registrar Gasto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-slate-300">Persona</Label>
                <Select 
                  value={nuevoGasto.personaId} 
                  onValueChange={v => setNuevoGasto({...nuevoGasto, personaId: v})}
                >
                  <SelectTrigger className="futuristic-input mt-1">
                    <SelectValue placeholder="Seleccionar persona" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    {data.personas.filter(p => p.activo).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nombres}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Tipo de Gasto</Label>
                <Select 
                  value={nuevoGasto.tipoGasto} 
                  onValueChange={(v: TipoGasto) => setNuevoGasto({...nuevoGasto, tipoGasto: v})}
                >
                  <SelectTrigger className="futuristic-input mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    {tiposGasto.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Descripción</Label>
                <Input
                  value={nuevoGasto.descripcion}
                  onChange={e => setNuevoGasto({...nuevoGasto, descripcion: e.target.value})}
                  className="futuristic-input mt-1"
                  placeholder="Detalle del gasto"
                />
              </div>

              <div>
                <Label className="text-slate-300">Fecha</Label>
                <Input
                  type="date"
                  value={nuevoGasto.fecha}
                  onChange={e => setNuevoGasto({...nuevoGasto, fecha: e.target.value})}
                  className="futuristic-input mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Monto (VES)</Label>
                  <Input
                    type="number"
                    value={nuevoGasto.montoVES}
                    onChange={e => {
                      const ves = parseFloat(e.target.value) || 0;
                      const usd = tasaActual > 0 ? ves / tasaActual : 0;
                      setNuevoGasto({...nuevoGasto, montoVES: ves, montoUSD: usd});
                    }}
                    className="futuristic-input mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Monto (USD)</Label>
                  <Input
                    type="number"
                    value={nuevoGasto.montoUSD.toFixed(2)}
                    readOnly
                    className="futuristic-input mt-1 bg-slate-800/50"
                  />
                </div>
              </div>

              <div>
                <Label className="text-slate-300">Método de Pago</Label>
                <Select 
                  value={nuevoGasto.metodoPagoId} 
                  onValueChange={v => setNuevoGasto({...nuevoGasto, metodoPagoId: v})}
                >
                  <SelectTrigger className="futuristic-input mt-1">
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    {data.metodosPago.filter(m => m.saldoActual > 0).map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nombreBanco} - Saldo: {m.tipoMoneda === 'USD' ? '$' : 'Bs.'} {m.saldoActual.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleCrearGasto} className="w-full btn-primary">
                Registrar Gasto
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Gastos (VES)</p>
              <h3 className="text-2xl font-bold text-white">Bs. {totalGastosVES.toLocaleString()}</h3>
            </div>
            <div className="stat-icon red">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Gastos (USD)</p>
              <h3 className="text-2xl font-bold text-white">${totalGastosUSD.toLocaleString()}</h3>
            </div>
            <div className="stat-icon yellow">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de gastos */}
      <div className="glass-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Persona</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Monto</th>
            </tr>
          </thead>
          <tbody>
            {gastosOrdenados.map(gasto => {
              const persona = data.personas.find(p => p.id === gasto.personaId);
              const tipoLabel = tiposGasto.find(t => t.value === gasto.tipoGasto)?.label || gasto.tipoGasto;
              
              return (
                <tr key={gasto.id}>
                  <td>{format(parseISO(gasto.fecha), 'dd/MM/yyyy')}</td>
                  <td>{persona?.nombres || 'N/A'}</td>
                  <td>
                    <Badge className="bg-slate-700 text-slate-300">
                      {tipoLabel}
                    </Badge>
                  </td>
                  <td className="max-w-xs truncate">{gasto.descripcion}</td>
                  <td>
                    <div className="text-right">
                      <p className="font-medium text-white">${gasto.montoUSD.toFixed(2)}</p>
                      <p className="text-xs text-slate-400">Bs. {gasto.montoVES.toFixed(2)}</p>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {gastosOrdenados.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <TrendingDown className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay gastos registrados</p>
          </div>
        )}
      </div>
    </div>
  );
}
