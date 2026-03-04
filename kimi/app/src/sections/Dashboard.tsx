import { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Truck, 
  DollarSign, 
  AlertCircle,
  Wallet,
  Receipt
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import type { AppState } from '@/types';

interface DashboardProps {
  storage: {
    data: AppState;
    getTasaActual: () => number;
  };
}

export default function Dashboard({ storage }: DashboardProps) {
  const { data, getTasaActual } = storage;
  const tasaActual = getTasaActual();

  // Cálculos de resumen
  const resumen = useMemo(() => {
    const cuentasPorCobrar = data.facturasClientes.filter(f => f.estado !== 'pagada');
    const cuentasPorPagar = data.facturasProveedores.filter(f => f.estado !== 'pagada');
    
    return {
      totalCuentasPorCobrarVES: cuentasPorCobrar.reduce((sum, f) => sum + f.saldoPendienteVES, 0),
      totalCuentasPorCobrarUSD: cuentasPorCobrar.reduce((sum, f) => sum + f.saldoPendienteUSD, 0),
      totalCuentasPorPagarVES: cuentasPorPagar.reduce((sum, f) => sum + f.saldoPendienteVES, 0),
      totalCuentasPorPagarUSD: cuentasPorPagar.reduce((sum, f) => sum + f.saldoPendienteUSD, 0),
      totalGastosVES: data.gastos.reduce((sum, g) => sum + g.montoVES, 0),
      totalGastosUSD: data.gastos.reduce((sum, g) => sum + g.montoUSD, 0),
      totalIngresosVES: data.ingresos.reduce((sum, i) => sum + i.montoVES, 0),
      totalIngresosUSD: data.ingresos.reduce((sum, i) => sum + i.montoUSD, 0),
      facturasVencidas: data.facturasClientes.filter(f => f.estado === 'vencida').length,
      totalClientes: data.clientes.length,
      totalProveedores: data.proveedores.length,
    };
  }, [data]);

  // Datos para gráfico de ingresos vs gastos (últimos 7 días)
  const ingresosGastosData = useMemo(() => {
    const dias = Array.from({ length: 7 }, (_, i) => {
      const fecha = subDays(new Date(), 6 - i);
      return {
        fecha: format(fecha, 'dd/MM'),
        ingresosVES: 0,
        ingresosUSD: 0,
        gastosVES: 0,
        gastosUSD: 0,
      };
    });

    data.ingresos.forEach(ingreso => {
      const fechaIngreso = format(parseISO(ingreso.fecha), 'dd/MM');
      const dia = dias.find(d => d.fecha === fechaIngreso);
      if (dia) {
        dia.ingresosVES += ingreso.montoVES;
        dia.ingresosUSD += ingreso.montoUSD;
      }
    });

    data.gastos.forEach(gasto => {
      const fechaGasto = format(parseISO(gasto.fecha), 'dd/MM');
      const dia = dias.find(d => d.fecha === fechaGasto);
      if (dia) {
        dia.gastosVES += gasto.montoVES;
        dia.gastosUSD += gasto.montoUSD;
      }
    });

    return dias;
  }, [data.ingresos, data.gastos]);

  // Datos para gráfico de estado de facturas
  const estadoFacturasData = useMemo(() => {
    const pendientes = data.facturasClientes.filter(f => f.estado === 'pendiente').length;
    const parciales = data.facturasClientes.filter(f => f.estado === 'parcial').length;
    const pagadas = data.facturasClientes.filter(f => f.estado === 'pagada').length;
    const vencidas = data.facturasClientes.filter(f => f.estado === 'vencida').length;

    return [
      { name: 'Pendientes', value: pendientes, color: '#f59e0b' },
      { name: 'Parciales', value: parciales, color: '#3b82f6' },
      { name: 'Pagadas', value: pagadas, color: '#10b981' },
      { name: 'Vencidas', value: vencidas, color: '#ef4444' },
    ];
  }, [data.facturasClientes]);

  // Datos para gráfico de saldos por método de pago
  const saldosMetodosData = useMemo(() => {
    return data.metodosPago.map(m => ({
      name: m.nombreBanco,
      saldo: m.saldoActual,
      moneda: m.tipoMoneda,
    }));
  }, [data.metodosPago]);

  // Facturas próximas a vencer
  const facturasProximasVencer = useMemo(() => {
    const hoy = new Date();
    return data.facturasClientes
      .filter(f => f.estado !== 'pagada' && f.fechaVencimiento)
      .map(f => ({
        ...f,
        diasRestantes: Math.ceil((new Date(f.fechaVencimiento!).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
      }))
      .filter(f => f.diasRestantes <= 3 && f.diasRestantes >= 0)
      .sort((a, b) => a.diasRestantes - b.diasRestantes)
      .slice(0, 5);
  }, [data.facturasClientes]);

  const StatCard = ({ 
    title, 
    value, 
    subValue, 
    icon: Icon, 
    color,
    trend
  }: { 
    title: string; 
    value: string; 
    subValue?: string;
    icon: any; 
    color: string;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-white">{value}</h3>
          {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
        </div>
        <div className={`stat-icon ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className={`flex items-center gap-1 mt-3 text-xs ${
          trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'
        }`}>
          {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
          <span>{trend === 'up' ? 'Aumentando' : trend === 'down' ? 'Disminuyendo' : 'Estable'}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header con tasa del día */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm">Resumen financiero del sistema</p>
        </div>
        <div className="flex items-center gap-3 glass-card px-4 py-2">
          <DollarSign className="w-5 h-5 text-cyan-400" />
          <div>
            <p className="text-xs text-slate-400">Tasa del día</p>
            <p className="text-lg font-semibold text-white">
              {tasaActual > 0 ? `Bs. ${tasaActual.toLocaleString()}` : 'No registrada'}
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Cuentas por Cobrar"
          value={`$${resumen.totalCuentasPorCobrarUSD.toLocaleString()}`}
          subValue={`Bs. ${resumen.totalCuentasPorCobrarVES.toLocaleString()}`}
          icon={Receipt}
          color="blue"
          trend="up"
        />
        <StatCard
          title="Cuentas por Pagar"
          value={`$${resumen.totalCuentasPorPagarUSD.toLocaleString()}`}
          subValue={`Bs. ${resumen.totalCuentasPorPagarVES.toLocaleString()}`}
          icon={Wallet}
          color="red"
          trend="down"
        />
        <StatCard
          title="Total Ingresos"
          value={`$${resumen.totalIngresosUSD.toLocaleString()}`}
          subValue={`Bs. ${resumen.totalIngresosVES.toLocaleString()}`}
          icon={TrendingUp}
          color="green"
          trend="up"
        />
        <StatCard
          title="Total Gastos"
          value={`$${resumen.totalGastosUSD.toLocaleString()}`}
          subValue={`Bs. ${resumen.totalGastosVES.toLocaleString()}`}
          icon={TrendingDown}
          color="yellow"
          trend="down"
        />
      </div>

      {/* Segunda fila de estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <Users className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{resumen.totalClientes}</p>
          <p className="text-xs text-slate-400">Clientes</p>
        </div>
        <div className="glass-card p-4 text-center">
          <Truck className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{resumen.totalProveedores}</p>
          <p className="text-xs text-slate-400">Proveedores</p>
        </div>
        <div className="glass-card p-4 text-center">
          <Receipt className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{data.facturasClientes.length}</p>
          <p className="text-xs text-slate-400">Facturas</p>
        </div>
        <div className="glass-card p-4 text-center">
          <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{resumen.facturasVencidas}</p>
          <p className="text-xs text-slate-400">Vencidas</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos vs Gastos */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-white mb-4">Ingresos vs Gastos (Últimos 7 días)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ingresosGastosData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="fecha" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="ingresosUSD" name="Ingresos ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastosUSD" name="Gastos ($)" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Estado de Facturas */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-white mb-4">Estado de Facturas</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={estadoFacturasData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {estadoFacturasData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {estadoFacturasData.map((item) => (
              <div key={item.name} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-slate-400">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tercera fila */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Saldos por Método de Pago */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-white mb-4">Saldos por Cuenta</h3>
          {saldosMetodosData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={saldosMetodosData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number, _name: string, props: any) => {
                    const moneda = props.payload.moneda;
                    return [`${moneda === 'USD' ? '$' : 'Bs.'} ${value.toLocaleString()}`, 'Saldo'];
                  }}
                />
                <Bar dataKey="saldo" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-500">
              No hay cuentas registradas
            </div>
          )}
        </div>

        {/* Facturas Próximas a Vencer */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-white mb-4">Facturas Próximas a Vencer</h3>
          <div className="space-y-2 max-h-[200px] overflow-auto">
            {facturasProximasVencer.length > 0 ? (
              facturasProximasVencer.map((factura) => {
                const cliente = data.clientes.find(c => c.id === factura.clienteId);
                return (
                  <div 
                    key={factura.id} 
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-white/5"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{factura.numeroFactura}</p>
                      <p className="text-xs text-slate-400">{cliente?.nombreNegocio || 'Cliente desconocido'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">${factura.saldoPendienteUSD.toFixed(2)}</p>
                      <p className={`text-xs ${
                        factura.diasRestantes === 0 ? 'text-red-400' : 'text-amber-400'
                      }`}>
                        {factura.diasRestantes === 0 ? 'Vence hoy' : `Vence en ${factura.diasRestantes} días`}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No hay facturas próximas a vencer</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
