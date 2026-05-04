import { useEffect, useState, useCallback, useMemo } from "react";
import api from "../services/api";
import { 
  Users, 
  Package, 
  ShoppingCart, 
  IndianRupee, 
  TrendingUp, 
  Activity,
  Download,
  AlertTriangle,
  ArrowUpRight
} from "lucide-react";
import { Skeleton, Card } from "../components/ui";
import { motion, AnimatePresence } from "framer-motion";

const BANNER_IMAGES = [
  "/images/store2.png",
  "/images/store3.png",
  "/images/store4.png",
  "/images/store5.png",
  "/images/workers.png"
];

function Dashboard() {
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BANNER_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const [stats, setStats] = useState({
    customers: 0,
    products: 0,
    orders: 0,
    due: 0,
    paid: 0,
    totalRevenue: 0
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyActivity, setDailyActivity] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  const fetchStats = useCallback(async () => {
    try {
      setRefreshing(true);

      const [customersRes, productsRes, ordersRes, duesRes] = await Promise.all([
        api.get("/customers"),
        api.get("/products"),
        api.get("/orders"),
        api.get("/activity-pulse")
      ]);

      const customersData = customersRes.data || [];
      const productsData = productsRes.data || [];
      const ordersData = ordersRes.data?.orders || [];
      const dueHistory = duesRes.data || [];

      let totalDue = 0;
      let totalPaid = 0;
      let totalRevenue = 0;

      ordersData.forEach((order) => {
        totalDue += Number(order?.remaining_amount || 0);
        totalPaid += Number(order?.paid_amount || 0);
        totalRevenue += Number(order?.total_amount || 0);
      });

      // Today's Pulse Activity + Stock Alerts
      const todayString = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
      const lowStockAlerts = productsData
        .filter(p => Number(p.stock) < 10)
        .map(p => ({ 
          type: 'stock', 
          title: `Low Stock: ${p.name}`, 
          sub: `Only ${p.stock} ${p.unit} remaining`, 
          time: new Date().toISOString() 
        }));

      const todayActivity = [
        ...ordersData
          .filter(o => o.created_at?.startsWith(todayString))
          .map(o => ({ type: 'order', title: `New Order: ₹${o.total_amount}`, sub: o.customer_name, time: o.created_at })),
        ...dueHistory
          .filter(h => h.created_at?.startsWith(todayString) && h.type === 'PAID_DUE')
          .map(h => ({ type: 'payment', title: `Payment: ₹${h.amount}`, sub: `Reference Order ID: ${h.order_id || 'N/A'}`, time: h.created_at })),
        ...lowStockAlerts
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);

      setStats({
        customers: customersData.length,
        products: productsData.length,
        orders: ordersData.length,
        due: totalDue,
        paid: totalPaid,
        totalRevenue
      });

      setDailyActivity(todayActivity);
      setRecentOrders(ordersData.slice(0, 5));
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  const handleBackup = async () => {
    try {
      const response = await api.get("/admin/backup/download", { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `naman-backup-${new Date().toLocaleDateString()}.db`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Backup failure:", err);
      alert("Backup download failed. Ensure you are authorized.");
    }

  };

  const dashCards = useMemo(() => [
    { 
      label: "Total Sales", 
      value: stats.totalRevenue, 
      icon: TrendingUp, 
      iconBg: "rgba(249, 115, 22, 0.08)",
      iconColor: "#F97316",
      detail: "Gross Revenue" 
    },
    { 
      label: "Debt Recovered", 
      value: stats.paid, 
      icon: IndianRupee, 
      iconBg: "rgba(22, 163, 74, 0.08)",
      iconColor: "#16a34a",
      detail: "Total Payments Received" 
    },
    { 
      label: "Debt Given", 
      value: stats.due, 
      icon: AlertTriangle, 
      iconBg: "rgba(239, 68, 68, 0.08)",
      iconColor: "#ef4444",
      detail: "Pending Outstanding" 
    },
    { 
      label: "Customers", 
      value: stats.customers, 
      icon: Users, 
      iconBg: "rgba(56, 189, 248, 0.08)",
      iconColor: "#38BDF8",
      detail: "Total Profiles" 
    }
  ], [stats]);

  if (loading) {
    return (
      <div style={{ padding: "32px 0" }}>
        <Skeleton width="300px" height="40px" className="mb-8" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", marginBottom: "40px" }}>
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} height="140px" borderRadius="16px" />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "20px" }}>
          <Skeleton height="400px" borderRadius="16px" />
          <Skeleton height="400px" borderRadius="16px" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
      style={styles.container}
    >
      {/* Store Banner */}
      <div className="dash-banner" style={{ position: "relative", width: "100%", height: "240px", marginBottom: "32px", borderRadius: "24px", overflow: "hidden", border: "1px solid rgba(255, 255, 255, 0.1)", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", background: "#0F172A" }}>
        <AnimatePresence initial={false}>
          <motion.div 
            key={bgIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "0 40px",
            }}
            className="dash-banner-pad"
          >
            {/* Lazy loaded background image */}
            <div 
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.6)), url('${BANNER_IMAGES[bgIndex]}')`,
                backgroundPosition: "center",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                zIndex: 0
              }}
            />
            
            <div style={{ position: "relative", zIndex: 2 }}>
              <h2 style={{ color: "#F59E0B", fontSize: "36px", fontWeight: "900", margin: 0, letterSpacing: "-1.5px", fontFamily: "'Outfit', sans-serif" }}>VILLAGE INFRASTRUCTURE</h2>
              <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "18px", margin: "8px 0 0 0", fontWeight: "500", textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>Supporting rural development and the hardworking people of our villages</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Dots */}
        <div style={{ position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "8px", zIndex: 10 }}>
          {BANNER_IMAGES.map((_, i) => (
            <div 
              key={i} 
              onClick={() => setBgIndex(i)}
              style={{
                width: i === bgIndex ? "24px" : "8px",
                height: "8px",
                background: i === bgIndex ? "#F59E0B" : "rgba(255,255,255,0.4)",
                borderRadius: "100px",
                transition: "all 0.3s ease",
                cursor: "pointer"
              }}
            />
          ))}
        </div>

        <div style={{ position: "absolute", right: "40px", bottom: "20px", zIndex: 10 }}>
           <div style={{ padding: "8px 20px", background: "rgba(255,255,255,0.15)", borderRadius: "100px", color: "#fff", fontSize: "13px", fontWeight: "700", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)" }}>Authorized Portal</div>
        </div>
      </div>

      <header className="dash-stack-hdr" style={styles.header}>
        <div style={styles.titleArea}>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Welcome to Naman Enterprises management portal</p>
        </div>
        <div className="dash-hdr-btns" style={styles.actions}>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBackup} 
            style={styles.secondaryBtn}
          >
            <Download size={16} /> Backup
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchStats} 
            disabled={refreshing} 
            style={styles.primaryBtn}
          >
            <Activity size={16} className={refreshing ? "spin" : ""} />
            {refreshing ? "Syncing..." : "Refresh"}
          </motion.button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="dash-stats-grid" style={styles.statsGrid}>
        {dashCards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div style={styles.statCard}>
              <div style={styles.statHeader}>
                <div style={{ 
                  ...styles.iconBox, 
                  background: card.iconBg,
                  color: card.iconColor,
                }}>
                  <card.icon size={22} />
                </div>
              </div>
              <div style={styles.statBody}>
                <h2 style={styles.cardValue}>
                  {card.label.includes("Revenue") || card.label.includes("Due") ? formatCurrency(card.value) : card.value}
                </h2>
                <div style={styles.cardLabel}>{card.label}</div>
                <div style={styles.cardDetail}>{card.detail}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="dash-main-grid" style={styles.mainGrid}>
        {/* Business Analytics & Growth */}
        <div style={styles.pulseCard}>
          <div style={styles.secHeader}>
            <TrendingUp size={18} color="#F97316" />
            <h3 style={styles.secTitle}>Business Growth</h3>
          </div>
          
          <div style={styles.growthContainer}>
            <div style={styles.growthItem}>
              <div style={styles.growthLabel}>Recovery Rate</div>
              <div style={styles.growthValue}>
                {stats.totalRevenue > 0 ? ((stats.paid / stats.totalRevenue) * 100).toFixed(1) : 0}%
              </div>
              <div style={styles.growthProgress}>
                <div style={{ ...styles.progressBar, width: `${(stats.paid / stats.totalRevenue) * 100}%`, background: "#16a34a" }} />
              </div>
            </div>

            <div style={styles.growthItem}>
              <div style={styles.growthLabel}>Debt Exposure</div>
              <div style={styles.growthValue}>
                {stats.totalRevenue > 0 ? ((stats.due / stats.totalRevenue) * 100).toFixed(1) : 0}%
              </div>
              <div style={styles.growthProgress}>
                <div style={{ ...styles.progressBar, width: `${(stats.due / stats.totalRevenue) * 100}%`, background: "#ef4444" }} />
              </div>
            </div>

            <div style={styles.paymentSplit}>
              <h4 style={styles.miniTitle}>Money Flow Channels</h4>
              <div style={styles.channelRow}>
                <span>Cash</span>
                <span style={{ fontWeight: 700 }}>60%</span>
              </div>
              <div style={styles.channelRow}>
                <span>Online / UPI</span>
                <span style={{ fontWeight: 700 }}>30%</span>
              </div>
              <div style={styles.channelRow}>
                <span>Cheque</span>
                <span style={{ fontWeight: 700 }}>10%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Performance Table */}
        <div style={styles.recentCard}>
          <div style={styles.secHeader}>
            <TrendingUp size={18} color="#F97316" />
            <h3 style={styles.secTitle}>Recent Orders</h3>
          </div>
          <div className="dash-table-wrap">
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Order ID</th>
                  <th style={styles.th}>Status</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o, i) => (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.tdName}>{o.customer_name}</div>
                    </td>
                    <td style={styles.td}>
                      <code style={styles.auditCode}>#{o.order_id}</code>
                    </td>
                    <td style={styles.td}>
                      <span style={{ 
                        ...styles.statusBadge, 
                        background: o.remaining_amount === 0 ? 'rgba(22, 163, 74, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                        color: o.remaining_amount === 0 ? '#16a34a' : '#f59e0b'
                      }}>
                        {o.remaining_amount === 0 ? "Paid" : "Due"}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: "right", fontWeight: "700", color: "#0F172A" }}>
                      {formatCurrency(o.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="dash-recent-mobile">
            {recentOrders.map((o, i) => (
              <div key={i} style={{ padding: "12px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: "700", color: "#0F172A", fontSize: "14px" }}>{o.customer_name}</div>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>#{o.order_id}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: "800", color: "#0F172A", fontSize: "14px" }}>{formatCurrency(o.total_amount)}</div>
                  <span style={{ 
                    fontSize: "10px", 
                    fontWeight: "700",
                    color: o.remaining_amount === 0 ? '#16a34a' : '#f59e0b',
                    textTransform: "uppercase"
                  }}>
                    {o.remaining_amount === 0 ? "Paid" : "Due"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .mb-8 { margin-bottom: 32px; }
        .dash-main-grid { display: grid; grid-template-columns: 1fr 1.6fr; gap: 20px; align-items: start; }
        .dash-table-wrap { display: block; overflow-x: auto; }
        .dash-recent-mobile { display: none; }
        
        @media (max-width: 768px) {
          .dash-table-wrap { display: none; }
          .dash-recent-mobile { display: flex; flex-direction: column; }
          .dash-banner { height: 160px; border-radius: 16px; margin-bottom: 20px; }
          .dash-banner h2 { font-size: 22px !important; letter-spacing: -0.5px !important; }
          .dash-banner p { font-size: 13px !important; }
          .dash-banner-pad { padding: 0 20px !important; }
          .dash-stats-grid { grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
          @media (max-width: 480px) {
            .dash-stats-grid { grid-template-columns: 1fr !important; }
          }
          .dash-main-grid { grid-template-columns: 1fr !important; }
          .dash-stack-hdr { flex-direction: column; align-items: flex-start !important; }
          .dash-hdr-btns { width: 100%; }
          .dash-hdr-btns button { flex: 1; justify-content: center; }
        }
      `}</style>
    </motion.div>
  );
}

const styles = {
  container: { padding: "24px 0 40px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px", flexWrap: "wrap", gap: "20px" },
  titleArea: { flex: 1 },
  title: { fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px", letterSpacing: "-0.5px" },
  subtitle: { color: "#64748b", fontSize: "14px", fontWeight: "400" },
  actions: { display: "flex", gap: "10px" },
  primaryBtn: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: "#F97316", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "13px", boxShadow: "0 2px 8px rgba(249, 115, 22, 0.25)", transition: "all 0.2s", fontFamily: "inherit" },
  secondaryBtn: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "13px", color: "#475569", transition: "all 0.2s", fontFamily: "inherit" },
  
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "32px" },
  statCard: { padding: "24px", borderRadius: "16px", background: "#ffffff", border: "1px solid #e2e8f0", transition: "all 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  statHeader: { marginBottom: "16px" },
  iconBox: { width: "44px", height: "44px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" },
  cardValue: { fontSize: "26px", fontWeight: "800", margin: "0 0 4px", letterSpacing: "-0.5px", color: "#0F172A" },
  cardLabel: { fontSize: "14px", fontWeight: "600", color: "#475569", marginBottom: "2px" },
  cardDetail: { fontSize: "12px", color: "#94a3b8", fontWeight: "400" },

  mainGrid: { display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "20px", alignItems: "start" },
  pulseCard: { padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", height: "100%" },
  secHeader: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" },
  secTitle: { fontSize: "16px", fontWeight: "700", color: "#0F172A", margin: 0 },
  growthContainer: { display: "flex", flexDirection: "column", gap: "24px" },
  growthItem: { display: "flex", flexDirection: "column", gap: "8px" },
  growthLabel: { fontSize: "13px", fontWeight: "600", color: "#64748b" },
  growthValue: { fontSize: "24px", fontWeight: "800", color: "#0F172A" },
  growthProgress: { height: "8px", background: "#F1F5F9", borderRadius: "10px", overflow: "hidden" },
  progressBar: { height: "100%", borderRadius: "10px", transition: "width 1s ease-out" },
  paymentSplit: { marginTop: "12px", padding: "16px", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #f1f5f9" },
  miniTitle: { fontSize: "12px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 12px" },
  channelRow: { display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#475569", marginBottom: "8px" },

  recentCard: { padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "0 16px 14px", color: "#94a3b8", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" },
  tr: { borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" },
  td: { padding: "16px", fontSize: "13px", color: "#475569" },
  tdName: { fontWeight: "600", color: "#0F172A" },
  auditCode: { background: "#F8FAFC", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", color: "#F97316", border: "1px solid #e2e8f0" },
  statusBadge: { padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.3px" }
};

export default Dashboard;