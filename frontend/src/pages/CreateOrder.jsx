import { useEffect, useMemo, useState, useCallback } from "react";
import api from "../services/api";
import { 
  ShoppingCart, 
  User, 
  Package, 
  Plus, 
  Trash2, 
  IndianRupee, 
  Search,
  ChevronRight,
  Info
} from "lucide-react";
import { Skeleton } from "../components/ui";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function CreateOrder() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [partialMethod, setPartialMethod] = useState("");
  const [items, setItems] = useState([{ product_id: "", quantity: 1 }]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setDataLoading(true);
      const [custRes, prodRes] = await Promise.all([
        api.get("/customers"),
        api.get("/products")
      ]);
      setCustomers(custRes.data || []);
      setProducts(prodRes.data || []);
    } catch (err) {
      console.error("Failed to sync inventory/customers:", err);
      toast.error("Failed to sync inventory/customers");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addItem = () => {
    setItems([...items, { product_id: "", quantity: 1 }]);
  };

  const removeItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated.length ? updated : [{ product_id: "", quantity: 1 }]);
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    
    if (field === "product_id") {
      const product = products.find(p => String(p.id) === String(value));
      if (product && product.stock < updated[index].quantity) {
        updated[index].quantity = product.stock > 0 ? 1 : 0;
      }
    }
    setItems(updated);
  };

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const product = products.find(p => String(p.id) === String(item.product_id));
      return sum + (product ? Number(product.price) * Number(item.quantity || 0) : 0);
    }, 0);
  }, [items, products]);

  const remainingAmount = totalAmount - Number(paidAmount || 0);

  const submitOrder = async () => {
    if (!customerId) return toast.error("Select a customer");
    const validItems = items.filter(i => i.product_id && i.quantity > 0);
    if (validItems.length === 0) return toast.error("Add at least one item");

    try {
      setLoading(true);
      const res = await api.post("/orders", {
        customer_id: Number(customerId),
        paid_amount: Number(paidAmount || 0),
        payment_method: paymentMethod === "Partial" ? (partialMethod || "Partial") : paymentMethod,
        items: validItems.map(i => ({ product_id: Number(i.product_id), quantity: Number(i.quantity) }))
      });
      toast.success(`Order Created: ${res.data.order_id}`);
      navigate(`/receipt/${res.data.order_id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Order creation failed");
    } finally {
      setLoading(false);
    }
  };

  const getProduct = (id) => products.find(p => String(p.id) === String(id));
  const getCustomer = (id) => customers.find(c => String(c.id) === String(id));

  if (dataLoading) {
    return (
      <div style={styles.container}>
        <style>{`@media (max-width: 768px) { .co-skeleton-grid { grid-template-columns: 1fr !important; } }`}</style>
        <div className="co-skeleton-grid" style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "24px" }}>
          <Skeleton height="500px" />
          <Skeleton height="400px" />
        </div>
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
      <style>{`
        .co-grid { display: grid; grid-template-columns: 1fr 380px; gap: 24px; align-items: start; }
        .co-item-row { display: flex; align-items: center; gap: 16px; padding: 16px; background: #F8FAFC; border: 1px solid #f1f5f9; border-radius: 12px; }
        @media (max-width: 768px) {
          .co-grid { grid-template-columns: 1fr !important; }
          .co-item-row { flex-wrap: wrap; gap: 10px; }
          .co-item-select { width: 100% !important; }
          .co-summary-card { position: static !important; }
        }
      `}</style>

      <header style={styles.header}>
        <div style={styles.titleArea}>
          <h1 style={styles.title}>Create Order</h1>
          <p style={styles.subtitle}>Add items and finalize payment details</p>
        </div>
      </header>

      <div className="co-grid" style={styles.grid}>
        {/* Left: Product Selection */}
        <div style={styles.leftCol}>
          <div style={styles.mainCard}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}><Package size={18} color="#2563EB" /> Line Items</h3>
              <button onClick={addItem} style={styles.addItemBtn}>
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div style={styles.itemsList}>
              <AnimatePresence>
                {items.map((item, index) => {
                  const prod = getProduct(item.product_id);
                  const isLow = prod && Number(prod.stock) < Number(item.quantity);

                  return (
                    <motion.div 
                      key={index} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="co-item-row"
                      style={styles.itemRow}
                    >
                      <div className="co-item-select" style={styles.itemSelect}>
                        <div style={styles.selectWrapper}>
                          <Package size={14} style={styles.selectIcon} />
                          <select 
                            value={item.product_id} 
                            onChange={e => updateItem(index, "product_id", e.target.value)}
                            style={styles.select}
                          >
                            <option value="">Choose product...</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                                {p.name} • {p.variant} (Stock: {p.stock} {p.unit})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={styles.qtyBox}>
                         <div style={styles.qtyLabel}>Qty</div>
                        <input 
                          type="number" 
                          placeholder="0" 
                          value={item.quantity}
                          onChange={e => updateItem(index, "quantity", e.target.value)}
                          style={{ ...styles.qtyInput, borderColor: isLow ? "#ef4444" : "#e2e8f0" }}
                        />
                      </div>

                      <div style={styles.priceCol}>
                        <div style={styles.priceLabel}>Subtotal</div>
                        <div style={styles.priceVal}>
                           ₹{prod ? (prod.price * (item.quantity || 0)).toLocaleString() : "0"}
                        </div>
                      </div>

                      <button onClick={() => removeItem(index)} style={styles.removeBtn}>
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          <div style={styles.paymentCard}>
            <h3 style={styles.cardTitle}><IndianRupee size={18} color="#2563EB" /> Payment Entry</h3>
            <div style={styles.paymentForm}>
              <div style={styles.paymentMethodSection}>
                <label style={styles.label}>Payment Method</label>
                <div style={styles.methodGrid}>
                  {["Cash", "UPI", "Cheque", "Partial"].map(m => (
                    <button
                      key={m}
                      onClick={() => {
                        setPaymentMethod(m);
                        if (m !== "Partial") setPartialMethod("");
                      }}
                      style={{
                        ...styles.methodBtn,
                        background: paymentMethod === m ? "#2563EB" : "#F8FAFC",
                        color: paymentMethod === m ? "#fff" : "#475569",
                        borderColor: paymentMethod === m ? "#2563EB" : "#e2e8f0"
                      }}
                    >
                      {m === "Partial" ? "Partial Payment" : m}
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence>
                {paymentMethod === "Partial" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: "hidden", marginBottom: "20px" }}
                  >
                    <label style={styles.label}>Select Partial Type</label>
                    <div style={styles.methodGrid}>
                      {["Partial Cash", "Partial UPI", "Partial Cheque"].map(pm => (
                        <button
                          key={pm}
                          onClick={() => setPartialMethod(pm)}
                          style={{
                            ...styles.methodBtn,
                            background: partialMethod === pm ? "#3b82f6" : "#F8FAFC",
                            color: partialMethod === pm ? "#fff" : "#475569",
                            borderColor: partialMethod === pm ? "#3b82f6" : "#e2e8f0",
                            fontSize: "12px"
                          }}
                        >
                          {pm}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={styles.field}>
                <label style={styles.label}>Amount Received (₹)</label>
                <div style={styles.inputWrapper}>
                  <IndianRupee size={18} style={styles.inputIcon} />
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    value={paidAmount}
                    onChange={e => setPaidAmount(e.target.value)}
                    style={styles.mainInput}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Summary */}
        <div style={styles.rightCol}>
          <div style={styles.summaryCard}>
            <div style={styles.customerSec}>
              <h4 style={styles.secLabel}>Customer</h4>
              <div style={styles.selectWrapper}>
                <User size={14} style={styles.selectIcon} />
                <select 
                  value={customerId} 
                  onChange={e => setCustomerId(e.target.value)}
                  style={styles.select}
                >
                  <option value="">Select Customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} • {c.phone}</option>)}
                </select>
              </div>

              <AnimatePresence>
                {customerId && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={styles.custPreview}
                  >
                    <div style={styles.custAvatar}>{getCustomer(customerId)?.name.charAt(0)}</div>
                    <div>
                      <div style={styles.custName}>{getCustomer(customerId)?.name}</div>
                      <div style={styles.custPhone}>{getCustomer(customerId)?.phone}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div style={styles.summarySec}>
              <h4 style={styles.secLabel}>Summary</h4>
              <div style={styles.sumRow}>
                <span>Total</span>
                <span style={{ fontWeight: "600" }}>₹{totalAmount.toLocaleString()}</span>
              </div>
              <div style={styles.sumRow}>
                <span>Discount</span>
                <span style={{ color: "#16a34a" }}>-₹0</span>
              </div>
              <div style={styles.divider} />
              <div style={styles.totalRow}>
                <span>Payable</span>
                <span>₹{totalAmount.toLocaleString()}</span>
              </div>
              
              <div style={styles.dueAlert}>
                <div style={styles.dueRow}>
                  <span>Received</span>
                  <span style={{ color: "#16a34a" }}>+₹{Number(paidAmount || 0).toLocaleString()}</span>
                </div>
                <div style={styles.dueRow}>
                  <span>Balance</span>
                  <span style={{ color: remainingAmount > 0 ? "#ef4444" : "#16a34a" }}>
                    ₹{remainingAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <button 
              onClick={submitOrder} 
              disabled={loading} 
              style={styles.checkoutBtn}
            >
              {loading ? "Processing..." : <>Create Order <ChevronRight size={16} /></>}
            </button>
          </div>

          <div style={styles.tipsBox}>
            <Info size={14} />
            <p style={{ margin: 0 }}>A receipt will be generated after confirmation.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const styles = {
  container: { padding: "24px 0 40px" },
  header: { marginBottom: "24px" },
  titleArea: { flex: 1 },
  title: { fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 4px", letterSpacing: "-0.5px" },
  subtitle: { color: "#64748b", fontSize: "14px", fontWeight: "400" },

  grid: { display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px", alignItems: "start" },
  leftCol: { display: "flex", flexDirection: "column", gap: "24px" },
  rightCol: { display: "flex", flexDirection: "column", gap: "20px" },

  mainCard: { padding: "28px", background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  cardTitle: { display: "flex", alignItems: "center", gap: "10px", fontSize: "16px", fontWeight: "700", margin: 0, color: "#0F172A" },
  addItemBtn: { display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "#F8FAFC", border: "1px solid #e2e8f0", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "12px", color: "#475569", fontFamily: "inherit" },

  itemsList: { display: "flex", flexDirection: "column", gap: "12px" },
  itemRow: { display: "flex", alignItems: "center", gap: "16px", padding: "16px", background: "#F8FAFC", border: "1px solid #f1f5f9", borderRadius: "12px" },
  itemSelect: { flex: 1 },
  selectWrapper: { position: "relative", display: "flex", alignItems: "center" },
  selectIcon: { position: "absolute", left: "12px", color: "#94a3b8", pointerEvents: "none" },
  select: { width: "100%", padding: "10px 12px 10px 36px", borderRadius: "10px", border: "1px solid #e2e8f0", appearance: "none", background: "#fff", fontWeight: "500", color: "#475569", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" },
  
  qtyBox: { width: "80px" },
  qtyLabel: { fontSize: "10px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", marginBottom: "4px" },
  qtyInput: { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", fontWeight: "700", textAlign: "center", color: "#0F172A", outline: "none", fontSize: "13px", fontFamily: "inherit" },
  
  priceCol: { width: "120px", textAlign: "right" },
  priceLabel: { fontSize: "10px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", marginBottom: "4px" },
  priceVal: { fontWeight: "700", color: "#0F172A", fontSize: "15px" },
  
  removeBtn: { padding: "8px", color: "#94a3b8", background: "none", border: "none", cursor: "pointer", borderRadius: "6px" },

  paymentCard: { padding: "28px", background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  paymentForm: {},
  field: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.3px" },
  inputWrapper: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: "14px", color: "#94a3b8" },
  mainInput: { width: "100%", padding: "14px 14px 14px 44px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "18px", fontWeight: "700", outline: "none", color: "#0F172A", background: "#F8FAFC", fontFamily: "inherit" },

  paymentMethodSection: { marginBottom: "20px" },
  methodGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginTop: "10px" },
  methodBtn: { padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#F8FAFC", cursor: "pointer", fontWeight: "700", fontSize: "13px", transition: "all 0.2s", fontFamily: "inherit" },

  summaryCard: { padding: "28px", background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", position: "sticky", top: "24px", className: "co-summary-card" },
  customerSec: { paddingBottom: "24px", borderBottom: "1px solid #f1f5f9", marginBottom: "24px" },
  secLabel: { fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px" },
  custPreview: { marginTop: "16px", display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "#F8FAFC", borderRadius: "10px", overflow: "hidden" },
  custAvatar: { width: "40px", height: "40px", background: "#2563EB", color: "#fff", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "16px" },
  custName: { fontWeight: "600", color: "#0F172A", fontSize: "14px" },
  custPhone: { fontSize: "12px", color: "#94a3b8", fontWeight: "400" },

  summarySec: { marginBottom: "24px" },
  sumRow: { display: "flex", justifyContent: "space-between", marginBottom: "12px", color: "#64748b", fontSize: "14px", fontWeight: "400" },
  divider: { height: "1px", background: "#f1f5f9", margin: "16px 0" },
  totalRow: { display: "flex", justifyContent: "space-between", fontSize: "20px", fontWeight: "800", color: "#0F172A" },
  dueAlert: { marginTop: "20px", padding: "16px", background: "#F8FAFC", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "10px" },
  dueRow: { display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "600", color: "#475569" },

  checkoutBtn: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", border: "none", borderRadius: "12px", color: "#fff", fontSize: "15px", fontWeight: "700", cursor: "pointer", background: "#F97316", boxShadow: "0 4px 12px rgba(249, 115, 22, 0.25)", fontFamily: "inherit" },
  tipsBox: { display: "flex", gap: "10px", color: "#94a3b8", fontSize: "12px", padding: "0 8px", fontWeight: "400", alignItems: "center" }
};


export default CreateOrder;