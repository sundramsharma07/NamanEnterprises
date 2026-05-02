import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { 
  Search, 
  MessageCircle, 
  Calendar, 
  AlertTriangle, 
  ChevronRight, 
  User, 
  Phone,
  ArrowUpDown,
  Printer
} from "lucide-react";
import { Skeleton } from "../components/ui";
import { motion } from "framer-motion";

function DueCustomers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("due_desc");

  const fetchDueCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders/due/customers");
      setCustomers(res.data.customers || []);
    } catch (error) {
      console.error("Failed to fetch due customers:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDueCustomers();
  }, [fetchDueCustomers]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getDueAge = (dateString) => {
    if (!dateString) return 0;
    const oldest = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - oldest);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const sendWhatsAppReminder = (customer) => {
    const age = getDueAge(customer.oldest_due_date);
    const latestDate = customer.latest_order_date ? new Date(customer.latest_order_date).toLocaleDateString('en-IN') : 'N/A';
    
    // Using standard emoji characters with clear labels
    const message = `नमस्ते ${customer.name},\n\nनमन एंटरप्राइजेज (Naman Enterprises) से आपका बकाया विवरण:\n\n` +
      `*ऑर्डर विवरण (नवीनतम):*\n` +
      `ऑर्डर आईडी: #${customer.latest_order_id || 'N/A'}\n` +
      `दिनांक: ${latestDate}\n` +
      `कुल राशि: ${formatCurrency(customer.latest_order_total)}\n` +
      `जमा राशि: ${formatCurrency(customer.latest_order_paid)}\n` +
      `इस ऑर्डर का बकाया: ${formatCurrency(customer.latest_order_remaining)}\n\n` +
      `--------------------------\n` +
      `*कुल बकाया (सभी बिल):* ${formatCurrency(customer.total_due)}\n` +
      `पुराना बकाया: ${age} दिनों से\n\n` +
      `कृपया जल्द से जल्द भुगतान कर अपना हिसाब साफ़ करें। धन्यवाद!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${customer.phone.replace(/\D/g,'')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const filteredAndSorted = customers
    .filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone?.includes(searchTerm))
    .sort((a, b) => {
      if (sortBy === 'due_desc') return b.total_due - a.total_due;
      if (sortBy === 'due_asc') return a.total_due - b.total_due;
      if (sortBy === 'age_desc') return getDueAge(b.oldest_due_date) - getDueAge(a.oldest_due_date);
      return 0;
    });

  const totalDue = customers.reduce((sum, c) => sum + (c.total_due || 0), 0);

  if (loading) {
    return (
      <div style={styles.container}>
        <Skeleton height="50px" width="300px" style={{ marginBottom: "24px" }} />
        <div style={styles.summaryGrid}>
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} height="100px" />)}
        </div>
        <Skeleton height="400px" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
      style={styles.container}
    >
      <header style={styles.header}>
        <div style={styles.titleArea}>
          <h1 style={styles.title}>Due Section</h1>
          <p style={styles.subtitle}>Track and settle outstanding balances</p>
        </div>
        <button onClick={() => window.print()} style={styles.printBtn}>
          <Printer size={16} /> Print Report
        </button>
      </header>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.sumCard}>
          <div style={{ ...styles.sumIcon, background: "rgba(239, 68, 68, 0.08)", color: "#ef4444" }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={styles.sumLabel}>Total Outstanding</div>
            <div style={styles.sumValue}>{formatCurrency(totalDue)}</div>
          </div>
        </div>
        <div style={styles.sumCard}>
          <div style={{ ...styles.sumIcon, background: "rgba(37, 99, 235, 0.08)", color: "#2563EB" }}>
            <User size={20} />
          </div>
          <div>
            <div style={styles.sumLabel}>Due Accounts</div>
            <div style={styles.sumValue}>{customers.length}</div>
          </div>
        </div>
        <div style={styles.sumCard}>
          <div style={{ ...styles.sumIcon, background: "rgba(245, 158, 11, 0.08)", color: "#f59e0b" }}>
            <Calendar size={20} />
          </div>
          <div>
            <div style={styles.sumLabel}>Avg. Age</div>
            <div style={styles.sumValue}>
              {Math.floor(customers.reduce((sum, c) => sum + getDueAge(c.oldest_due_date), 0) / (customers.length || 1))} Days
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filterRow}>
        <div style={styles.searchBox}>
          <Search size={16} style={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search customers..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={styles.sortBox}>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={styles.select}>
            <option value="due_desc">Highest Due</option>
            <option value="due_asc">Lowest Due</option>
            <option value="age_desc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        .due-table-wrap { overflow-x: auto; }
        .due-table { width: 100%; border-collapse: collapse; min-width: 700px; }
        .due-card-list { display: none; }
        @media (max-width: 768px) {
          .due-table-wrap { display: none; }
          .due-card-list { display: flex; flex-direction: column; gap: 12px; padding: 12px; }
          .due-card {
            background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px;
          }
          .due-card-top { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
          .due-card-amounts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
          .due-card-amount-box { background: #F8FAFC; border-radius: 10px; padding: 10px 12px; }
          .due-card-amount-label { font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; margin-bottom: 2px; }
          .due-card-amount-val { font-weight: 700; font-size: 14px; color: #0F172A; }
          .due-card-btns { display: flex; gap: 8px; }
          .due-card-btns button { flex: 1; justify-content: center; }
        }
        @media print {
          aside, nav, header > button, .filter-row, .actions { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      {/* Table */}
      <div style={styles.tableContainer}>
        <div className="due-table-wrap">
          <table className="due-table">
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Total Goods</th>
                <th style={styles.th}>Deposited</th>
                <th style={styles.th}>Outstanding</th>
                <th style={styles.th}>Age</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((c, i) => {
                const age = getDueAge(c.oldest_due_date);
                const severity = age > 30 ? 'critical' : age > 14 ? 'urgent' : 'stable';
                return (
                  <motion.tr key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.custCell}>
                        <div style={styles.avatar}>{c.name.charAt(0)}</div>
                        <div>
                          <div style={styles.custName}>{c.name}</div>
                          <div style={styles.custPhone}><Phone size={11} /> {c.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}><span style={{ fontWeight: 600, color: "#475569" }}>{formatCurrency(c.total_purchase)}</span></td>
                    <td style={styles.td}><span style={{ fontWeight: 600, color: "#16a34a" }}>{formatCurrency(c.total_deposited)}</span></td>
                    <td style={{ ...styles.td, fontWeight: 700, fontSize: "15px", color: "#ef4444" }}>{formatCurrency(c.total_due)}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.ageBadge, background: severity === 'critical' ? 'rgba(239,68,68,0.08)' : severity === 'urgent' ? 'rgba(245,158,11,0.08)' : '#F8FAFC', color: severity === 'critical' ? '#ef4444' : severity === 'urgent' ? '#f59e0b' : '#94a3b8', border: severity === 'stable' ? '1px solid #e2e8f0' : 'none' }}>
                        {age} Days
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: "right" }}>
                      <div style={styles.actions}>
                        <button onClick={() => sendWhatsAppReminder(c)} style={styles.waBtn}><MessageCircle size={14} /> Remind</button>
                        <button onClick={() => navigate(`/customer-due/${c.id}`)} style={styles.settleBtn}>Settle <ChevronRight size={12} /></button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {filteredAndSorted.length === 0 && (
            <div style={styles.emptyState}>
              <AlertTriangle size={40} style={{ opacity: 0.12, marginBottom: "12px" }} />
              <p style={{ fontWeight: "500", color: "#94a3b8", fontSize: "14px" }}>All accounts are in good standing</p>
            </div>
          )}
        </div>

        {/* Mobile Card List */}
        <div className="due-card-list">
          {filteredAndSorted.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontSize: "14px" }}>All accounts are in good standing</div>
          )}
          {filteredAndSorted.map((c, i) => {
            const age = getDueAge(c.oldest_due_date);
            const severity = age > 30 ? 'critical' : age > 14 ? 'urgent' : 'stable';
            return (
              <motion.div key={c.id} className="due-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="due-card-top">
                  <div style={styles.avatar}>{c.name.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.custName}>{c.name}</div>
                    <div style={styles.custPhone}><Phone size={11} /> {c.phone}</div>
                  </div>
                  <span style={{ ...styles.ageBadge, background: severity === 'critical' ? 'rgba(239,68,68,0.08)' : severity === 'urgent' ? 'rgba(245,158,11,0.08)' : '#F8FAFC', color: severity === 'critical' ? '#ef4444' : severity === 'urgent' ? '#f59e0b' : '#94a3b8', border: severity === 'stable' ? '1px solid #e2e8f0' : 'none' }}>
                    {age}d
                  </span>
                </div>
                <div className="due-card-amounts">
                  <div className="due-card-amount-box">
                    <div className="due-card-amount-label">Deposited</div>
                    <div className="due-card-amount-val" style={{ color: "#16a34a" }}>{formatCurrency(c.total_deposited)}</div>
                  </div>
                  <div className="due-card-amount-box" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)" }}>
                    <div className="due-card-amount-label">Outstanding</div>
                    <div className="due-card-amount-val" style={{ color: "#ef4444" }}>{formatCurrency(c.total_due)}</div>
                  </div>
                </div>
                <div className="due-card-btns">
                  <button onClick={() => sendWhatsAppReminder(c)} style={styles.waBtn}><MessageCircle size={14} /> Remind</button>
                  <button onClick={() => navigate(`/customer-due/${c.id}`)} style={styles.settleBtn}>Settle <ChevronRight size={12} /></button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

const styles = {
  container: { padding: "24px 0 40px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px", flexWrap: "wrap", gap: "20px" },
  titleArea: { flex: 1 },
  title: { fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 4px", letterSpacing: "-0.5px" },
  subtitle: { color: "#64748b", fontSize: "14px", fontWeight: "400" },
  printBtn: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "13px", color: "#475569", fontFamily: "inherit" },
  
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" },
  sumCard: { display: "flex", alignItems: "center", gap: "16px", padding: "20px 24px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  sumIcon: { width: "44px", height: "44px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  sumLabel: { fontSize: "12px", fontWeight: "500", color: "#94a3b8", marginBottom: "2px" },
  sumValue: { fontSize: "22px", fontWeight: "800", color: "#0F172A", letterSpacing: "-0.5px" },

  filterRow: { display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" },
  searchBox: { position: "relative", flex: 2, minWidth: "250px" },
  searchIcon: { position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" },
  input: { width: "100%", padding: "10px 14px 10px 40px", borderRadius: "10px", border: "1px solid #e2e8f0", outline: "none", fontSize: "13px", background: "#fff", color: "#0F172A", fontWeight: "400", fontFamily: "inherit" },
  sortBox: { position: "relative", flex: 1, minWidth: "160px" },
  select: { width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", outline: "none", fontSize: "13px", background: "#fff", appearance: "none", fontWeight: "500", color: "#475569", cursor: "pointer", fontFamily: "inherit" },

  tableContainer: { borderRadius: "16px", border: "1px solid #e2e8f0", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: "700px" },
  thead: { background: "#F8FAFC", borderBottom: "1px solid #e2e8f0" },
  th: { textAlign: "left", padding: "14px 20px", fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" },
  tr: { borderBottom: "1px solid #f1f5f9", background: "#fff", transition: "all 0.15s" },
  td: { padding: "16px 20px", verticalAlign: "middle", fontSize: "13px" },
  custCell: { display: "flex", alignItems: "center", gap: "12px" },
  avatar: { width: "40px", height: "40px", background: "rgba(37, 99, 235, 0.08)", color: "#2563EB", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "16px" },
  custName: { fontWeight: "600", color: "#0F172A", fontSize: "14px" },
  custPhone: { fontSize: "11px", color: "#94a3b8", fontWeight: "500", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" },
  ageBadge: { padding: "4px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "600" },
  actions: { display: "flex", gap: "8px", justifyContent: "flex-end" },
  waBtn: { display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", background: "rgba(22, 163, 74, 0.06)", color: "#16a34a", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600", fontFamily: "inherit" },
  settleBtn: { display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", background: "#2563EB", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600", boxShadow: "0 2px 6px rgba(37, 99, 235, 0.2)", fontFamily: "inherit" },
  emptyState: { padding: "80px 40px", textAlign: "center" }
};


export default DueCustomers;