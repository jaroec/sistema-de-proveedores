import { useState } from 'react';
import { 
  TrendingUp, 
  Calendar,
  History,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AppState, TasaCambio } from '@/types';

interface TasaCambioProps {
  storage: {
    data: AppState;
    addTasaCambio: (tasa: Omit<TasaCambio, 'id'>) => TasaCambio;
    getTasaActual: () => number;
  };
}

export default function TasaCambio({ storage }: TasaCambioProps) {
  const { data, addTasaCambio, getTasaActual } = storage;
  const [nuevaTasa, setNuevaTasa] = useState('');
  const [fechaTasa, setFechaTasa] = useState(format(new Date(), 'yyyy-MM-dd'));

  const tasaActual = getTasaActual();

  const handleGuardarTasa = () => {
    const monto = parseFloat(nuevaTasa);
    if (!monto || monto <= 0) return;

    addTasaCambio({
      fecha: new Date(fechaTasa).toISOString(),
      montoVES: monto,
    });

    setNuevaTasa('');
    setFechaTasa(format(new Date(), 'yyyy-MM-dd'));
  };

  // Ordenar tasas por fecha descendente
  const tasasOrdenadas = [...data.tasasCambio].sort((a, b) => 
    new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Tasa de Cambio</h1>
        <p className="text-slate-400 text-sm">Gestión de tasas VES/USD</p>
      </div>

      {/* Tasa Actual */}
      <div className="glass-card p-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 mb-4">
          <DollarSign className="w-10 h-10 text-cyan-400" />
        </div>
        <h2 className="text-slate-400 mb-2">Tasa del Día</h2>
        <p className="text-5xl font-bold gradient-text mb-2">
          {tasaActual > 0 ? `Bs. ${tasaActual.toLocaleString()}` : 'No registrada'}
        </p>
        {tasaActual > 0 && (
          <p className="text-sm text-slate-500">
            1 USD = {tasaActual.toLocaleString()} VES
          </p>
        )}
      </div>

      {/* Registrar Nueva Tasa */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Registrar Nueva Tasa
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-slate-300">Fecha</Label>
            <Input
              type="date"
              value={fechaTasa}
              onChange={e => setFechaTasa(e.target.value)}
              className="futuristic-input mt-1"
            />
          </div>
          <div>
            <Label className="text-slate-300">Tasa (VES por 1 USD)</Label>
            <Input
              type="number"
              value={nuevaTasa}
              onChange={e => setNuevaTasa(e.target.value)}
              placeholder="Ej: 36.50"
              className="futuristic-input mt-1"
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={handleGuardarTasa} 
              className="w-full btn-primary"
              disabled={!nuevaTasa || parseFloat(nuevaTasa) <= 0}
            >
              Guardar Tasa
            </Button>
          </div>
        </div>
      </div>

      {/* Historial de Tasas */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-cyan-400" />
          Historial de Tasas
        </h3>
        
        <div className="space-y-2 max-h-[400px] overflow-auto">
          {tasasOrdenadas.map((tasa, index) => {
            const tasaAnterior = tasasOrdenadas[index + 1];
            const variacion = tasaAnterior 
              ? ((tasa.montoVES - tasaAnterior.montoVES) / tasaAnterior.montoVES) * 100 
              : 0;
            
            return (
              <div 
                key={tasa.id} 
                className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {format(parseISO(tasa.fecha), 'dd/MM/yyyy', { locale: es })}
                    </p>
                    <p className="text-sm text-slate-400">
                      {format(parseISO(tasa.fecha), 'HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-white">
                    Bs. {tasa.montoVES.toLocaleString()}
                  </p>
                  {variacion !== 0 && (
                    <p className={`text-sm ${variacion > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {variacion > 0 ? '+' : ''}{variacion.toFixed(2)}%
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {tasasOrdenadas.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay tasas registradas</p>
          </div>
        )}
      </div>
    </div>
  );
}
