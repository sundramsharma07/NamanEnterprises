import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  History, 
  FileText, 
  MessageSquare, 
  Plus, 
  CreditCard, 
  TrendingUp,
  Clock,
  Calendar,
  IndianRupee,
  ChevronRight,
  BadgeAlert,
  ShoppingCart
} from "lucide-react";
import { Card, Skeleton } from "../components/ui";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("purchases");
  const [data, setData] = useState({ customer: null, orders: [], due_history: [], notes: [] });
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers/${id}`);
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      toast.error("Profile unavailable");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    try {
      setSubmittingNote(true);
      await api.post(`/customers/${id}/notes`, { content: noteContent });
      setNoteContent("");
      toast.success("Note saved");
      fetchProfile();
    } catch (err) {
      toast.error("Failed to save note");
    } finally {
      setSubmittingNote(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Skeleton height="40px" width="200px" className="mb-8" />
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '32px' }}>
          <Skeleton height="600px" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Skeleton height="150px" />
            <Skeleton height="400px" />
          </div>
        </div>
      </div>
    );
  }

  const { customer, orders, due_history, notes } = data;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.6 }}
      style={styles.container}
    >
      <header style={styles.header}>
        <motion.button 
          whileHover={{ x: -5 }}
          style={styles.backBtn} 
          onClick={() => navigate("/customers")}
        >
          <ArrowLeft size={18} /> Directory
        </motion.button>
        <div style={styles.titleWrap}>
           <h1 style={styles.title}>Customer Ledger</h1>
           <p style={styles.subtitle}>Audit trail and interaction history for {customer.name}</p>
        </div>
      </header>

      <div className="cp-grid" style={styles.grid}>
        {/* Profile Sidebar */}
        <div style={styles.sidebar}>
          <div className="card" style={styles.profileCard}>
            <div style={styles.avatarWrap}>
              <div style={styles.avatar}>{customer.name?.charAt(0).toUpperCase()}</div>
              {customer.total_due > 0 && (
                <div style={styles.dueBadge}>
                  <BadgeAlert size={12} /> Balance Due
                </div>
              )}
            </div>
            
            <h2 style={styles.custName}>{customer.name}</h2>
            <div style={styles.contactList}>
              <div style={styles.contactItem}><Phone size={14} color="#2563EB" /> {customer.phone}</div>
              <div style={styles.contactItem}><MapPin size={14} color="#2563EB" /> {customer.address || "No address provided"}</div>
              <div style={styles.contactItem}><Calendar size={14} color="#94a3b8" /> Joined {new Date(customer.created_at).toLocaleDateString()}</div>
            </div>

            <div style={styles.balanceBox}>
              <div style={styles.balLabel}>Current Outstanding</div>
              <div style={{ ...styles.balVal, color: customer.total_due > 0 ? "var(--danger)" : "var(--success)" }}>
                {formatCurrency(customer.total_due)}
              </div>
            </div>
          </div>

          <div className="card" style={styles.notesCard}>
            <h3 style={styles.secTitle}><MessageSquare size={18} color="#475569" /> Internal Notes</h3>
            <form onSubmit={handleNoteSubmit} style={styles.noteForm}>
              <textarea 
                placeholder="Log a call or visit note..." 
                value={noteContent} 
                onChange={e => setNoteContent(e.target.value)} 
                style={styles.textarea}
              />
              <button type="submit" disabled={submittingNote} style={styles.saveBtn}>
                {submittingNote ? "Saving..." : "Add to Log"}
              </button>
            </form>
            <div style={styles.notesList}>
              <AnimatePresence>
                {notes.map((note, i) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    key={i} 
                    style={styles.noteItem}
                  >
                    <p style={styles.noteText}>{note.content}</p>
                    <div style={styles.noteFooter}>
                      <Clock size={10} /> {new Date(note.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Main Tabs Area */}
        <div style={styles.main}>
          <div style={styles.tabContainer}>
            <div style={styles.tabs}>
              <button 
                style={activeTab === "purchases" ? styles.activeTab : styles.tab} 
                onClick={() => setActiveTab("purchases")}
              >
                <ShoppingCart size={16} /> Purchase History
              </button>
              <button 
                style={activeTab === "ledger" ? styles.activeTab : styles.tab} 
                onClick={() => setActiveTab("ledger")}
              >
                <TrendingUp size={16} /> Financial Ledger
              </button>
            </div>
          </div>

          <div style={styles.tabContent}>
            {activeTab === "purchases" && (
              <div style={styles.list}>
                {orders.length === 0 ? (
                  <div style={styles.emptyState}>
                    <ShoppingCart size={48} style={{ opacity: 0.1, marginBottom: "16px" }} />
                    <p>No transactions found for this customer.</p>
                  </div>
                ) : (
                  orders.map((o, idx) => (
                    <motion.div 
                      key={o.order_id} 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div className="card" style={styles.orderCard}>
                        <div style={styles.orderHead}>
                          <div>
                            <div style={styles.orderId}>Invoice #{o.order_id}</div>
                            <div style={styles.orderDate}>{new Date(o.created_at).toLocaleDateString()}</div>
                          </div>
                          <span style={{ 
                            ...styles.statusTag, 
                            background: o.remaining_amount === 0 ? "rgba(22, 163, 74, 0.08)" : "rgba(245, 158, 11, 0.08)", 
                            color: o.remaining_amount === 0 ? "#16a34a" : "#f59e0b" 
                          }}>
                            {o.remaining_amount === 0 ? "Settled" : "Partial"}
                          </span>
                        </div>
                        
                        <div className="cp-order-stats" style={styles.orderStats}>
                          <div style={styles.orderStat}>
                            <span style={styles.orderStatLabel}>Grand Total</span>
                            <span style={styles.orderStatVal}>{formatCurrency(o.total_amount)}</span>
                          </div>
                          <div style={styles.orderStat}>
                            <span style={styles.orderStatLabel}>Received</span>
                            <span style={{ ...styles.orderStatVal, color: "#16a34a" }}>{formatCurrency(o.paid_amount)}</span>
                          </div>
                          <div style={styles.orderStat}>
                            <span style={styles.orderStatLabel}>Balance</span>
                            <span style={{ ...styles.orderStatVal, color: o.remaining_amount > 0 ? "#ef4444" : "#16a34a" }}>{formatCurrency(o.remaining_amount)}</span>
                          </div>
                        </div>

                        <button onClick={() => navigate(`/orders/${o.order_id}`)} style={styles.viewOrderBtn}>
                          View Full Audit <ChevronRight size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {activeTab === "ledger" && (
              <div style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#fff' }}>
                <div className="cp-ledger-wrap">
                <table className="cp-ledger-table" style={styles.table}>
                  <thead style={styles.thead}>
                    <tr>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Transaction Details</th>
                      <th style={styles.th}>Adjustment</th>
                      <th style={styles.th}>Resulting Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {due_history.map((h, i) => (
                      <tr key={i} style={styles.tr}>
                        <td style={styles.td}>{new Date(h.created_at).toLocaleDateString()}</td>
                        <td style={styles.td}>
                          <div style={styles.reasonCell}>
                            <div style={{ ...styles.typeDot, background: h.type === 'GIVEN_DUE' ? '#ef4444' : '#16a34a' }} />
                            <span style={{ fontWeight: "600", color: "#0F172A" }}>{h.reason}</span>
                          </div>
                        </td>
                        <td style={{ ...styles.td, fontWeight: '700', color: h.type === 'GIVEN_DUE' ? '#ef4444' : '#16a34a' }}>
                          {h.type === 'GIVEN_DUE' ? '+' : '-'} {formatCurrency(h.amount)}
                        </td>
                        <td style={{ ...styles.td, fontWeight: '700', color: "#0F172A" }}>{formatCurrency(h.balance_after)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .cp-grid { display: grid; grid-template-columns: 360px 1fr; gap: 24px; align-items: start; }
        .cp-order-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 20px; background: #F8FAFC; border-radius: 12px; margin-bottom: 20px; border: 1px solid #f1f5f9; }
        .cp-ledger-wrap { overflow-x: auto; }
        .cp-ledger-table { width: 100%; border-collapse: collapse; min-width: 500px; }
        @media (max-width: 768px) {
          .cp-grid { grid-template-columns: 1fr !important; }
          .cp-order-stats { grid-template-columns: 1fr 1fr !important; gap: 10px; padding: 14px; }
          .cp-ledger-wrap { overflow-x: auto; }
        }
      `}</style>
    </motion.div>
  );
}

