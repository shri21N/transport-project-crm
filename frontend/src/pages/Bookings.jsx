import React, { useState, useEffect } from 'react';
import bookingApi from '../api/bookingApi';
import customerApi from '../api/customerApi';
import vehicleApi from '../api/vehicleApi';
import driverApi from '../api/driverApi';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import {
  CalendarCheck2,
  PlusCircle,
  Search,
  Filter,
  Truck,
  UserCheck,
  MapPin,
  Calendar,
  DollarSign,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Edit,
  Trash2,
  Info,
  Layers,
  FileText,
} from 'lucide-react';

export const Bookings = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, assigned: 0, inTransit: 0, delivered: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Dropdown lists for creation & assignment
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    customerId: '',
    vehicleId: '',
    driverId: '',
    pickupLocation: '',
    dropLocation: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    goodsDescription: '',
    weight: '',
    estimatedCost: '',
    specialInstructions: '',
  });

  const [assignForm, setAssignForm] = useState({
    vehicleId: '',
    driverId: '',
    note: '',
  });

  const [statusForm, setStatusForm] = useState({
    status: 'In-Transit',
    note: '',
  });

  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;

      const res = await bookingApi.getAll(params);
      if (res.success) {
        setBookings(res.bookings);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [custRes, vehRes, drivRes] = await Promise.all([
        customerApi.getAll({ limit: 100 }),
        vehicleApi.getAll({ limit: 100 }),
        driverApi.getAll({ limit: 100 }),
      ]);
      if (custRes.success) setCustomers(custRes.customers);
      if (vehRes.success) setVehicles(vehRes.vehicles);
      if (drivRes.success) setDrivers(drivRes.drivers);
    } catch (err) {
      console.error('Failed to load dropdown options:', err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleOpenCreate = () => {
    setCreateForm({
      customerId: customers[0]?._id || '',
      vehicleId: '',
      driverId: '',
      pickupLocation: '',
      dropLocation: '',
      scheduledDate: new Date().toISOString().split('T')[0],
      goodsDescription: '',
      weight: '5 Tons',
      estimatedCost: '15000',
      specialInstructions: '',
    });
    setFormError('');
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);
    try {
      await bookingApi.create(createForm);
      setIsCreateOpen(false);
      fetchBookings();
      fetchDependencies();
    } catch (err) {
      setFormError(err.message || 'Failed to create booking.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenAssign = (booking) => {
    setSelectedBooking(booking);
    setAssignForm({
      vehicleId: booking.vehicleId?._id || '',
      driverId: booking.driverId?._id || '',
      note: 'Assigned by dispatcher',
    });
    setFormError('');
    setIsAssignOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignForm.vehicleId || !assignForm.driverId) {
      setFormError('Please select both a vehicle and a driver.');
      return;
    }
    setIsSaving(true);
    try {
      await bookingApi.assign(selectedBooking._id, assignForm);
      setIsAssignOpen(false);
      fetchBookings();
      fetchDependencies();
    } catch (err) {
      setFormError(err.message || 'Failed to assign trip.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenStatus = (booking) => {
    setSelectedBooking(booking);
    let nextDefault = 'In-Transit';
    if (booking.status === 'In-Transit') nextDefault = 'Delivered';
    if (booking.status === 'Pending') nextDefault = 'Cancelled';
    setStatusForm({
      status: nextDefault,
      note: '',
    });
    setFormError('');
    setIsStatusOpen(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await bookingApi.updateStatus(selectedBooking._id, statusForm);
      setIsStatusOpen(false);
      fetchBookings();
      fetchDependencies();
    } catch (err) {
      setFormError(err.message || 'Failed to update trip status.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDetail = (booking) => {
    setSelectedBooking(booking);
    setIsDetailOpen(true);
  };

  const handleDelete = async (id, num) => {
    if (window.confirm(`Are you sure you want to cancel and delete consignment '${num}'?`)) {
      try {
        await bookingApi.delete(id);
        fetchBookings();
        fetchDependencies();
      } catch (err) {
        alert(err.message || 'Failed to delete booking.');
      }
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Trip & Booking Operations</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Coordinate consignments, assign fleet resources, and track delivery lifecycles
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary">
          <PlusCircle size={18} />
          <span>New Consignment</span>
        </button>
      </div>

      {/* Booking KPI Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { id: 'all', label: 'All Trips', count: stats.total, color: 'var(--color-primary)' },
          { id: 'Pending', label: 'Pending', count: stats.pending, color: '#f59e0b' },
          { id: 'Assigned', label: 'Assigned', count: stats.assigned, color: '#3b82f6' },
          { id: 'In-Transit', label: 'In-Transit', count: stats.inTransit, color: '#a855f7' },
          { id: 'Delivered', label: 'Delivered', count: stats.delivered, color: '#10b981' },
          { id: 'Cancelled', label: 'Cancelled', count: stats.cancelled, color: '#ef4444' },
        ].map((tab) => (
          <div
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className="glass-panel"
            style={{
              padding: '1rem',
              cursor: 'pointer',
              borderColor: statusFilter === tab.id ? tab.color : 'var(--border-subtle)',
              backgroundColor: statusFilter === tab.id ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
              transition: 'all var(--transition-fast)',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              {tab.label}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem', color: tab.color }}>
              {tab.count}
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search by trip number, pickup location, drop destination, or goods..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>
      </div>

      {/* Bookings List Table */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem', color: 'var(--color-primary)' }} />
          <p>Loading trips...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <CalendarCheck2 size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
          <h3>No Consignments Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            No bookings found under this filter.
          </p>
          <button onClick={handleOpenCreate} className="btn btn-primary">
            <PlusCircle size={18} /> Create Consignment
          </button>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '1rem' }}>Trip ID / Date</th>
                  <th style={{ padding: '1rem' }}>Customer</th>
                  <th style={{ padding: '1rem' }}>Route</th>
                  <th style={{ padding: '1rem' }}>Vehicle & Pilot</th>
                  <th style={{ padding: '1rem' }}>Cost</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr
                    key={b._id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                        {b.bookingNumber || b._id.slice(-6)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '2px' }}>
                        <Calendar size={12} />
                        {new Date(b.scheduledDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.customerId?.name || 'Unknown'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.customerId?.company || b.customerId?.phone}</div>
                    </td>
                    <td style={{ padding: '1rem', maxWidth: '250px' }}>
                      <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-primary)' }}>
                        <span style={{ color: 'var(--color-success)' }}>●</span> {b.pickupLocation}
                      </div>
                      <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        <span style={{ color: 'var(--color-danger)' }}>●</span> {b.dropLocation}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {b.vehicleId ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>
                          <Truck size={14} color="var(--color-primary)" />
                          <span>{b.vehicleId.registrationNumber}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Vehicle Unassigned</span>
                      )}
                      {b.driverId ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          <UserCheck size={12} />
                          <span>{b.driverId.name}</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Driver Unassigned</div>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{b.estimatedCost?.toLocaleString()}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.goodsDescription}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <Badge status={b.status} />
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        {/* Detail View */}
                        <button
                          onClick={() => handleOpenDetail(b)}
                          className="btn btn-secondary btn-sm"
                          title="Trip Details & Timeline"
                        >
                          <Info size={15} />
                        </button>

                        {/* Assign Button */}
                        {['Pending', 'Assigned'].includes(b.status) && (
                          <button
                            onClick={() => handleOpenAssign(b)}
                            className="btn btn-secondary btn-sm"
                            title="Assign Vehicle & Driver"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            <Truck size={15} /> Assign
                          </button>
                        )}

                        {/* Update Status Button */}
                        {!['Delivered', 'Cancelled'].includes(b.status) && (
                          <button
                            onClick={() => handleOpenStatus(b)}
                            className="btn btn-primary btn-sm"
                            title="Update Trip Status"
                          >
                            <ArrowRight size={14} /> Status
                          </button>
                        )}

                        {/* Admin Delete for pending */}
                        {isAdmin && ['Pending', 'Cancelled'].includes(b.status) && (
                          <button
                            onClick={() => handleDelete(b._id, b.bookingNumber)}
                            className="btn btn-danger btn-sm"
                            title="Delete Consignment"
                          >
                            <Trash2 size={14} />
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

      {/* Modal: Create Booking */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Consignment Booking"
        maxWidth="700px"
      >
        {formError && (
          <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            <AlertCircle size={16} /> <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label className="form-label">Select Customer / Shipper *</label>
            <select
              className="form-select"
              required
              value={createForm.customerId}
              onChange={(e) => setCreateForm({ ...createForm, customerId: e.target.value })}
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.company ? `(${c.company})` : ''} - {c.phone}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Pickup Origin *</label>
              <input
                type="text"
                className="form-input"
                required
                value={createForm.pickupLocation}
                onChange={(e) => setCreateForm({ ...createForm, pickupLocation: e.target.value })}
                placeholder="e.g. Mumbai Port, Gateway 4"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Drop Destination *</label>
              <input
                type="text"
                className="form-input"
                required
                value={createForm.dropLocation}
                onChange={(e) => setCreateForm({ ...createForm, dropLocation: e.target.value })}
                placeholder="e.g. Pune Industrial Park, Chakan"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Scheduled Date *</label>
              <input
                type="date"
                className="form-input"
                required
                value={createForm.scheduledDate}
                onChange={(e) => setCreateForm({ ...createForm, scheduledDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Estimated Cost (₹) *</label>
              <input
                type="number"
                className="form-input"
                required
                min="0"
                value={createForm.estimatedCost}
                onChange={(e) => setCreateForm({ ...createForm, estimatedCost: e.target.value })}
                placeholder="15000"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Weight / Cargo Size</label>
              <input
                type="text"
                className="form-input"
                value={createForm.weight}
                onChange={(e) => setCreateForm({ ...createForm, weight: e.target.value })}
                placeholder="e.g. 5 Tons"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Goods / Consignment Description *</label>
            <input
              type="text"
              className="form-input"
              required
              value={createForm.goodsDescription}
              onChange={(e) => setCreateForm({ ...createForm, goodsDescription: e.target.value })}
              placeholder="e.g. Automobile components and packed machinery"
            />
          </div>

          {/* Optional Direct Assignment */}
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', margin: '1rem 0' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-primary)' }}>
              Optional: Assign Vehicle & Driver Now
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Vehicle</label>
                <select
                  className="form-select"
                  value={createForm.vehicleId}
                  onChange={(e) => setCreateForm({ ...createForm, vehicleId: e.target.value })}
                >
                  <option value="">-- Assign Later --</option>
                  {vehicles.filter(v => v.status === 'Available').map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.registrationNumber} ({v.type} - {v.capacity})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Driver</label>
                <select
                  className="form-select"
                  value={createForm.driverId}
                  onChange={(e) => setCreateForm({ ...createForm, driverId: e.target.value })}
                >
                  <option value="">-- Assign Later --</option>
                  {drivers.filter(d => d.availabilityStatus === 'Available').map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.phone})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Create Consignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Assign Vehicle & Driver */}
      <Modal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title={selectedBooking ? `Assign Fleet to ${selectedBooking.bookingNumber}` : 'Assign Fleet'}
      >
        {formError && (
          <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            <AlertCircle size={16} /> <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleAssignSubmit}>
          <div className="form-group">
            <label className="form-label">Select Available Vehicle *</label>
            <select
              className="form-select"
              required
              value={assignForm.vehicleId}
              onChange={(e) => setAssignForm({ ...assignForm, vehicleId: e.target.value })}
            >
              <option value="">-- Choose Vehicle --</option>
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.registrationNumber} ({v.type} - {v.capacity}) - [{v.status}]
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Select Available Driver *</label>
            <select
              className="form-select"
              required
              value={assignForm.driverId}
              onChange={(e) => setAssignForm({ ...assignForm, driverId: e.target.value })}
            >
              <option value="">-- Choose Driver --</option>
              {drivers.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.phone}) - [{d.availabilityStatus}]
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Dispatch Note</label>
            <input
              type="text"
              className="form-input"
              value={assignForm.note}
              onChange={(e) => setAssignForm({ ...assignForm, note: e.target.value })}
              placeholder="e.g. Assigned to express corridor"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAssignOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Update Status */}
      <Modal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        title={selectedBooking ? `Update Status - ${selectedBooking.bookingNumber}` : 'Update Status'}
      >
        <form onSubmit={handleStatusSubmit}>
          <div className="form-group">
            <label className="form-label">Select New Status *</label>
            <select
              className="form-select"
              value={statusForm.status}
              onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
            >
              <option value="Assigned">Assigned (Ready for Pickup)</option>
              <option value="In-Transit">In-Transit (Dispatched on Highway)</option>
              <option value="Delivered">Delivered (Completed - Auto-Generates Invoice)</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Status Note / Checkpoint Location</label>
            <input
              type="text"
              className="form-input"
              value={statusForm.note}
              onChange={(e) => setStatusForm({ ...statusForm, note: e.target.value })}
              placeholder="e.g. Cleared toll checkpoint, ETA 2 hours"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsStatusOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Update Status'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Trip Details & Timeline */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedBooking ? `Trip Summary: ${selectedBooking.bookingNumber}` : 'Trip Details'}
        maxWidth="750px"
      >
        {selectedBooking && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem' }}>{selectedBooking.goodsDescription}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Customer: <strong>{selectedBooking.customerId?.name}</strong> ({selectedBooking.customerId?.phone})
                </p>
              </div>
              <Badge status={selectedBooking.status} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PICKUP LOCATION</div>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>{selectedBooking.pickupLocation}</div>
              </div>
              <div className="glass-panel" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DROP DESTINATION</div>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>{selectedBooking.dropLocation}</div>
              </div>
            </div>

            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Status Lifecycle & Event Timeline
            </h4>

            <div style={{ position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid var(--border-medium)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedBooking.statusHistory && selectedBooking.statusHistory.length > 0 ? (
                selectedBooking.statusHistory.map((sh, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: '-1.85rem',
                        top: '4px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary)',
                        border: '2px solid var(--bg-surface)',
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Badge status={sh.status} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(sh.changedAt).toLocaleString()}
                      </span>
                    </div>
                    {sh.note && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        {sh.note}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No status history recorded yet.</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Bookings;
