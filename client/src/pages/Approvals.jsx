import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CheckSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  Clock,
  User,
  ArrowRight
} from 'lucide-react';

export default function Approvals() {
  const { user, apiFetch } = useAuth();
  const [adjustments, setAdjustments] = useState([]);
  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING, APPROVED, REJECTED
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  // Reject modal state
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    loadAdjustments();
  }, [activeTab]);

  const loadAdjustments = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/approvals?status=${activeTab}`);
      setAdjustments(data.adjustments || []);
    } catch (err) {
      console.error('Erro ao carregar solicitações:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, action, reason = '') => {
    setMsg(null);
    try {
      const res = await apiFetch(`/api/approvals/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ action, rejection_reason: reason })
      });

      setMsg({ type: 'success', text: res.message });
      setRejectingId(null);
      setRejectionReason('');
      loadAdjustments();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  if (!isAdmin) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <Shield size={48} color="var(--accent-rose)" style={{ marginBottom: '1rem' }} />
        <h2>Acesso Restrito ao Administrador/Dono</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Você não tem permissões para aceder à fila de aprovação de ajustes de estoque.
        </p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fila de Aprovação de Ajustes</h1>
          <p className="page-subtitle">Aprovação ou rejeição de correções críticas de estoque (Dono / Administrador)</p>
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
          background: msg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
          color: msg.type === 'success' ? '#34d399' : '#fb7185',
          border: `1px solid ${msg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`
        }}>
          {msg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`btn ${activeTab === 'PENDING' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Clock size={16} /> Pendentes de Aprovação
        </button>
        <button
          onClick={() => setActiveTab('APPROVED')}
          className={`btn ${activeTab === 'APPROVED' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <CheckCircle size={16} /> Aprovados
        </button>
        <button
          onClick={() => setActiveTab('REJECTED')}
          className={`btn ${activeTab === 'REJECTED' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <XCircle size={16} /> Rejeitados
        </button>
      </div>

      {/* Adjustments List */}
      <div className="glass-panel">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Data da Solicitação</th>
                <th>Requisitante</th>
                <th>Produto</th>
                <th>Alteração de Qtd</th>
                <th>Motivo / Tipo</th>
                <th>Justificativa</th>
                {activeTab === 'PENDING' && <th style={{ textAlign: 'right' }}>Decisão (Admin)</th>}
                {activeTab !== 'PENDING' && <th>Revisado por</th>}
              </tr>
            </thead>
            <tbody>
              {adjustments.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    Nenhuma solicitação de ajuste {activeTab.toLowerCase()} encontrada.
                  </td>
                </tr>
              ) : (
                adjustments.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(a.created_at).toLocaleString('pt-PT')}
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{a.requester_name}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{a.requester_role === 'ADMIN' ? 'Dono/Admin' : 'Operador'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{a.product_name}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>SKU: {a.product_sku}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700' }}>
                        <span>{a.current_qty} {a.product_unit}</span>
                        <ArrowRight size={14} color="var(--accent-amber)" />
                        <span style={{ color: a.diff_qty < 0 ? '#fb7185' : '#34d399' }}>
                          {a.proposed_qty} {a.product_unit} ({a.diff_qty > 0 ? `+${a.diff_qty}` : a.diff_qty})
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${a.type === 'DAMAGE' || a.type === 'LOSS' || a.type === 'THEFT' ? 'badge-danger' : 'badge-warning'}`}>
                        {a.type === 'DAMAGE' && 'Avaria'}
                        {a.type === 'LOSS' && 'Perda'}
                        {a.type === 'THEFT' && 'Roubo'}
                        {a.type === 'CORRECTION' && 'Correção'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '280px' }}>
                      "{a.justification}"
                    </td>

                    {activeTab === 'PENDING' && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleReview(a.id, 'APPROVE')}
                            className="btn btn-success btn-sm"
                            title="Aprovar Ajuste de Estoque"
                          >
                            <CheckCircle size={14} /> Aprovar
                          </button>
                          <button
                            onClick={() => setRejectingId(a.id)}
                            className="btn btn-danger btn-sm"
                            title="Rejeitar Ajuste"
                          >
                            <XCircle size={14} /> Rejeitar
                          </button>
                        </div>
                      </td>
                    )}

                    {activeTab !== 'PENDING' && (
                      <td style={{ fontSize: '0.825rem' }}>
                        <div style={{ fontWeight: '500' }}>{a.reviewer_name || 'Admin'}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                          {a.reviewed_at ? new Date(a.reviewed_at).toLocaleString('pt-PT') : ''}
                        </div>
                        {a.rejection_reason && (
                          <div style={{ color: '#fb7185', fontSize: '0.75rem', marginTop: '2px' }}>
                            Motivo: {a.rejection_reason}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Reason Modal */}
      {rejectingId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3>Rejeitar Solicitação de Ajuste</h3>
              <button onClick={() => setRejectingId(null)} className="btn btn-secondary btn-sm">✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Justificativa para a Rejeição</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Indique o motivo pelo qual o ajuste não foi aprovado..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button onClick={() => setRejectingId(null)} className="btn btn-secondary">
                Cancelar
              </button>
              <button
                onClick={() => handleReview(rejectingId, 'REJECT', rejectionReason)}
                className="btn btn-danger"
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
