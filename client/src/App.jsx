import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Movements from './pages/Movements';
import Approvals from './pages/Approvals';
import FinancialReports from './pages/FinancialReports';
import AuditLogs from './pages/AuditLogs';
import UsersManagement from './pages/UsersManagement';
import { Shield, Lock } from 'lucide-react';

// Guard: renders children only if the user has the required role
function RequireRole({ role, children }) {
  const { user } = useAuth();
  if (!user) return null;
  if (role === 'ADMIN' && user.role !== 'ADMIN') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        gap: '1rem',
        color: 'var(--text-muted)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Lock size={28} style={{ color: 'var(--accent-amber)' }} />
        </div>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            Acesso Restrito
          </div>
          <div style={{ fontSize: '0.85rem' }}>
            Esta secção requer permissões de <strong>Administrador / Dono</strong>.<br />
            Contacte o responsável da conta para obter acesso.
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          fontSize: '0.75rem',
          padding: '0.3rem 0.8rem',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          color: 'var(--accent-amber)'
        }}>
          <Shield size={12} />
          <span>Perfil atual: Funcionário</span>
        </div>
      </div>
    );
  }
  return children;
}

function MainLayout() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!user) {
    return <Login />;
  }

  return (
    <div className="app-container">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="main-content">
        <Navbar />
        {currentPage === 'dashboard' && <Dashboard setCurrentPage={setCurrentPage} />}
        {currentPage === 'products' && <Products />}
        {currentPage === 'movements' && <Movements />}
        {currentPage === 'approvals' && (
          <RequireRole role="ADMIN"><Approvals /></RequireRole>
        )}
        {currentPage === 'financial' && (
          <RequireRole role="ADMIN"><FinancialReports /></RequireRole>
        )}
        {currentPage === 'audit' && (
          <RequireRole role="ADMIN"><AuditLogs /></RequireRole>
        )}
        {currentPage === 'users' && (
          <RequireRole role="ADMIN"><UsersManagement /></RequireRole>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
