import { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  UserCircle, 
  Bell,
  Menu,
  DollarSign,
  Wallet,
  FileText,
  Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useStorage } from '@/hooks/useStorage';
import { useNotificaciones } from '@/hooks/useNotificaciones';
import Dashboard from '@/sections/Dashboard';
import ClientesLista from '@/sections/ClientesLista';
import ClienteDetalle from '@/sections/ClienteDetalle';
import FacturasClientes from '@/sections/FacturasClientes';
import ProveedoresLista from '@/sections/ProveedoresLista';
import ProveedorDetalle from '@/sections/ProveedorDetalle';
import FacturasProveedores from '@/sections/FacturasProveedores';
import MetodosPago from '@/sections/MetodosPago';
import TasaCambio from '@/sections/TasaCambio';
import Gastos from '@/sections/Gastos';
import Ingresos from '@/sections/Ingresos';
import Personas from '@/sections/Personas';
import NotificacionesPanel from '@/sections/NotificacionesPanel';
import './App.css';

type ViewType = 
  | 'dashboard' 
  | 'clientes' 
  | 'cliente-detalle'
  | 'facturas-clientes'
  | 'proveedores' 
  | 'proveedor-detalle'
  | 'facturas-proveedores'
  | 'metodos-pago' 
  | 'tasa-cambio' 
  | 'gastos' 
  | 'ingresos' 
  | 'personas' 
  | 'notificaciones';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'facturas-clientes', label: 'Facturas Clientes', icon: Receipt },
  { id: 'proveedores', label: 'Proveedores', icon: Truck },
  { id: 'facturas-proveedores', label: 'Facturas Proveedores', icon: FileText },
  { id: 'gastos', label: 'Gastos', icon: TrendingDown },
  { id: 'ingresos', label: 'Ingresos', icon: TrendingUp },
  { id: 'metodos-pago', label: 'Métodos de Pago', icon: CreditCard },
  { id: 'tasa-cambio', label: 'Tasa de Cambio', icon: DollarSign },
  { id: 'personas', label: 'Personas', icon: UserCircle },
];

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [selectedProveedorId, setSelectedProveedorId] = useState<string | null>(null);
  
  const storage = useStorage();
  
  const { 
    data, 
    addNotificacion,
    marcarNotificacionLeida,
    eliminarNotificacion 
  } = storage;

  // Activar sistema de notificaciones
  useNotificaciones({
    facturasClientes: data.facturasClientes,
    facturasProveedores: data.facturasProveedores,
    clientes: data.clientes,
    proveedores: data.proveedores,
    notificaciones: data.notificaciones,
    addNotificacion,
  });

  const notificacionesNoLeidas = data.notificaciones.filter((n: { leida: boolean }) => !n.leida).length;

  const handleVerCliente = (clienteId: string) => {
    setSelectedClienteId(clienteId);
    setCurrentView('cliente-detalle');
  };

  const handleVolverClientes = () => {
    setSelectedClienteId(null);
    setCurrentView('clientes');
  };

  const handleVerProveedor = (proveedorId: string) => {
    setSelectedProveedorId(proveedorId);
    setCurrentView('proveedor-detalle');
  };

  const handleVolverProveedores = () => {
    setSelectedProveedorId(null);
    setCurrentView('proveedores');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard storage={storage} />;
      case 'clientes':
        return <ClientesLista storage={storage} onVerCliente={handleVerCliente} />;
      case 'cliente-detalle':
        return selectedClienteId ? (
          <ClienteDetalle 
            storage={storage} 
            clienteId={selectedClienteId} 
            onVolver={handleVolverClientes}
          />
        ) : (
          <ClientesLista storage={storage} onVerCliente={handleVerCliente} />
        );
      case 'facturas-clientes':
        return <FacturasClientes storage={storage} onVerCliente={handleVerCliente} />;
      case 'proveedores':
        return <ProveedoresLista storage={storage} onVerProveedor={handleVerProveedor} />;
      case 'proveedor-detalle':
        return selectedProveedorId ? (
          <ProveedorDetalle 
            storage={storage} 
            proveedorId={selectedProveedorId} 
            onVolver={handleVolverProveedores}
          />
        ) : (
          <ProveedoresLista storage={storage} onVerProveedor={handleVerProveedor} />
        );
      case 'facturas-proveedores':
        return <FacturasProveedores storage={storage} onVerProveedor={handleVerProveedor} />;
      case 'metodos-pago':
        return <MetodosPago storage={storage} />;
      case 'tasa-cambio':
        return <TasaCambio storage={storage} />;
      case 'gastos':
        return <Gastos storage={storage} />;
      case 'ingresos':
        return <Ingresos storage={storage} />;
      case 'personas':
        return <Personas storage={storage} />;
      case 'notificaciones':
        return (
          <NotificacionesPanel 
            notificaciones={data.notificaciones}
            onMarcarLeida={marcarNotificacionLeida}
            onEliminar={eliminarNotificacion}
          />
        );
      default:
        return <Dashboard storage={storage} />;
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-6 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">FinancePro</h1>
          <p className="text-xs text-slate-400">Sistema de Gestión</p>
        </div>
      </div>
      
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id || 
            (item.id === 'clientes' && currentView === 'cliente-detalle') ||
            (item.id === 'proveedores' && currentView === 'proveedor-detalle');
          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id as ViewType);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30' 
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>
      
      <div className="px-4 py-4 border-t border-white/10">
        <button
          onClick={() => {
            setCurrentView('notificaciones');
            setSidebarOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            currentView === 'notificaciones'
              ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30' 
              : 'text-slate-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <div className="relative">
            <Bell className="w-4 h-4" />
            {notificacionesNoLeidas > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                {notificacionesNoLeidas}
              </span>
            )}
          </div>
          Notificaciones
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-slate-900/50 backdrop-blur-xl border-r border-white/10">
        <SidebarContent />
      </aside>

      {/* Sidebar Mobile */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-slate-900 border-r border-white/10">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-slate-900/50 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-slate-900 border-r border-white/10">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <h2 className="text-lg font-semibold text-white capitalize">
              {currentView.replace(/-/g, ' ')}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('notificaciones')}
              className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {notificacionesNoLeidas > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                  {notificacionesNoLeidas}
                </Badge>
              )}
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
