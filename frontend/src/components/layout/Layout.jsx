import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Dynamic title based on pathname
  const getPageTitle = (path) => {
    if (path.includes('/dashboard')) return 'Logistics Command Dashboard';
    if (path.includes('/bookings')) return 'Trip & Booking Operations';
    if (path.includes('/customers')) return 'Customer Directory';
    if (path.includes('/vehicles')) return 'Fleet & Vehicle Assets';
    if (path.includes('/drivers')) return 'Driver Personnel';
    if (path.includes('/invoices')) return 'Invoicing & Payments (Razorpay)';
    if (path.includes('/notifications')) return 'WhatsApp Notification Logs';
    if (path.includes('/driver-portal')) return 'Driver Active Trips Portal';
    return 'Transport CRM';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          title={getPageTitle(location.pathname)}
        />

        <main style={{ flex: 1, padding: '1.75rem', maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
