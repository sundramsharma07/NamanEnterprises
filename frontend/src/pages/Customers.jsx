import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { 
  Users, 
  UserPlus, 
  Search, 
  MapPin, 
  Phone,
  ArrowRight,
  ExternalLink,
  Trash2,
  Printer,
  Eye,
  Pencil,
  X
} from "lucide-react";
import { Skeleton } from "../components/ui";
import { Button } from "../components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function Customers() {
  const navigate = useNavigate();
  const location = useLocation();
  const [customers, setCustomers] = useState([]);
  
  // Initialize search from URL
  const [searchTerm, setSearchTerm] = useState(new URLSearchParams(location.search).get("q") || "");
  
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  
  const [formData, setFormData] = useState({ name: "", phone: "", address: "" });

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/customers");
      setCustomers(res.data || []);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    const q = new URLSearchParams(location.search).get("q");
    if (q !== null) {
      setSearchTerm(q);
    }
  }, [location.search]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
        toast.success("Customer updated successfully!");
      } else {
        await api.post("/customers", formData);
        toast.success("Customer added successfully!");
      }
      setFormData({ name: "", phone: "", address: "" });
      setShowAddForm(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const startEdit = (e, customer) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      address: customer.address || ""
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setShowAddForm(false);
    setEditingCustomer(null);
    setFormData({ name: "", phone: "", address: "" });
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Permanently delete this customer? All history will be lost.")) return;
    try {
      await api.delete(`/customers/${id}`);
      toast.success("Customer removed");
      fetchCustomers();
    } catch (err) {
      toast.error("Failed to delete customer");
    }
  };

  const handlePrint = (e, customer) => {
    e.stopPropagation();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Customer Details - ${customer.name}</title></head>
        <body>
          <h1>Customer Details</h1>
          <p><strong>Name:</strong> ${customer.name}</p>
          <p><strong>Phone:</strong> ${customer.phone}</p>
          <p><strong>Address:</strong> ${customer.address || 'N/A'}</p>
          <p><strong>Total Outstanding:</strong> ${formatCurrency(customer.total_due)}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filtered = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone?.includes(searchTerm)
  );

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  if (loading && customers.length === 0) {
    return (
      <div style={styles.container}>
        <Skeleton height="50px" width="300px" style={{ marginBottom: "24px" }} />
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
          <h1 style={styles.title}>Customers</h1>
          <p style={styles.subtitle}>Managing {customers.length} customer accounts</p>
        </div>
        <div style={styles.headerButtons}>
          <Button variant="default" onClick={() => window.print()} style={{ background: "#fff", border: "1px solid #e2e8f0", color: "#475569" }}>
            <Printer size={16} /> Print
          </Button>
          <Button 
            variant={showAddForm ? "danger" : "primary"}
            onClick={showAddForm ? closeForm : () => setShowAddForm(true)} 
          >
            {showAddForm ? "Close" : <><UserPlus size={16} /> Add Customer</>}
          </Button>
        </div>
      </header>

      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: "hidden" }}
          >
            <div style={styles.addCard}>
              <h3 style={styles.secTitle}>{editingCustomer ? "Edit Customer" : "New Customer"}</h3>
              <form onSubmit={handleAddSubmit} style={styles.formRow}>
                <div style={styles.field}>
                  <label style={styles.label}>Full Name</label>
                  <input 
                    required 
                    placeholder="e.g. Sharma Constructions"
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    style={styles.input} 
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Phone</label>
                  <input 
                    required 
                    type="tel" 
                    placeholder="+91..."
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    style={styles.input} 
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Address</label>
                  <input 
                    placeholder="Enter address"
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                    style={styles.input} 
                  />
                </div>
                <Button type="submit" variant="primary">
                  {editingCustomer ? "Update Details" : "Add Customer"} <ArrowRight size={14} />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={styles.filterRow}>
        <div style={styles.searchBox}>
          <Search size={16} style={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.totalBadge}>
          <Users size={14} /> {filtered.length} results
        </div>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead style={styles.thead}>
            <tr>
              <th style={styles.th}>Customer</th>
              <th style={styles.th}>Contact</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Outstanding</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <motion.tr 
                key={c.id} 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                style={styles.tr}
                onClick={() => navigate(`/customers/${c.id}`)}
              >
                <td style={styles.td}>
                  <div style={styles.userCell}>
                    <div style={styles.avatar}>{c.name?.charAt(0) || '?'}</div>
                    <div style={styles.nameWrap}>
                      <div style={styles.custName}>{c.name}</div>
                      <div style={styles.custId}>ID: #C-{c.id.toString().padStart(4, '0')}</div>
                    </div>
                  </div>
                </td>
                <td style={styles.td}>
                  <div style={styles.contactCell}>
                    <div style={styles.contactItem}><Phone size={12} color="#2563EB" /> {c.phone}</div>
                    <div style={styles.contactItem}><MapPin size={12} color="#94a3b8" /> {c.address || "N/A"}</div>
                  </div>
                </td>
                <td style={styles.td}>
                  <span style={{ 
                    ...styles.badge, 
                    background: c.total_due > 0 ? "rgba(239, 68, 68, 0.08)" : "rgba(22, 163, 74, 0.08)",
                    color: c.total_due > 0 ? "#ef4444" : "#16a34a"
                  }}>
                    {c.total_due > 0 ? "Outstanding" : "Clear"}
                  </span>
                </td>
                <td style={{ ...styles.td, fontWeight: 700, fontSize: "14px", color: "#0F172A" }}>
                  {formatCurrency(c.total_due)}
                </td>
                <td style={{ ...styles.td, textAlign: "center" }}>
                  <div style={styles.actions}>
                    <button 
                      onClick={(e) => handlePrint(e, c)} 
                      title="Print"
                      style={styles.actionBtn}
                    >
                      <Printer size={14} />
                    </button>
                    <button 
                      onClick={(e) => startEdit(e, c)} 
                      title="Edit"
                      style={styles.actionBtn}
                    >
                      <Pencil size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigate(`/customers/${c.id}`); }} 
                      title="View"
                      style={styles.actionBtn}
                    >
                      <Eye size={14} />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, c.id)} 
                      title="Delete"
                      style={{ ...styles.actionBtn, color: "#ef4444" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={styles.emptyStateContainer}>
            <Search size={40} style={{ opacity: 0.15 }} />
            <h4 style={{ margin: "12px 0 4px", color: "#0F172A", fontWeight: "600" }}>No matches found</h4>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px" }}>Refine your search or add a new customer.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

const styles = {
  container: { padding: "24px 0 48px" },
  header: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: "24px", 
    flexWrap: "wrap", 
    gap: "16px",
  },
  titleArea: { flex: 1 },
  title: { fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 4px", letterSpacing: "-0.5px" },
  subtitle: { color: "#64748b", fontSize: "14px", fontWeight: "400" },
  headerButtons: { display: "flex", gap: "10px", alignItems: "center" },

  addCard: { 
    padding: "24px", 
    marginBottom: "24px", 
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
  },
  secTitle: { fontSize: "16px", fontWeight: "700", marginBottom: "20px", color: "#0F172A" },
  formRow: { display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap" },
  field: { flex: 1, minWidth: "200px", display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.3px" },
  input: { 
    padding: "10px 14px", 
    borderRadius: "10px", 
    border: "1px solid #e2e8f0", 
    background: "#F8FAFC", 
    outline: "none", 
    fontSize: "14px", 
    color: "#0F172A", 
    fontWeight: "500",
    fontFamily: "inherit",
    transition: "border-color 0.2s",
  },

  filterRow: { display: "flex", gap: "12px", marginBottom: "20px", alignItems: "center", flexWrap: "wrap" },
  searchBox: { position: "relative", flex: 1, maxWidth: "400px" },
  searchIcon: { position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" },
  searchInput: { 
    width: "100%", 
    padding: "10px 14px 10px 40px", 
    borderRadius: "10px", 
    border: "1px solid #e2e8f0", 
    outline: "none", 
    fontSize: "13px", 
    background: "#fff", 
    color: "#0F172A", 
    fontWeight: "400", 
    fontFamily: "inherit",
  },
  totalBadge: { 
    display: "flex", alignItems: "center", gap: "6px", 
    padding: "8px 14px", background: "#F8FAFC", 
    border: "1px solid #e2e8f0", borderRadius: "10px", 
    fontSize: "12px", fontWeight: "500", color: "#64748b" 
  },

  tableWrap: { overflowX: "auto", borderRadius: "16px", border: "1px solid #e2e8f0", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { background: "#F8FAFC", borderBottom: "1px solid #e2e8f0" },
  th: { textAlign: "left", padding: "14px 20px", fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" },
  tr: { borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.15s" },
  td: { padding: "16px 20px", fontSize: "13px", color: "#475569" },
  userCell: { display: "flex", alignItems: "center", gap: "12px" },
  avatar: { 
    width: "38px", height: "38px", 
    background: "rgba(37, 99, 235, 0.08)", 
    color: "#2563EB", 
    borderRadius: "10px", 
    display: "flex", alignItems: "center", justifyContent: "center", 
    fontWeight: "700", fontSize: "15px", 
  },
  nameWrap: { display: "flex", flexDirection: "column" },
  custName: { fontWeight: "600", color: "#0F172A", fontSize: "14px" },
  custId: { fontSize: "11px", color: "#94a3b8", fontWeight: "500", marginTop: "1px" },
  contactCell: { display: "flex", flexDirection: "column", gap: "4px" },
  contactItem: { display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "12px", fontWeight: "400" },
  badge: { padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", display: "inline-block" },
  actions: { display: "flex", gap: "6px", justifyContent: "center", alignItems: "center" },
  actionBtn: {
    background: "#F8FAFC",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "6px 8px",
    cursor: "pointer",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s",
  },
  emptyStateContainer: { padding: "60px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", color: "#94a3b8" },
};