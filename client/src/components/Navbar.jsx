import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, User, LogOut, Briefcase, Menu } from 'lucide-react';

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';

  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Hamburger button — visible only on mobile */}
        <button
          className="btn btn-secondary btn-sm hamburger-btn"
          onClick={onMenuToggle}
          aria-label="Abrir menu lateral"
        >
          <Menu size={20} />
        </button>

        <div className="navbar-brand">
          <img
            src="/logo.png"
            alt="CVNET TEC Logo"
            style={{
              height: '42px',
              width: 'auto',
              borderRadius: '8px',
              objectFit: 'contain',
              background: 'rgba(255,255,255,0.05)',
              padding: '2px'
            }}
          />
          <div>
            <span className="brand-title">CVNETGEST</span>
          </div>
        </div>
      </div>

      <div className="navbar-right">
        {/* Role Badge — hidden on very small screens */}
        <div className="role-badge-navbar" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.3rem 0.75rem',
          borderRadius: 'var(--radius-sm)',
          background: isAdmin ? 'rgba(139, 92, 246, 0.12)' : 'rgba(6, 182, 212, 0.10)',
          border: `1px solid ${isAdmin ? 'rgba(139, 92, 246, 0.3)' : 'rgba(6, 182, 212, 0.25)'}`,
          fontSize: '0.75rem',
          fontWeight: '600',
          color: isAdmin ? '#c4b5fd' : '#67e8f9',
          letterSpacing: '0.03em'
        }}>
          {isAdmin ? <Shield size={13} /> : <Briefcase size={13} />}
          <span>{isAdmin ? 'Administrador' : 'Funcionário'}</span>
        </div>

        {/* Current User Info — name hidden on small screens */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: isAdmin ? 'rgba(139, 92, 246, 0.2)' : 'rgba(6, 182, 212, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isAdmin ? '#c4b5fd' : '#67e8f9',
            flexShrink: 0
          }}>
            {isAdmin ? <Shield size={18} /> : <User size={18} />}
          </div>
          <div className="navbar-user-info">
            <div style={{ fontSize: '0.85rem', fontWeight: '600', lineHeight: 1.2 }}>{user.name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.email}</div>
          </div>
        </div>

        {/* Logout Button */}
        <button onClick={logout} className="btn btn-secondary btn-sm" title="Encerrar Sessão">
          <LogOut size={16} />
          <span className="logout-text">Sair</span>
        </button>
      </div>
    </header>
  );
}
