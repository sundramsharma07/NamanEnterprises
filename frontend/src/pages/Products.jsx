import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import api from "../services/api";
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  History, 
  TrendingUp, 
  IndianRupee,
  ArrowUpDown,
  AlertCircle,
  ChevronDown,
  CheckCircle2,
  ArrowRight,
  Clock
} from "lucide-react";
import { Skeleton } from "../components/ui";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

function Products() {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [stockUpdatingId, setStockUpdatingId] = useState(null);
  
  // Initialize search from URL
  const [searchTerm, setSearchTerm] = useState(new URLSearchParams(location.search).get("q") || "");
  
  const [filterCategory, setFilterCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  const [stockForm, setStockForm] = useState({});
  const [historyProductId, setHistoryProductId] = useState(null);
  const [stockHistory, setStockHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/products");
      setProducts(res.data || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const q = new URLSearchParams(location.search).get("q");
    if (q !== null) {
      setSearchTerm(q);
    }
  }, [location.search]);

  const categories = useMemo(() => {
    return ["all", ...new Set(products.map(p => p.category))];
  }, [products]);

  const handlePriceChange = (id, value) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, price: value } : p));
  };

  const handleStockFormChange = (id, field, value) => {
    setStockForm(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const updatePrice = async (product) => {
    try {
      setUpdatingId(product.id);
      await api.put(`/products/${product.id}`, {
        ...product,
        price: Number(product.price)
      });
      toast.success("Price updated");
      fetchProducts();
    } catch (error) {
      toast.error("Update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const updateStock = async (productId) => {
    const current = stockForm[productId] || {};
    if (!current.quantity || Number(current.quantity) <= 0) {
      return toast.error("Enter valid quantity");
    }

    try {
      setStockUpdatingId(productId);
      await api.put(`/products/${productId}/stock`, {
        type: current.type || "IN",
        quantity: Number(current.quantity),
        note: current.note || ""
      });
      toast.success("Stock adjusted");
      setStockForm(prev => ({ ...prev, [productId]: { type: "IN", quantity: "", note: "" } }));
      fetchProducts();
    } catch (error) {
      toast.error("Stock update failed");
    } finally {
      setStockUpdatingId(null);
    }
  };

  const viewStockHistory = async (productId) => {
    try {
      setHistoryProductId(productId);
      setHistoryLoading(true);
      const res = await api.get(`/products/${productId}/stock-history`);
      setStockHistory(res.data?.history || []);
    } catch (error) {
      toast.error("History unavailable");
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.variant?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = useMemo(() => ({
    total: products.length,
    lowStock: products.filter(p => Number(p.stock) <= Number(p.min_stock)).length,
    value: products.reduce((sum, p) => sum + (Number(p.price) * Number(p.stock)), 0)
  }), [products]);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Skeleton height="50px" width="300px" className="mb-8" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "32px" }}>
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
          <h1 style={styles.title}>Products</h1>
          <p style={styles.subtitle}>Inventory management and stock control</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={styles.addBtn} 
          onClick={() => toast("Use the table rows to adjust stock levels", { icon: "📦" })}
        >
          <Plus size={16} /> Add Product
        </motion.button>
      </header>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.iconBox, background: "rgba(37, 99, 235, 0.08)", color: "#2563EB" }}>
            <Package size={20} />
          </div>
          <div>
            <div style={styles.statLabel}>Total Products</div>
            <div style={styles.statValue}>{stats.total}</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.iconBox, background: "rgba(239, 68, 68, 0.08)", color: "#ef4444" }}>
            <AlertCircle size={20} />
          </div>
          <div>
            <div style={styles.statLabel}>Low Stock</div>
            <div style={styles.statValue}>{stats.lowStock}</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.iconBox, background: "rgba(22, 163, 74, 0.08)", color: "#16a34a" }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div style={styles.statLabel}>Stock Value</div>
            <div style={styles.statValue}>{formatCurrency(stats.value)}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filterRow}>
        <div style={styles.searchBox}>
          <Search size={16} style={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.selectBox}>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={styles.select}>
            {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableContainer}>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>Product</th>
                <th style={styles.th}>Price</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}>Stock Adjustment</th>
                <th style={{ ...styles.th, textAlign: "right" }}>History</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p, i) => {
                const stock = Number(p.stock);
                const isLow = stock <= Number(p.min_stock);
                const form = stockForm[p.id] || { type: 'IN', quantity: '', note: '' };

                return (
                  <motion.tr 
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    style={styles.tr}
                  >
                    <td style={styles.td}>
                      <div style={styles.prodCell}>
                        <div style={{ ...styles.prodIcon, background: isLow ? "rgba(239, 68, 68, 0.08)" : "rgba(22, 163, 74, 0.08)", color: isLow ? "#ef4444" : "#16a34a" }}>
                          <Package size={18} />
                        </div>
                        <div>
                          <div style={styles.prodName}>{p.name}</div>
                          <div style={styles.prodMeta}>{p.category} • {p.variant || 'Standard'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.priceRow}>
                        <span style={{ color: "#2563EB", fontSize: "14px", fontWeight: "700" }}>₹</span>
                        <input 
                          type="number"
                          value={p.price}
                          onChange={e => handlePriceChange(p.id, e.target.value)}
                          style={styles.priceInput}
                        />
                        <button onClick={() => updatePrice(p)} style={styles.iconBtn} disabled={updatingId === p.id}>
                          {updatingId === p.id ? "..." : <CheckCircle2 size={14} />}
                        </button>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ ...styles.stockBadge, background: isLow ? "rgba(239, 68, 68, 0.08)" : "rgba(22, 163, 74, 0.06)", color: isLow ? "#ef4444" : "#16a34a" }}>
                        <span style={{ fontWeight: "700" }}>{stock}</span>
                        <span style={{ fontSize: "10px", marginLeft: "3px", opacity: 0.7 }}>{p.unit}</span>
                        {isLow && <AlertCircle size={12} style={{ marginLeft: 6 }} />}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.stockControl}>
                        <select 
                          value={form.type} 
                          onChange={e => handleStockFormChange(p.id, 'type', e.target.value)}
                          style={styles.stockType}
                        >
                          <option value="IN">ADD</option>
                          <option value="OUT">REDUCE</option>
                        </select>
                        <input 
                          type="number" 
                          placeholder="0" 
                          value={form.quantity}
                          onChange={e => handleStockFormChange(p.id, 'quantity', e.target.value)}
                          style={styles.stockInput}
                        />
                        <button onClick={() => updateStock(p.id)} style={styles.adjustBtn} disabled={stockUpdatingId === p.id}>
                          {stockUpdatingId === p.id ? "..." : <ArrowRight size={14} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ ...styles.td, textAlign: "right" }}>
                      <button onClick={() => viewStockHistory(p.id)} style={styles.auditBtn}>
                        <History size={14} /> History
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <div style={styles.emptyState}>
               <Search size={40} style={{ opacity: 0.15, marginBottom: "12px" }} />
               <p style={{ fontWeight: "500", color: "#94a3b8", fontSize: "14px" }}>No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* History Drawer */}
      <AnimatePresence>
        {historyProductId && (
          <div style={styles.overlay} onClick={() => setHistoryProductId(null)}>
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={styles.drawer}
              onClick={e => e.stopPropagation()}
            >
              <div style={styles.drawerHeader}>
                <div>
                  <h3 style={styles.drawerTitle}>Stock History</h3>
                  <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8", fontWeight: "500" }}>Product #{historyProductId}</p>
                </div>
                <button onClick={() => setHistoryProductId(null)} style={styles.closeBtn}>✕</button>
              </div>
              
              <div style={styles.historyList}>
                {historyLoading ? (
                  <div style={{ padding: "40px 0" }}><Skeleton height="300px" /></div>
                ) : stockHistory.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontSize: "14px" }}>No history found.</div>
                ) : (
                  stockHistory.map((h, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      style={styles.historyItem}
                    >
                      <div style={styles.historyMeta}>
                        <span style={styles.hTime}>
                          <Clock size={10} /> {new Date(h.created_at).toLocaleDateString()}
                        </span>
                        <span style={{ 
                          ...styles.hBadge, 
                          background: h.movement_type === 'SALE' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(22, 163, 74, 0.08)', 
                          color: h.movement_type === 'SALE' ? '#ef4444' : '#16a34a' 
                        }}>
                          {h.movement_type}
                        </span>
                      </div>
                      <div style={styles.hMain}>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                          <span style={{ fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>{h.quantity}</span>
                          <div style={{ flex: 1, height: "1px", background: "#f1f5f9" }} />
                          <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "500" }}>{h.old_stock} → {h.new_stock}</span>
                        </div>
                      </div>
                      <div style={styles.hNote}>{h.note || 'Manual adjustment'}</div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
  searchBox: { position: "relative", flex: 1, minWidth: "250px" },
  searchIcon: { position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" },
  searchInput: { width: "100%", padding: "10px 14px 10px 40px", borderRadius: "10px", border: "1px solid #e2e8f0", outline: "none", fontSize: "13px", background: "#fff", color: "#0F172A", fontWeight: "400", fontFamily: "inherit" },
  selectBox: { position: "relative", width: "200px" },
  select: { width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", outline: "none", fontSize: "13px", background: "#fff", appearance: "none", fontWeight: "500", color: "#475569", cursor: "pointer", fontFamily: "inherit" },

  tableContainer: { borderRadius: "16px", border: "1px solid #e2e8f0", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: "900px" },
  thead: { background: "#F8FAFC", borderBottom: "1px solid #e2e8f0" },
  th: { textAlign: "left", padding: "14px 20px", fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" },
  tr: { borderBottom: "1px solid #f1f5f9", background: "#fff", transition: "all 0.15s" },
  td: { padding: "16px 20px", fontSize: "13px", color: "#475569" },
  prodCell: { display: "flex", alignItems: "center", gap: "12px" },
  prodIcon: { width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  prodName: { fontWeight: "600", color: "#0F172A", fontSize: "14px" },
  prodMeta: { fontSize: "11px", color: "#94a3b8", fontWeight: "500", marginTop: "2px" },

  priceRow: { 
    display: "flex", 
    alignItems: "center", 
    gap: "8px", 
    background: "#fff", 
    padding: "8px 12px", 
    borderRadius: "12px", 
    width: "fit-content", 
    border: "2px solid #f1f5f9",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
  },
  priceInput: { 
    width: "80px", 
    border: "none", 
    background: "transparent", 
    fontWeight: "800", 
    color: "#0F172A", 
    textAlign: "right", 
    outline: "none", 
    fontSize: "16px", 
    fontFamily: "'Inter', sans-serif",
    letterSpacing: "-0.5px"
  },
  iconBtn: { 
    border: "none", 
    background: "rgba(37, 99, 235, 0.06)", 
    cursor: "pointer", 
    color: "#2563EB", 
    padding: "6px", 
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease"
  },

  stockBadge: { display: "inline-flex", alignItems: "center", padding: "6px 12px", borderRadius: "8px", fontWeight: "600", fontSize: "12px" },
  
  stockControl: { 
    display: "flex", 
    gap: "8px", 
    background: "#fff", 
    padding: "6px", 
    borderRadius: "12px", 
    width: "fit-content", 
    border: "2px solid #f1f5f9",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
  },
  stockType: { 
    border: "none", 
    background: "#F8FAFC", 
    borderRadius: "8px", 
    padding: "8px 10px", 
    fontSize: "11px", 
    fontWeight: "800", 
    outline: "none", 
    cursor: "pointer", 
    color: "#2563EB", 
    fontFamily: "'Inter', sans-serif",
    textTransform: "uppercase"
  },
  stockInput: { 
    width: "56px", 
    border: "none", 
    background: "#F8FAFC", 
    borderRadius: "8px", 
    padding: "8px", 
    fontSize: "14px", 
    fontWeight: "700", 
    outline: "none", 
    textAlign: "center", 
    color: "#0F172A", 
    fontFamily: "'Inter', sans-serif" 
  },
  adjustBtn: { 
    background: "#2563EB", 
    color: "#fff", 
    border: "none", 
    borderRadius: "8px", 
    padding: "8px 12px", 
    cursor: "pointer", 
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease"
  },

  auditBtn: { display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", background: "#F8FAFC", border: "1px solid #e2e8f0", borderRadius: "8px", color: "#475569", fontWeight: "500", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" },

  overlay: { position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.15)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", justifyContent: "flex-end" },
  drawer: { width: "420px", height: "100%", background: "#fff", padding: "32px", boxShadow: "-10px 0 40px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", borderLeft: "1px solid #e2e8f0" },
  drawerHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" },
  drawerTitle: { fontSize: "20px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px" },
  closeBtn: { border: "none", background: "#F8FAFC", width: "36px", height: "36px", borderRadius: "10px", fontSize: "16px", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  historyList: { display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto", flex: 1 },
  historyItem: { padding: "20px", borderRadius: "14px", border: "1px solid #f1f5f9", background: "#F8FAFC" },
  historyMeta: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  hTime: { fontSize: "11px", color: "#94a3b8", fontWeight: "500", display: "flex", alignItems: "center", gap: "4px" },
  hBadge: { fontSize: "10px", fontWeight: "700", padding: "3px 8px", borderRadius: "6px", textTransform: "uppercase", letterSpacing: "0.5px" },
  hMain: { padding: "8px 0" },
  hNote: { fontSize: "12px", color: "#64748b", marginTop: "8px", fontWeight: "400", fontStyle: "italic" },
  emptyState: { padding: "60px", textAlign: "center" },
};

export default Products;