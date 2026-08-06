import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Package, Shield, User, KeyRound, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleQuickFill = (targetEmail, targetPass) => {
    setEmail(targetEmail);
    setPassword(targetPass);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.15), transparent 40%), radial-gradient(circle at bottom left, rgba(139, 92, 246, 0.15), transparent 40%), #0b0f19',
      padding: '1.5rem'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img
            src="/logo.png"
            alt="CVNET TEC Logo"
            style={{
              width: '90px',
              height: 'auto',
              margin: '0 auto 0.75rem',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.05)',
              padding: '6px'
            }}
          />
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>CVNETGEST</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Sistema de Gestão de Estoque Multi-nível
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fb7185',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Endereço de E-mail</label>
            <input
              type="email"
              className="form-input"
              placeholder="ex: dono@cvnetgest.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Palavra-passe</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.95rem' }}
            disabled={loading}
          >
            <KeyRound size={18} />
            <span>{loading ? 'A autenticar...' : 'Iniciar Sessão'}</span>
          </button>
        </form>

        {/* Demo Fast Access Buttons */}
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', textAlign: 'center' }}>
            Acesso Rápido para Demonstração (RBAC)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              onClick={() => handleQuickFill('dono@cvnetgest.com', 'admin123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start' }}
            >
              <Shield size={14} color="#c4b5fd" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '600', fontSize: '0.8rem' }}>Dono / Admin</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Acesso Global</div>
              </div>
            </button>

            <button
              onClick={() => handleQuickFill('operador@cvnetgest.com', 'operador123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start' }}
            >
              <User size={14} color="#67e8f9" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '600', fontSize: '0.8rem' }}>Funcionário</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Sem Financeiro</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
