import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dashboardApi from '../api/dashboardApi';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import {
  Truck,
  Activity,
  DollarSign,
  Clock,
  CalendarCheck2,
  Users,
  Send,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getMetrics();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <Loader2 className="animate-spin" size={40} color="var(--color-primary)" />
        <p style={{ color: 'var(--text-secondary)' }}>Aggregating logistics metrics...</p>
      </div>
    );
  }

  const summary = data?.summary || {};
  const charts = data?.charts || {};
  const activity = data?.recentActivity || [];

  const pieColors = ['#10b981', '#3b82f6', '#f59e0b'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner / Welcome */}
      <div
        className="glass-panel"
        style={{
          padding: '1.5rem 1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(14, 165, 233, 0.1) 100%)',
          border: '1px solid rgba(79, 70, 229, 0.3)',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            Welcome back, <span className="gradient-text">{user?.name}</span> 👋
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            System overview for active trips, revenue collections, and vehicle deployment.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchMetrics} className="btn btn-secondary btn-sm" title="Refresh metrics">
            <RefreshCw size={16} /> Refresh
          </button>
          <button onClick={() => navigate('/bookings')} className="btn btn-primary btn-sm">
            <CalendarCheck2 size={16} /> New Consignment
          </button>
        </div>
      </div>

      {/* Top KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          title="Active Trips in Motion"
          value={summary.activeTrips || 0}
          subtitle="Assigned & In-Transit consignments"
          icon={<Activity size={26} color="var(--color-primary)" />}
        />
        <StatCard
          title="Monthly Settled Revenue"
          value={`₹${(summary.monthlyRevenue || 0).toLocaleString()}`}
          subtitle={`₹${(summary.totalLifetimeRevenue || 0).toLocaleString()} Lifetime billing`}
          icon={<DollarSign size={26} color="var(--color-success)" />}
        />
        <StatCard
          title="Fleet Utilization Rate"
          value={`${summary.fleetUtilization || 0}%`}
          subtitle={`${summary.onTripVehicles || 0} of ${summary.totalVehicles || 0} vehicles on highway`}
          icon={<Truck size={26} color="var(--color-secondary)" />}
        />
        <StatCard
          title="Outstanding Invoices"
          value={`₹${(summary.pendingInvoicesAmount || 0).toLocaleString()}`}
          subtitle={`${summary.pendingInvoicesCount || 0} Invoices awaiting payment`}
          icon={<Clock size={26} color="var(--color-warning)" />}
        />
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        {/* Bookings & Monthly Volume Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Consignment Volume & Demand</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trips completed per month</p>
            </div>
            <BarChart3 size={20} color="var(--color-primary)" />
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="bookings" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Trips Dispatched" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Growth Trend */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Revenue Growth (₹)</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monthly billing velocity</p>
            </div>
            <TrendingUp size={20} color="var(--color-success)" />
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.trend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(val) => (val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`)}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  formatter={(value) => [`₹${Number(value || 0).toLocaleString()}`, 'Revenue']}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Fleet Distribution & Recent Operations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
        {/* Fleet Status Donut */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Fleet Availability</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Real-time vehicle status distribution</p>
            </div>
            <PieIcon size={20} color="var(--color-secondary)" />
          </div>

          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.fleetStatus || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(charts.fleetStatus || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Operations Live Feed */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Consignment Operations</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Latest trip activities & milestone updates</p>
            </div>
            <button onClick={() => navigate('/bookings')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
              View All <ArrowRight size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activity.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recent trip activity recorded.</p>
            ) : (
              activity.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {item.description}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Badge status={item.status} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
