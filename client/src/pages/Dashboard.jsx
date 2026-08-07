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
  BarChart3,
  PlusCircle,
  FileSpreadsheet,
  Printer,
  Clock,
  Zap,
  Layers
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

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const pData = await apiFetch('/api/products');
      const loadedProducts = pData.products || [];
      setProducts(loadedProducts);

      const mData = await apiFetch('/api/movements?limit=15');
      setMovements(mData.movements || []);

      if (isAdmin) {
        const vData = await apiFetch('/api/reports/valuation');
        setValuation(vData.summary || null);
        setCategoryData(vData.category_valuation || []);
      } else {
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

  // Clean user display name
  const cleanUserName = (user?.name || 'Utilizador').replace(/\s*\([^)]*\)/g, '');

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
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Painel de Controlo</h1>
          <p className="page-subtitle">
            Bem-vindo de volta, <strong>{cleanUserName}</strong> • {isAdmin ? 'Dono / Administrador' : 'Funcionário / Operador'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => setCurrentPage('movements')} className="btn btn-primary">
            <PlusCircle size={16} /> Registar Movimentação
          </button>
        </div>
      </div>

      {/* Quick Action Bar / Shortcuts */}
      <div className="glass-panel" style={{
        padding: '0.85rem 1.25rem',
        marginBottom: '1.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap',
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Zap size={14} color="var(--accent-amber)" /> Atalhos Rápidos:
        </span>
        <button onClick={() => setCurrentPage('products')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.8rem' }}>
          <Package size={14} /> Catálogo de Produtos
        </button>
        <button onClick={() => setCurrentPage('movements')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.8rem' }}>
          <ArrowDownLeft size={14} color="var(--accent-emerald)" /> Entrada / Compra
        </button>
        <button onClick={() => setCurrentPage('movements')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.8rem' }}>
          <ArrowUpRight size={14} color="var(--accent-rose)" /> Saída / Venda
        </button>
        {isAdmin && (
          <button onClick={() => setCurrentPage('financial')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.8rem' }}>
            <TrendingUp size={14} color="var(--accent-purple)" /> Relatório Financeiro
          </button>
        )}
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
      <div className="stats-grid" style={{ marginBottom: '1.75rem' }}>
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
          subtitle={lowStockProducts.length > 0 ? "Requer reposição urgente" : "Estoque em nível saudável"}
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
          padding: '1.25rem 1.5rem',
          marginBottom: '1.75rem',
          borderLeft: '4px solid var(--accent-amber)',
          background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.08), transparent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '0.65rem', borderRadius: '50%', color: '#fbbf24' }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', color: '#fbbf24', margin: 0 }}>
                {pendingApprovals.length === 1
                  ? 'Existe 1 solicitação de ajuste de estoque pendente de aprovação!'
                  : `Existem ${pendingApprovals.length} solicitações de ajuste de estoque pendentes de aprovação!`}
              </h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px', margin: 0 }}>
                Funcionários submeteram correções de estoque devido a perdas ou avarias que exigem a sua validação.
              </p>
            </div>
          </div>
          <button onClick={() => setCurrentPage('approvals')} className="btn btn-warning" style={{ background: 'var(--accent-amber)', color: '#000', fontWeight: '700' }}>
            Rever Ajustes <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Interactive Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
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
                    formatter={(val) => [isAdmin ? `Kz ${Number(val).toLocaleString('pt-AO', { minimumFractionDigits: 2 })}` : `${val} un`, 'Valoração']}
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
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
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }} />
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        {/* Low Stock Table */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} color="var(--accent-rose)" /> Produtos com Estoque Baixo
            </h3>
            <button onClick={() => setCurrentPage('products')} className="btn btn-secondary btn-sm">
              Ver Todos no Catálogo
            </button>
          </div>

          {lowStockProducts.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '1.5rem 0', textAlign: 'center' }}>
              🎉 Todos os produtos estão com níveis de estoque adequados.
            </p>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Qtd Atual</th>
                    <th>Mínimo</th>
                    <th style={{ textAlign: 'right' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.slice(0, 5).map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {p.sku}</div>
                      </td>
                      <td style={{ fontWeight: '700', color: 'var(--accent-rose)' }}>
                        {p.quantity} {p.unit}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {p.min_stock} {p.unit}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => setCurrentPage('movements')}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        >
                          + Repor
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Movements History */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="var(--accent-cyan)" /> Últimas Movimentações
            </h3>
            <button onClick={() => setCurrentPage('movements')} className="btn btn-secondary btn-sm">
              Ver Histórico Completo
            </button>
          </div>

          {movements.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '1.5rem 0', textAlign: 'center' }}>
              Nenhuma movimentação recente registada.
            </p>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Produto & Tipo</th>
                    <th>Quantidade</th>
                    <th>Utilizador</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.slice(0, 5).map(m => (
                    <tr key={m.id}>
                      <td>
                        <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{m.product_name}</div>
                        <span className={`badge ${
                          m.type === 'ENTRY' ? 'badge-success' : m.type === 'EXIT' ? 'badge-danger' : 'badge-warning'
                        }`} style={{ fontSize: '0.65rem', marginTop: '2px' }}>
                          {m.type === 'ENTRY' ? 'Entrada' : m.type === 'EXIT' ? 'Saída' : 'Ajuste'}
                        </span>
                      </td>
                      <td style={{ fontWeight: '700' }}>
                        {m.quantity}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {m.user_name || 'Sistema'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
