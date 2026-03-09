import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

function CreateOrder() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [items, setItems] = useState([{ product_id: "", quantity: 1 }]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const customerRes = await api.get("/customers");
        const productRes = await api.get("/products");

        setCustomers(Array.isArray(customerRes.data) ? customerRes.data : []);
        setProducts(Array.isArray(productRes.data) ? productRes.data : []);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    loadData();
  }, []);

  const addItem = () => {
    setItems([...items, { product_id: "", quantity: 1 }]);
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = field === "quantity" ? Number(value) : value;
    setItems(updated);
  };

  const removeItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated.length ? updated : [{ product_id: "", quantity: 1 }]);
  };

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const product = products.find((p) => String(p.id) === String(item.product_id));
      if (!product) return sum;
      return sum + Number(product.price) * Number(item.quantity || 0);
    }, 0);
  }, [items, products]);

  const remainingAmount = totalAmount - Number(paidAmount || 0);

  // Filter products based on search
  const filteredProducts = products.filter(product => 
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.variant?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const submitOrder = async () => {
    const cleanedItems = items
      .filter((item) => item.product_id && Number(item.quantity) > 0)
      .map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity)
      }));

    if (!customerId) {
      alert("Please select a customer");
      return;
    }

    if (cleanedItems.length === 0) {
      alert("Please add at least one valid product");
      return;
    }

    if (Number(paidAmount || 0) < 0) {
      alert("Paid amount cannot be negative");
      return;
    }

    if (Number(paidAmount || 0) > totalAmount) {
      alert("Paid amount cannot be greater than total amount");
      return;
    }

    const payload = {
      customer_id: Number(customerId),
      paid_amount: Number(paidAmount || 0),
      items: cleanedItems
    };

    console.log("Submitting order payload:", payload);

    try {
      setLoading(true);

      const res = await api.post("/orders", payload);

      console.log("Order created:", res.data);
      alert(`Order created successfully: ${res.data.order_id}`);

      setCustomerId("");
      setPaidAmount("");
      setItems([{ product_id: "", quantity: 1 }]);
      setSelectedCustomer(null);
      setSearchTerm("");
    } catch (error) {
      console.error("Failed to create order:", error);
      console.log("Backend response:", error.response?.data);

      alert(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to create order"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .fade-in {
          animation: slideIn 0.3s ease forwards;
        }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Create New Order</h1>
          <p style={styles.subtitle}>
            Add products and create an order for your customer
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.contentGrid}>
        {/* Left Column - Customer Selection */}
        <div style={styles.leftColumn}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Select Customer</h3>
            
            <select 
              value={customerId} 
              onChange={(e) => {
                setCustomerId(e.target.value);
                const customer = customers.find(c => String(c.id) === e.target.value);
                setSelectedCustomer(customer);
              }}
              style={styles.select}
            >
              <option value="">Choose a customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.phone}
                </option>
              ))}
            </select>

            {selectedCustomer && (
              <div style={styles.customerDetails} className="fade-in">
                <div style={styles.customerAvatar}>
                  {selectedCustomer.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={styles.customerName}>{selectedCustomer.name}</div>
                  <div style={styles.customerContact}>
                    📞 {selectedCustomer.phone}
                  </div>
                  {selectedCustomer.address && (
                    <div style={styles.customerAddress}>
                      📍 {selectedCustomer.address}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Card */}
          <div style={styles.summaryCard}>
            <h3 style={styles.cardTitle}>Order Summary</h3>
            
            <div style={styles.summaryRow}>
              <span>Total Items:</span>
              <span style={styles.summaryValue}>
                {items.filter(i => i.product_id).length}
              </span>
            </div>
            
            <div style={styles.summaryRow}>
              <span>Total Quantity:</span>
              <span style={styles.summaryValue}>
                {items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)}
              </span>
            </div>
            
            <div style={styles.divider} />
            
            <div style={styles.summaryRow}>
              <span style={styles.totalLabel}>Total Amount:</span>
              <span style={styles.totalAmount}>₹{totalAmount}</span>
            </div>
            
            <div style={styles.summaryRow}>
              <span>Paid Amount:</span>
              <span style={styles.paidAmount}>₹{Number(paidAmount || 0)}</span>
            </div>
            
            <div style={styles.divider} />
            
            <div style={{
              ...styles.summaryRow,
              color: remainingAmount > 0 ? '#dc2626' : '#16a34a'
            }}>
              <span style={styles.remainingLabel}>Remaining:</span>
              <span style={styles.remainingAmount}>₹{remainingAmount}</span>
            </div>
          </div>
        </div>

        {/* Right Column - Products */}
        <div style={styles.rightColumn}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Add Products</h3>
              <button 
                onClick={addItem} 
                style={styles.addButton}
              >
                + Add Product
              </button>
            </div>

            {/* Search Products */}
            <div style={styles.searchWrapper}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search products by name, category, or variant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  style={styles.clearButton}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Product Items */}
            <div style={styles.itemsContainer}>
              {items.map((item, index) => {
                const selectedProduct = products.find(p => String(p.id) === String(item.product_id));
                
                return (
                  <div key={index} style={styles.itemRow} className="fade-in">
                    <div style={styles.itemNumber}>#{index + 1}</div>
                    
                    <div style={styles.itemFields}>
                      <select
                        value={item.product_id}
                        onChange={(e) => updateItem(index, "product_id", e.target.value)}
                        style={styles.productSelect}
                      >
                        <option value="">Select Product</option>
                        {filteredProducts.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} {product.variant ? `(${product.variant})` : ""} - ₹{product.price}/{product.unit}
                          </option>
                        ))}
                      </select>

                      <div style={styles.quantityWrapper}>
                        <label style={styles.quantityLabel}>Qty:</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", e.target.value)}
                          style={styles.quantityInput}
                        />
                      </div>

                      {selectedProduct && (
                        <div style={styles.itemTotal}>
                          ₹{Number(selectedProduct.price) * Number(item.quantity || 0)}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      style={styles.removeButton}
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Payment Section */}
            <div style={styles.paymentSection}>
              <h4 style={styles.paymentTitle}>Payment Details</h4>
              
              <div style={styles.paymentRow}>
                <label style={styles.paymentLabel}>Paid Amount:</label>
                <div style={styles.paymentInputWrapper}>
                  <span style={styles.currencySymbol}>₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    style={styles.paymentInput}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={styles.actionButtons}>
              <button
                type="button"
                onClick={() => {
                  setCustomerId("");
                  setPaidAmount("");
                  setItems([{ product_id: "", quantity: 1 }]);
                  setSelectedCustomer(null);
                  setSearchTerm("");
                }}
                style={styles.cancelButton}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={submitOrder}
                disabled={loading}
                style={{
                  ...styles.submitButton,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'wait' : 'pointer'
                }}
              >
                {loading ? (
                  <>
                    <div style={styles.buttonSpinner} />
                    Creating Order...
                  </>
                ) : (
                  'Create Order'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div style={styles.tipsCard}>
        <div style={styles.tipsIcon}>💡</div>
        <div style={styles.tipsContent}>
          <strong style={styles.tipsTitle}>Quick Tips:</strong>
          <span>• Add multiple products to create a complete order</span>
          <span>• Paid amount cannot exceed total amount</span>
          <span>• Remaining amount will be marked as due</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "32px",
    maxWidth: "1400px",
    margin: "0 auto",
    background: "#f8fafc",
    minHeight: "100vh"
  },
  header: {
    marginBottom: "32px"
  },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 8px 0",
    letterSpacing: "-0.02em"
  },
  subtitle: {
    color: "#475569",
    fontSize: "16px",
    margin: 0
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: "24px",
    marginBottom: "24px"
  },
  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "24px"
  },
  rightColumn: {
    flex: 1
  },
  card: {
    background: "white",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
    border: "1px solid #e2e8f0"
  },
  summaryCard: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "20px",
    padding: "24px",
    color: "white"
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    margin: "0 0 20px 0",
    color: "#0f172a"
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },
  select: {
    width: "100%",
    padding: "12px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    outline: "none",
    background: "white",
    cursor: "pointer",
    marginBottom: "16px"
  },
  customerDetails: {
    display: "flex",
    gap: "16px",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0"
  },
  customerAvatar: {
    width: "48px",
    height: "48px",
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "20px",
    fontWeight: "600"
  },
  customerName: {
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "4px"
  },
  customerContact: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "2px"
  },
  customerAddress: {
    fontSize: "13px",
    color: "#64748b"
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
    fontSize: "14px"
  },
  summaryValue: {
    fontWeight: "600"
  },
  divider: {
    height: "1px",
    background: "rgba(255,255,255,0.2)",
    margin: "16px 0"
  },
  totalLabel: {
    fontSize: "16px",
    fontWeight: "600"
  },
  totalAmount: {
    fontSize: "20px",
    fontWeight: "700"
  },
  paidAmount: {
    color: "#4ade80"
  },
  remainingLabel: {
    fontSize: "14px"
  },
  remainingAmount: {
    fontSize: "18px",
    fontWeight: "700"
  },
  addButton: {
    padding: "8px 16px",
    background: "#3b82f6",
    border: "none",
    borderRadius: "10px",
    color: "white",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  searchWrapper: {
    position: "relative",
    marginBottom: "20px"
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "16px",
    color: "#64748b"
  },
  searchInput: {
    width: "100%",
    padding: "12px 20px 12px 44px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.2s ease",
    background: "#f8fafc"
  },
  clearButton: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px 8px"
  },
  itemsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "24px",
    maxHeight: "400px",
    overflowY: "auto",
    padding: "4px"
  },
  itemRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0"
  },
  itemNumber: {
    width: "32px",
    height: "32px",
    background: "#e2e8f0",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "600",
    color: "#475569"
  },
  itemFields: {
    flex: 1,
    display: "flex",
    gap: "12px",
    alignItems: "center"
  },
  productSelect: {
    flex: 2,
    padding: "10px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    background: "white"
  },
  quantityWrapper: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  quantityLabel: {
    fontSize: "14px",
    color: "#64748b"
  },
  quantityInput: {
    width: "80px",
    padding: "10px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none"
  },
  itemTotal: {
    minWidth: "80px",
    fontWeight: "600",
    color: "#0f172a"
  },
  removeButton: {
    width: "32px",
    height: "32px",
    background: "#fee2e2",
    border: "none",
    borderRadius: "8px",
    color: "#ef4444",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease"
  },
  paymentSection: {
    background: "#f8fafc",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "20px"
  },
  paymentTitle: {
    fontSize: "16px",
    fontWeight: "600",
    margin: "0 0 16px 0",
    color: "#0f172a"
  },
  paymentRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  paymentLabel: {
    width: "100px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#475569"
  },
  paymentInputWrapper: {
    flex: 1,
    position: "relative"
  },
  currencySymbol: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#64748b",
    fontSize: "14px"
  },
  paymentInput: {
    width: "100%",
    padding: "12px 12px 12px 28px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "16px",
    outline: "none",
    transition: "all 0.2s ease"
  },
  actionButtons: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end"
  },
  cancelButton: {
    padding: "12px 24px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  submitButton: {
    padding: "12px 32px",
    background: "#3b82f6",
    border: "none",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
    color: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 6px -1px rgba(59,130,246,0.3)"
  },
  buttonSpinner: {
    width: "16px",
    height: "16px",
    border: "2px solid white",
    borderTop: "2px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  tipsCard: {
    background: "#f1f5f9",
    borderRadius: "16px",
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    border: "1px solid #e2e8f0"
  },
  tipsIcon: {
    fontSize: "24px"
  },
  tipsContent: {
    display: "flex",
    gap: "24px",
    fontSize: "14px",
    color: "#475569",
    flexWrap: "wrap"
  },
  tipsTitle: {
    color: "#0f172a"
  }
};

export default CreateOrder;