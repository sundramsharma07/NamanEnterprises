import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

function OrderDetails() {
  const { order_id } = useParams();
  const navigate = useNavigate();
  console.log("Order ID:", order_id);
  
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("items");

  useEffect(() => {
    if (!order_id) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/orders/${order_id}`);
        setOrder(res.data.order);
        setItems(res.data.items);
      } catch (err) {
        console.error("Failed to fetch order:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [order_id]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusBadge = () => {
    if (!order) return { text: 'Unknown', color: '#64748b', bg: '#f1f5f9' };
    
    const remaining = Number(order.remaining_amount || 0);
    if (remaining === 0) {
      return { text: 'Paid', color: '#16a34a', bg: '#22c55e20' };
    } else if (remaining === Number(order.total_amount || 0)) {
      return { text: 'Unpaid', color: '#dc2626', bg: '#ef444420' };
    } else {
      return { text: 'Partial Payment', color: '#b45309', bg: '#f59e0b20' };
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>⚠️</div>
        <h2 style={styles.errorTitle}>Order Not Found</h2>
        <p style={styles.errorText}>The order you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate('/orders')} style={styles.backButton}>
          ← Back to Orders
        </button>
      </div>
    );
  }

  const status = getStatusBadge();

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
        .print-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(59,130,246,0.3);
        }
      `}</style>

      {/* Header with Navigation */}
      <div style={styles.header}>
        <button onClick={() => navigate('/orders')} style={styles.backLink}>
          ← Back to Orders
        </button>
        
        <button
          onClick={() => window.open(`/receipt/${order.order_id}`, "_blank")}
          style={styles.printButton}
          className="print-button"
        >
          <span style={styles.printIcon}>🖨️</span>
          Print Receipt
        </button>
      </div>

      {/* Order Title and Status */}
      <div style={styles.titleSection}>
        <div>
          <h1 style={styles.title}>Order #{order.order_id}</h1>
          <p style={styles.subtitle}>View complete order details and items</p>
        </div>
        <span style={{
          ...styles.statusBadge,
          backgroundColor: status.bg,
          color: status.color
        }}>
          {status.text}
        </span>
      </div>

      {/* Order Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>💰</div>
          <div>
            <div style={styles.summaryLabel}>Total Amount</div>
            <div style={styles.summaryValue}>{formatCurrency(order.total_amount)}</div>
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>✅</div>
          <div>
            <div style={styles.summaryLabel}>Paid Amount</div>
            <div style={{...styles.summaryValue, color: '#16a34a'}}>
              {formatCurrency(order.paid_amount)}
            </div>
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>⏳</div>
          <div>
            <div style={styles.summaryLabel}>Remaining</div>
            <div style={{...styles.summaryValue, color: '#dc2626'}}>
              {formatCurrency(order.remaining_amount)}
            </div>
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>📊</div>
          <div>
            <div style={styles.summaryLabel}>Items Count</div>
            <div style={styles.summaryValue}>{items.length}</div>
          </div>
        </div>
      </div>

      {/* Customer Information Card */}
      <div style={styles.customerCard}>
        <h3 style={styles.sectionTitle}>Customer Information</h3>
        <div style={styles.customerDetails}>
          <div style={styles.customerAvatar}>
            {order.customer_name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div style={styles.customerInfo}>
            <div style={styles.customerName}>{order.customer_name || 'Unknown Customer'}</div>
            <div style={styles.customerMeta}>
              <span style={styles.customerId}>Customer ID: #{order.customer_id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'items' ? styles.activeTab : {})
          }}
          onClick={() => setActiveTab('items')}
        >
          Purchased Items ({items.length})
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'payment' ? styles.activeTab : {})
          }}
          onClick={() => setActiveTab('payment')}
        >
          Payment Details
        </button>
      </div>

      {/* Tab Content */}
      <div style={styles.tabContent} className="fade-in">
        {activeTab === 'items' && (
          <>
            {/* Items Table */}
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead style={styles.tableHead}>
                  <tr>
                    <th style={styles.th}>Product</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Variant</th>
                    <th style={styles.th}>Unit</th>
                    <th style={styles.th}>Quantity</th>
                    <th style={styles.th}>Unit Price</th>
                    <th style={styles.th}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id || index} style={styles.tableRow}>
                      <td style={styles.td}>
                        <div style={styles.productInfo}>
                          <div style={styles.productAvatar}>
                            {item.product_name?.charAt(0).toUpperCase()}
                          </div>
                          <span style={styles.productName}>{item.product_name}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.category}>{item.category}</span>
                      </td>
                      <td style={styles.td}>
                        {item.variant ? (
                          <span style={styles.variant}>{item.variant}</span>
                        ) : (
                          <span style={styles.placeholder}>-</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.unit}>{item.unit}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.quantity}>×{item.quantity}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.price}>{formatCurrency(item.price)}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.lineTotal}>{formatCurrency(item.line_total)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot style={styles.tableFoot}>
                  <tr>
                    <td colSpan="6" style={styles.footLabel}>Subtotal</td>
                    <td style={styles.footValue}>{formatCurrency(order.total_amount)}</td>
                  </tr>
                  <tr>
                    <td colSpan="6" style={styles.footLabel}>Paid Amount</td>
                    <td style={{...styles.footValue, color: '#16a34a'}}>
                      {formatCurrency(order.paid_amount)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="6" style={styles.footLabel}>Remaining</td>
                    <td style={{...styles.footValue, color: '#dc2626'}}>
                      {formatCurrency(order.remaining_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}

        {activeTab === 'payment' && (
          <div style={styles.paymentDetails}>
            <div style={styles.paymentCard}>
              <h4 style={styles.paymentTitle}>Payment Summary</h4>
              
              <div style={styles.paymentRow}>
                <span>Order Total:</span>
                <strong>{formatCurrency(order.total_amount)}</strong>
              </div>
              
              <div style={styles.paymentRow}>
                <span>Amount Paid:</span>
                <strong style={{color: '#16a34a'}}>{formatCurrency(order.paid_amount)}</strong>
              </div>
              
              <div style={styles.divider} />
              
              <div style={styles.paymentRow}>
                <span style={styles.balanceLabel}>Balance Due:</span>
                <strong style={{
                  ...styles.balanceAmount,
                  color: Number(order.remaining_amount) > 0 ? '#dc2626' : '#16a34a'
                }}>
                  {formatCurrency(order.remaining_amount)}
                </strong>
              </div>

              <div style={styles.paymentStatus}>
                <span>Payment Status:</span>
                <span style={{
                  ...styles.statusPill,
                  backgroundColor: status.bg,
                  color: status.color
                }}>
                  {status.text}
                </span>
              </div>
            </div>

            <div style={styles.timelineCard}>
              <h4 style={styles.paymentTitle}>Order Timeline</h4>
              
              <div style={styles.timelineItem}>
                <div style={styles.timelineDot} />
                <div>
                  <div style={styles.timelineTitle}>Order Created</div>
                  <div style={styles.timelineDate}>
                    {new Date(order.created_at || Date.now()).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div style={styles.timelineItem}>
                <div style={styles.timelineDot} />
                <div>
                  <div style={styles.timelineTitle}>Last Updated</div>
                  <div style={styles.timelineDate}>
                    {new Date(order.updated_at || Date.now()).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={styles.actions}>
        <button
          onClick={() => window.open(`/receipt/${order.order_id}`, "_blank")}
          style={styles.actionButton}
        >
          <span style={styles.actionIcon}>🖨️</span>
          Download Receipt
        </button>
        <button
          onClick={() => navigate('/orders')}
          style={styles.secondaryButton}
        >
          View All Orders
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "32px",
    maxWidth: "1200px",
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
  errorContainer: {
    textAlign: "center",
    padding: "60px 20px",
    background: "white",
    borderRadius: "20px",
    maxWidth: "400px",
    margin: "40px auto",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)"
  },
  errorIcon: {
    fontSize: "48px",
    marginBottom: "16px"
  },
  errorTitle: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "8px"
  },
  errorText: {
    color: "#64748b",
    marginBottom: "24px"
  },
  backButton: {
    padding: "12px 24px",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    color: "#475569",
    cursor: "pointer"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px"
  },
  backLink: {
    background: "none",
    border: "none",
    color: "#3b82f6",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    padding: "8px 0",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  printButton: {
    padding: "12px 24px",
    background: "#3b82f6",
    border: "none",
    borderRadius: "12px",
    color: "white",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 6px -1px rgba(59,130,246,0.2)"
  },
  printIcon: {
    fontSize: "18px"
  },
  titleSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
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
  statusBadge: {
    padding: "8px 20px",
    borderRadius: "30px",
    fontSize: "14px",
    fontWeight: "600"
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "32px"
  },
  summaryCard: {
    background: "white",
    padding: "20px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
    border: "1px solid #e2e8f0"
  },
  summaryIcon: {
    fontSize: "32px",
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f1f5f9",
    borderRadius: "12px"
  },
  summaryLabel: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "4px"
  },
  summaryValue: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#0f172a"
  },
  customerCard: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
    border: "1px solid #e2e8f0"
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 20px 0"
  },
  customerDetails: {
    display: "flex",
    alignItems: "center",
    gap: "20px"
  },
  customerAvatar: {
    width: "64px",
    height: "64px",
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "28px",
    fontWeight: "600"
  },
  customerInfo: {
    flex: 1
  },
  customerName: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "4px"
  },
  customerMeta: {
    fontSize: "14px",
    color: "#64748b"
  },
  customerId: {
    background: "#f1f5f9",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "13px"
  },
  tabs: {
    display: "flex",
    gap: "4px",
    marginBottom: "24px",
    background: "#f1f5f9",
    padding: "4px",
    borderRadius: "14px",
    maxWidth: "400px"
  },
  tab: {
    flex: 1,
    padding: "10px 20px",
    border: "none",
    background: "transparent",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#64748b",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  activeTab: {
    background: "white",
    color: "#0f172a",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
  },
  tabContent: {
    minHeight: "400px"
  },
  tableContainer: {
    background: "white",
    borderRadius: "16px",
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
    ':last-child': {
      borderBottom: "none"
    }
  },
  td: {
    padding: "16px",
    fontSize: "14px",
    color: "#1e293b"
  },
  productInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  productAvatar: {
    width: "32px",
    height: "32px",
    background: "#f1f5f9",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#475569",
    fontSize: "14px",
    fontWeight: "600"
  },
  productName: {
    fontWeight: "500"
  },
  category: {
    background: "#f1f5f9",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px"
  },
  variant: {
    background: "#f1f5f9",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontFamily: "monospace"
  },
  unit: {
    background: "#f1f5f9",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    textTransform: "lowercase"
  },
  placeholder: {
    color: "#94a3b8",
    fontSize: "12px"
  },
  quantity: {
    fontWeight: "500",
    color: "#3b82f6"
  },
  price: {
    color: "#64748b"
  },
  lineTotal: {
    fontWeight: "600",
    color: "#0f172a"
  },
  tableFoot: {
    background: "#f8fafc",
    borderTop: "2px solid #e2e8f0"
  },
  footLabel: {
    padding: "12px 16px",
    textAlign: "right",
    fontSize: "14px",
    fontWeight: "500",
    color: "#475569"
  },
  footValue: {
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: "600"
  },
  paymentDetails: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px"
  },
  paymentCard: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
    border: "1px solid #e2e8f0"
  },
  paymentTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 20px 0"
  },
  paymentRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
    fontSize: "14px",
    color: "#475569"
  },
  divider: {
    height: "1px",
    background: "#e2e8f0",
    margin: "16px 0"
  },
  balanceLabel: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a"
  },
  balanceAmount: {
    fontSize: "20px",
    fontWeight: "700"
  },
  paymentStatus: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "20px",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "12px"
  },
  statusPill: {
    padding: "6px 16px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600"
  },
  timelineCard: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
    border: "1px solid #e2e8f0"
  },
  timelineItem: {
    display: "flex",
    gap: "16px",
    marginBottom: "20px",
    position: "relative"
  },
  timelineDot: {
    width: "12px",
    height: "12px",
    background: "#3b82f6",
    borderRadius: "50%",
    marginTop: "6px",
    boxShadow: "0 0 0 3px #bfdbfe"
  },
  timelineTitle: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#0f172a",
    marginBottom: "4px"
  },
  timelineDate: {
    fontSize: "13px",
    color: "#64748b"
  },
  actions: {
    display: "flex",
    gap: "12px",
    marginTop: "32px",
    justifyContent: "flex-end"
  },
  actionButton: {
    padding: "12px 24px",
    background: "#3b82f6",
    border: "none",
    borderRadius: "12px",
    color: "white",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s ease"
  },
  actionIcon: {
    fontSize: "16px"
  },
  secondaryButton: {
    padding: "12px 24px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s ease"
  }
};

export default OrderDetails;