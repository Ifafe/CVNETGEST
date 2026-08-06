import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  Shield,
  User,
  CheckCircle,
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export default function UsersManagement() {
  const { user, apiFetch } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE'
  });

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/users');
      setUsersList(data.users || []);
    } catch (err) {
      console.error('Erro ao carregar utilizadores:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setMsg({ type: 'success', text: res.message });
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', role: 'EMPLOYEE' });
      loadUsers();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const handleToggleStatus = async (targetUser) => {
    setMsg(null);
    try {
      const newStatus = targetUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const res = await apiFetch(`/api/users/${targetUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      setMsg({ type: 'success', text: res.message });
      loadUsers();
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
          A gestão de utilizadores e cargos é restrita ao Administrador Principal.
        </p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestão de Utilizadores</h1>
          <p className="page-subtitle">Adicionar funcionários, gerir cargos e permissões hierárquicas (RBAC)</p>
        </div>

        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <UserPlus size={18} /> Adicionar Novo Utilizador
        </button>
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

      {/* Users Table */}
      <div className="glass-panel">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Nome do Utilizador</th>
                <th>Endereço de E-mail</th>
                <th>Cargo / Função</th>
                <th>Estado da Conta</th>
                <th>Data de Registo</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontWeight: '600' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: u.role === 'ADMIN' ? 'rgba(139,92,246,0.2)' : 'rgba(6,182,212,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: u.role === 'ADMIN' ? '#c4b5fd' : '#67e8f9'
                      }}>
                        {u.role === 'ADMIN' ? <Shield size={16} /> : <User size={16} />}
                      </div>
                      {u.name} {u.id === user.id ? ' (Você)' : ''}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td>
                    <span className={`role-badge ${u.role === 'ADMIN' ? 'admin' : 'employee'}`}>
                      {u.role === 'ADMIN' ? 'Dono / Admin' : 'Funcionário / Operador'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                      {u.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(u.created_at).toLocaleDateString('pt-PT')}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {u.id !== user.id && (
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`btn ${u.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'} btn-sm`}
                      >
                        {u.status === 'ACTIVE' ? 'Desativar Conta' : 'Ativar Conta'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Adicionar Novo Utilizador / Funcionário</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary btn-sm">✕</button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ex: Pedro Santos"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Endereço de E-mail</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="ex: pedro@cvnetgest.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Palavra-passe Inicial</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cargo & Permissões Hierárquicas</label>
                <select
                  className="form-select"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="EMPLOYEE">Funcionário / Operador (Sem acesso financeiro)</option>
                  <option value="ADMIN">Dono / Administrador Principal (Acesso total)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Criar Conta de Utilizador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
