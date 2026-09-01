import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, Bell, Shield, Radio, CheckCircle2 } from 'lucide-react';

export const Navbar = ({ onToggleSidebar, title = 'Dashboard' }) => {
  const { user, role } = useAuth();

  return (
    <header
      style={{
        height: '68px',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-surface-glass)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.75rem',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onToggleSidebar}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
          }}
          className="mobile-toggle"
        >
          <Menu size={22} />
        </button>

        <h1 style={{ fontSize: '1.35rem', fontWeight: 700 }}>{title}</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* System Status Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: '0.75rem',
            color: 'var(--color-success)',
            fontWeight: 600,
          }}
        >
          <Radio size={12} className="animate-pulse" />
          <span>System Online</span>
        </div>

        {/* User Role Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Welcome, <strong>{user?.name?.split(' ')[0]}</strong>
          </span>
          <span className="badge badge-assigned" style={{ fontSize: '0.7rem' }}>
            {role?.toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
