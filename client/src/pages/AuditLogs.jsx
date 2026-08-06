import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Search,
  Filter,
  Shield,
  UserCheck,
  Package,
  Sliders,
  LogIn
} from 'lucide-react';

export default function AuditLogs() {
  const { user, apiFetch } = useAuth();
  const [logs, setLogs] = useState([]);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) {
      loadLogs();
    }
  }, [actionFilter, isAdmin]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const query = actionFilter ? `?action=${actionFilter}` : '';
      const data = await apiFetch(`/api/audit${query}`);
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Erro ao carregar logs de auditoria:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <Shield size={48} color="var(--accent-rose)" style={{ marginBottom: '1rem' }} />
        <h2>Acesso Restrito ao Administrador/Dono</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          O registo de auditoria imutável do sistema é restrito ao perfil de Administrador.
        </p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Histórico de Auditoria</h1>
          <p className="page-subtitle">Rastreabilidade e log imutável de todas as ações e movimentações executadas no sistema</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Filter size={18} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Filtrar por Ação:</span>
        <select
          className="form-select"
          style={{ maxWidth: '280px' }}
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="">Todas as Ações</option>
          <option value="USER_LOGIN">Autenticação de Utilizador</option>
          <option value="STOCK_ENTRY">Entrada no Estoque</option>
          <option value="STOCK_EXIT">Saída do Estoque</option>
          <option value="ADJUSTMENT_REQUEST">Solicitação de Ajuste</option>
          <option value="ADJUSTMENT_APPROVED">Aprovação de Ajuste</option>
          <option value="ADJUSTMENT_REJECTED">Rejeição de Ajuste</option>
          <option value="PRODUCT_CREATE">Criação de Produto</option>
          <option value="USER_CREATE">Criação de Utilizador</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Data & Hora</th>
                <th>Utilizador</th>
                <th>Cargo</th>
                <th>Tipo de Ação</th>
                <th>Entidade</th>
                <th>Detalhes da Operação</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    Nenhum registo de auditoria encontrado para o filtro selecionado.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(log.created_at).toLocaleString('pt-PT')}
                    </td>
                    <td style={{ fontWeight: '600' }}>
                      {log.user_name}
                    </td>
                    <td>
                      <span className={`role-badge ${log.user_role === 'ADMIN' ? 'admin' : 'employee'}`}>
                        {log.user_role === 'ADMIN' ? 'Dono/Admin' : 'Operador'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ fontFamily: 'monospace', fontSize: '0.725rem' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>
                      {log.entity_type} {log.entity_id ? `(#${log.entity_id.substring(0, 6)})` : ''}
                    </td>
                    <td style={{ fontSize: '0.825rem', fontFamily: 'monospace', color: 'var(--text-secondary)', maxWidth: '380px', wordBreak: 'break-all' }}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
