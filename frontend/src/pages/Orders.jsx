import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { 
  Receipt, 
  Search, 
  Filter, 
  Calendar, 
  ArrowUpRight, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  MoreHorizontal,
  Plus,
  ChevronRight,
  IndianRupee,
  FileText
} from "lucide-react";
import { Card, Skeleton } from "../components/ui";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders");
      setOrders(res.data.orders || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Could not sync orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = String(o.order_id).includes(searchTerm) || o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const remaining = Number(o.remaining_amount || 0);
      let matchStatus = true;
      if (statusFilter === 'paid') matchStatus = remaining === 0;
      if (statusFilter === 'due') matchStatus = remaining > 0;

      let matchDate = true;
      const orderDate = new Date(o.created_at);
      const today = new Date();
      if (dateRange === 'today') matchDate = orderDate.toDateString() === today.toDateString();
      if (dateRange === 'month') matchDate = orderDate.getMonth() === today.getMonth() && orderDate.getFullYear() === today.getFullYear();
      
      return matchSearch && matchStatus && matchDate;
    });
  }, [orders, searchTerm, statusFilter, dateRange]);

  const stats = useMemo(() => ({
    total: orders.reduce((sum, o) => sum + Number(o.total_amount), 0),
    collected: orders.reduce((sum, o) => sum + Number(o.paid_amount), 0),
    pending: orders.reduce((sum, o) => sum + Number(o.remaining_amount), 0),
  }), [orders]);

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
        <Skeleton height="50px" width="300px" className="mb-8" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} height="100px" />)}
        </div>
        <Skeleton height="500px" />
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
          <h1 style={styles.title}>Orders</h1>
          <p style={styles.subtitle}>Sales history, receipts, and fulfillment tracking</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/create-order')} 
          style={styles.addBtn}
        >
          <Plus size={16} /> New Order
        </motion.button>
      </header>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.iconBox, background: "rgba(37, 99, 235, 0.08)", color: "#2563EB" }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div style={styles.statLabel}>Total Revenue</div>
            <div style={styles.statValue}>{formatCurrency(stats.total)}</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.iconBox, background: "rgba(22, 163, 74, 0.08)", color: "#16a34a" }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={styles.statLabel}>Collected</div>
            <div style={styles.statValue}>{formatCurrency(stats.collected)}</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.iconBox, background: "rgba(239, 68, 68, 0.08)", color: "#ef4444" }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={styles.statLabel}>Pending</div>
            <div style={styles.statValue}>{formatCurrency(stats.pending)}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filterRow}>
        <div style={styles.searchBox}>
          <Search size={16} style={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by order ID or customer..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.selectBox}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={styles.select}>
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="due">Due</option>
          </select>
        </div>
        <div style={styles.selectBox}>
          <select value={dateRange} onChange={e => setDateRange(e.target.value)} style={styles.select}>
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableContainer}>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>Order</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Status</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o, i) => {
                const remaining = Number(o.remaining_amount || 0);
                const isPaid = remaining === 0;

                return (
                  <motion.tr 
                    key={o.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    style={styles.tr}
                    onClick={() => navigate(`/orders/${o.order_id}`)}
                  >
                    <td style={styles.td}>
                      <div style={styles.orderCell}>
                        <div style={styles.idBadge}>#{o.order_id.toString().padStart(5, '0')}</div>
                        <div style={styles.dateText}>{new Date(o.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.custCell}>
                        <div style={styles.avatar}>{o.customer_name?.charAt(0)}</div>
                        <div style={styles.custName}>{o.customer_name}</div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.amountWrap}>
                        <div style={styles.mainAmount}>{formatCurrency(o.total_amount)}</div>
                        {!isPaid && <div style={styles.dueSubtext}>Due: {formatCurrency(remaining)}</div>}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{ 
                        ...styles.statusBadge, 
                        background: isPaid ? "rgba(22, 163, 74, 0.08)" : "rgba(245, 158, 11, 0.08)",
                        color: isPaid ? "#16a34a" : "#f59e0b"
                      }}>
                        {isPaid ? "Paid" : "Due"}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: "right" }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/orders/${o.order_id}`); }} 
                        style={styles.viewBtn}
                      >
                        View <ChevronRight size={12} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div style={styles.emptyStateContainer}>
              <Receipt size={48} style={{ opacity: 0.1, marginBottom: "16px" }} />
              <h3 style={{ margin: "0 0 4px", color: "#0F172A", fontSize: "16px", fontWeight: "600" }}>No orders found</h3>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px" }}>Adjust filters or create a new order.</p>
            </div>
          )}
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
  addBtn: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: "#2563EB", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "13px", boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)", fontFamily: "inherit" },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" },
  statCard: { display: "flex", alignItems: "center", gap: "16px", padding: "20px 24px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  iconBox: { width: "44px", height: "44px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  statLabel: { fontSize: "12px", fontWeight: "500", color: "#94a3b8", marginBottom: "2px" },
  statValue: { fontSize: "22px", fontWeight: "800", color: "#0F172A", letterSpacing: "-0.5px" },

  filterRow: { display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" },
  searchBox: { position: "relative", flex: 2, minWidth: "250px" },
  searchIcon: { position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" },
  searchInput: { width: "100%", padding: "10px 14px 10px 40px", borderRadius: "10px", border: "1px solid #e2e8f0", outline: "none", fontSize: "13px", background: "#fff", color: "#0F172A", fontWeight: "400", fontFamily: "inherit" },
  selectBox: { position: "relative", flex: 1, minWidth: "160px" },
  select: { width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", outline: "none", fontSize: "13px", background: "#fff", appearance: "none", cursor: "pointer", fontWeight: "500", color: "#475569", fontFamily: "inherit" },

  tableContainer: { borderRadius: "16px", border: "1px solid #e2e8f0", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: "800px" },
  thead: { background: "#F8FAFC", borderBottom: "1px solid #e2e8f0" },
  th: { textAlign: "left", padding: "14px 20px", fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" },
  tr: { borderBottom: "1px solid #f1f5f9", background: "#fff", transition: "all 0.15s", cursor: "pointer" },
  td: { padding: "16px 20px", verticalAlign: "middle", fontSize: "13px" },

  orderCell: { display: "flex", flexDirection: "column", gap: "4px" },
  idBadge: { background: "#F8FAFC", color: "#2563EB", padding: "4px 10px", borderRadius: "6px", fontWeight: "600", fontSize: "13px", width: "fit-content", border: "1px solid #e2e8f0" },
  dateText: { fontSize: "11px", color: "#94a3b8", fontWeight: "500" },

  custCell: { display: "flex", alignItems: "center", gap: "12px" },
  avatar: { width: "36px", height: "36px", background: "rgba(37, 99, 235, 0.08)", color: "#2563EB", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "15px" },
  custName: { fontWeight: "600", color: "#0F172A", fontSize: "14px" },

  amountWrap: { display: "flex", flexDirection: "column", gap: "2px" },
  mainAmount: { fontWeight: "700", color: "#0F172A", fontSize: "15px" },
  dueSubtext: { fontSize: "11px", color: "#ef4444", fontWeight: "500" },

  statusBadge: { padding: "4px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.3px" },
  viewBtn: { display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", background: "#F8FAFC", border: "1px solid #e2e8f0", borderRadius: "8px", color: "#475569", fontWeight: "500", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" },

  emptyStateContainer: { padding: "80px 40px", textAlign: "center" }
};

export default Orders;