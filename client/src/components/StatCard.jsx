import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'primary' }) {
  return (
    <div className="glass-panel stat-card">
      <div className={`stat-icon ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{title}</div>
        {subtitle && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
