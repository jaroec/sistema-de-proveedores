import { 
  Bell, 
  Check, 
  Trash2, 
  AlertCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Notificacion } from '@/types';

interface NotificacionesPanelProps {
  notificaciones: Notificacion[];
  onMarcarLeida: (id: string) => void;
  onEliminar: (id: string) => void;
}

export default function NotificacionesPanel({ 
  notificaciones, 
  onMarcarLeida, 
  onEliminar 
}: NotificacionesPanelProps) {
  
  const notificacionesOrdenadas = [...notificaciones].sort((a, b) => 
    new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  const getIconoNotificacion = (tipo: Notificacion['tipo']) => {
    switch (tipo) {
      case 'vencimiento':
        return <Clock className="w-5 h-5 text-amber-400" />;
      case 'vencida':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'limite_credito':
        return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      default:
        return <Bell className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getColorBadge = (tipo: Notificacion['tipo']) => {
    switch (tipo) {
      case 'vencimiento':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'vencida':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'limite_credito':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    }
  };

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Notificaciones</h1>
          <p className="text-slate-400 text-sm">
            {noLeidas > 0 
              ? `Tienes ${noLeidas} notificación${noLeidas > 1 ? 'es' : ''} sin leer` 
              : 'No tienes notificaciones pendientes'}
          </p>
        </div>
        {noLeidas > 0 && (
          <Button 
            variant="outline" 
            className="border-white/10 text-slate-300 hover:bg-white/5"
            onClick={() => notificaciones.filter(n => !n.leida).forEach(n => onMarcarLeida(n.id))}
          >
            <Check className="w-4 h-4 mr-2" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Lista de notificaciones */}
      <div className="space-y-3">
        {notificacionesOrdenadas.map(notif => (
          <div 
            key={notif.id} 
            className={`glass-card p-4 transition-all duration-200 ${
              notif.leida ? 'opacity-60' : 'border-cyan-500/20'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                notif.tipo === 'vencimiento' ? 'bg-amber-500/10' :
                notif.tipo === 'vencida' ? 'bg-red-500/10' :
                'bg-cyan-500/10'
              }`}>
                {getIconoNotificacion(notif.tipo)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-semibold ${notif.leida ? 'text-slate-400' : 'text-white'}`}>
                    {notif.titulo}
                  </h3>
                  <Badge className={`text-xs ${getColorBadge(notif.tipo)}`}>
                    {notif.tipo}
                  </Badge>
                  {!notif.leida && (
                    <span className="w-2 h-2 bg-cyan-400 rounded-full" />
                  )}
                </div>
                <p className="text-sm text-slate-400 mb-2">{notif.mensaje}</p>
                <p className="text-xs text-slate-500">
                  {format(parseISO(notif.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                </p>
              </div>

              <div className="flex gap-1">
                {!notif.leida && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                    onClick={() => onMarcarLeida(notif.id)}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => onEliminar(notif.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {notificacionesOrdenadas.length === 0 && (
          <div className="text-center py-12 glass-card">
            <Bell className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-lg font-medium text-white mb-2">No hay notificaciones</h3>
            <p className="text-slate-400">Las notificaciones aparecerán aquí cuando haya facturas por vencer o vencidas</p>
          </div>
        )}
      </div>
    </div>
  );
}
