import { useEffect, useState } from "react";
import api from "../services/api";

function Products() {
  const [products, setProducts] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products");
      const data = Array.isArray(res.data) ? res.data : [];
      setProducts(data);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data.map(p => p.category))];
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

  const updatePrice = async (product) => {
    try {
      setUpdatingId(product.id);

      await api.put(`/products/${product.id}`, {
        category: product.category,
        name: product.name,
        variant: product.variant,
        unit: product.unit,
        price: Number(product.price),
        is_active: product.is_active
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

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.variant?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === "all" || product.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Calculate stats
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.is_active).length;
  const totalValue = products.reduce((sum, p) => sum + (Number(p.price) || 0), 0);

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
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .price-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        .update-button:active {
          transform: scale(0.95);
        }
      `}</style>

      {/* Header Section */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Products</h1>
          <p style={styles.subtitle}>
            Manage your product catalog • {totalProducts} total products
          </p>
        </div>
      </div>

      {/* Stats Cards */}
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
          <div style={styles.statIcon}>💰</div>
          <div>
            <div style={styles.statLabel}>Total Inventory Value</div>
            <div style={styles.statValue}>₹{totalValue.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
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
            <button
              onClick={() => setSearchTerm("")}
              style={styles.clearButton}
            >
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
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead style={styles.tableHead}>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Product</th>
              <th style={styles.th}>Variant</th>
              <th style={styles.th}>Unit</th>
              <th style={styles.th}>Price (₹)</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr key={product.id} style={styles.tableRow}>
                  <td style={styles.td}>
                    <span style={styles.id}>#{product.id}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.category}>
                      {product.category}
                    </span>
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
                        onChange={(e) => handlePriceChange(product.id, e.target.value)}
                        style={styles.priceInput}
                        className="price-input"
                        disabled={updatingId === product.id}
                      />
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: product.is_active ? '#22c55e20' : '#ef444420',
                      color: product.is_active ? '#16a34a' : '#dc2626'
                    }}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => updatePrice(product)}
                      disabled={updatingId === product.id}
                      style={{
                        ...styles.updateButton,
                        opacity: updatingId === product.id ? 0.7 : 1,
                        cursor: updatingId === product.id ? 'wait' : 'pointer'
                      }}
                      className="update-button"
                    >
                      {updatingId === product.id ? (
                        <div style={styles.buttonSpinner} />
                      ) : (
                        'Update Price'
                      )}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={styles.noData}>
                  {searchTerm || filterCategory !== 'all' ? (
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

      {/* Results Info */}
      {filteredProducts.length > 0 && (
        <div style={styles.resultsInfo}>
          Showing {filteredProducts.length} of {totalProducts} products
          {(searchTerm || filterCategory !== 'all') && (
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
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
  table: {
    width: "100%",
    borderCollapse: "collapse"
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
    letterSpacing: "0.5px"
  },
  tableRow: {
    borderBottom: "1px solid #e2e8f0",
    transition: "background 0.2s ease",
    ':hover': {
      background: "#f8fafc"
    }
  },
  td: {
    padding: "16px",
    fontSize: "14px",
    color: "#1e293b"
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
  statusBadge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
    display: "inline-block"
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
  }
};

export default Products;