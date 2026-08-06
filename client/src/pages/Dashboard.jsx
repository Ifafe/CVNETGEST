import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import LowStockBadge from '../components/LowStockBadge';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
  ArrowRight,
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#6366f1'];

export default function Dashboard({ setCurrentPage }) {
  const { user, apiFetch } = useAuth();
  const [products, setProducts] = useState([]);
  const [valuation, setValuation] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [movements, setMovements] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user.role === 'ADMIN';

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const pData = await apiFetch('/api/products');
      const loadedProducts = pData.products || [];
      setProducts(loadedProducts);

      const mData = await apiFetch('/api/movements?limit=10');
      setMovements(mData.movements || []);

      if (isAdmin) {
        const vData = await apiFetch('/api/reports/valuation');
        setValuation(vData.summary || null);
        setCategoryData(vData.category_valuation || []);
      } else {
        // Build category summary for non-admin
        const catMap = {};
        loadedProducts.forEach(p => {
          const cName = p.category_name || 'Geral';
          catMap[cName] = (catMap[cName] || 0) + p.quantity;
        });
        const cArray = Object.keys(catMap).map(name => ({
          category_name: name,
          total_units: catMap[name]
        }));
        setCategoryData(cArray);
      }

      if (isAdmin) {
        const aData = await apiFetch('/api/approvals?status=PENDING');
        setPendingApprovals(aData.adjustments || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do painel:', error);
    } finally {
      setLoading(false);
    }
  };

  const lowStockProducts = products.filter(p => p.quantity <= p.min_stock);

  // Prepare chart data
  const pieChartData = categoryData.map(c => ({
    name: c.category_name || 'Geral',
    value: isAdmin ? (c.total_cost_value || 0) : (c.total_units || 0)
  }));

  // Prepare entries vs exits bar chart data
  const movementStats = [
    { type: 'Entradas', quantidade: movements.filter(m => m.type === 'ENTRY').reduce((acc, m) => acc + m.quantity, 0), fill: '#10b981' },
    { type: 'Saídas', quantidade: movements.filter(m => m.type === 'EXIT').reduce((acc, m) => acc + m.quantity, 0), fill: '#f43f5e' },
    { type: 'Ajustes', quantidade: movements.filter(m => m.type === 'ADJUSTMENT').reduce((acc, m) => acc + m.quantity, 0), fill: '#f59e0b' }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Painel de Controlo</h1>
          <p className="page-subtitle">
            Bem-vindo de volta, <strong>{user.name}</strong> ({isAdmin ? 'Dono / Administrador' : 'Funcionário / Operador'})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setCurrentPage('movements')} className="btn btn-primary">
            + Registar Movimentação
          </button>
        </div>
      </div>

      {!isAdmin && (
        <div className="restricted-notice">
          <ShieldAlert size={18} />
          <div>
            <strong>Aviso de Restrição RBAC:</strong> Como Operador, você tem permissão operacional para consultar catálogo, efetuar vendas e compras. As margens financeiras globais e preços de custo são visíveis exclusivamente para o Dono/Administrador.
          </div>
        </div>
      )}

      {/* Dynamic Stat Cards */}
      <div className="stats-grid">
        <StatCard
          title="Produtos Registados"
          value={products.length}
          subtitle="Itens ativos no catálogo"
          icon={Package}
          color="primary"
        />

        <StatCard
          title="Alertas de Estoque Baixo"
          value={lowStockProducts.length}
          subtitle="Produtos abaixo do limite mínimo"
          icon={AlertTriangle}
          color={lowStockProducts.length > 0 ? 'rose' : 'emerald'}
        />

        {isAdmin && valuation ? (
          <>
            <StatCard
              title="Valoração Total (Custo)"
              value={`Kz ${valuation.total_cost_value.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}`}
              subtitle={`Valoração a Venda: Kz ${valuation.total_sale_value.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}`}
              icon={DollarSign}
              color="amber"
            />

            <StatCard
              title="Lucro Presumido"
              value={`Kz ${valuation.total_projected_profit.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}`}
              subtitle="Margem de lucro total em estoque"
              icon={TrendingUp}
              color="emerald"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Ações Operacionais"
              value="Movimentar"
              subtitle="Registos de Entrada e Saída"
              icon={ArrowDownLeft}
              color="emerald"
            />
            <StatCard
              title="Catálogo Disponível"
              value={products.reduce((acc, p) => acc + p.quantity, 0)}
              subtitle="Unidades físicas em inventário"
              icon={Package}
              color="amber"
            />
          </>
        )}
      </div>

      {/* Pending Approval Alert Box for Admin */}
      {isAdmin && pendingApprovals.length > 0 && (
        <div className="glass-panel" style={{
          padding: '1.25rem',
          marginBottom: '2rem',
          borderLeft: '4px solid var(--accent-amber)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '0.6rem', borderRadius: '50%', color: '#fbbf24' }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', color: '#fbbf24' }}>
                Existem {pendingApprovals.length} solicitação(ões) de ajuste de estoque pendente(s) de aprovação!
              </h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Funcionários submeteram correções de estoque devido a perdas ou avarias que exigem a sua validação.
              </p>
            </div>
          </div>
          <button onClick={() => setCurrentPage('approvals')} className="btn btn-warning btn-sm" style={{ background: 'var(--accent-amber)', color: '#000' }}>
            Rever Ajustes <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Interactive Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Pie/Donut Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieIcon size={18} color="var(--primary)" />
            {isAdmin ? 'Distribuição da Valoração por Categoria (Kz)' : 'Distribuição de Unidades por Categoria'}
          </h3>

          <div style={{ width: '100%', height: 260 }}>
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [isAdmin ? `Kz ${Number(val).toLocaleString('pt-AO', { minimumFractionDigits: 2 })}` : `${val} un`, 'Total']}
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: '4rem', color: 'var(--text-muted)' }}>Sem dados suficientes para gráfico</div>
            )}
          </div>
        </div>

        {/* Bar Chart: Entries vs Exits */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={18} color="var(--accent-emerald)" /> Volume Recente de Movimentações (Unidades)
          </h3>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={movementStats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="type" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="quantidade" radius={[6, 6, 0, 0]}>
                  {movementStats.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid: Low Stock Alert & Recent Movements */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        {/* Low Stock Table */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} color="var(--accent-rose)" /> Produtos com Estoque Baixo
            </h3>
            <button onClick={() => setCurrentPage('products')} className="btn btn-secondary btn-sm">
              Ver Todos
            </button>
          </div>

          {lowStockProducts.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '1rem 0' }}>
              🎉 Todos os produtos estão com níveis de estoque adequados.
            </p>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Qtd Atual</th>
                    <th>Qtd Mín.</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.slice(0, 5).map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {p.sku}</div>
                      </td>
                      <td style={{ fontWeight: '700' }}>{p.quantity} {p.unit}</td>
                      <td>{p.min_stock} {p.unit}</td>
                      <td>
                        <LowStockBadge quantity={p.quantity} minStock={p.min_stock} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Movements Log */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowDownLeft size={18} color="var(--primary)" /> Últimas Movimentações
            </h3>
            <button onClick={() => setCurrentPage('movements')} className="btn btn-secondary btn-sm">
              Histórico
            </button>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Utilizador</th>
                </tr>
              </thead>
              <tbody>
                {movements.slice(0, 5).map(m => (
                  <tr key={m.id}>
                    <td>
                      {m.type === 'ENTRY' && <span className="badge badge-success"><ArrowDownLeft size={12} /> Entrada</span>}
                      {m.type === 'EXIT' && <span className="badge badge-danger"><ArrowUpRight size={12} /> Saída</span>}
                      {m.type === 'ADJUSTMENT' && <span className="badge badge-warning">Ajuste</span>}
                    </td>
                    <td>
                      <div style={{ fontWeight: '500' }}>{m.product_name}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{new Date(m.created_at).toLocaleString('pt-PT')}</div>
                    </td>
                    <td style={{ fontWeight: '700' }}>
                      {m.type === 'ENTRY' ? `+${m.quantity}` : `-${m.quantity}`}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {m.user_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
