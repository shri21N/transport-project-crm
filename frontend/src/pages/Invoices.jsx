import React, { useState, useEffect } from 'react';
import invoiceApi from '../api/invoiceApi';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import StatCard from '../components/common/StatCard';
import {
  Receipt,
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  DollarSign,
  Printer,
  Loader2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Banknote,
  FileText,
} from 'lucide-react';

export const Invoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({ totalBilled: 0, totalCollected: 0, totalPending: 0, totalInvoices: 0, paidCount: 0, unpaidCount: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;

      const res = await invoiceApi.getAll(params);
      if (res.success) {
        setInvoices(res.invoices);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInvoices();
  };

  /**
   * Razorpay Test Mode Checkout Flow
   */
  const handleRazorpayPay = async (invoice) => {
    try {
      setProcessingId(invoice._id);

      // Step 1: Create order on backend
      const orderRes = await invoiceApi.createRazorpayOrder(invoice._id);
      if (!orderRes.success) {
        alert(orderRes.message || 'Failed to initialize payment gateway.');
        return;
      }

      // Check if simulated / mock mode (e.g. In local development if live keys not inserted)
      if (orderRes.isSimulated || !window.Razorpay) {
        const simulatePay = window.confirm(
          `[Razorpay Test Mode Simulated Checkout]\n\nInvoice: ${invoice.invoiceNumber}\nAmount: ₹${invoice.totalAmount.toLocaleString()}\nOrder ID: ${orderRes.orderId}\n\nClick OK to simulate successful test payment verification.`
        );

        if (simulatePay) {
          const verifyRes = await invoiceApi.verifyPayment(invoice._id, {
            razorpay_order_id: orderRes.orderId,
            razorpay_payment_id: `pay_sim_${Date.now()}`,
            razorpay_signature: 'test_signature_mock',
          });

          if (verifyRes.success) {
            setPaymentSuccessData(verifyRes.invoice);
            fetchInvoices();
          }
        }
        return;
      }

      // Step 2: Open Standard Razorpay Checkout popup
      const options = {
        key: orderRes.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_demo',
        amount: orderRes.amount,
        currency: orderRes.currency || 'INR',
        name: 'Transport CRM Logistics',
        description: `Payment for Invoice #${invoice.invoiceNumber}`,
        order_id: orderRes.orderId,
        handler: async (response) => {
          try {
            const verifyRes = await invoiceApi.verifyPayment(invoice._id, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              setPaymentSuccessData(verifyRes.invoice);
              fetchInvoices();
            }
          } catch (verifyErr) {
            alert(verifyErr.message || 'Payment verification failed.');
          }
        },
        prefill: {
          name: invoice.customerId?.name || 'Customer',
          email: invoice.customerId?.email || 'customer@example.com',
          contact: invoice.customerId?.phone || '+919876543210',
        },
        theme: {
          color: '#4f46e5',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (err) {
      alert(err.message || 'Error processing payment.');
    } finally {
      setProcessingId(null);
    }
  };

  /**
   * Offline / Cash Payment Fallback
   */
  const handleMarkCashPaid = async (invoice) => {
    if (!window.confirm(`Mark Invoice #${invoice.invoiceNumber} as Paid via Cash Settlement?`)) return;

    try {
      setProcessingId(invoice._id);
      await invoiceApi.markPaidManual(invoice._id, { paymentMethod: 'Cash' });
      fetchInvoices();
    } catch (err) {
      alert(err.message || 'Failed to mark payment.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenDetail = (inv) => {
    setSelectedInvoice(inv);
    setIsDetailOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Invoicing & Razorpay Payments</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Automated billing upon delivery completion, Razorpay Test Mode checkout, and WhatsApp receipts
          </p>
        </div>
      </div>

      {/* Revenue KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard
          title="Total Billed"
          value={`₹${stats.totalBilled?.toLocaleString()}`}
          subtitle={`${stats.totalInvoices} Invoices generated`}
          icon={<Receipt size={24} />}
        />
        <StatCard
          title="Collected Revenue"
          value={`₹${stats.totalCollected?.toLocaleString()}`}
          subtitle={`${stats.paidCount} Paid invoices`}
          icon={<CheckCircle2 size={24} color="var(--color-success)" />}
        />
        <StatCard
          title="Outstanding Unpaid"
          value={`₹${stats.totalPending?.toLocaleString()}`}
          subtitle={`${stats.unpaidCount} Awaiting settlement`}
          icon={<Clock size={24} color="var(--color-danger)" />}
        />
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { id: 'all', label: 'All Invoices' },
            { id: 'Unpaid', label: 'Unpaid' },
            { id: 'Paid', label: 'Paid' },
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
            placeholder="Search by invoice # or order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary btn-sm">
            <Search size={16} />
          </button>
        </form>
      </div>

      {/* Invoices List Table */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem', color: 'var(--color-primary)' }} />
          <p>Loading invoices & payment status...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <Receipt size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
          <h3>No Invoices Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Invoices are auto-generated whenever a trip status is updated to <strong>Delivered</strong>.
          </p>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '1rem' }}>Invoice #</th>
                  <th style={{ padding: '1rem' }}>Customer</th>
                  <th style={{ padding: '1rem' }}>Linked Booking</th>
                  <th style={{ padding: '1rem' }}>Amount (Incl. 18% GST)</th>
                  <th style={{ padding: '1rem' }}>Payment Status</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv._id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                        {inv.invoiceNumber}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{inv.customerId?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inv.customerId?.company || inv.customerId?.phone}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {inv.bookingId?.bookingNumber || 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {inv.bookingId?.goodsDescription}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        ₹{inv.totalAmount?.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Base: ₹{inv.amount?.toLocaleString()} + Tax: ₹{inv.tax?.toLocaleString()}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <Badge status={inv.status} />
                      {inv.status === 'Paid' && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                          via {inv.paymentMethod || 'Razorpay'}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        {/* View & Print Slip */}
                        <button
                          onClick={() => handleOpenDetail(inv)}
                          className="btn btn-secondary btn-sm"
                          title="View Invoice Slip"
                        >
                          <FileText size={15} />
                        </button>

                        {/* If Unpaid, offer Razorpay Test Checkout and Cash marking */}
                        {inv.status === 'Unpaid' && (
                          <>
                            <button
                              onClick={() => handleRazorpayPay(inv)}
                              className="btn btn-primary btn-sm"
                              disabled={processingId === inv._id}
                              title="Pay via Razorpay Test Mode"
                              style={{ gap: '0.35rem' }}
                            >
                              {processingId === inv._id ? (
                                <Loader2 className="animate-spin" size={14} />
                              ) : (
                                <>
                                  <CreditCard size={14} /> Pay Online
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleMarkCashPaid(inv)}
                              className="btn btn-secondary btn-sm"
                              disabled={processingId === inv._id}
                              title="Mark Cash Payment"
                              style={{ color: 'var(--color-success)' }}
                            >
                              <Banknote size={14} />
                            </button>
                          </>
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

      {/* Invoice Slip / Print Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedInvoice ? `Invoice Slip - ${selectedInvoice.invoiceNumber}` : 'Invoice'}
        maxWidth="680px"
      >
        {selectedInvoice && (
          <div id="printable-invoice">
            {/* Invoice Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border-subtle)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  TRANSPORT CRM
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Logistics & Cargo Transport Services
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  GSTIN: 27AABCT1234F1Z8
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace' }}>
                  {selectedInvoice.invoiceNumber}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Date: {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <Badge status={selectedInvoice.status} />
                </div>
              </div>
            </div>

            {/* Billed To Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  BILLED TO:
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '2px' }}>
                  {selectedInvoice.customerId?.name}
                </div>
                {selectedInvoice.customerId?.company && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {selectedInvoice.customerId?.company}
                  </div>
                )}
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {selectedInvoice.customerId?.phone} | {selectedInvoice.customerId?.email}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {selectedInvoice.customerId?.address}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  CONSIGNMENT ROUTE:
                </div>
                <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                  <strong>Trip ID:</strong> {selectedInvoice.bookingId?.bookingNumber || 'N/A'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <strong>Cargo:</strong> {selectedInvoice.bookingId?.goodsDescription}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <strong>Route:</strong> {selectedInvoice.bookingId?.pickupLocation} ➔ {selectedInvoice.bookingId?.dropLocation}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', backgroundColor: 'var(--bg-surface-elevated)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Item Description</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.75rem' }}>
                    Freight & Transport Service ({selectedInvoice.bookingId?.goodsDescription})
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                    ₹{selectedInvoice.amount?.toLocaleString()}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.75rem' }}>
                    Goods and Services Tax (GST @ {selectedInvoice.taxRate || 18}%)
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                    ₹{selectedInvoice.tax?.toLocaleString()}
                  </td>
                </tr>
                <tr style={{ backgroundColor: 'var(--bg-surface-elevated)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 800, fontSize: '1rem' }}>Total Amount Due:</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-primary)' }}>
                    ₹{selectedInvoice.totalAmount?.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Payment Details if Paid */}
            {selectedInvoice.status === 'Paid' && (
              <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={16} /> Paid in Full
                </div>
                <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Settled via {selectedInvoice.paymentMethod}
                  {selectedInvoice.razorpayPaymentId && ` (Ref: ${selectedInvoice.razorpayPaymentId})`}
                  {selectedInvoice.paidAt && ` on ${new Date(selectedInvoice.paidAt).toLocaleString()}`}
                </div>
              </div>
            )}

            {/* Print & Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsDetailOpen(false)}>
                Close
              </button>
              <button type="button" className="btn btn-primary" onClick={handlePrint}>
                <Printer size={16} /> Print Bill
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Success Dialog */}
      {paymentSuccessData && (
        <Modal
          isOpen={!!paymentSuccessData}
          onClose={() => setPaymentSuccessData(null)}
          title="Payment Successful"
          maxWidth="480px"
        >
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <CheckCircle2 size={36} color="var(--color-success)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Payment Verified!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Invoice <strong>{paymentSuccessData.invoiceNumber}</strong> has been marked as <strong>PAID</strong>. An automated WhatsApp confirmation has been dispatched to the customer.
            </p>
            <button
              onClick={() => setPaymentSuccessData(null)}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Done
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Invoices;
