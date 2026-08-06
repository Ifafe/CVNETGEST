import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Send, X, AlertTriangle, CheckCircle } from 'lucide-react';

export default function RequestPermissionModal({ product, onClose, onSuccess }) {
  const { apiFetch } = useAuth();
  const [proposedQty, setProposedQty] = useState(product?.quantity || 0);
  const [type, setType] = useState('CORRECTION');
  const [justification, setJustification] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!justification.trim()) {
      setError('Por favor, informe a justificativa para a solicitação.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiFetch('/api/movements/adjust', {
        method: 'POST',
        body: JSON.stringify({
          product_id: product.id,
          proposed_qty: Number(proposedQty),
          type,
          justification: justification.trim()
        })
      });

      setSubmittedSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Erro ao enviar solicitação ao administrador.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent-amber)'
            }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Solicitar Permissão ao Administrador</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Requerimento de alteração para aprovação do Dono / Admin
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" disabled={loading}>
            <X size={16} />
          </button>
        </div>

        {submittedSuccess ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem', color: 'var(--accent-emerald)'
            }}>
              <CheckCircle size={32} />
            </div>
            <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Solicitação Enviada com Sucesso!
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              O pedido de alteração foi encaminhado para a fila de aprovação do Administrador.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: 'rgba(244,63,94,0.15)',
                border: '1px solid rgba(244,63,94,0.3)',
                color: '#fb7185',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.825rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-color)',
              padding: '0.85rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1rem',
              fontSize: '0.85rem'
            }}>
              <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{product?.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                SKU: {product?.sku} | Estoque Atual: <strong>{product?.quantity} {product?.unit}</strong>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Quantidade Proposta</label>
                <input
                  type="number"
                  className="form-input"
                  value={proposedQty}
                  onChange={(e) => setProposedQty(e.target.value)}
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tipo de Alteração</label>
                <select
                  className="form-select"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="CORRECTION">Correção de Contagem</option>
                  <option value="DAMAGE">Avaria / Produto Danificado</option>
                  <option value="LOSS">Perda / Extravio</option>
                  <option value="THEFT">Falta de Estoque</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Justificativa da Solicitação *</label>
              <textarea
                className="form-input"
                rows="3"
                placeholder="Explique ao Administrador por que esta alteração é necessária..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ background: 'linear-gradient(135deg, var(--accent-amber), #d97706)' }}
              >
                <Send size={16} />
                <span>{loading ? 'A enviar...' : 'Enviar Solicitação'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
