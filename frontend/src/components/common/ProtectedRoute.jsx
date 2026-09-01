import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        background: 'var(--bg-app)',
        color: 'var(--text-secondary)',
      }}>
        <Loader2 className="animate-spin" size={36} color="var(--color-primary)" />
        <p>Verifying secure session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // If a driver tries to access admin pages, redirect to driver portal
    if (role === 'driver') {
      return <Navigate to="/driver-portal" replace />;
    }

    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', maxWidth: '500px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}>
            <ShieldAlert size={36} color="var(--color-danger)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Access Restricted</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Your role (<strong style={{ color: 'var(--color-primary)' }}>{role}</strong>) does not have sufficient permissions to view this section.
          </p>
          <a href="/dashboard" className="btn btn-primary">
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
