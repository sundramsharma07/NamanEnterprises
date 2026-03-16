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

  const getProductById = (productId) => {
    return products.find((p) => String(p.id) === String(productId));
  };

  const getReservedQuantityForProduct = (productId, currentIndex) => {
    return items.reduce((sum, item, index) => {
      if (index === currentIndex) return sum;
      if (String(item.product_id) === String(productId)) {
        return sum + Number(item.quantity || 0);
      }
      return sum;
    }, 0);
  };

  const getAvailableStockForRow = (productId, currentIndex) => {
    const product = getProductById(productId);
    if (!product) return 0;

    const stock = Number(product.stock || 0);
    const reserved = getReservedQuantityForProduct(productId, currentIndex);
    return Math.max(stock - reserved, 0);
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];

    if (field === "product_id") {
      updated[index][field] = value;
      const available = getAvailableStockForRow(value, index);

      if (!updated[index].quantity || Number(updated[index].quantity) <= 0) {
        updated[index].quantity = 1;
      }

      if (available > 0 && Number(updated[index].quantity) > available) {
        updated[index].quantity = available;
      }

      if (available === 0) {
        updated[index].quantity = 1;
      }
    } else if (field === "quantity") {
      const productId = updated[index].product_id;
      const available = getAvailableStockForRow(productId, index);
      let qty = Number(value);

      if (!value || Number.isNaN(qty)) {
        qty = 1;
      }

      if (qty < 1) qty = 1;

      if (productId && available > 0 && qty > available) {
        qty = available;
      }

      updated[index][field] = qty;
    } else {
      updated[index][field] = value;
    }

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

  const filteredProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.variant?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = products.filter(
    (p) => Number(p.stock || 0) <= Number(p.min_stock || 0)
  ).length;

  const outOfStockCount = products.filter(
    (p) => Number(p.stock || 0) <= 0
  ).length;

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

    // combine duplicate products and validate stock once more before submit
    const groupedItemsMap = {};

    for (const item of cleanedItems) {
      if (!groupedItemsMap[item.product_id]) {
        groupedItemsMap[item.product_id] = 0;
      }
      groupedItemsMap[item.product_id] += Number(item.quantity);
    }

    for (const [productId, quantity] of Object.entries(groupedItemsMap)) {
      const product = getProductById(productId);

      if (!product) {
        alert("One of the selected products was not found");
        return;
      }

      const availableStock = Number(product.stock || 0);

      if (quantity > availableStock) {
        alert(
          `Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${quantity}`
        );
        return;
      }
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

      // refresh product stock after successful order
      const productRes = await api.get("/products");
      setProducts(Array.isArray(productRes.data) ? productRes.data : []);
    } catch (error) {
      console.error("Failed to create order:", error);
      console.log("Backend response:", error.response?.data);

      alert(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to create order"
      );

      try {
        const productRes = await api.get("/products");
        setProducts(Array.isArray(productRes.data) ? productRes.data : []);
      } catch (refreshError) {
        console.error("Failed to refresh products after order error:", refreshError);
      }
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

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Create New Order</h1>
          <p style={styles.subtitle}>
            Add products and create an order for your customer
          </p>
        </div>
      </div>

      <div style={styles.topStats}>
        <div style={styles.topStatCard}>
          <div style={styles.topStatIcon}>📦</div>
          <div>
            <div style={styles.topStatLabel}>Products Available</div>
            <div style={styles.topStatValue}>{products.length}</div>
          </div>
        </div>

        <div style={styles.topStatCard}>
          <div style={styles.topStatIcon}>⚠️</div>
          <div>
            <div style={styles.topStatLabel}>Low Stock</div>
            <div style={styles.topStatValue}>{lowStockCount}</div>
          </div>
        </div>

        <div style={styles.topStatCard}>
          <div style={styles.topStatIcon}>🚫</div>
          <div>
            <div style={styles.topStatLabel}>Out of Stock</div>
            <div style={styles.topStatValue}>{outOfStockCount}</div>
          </div>
        </div>
      </div>

      <div style={styles.contentGrid}>
        <div style={styles.leftColumn}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Select Customer</h3>

            <select
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                const customer = customers.find((c) => String(c.id) === e.target.value);
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
                  <div style={styles.customerContact}>📞 {selectedCustomer.phone}</div>
                  {selectedCustomer.address && (
                    <div style={styles.customerAddress}>
                      📍 {selectedCustomer.address}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={styles.summaryCard}>
            <h3 style={styles.summaryCardTitle}>Order Summary</h3>

            <div style={styles.summaryRow}>
              <span>Total Items:</span>
              <span style={styles.summaryValue}>
                {items.filter((i) => i.product_id).length}
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

            <div
              style={{
                ...styles.summaryRow,
                color: remainingAmount > 0 ? "#fecaca" : "#bbf7d0"
              }}
            >
              <span style={styles.remainingLabel}>Remaining:</span>
              <span style={styles.remainingAmount}>₹{remainingAmount}</span>
            </div>
          </div>
        </div>

        <div style={styles.rightColumn}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Add Products</h3>
              <button onClick={addItem} style={styles.addButton}>
                + Add Product
              </button>
            </div>

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
                <button onClick={() => setSearchTerm("")} style={styles.clearButton}>
                  ✕
                </button>
              )}
            </div>

            <div style={styles.itemsContainer}>
              {items.map((item, index) => {
                const selectedProduct = products.find(
                  (p) => String(p.id) === String(item.product_id)
                );

                const availableForRow = item.product_id
                  ? getAvailableStockForRow(item.product_id, index)
                  : 0;

                const totalStock = selectedProduct ? Number(selectedProduct.stock || 0) : 0;
                const minStock = selectedProduct
                  ? Number(selectedProduct.min_stock || 0)
                  : 0;
                const quantity = Number(item.quantity || 0);
                const exceedsStock =
                  selectedProduct && quantity > availableForRow && availableForRow >= 0;
                const isLowStock =
                  selectedProduct && totalStock <= minStock && totalStock > 0;
                const isOutOfStock = selectedProduct && totalStock <= 0;

                return (
                  <div key={index} style={styles.itemRow} className="fade-in">
                    <div style={styles.itemNumber}>#{index + 1}</div>

                    <div style={styles.itemFields}>
                      <div style={styles.productFieldColumn}>
                        <select
                          value={item.product_id}
                          onChange={(e) => updateItem(index, "product_id", e.target.value)}
                          style={styles.productSelect}
                        >
                          <option value="">Select Product</option>
                          {filteredProducts.map((product) => {
                            const rowAvailable = getAvailableStockForRow(product.id, index);
                            const stock = Number(product.stock || 0);
                            const lowStock =
                              stock <= Number(product.min_stock || 0) && stock > 0;

                            return (
                              <option key={product.id} value={product.id}>
                                {product.name}{" "}
                                {product.variant ? `(${product.variant})` : ""} - ₹
                                {product.price}/{product.unit} | Stock: {rowAvailable}
                                {stock <= 0 ? " | Out of stock" : lowStock ? " | Low stock" : ""}
                              </option>
                            );
                          })}
                        </select>

                        {selectedProduct && (
                          <div style={styles.stockInfoRow}>
                            <span style={styles.stockMeta}>
                              Available: <strong>{availableForRow}</strong> {selectedProduct.unit}
                            </span>
                            <span style={styles.stockMeta}>
                              Total Stock: <strong>{totalStock}</strong>
                            </span>
                            <span
                              style={{
                                ...styles.stockBadge,
                                background: isOutOfStock
                                  ? "#fee2e2"
                                  : isLowStock
                                  ? "#fef3c7"
                                  : "#dcfce7",
                                color: isOutOfStock
                                  ? "#dc2626"
                                  : isLowStock
                                  ? "#b45309"
                                  : "#15803d"
                              }}
                            >
                              {isOutOfStock
                                ? "Out of Stock"
                                : isLowStock
                                ? "Low Stock"
                                : "In Stock"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div style={styles.quantityWrapper}>
                        <label style={styles.quantityLabel}>Qty:</label>
                        <input
                          type="number"
                          min="1"
                          max={selectedProduct ? availableForRow || 1 : undefined}
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", e.target.value)}
                          style={{
                            ...styles.quantityInput,
                            borderColor: exceedsStock ? "#ef4444" : "#e2e8f0"
                          }}
                          disabled={isOutOfStock}
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

                    {selectedProduct && (
                      <div style={styles.itemWarnings}>
                        {availableForRow === 0 && (
                          <div style={styles.errorText}>
                            No stock available for this product
                          </div>
                        )}
                        {quantity > availableForRow && availableForRow > 0 && (
                          <div style={styles.errorText}>
                            Quantity exceeds available stock. Max allowed here: {availableForRow}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

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
                  cursor: loading ? "wait" : "pointer"
                }}
              >
                {loading ? (
                  <>
                    <div style={styles.buttonSpinner} />
                    Creating Order...
                  </>
                ) : (
                  "Create Order"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.tipsCard}>
        <div style={styles.tipsIcon}>💡</div>
        <div style={styles.tipsContent}>
          <strong style={styles.tipsTitle}>Quick Tips:</strong>
          <span>• Add multiple products to create a complete order</span>
          <span>• Paid amount cannot exceed total amount</span>
          <span>• Remaining amount will be marked as due</span>
          <span>• Quantity cannot exceed available stock</span>
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
    marginBottom: "24px"
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
  topStats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "24px"
  },
  topStatCard: {
    background: "white",
    borderRadius: "16px",
    padding: "18px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.08)"
  },
  topStatIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px"
  },
  topStatLabel: {
    fontSize: "13px",
    color: "#64748b"
  },
  topStatValue: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#0f172a"
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
  summaryCardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    margin: "0 0 20px 0",
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
    maxHeight: "500px",
    overflowY: "auto",
    padding: "4px"
  },
  itemRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    flexWrap: "wrap"
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
    color: "#475569",
    marginTop: "4px"
  },
  itemFields: {
    flex: 1,
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    minWidth: "0"
  },
  productFieldColumn: {
    flex: 2,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: "0"
  },
  productSelect: {
    width: "100%",
    padding: "10px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    background: "white"
  },
  stockInfoRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    alignItems: "center"
  },
  stockMeta: {
    fontSize: "12px",
    color: "#475569",
    background: "#eef2ff",
    padding: "4px 8px",
    borderRadius: "999px"
  },
  stockBadge: {
    fontSize: "12px",
    fontWeight: "600",
    padding: "4px 10px",
    borderRadius: "999px"
  },
  quantityWrapper: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    minWidth: "140px"
  },
  quantityLabel: {
    fontSize: "14px",
    color: "#64748b"
  },
  quantityInput: {
    width: "90px",
    padding: "10px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none"
  },
  itemTotal: {
    minWidth: "90px",
    fontWeight: "600",
    color: "#0f172a",
    paddingTop: "10px"
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
    transition: "all 0.2s ease",
    marginTop: "4px"
  },
  itemWarnings: {
    width: "100%",
    marginLeft: "44px"
  },
  errorText: {
    fontSize: "12px",
    color: "#dc2626",
    fontWeight: "500"
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