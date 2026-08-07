import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  CheckSquare,
  TrendingUp,
  FileText,
  Users,
  Lock,
  X
} from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage, isOpen, onClose }) {
  const { user, apiFetch } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) {
      apiFetch('/api/approvals?status=PENDING')
        .then(data => setPendingCount(data.adjustments?.length || 0))
        .catch(() => setPendingCount(0));
    }
  }, [isAdmin, currentPage]);

  const navItems = [
    { id: 'dashboard', label: 'Painel Principal', icon: LayoutDashboard, role: 'ALL' },
    { id: 'products', label: 'Catálogo de Produtos', icon: Package, role: 'ALL' },
    { id: 'movements', label: 'Movimentação de Estoque', icon: ArrowLeftRight, role: 'ALL' },
    {
      id: 'approvals',
      label: 'Aprovações Pendentes',
      icon: CheckSquare,
      role: 'ADMIN',
      badge: pendingCount > 0 ? pendingCount : null
    },
    { id: 'financial', label: 'Relatório Financeiro', icon: TrendingUp, role: 'ADMIN' },
    { id: 'audit', label: 'Histórico de Auditoria', icon: FileText, role: 'ADMIN' },
    { id: 'users', label: 'Gestão de Utilizadores', icon: Users, role: 'ADMIN' }
  ];

  const handleNavClick = (id) => {
    setCurrentPage(id);
    if (onClose) onClose(); // close drawer on mobile after selecting
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-label="Fechar menu"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Mobile close button */}
        <div className="sidebar-mobile-header">
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Menu</span>
          <button className="btn btn-secondary btn-sm sidebar-close-btn" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="nav-section-title">Menu Operacional</div>
        <nav className="sidebar-nav">
          {navItems.map(item => {
            if (item.role === 'ADMIN' && !isAdmin) {
              return (
                <div
                  key={item.id}
                  className="nav-link"
                  style={{ opacity: 0.4, cursor: 'not-allowed' }}
                  title="Acesso Restrito ao Administrador/Dono"
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                  <Lock size={12} style={{ marginLeft: 'auto', color: 'var(--accent-amber)' }} />
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge !== null && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Info Box */}
        <div style={{
          marginTop: 'auto',
          padding: '0.85rem',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border-color)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <div style={{ fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '2px' }}>
            Perfil Logado: {isAdmin ? 'Dono / Admin' : 'Funcionário'}
          </div>
          <div>
            {isAdmin ? 'Visibilidade financeira e autorização global ativas.' : 'Acesso a custos e relatórios desativado.'}
          </div>
        </div>
      </aside>
    </>
  );
}
