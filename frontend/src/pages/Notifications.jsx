import React, { useState, useEffect } from 'react';
import notificationApi from '../api/notificationApi';
import customerApi from '../api/customerApi';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import StatCard from '../components/common/StatCard';
import {
  MessageSquareText,
  Send,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  User,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export const Notifications = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0, deliveryRate: 100 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [composeForm, setComposeForm] = useState({
    phone: '',
    recipientName: '',
    message: '',
  });
  const [isSending, setIsSending] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;

      const res = await notificationApi.getAll(params);
      if (res.success) {
        setLogs(res.logs);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load notification logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await customerApi.getAll({ limit: 100 });
      if (res.success) setCustomers(res.customers);
    } catch (err) {
      console.error('Failed to load customers for compose:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [statusFilter]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleCustomerSelect = (e) => {
    const custId = e.target.value;
    if (!custId) {
      setComposeForm({ ...composeForm, phone: '', recipientName: '' });
      return;
    }
    const cust = customers.find((c) => c._id === custId);
    if (cust) {
      setComposeForm({
        ...composeForm,
        phone: cust.phone,
        recipientName: cust.name,
      });
    }
  };

  const handleComposeSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSending(true);

    try {
      await notificationApi.sendManual(composeForm);
      setIsComposeOpen(false);
      setComposeForm({ phone: '', recipientName: '', message: '' });
      fetchLogs();
    } catch (err) {
      setFormError(err.message || 'Failed to dispatch WhatsApp message.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Meta WhatsApp Notification Logs</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Real-time audit log of customer alerts, consignment milestones, and payment receipts
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchLogs} className="btn btn-secondary">
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          <button onClick={() => setIsComposeOpen(true)} className="btn btn-primary">
            <Send size={16} />
            <span>Compose WhatsApp</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard
          title="Total Notifications"
          value={stats.total}
          subtitle="Event triggers logged"
          icon={<MessageSquareText size={24} />}
        />
        <StatCard
          title="Dispatched"
          value={stats.sent}
          subtitle="Delivered to WhatsApp"
          icon={<CheckCircle2 size={24} color="var(--color-success)" />}
        />
        <StatCard
          title="Delivery Rate"
          value={`${stats.deliveryRate}%`}
          subtitle="High reliability rate"
          icon={<Clock size={24} color="var(--color-primary)" />}
        />
        <StatCard
          title="Failed / Blocked"
          value={stats.failed}
          subtitle="Invalid numbers / network"
          icon={<AlertCircle size={24} color="var(--color-danger)" />}
        />
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { id: 'all', label: 'All Logs' },
            { id: 'sent', label: 'Sent' },
            { id: 'failed', label: 'Failed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`btn btn-sm ${statusFilter === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '400px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by phone, recipient, or text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary btn-sm">
            <Search size={16} />
          </button>
        </form>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem', color: 'var(--color-primary)' }} />
          <p>Loading notification logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <MessageSquareText size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
          <h3>No Notification Logs Recorded</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            WhatsApp notifications trigger automatically when booking events occur.
          </p>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '1rem' }}>Timestamp</th>
                  <th style={{ padding: '1rem' }}>Recipient</th>
                  <th style={{ padding: '1rem' }}>Event Type</th>
                  <th style={{ padding: '1rem' }}>Message Payload</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log._id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(log.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.recipientName || 'Customer'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{log.recipientPhone}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className="badge badge-assigned" style={{ fontSize: '0.7rem' }}>
                        {log.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', maxWidth: '380px' }}>
                      <div style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'pre-line',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        maxHeight: '80px',
                        overflowY: 'auto',
                      }}>
                        {log.message}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <Badge status={log.status} text={log.status === 'sent' ? 'Delivered' : 'Failed'} />
                      {log.errorMessage && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '140px' }}>
                          {log.errorMessage}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Compose Custom WhatsApp Modal */}
      <Modal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        title="Compose Direct WhatsApp Message"
      >
        {formError && (
          <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            <AlertCircle size={16} /> <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleComposeSubmit}>
          <div className="form-group">
            <label className="form-label">Quick Select Customer</label>
            <select className="form-select" onChange={handleCustomerSelect}>
              <option value="">-- Or enter custom number below --</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Recipient Name</label>
              <input
                type="text"
                className="form-input"
                value={composeForm.recipientName}
                onChange={(e) => setComposeForm({ ...composeForm, recipientName: e.target.value })}
                placeholder="e.g. Ramesh Kumar"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="text"
                className="form-input"
                required
                value={composeForm.phone}
                onChange={(e) => setComposeForm({ ...composeForm, phone: e.target.value })}
                placeholder="+919876543210"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">WhatsApp Message Body *</label>
            <textarea
              className="form-textarea"
              rows={4}
              required
              value={composeForm.message}
              onChange={(e) => setComposeForm({ ...composeForm, message: e.target.value })}
              placeholder="Type your message here... Use *bold* for bold text."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsComposeOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSending}>
              {isSending ? <Loader2 className="animate-spin" size={18} /> : 'Dispatch WhatsApp'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Notifications;
