import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  Shield,
  User,
  CheckCircle,
  AlertCircle,
  Edit2,
  KeyRound,
  Lock,
  X
} from 'lucide-react';

export default function UsersManagement() {
  const { user, apiFetch } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  // Modal Create State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE'
  });

  // Modal Edit Credentials State (ADMIN only)
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    password: '',
    role: 'EMPLOYEE',
    status: 'ACTIVE'
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
        body: JSON.stringify(createFormData)
      });
      setMsg({ type: 'success', text: res.message });
      setShowCreateModal(false);
      setCreateFormData({ name: '', email: '', password: '', role: 'EMPLOYEE' });
      loadUsers();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const handleOpenEditModal = (targetUser) => {
    setEditingUser(targetUser);
    setEditFormData({
      name: targetUser.name,
      password: '',
      role: targetUser.role,
      status: targetUser.status
    });
  };

  const handleUpdateUserCredentials = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await apiFetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData)
      });
      setMsg({ type: 'success', text: res.message });
      setEditingUser(null);
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
          A gestão de utilizadores, alteração de nomes e palavras-passe é uma funcionalidade restrita exclusivamente ao Administrador Principal.
        </p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestão de Utilizadores</h1>
          <p className="page-subtitle">Apenas o Administrador pode registar utilizadores, alterar nomes e definir palavras-passe</p>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
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
                <th style={{ textAlign: 'right' }}>Ações de Administrador</th>
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
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        className="btn btn-secondary btn-sm"
                        title="Editar Nome e Palavra-passe (Exclusivo Admin)"
                      >
                        <KeyRound size={14} />
                        <span>Editar Credenciais</span>
                      </button>

                      {u.id !== user.id && (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`btn ${u.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'} btn-sm`}
                        >
                          {u.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Credentials Modal (ADMIN ONLY) */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <KeyRound size={20} color="var(--primary)" /> Alterar Nome e Palavra-passe
              </h3>
              <button onClick={() => setEditingUser(null)} className="btn btn-secondary btn-sm"><X size={16} /></button>
            </div>

            <form onSubmit={handleUpdateUserCredentials}>
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem',
                border: '1px solid var(--border-color)',
                fontSize: '0.85rem'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>E-mail da Conta:</span> <strong>{editingUser.email}</strong>
              </div>

              <div className="form-group">
                <label className="form-label">Nome do Utilizador</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nova Palavra-passe (deixe em branco para não alterar)</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Nova palavra-passe (opcional)"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Cargo / Perfil</label>
                  <select
                    className="form-select"
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  >
                    <option value="EMPLOYEE">Funcionário / Operador</option>
                    <option value="ADMIN">Dono / Administrador</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Estado da Conta</label>
                  <select
                    className="form-select"
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    disabled={editingUser.id === user.id}
                  >
                    <option value="ACTIVE">Ativa</option>
                    <option value="INACTIVE">Inativa</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setEditingUser(null)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Credenciais
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal (ADMIN ONLY) */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Adicionar Novo Utilizador / Funcionário</h3>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary btn-sm"><X size={16} /></button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ex: Pedro Santos"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Endereço de E-mail</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="ex: pedro@cvnetgest.com"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Palavra-passe Inicial</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cargo & Permissões Hierárquicas</label>
                <select
                  className="form-select"
                  value={createFormData.role}
                  onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
                >
                  <option value="EMPLOYEE">Funcionário / Operador (Sem acesso financeiro)</option>
                  <option value="ADMIN">Dono / Administrador Principal (Acesso total)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
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
