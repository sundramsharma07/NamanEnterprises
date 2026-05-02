import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

function PrintReceipt() {
  const { order_id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/orders/${order_id}`);
        setOrder(res.data.order);
        setItems(res.data.items);
      } catch (error) {
        console.error("Failed to fetch order:", error);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Generating receipt...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={styles.errorContainer}>
        <h2>Receipt Not Found</h2>
        <p>The requested receipt could not be found.</p>
        <button onClick={() => navigate("/dashboard")} style={styles.closeButton}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        
        @media print {
          .no-print { display: none !important; }
          body { background: white; padding: 0; margin: 0; }
          #receipt { 
            box-shadow: none !important; 
            border: none !important; 
            padding: 0.2in !important;
            width: 100% !important;
            max-width: none !important;
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        #receipt {
          position: relative;
          overflow: hidden;
        }
      `}</style>

      {/* Receipt Content */}
      <div id="receipt" style={styles.receipt}>
        {/* Watermark */}
        <div style={styles.watermarkContainer}>
          <img src="/logo.png" style={styles.watermark} alt="" />
        </div>

        {/* Header Section */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.logoWrapper}>
              <img src="/logo.png" style={styles.logoImage} alt="Naman Enterprises Logo" />
            </div>
            <div style={styles.storeDetails}>
              <h1 style={styles.storeName}>Naman Enterprises</h1>
              <p style={styles.storeSubtext}>Ajmatpur, Building Materials Store</p>
              <div style={styles.contactInfo}>
                <span style={styles.contactItem}>📞 {import.meta.env.VITE_STORE_PHONE || "Store Phone"}</span>
                <span style={styles.contactItem}>📍 {import.meta.env.VITE_STORE_ADDRESS || "Store Address"}</span>
              </div>
              {import.meta.env.VITE_STORE_GSTIN && (
                <p style={styles.gstin}>GSTIN: {import.meta.env.VITE_STORE_GSTIN}</p>
              )}
            </div>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.receiptBadge}>SALES RECEIPT</div>
            <div style={styles.orderKeyInfo}>
              <div style={styles.keyRow}>
                <span style={styles.keyLabel}>Invoice No :</span>
                <span style={styles.keyValue}>#{order.order_id}</span>
              </div>
              <div style={styles.keyRow}>
                <span style={styles.keyLabel}>Date :</span>
                <span style={styles.keyValue}>{formatDate(order.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.divider} />

        {/* Customer Info */}
        <div style={styles.customerSection}>
          <div style={styles.sectionTitle}>BILL TO:</div>
          <div style={styles.customerInfoGrid}>
            <div style={styles.customerMain}>
              <p style={styles.customerName}>{order.customer_name || 'Walk-in Customer'}</p>
              {order.customer_phone && <p style={styles.customerContact}>📞 {order.customer_phone}</p>}
            </div>
            {order.customer_address && (
              <div style={styles.customerAddressBox}>
                <p style={styles.customerAddress}>{order.customer_address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{...styles.tableHeader, width: '40px'}}>#</th>
              <th style={styles.tableHeader}>Item Description</th>
              <th style={{...styles.tableHeader, textAlign: 'center'}}>Qty</th>
              <th style={{...styles.tableHeader, textAlign: 'center'}}>Unit</th>
              <th style={{...styles.tableHeader, textAlign: 'right'}}>Rate</th>
              <th style={{...styles.tableHeader, textAlign: 'right'}}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} style={styles.tableRow}>
                <td style={styles.tableCell}>{index + 1}</td>
                <td style={styles.tableCell}>
                  <div>
                    <span style={styles.productName}>{item.product_name}</span>
                    {item.variant && (
                      <span style={styles.productVariant}> ({item.variant})</span>
                    )}
                  </div>
                </td>
                <td style={{...styles.tableCell, textAlign: 'center'}}>{item.quantity}</td>
                <td style={{...styles.tableCell, textAlign: 'center'}}>{item.unit}</td>
                <td style={{...styles.tableCell, textAlign: 'right'}}>{formatCurrency(item.price)}</td>
                <td style={{...styles.tableCell, textAlign: 'right', fontWeight: '600'}}>
                  {formatCurrency(item.line_total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div style={styles.summaryContainer}>
          <div style={styles.summaryLeft}>
            <div style={styles.paymentStatusBadge}>
              <span style={styles.statusLabel}>Payment Status:</span>
              <span style={{
                ...styles.statusValue,
                color: Number(order.remaining_amount) === 0 ? '#059669' : '#d97706'
              }}>
                {Number(order.remaining_amount) === 0 ? '● FULLY PAID' : '● PARTIAL'}
              </span>
            </div>
            <div style={styles.terms}>
              <p style={styles.termsTitle}>Terms & Conditions:</p>
              <p style={styles.termsItem}>* Goods once sold will not be taken back.</p>
              <p style={styles.termsItem}>* Subject to local jurisdiction.</p>
            </div>
          </div>
          
          <div style={styles.summaryRight}>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Sub Total</span>
              <span style={styles.summaryValue}>{formatCurrency(order.total_amount)}</span>
            </div>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Total Paid</span>
              <span style={{...styles.summaryValue, color: '#059669'}}>{formatCurrency(order.paid_amount)}</span>
            </div>
            <div style={styles.totalDivider} />
            <div style={styles.finalTotalRow}>
              <span style={styles.finalTotalLabel}>Balance Due</span>
              <span style={{
                ...styles.finalTotalValue,
                color: Number(order.remaining_amount) > 0 ? '#dc2626' : '#059669'
              }}>
                {formatCurrency(order.remaining_amount)}
              </span>
            </div>
          </div>
        </div>

        <div style={styles.footerSpacing} />

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.signatureSection}>
            <div style={styles.signatureBox}>
              <div style={styles.signatureLine} />
              <p style={styles.signatureText}>Authorized Signatory</p>
            </div>
          </div>
          
          <div style={styles.gratitudeSection}>
            <p style={styles.thankYou}>Thank you for choosing Naman Enterprises!</p>
            <p style={styles.computerGenerated}>This is a computer generated receipt</p>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div style={styles.printSection} className="no-print">
        <button onClick={() => window.print()} style={styles.printButton}>
          <span style={styles.printIcon}>🖨️</span>
          Print Receipt
        </button>
        <button onClick={() => navigate("/dashboard")} style={styles.closeButton}>
          Dashboard
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "40px 20px",
    fontFamily: "'Outfit', sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
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
    borderTop: "4px solid #2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  loadingText: {
    color: "#64748b",
    fontSize: "16px"
  },
  receipt: {
    width: "100%",
    maxWidth: "850px",
    background: "white",
    padding: "60px",
    borderRadius: "8px",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
    position: "relative",
    border: "1px solid #f1f5f9"
  },
  watermarkContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%) rotate(-15deg)",
    opacity: "0.04",
    width: "60%",
    pointerEvents: "none",
    zIndex: 0,
    display: "flex",
    justifyContent: "center"
  },
  watermark: {
    width: "100%",
    height: "auto",
    filter: "grayscale(100%)"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "32px",
    position: "relative",
    zIndex: 1
  },
  headerLeft: {
    display: "flex",
    gap: "20px",
    alignItems: "center"
  },
  logoWrapper: {
    width: "70px",
    height: "70px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  logoImage: {
    width: "100%",
    height: "auto",
    objectFit: "contain"
  },
  storeDetails: {
    display: "flex",
    flexDirection: "column"
  },
  storeName: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px"
  },
  storeSubtext: {
    fontSize: "14px",
    color: "#64748b",
    margin: "2px 0 8px 0",
    fontWeight: "500"
  },
  contactInfo: {
    display: "flex",
    gap: "16px",
    fontSize: "12px",
    color: "#475569"
  },
  contactItem: {
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  gstin: {
    fontSize: "12px",
    color: "#475569",
    margin: "4px 0 0 0",
    fontWeight: "600",
    fontFamily: "monospace"
  },
  headerRight: {
    textAlign: "right"
  },
  receiptBadge: {
    display: "inline-block",
    background: "#f1f5f9",
    color: "#475569",
    padding: "6px 16px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "700",
    marginBottom: "16px",
    letterSpacing: "1px"
  },
  orderKeyInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  keyRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
    fontSize: "13px"
  },
  keyLabel: {
    color: "#94a3b8",
    fontWeight: "500"
  },
  keyValue: {
    color: "#0f172a",
    fontWeight: "600"
  },
  divider: {
    height: "1px",
    background: "#e2e8f0",
    margin: "0 0 32px 0",
    position: "relative",
    zIndex: 1
  },
  customerSection: {
    marginBottom: "32px",
    position: "relative",
    zIndex: 1
  },
  sectionTitle: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "12px"
  },
  customerInfoGrid: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "40px"
  },
  customerMain: {
    flex: 1
  },
  customerName: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 4px 0"
  },
  customerContact: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0
  },
  customerAddressBox: {
    flex: 1,
    padding: "12px",
    background: "#f8fafc",
    borderRadius: "8px",
    borderLeft: "3px solid #e2e8f0"
  },
  customerAddress: {
    fontSize: "13px",
    color: "#475569",
    margin: 0,
    lineHeight: "1.5"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "40px",
    position: "relative",
    zIndex: 1
  },
  tableHeader: {
    padding: "14px 12px",
    background: "#f8fafc",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "2px solid #e2e8f0"
  },
  tableRow: {
    borderBottom: "1px solid #f1f5f9"
  },
  tableCell: {
    padding: "16px 12px",
    fontSize: "14px",
    color: "#334155"
  },
  productName: {
    fontWeight: "600",
    color: "#0f172a"
  },
  productVariant: {
    fontSize: "12px",
    color: "#94a3b8"
  },
  summaryContainer: {
    display: "flex",
    justifyContent: "space-between",
    position: "relative",
    zIndex: 1
  },
  summaryLeft: {
    maxWidth: "300px"
  },
  paymentStatusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "24px"
  },
  statusLabel: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#94a3b8"
  },
  statusValue: {
    fontSize: "13px",
    fontWeight: "700"
  },
  terms: {
    marginTop: "20px"
  },
  termsTitle: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#475569",
    marginBottom: "8px"
  },
  termsItem: {
    fontSize: "11px",
    color: "#94a3b8",
    margin: "2px 0"
  },
  summaryRight: {
    width: "280px",
    background: "#f8fafc",
    padding: "24px",
    borderRadius: "12px"
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    margin: "12px 0",
    fontSize: "14px"
  },
  summaryLabel: {
    color: "#64748b",
    fontWeight: "500"
  },
  summaryValue: {
    color: "#0f172a",
    fontWeight: "700"
  },
  totalDivider: {
    height: "1px",
    background: "#e2e8f0",
    margin: "16px 0"
  },
  finalTotalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "8px"
  },
  finalTotalLabel: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a"
  },
  finalTotalValue: {
    fontSize: "20px",
    fontWeight: "800"
  },
  footerSpacing: {
    height: "60px"
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    position: "relative",
    zIndex: 1
  },
  signatureSection: {
    textAlign: "center"
  },
  signatureBox: {
    width: "220px"
  },
  signatureLine: {
    borderBottom: "1.5px solid #cbd5e1",
    marginBottom: "12px"
  },
  signatureText: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "1px"
  },
  gratitudeSection: {
    textAlign: "right"
  },
  thankYou: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 4px 0"
  },
  computerGenerated: {
    fontSize: "11px",
    color: "#94a3b8",
    margin: 0
  },
  printSection: {
    marginTop: "40px",
    display: "flex",
    gap: "16px"
  },
  printButton: {
    padding: "16px 32px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)"
  },
  closeButton: {
    padding: "16px 32px",
    background: "white",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "500",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
  },
  printIcon: {
    fontSize: "18px"
  },
  errorContainer: {
    textAlign: "center",
    padding: "60px",
    background: "white",
    borderRadius: "16px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
  }
};

export default PrintReceipt;