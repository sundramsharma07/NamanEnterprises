import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

function CustomerDueDetails() {
  const { customer_id } = useParams();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [processingOrder, setProcessingOrder] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders");
      
      const customerOrders = res.data.orders.filter(
        o => o.customer_id == customer_id
      );
      
      const dueOrders = customerOrders.filter(
        o => o.remaining_amount > 0
      );

      // Get customer info from the first order
      if (customerOrders.length > 0) {
        setCustomerInfo({
          name: customerOrders[0].customer_name,
          phone: customerOrders[0].customer_phone,
          address: customerOrders[0].customer_address,
          totalDue: dueOrders.reduce((sum, o) => sum + Number(o.remaining_amount), 0),
          totalOrders: customerOrders.length,
          dueOrders: dueOrders.length
        });
      }

      setOrders(dueOrders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [customer_id]);

  const openPaymentModal = (order) => {
    setSelectedOrder(order);
    setPaymentAmount("");
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedOrder(null);
    setPaymentAmount("");
  };

  const receivePayment = async () => {
    if (!selectedOrder) return;

    const amount = paymentAmount.trim();
    
    if (!amount) {
      alert("Please enter payment amount");
      return;
    }

    if (Number(amount) <= 0) {
      alert("Amount must be greater than 0");
      return;
    }

    if (Number(amount) > selectedOrder.remaining_amount) {
      alert(`Amount cannot exceed remaining due of ₹${selectedOrder.remaining_amount}`);
      return;
    }

    try {
      setProcessingOrder(selectedOrder.order_id);
      
      await api.post(`/orders/${selectedOrder.order_id}/pay`, {
        amount: Number(amount)
      });

      alert("Payment recorded successfully!");
      closePaymentModal();
      fetchOrders();

    } catch (err) {
      alert(err.response?.data?.message || "Payment failed");
    } finally {
      setProcessingOrder(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const totalDue = orders.reduce((sum, o) => sum + Number(o.remaining_amount), 0);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading customer due details...</p>
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
        .modal-overlay {
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Payment Modal */}
      {showPaymentModal && selectedOrder && (
        <div style={styles.modalOverlay} onClick={closePaymentModal}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Receive Payment</h3>
              <button onClick={closePaymentModal} style={styles.modalClose}>✕</button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.modalInfo}>
                <div style={styles.modalInfoRow}>
                  <span>Order ID:</span>
                  <strong>#{selectedOrder.order_id}</strong>
                </div>
                <div style={styles.modalInfoRow}>
                  <span>Total Amount:</span>
                  <strong>{formatCurrency(selectedOrder.total_amount)}</strong>
                </div>
                <div style={styles.modalInfoRow}>
                  <span>Already Paid:</span>
                  <strong style={{color: '#16a34a'}}>{formatCurrency(selectedOrder.paid_amount)}</strong>
                </div>
                <div style={styles.modalInfoRow}>
                  <span>Remaining Due:</span>
                  <strong style={{color: '#dc2626'}}>{formatCurrency(selectedOrder.remaining_amount)}</strong>
                </div>
              </div>

              <div style={styles.modalInputGroup}>
                <label style={styles.modalLabel}>Payment Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  max={selectedOrder.remaining_amount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  style={styles.modalInput}
                  autoFocus
                />
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={closePaymentModal} style={styles.modalCancel}>
                Cancel
              </button>
              <button
                onClick={receivePayment}
                disabled={processingOrder === selectedOrder.order_id}
                style={{
                  ...styles.modalConfirm,
                  opacity: processingOrder === selectedOrder.order_id ? 0.7 : 1,
                  cursor: processingOrder === selectedOrder.order_id ? 'wait' : 'pointer'
                }}
              >
                {processingOrder === selectedOrder.order_id ? (
                  <>
                    <div style={styles.buttonSpinner} />
                    Processing...
                  </>
                ) : (
                  'Confirm Payment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with Navigation */}
      <div style={styles.header}>
        <button onClick={() => navigate('/due-customers')} style={styles.backLink}>
          ← Back to Due Customers
        </button>
      </div>

      {/* Customer Info Card */}
      {customerInfo && (
        <div style={styles.customerCard}>
          <div style={styles.customerHeader}>
            <div style={styles.customerAvatar}>
              {customerInfo.name?.charAt(0).toUpperCase()}
            </div>
            <div style={styles.customerTitle}>
              <h1 style={styles.customerName}>{customerInfo.name}</h1>
              <div style={styles.customerMeta}>
                {customerInfo.phone && (
                  <span style={styles.customerPhone}>📞 {customerInfo.phone}</span>
                )}
                {customerInfo.address && (
                  <span style={styles.customerAddress}>📍 {customerInfo.address}</span>
                )}
              </div>
            </div>
          </div>

          <div style={styles.customerStats}>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Total Orders</span>
              <span style={styles.statValue}>{customerInfo.totalOrders}</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Due Orders</span>
              <span style={styles.statValue}>{customerInfo.dueOrders}</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Total Due</span>
              <span style={{...styles.statValue, color: '#dc2626', fontSize: '24px'}}>
                {formatCurrency(customerInfo.totalDue)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Due Orders Section */}
      <div style={styles.ordersSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Due Orders</h2>
          {orders.length > 0 && (
            <span style={styles.sectionBadge}>{orders.length} pending</span>
          )}
        </div>

        {orders.length > 0 ? (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead style={styles.tableHead}>
                <tr>
                  <th style={styles.th}>Order ID</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Total Amount</th>
                  <th style={styles.th}>Paid Amount</th>
                  <th style={styles.th}>Remaining</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => {
                  const duePercentage = (order.remaining_amount / order.total_amount) * 100;
                  
                  return (
                    <tr key={order.order_id} style={styles.tableRow} className="fade-in">
                      <td style={styles.td}>
                        <span style={styles.orderId}>#{order.order_id}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.orderDate}>{formatDate(order.created_at)}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.amount}>{formatCurrency(order.total_amount)}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{...styles.amount, color: '#16a34a'}}>
                          {formatCurrency(order.paid_amount)}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{...styles.amount, color: '#dc2626', fontWeight: '700'}}>
                          {formatCurrency(order.remaining_amount)}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.dueIndicator}>
                          <div style={styles.progressBar}>
                            <div style={{
                              ...styles.progressFill,
                              width: `${100 - duePercentage}%`,
                              background: duePercentage > 50 ? '#f59e0b' : '#22c55e'
                            }} />
                          </div>
                          <span style={{
                            ...styles.duePercent,
                            color: duePercentage > 50 ? '#f59e0b' : '#16a34a'
                          }}>
                            {duePercentage.toFixed(0)}% due
                          </span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => openPaymentModal(order)}
                          disabled={processingOrder === order.order_id}
                          style={{
                            ...styles.payButton,
                            opacity: processingOrder === order.order_id ? 0.7 : 1,
                            cursor: processingOrder === order.order_id ? 'wait' : 'pointer'
                          }}
                        >
                          {processingOrder === order.order_id ? (
                            <div style={styles.buttonSpinner} />
                          ) : (
                            <>
                              <span style={styles.payIcon}>💰</span>
                              Receive Payment
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.noOrders}>
            <div style={styles.noOrdersIcon}>✅</div>
            <h3 style={styles.noOrdersTitle}>No Due Orders</h3>
            <p style={styles.noOrdersText}>
              This customer has no pending payments. All orders are paid in full.
            </p>
            <button 
              onClick={() => navigate('/due-customers')}
              style={styles.noOrdersButton}
            >
              Back to Due Customers
            </button>
          </div>
        )}

        {/* Summary Card */}
        {orders.length > 0 && (
          <div style={styles.summaryCard}>
            <div style={styles.summaryRow}>
              <span>Total Due Amount:</span>
              <span style={styles.summaryDue}>{formatCurrency(totalDue)}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Number of Due Orders:</span>
              <span style={styles.summaryCount}>{orders.length}</span>
            </div>
            <div style={styles.summaryNote}>
              <span style={styles.noteIcon}>📌</span>
              <span>Click "Receive Payment" to record a payment against an order</span>
            </div>
          </div>
        )}
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
  header: {
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
  customerCard: {
    background: "white",
    borderRadius: "20px",
    padding: "24px",
    marginBottom: "32px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
    border: "1px solid #e2e8f0"
  },
  customerHeader: {
    display: "flex",
    gap: "20px",
    marginBottom: "24px"
  },
  customerAvatar: {
    width: "64px",
    height: "64px",
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "28px",
    fontWeight: "600"
  },
  customerTitle: {
    flex: 1
  },
  customerName: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 8px 0"
  },
  customerMeta: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap"
  },
  customerPhone: {
    fontSize: "14px",
    color: "#3b82f6",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  customerAddress: {
    fontSize: "14px",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  customerStats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "20px",
    padding: "20px",
    background: "#f8fafc",
    borderRadius: "16px"
  },
  statItem: {
    textAlign: "center"
  },
  statLabel: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "4px"
  },
  statValue: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#0f172a"
  },
  ordersSection: {
    marginTop: "32px"
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0
  },
  sectionBadge: {
    padding: "6px 12px",
    background: "#dc2626",
    color: "white",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "500"
  },
  tableContainer: {
    background: "white",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
    border: "1px solid #e2e8f0",
    marginBottom: "24px"
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
  orderId: {
    fontFamily: "monospace",
    fontSize: "14px",
    fontWeight: "600",
    color: "#3b82f6",
    background: "#eff6ff",
    padding: "4px 8px",
    borderRadius: "6px"
  },
  orderDate: {
    color: "#64748b",
    fontSize: "13px"
  },
  amount: {
    fontWeight: "500"
  },
  dueIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  progressBar: {
    width: "60px",
    height: "6px",
    background: "#e2e8f0",
    borderRadius: "3px",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: "3px",
    transition: "width 0.3s ease"
  },
  duePercent: {
    fontSize: "12px",
    fontWeight: "500"
  },
  payButton: {
    padding: "8px 16px",
    background: "#3b82f6",
    border: "none",
    borderRadius: "10px",
    color: "white",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 6px -1px rgba(59,130,246,0.2)"
  },
  payIcon: {
    fontSize: "14px"
  },
  buttonSpinner: {
    width: "16px",
    height: "16px",
    border: "2px solid white",
    borderTop: "2px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  noOrders: {
    textAlign: "center",
    padding: "60px 20px",
    background: "white",
    borderRadius: "16px",
    border: "1px solid #e2e8f0"
  },
  noOrdersIcon: {
    fontSize: "48px",
    marginBottom: "16px"
  },
  noOrdersTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "8px"
  },
  noOrdersText: {
    color: "#64748b",
    marginBottom: "24px"
  },
  noOrdersButton: {
    padding: "12px 24px",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    color: "#475569",
    cursor: "pointer"
  },
  summaryCard: {
    background: "white",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #e2e8f0"
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    fontSize: "15px"
  },
  summaryDue: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#dc2626"
  },
  summaryCount: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#0f172a"
  },
  summaryNote: {
    marginTop: "16px",
    padding: "12px",
    background: "#f8fafc",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  noteIcon: {
    fontSize: "14px"
  },
  // Modal Styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
  },
  modal: {
    background: "white",
    borderRadius: "20px",
    width: "90%",
    maxWidth: "400px",
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
    animation: "slideIn 0.2s ease"
  },
  modalHeader: {
    padding: "20px 24px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0
  },
  modalClose: {
    background: "none",
    border: "none",
    fontSize: "20px",
    color: "#64748b",
    cursor: "pointer",
    padding: "4px 8px"
  },
  modalBody: {
    padding: "24px"
  },
  modalInfo: {
    background: "#f8fafc",
    padding: "16px",
    borderRadius: "12px",
    marginBottom: "20px"
  },
  modalInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
    fontSize: "14px",
    color: "#475569"
  },
  modalInputGroup: {
    marginBottom: "20px"
  },
  modalLabel: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#475569",
    marginBottom: "8px"
  },
  modalInput: {
    width: "100%",
    padding: "12px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "16px",
    outline: "none",
    transition: "all 0.2s ease"
  },
  modalFooter: {
    padding: "20px 24px",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end"
  },
  modalCancel: {
    padding: "10px 20px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#475569",
    cursor: "pointer"
  },
  modalConfirm: {
    padding: "10px 24px",
    background: "#3b82f6",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "500",
    color: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  }
};

export default CustomerDueDetails;