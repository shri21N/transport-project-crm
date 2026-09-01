import React, { useState, useEffect } from 'react';
import customerApi from '../api/customerApi';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  Building,
  MapPin,
  Edit2,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
  MessageCircle,
  Clock,
  CheckCircle,
} from 'lucide-react';

export const Customers = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchCustomers = async (searchQuery = search) => {
    try {
      setLoading(true);
      const res = await customerApi.getAll({ search: searchQuery });
      if (res.success) {
        setCustomers(res.customers);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers(search);
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedCustomer(null);
    setFormData({
      name: '',
      company: '',
      phone: '+91',
      email: '',
      address: '',
      notes: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cust) => {
    setIsEditing(true);
    setSelectedCustomer(cust);
    setFormData({
      name: cust.name || '',
      company: cust.company || '',
      phone: cust.phone || '',
      email: cust.email || '',
      address: cust.address || '',
      notes: cust.notes || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenDetail = async (cust) => {
    setSelectedCustomer(cust);
    setIsDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const res = await customerApi.getById(cust._id);
      if (res.success) {
        setCustomerDetail(res);
      }
    } catch (err) {
      console.error('Failed to load customer details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);

    try {
      if (isEditing) {
        await customerApi.update(selectedCustomer._id, formData);
      } else {
        await customerApi.create(formData);
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      setFormError(err.message || 'Failed to save customer details.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove customer '${name}'?`)) {
      try {
        await customerApi.delete(id);
        fetchCustomers();
      } catch (err) {
        alert(err.message || 'Failed to delete customer.');
      }
    }
  };

  return (
    <div>
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Customer Directory</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Manage shipper accounts, delivery contacts, and billing records
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary">
          <UserPlus size={18} />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search by customer name, company, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
          {search && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setSearch('');
                fetchCustomers('');
              }}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Customer Listing */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem', color: 'var(--color-primary)' }} />
          <p>Loading customers...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <Users size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
          <h3>No Customers Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            {search ? 'Try adjusting your search criteria.' : 'Start by adding your first logistics customer.'}
          </p>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <UserPlus size={18} /> Add Customer
          </button>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '1rem' }}>Customer / Company</th>
                  <th style={{ padding: '1rem' }}>Contact Info</th>
                  <th style={{ padding: '1rem' }}>Address</th>
                  <th style={{ padding: '1rem' }}>WhatsApp Ready</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((cust) => (
                  <tr
                    key={cust._id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cust.name}</div>
                      {cust.company && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Building size={12} /> {cust.company}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                        <Phone size={14} color="var(--color-primary)" />
                        <span style={{ fontFamily: 'monospace' }}>{cust.phone}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        <Mail size={12} />
                        <span>{cust.email}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', maxWidth: '240px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <MapPin size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{cust.address}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className="badge badge-delivered" style={{ fontSize: '0.7rem' }}>
                        <MessageCircle size={12} /> Enabled
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleOpenDetail(cust)}
                          className="btn btn-secondary btn-sm"
                          title="View Trips & Invoices"
                        >
                          <ExternalLink size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(cust)}
                          className="btn btn-secondary btn-sm"
                          title="Edit Customer"
                        >
                          <Edit2 size={15} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(cust._id, cust.name)}
                            className="btn btn-danger btn-sm"
                            title="Delete Customer"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Customer' : 'Add New Customer'}
      >
        {formError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.875rem',
          }}>
            <AlertCircle size={16} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rajesh Sharma"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Company / Enterprise</label>
              <input
                type="text"
                className="form-input"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Reliance Retail Logistics"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Phone Number (E.164 with Country Code) *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+919876543210"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Required for automated WhatsApp notifications
              </span>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="rajesh@example.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Billing / Dispatch Address *</label>
            <textarea
              className="form-textarea"
              rows={3}
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Plot 45, MIDC Industrial Area, Andheri East, Mumbai 400093"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Internal Notes</label>
            <input
              type="text"
              className="form-input"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Preferred delivery in morning slot"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : isEditing ? 'Save Changes' : 'Create Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Detail & Trip History Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedCustomer ? `${selectedCustomer.name} - Profile & History` : 'Customer Details'}
        maxWidth="800px"
      >
        {detailLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <Loader2 className="animate-spin" size={32} color="var(--color-primary)" style={{ margin: '0 auto' }} />
          </div>
        ) : customerDetail ? (
          <div>
            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Trips</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{customerDetail.stats?.totalBookings || 0}</div>
              </div>
              <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Trips</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  {customerDetail.stats?.activeBookings || 0}
                </div>
              </div>
              <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completed</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)' }}>
                  {customerDetail.stats?.deliveredBookings || 0}
                </div>
              </div>
              <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Paid</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-success)' }}>
                  ₹{(customerDetail.stats?.totalSpent || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Booking History Table */}
            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Recent Booking History</h4>
            {customerDetail.bookings && customerDetail.bookings.length > 0 ? (
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={{ padding: '0.75rem' }}>Trip ID</th>
                      <th style={{ padding: '0.75rem' }}>Route</th>
                      <th style={{ padding: '0.75rem' }}>Vehicle</th>
                      <th style={{ padding: '0.75rem' }}>Cost</th>
                      <th style={{ padding: '0.75rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerDetail.bookings.map((b) => (
                      <tr key={b._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{b.bookingNumber || b._id.slice(-6)}</td>
                        <td style={{ padding: '0.75rem' }}>{b.pickupLocation} ➔ {b.dropLocation}</td>
                        <td style={{ padding: '0.75rem' }}>{b.vehicleId?.registrationNumber || 'Unassigned'}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>₹{b.estimatedCost?.toLocaleString()}</td>
                        <td style={{ padding: '0.75rem' }}><Badge status={b.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No trips registered yet for this customer.</p>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default Customers;
