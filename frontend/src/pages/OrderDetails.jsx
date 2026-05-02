import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { 
  ArrowLeft, 
  Printer, 
  Package, 
  FileText, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  User,
  IndianRupee,
  ChevronRight,
  Download
} from "lucide-react";
import { Card, Skeleton } from "../components/ui";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function OrderDetails() {
  const { order_id } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${order_id}`);
      setOrder(res.data.order);
      setItems(res.data.items);
    } catch (err) {
      console.error("Failed to fetch order:", err);
      toast.error("Order details unavailable");
    } finally {
      setLoading(false);
    }
  }, [order_id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatus = () => {
    const remaining = Number(order?.remaining_amount || 0);
    const total = Number(order?.total_amount || 0);
    if (remaining === 0) return { label: 'Paid in Full', color: 'var(--success)', bg: 'rgba(22, 163, 74, 0.1)' };
    if (remaining === total) return { label: 'Fully Due', color: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.1)' };
    return { label: 'Partially Paid', color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)' };
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Skeleton height="40px" width="200px" className="mb-8" />
        <Skeleton height="150px" className="mb-8" />
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <Skeleton height="400px" />
          <Skeleton height="400px" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={styles.emptyWrap}>
        <AlertCircle size={48} color="var(--danger)" />
        <h2>Order Not Found</h2>
        <button onClick={() => navigate('/orders')} style={styles.backBtn}>Back to List</button>
      </div>
    );
  }

  const orderStatus = getStatus();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.container}>
      <header className="od-header" style={styles.header}>
        <button onClick={() => navigate('/orders')} style={styles.backBtn}>
          <ArrowLeft size={18} /> Orders History
        </button>
        <div style={styles.actionGroup}>
           <button onClick={() => window.print()} style={styles.printBtn}>
            <Printer size={18} /> Print Record
          </button>
        </div>
      </header>

      <div style={styles.content}>
        {/* Invoice Header */}
        <Card style={styles.invoiceHead}>
          <div className="od-invoice-main" style={styles.invoiceMain}>
            <div style={styles.brandInfo}>
              <div style={styles.invoiceLogo}>NE</div>
              <div>
                <h1 style={styles.invoiceTitle}>Invoice #{order.order_id}</h1>
                <p style={styles.invoiceDate}>{new Date(order.created_at).toLocaleDateString()} • {new Date(order.created_at).toLocaleTimeString()}</p>
              </div>
            </div>
            <div style={{ ...styles.statusTag, background: orderStatus.bg, color: orderStatus.color }}>
              {orderStatus.label}
            </div>
          </div>

          <div className="od-billing-grid" style={styles.billingGrid}>
            <div style={styles.billBox}>
              <h4 style={styles.billLabel}>Billed To</h4>
              <div style={styles.custBox}>
                <div style={styles.custAvatar}>{order.customer_name?.charAt(0)}</div>
                <div>
                  <div style={styles.custName}>{order.customer_name}</div>
                  <div style={styles.custDetail}>ID: #CUST-{order.customer_id}</div>
                </div>
              </div>
            </div>
            <div style={styles.billBox}>
              <h4 style={styles.billLabel}>Order Summary</h4>
              <div style={styles.summaryStats}>
                <div style={styles.statItem}>
                  <span>Total Items</span>
                  <strong>{items.length} Units</strong>
                </div>
                <div style={styles.statItem}>
                  <span>Gross Total</span>
                  <strong>{formatCurrency(order.total_amount)}</strong>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Details Grid */}
        <div className="od-details-grid" style={styles.detailsGrid}>
          <div style={styles.itemsSection}>
            <h3 style={styles.sectionTitle}><Package size={20} /> Itemized Breakdown</h3>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <div className="od-table-wrap">
              <table className="od-table" style={styles.table}>
                <thead style={styles.thead}>
                  <tr>
                    <th style={styles.th}>Product / Variant</th>
                    <th style={styles.th}>Rate</th>
                    <th style={styles.th}>Qty</th>
                    <th style={styles.th}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.itemName}>{item.product_name}</div>
                        <div style={styles.itemMeta}>{item.category} • {item.variant || 'Standard'}</div>
                      </td>
                      <td style={styles.td}>{formatCurrency(item.price)}</td>
                      <td style={styles.td}>{item.quantity} {item.unit}</td>
                      <td style={{ ...styles.td, fontWeight: 700 }}>{formatCurrency(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <div style={styles.footerSummary}>
                <div style={styles.footRow}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
                <div style={styles.footRow}>
                  <span>Tax (0%)</span>
                  <span>₹0</span>
                </div>
                <div style={{ ...styles.footRow, fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '12px' }}>
                  <span>Total Invoice</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </Card>
          </div>

          <div style={styles.paymentSection}>
            <h3 style={styles.sectionTitle}><CreditCard size={20} /> Payment History</h3>
            <Card style={styles.ledgerCard}>
              <div style={styles.ledgerRow}>
                <div style={styles.ledgerDot} />
                <div style={styles.ledgerMain}>
                  <div style={styles.ledgerInfo}>
                    <span>Initial Payment</span>
                    <strong>{formatCurrency(order.paid_amount)}</strong>
                  </div>
                  <div style={styles.ledgerDate}>
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div style={styles.balanceBox}>
                <div style={styles.balanceLabel}>Outstanding Balance</div>
                <div style={{ ...styles.balanceVal, color: Number(order.remaining_amount) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                  {formatCurrency(order.remaining_amount)}
                </div>
                {Number(order.remaining_amount) > 0 && (
                   <button onClick={() => navigate(`/customer-due/${order.customer_id}`)} style={styles.payNowBtn}>
                     Collect Now <ChevronRight size={14} />
                   </button>
                )}
              </div>
            </Card>

            <div style={styles.auditInfo}>
              <Clock size={16} />
              <span>Last updated: {new Date(order.updated_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .od-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .od-details-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
        .od-billing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; padding: 24px; background: #F8FAFC; border-radius: 14px; border: 1px solid #f1f5f9; }
        .od-invoice-main { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
        @media (max-width: 768px) {
          .od-header { flex-direction: column; align-items: flex-start; gap: 12px; }
          .od-header > div { width: 100%; display: flex; gap: 8px; }
          .od-header > div button { flex: 1; justify-content: center; }
          .od-details-grid { grid-template-columns: 1fr !important; }
          .od-billing-grid { grid-template-columns: 1fr !important; gap: 16px; padding: 16px; }
          .od-invoice-main { flex-direction: column; gap: 12px; align-items: flex-start; }
          .od-table-wrap { overflow-x: auto; }
          .od-table { min-width: 500px; }
        }
        @media print {
          nav, header, .payNowBtn { display: none !important; }
          .container { padding: 0 !important; background: white !important; }
        }
      `}</style>
    </motion.div>
  );
}

