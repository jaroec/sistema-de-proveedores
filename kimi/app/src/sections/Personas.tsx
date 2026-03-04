import { useState } from 'react';
import { 
  Plus, 
  UserCircle,
  Search,
  User,
  Shield,
  Briefcase,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AppState, Persona, RolPersona } from '@/types';

interface PersonasProps {
  storage: {
    data: AppState;
    addPersona: (persona: Omit<Persona, 'id' | 'fechaRegistro'>) => Persona;
    updatePersona: (id: string, updates: Partial<Persona>) => void;
    deletePersona: (id: string) => void;
  };
}

const roles: { value: RolPersona; label: string; icon: any }[] = [
  { value: 'admin', label: 'Administrador', icon: Shield },
  { value: 'vendedor', label: 'Vendedor', icon: User },
  { value: 'contador', label: 'Contador', icon: Briefcase },
  { value: 'otro', label: 'Otro', icon: MoreHorizontal },
];

export default function Personas({ storage }: PersonasProps) {
  const { data, addPersona, updatePersona, deletePersona } = storage;
  const [searchTerm, setSearchTerm] = useState('');
  const [showNuevaPersona, setShowNuevaPersona] = useState(false);

  const [nuevaPersona, setNuevaPersona] = useState({
    nombres: '',
    rol: 'otro' as RolPersona,
    activo: true,
  });

  const handleCrearPersona = () => {
    if (!nuevaPersona.nombres) return;
    addPersona(nuevaPersona);
    setNuevaPersona({
      nombres: '',
      rol: 'otro',
      activo: true,
    });
    setShowNuevaPersona(false);
  };

  const personasFiltradas = data.personas.filter(p => 
    p.nombres.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRolInfo = (rol: RolPersona) => roles.find(r => r.value === rol) || roles[3];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Personas</h1>
          <p className="text-slate-400 text-sm">Gestión de personal y roles</p>
        </div>
        <Dialog open={showNuevaPersona} onOpenChange={setShowNuevaPersona}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Persona
            </Button>
          </DialogTrigger>
          <DialogContent className="modal-content max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Registrar Persona</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-slate-300">Nombres y Apellidos</Label>
                <Input
                  value={nuevaPersona.nombres}
                  onChange={e => setNuevaPersona({...nuevaPersona, nombres: e.target.value})}
                  className="futuristic-input mt-1"
                  placeholder="Nombre completo"
                />
              </div>

              <div>
                <Label className="text-slate-300">Rol</Label>
                <Select 
                  value={nuevaPersona.rol} 
                  onValueChange={(v: RolPersona) => setNuevaPersona({...nuevaPersona, rol: v})}
                >
                  <SelectTrigger className="futuristic-input mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    {roles.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleCrearPersona} className="w-full btn-primary">
                Registrar Persona
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar persona..."
          className="futuristic-input pl-10"
        />
      </div>

      {/* Lista de personas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {personasFiltradas.map(persona => {
          const rolInfo = getRolInfo(persona.rol);
          const RolIcon = rolInfo.icon;
          
          return (
            <div 
              key={persona.id} 
              className="glass-card p-5 hover:border-cyan-500/30 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                    <UserCircle className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{persona.nombres}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <RolIcon className="w-3 h-3 text-slate-400" />
                      <Badge className="bg-slate-700 text-slate-300 text-xs">
                        {rolInfo.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1 text-slate-400 hover:text-white hover:bg-white/5"
                  onClick={() => updatePersona(persona.id, { activo: !persona.activo })}
                >
                  {persona.activo ? 'Desactivar' : 'Activar'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => deletePersona(persona.id)}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {personasFiltradas.length === 0 && (
        <div className="text-center py-12 glass-card">
          <UserCircle className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-lg font-medium text-white mb-2">No hay personas registradas</h3>
          <p className="text-slate-400 mb-4">Registra personas para asignarles gastos</p>
          <Button onClick={() => setShowNuevaPersona(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Registrar Persona
          </Button>
        </div>
      )}
    </div>
  );
}
