import { useEffect, useState } from "react";
import api from "../services/api";

function Products() {
  const [products, setProducts] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [stockUpdatingId, setStockUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [stockForm, setStockForm] = useState({});
  const [historyProductId, setHistoryProductId] = useState(null);
  const [stockHistory, setStockHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products");
      const data = Array.isArray(res.data) ? res.data : [];
      setProducts(data);

      const uniqueCategories = [...new Set(data.map((p) => p.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handlePriceChange = (id, value) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === id ? { ...product, price: value } : product
      )
    );
  };

  const handleStockFormChange = (id, field, value) => {
    setStockForm((prev) => ({
      ...prev,
      [id]: {
        type: prev[id]?.type || "IN",
        quantity: prev[id]?.quantity || "",
        note: prev[id]?.note || "",
        [field]: value
      }
    }));
  };

  const updatePrice = async (product) => {
    try {
      setUpdatingId(product.id);

      await api.put(`/products/${product.id}`, {
        category: product.category,
        name: product.name,
        variant: product.variant,
        unit: product.unit,
        price: Number(product.price),
        is_active: product.is_active,
        min_stock: Number(product.min_stock || 0)
      });

      alert("Price updated successfully");
      fetchProducts();
    } catch (error) {
      console.error("Failed to update price:", error);
      alert(error?.response?.data?.message || "Failed to update price");
    } finally {
      setUpdatingId(null);
    }
  };

  const updateStock = async (productId) => {
    const current = stockForm[productId] || {};
    const payload = {
      type: current.type || "IN",
      quantity: Number(current.quantity),
      note: current.note || ""
    };

    if (!payload.quantity || payload.quantity <= 0) {
      alert("Enter a valid stock quantity");
      return;
    }

    try {
      setStockUpdatingId(productId);

      await api.put(`/products/${productId}/stock`, payload);

      alert("Stock updated successfully");
      setStockForm((prev) => ({
        ...prev,
        [productId]: {
          type: "IN",
          quantity: "",
          note: ""
        }
      }));
      fetchProducts();
    } catch (error) {
      console.error("Failed to update stock:", error);
      alert(error?.response?.data?.message || "Failed to update stock");
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
      console.error("Failed to fetch stock history:", error);
      alert(error?.response?.data?.message || "Failed to fetch stock history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.variant?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      filterCategory === "all" || product.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.is_active).length;
  const lowStockCount = products.filter(
    (p) => Number(p.stock || 0) <= Number(p.min_stock || 0)
  ).length;
  const totalValue = products.reduce(
    (sum, p) => sum + (Number(p.price || 0) * Number(p.stock || 0)),
    0
  );

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading products...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .price-input:focus,
        .stock-input:focus,
        .stock-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        .update-button:active {
          transform: scale(0.95);
        }
      `}</style>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Products</h1>
          <p style={styles.subtitle}>
            Manage your product catalog and inventory • {totalProducts} total products
          </p>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📦</div>
          <div>
            <div style={styles.statLabel}>Total Products</div>
            <div style={styles.statValue}>{totalProducts}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>✅</div>
          <div>
            <div style={styles.statLabel}>Active Products</div>
            <div style={styles.statValue}>{activeProducts}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>⚠️</div>
          <div>
            <div style={styles.statLabel}>Low Stock Items</div>
            <div style={styles.statValue}>{lowStockCount}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>
          <div>
            <div style={styles.statLabel}>Inventory Value</div>
            <div style={styles.statValue}>₹{totalValue.toLocaleString("en-IN")}</div>
          </div>
        </div>
      </div>

      <div style={styles.filterContainer}>
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

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={styles.categorySelect}
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.tableContainer}>
        <div style={styles.tableScroll}>
          <table style={styles.table}>
            <thead style={styles.tableHead}>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Product</th>
                <th style={styles.th}>Variant</th>
                <th style={styles.th}>Unit</th>
                <th style={styles.th}>Price (₹)</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}>Min Stock</th>
                <th style={styles.th}>Stock Status</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Price Action</th>
                <th style={styles.th}>Stock Update</th>
                <th style={styles.th}>History</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const form = stockForm[product.id] || {
                    type: "IN",
                    quantity: "",
                    note: ""
                  };

                  const stock = Number(product.stock || 0);
                  const minStock = Number(product.min_stock || 0);
                  const isLowStock = stock <= minStock;

                  return (
                    <tr key={product.id} style={styles.tableRow}>
                      <td style={styles.td}>
                        <span style={styles.id}>#{product.id}</span>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.category}>{product.category}</span>
                      </td>

                      <td style={styles.td}>
                        <div style={styles.productInfo}>
                          <span style={styles.productName}>{product.name}</span>
                        </div>
                      </td>

                      <td style={styles.td}>
                        {product.variant ? (
                          <span style={styles.variant}>{product.variant}</span>
                        ) : (
                          <span style={styles.placeholder}>-</span>
                        )}
                      </td>

                      <td style={styles.td}>
                        <span style={styles.unit}>{product.unit}</span>
                      </td>

                      <td style={styles.td}>
                        <div style={styles.priceCell}>
                          <span style={styles.currency}>₹</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={product.price}
                            onChange={(e) =>
                              handlePriceChange(product.id, e.target.value)
                            }
                            style={styles.priceInput}
                            className="price-input"
                            disabled={updatingId === product.id}
                          />
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.stockValue}>{stock}</span>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.stockValue}>{minStock}</span>
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: isLowStock ? "#fef2f2" : "#ecfdf5",
                            color: isLowStock ? "#dc2626" : "#16a34a"
                          }}
                        >
                          {isLowStock ? "Low Stock" : "Healthy"}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: product.is_active
                              ? "#22c55e20"
                              : "#ef444420",
                            color: product.is_active ? "#16a34a" : "#dc2626"
                          }}
                        >
                          {product.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <button
                          onClick={() => updatePrice(product)}
                          disabled={updatingId === product.id}
                          style={{
                            ...styles.updateButton,
                            opacity: updatingId === product.id ? 0.7 : 1,
                            cursor: updatingId === product.id ? "wait" : "pointer"
                          }}
                          className="update-button"
                        >
                          {updatingId === product.id ? (
                            <div style={styles.buttonSpinner} />
                          ) : (
                            "Update Price"
                          )}
                        </button>
                      </td>

                      <td style={styles.td}>
                        <div style={styles.stockUpdateBox}>
                          <select
                            value={form.type}
                            onChange={(e) =>
                              handleStockFormChange(product.id, "type", e.target.value)
                            }
                            style={styles.stockSelect}
                            className="stock-select"
                          >
                            <option value="IN">IN</option>
                            <option value="OUT">OUT</option>
                            <option value="ADJUSTMENT">ADJUSTMENT</option>
                          </select>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder={
                              form.type === "ADJUSTMENT" ? "Final stock" : "Qty"
                            }
                            value={form.quantity}
                            onChange={(e) =>
                              handleStockFormChange(product.id, "quantity", e.target.value)
                            }
                            style={styles.stockInput}
                            className="stock-input"
                          />

                          <input
                            type="text"
                            placeholder="Note"
                            value={form.note}
                            onChange={(e) =>
                              handleStockFormChange(product.id, "note", e.target.value)
                            }
                            style={styles.noteInput}
                          />

                          <button
                            onClick={() => updateStock(product.id)}
                            disabled={stockUpdatingId === product.id}
                            style={{
                              ...styles.stockButton,
                              opacity: stockUpdatingId === product.id ? 0.7 : 1,
                              cursor:
                                stockUpdatingId === product.id ? "wait" : "pointer"
                            }}
                          >
                            {stockUpdatingId === product.id ? "Saving..." : "Update"}
                          </button>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <button
                          onClick={() => viewStockHistory(product.id)}
                          style={styles.historyButton}
                        >
                          View History
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="13" style={styles.noData}>
                    {searchTerm || filterCategory !== "all" ? (
                      <div>
                        <p style={styles.noDataText}>No products match your filters</p>
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setFilterCategory("all");
                          }}
                          style={styles.clearFiltersButton}
                        >
                          Clear Filters
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p style={styles.noDataText}>No products found</p>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredProducts.length > 0 && (
        <div style={styles.resultsInfo}>
          Showing {filteredProducts.length} of {totalProducts} products
          {(searchTerm || filterCategory !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterCategory("all");
              }}
              style={styles.clearAllButton}
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {historyProductId && (
        <div style={styles.historyPanel}>
          <div style={styles.historyHeader}>
            <h3 style={styles.historyTitle}>
              Stock History for Product #{historyProductId}
            </h3>
            <button
              onClick={() => {
                setHistoryProductId(null);
                setStockHistory([]);
              }}
              style={styles.closeHistoryButton}
            >
              Close
            </button>
          </div>

          {historyLoading ? (
            <p style={styles.historyLoading}>Loading history...</p>
          ) : stockHistory.length > 0 ? (
            <div style={styles.historyTableWrapper}>
              <table style={styles.historyTable}>
                <thead>
                  <tr>
                    <th style={styles.historyTh}>Type</th>
                    <th style={styles.historyTh}>Qty</th>
                    <th style={styles.historyTh}>Old</th>
                    <th style={styles.historyTh}>New</th>
                    <th style={styles.historyTh}>Note</th>
                    <th style={styles.historyTh}>Order Ref</th>
                    <th style={styles.historyTh}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stockHistory.map((row) => (
                    <tr key={row.id}>
                      <td style={styles.historyTd}>{row.movement_type}</td>
                      <td style={styles.historyTd}>{row.quantity}</td>
                      <td style={styles.historyTd}>{row.old_stock}</td>
                      <td style={styles.historyTd}>{row.new_stock}</td>
                      <td style={styles.historyTd}>{row.note || "-"}</td>
                      <td style={styles.historyTd}>{row.ref_order_id || "-"}</td>
                      <td style={styles.historyTd}>
                        {row.created_at
                          ? new Date(row.created_at).toLocaleString("en-IN")
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={styles.historyLoading}>No stock history found</p>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "32px",
    maxWidth: "1600px",
    margin: "0 auto",
    background: "#f8fafc",
    minHeight: "100vh"
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    gap: "16px"
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "4px solid #e2e8f0",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  loadingText: {
    color: "#64748b",
    fontSize: "16px"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
    flexWrap: "wrap",
    gap: "16px"
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
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginBottom: "32px"
  },
  statCard: {
    background: "white",
    padding: "20px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
    border: "1px solid #e2e8f0"
  },
  statIcon: {
    fontSize: "32px",
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f1f5f9",
    borderRadius: "12px"
  },
  statLabel: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "4px"
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#0f172a"
  },
  filterContainer: {
    display: "flex",
    gap: "16px",
    marginBottom: "24px",
    flexWrap: "wrap"
  },
  searchWrapper: {
    position: "relative",
    flex: "1",
    minWidth: "280px"
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
    padding: "14px 20px 14px 44px",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    fontSize: "15px",
    outline: "none",
    transition: "all 0.2s ease",
    background: "white",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
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
  categorySelect: {
    padding: "14px 24px",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    fontSize: "15px",
    outline: "none",
    background: "white",
    color: "#1e293b",
    cursor: "pointer",
    minWidth: "180px"
  },
  tableContainer: {
    background: "white",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
    border: "1px solid #e2e8f0"
  },
  tableScroll: {
    overflowX: "auto"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1700px"
  },
  tableHead: {
    background: "#f8fafc",
    borderBottom: "2px solid #e2e8f0"
  },
  th: {
    padding: "16px",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap"
  },
  tableRow: {
    borderBottom: "1px solid #e2e8f0"
  },
  td: {
    padding: "16px",
    fontSize: "14px",
    color: "#1e293b",
    verticalAlign: "top"
  },
  id: {
    fontFamily: "monospace",
    fontSize: "13px",
    color: "#64748b"
  },
  category: {
    background: "#f1f5f9",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500"
  },
  productInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  productName: {
    fontWeight: "500"
  },
  variant: {
    background: "#f1f5f9",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontFamily: "monospace"
  },
  placeholder: {
    color: "#94a3b8",
    fontSize: "12px"
  },
  unit: {
    background: "#f1f5f9",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    textTransform: "lowercase"
  },
  priceCell: {
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  currency: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#64748b"
  },
  priceInput: {
    width: "100px",
    padding: "8px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    transition: "all 0.2s ease"
  },
  stockValue: {
    fontWeight: "600"
  },
  statusBadge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
    display: "inline-block",
    whiteSpace: "nowrap"
  },
  updateButton: {
    padding: "8px 16px",
    background: "#3b82f6",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    minWidth: "110px",
    justifyContent: "center"
  },
  stockUpdateBox: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: "170px"
  },
  stockSelect: {
    padding: "8px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "13px",
    background: "white"
  },
  stockInput: {
    padding: "8px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "13px"
  },
  noteInput: {
    padding: "8px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "13px"
  },
  stockButton: {
    padding: "8px 12px",
    background: "#0f766e",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontSize: "13px",
    fontWeight: "500"
  },
  historyButton: {
    padding: "8px 12px",
    background: "#f1f5f9",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    color: "#0f172a",
    fontSize: "13px",
    cursor: "pointer"
  },
  buttonSpinner: {
    width: "16px",
    height: "16px",
    border: "2px solid white",
    borderTop: "2px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  noData: {
    padding: "48px",
    textAlign: "center"
  },
  noDataText: {
    color: "#64748b",
    fontSize: "16px",
    marginBottom: "16px"
  },
  clearFiltersButton: {
    padding: "8px 16px",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#475569",
    cursor: "pointer"
  },
  resultsInfo: {
    marginTop: "20px",
    padding: "12px 16px",
    background: "white",
    borderRadius: "12px",
    fontSize: "14px",
    color: "#64748b",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #e2e8f0"
  },
  clearAllButton: {
    padding: "4px 12px",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "12px",
    color: "#475569",
    cursor: "pointer"
  },
  historyPanel: {
    marginTop: "24px",
    background: "white",
    borderRadius: "20px",
    padding: "20px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.08)"
  },
  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  },
  historyTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#0f172a"
  },
  closeHistoryButton: {
    padding: "8px 12px",
    background: "#ef4444",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer"
  },
  historyLoading: {
    color: "#64748b",
    fontSize: "14px"
  },
  historyTableWrapper: {
    overflowX: "auto"
  },
  historyTable: {
    width: "100%",
    borderCollapse: "collapse"
  },
  historyTh: {
    textAlign: "left",
    padding: "12px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "13px",
    color: "#475569"
  },
  historyTd: {
    padding: "12px",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "13px",
    color: "#1e293b"
  }
};

export default Products;