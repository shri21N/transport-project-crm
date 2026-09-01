import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CalendarCheck2,
  Users,
  Truck,
  UserCheck,
  Receipt,
  MessageSquareText,
  Shield,
  LogOut,
  Navigation,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, role, logout } = useAuth();

  const isDriver = role === 'driver';
  const isAdmin = role === 'admin';

  const navItems = isDriver
    ? [
        {
          label: 'My Trips Portal',
          path: '/driver-portal',
          icon: <Navigation size={20} />,
        },
      ]
    : [
        {
          label: 'Dashboard',
          path: '/dashboard',
          icon: <LayoutDashboard size={20} />,
        },
        {
          label: 'Bookings & Trips',
          path: '/bookings',
          icon: <CalendarCheck2 size={20} />,
        },
        {
          label: 'Customers',
          path: '/customers',
          icon: <Users size={20} />,
        },
        {
          label: 'Fleet / Vehicles',
          path: '/vehicles',
          icon: <Truck size={20} />,
        },
        {
          label: 'Drivers',
          path: '/drivers',
          icon: <UserCheck size={20} />,
        },
        {
          label: 'Invoices & Payments',
          path: '/invoices',
          icon: <Receipt size={20} />,
        },
        {
          label: 'WhatsApp Logs',
          path: '/notifications',
          icon: <MessageSquareText size={20} />,
        },
      ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 40,
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      <aside
        style={{
          width: '260px',
          height: '100vh',
          position: 'sticky',
          top: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          zIndex: 50,
          transition: 'transform var(--transition-normal)',
          transform: isOpen || window.innerWidth > 768 ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '1.5rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
            }}
          >
            <Truck size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Transport<span className="gradient-text">CRM</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Logistics Suite
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '1.25rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, padding: '0 0.75rem 0.5rem', letterSpacing: '0.05em' }}>
            Main Menu
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth <= 768 && onClose) onClose();
              }}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.7rem 0.875rem',
                borderRadius: 'var(--radius-md)',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                transition: 'all var(--transition-fast)',
                boxShadow: isActive ? '0 4px 12px rgba(79, 70, 229, 0.3)' : 'none',
              })}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Card & Logout */}
        <div
          style={{
            padding: '1rem',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-elevated)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', overflow: 'hidden' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  color: 'white',
                  flexShrink: 0,
                }}
              >
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user?.name || 'User'}
                </div>
                <span className={`badge badge-${role === 'admin' ? 'paid' : role === 'dispatcher' ? 'assigned' : 'intransit'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                  {role}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
