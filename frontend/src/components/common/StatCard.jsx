import React from 'react';

export const StatCard = ({ title, value, subtitle, icon, trend, color = 'primary' }) => {
  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform var(--transition-fast), border-color var(--transition-fast)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'var(--border-focus)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
    >
      <div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '0.5rem' }}>
          {title}
        </p>
        <h3 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          {value}
        </h3>
        {subtitle && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>

      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: `rgba(79, 70, 229, 0.15)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-primary)',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
