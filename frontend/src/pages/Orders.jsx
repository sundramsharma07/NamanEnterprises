import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders");
      setOrders(res.data.orders || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders based on search and filters
  const filteredOrders = orders.filter(order => {
    // Search filter
    const matchesSearch = 
      order.order_id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id?.toString().includes(searchTerm);
    
    // Status filter
    const remaining = Number(order.remaining_amount || 0);
    let matchesStatus = true;
    if (statusFilter === "paid") {
      matchesStatus = remaining === 0;
    } else if (statusFilter === "due") {
      matchesStatus = remaining > 0;
    } else if (statusFilter === "partial") {
      matchesStatus = remaining > 0 && remaining < Number(order.total_amount || 0);
    }
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const totalPaid = orders.reduce((sum, o) => sum + Number(o.paid_amount || 0), 0);
  const totalDue = orders.reduce((sum, o) => sum + Number(o.remaining_amount || 0), 0);
  const paidOrders = orders.filter(o => Number(o.remaining_amount || 0) === 0).length;
  const dueOrders = orders.filter(o => Number(o.remaining_amount || 0) > 0).length;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusBadge = (order) => {
    const remaining = Number(order.remaining_amount || 0);
    if (remaining === 0) {
      return { text: 'Paid', color: '#16a34a', bg: '#22c55e20' };
    } else if (remaining === Number(order.total_amount || 0)) {
      return { text: 'Unpaid', color: '#dc2626', bg: '#ef444420' };
    } else {
      return { text: 'Partial', color: '#b45309', bg: '#f59e0b20' };
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading orders...</p>
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
        .order-row {
          transition: all 0.2s ease;
        }
        .order-row:hover {
          background: #f8fafc;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
      `}</style>

      {/* Header Section */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Orders</h1>
          <p style={styles.subtitle}>
            Manage and track all customer orders • {totalOrders} total orders
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📦</div>
          <div>
            <div style={styles.statLabel}>Total Orders</div>
            <div style={styles.statValue}>{totalOrders}</div>
          </div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>
          <div>
            <div style={styles.statLabel}>Total Revenue</div>
            <div style={styles.statValue}>{formatCurrency(totalRevenue)}</div>
          </div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statIcon}>✅</div>
          <div>
            <div style={styles.statLabel}>Paid Orders</div>
            <div style={styles.statValue}>{paidOrders}</div>
            <div style={styles.statSubtext}>{formatCurrency(totalPaid)} collected</div>
          </div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statIcon}>⏳</div>
          <div>
            <div style={styles.statLabel}>Due Orders</div>
            <div style={styles.statValue}>{dueOrders}</div>
            <div style={styles.statSubtext}>{formatCurrency(totalDue)} pending</div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div style={styles.filterContainer}>
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search by Order ID or Customer Name..."
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Orders</option>
          <option value="paid">Paid Only</option>
          <option value="due">Due Only</option>
          <option value="partial">Partial Payment</option>
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Orders Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead style={styles.tableHead}>
            <tr>
              <th style={styles.th}>Order ID</th>
              <th style={styles.th}>Customer</th>
              <th style={styles.th}>Total Amount</th>
              <th style={styles.th}>Paid Amount</th>
              <th style={styles.th}>Remaining</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const status = getStatusBadge(order);
                return (
                  <tr key={order.id} className="order-row" style={styles.tableRow}>
                    <td style={styles.td}>
                      <Link to={`/orders/${order.order_id}`} style={styles.orderLink}>
                        <span style={styles.orderId}>#{order.order_id}</span>
                      </Link>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.customerInfo}>
                        <div style={styles.customerAvatar}>
                          {order.customer_name?.charAt(0).toUpperCase()}
                        </div>
                        <span style={styles.customerName}>{order.customer_name}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.amount}>{formatCurrency(order.total_amount)}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.paidAmount}>{formatCurrency(order.paid_amount)}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.remainingAmount,
                        color: Number(order.remaining_amount) > 0 ? '#dc2626' : '#16a34a'
                      }}>
                        {formatCurrency(order.remaining_amount)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: status.bg,
                        color: status.color
                      }}>
                        {status.text}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <Link to={`/orders/${order.order_id}`} style={styles.viewButton}>
                        View Details
                        <span style={styles.viewIcon}>→</span>
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" style={styles.noData}>
                  {searchTerm || statusFilter !== 'all' ? (
                    <div>
                      <p style={styles.noDataText}>No orders match your filters</p>
                      <button 
                        onClick={() => {
                          setSearchTerm("");
                          setStatusFilter("all");
                          setDateFilter("all");
                        }}
                        style={styles.clearFiltersButton}
                      >
                        Clear All Filters
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p style={styles.noDataText}>No orders found</p>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with Summary */}
      {filteredOrders.length > 0 && (
        <div style={styles.footer}>
          <div style={styles.resultsInfo}>
            Showing {filteredOrders.length} of {totalOrders} orders
            {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setDateFilter("all");
                }}
                style={styles.clearAllButton}
              >
                Clear filters
              </button>
            )}
          </div>
          
          <div style={styles.summaryStats}>
            <div style={styles.summaryItem}>
              <span>Page Total:</span>
              <strong>{formatCurrency(filteredOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0))}</strong>
            </div>
            <div style={styles.summaryItem}>
              <span>Page Paid:</span>
              <strong style={{color: '#16a34a'}}>
                {formatCurrency(filteredOrders.reduce((sum, o) => sum + Number(o.paid_amount || 0), 0))}
              </strong>
            </div>
            <div style={styles.summaryItem}>
              <span>Page Due:</span>
              <strong style={{color: '#dc2626'}}>
                {formatCurrency(filteredOrders.reduce((sum, o) => sum + Number(o.remaining_amount || 0), 0))}
              </strong>
            </div>
          </div>
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
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
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
    color: "#0f172a",
    lineHeight: "1.2"
  },
  statSubtext: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "2px"
  },
  filterContainer: {
    display: "flex",
    gap: "16px",
    marginBottom: "24px",
    flexWrap: "wrap"
  },
  searchWrapper: {
    position: "relative",
    flex: "2",
    minWidth: "300px"
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
  filterSelect: {
    padding: "14px 24px",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    fontSize: "15px",
    outline: "none",
    background: "white",
    color: "#1e293b",
    cursor: "pointer",
    minWidth: "150px"
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
    cursor: "pointer"
  },
  td: {
    padding: "16px",
    fontSize: "14px",
    color: "#1e293b"
  },
  orderLink: {
    textDecoration: "none",
    color: "inherit"
  },
  orderId: {
    fontFamily: "monospace",
    fontSize: "14px",
    fontWeight: "600",
    color: "#3b82f6",
    background: "#eff6ff",
    padding: "4px 8px",
    borderRadius: "6px"
  },
  customerInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  customerAvatar: {
    width: "32px",
    height: "32px",
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "14px",
    fontWeight: "600"
  },
  customerName: {
    fontWeight: "500"
  },
  amount: {
    fontWeight: "600",
    color: "#0f172a"
  },
  paidAmount: {
    fontWeight: "500",
    color: "#16a34a"
  },
  remainingAmount: {
    fontWeight: "600"
  },
  statusBadge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
    display: "inline-block"
  },
  viewButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "6px 12px",
    background: "#f1f5f9",
    borderRadius: "8px",
    color: "#475569",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "500",
    transition: "all 0.2s ease"
  },
  viewIcon: {
    fontSize: "16px",
    transition: "transform 0.2s ease"
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
  footer: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px"
  },
  resultsInfo: {
    padding: "12px 16px",
    background: "white",
    borderRadius: "12px",
    fontSize: "14px",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: "16px",
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
  summaryStats: {
    display: "flex",
    gap: "20px",
    padding: "12px 20px",
    background: "white",
    borderRadius: "12px",
    border: "1px solid #e2e8f0"
  },
  summaryItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    color: "#64748b"
  }
};

export default Orders;