const styles = {
  container: { padding: "24px 0 40px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" },
  backBtn: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", cursor: "pointer", fontWeight: "600", color: "#64748b", fontFamily: "inherit", fontSize: "13px" },
  printBtn: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: "#0F172A", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontFamily: "inherit", fontSize: "13px" },

  invoiceHead: { padding: "32px", marginBottom: "24px", border: "1px solid #e2e8f0", borderRadius: "16px", background: "#fff" },
  invoiceMain: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" },
  brandInfo: { display: "flex", alignItems: "center", gap: "16px" },
  invoiceLogo: { width: "48px", height: "48px", background: "#2563EB", color: "#fff", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "18px", boxShadow: "0 2px 8px rgba(37,99,235,0.25)" },
  invoiceTitle: { fontSize: "24px", fontWeight: "800", color: "#0F172A", margin: 0 },
  invoiceDate: { color: "#94a3b8", fontSize: "13px", marginTop: "4px" },
  statusTag: { padding: "6px 14px", borderRadius: "8px", fontWeight: "600", fontSize: "11px", textTransform: "uppercase" },

  billingGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", padding: "24px", background: "#F8FAFC", borderRadius: "14px", border: "1px solid #f1f5f9" },
  billLabel: { fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" },
  custBox: { display: "flex", alignItems: "center", gap: "12px" },
  custAvatar: { width: "40px", height: "40px", background: "#2563EB", color: "#fff", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" },
  custName: { fontWeight: "700", color: "#0F172A", fontSize: "16px" },
  custDetail: { fontSize: "12px", color: "#64748b", marginTop: "2px" },

  summaryStats: { display: "flex", flexDirection: "column", gap: "10px" },
  statItem: { display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#64748b" },

  detailsGrid: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" },
  sectionTitle: { display: "flex", alignItems: "center", gap: "8px", fontSize: "16px", fontWeight: "700", color: "#0F172A", marginBottom: "16px" },

  table: { width: "100%", borderCollapse: "collapse" },
  thead: { background: "#F8FAFC", borderBottom: "1px solid #e2e8f0" },
  th: { padding: "14px 20px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "16px 20px", fontSize: "13px", color: "#475569" },
  itemName: { fontWeight: "600", color: "#0F172A" },
  itemMeta: { fontSize: "11px", color: "#94a3b8", marginTop: "3px" },

  footerSummary: { padding: "24px", background: "#F8FAFC" },
  footRow: { display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px", color: "#64748b" },

  ledgerCard: { padding: "24px" },
  ledgerRow: { display: "flex", gap: "14px", marginBottom: "20px", position: "relative" },
  ledgerDot: { width: "10px", height: "10px", background: "#16a34a", borderRadius: "50%", marginTop: "6px" },
  ledgerMain: { flex: 1 },
  ledgerInfo: { display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "14px" },
  ledgerDate: { fontSize: "12px", color: "#94a3b8" },

  balanceBox: { padding: "24px", background: "#F8FAFC", borderRadius: "14px", textAlign: "center", border: "1px solid #f1f5f9" },
  balanceLabel: { fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" },
  balanceVal: { fontSize: "28px", fontWeight: "800", marginBottom: "16px" },
  payNowBtn: { background: "#2563EB", color: "#fff", border: "none", borderRadius: "10px", padding: "10px 20px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", margin: "0 auto", fontFamily: "inherit", fontSize: "13px", boxShadow: "0 2px 8px rgba(37,99,235,0.25)" },

  auditInfo: { display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", fontSize: "12px", marginTop: "16px", padding: "0 8px" },
  emptyWrap: { textAlign: "center", padding: "100px", color: "#64748b" }
};