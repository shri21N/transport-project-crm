import React, { useState, useEffect } from 'react';
import bookingApi from '../api/bookingApi';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/common/Badge';
import {
  Navigation,
  Truck,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  Phone,
  Package,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const DriverPortal = () => {
  const { user } = useAuth();
  const [activeTrips, setActiveTrips] = useState([]);
  const [completedTrips, setCompletedTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [activeTab, setActiveTab] = useState('active');

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const res = await bookingApi.getDriverTrips();
      if (res.success) {
        setActiveTrips(res.activeTrips || []);
        setCompletedTrips(res.completedTrips || []);
      }
    } catch (err) {
      console.error('Failed to load driver trips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleUpdateTripStatus = async (bookingId, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this trip as '${newStatus}'?`)) return;

    try {
      setUpdatingId(bookingId);
      await bookingApi.updateStatus(bookingId, {
        status: newStatus,
        note: `Updated by driver ${user?.name || ''} via Driver Portal`,
      });
      await fetchTrips();
    } catch (err) {
      alert(err.message || 'Failed to update trip status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Driver Header */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 800,
            color: 'white',
          }}>
            {user?.name ? user.name[0].toUpperCase() : 'D'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Pilot Console: {user?.name}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Commercial Driver Assigned Trips & Status Dispatcher
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('active')}
            className={`btn btn-sm ${activeTab === 'active' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Active Trips ({activeTrips.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`btn btn-sm ${activeTab === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Completed ({completedTrips.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader2 className="animate-spin" size={36} color="var(--color-primary)" style={{ margin: '0 auto 1rem' }} />
          <p>Loading your assigned trips...</p>
        </div>
      ) : activeTab === 'active' ? (
        <div>
          {activeTrips.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
              <CheckCircle size={48} style={{ margin: '0 auto 1rem', color: 'var(--color-success)' }} />
              <h3>All Caught Up!</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                You have no active consignments awaiting dispatch right now.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {activeTrips.map((trip) => (
                <div
                  key={trip._id}
                  className="glass-panel"
                  style={{
                    padding: '1.5rem',
                    borderLeft: '4px solid var(--color-primary)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Consignment #{trip.bookingNumber || trip._id.slice(-6)}
                      </span>
                      <h3 style={{ fontSize: '1.25rem', marginTop: '2px' }}>{trip.goodsDescription}</h3>
                    </div>
                    <Badge status={trip.status} />
                  </div>

                  {/* Route card */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={14} /> PICKUP ORIGIN
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.25rem' }}>{trip.pickupLocation}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={14} /> DROP DESTINATION
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.25rem' }}>{trip.dropLocation}</div>
                    </div>
                  </div>

                  {/* Customer and Vehicle Info */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Customer Contact:</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{trip.customerId?.name} ({trip.customerId?.phone})</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Assigned Vehicle:</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                        {trip.vehicleId?.registrationNumber} ({trip.vehicleId?.type})
                      </div>
                    </div>
                  </div>

                  {/* Driver Action Control Buttons */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                    {trip.status === 'Assigned' && (
                      <button
                        onClick={() => handleUpdateTripStatus(trip._id, 'In-Transit')}
                        className="btn btn-primary"
                        disabled={updatingId === trip._id}
                        style={{ flex: 1 }}
                      >
                        {updatingId === trip._id ? <Loader2 className="animate-spin" size={18} /> : 'Start Trip (Mark In-Transit)'}
                      </button>
                    )}

                    {trip.status === 'In-Transit' && (
                      <button
                        onClick={() => handleUpdateTripStatus(trip._id, 'Delivered')}
                        className="btn btn-primary"
                        disabled={updatingId === trip._id}
                        style={{ flex: 1, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                      >
                        {updatingId === trip._id ? <Loader2 className="animate-spin" size={18} /> : 'Mark Completed (Delivered)'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Completed Trips */
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '1rem' }}>Trip ID</th>
                  <th style={{ padding: '1rem' }}>Route</th>
                  <th style={{ padding: '1rem' }}>Goods</th>
                  <th style={{ padding: '1rem' }}>Date</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {completedTrips.map((trip) => (
                  <tr key={trip._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{trip.bookingNumber}</td>
                    <td style={{ padding: '1rem' }}>{trip.pickupLocation} ➔ {trip.dropLocation}</td>
                    <td style={{ padding: '1rem' }}>{trip.goodsDescription}</td>
                    <td style={{ padding: '1rem' }}>{new Date(trip.scheduledDate).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem' }}><Badge status={trip.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverPortal;
