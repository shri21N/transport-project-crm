import React, { useState, useEffect } from 'react';
import driverApi from '../api/driverApi';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import StatCard from '../components/common/StatCard';
import {
  UserCheck,
  UserPlus,
  Search,
  Phone,
  CreditCard,
  Briefcase,
  AlertCircle,
  Loader2,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Coffee,
} from 'lucide-react';

export const Drivers = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const [drivers, setDrivers] = useState([]);
  const [stats, setStats] = useState({ totalDrivers: 0, available: 0, onTrip: 0, offDuty: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    phone: '',
    availabilityStatus: 'Available',
    address: '',
    emergencyContact: '',
    experienceYears: 0,
  });
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;

      const res = await driverApi.getAll(params);
      if (res.success) {
        setDrivers(res.drivers);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDrivers();
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedDriver(null);
    setFormData({
      name: '',
      licenseNumber: '',
      phone: '+91',
      availabilityStatus: 'Available',
      address: '',
      emergencyContact: '',
      experienceYears: 3,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d) => {
    setIsEditing(true);
    setSelectedDriver(d);
    setFormData({
      name: d.name || '',
      licenseNumber: d.licenseNumber || '',
      phone: d.phone || '',
      availabilityStatus: d.availabilityStatus || 'Available',
      address: d.address || '',
      emergencyContact: d.emergencyContact || '',
      experienceYears: d.experienceYears || 0,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);

    try {
      if (isEditing) {
        await driverApi.update(selectedDriver._id, formData);
      } else {
        await driverApi.create(formData);
      }
      setIsModalOpen(false);
      fetchDrivers();
    } catch (err) {
      setFormError(err.message || 'Failed to save driver.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove driver '${name}'?`)) {
      try {
        await driverApi.delete(id);
        fetchDrivers();
      } catch (err) {
        alert(err.message || 'Failed to delete driver.');
      }
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Driver Personnel</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Manage commercial pilots, verify driving licenses, and track trip availability
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary">
          <UserPlus size={18} />
          <span>Add Driver</span>
        </button>
      </div>

      {/* Driver Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard
          title="Total Drivers"
          value={stats.totalDrivers}
          subtitle="Enrolled pilots"
          icon={<UserCheck size={24} />}
        />
        <StatCard
          title="Available Now"
          value={stats.available}
          subtitle="Ready for duty"
          icon={<CheckCircle2 size={24} color="var(--color-success)" />}
        />
        <StatCard
          title="On-Trip"
          value={stats.onTrip}
          subtitle="Active deliveries"
          icon={<Clock size={24} color="var(--color-secondary)" />}
        />
        <StatCard
          title="Off-Duty"
          value={stats.offDuty}
          subtitle="Resting / Leave"
          icon={<Coffee size={24} color="var(--color-warning)" />}
        />
      </div>

      {/* Filters & Search Toolbar */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Drivers' },
            { id: 'Available', label: 'Available' },
            { id: 'On-Trip', label: 'On-Trip' },
            { id: 'Off-Duty', label: 'Off-Duty' },
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

        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '400px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by driver name or license #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary btn-sm">
            <Search size={16} />
          </button>
        </form>
      </div>

      {/* Driver List Table */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem', color: 'var(--color-primary)' }} />
          <p>Loading driver directory...</p>
        </div>
      ) : drivers.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <UserCheck size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
          <h3>No Drivers Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            No drivers found matching your filter criteria.
          </p>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <UserPlus size={18} /> Register Driver
          </button>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '1rem' }}>Driver Name</th>
                  <th style={{ padding: '1rem' }}>Commercial License</th>
                  <th style={{ padding: '1rem' }}>Phone Contact</th>
                  <th style={{ padding: '1rem' }}>Experience</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => (
                  <tr
                    key={d._id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.name}</div>
                      {d.emergencyContact && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Emergency: {d.emergencyContact}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'monospace', fontWeight: 600 }}>
                        <CreditCard size={14} color="var(--color-primary)" />
                        <span>{d.licenseNumber}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Phone size={14} color="var(--color-secondary)" />
                        <span>{d.phone}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Briefcase size={14} color="var(--text-muted)" />
                        <span>{d.experienceYears} Years</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <Badge status={d.availabilityStatus} />
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleOpenEdit(d)}
                          className="btn btn-secondary btn-sm"
                          title="Edit Driver"
                        >
                          <Edit2 size={15} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(d._id, d.name)}
                            className="btn btn-danger btn-sm"
                            title="Delete Driver"
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

      {/* Add / Edit Driver Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Driver Record' : 'Register New Driver'}
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
                placeholder="e.g. Ramesh Kumar"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Commercial License Number *</label>
              <input
                type="text"
                className="form-input"
                required
                style={{ textTransform: 'uppercase' }}
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. MH0420180091234"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+919876543210"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Availability Status *</label>
              <select
                className="form-select"
                value={formData.availabilityStatus}
                onChange={(e) => setFormData({ ...formData, availabilityStatus: e.target.value })}
              >
                <option value="Available">Available</option>
                <option value="On-Trip">On-Trip</option>
                <option value="Off-Duty">Off-Duty</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Years of Experience</label>
              <input
                type="number"
                className="form-input"
                min="0"
                max="50"
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Emergency Contact Phone</label>
              <input
                type="text"
                className="form-input"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                placeholder="+919123456789"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Residential Address</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Village Road, Sector 12, Navi Mumbai"
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
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : isEditing ? 'Save Changes' : 'Register Driver'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Drivers;
