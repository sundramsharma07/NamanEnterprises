import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  CreditCard, 
  History, 
  CheckCircle,
  AlertCircle,
  Receipt,
  ChevronDown,
  ChevronUp,
  Clock,
  IndianRupee,
  MessageCircle,
  ShieldCheck,
  ShieldAlert,
  Zap,
  TrendingUp,
  Wallet
} from "lucide-react";
import { Card, Skeleton } from "../components/ui";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function CustomerDueDetails() {
  const { customer_id } = useParams();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [dueHistory, setDueHistory] = useState([]);
  const [processingOrder, setProcessingOrder] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers/${customer_id}`);
      
      if (res.data.success) {
        const { customer, orders: allOrders, due_history } = res.data;
        const dueOrders = allOrders.filter(o => o.remaining_amount > 0);
        
        setCustomerInfo({
          ...customer,
          totalOrders: allOrders.length,
          dueOrders: dueOrders.length
        });
        setOrders(dueOrders);
        setDueHistory(due_history || []);
      }
    } catch (error) {
      console.error("Failed to fetch details:", error);
      toast.error("Failed to load customer details");
    } finally {
      setLoading(false);
    }
  }, [customer_id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const sendWhatsAppOrderReminder = (order) => {
    const date = new Date(order.created_at).toLocaleDateString('en-IN');
    const message = `नमस्ते ${customerInfo.name} \u{1F44B},\n\nनमन एंटरप्राइजेज (Naman Enterprises) \u{1F3D7} से आपके ऑर्डर का विवरण:\n\n\u{1F194} *ऑर्डर आईडी:* #${order.order_id}\n\u{1F4C5} *दिनांक:* ${date}\n\u{1F4B0} *कुल बिल:* ${formatCurrency(order.total_amount)}\n\u{2705} *जमा राशि:* ${formatCurrency(order.paid_amount)}\n\u{26A0}\u{FE0F} *बकाया राशि:* ${formatCurrency(order.remaining_amount)}\n\nकृपया बकाया राशि का भुगतान जल्द करें। \u{1F64F}\nधन्यवाद! \u{2728}`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${customerInfo.phone.replace(/\D/g,'')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const openPaymentModal = (order) => {
    setSelectedOrder(order);
    setPaymentAmount(order.remaining_amount.toString());
    setShowPaymentModal(true);
  };

  const receivePayment = async () => {
    if (!selectedOrder) return;
    const amount = Number(paymentAmount);
    
    if (!amount || amount <= 0) return toast.error("Please enter a valid amount");
    if (amount > selectedOrder.remaining_amount) return toast.error("Amount exceeds due balance");

    try {
      setProcessingOrder(selectedOrder.order_id);
      await api.post(`/orders/${selectedOrder.order_id}/pay`, { 
        amount,
        payment_method: "Online" // Simplified for now, can be a dropdown
      });
      toast.success("Payment recorded successfully!");
      setShowPaymentModal(false);
      setSelectedOrder(null);
      setPaymentAmount("");
      fetchDetails();
    } catch (err) {
      toast.error("Payment failed");
    } finally {
      setProcessingOrder(null);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Skeleton height="40px" width="200px" className="mb-8" />
        <Skeleton height="120px" className="mb-8" />
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
          <Skeleton height="400px" />
          <Skeleton height="400px" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      style={styles.container}
    >
      <header style={styles.header}>
        <button onClick={() => navigate('/due-customers')} style={styles.backBtn}>
          <ArrowLeft size={18} /> Back
        </button>
        <div>
          <h1 style={styles.title}>Ledger & Dues</h1>
          <p style={styles.subtitle}>Detailed financial audit for {customerInfo.name}</p>
        </div>
      </header>

      {/* Customer Profile Banner */}
      <Card className="cdd-profile-banner" style={styles.profileBanner}>
        <div style={styles.avatar}>
          {customerInfo.name?.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={styles.custName}>{customerInfo.name}</h2>
          <div style={styles.custMeta}>
            <span style={styles.metaItem}><Phone size={14} /> {customerInfo.phone}</span>
            <span style={styles.metaItem}><Receipt size={14} /> {customerInfo.totalOrders || 0} Orders</span>
          </div>
        </div>

        <div style={styles.reliabilityPanel}>
          <div style={styles.scoreHeader}>
            <div style={styles.scoreTitle}>Reliability Rating</div>
            <div style={{ 
              ...styles.scoreBadge, 
              color: customerInfo.is_reliable ? "#16a34a" : "#ef4444",
              background: customerInfo.is_reliable ? "rgba(22, 163, 74, 0.08)" : "rgba(239, 68, 68, 0.08)"
            }}>
              {customerInfo.is_reliable ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
              {customerInfo.is_reliable ? "Reliable for Credit" : "Caution: High Debt"}
            </div>
          </div>
          <div style={styles.scoreMeterContainer}>
            <div style={{ ...styles.scoreMeterFill, width: `${customerInfo.trust_score}%`, background: (customerInfo.trust_score || 0) > 60 ? "#16a34a" : "#ef4444" }} />
          </div>
          <div style={styles.scoreFooter}>
            Trust Score: {customerInfo.trust_score || 0}/100
          </div>
        </div>
      </Card>

      {/* Stats Row */}
      <div className="cdd-stats-row" style={styles.statsRow}>
        <div style={styles.miniStatsCard}>
          <div style={styles.miniIcon}><Zap size={16} color="#F59E0B" /></div>
          <div>
            <div style={styles.miniLabel}>Consistency</div>
            <div style={styles.miniValue}>{(customerInfo.trust_score || 0) > 70 ? "High" : "Average"}</div>
          </div>
        </div>
        <div style={styles.miniStatsCard}>
          <div style={styles.miniIcon}><Wallet size={16} color="#10B981" /></div>
          <div>
            <div style={styles.miniLabel}>Main Channel</div>
            <div style={styles.miniValue}>Cash / Online</div>
          </div>
        </div>
        <div style={styles.miniStatsCard}>
          <div style={styles.miniIcon}><TrendingUp size={16} color="#3B82F6" /></div>
          <div style={styles.dueSummary}>
            <div style={styles.sumLabel}>Total Outstanding</div>
            <div style={styles.sumVal}>{formatCurrency(customerInfo.total_due)}</div>
          </div>
        </div>
      </div>

      <div className="cdd-main-grid" style={styles.mainGrid}>
        {/* Pending Orders Column */}
        <div style={styles.col}>
          <div style={styles.secHeader}>
            <div style={{ ...styles.secIcon, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <AlertCircle size={18} />
            </div>
            <div>
              <h3 style={styles.secTitle}>Active Dues</h3>
              <p style={styles.secSub}>Orders with pending balances ({orders.length})</p>
            </div>
          </div>
          
          <div style={styles.orderList}>
            {orders.length === 0 ? (
              <div style={styles.emptyState}>
                <CheckCircle size={48} color="var(--success)" />
                <h4>No Outstanding Dues</h4>
                <p>This customer has paid all their bills.</p>
              </div>
            ) : (
              orders.map(order => (
                <Card key={order.order_id} style={styles.orderCard}>
                  <div style={styles.orderHead}>
                    <div>
                      <div style={styles.orderId}>Order #{order.order_id}</div>
                      <div style={styles.orderDate}>
                        <Clock size={12} /> {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={styles.orderBalance}>
                      {formatCurrency(order.remaining_amount)}
                    </div>
                  </div>
                  
                  <div style={styles.orderDetails}>
                    <div style={styles.detailRow}>
                      <span>Original Amount</span>
                      <span style={{ fontWeight: 700 }}>{formatCurrency(order.total_amount)}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span>Total Deposited</span>
                      <span style={{ color: "#10b981", fontWeight: 700 }}>{formatCurrency(order.paid_amount)}</span>
                    </div>
                  </div>

                  <div className="cdd-order-actions" style={styles.orderActions}>
                    <button 
                      style={styles.expandBtn}
                      onClick={() => setExpandedOrderId(expandedOrderId === order.order_id ? null : order.order_id)}
                    >
                      {expandedOrderId === order.order_id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      {expandedOrderId === order.order_id ? "Hide Details" : "View Items"}
                    </button>
                    <button style={styles.payBtn} onClick={() => openPaymentModal(order)}>
                      <CreditCard size={16} /> Add Payment
                    </button>
                  </div>

                  <AnimatePresence>
                    {expandedOrderId === order.order_id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={styles.itemsBlock}
                      >
                        <table style={styles.itemsTable}>
                          <tbody>
                            {order.items?.map((item, idx) => (
                              <tr key={idx}>
                                <td style={{ padding: '4px 0' }}>{item.product_name} <small style={{ color: '#94a3b8' }}>({item.variant})</small></td>
                                <td style={{ textAlign: 'right', fontWeight: '600' }}>{item.quantity} × {formatCurrency(item.price)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Payment History Column */}
        <div style={styles.col}>
          <div style={styles.secHeader}>
            <div style={{ ...styles.secIcon, background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB' }}>
              <History size={18} />
            </div>
            <div>
              <h3 style={styles.secTitle}>Financial Ledger</h3>
              <p style={styles.secSub}>Timeline of payments & credit updates</p>
            </div>
          </div>

          <div className="cdd-history-scroll">
            {dueHistory.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--text-light)", padding: "40px" }}>No history found.</p>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.ledgerTable}>
                  <thead>
                    <tr>
                      <th style={styles.lTh}>Date</th>
                      <th style={styles.lTh}>Type</th>
                      <th style={styles.lTh}>Amount</th>
                      <th style={{ ...styles.lTh, textAlign: 'right' }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dueHistory.map((entry) => (
                      <tr key={entry.id} style={styles.lTr}>
                        <td style={styles.lTd}>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(entry.created_at).toLocaleDateString()}</div>
                        </td>
                        <td style={styles.lTd}>
                          <span style={{ 
                            ...styles.typeBadge, 
                            background: entry.type === 'GIVEN_DUE' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(22, 163, 74, 0.08)',
                            color: entry.type === 'GIVEN_DUE' ? '#ef4444' : '#16a34a'
                          }}>
                            {entry.type === 'GIVEN_DUE' ? 'Due' : 'Pay'}
                          </span>
                        </td>
                        <td style={styles.lTd}>
                          <div style={{ fontWeight: '700', color: entry.type === 'GIVEN_DUE' ? '#ef4444' : '#16a34a' }}>
                            {entry.type === 'GIVEN_DUE' ? '+' : '-'} {formatCurrency(entry.amount)}
                          </div>
                        </td>
                        <td style={{ ...styles.lTd, textAlign: 'right' }}>
                          <div style={{ fontWeight: '800', color: '#0F172A' }}>{formatCurrency(entry.balance_after)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div style={styles.modalBackdrop} onClick={() => setShowPaymentModal(false)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="cdd-modal"
              style={styles.modal} 
              onClick={e => e.stopPropagation()}
            >
              <h3 style={styles.modalTitle}>Receive Payment</h3>
              <p style={styles.modalSub}>Order Ref: {selectedOrder?.order_id}</p>
              
              <div style={styles.modalField}>
                <label style={styles.fieldLabel}>Payment Amount (₹)</label>
                <div style={styles.inputWrapper}>
                  <IndianRupee size={20} style={styles.inputIcon} />
                  <input 
                    type="number" 
                    value={paymentAmount} 
                    onChange={e => setPaymentAmount(e.target.value)}
                    style={styles.modalInput}
                    autoFocus
                  />
                </div>
                <p style={styles.hint}>Outstanding: {formatCurrency(selectedOrder?.remaining_amount)}</p>
              </div>

              <div style={styles.modalActions}>
                <button style={styles.cancelBtn} onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button 
                  style={styles.confirmBtn} 
                  onClick={receivePayment}
                  disabled={!!processingOrder}
                >
                  {processingOrder ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .mb-8 { margin-bottom: 32px; }
        .cdd-main-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px; }
        .cdd-profile-banner { display: flex; align-items: center; gap: 20px; padding: 24px; margin-bottom: 32px; border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; }
        .cdd-stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 32px; }
        .cdd-modal { background: #fff; width: 420px; padding: 32px; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.2); }
        @media (max-width: 768px) {
          .cdd-profile-banner { flex-direction: column; text-align: center; align-items: center; }
          .cdd-profile-banner .reliability-panel { padding-left: 0 !important; border-left: none !important; border-top: 1px solid #f1f5f9 !important; padding-top: 16px !important; width: 100% !important; min-width: unset !important; }
          .cdd-stats-row { grid-template-columns: 1fr !important; gap: 10px; }
          .cdd-main-grid { grid-template-columns: 1fr !important; }
          .cdd-modal { width: 92vw !important; padding: 24px !important; border-radius: 16px !important; }
          .cdd-order-actions { flex-wrap: wrap; }
          .cdd-order-actions button { flex: 1; min-width: 100px; }
          .cdd-history-scroll { max-height: 500px !important; }
        }
        .cdd-history-scroll {
          max-height: 800px;
          overflow-y: auto;
          padding-right: 8px;
        }
        .cdd-history-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .cdd-history-scroll::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </motion.div>
  );
}

const styles = {
  container: { padding: "24px 0 40px" },
  header: { display: "flex", alignItems: "center", gap: "20px", marginBottom: "32px" },
  backBtn: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", cursor: "pointer", fontWeight: "600", color: "#64748b", fontFamily: "inherit", fontSize: "13px" },
  title: { fontSize: "24px", fontWeight: "800", color: "#0F172A", margin: 0 },
  subtitle: { fontSize: "13px", color: "#64748b", margin: 0 },

  profileBanner: { display: "flex", alignItems: "center", gap: "20px", padding: "24px", marginBottom: "32px", border: "1px solid #e2e8f0", borderRadius: "16px", background: "#fff" },
  avatar: { width: "56px", height: "56px", background: "#2563EB", color: "#fff", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: "800", boxShadow: "0 4px 12px rgba(37,99,235,0.15)" },
  custName: { fontSize: "20px", fontWeight: "700", color: "#0F172A", margin: "0 0 6px" },
  custMeta: { display: "flex", gap: "16px", marginTop: "8px" },
  metaItem: { display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#64748b" },
  
  reliabilityPanel: { paddingLeft: "24px", borderLeft: "1px solid #f1f5f9", minWidth: "220px" },
  scoreHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  scoreTitle: { fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" },
  scoreBadge: { display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" },
  scoreMeterContainer: { height: "6px", background: "#f1f5f9", borderRadius: "10px", overflow: "hidden", marginBottom: "8px" },
  scoreMeterFill: { height: "100%", borderRadius: "10px", transition: "width 1s ease-in-out" },
  scoreFooter: { fontSize: "11px", fontWeight: "600", color: "#64748b" },

  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "32px" },
  miniStatsCard: { display: "flex", alignItems: "center", gap: "16px", padding: "16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" },
  miniIcon: { width: "40px", height: "40px", borderRadius: "12px", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" },
  miniLabel: { fontSize: "11px", color: "#94a3b8", fontWeight: "500", marginBottom: "2px" },
  miniValue: { fontSize: "16px", fontWeight: "700", color: "#0F172A" },

  dueSummary: { textAlign: "right", padding: "0 20px", borderLeft: "1px solid #f1f5f9" },
  sumLabel: { fontSize: "11px", color: "#ef4444", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" },
  sumVal: { fontSize: "28px", fontWeight: "800", color: "#ef4444" },

  mainGrid: { display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "24px" },
  secHeader: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" },
  secIcon: { width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" },
  secTitle: { fontSize: "16px", fontWeight: "700", color: "#0F172A", margin: 0 },
  secSub: { fontSize: "12px", color: "#64748b", margin: "2px 0 0" },

  orderList: { display: "flex", flexDirection: "column", gap: "16px" },
  orderCard: { padding: "20px", border: "1px solid #e2e8f0", borderRadius: "14px", background: "#fff" },
  orderHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" },
  orderId: { fontSize: "14px", fontWeight: "600", color: "#0F172A" },
  orderDate: { fontSize: "12px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" },
  orderBalance: { fontSize: "18px", fontWeight: "800", color: "#ef4444" },
  orderDetails: { background: "#F8FAFC", padding: "14px", borderRadius: "10px", marginBottom: "16px", border: "1px solid #f1f5f9" },
  detailRow: { display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#64748b", marginBottom: "6px" },
  orderActions: { display: "flex", gap: "10px" },
  expandBtn: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "500", color: "#64748b", fontFamily: "inherit" },
  payBtn: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", background: "#F97316", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600", fontFamily: "inherit", boxShadow: "0 2px 6px rgba(249,115,22,0.2)" },
  waOrderBtn: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600", fontFamily: "inherit", boxShadow: "0 2px 6px rgba(22,163,74,0.2)" },
  itemsBlock: { marginTop: "16px", padding: "14px", background: "#F8FAFC", border: "1px solid #f1f5f9", borderRadius: "10px" },
  itemsTable: { width: "100%", fontSize: "12px", color: "#64748b" },

  historyTimeline: { paddingLeft: "12px", borderLeft: "2px solid #f1f5f9", position: "relative" },
  timelineItem: { position: "relative", paddingBottom: "24px", paddingLeft: "20px" },
  timelineDot: { position: "absolute", left: "-7px", top: "4px", width: "12px", height: "12px", borderRadius: "50%", border: "2px solid #fff" },
  timelineContent: { background: "#fff", padding: "16px", border: "1px solid #e2e8f0", borderRadius: "12px" },
  timeLineHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
  entryDate: { fontSize: "11px", color: "#94a3b8", fontWeight: "500" },
  typeBadge: { padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "600" },
  entryAmount: { fontSize: "16px", fontWeight: "700", color: "#0F172A", marginBottom: "4px" },
  orderContext: { display: "flex", gap: "10px", fontSize: "11px", fontWeight: "600", color: "#94a3b8", marginBottom: "6px", background: "#f8fafc", padding: "4px 8px", borderRadius: "6px", width: "fit-content" },
  entryReason: { fontSize: "13px", color: "#64748b", marginBottom: "6px" },
  entryBalance: { fontSize: "11px", color: "#94a3b8", fontWeight: "500" },

  ledgerTable: { width: "100%", borderCollapse: "collapse" },
  lTh: { textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', padding: '12px 8px', borderBottom: '1px solid #f1f5f9' },
  lTr: { borderBottom: '1px solid #f8fafc', transition: 'background 0.2s' },
  lTd: { padding: '12px 8px', fontSize: '13px' },
  tableWrap: { overflowX: 'auto' },

  emptyState: { textAlign: "center", padding: "48px 32px", color: "#94a3b8" },
  modalBackdrop: { position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" },
  modal: { background: "#fff", width: "420px", padding: "32px", borderRadius: "20px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.2)" },
  modalTitle: { fontSize: "20px", fontWeight: "700", margin: "0 0 6px", color: "#0F172A" },
  modalSub: { color: "#64748b", margin: "0 0 24px", fontSize: "13px" },
  modalField: { marginBottom: "24px" },
  fieldLabel: { fontSize: "13px", fontWeight: "600", color: "#0F172A", marginBottom: "10px", display: "block" },
  inputWrapper: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: "14px", color: "#94a3b8" },
  modalInput: { width: "100%", padding: "14px 14px 14px 44px", background: "#F8FAFC", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "20px", fontWeight: "700", outline: "none", color: "#0F172A", fontFamily: "inherit" },
  hint: { fontSize: "12px", color: "#ef4444", marginTop: "10px", fontWeight: "500" },
  modalActions: { display: "flex", gap: "10px" },
  cancelBtn: { flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontWeight: "600", fontFamily: "inherit", fontSize: "13px", color: "#475569" },
  confirmBtn: { flex: 1.5, padding: "12px", borderRadius: "10px", border: "none", background: "#2563EB", color: "#fff", cursor: "pointer", fontWeight: "600", fontFamily: "inherit", fontSize: "13px", boxShadow: "0 2px 8px rgba(37,99,235,0.25)" }
};