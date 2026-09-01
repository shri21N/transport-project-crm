import React, { useState, useEffect } from 'react';
import vehicleApi from '../api/vehicleApi';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import StatCard from '../components/common/StatCard';
import {
  Truck,
  PlusCircle,
  Search,
  Filter,
  Fuel,
  Weight,
  Wrench,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Layers,
  Activity,
} from 'lucide-react';

export const Vehicles = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const [vehicles, setVehicles] = useState([]);
  const [stats, setStats] = useState({ totalFleet: 0, available: 0, onTrip: 0, maintenance: 0, utilizationRate: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [formData, setFormData] = useState({
    registrationNumber: '',
    type: 'Truck',
    capacity: '',
    status: 'Available',
    modelName: '',
    fuelType: 'Diesel',
  });
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (search) params.search = search;

      const res = await vehicleApi.getAll(params);
      if (res.success) {
        setVehicles(res.vehicles);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVehicles();
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedVehicle(null);
    setFormData({
      registrationNumber: '',
      type: 'Truck',
      capacity: '10 Tons',
      status: 'Available',
      modelName: '',
      fuelType: 'Diesel',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v) => {
    setIsEditing(true);
    setSelectedVehicle(v);
    setFormData({
      registrationNumber: v.registrationNumber || '',
      type: v.type || 'Truck',
      capacity: v.capacity || '',
      status: v.status || 'Available',
      modelName: v.modelName || '',
      fuelType: v.fuelType || 'Diesel',
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
        await vehicleApi.update(selectedVehicle._id, formData);
      } else {
        await vehicleApi.create(formData);
      }
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err) {
      setFormError(err.message || 'Failed to save vehicle.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, reg) => {
    if (window.confirm(`Are you sure you want to remove vehicle '${reg}' from fleet?`)) {
      try {
        await vehicleApi.delete(id);
        fetchVehicles();
      } catch (err) {
        alert(err.message || 'Failed to delete vehicle.');
      }
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Fleet & Vehicle Assets</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Monitor fleet availability, transport capacities, and operational health
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary">
          <PlusCircle size={18} />
          <span>Register Vehicle</span>
        </button>
      </div>

      {/* Fleet KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard
          title="Total Fleet"
          value={stats.totalFleet}
          subtitle="Registered vehicles"
          icon={<Truck size={24} />}
        />
        <StatCard
          title="Available Now"
          value={stats.available}
          subtitle="Ready for dispatch"
          icon={<CheckCircle2 size={24} color="var(--color-success)" />}
        />
        <StatCard
          title="On-Trip Active"
          value={stats.onTrip}
          subtitle={`${stats.utilizationRate}% Fleet utilization`}
          icon={<Activity size={24} color="var(--color-secondary)" />}
        />
        <StatCard
          title="In Maintenance"
          value={stats.maintenance}
          subtitle="Service & repairs"
          icon={<Wrench size={24} color="var(--color-warning)" />}
        />
      </div>

      {/* Filters & Search Toolbar */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Fleet' },
            { id: 'Available', label: 'Available' },
            { id: 'On-Trip', label: 'On-Trip' },
            { id: 'Maintenance', label: 'Maintenance' },
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

        {/* Type & Search */}
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, maxWidth: '500px' }}>
          <select
            className="form-select"
            style={{ width: '150px' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="Truck">Truck</option>
            <option value="Trailer">Trailer</option>
            <option value="Van">Van</option>
            <option value="Container">Container</option>
            <option value="Mini Truck">Mini Truck</option>
            <option value="Pickup">Pickup</option>
          </select>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search reg # / model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary btn-sm">
              <Search size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Vehicles Grid / Table */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem', color: 'var(--color-primary)' }} />
          <p>Loading vehicle assets...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <Truck size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
          <h3>No Vehicles Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            No vehicles match the selected filter or search terms.
          </p>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <PlusCircle size={18} /> Register Vehicle
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {vehicles.map((v) => (
            <div
              key={v._id}
              className="glass-panel"
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform var(--transition-fast)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                      {v.registrationNumber}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {v.modelName || `${v.type} Vehicle`}
                    </div>
                  </div>
                  <Badge status={v.status} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', margin: '1rem 0', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                    <Layers size={15} color="var(--color-primary)" />
                    <span>{v.type}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                    <Weight size={15} color="var(--color-secondary)" />
                    <span>{v.capacity}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                    <Fuel size={15} color="var(--color-warning)" />
                    <span>{v.fuelType}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => handleOpenEdit(v)}
                  className="btn btn-secondary btn-sm"
                  title="Edit Vehicle"
                >
                  <Edit2 size={15} /> Edit
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(v._id, v.registrationNumber)}
                    className="btn btn-danger btn-sm"
                    title="Delete Vehicle"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Vehicle Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Vehicle' : 'Register New Vehicle'}
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
              <label className="form-label">Registration Number *</label>
              <input
                type="text"
                className="form-input"
                required
                style={{ textTransform: 'uppercase' }}
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. MH-04-AB-1234"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Vehicle Type *</label>
              <select
                className="form-select"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Truck">Truck</option>
                <option value="Trailer">Trailer</option>
                <option value="Van">Van</option>
                <option value="Container">Container</option>
                <option value="Mini Truck">Mini Truck</option>
                <option value="Pickup">Pickup</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Load Capacity *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="e.g. 10 Tons / 2500 kg"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Operational Status *</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Available">Available</option>
                <option value="On-Trip">On-Trip</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Model / Make</label>
              <input
                type="text"
                className="form-input"
                value={formData.modelName}
                onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                placeholder="e.g. Tata Signa 4825.TK"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fuel Type</label>
              <select
                className="form-select"
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
              >
                <option value="Diesel">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="Electric">Electric</option>
                <option value="Petrol">Petrol</option>
              </select>
            </div>
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
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : isEditing ? 'Save Changes' : 'Register Vehicle'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Vehicles;
