import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import { exportToCSV } from '../utils/exportCsv';
import {
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  Award,
  Shield,
  FileSpreadsheet,
  Download,
  BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

export default function FinancialReports() {
  const { user, apiFetch } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) {
      loadReport();
    }
  }, [isAdmin]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/reports/valuation');
      setData(res);
    } catch (err) {
      console.error('Erro ao carregar relatório financeiro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!data || !data.category_valuation) return;
    const columns = [
      { key: 'category_name', label: 'Categoria' },
      { key: 'product_count', label: 'Total de Produtos' },
      { key: 'total_units', label: 'Total de Unidades' },
      { key: 'total_cost_value', label: 'Valor Custo (Kz)' },
      { key: 'total_sale_value', label: 'Valor Venda (Kz)' }
    ];
    exportToCSV(data.category_valuation, columns, 'relatorio_valoracao_categorias');
  };

  if (!isAdmin) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <Shield size={48} color="var(--accent-rose)" style={{ marginBottom: '1rem' }} />
        <h2>Acesso Restrito ao Administrador/Dono</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Os relatórios financeiros e valoração de estoque são confidenciais do Administrador.
        </p>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="page-container" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        A compilar valoração financeira do inventário...
      </div>
    );
  }

  const { summary, category_valuation, top_valued_products } = data;

  const chartData = category_valuation.map(c => ({
    categoria: c.category_name || 'Geral',
    'Custo (Kz)': c.total_cost_value || 0,
    'Venda (Kz)': c.total_sale_value || 0
  }));

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Relatório de Valoração Financeira</h1>
          <p className="page-subtitle">Visão financeira global do estoque em Kwanzas (Kz), custos de aquisição e lucro presumido (Exclusivo Dono)</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleExportCSV} className="btn btn-secondary">
            <Download size={16} /> Exportar CSV
          </button>
          <button onClick={() => window.print()} className="btn btn-primary">
            <FileSpreadsheet size={16} /> Imprimir Relatório
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <StatCard
          title="Valor Total em Estoque (Custo)"
          value={`Kz ${summary.total_cost_value.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}`}
          subtitle="Capital imobilizado a preço de custo"
          icon={DollarSign}
          color="amber"
        />

        <StatCard
          title="Valor Total a Preço de Venda"
          value={`Kz ${summary.total_sale_value.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}`}
          subtitle="Receita bruta projetada"
          icon={TrendingUp}
          color="primary"
        />

        <StatCard
          title="Lucro Presumido Projetado"
          value={`Kz ${summary.total_projected_profit.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}`}
          subtitle="Margem financeira bruta total"
          icon={Award}
          color="emerald"
        />

        <StatCard
          title="Unidades em Estoque"
          value={summary.total_units}
          subtitle={`${summary.total_products} produtos distintos registados`}
          icon={Package}
          color="primary"
        />
      </div>

      {/* Recharts Bar Chart Section */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart2 size={18} color="var(--primary)" /> Comparativo Financeiro por Categoria: Custo vs. Venda (Kz)
        </h3>

        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="categoria" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} formatter={(val) => `Kz ${Number(val).toLocaleString('pt-AO', { minimumFractionDigits: 2 })}`} />
              <Legend wrapperStyle={{ color: '#94a3b8' }} />
              <Bar dataKey="Custo (Kz)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Venda (Kz)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Category Breakdown & Top Products */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Category Breakdown Table */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} color="var(--primary)" /> Valoração por Categoria de Produto
          </h3>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Itens / Unid.</th>
                  <th>Valor Custo (Kz)</th>
                  <th>Valor Venda (Kz)</th>
                  <th>Margem Lucro</th>
                </tr>
              </thead>
              <tbody>
                {category_valuation.map(c => {
                  const cost = c.total_cost_value || 0;
                  const sale = c.total_sale_value || 0;
                  const profit = sale - cost;
                  const marginPct = cost > 0 ? Math.round((profit / cost) * 100) : 0;

                  return (
                    <tr key={c.category_name}>
                      <td style={{ fontWeight: '600' }}>{c.category_name || 'Geral'}</td>
                      <td>{c.product_count} prods ({c.total_units || 0} un)</td>
                      <td style={{ color: 'var(--text-secondary)' }}>Kz {cost.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</td>
                      <td style={{ fontWeight: '700' }}>Kz {sale.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</td>
                      <td>
                        <span className={`badge ${marginPct > 35 ? 'badge-success' : 'badge-warning'}`}>
                          +{marginPct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Valued Products Table */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} color="var(--accent-emerald)" /> Top 5 Produtos com Maior Valor Imobilizado
          </h3>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Qtd Estoque</th>
                  <th>Valor Custo (Kz)</th>
                  <th>Valor Venda (Kz)</th>
                </tr>
              </thead>
              <tbody>
                {top_valued_products.map(p => (
                  <tr key={p.sku}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {p.sku}</div>
                    </td>
                    <td style={{ fontWeight: '700' }}>{p.quantity}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>Kz {p.total_cost?.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</td>
                    <td style={{ fontWeight: '700', color: '#34d399' }}>Kz {p.total_sale?.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</td>
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
