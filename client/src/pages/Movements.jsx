import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { exportToCSV } from '../utils/exportCsv';
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  Sliders,
  CheckCircle,
  AlertCircle,
  Clock,
  ShieldCheck,
  Download,
  Calendar
} from 'lucide-react';

export default function Movements() {
  const { user, apiFetch } = useAuth();
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [activeTab, setActiveTab] = useState('ENTRY'); // 'ENTRY', 'EXIT', 'ADJUST'
  const [timeFilter, setTimeFilter] = useState('ALL'); // 'ALL', 'TODAY', '7DAYS', '30DAYS'
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // Entry Form
  const [entryData, setEntryData] = useState({
    product_id: '',
    quantity: '',
    unit_cost_price: '',
    reason: 'Recepção de Fornecedor',
    reference_doc: ''
  });

  // Exit Form
  const [exitData, setExitData] = useState({
    product_id: '',
    quantity: '',
    reason: 'Venda ao Cliente',
    reference_doc: ''
  });

  // Adjust Form
  const [adjustData, setAdjustData] = useState({
    product_id: '',
    proposed_qty: '',
    type: 'DAMAGE', // LOSS, THEFT, DAMAGE, CORRECTION
    justification: ''
  });

  const isAdmin = user.role === 'ADMIN';

  useEffect(() => {
    loadProducts();
    loadMovements();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await apiFetch('/api/products');
      setProducts(data.products || []);
      if (data.products?.length > 0) {
        setEntryData(prev => ({ ...prev, product_id: data.products[0].id }));
        setExitData(prev => ({ ...prev, product_id: data.products[0].id }));
        setAdjustData(prev => ({ ...prev, product_id: data.products[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadMovements = async () => {
    try {
      const data = await apiFetch('/api/movements?limit=100');
      setMovements(data.movements || []);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMovements = movements.filter(m => {
    if (timeFilter === 'ALL') return true;
    const mDate = new Date(m.created_at);
    const now = new Date();
    if (timeFilter === 'TODAY') {
      return mDate.toDateString() === now.toDateString();
    }
    if (timeFilter === '7DAYS') {
      const diffDays = Math.ceil(Math.abs(now - mDate) / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    if (timeFilter === '30DAYS') {
      const diffDays = Math.ceil(Math.abs(now - mDate) / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }
    return true;
  });

  const handleExportCSV = () => {
    const columns = [
      { key: 'created_at', label: 'Data e Hora' },
      { key: 'type', label: 'Tipo' },
      { key: 'product_name', label: 'Produto' },
      { key: 'product_sku', label: 'SKU' },
      { key: 'quantity', label: 'Quantidade' },
      { key: 'reason', label: 'Motivo' },
      { key: 'reference_doc', label: 'Documento' },
      { key: 'user_name', label: 'Registado Por' }
    ];
    exportToCSV(filteredMovements, columns, 'historico_movimentacoes');
  };

  const handleEntrySubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await apiFetch('/api/movements/entry', {
        method: 'POST',
        body: JSON.stringify(entryData)
      });
      setMsg({ type: 'success', text: `${res.message} Novo Preço Médio de Custo: €${res.new_average_cost?.toFixed(2)}` });
      setEntryData({ product_id: products[0]?.id || '', quantity: '', unit_cost_price: '', reason: 'Recepção de Fornecedor', reference_doc: '' });
      loadProducts();
      loadMovements();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleExitSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await apiFetch('/api/movements/exit', {
        method: 'POST',
        body: JSON.stringify(exitData)
      });
      setMsg({ type: 'success', text: res.message });
      setExitData({ product_id: products[0]?.id || '', quantity: '', reason: 'Venda ao Cliente', reference_doc: '' });
      loadProducts();
      loadMovements();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await apiFetch('/api/movements/adjust', {
        method: 'POST',
        body: JSON.stringify(adjustData)
      });
      if (res.pending_approval) {
        setMsg({ type: 'warning', text: `⌛ ${res.message}` });
      } else {
        setMsg({ type: 'success', text: `✅ ${res.message}` });
      }
      setAdjustData({ product_id: products[0]?.id || '', proposed_qty: '', type: 'DAMAGE', justification: '' });
      loadProducts();
      loadMovements();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const selectedProductForAdjust = products.find(p => p.id === adjustData.product_id);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Movimentação de Estoque</h1>
          <p className="page-subtitle">Registo de Entradas, Saídas e Fila de Ajustes com Autorização</p>
        </div>
      </div>

      {msg && (
        <div style={{
          padding: '0.85rem 1.1rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.9rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          background: msg.type === 'success' ? 'rgba(16,185,129,0.15)' : msg.type === 'warning' ? 'rgba(245,158,11,0.15)' : 'rgba(244,63,94,0.15)',
          color: msg.type === 'success' ? '#34d399' : msg.type === 'warning' ? '#fbbf24' : '#fb7185',
          border: `1px solid ${msg.type === 'success' ? 'rgba(16,185,129,0.3)' : msg.type === 'warning' ? 'rgba(245,158,11,0.3)' : 'rgba(244,63,94,0.3)'}`
        }}>
          {msg.type === 'success' ? <CheckCircle size={18} /> : msg.type === 'warning' ? <Clock size={18} /> : <AlertCircle size={18} />}
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('ENTRY')}
          className={`btn ${activeTab === 'ENTRY' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <ArrowDownLeft size={16} /> Entradas (Compras)
        </button>
        <button
          onClick={() => setActiveTab('EXIT')}
          className={`btn ${activeTab === 'EXIT' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <ArrowUpRight size={16} /> Saídas (Vendas)
        </button>
        <button
          onClick={() => setActiveTab('ADJUST')}
          className={`btn ${activeTab === 'ADJUST' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Sliders size={16} /> Ajuste Manual / Quebras
        </button>
      </div>

      {/* Form Panel */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        {activeTab === 'ENTRY' && (
          <form onSubmit={handleEntrySubmit}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowDownLeft color="var(--accent-emerald)" size={20} /> Registo de Entrada de Estoque (Recepção de Fornecedor)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Selecionar Produto</label>
                <select
                  className="form-select"
                  value={entryData.product_id}
                  onChange={(e) => setEntryData({ ...entryData, product_id: e.target.value })}
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Atual: {p.quantity} {p.unit}) - SKU: {p.sku}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantidade a Adicionar</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={entryData.quantity}
                  onChange={(e) => setEntryData({ ...entryData, quantity: e.target.value })}
                  placeholder="ex: 10"
                  required
                />
              </div>

              {isAdmin ? (
                <div className="form-group">
                  <label className="form-label">Custo Unitário (Kz)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={entryData.unit_cost_price}
                    onChange={(e) => setEntryData({ ...entryData, unit_cost_price: e.target.value })}
                    placeholder="Custo do lote"
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Preço Médio de Custo</label>
                  <input
                    type="text"
                    className="form-input"
                    value="Calculado pelo Sistema (Admin)"
                    disabled
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Motivo / Tipo de Operação</label>
                <input
                  type="text"
                  className="form-input"
                  value={entryData.reason}
                  onChange={(e) => setEntryData({ ...entryData, reason: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nº Fatura AGT / Guia de Remessa</label>
                <input
                  type="text"
                  className="form-input"
                  value={entryData.reference_doc}
                  onChange={(e) => setEntryData({ ...entryData, reference_doc: e.target.value })}
                  placeholder="ex: FT AGT-2026/0492"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-success" disabled={loading}>
              <ArrowDownLeft size={16} /> Confirmar Entrada no Estoque
            </button>
          </form>
        )}

        {activeTab === 'EXIT' && (
          <form onSubmit={handleExitSubmit}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowUpRight color="var(--accent-rose)" size={20} /> Registo de Saída de Estoque (Venda / Consumo Interno)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Selecionar Produto</label>
                <select
                  className="form-select"
                  value={exitData.product_id}
                  onChange={(e) => setExitData({ ...exitData, product_id: e.target.value })}
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Estoque Disponível: {p.quantity} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantidade a Retirar</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={exitData.quantity}
                  onChange={(e) => setExitData({ ...exitData, quantity: e.target.value })}
                  placeholder="ex: 2"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Motivo de Saída</label>
                <input
                  type="text"
                  className="form-input"
                  value={exitData.reason}
                  onChange={(e) => setExitData({ ...exitData, reason: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nº Venda / Talão</label>
                <input
                  type="text"
                  className="form-input"
                  value={exitData.reference_doc}
                  onChange={(e) => setExitData({ ...exitData, reference_doc: e.target.value })}
                  placeholder="ex: VD 2026/881"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-danger" disabled={loading}>
              <ArrowUpRight size={16} /> Confirmar Saída de Estoque
            </button>
          </form>
        )}

        {activeTab === 'ADJUST' && (
          <form onSubmit={handleAdjustSubmit}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders color="var(--accent-amber)" size={20} /> Ajuste de Estoque & Submissão para Aprovação
            </h3>

            <div style={{
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.25)',
              color: '#fbbf24',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.825rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem'
            }}>
              <ShieldCheck size={18} />
              <div>
                {isAdmin
                  ? 'Como Dono/Administrador, correções normais são aplicadas diretamente. Ajustes por Avaria, Roubo ou Perda entram na fila de auditoria.'
                  : 'Ajustes solicitados por Operadores exigem aprovação prévia do Administrador para alterar o estoque real.'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Selecionar Produto</label>
                <select
                  className="form-select"
                  value={adjustData.product_id}
                  onChange={(e) => setAdjustData({ ...adjustData, product_id: e.target.value })}
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Atual: {p.quantity} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Nova Quantidade Real</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={adjustData.proposed_qty}
                  onChange={(e) => setAdjustData({ ...adjustData, proposed_qty: e.target.value })}
                  placeholder={`Atual: ${selectedProductForAdjust?.quantity || 0}`}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tipo de Ajuste</label>
                <select
                  className="form-select"
                  value={adjustData.type}
                  onChange={(e) => setAdjustData({ ...adjustData, type: e.target.value })}
                >
                  <option value="DAMAGE">Avaria / Quebra</option>
                  <option value="LOSS">Perda de Inventário</option>
                  <option value="THEFT">Roubo / Extravio</option>
                  <option value="CORRECTION">Correção de Contagem</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Justificativa Detalhada (Obrigatória)</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Descreva a razão detalhada para esta alteração no estoque..."
                value={adjustData.justification}
                onChange={(e) => setAdjustData({ ...adjustData, justification: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn btn-secondary" style={{ borderColor: 'var(--accent-amber)', color: '#fbbf24' }} disabled={loading}>
              <Clock size={16} /> Submeter Ajuste de Estoque
            </button>
          </form>
        )}
      </div>

      {/* Movements Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem' }}>Histórico Recente de Movimentações</h3>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(0,0,0,0.3)', padding: '0.25rem', borderRadius: '6px' }}>
              <button onClick={() => setTimeFilter('ALL')} className={`btn btn-sm ${timeFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>Tudo</button>
              <button onClick={() => setTimeFilter('TODAY')} className={`btn btn-sm ${timeFilter === 'TODAY' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>Hoje</button>
              <button onClick={() => setTimeFilter('7DAYS')} className={`btn btn-sm ${timeFilter === '7DAYS' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>7 Dias</button>
              <button onClick={() => setTimeFilter('30DAYS')} className={`btn btn-sm ${timeFilter === '30DAYS' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>30 Dias</button>
            </div>

            <button onClick={handleExportCSV} className="btn btn-secondary btn-sm">
              <Download size={14} /> CSV
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Data & Hora</th>
                <th>Tipo</th>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Preço Unit. Venda</th>
                <th>Documento / Justificativa</th>
                <th>Registado por</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.map(m => (
                <tr key={m.id}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(m.created_at).toLocaleString('pt-AO')}
                  </td>
                  <td>
                    {m.type === 'ENTRY' && <span className="badge badge-success"><ArrowDownLeft size={12} /> Entrada</span>}
                    {m.type === 'EXIT' && <span className="badge badge-danger"><ArrowUpRight size={12} /> Saída</span>}
                    {m.type === 'ADJUSTMENT' && <span className="badge badge-warning">Ajuste</span>}
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{m.product_name}</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>SKU: {m.product_sku}</div>
                  </td>
                  <td style={{ fontWeight: '700' }}>
                    {m.type === 'ENTRY' ? `+${m.quantity}` : `-${m.quantity}`}
                  </td>
                  <td>Kz {m.unit_sale_price?.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</td>
                  <td style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    {m.reason} {m.reference_doc ? `(${m.reference_doc})` : ''}
                  </td>
                  <td>
                    <div style={{ fontWeight: '500', fontSize: '0.85rem' }}>{m.user_name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{m.user_role === 'ADMIN' ? 'Dono/Admin' : 'Operador'}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