const styles = {
  container: { padding: "24px 0 40px" },
  header: { display: "flex", alignItems: "flex-end", gap: "20px", marginBottom: "32px" },
  backBtn: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", cursor: "pointer", fontWeight: "600", color: "#64748b", transition: "all 0.2s", fontFamily: "inherit", fontSize: "13px" },
  titleWrap: { flex: 1 },
  title: { fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: 0, letterSpacing: "-0.5px" },
  subtitle: { color: "#64748b", fontSize: "14px", fontWeight: "400", marginTop: "4px" },

  grid: { display: "grid", gridTemplateColumns: "360px 1fr", gap: "24px", alignItems: "start" },
  sidebar: { display: "flex", flexDirection: "column", gap: "20px" },
  profileCard: { padding: "32px 24px", textAlign: "center", border: "1px solid #e2e8f0", borderRadius: "16px", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  avatarWrap: { position: "relative", width: "80px", height: "80px", margin: "0 auto 20px" },
  avatar: { width: "100%", height: "100%", background: "#2563EB", color: "#fff", borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: "800", boxShadow: "0 8px 20px rgba(37, 99, 235, 0.15)" },
  dueBadge: { position: "absolute", bottom: "-8px", left: "50%", transform: "translateX(-50%)", background: "#ef4444", color: "#fff", padding: "4px 10px", borderRadius: "6px", fontSize: "9px", fontWeight: "700", textTransform: "uppercase", whiteSpace: "nowrap", border: "2px solid #FFF", display: "flex", alignItems: "center", gap: "3px" },
  custName: { fontSize: "20px", fontWeight: "700", color: "#0F172A", marginBottom: "16px" },
  contactList: { display: "flex", flexDirection: "column", gap: "10px", alignItems: "center", marginBottom: "28px" },
  contactItem: { display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "13px", fontWeight: "400" },
  balanceBox: { padding: "20px", background: "#F8FAFC", borderRadius: "14px", border: "1px solid #f1f5f9" },
  balLabel: { fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", marginBottom: "6px", letterSpacing: "0.5px" },
  balVal: { fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px" },

  notesCard: { padding: "24px", border: "1px solid #e2e8f0", borderRadius: "16px", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  secTitle: { display: "flex", alignItems: "center", gap: "10px", fontSize: "16px", fontWeight: "700", color: "#0F172A", marginBottom: "20px" },
  noteForm: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" },
  textarea: { width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#F8FAFC", outline: "none", fontSize: "13px", resize: "none", minHeight: "80px", color: "#0F172A", fontWeight: "400", transition: "border 0.2s", fontFamily: "inherit" },
  saveBtn: { padding: "10px", background: "#2563EB", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", transition: "transform 0.2s", fontFamily: "inherit", fontSize: "13px" },
  notesList: { display: "flex", flexDirection: "column", gap: "12px", maxHeight: "300px", overflowY: "auto", paddingRight: "4px" },
  noteItem: { padding: "14px", background: "#F8FAFC", borderRadius: "10px", border: "1px solid #f1f5f9" },
  noteText: { fontSize: "13px", color: "#475569", margin: "0 0 8px", lineHeight: "1.5", fontWeight: "400" },
  noteFooter: { fontSize: "10px", color: "#94a3b8", fontWeight: "500", display: "flex", alignItems: "center", gap: "4px" },

  main: { flex: 1 },
  tabContainer: { background: "#F8FAFC", padding: "4px", borderRadius: "12px", display: "inline-flex", marginBottom: "24px", border: "1px solid #f1f5f9" },
  tabs: { display: "flex", gap: "2px" },
  tab: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", border: "none", background: "none", borderRadius: "8px", color: "#64748b", fontWeight: "500", cursor: "pointer", fontSize: "13px", transition: "all 0.2s", fontFamily: "inherit" },
  activeTab: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: "#fff", color: "#2563EB", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", fontWeight: "600", fontSize: "13px", border: "none", fontFamily: "inherit" },

  list: { display: "flex", flexDirection: "column", gap: "16px" },
  orderCard: { padding: "24px", border: "1px solid #e2e8f0", borderRadius: "14px", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  orderHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
  orderId: { fontSize: "16px", fontWeight: "700", color: "#0F172A" },
  orderDate: { fontSize: "12px", color: "#94a3b8", fontWeight: "400", marginTop: "2px" },
  statusTag: { padding: "4px 10px", borderRadius: "6px", fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.3px" },
  orderStats: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", padding: "20px", background: "#F8FAFC", borderRadius: "12px", marginBottom: "20px", border: "1px solid #f1f5f9" },
  orderStat: { display: "flex", flexDirection: "column", gap: "4px" },
  orderStatLabel: { fontSize: "10px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" },
  orderStatVal: { fontSize: "18px", fontWeight: "700", color: "#0F172A" },
  viewOrderBtn: { background: "none", border: "none", color: "#2563EB", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontFamily: "inherit" },

  table: { width: "100%", borderCollapse: "collapse" },
  thead: { background: "#F8FAFC", borderBottom: "1px solid #e2e8f0" },
  th: { textAlign: "left", padding: "14px 20px", fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" },
  tr: { borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" },
  td: { padding: "16px 20px", fontSize: "13px", color: "#475569" },
  reasonCell: { display: "flex", alignItems: "center", gap: "10px" },
  typeDot: { width: "8px", height: "8px", borderRadius: "50%" },
  emptyState: { padding: "80px", textAlign: "center", color: "#94a3b8", background: "#fff", borderRadius: "16px", fontWeight: "400", border: "1px solid #e2e8f0" }
};
