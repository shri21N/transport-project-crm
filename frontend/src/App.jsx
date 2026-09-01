import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Bookings from './pages/Bookings';
import DriverPortal from './pages/DriverPortal';
import Notifications from './pages/Notifications';
import Invoices from './pages/Invoices';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected App Routes (Admin, Dispatcher) */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['admin', 'dispatcher']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>

          {/* Driver-specific portal */}
          <Route
            path="/driver-portal"
            element={
              <ProtectedRoute allowedRoles={['driver', 'admin', 'dispatcher']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DriverPortal />} />
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
