import { useState } from 'react';
import { 
  Plus, 
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
import type { AppState, Ingreso } from '@/types';

interface IngresosProps {
  storage: {
    data: AppState;
    addIngreso: (ingreso: Omit<Ingreso, 'id'>) => Ingreso;
    getTasaActual: () => number;
  };
}

export default function Ingresos({ storage }: IngresosProps) {
  const { data, addIngreso, getTasaActual } = storage;
  const [showNuevoIngreso, setShowNuevoIngreso] = useState(false);

  const [nuevoIngreso, setNuevoIngreso] = useState({
    fecha: format(new Date(), 'yyyy-MM-dd'),
    montoVES: 0,
    montoUSD: 0,
    cuentaReceptoraId: '',
    descripcion: '',
  });

  const tasaActual = getTasaActual();

  const handleCrearIngreso = () => {
    if (!nuevoIngreso.cuentaReceptoraId || nuevoIngreso.montoVES <= 0) return;

    addIngreso({
      ...nuevoIngreso,
      tasaCambio: tasaActual,
    });

    setNuevoIngreso({
      fecha: format(new Date(), 'yyyy-MM-dd'),
      montoVES: 0,
      montoUSD: 0,
      cuentaReceptoraId: '',
      descripcion: '',
    });
    setShowNuevoIngreso(false);
  };

  const totalIngresosVES = data.ingresos.reduce((sum, i) => sum + i.montoVES, 0);
  const totalIngresosUSD = data.ingresos.reduce((sum, i) => sum + i.montoUSD, 0);

  const ingresosOrdenados = [...data.ingresos].sort((a, b) => 
    new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Ingresos</h1>
          <p className="text-slate-400 text-sm">Registro de ingresos y entradas de capital</p>
        </div>
        <Dialog open={showNuevoIngreso} onOpenChange={setShowNuevoIngreso}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Ingreso
            </Button>
          </DialogTrigger>
          <DialogContent className="modal-content max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Registrar Ingreso</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-slate-300">Fecha</Label>
                <Input
                  type="date"
                  value={nuevoIngreso.fecha}
                  onChange={e => setNuevoIngreso({...nuevoIngreso, fecha: e.target.value})}
                  className="futuristic-input mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Monto (VES)</Label>
                  <Input
                    type="number"
                    value={nuevoIngreso.montoVES}
                    onChange={e => {
                      const ves = parseFloat(e.target.value) || 0;
                      const usd = tasaActual > 0 ? ves / tasaActual : 0;
                      setNuevoIngreso({...nuevoIngreso, montoVES: ves, montoUSD: usd});
                    }}
                    className="futuristic-input mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Monto (USD)</Label>
                  <Input
                    type="number"
                    value={nuevoIngreso.montoUSD.toFixed(2)}
                    readOnly
                    className="futuristic-input mt-1 bg-slate-800/50"
                  />
                </div>
              </div>

              <div>
                <Label className="text-slate-300">Cuenta Receptora</Label>
                <Select 
                  value={nuevoIngreso.cuentaReceptoraId} 
                  onValueChange={v => setNuevoIngreso({...nuevoIngreso, cuentaReceptoraId: v})}
                >
                  <SelectTrigger className="futuristic-input mt-1">
                    <SelectValue placeholder="Seleccionar cuenta" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    {data.metodosPago.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nombreBanco} ({m.tipoMoneda})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Descripción</Label>
                <Input
                  value={nuevoIngreso.descripcion}
                  onChange={e => setNuevoIngreso({...nuevoIngreso, descripcion: e.target.value})}
                  className="futuristic-input mt-1"
                  placeholder="Origen del ingreso"
                />
              </div>

              <Button onClick={handleCrearIngreso} className="w-full btn-primary">
                Registrar Ingreso
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
              <p className="text-sm text-slate-400 mb-1">Total Ingresos (VES)</p>
              <h3 className="text-2xl font-bold text-white">Bs. {totalIngresosVES.toLocaleString()}</h3>
            </div>
            <div className="stat-icon blue">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Ingresos (USD)</p>
              <h3 className="text-2xl font-bold text-white">${totalIngresosUSD.toLocaleString()}</h3>
            </div>
            <div className="stat-icon green">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de ingresos */}
      <div className="glass-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Descripción</th>
              <th>Cuenta</th>
              <th>Monto</th>
            </tr>
          </thead>
          <tbody>
            {ingresosOrdenados.map(ingreso => {
              const cuenta = data.metodosPago.find(m => m.id === ingreso.cuentaReceptoraId);
              
              return (
                <tr key={ingreso.id}>
                  <td>{format(parseISO(ingreso.fecha), 'dd/MM/yyyy')}</td>
                  <td className="max-w-xs truncate">{ingreso.descripcion}</td>
                  <td>{cuenta?.nombreBanco || 'N/A'}</td>
                  <td>
                    <div className="text-right">
                      <p className="font-medium text-emerald-400">${ingreso.montoUSD.toFixed(2)}</p>
                      <p className="text-xs text-slate-400">Bs. {ingreso.montoVES.toFixed(2)}</p>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {ingresosOrdenados.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay ingresos registrados</p>
          </div>
        )}
      </div>
    </div>
  );
}
