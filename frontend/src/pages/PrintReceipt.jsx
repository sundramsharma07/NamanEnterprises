import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

function PrintReceipt() {
  const { order_id } = useParams();

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
        <button onClick={() => window.close()} style={styles.closeButton}>
          Close
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body {
            background: white;
            padding: 0;
            margin: 0;
          }
          #receipt {
            box-shadow: none !important;
            border: none !important;
            padding: 0.5in !important;
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Receipt Content */}
      <div id="receipt" style={styles.receipt}>
        {/* Store Header with Logo/Icon */}
        {/* Store Header with Logo/Icon */}
<div style={styles.header}>
  <div style={styles.storeIcon}>🏪</div>
  <h1 style={styles.storeName}>Naman Enterprises, Ajmatpur</h1>
  <p style={styles.tagline}>Your Trusted Source for Quality Products</p>
  
  {/* Store Contact Information */}
  <p style={styles.storePhone}>📞 {import.meta.env.VITE_STORE_PHONE}</p>
  <p style={styles.storeAddress}>📍 {import.meta.env.VITE_STORE_ADDRESS}</p>
  <p style={styles.gstin}>GSTIN: {import.meta.env.VITE_STORE_GSTIN}</p>
</div>

        <div style={styles.divider} />

        {/* Receipt Title */}
        <h2 style={styles.receiptTitle}>SALES RECEIPT</h2>

        {/* Order Info Grid */}
        <div style={styles.infoGrid}>
          <div style={styles.infoColumn}>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Receipt No:</span>
              <span style={styles.infoValue}>#{order.order_id}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Date:</span>
              <span style={styles.infoValue}>{formatDate(order.created_at)}</span>
            </div>
          </div>
          <div style={styles.infoColumn}>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Customer:</span>
              <span style={styles.infoValue}>{order.customer_name || 'Walk-in Customer'}</span>
            </div>
            {order.customer_phone && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Phone:</span>
                <span style={styles.infoValue}>{order.customer_phone}</span>
              </div>
            )}
            {order.customer_address && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Address:</span>
                <span style={styles.infoValue}>{order.customer_address}</span>
              </div>
            )}
          </div>
        </div>

        <div style={styles.divider} />

        {/* Items Table */}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>S.No</th>
              <th style={styles.tableHeader}>Product</th>
              <th style={styles.tableHeader}>Qty</th>
              <th style={styles.tableHeader}>Unit</th>
              <th style={styles.tableHeader}>Price</th>
              <th style={styles.tableHeader}>Total</th>
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
                <td style={{...styles.tableCell, textAlign: 'right', fontWeight: '500'}}>
                  {formatCurrency(item.line_total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Section */}
        <div style={styles.summarySection}>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Subtotal:</span>
            <span style={styles.summaryValue}>{formatCurrency(order.total_amount)}</span>
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Amount Paid:</span>
            <span style={{...styles.summaryValue, color: 'var(--success)'}}>
              {formatCurrency(order.paid_amount)}
            </span>
          </div>
          <div style={styles.dividerLight} />
          <div style={{...styles.summaryRow, fontSize: '18px'}}>
            <span style={styles.balanceLabel}>Balance Due:</span>
            <span style={{
              ...styles.balanceAmount,
              color: Number(order.remaining_amount) > 0 ? 'var(--danger)' : 'var(--success)'
            }}>
              {formatCurrency(order.remaining_amount)}
            </span>
          </div>
        </div>

        {/* Payment Status */}
        <div style={styles.paymentStatus}>
          <span style={styles.paymentStatusLabel}>Payment Status:</span>
          <span style={{
            ...styles.paymentStatusBadge,
            backgroundColor: Number(order.remaining_amount) === 0 ? 'rgba(22, 163, 74, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            color: Number(order.remaining_amount) === 0 ? 'var(--success)' : 'var(--warning)'
          }}>
            {Number(order.remaining_amount) === 0 ? 'PAID' : 'PARTIAL PAYMENT'}
          </span>
        </div>

        <div style={styles.divider} />

        {/* Footer with Signatures */}
        <div style={styles.footer}>
          <div style={styles.signatureBox}>
            <div style={styles.signatureLine}></div>
            <p style={styles.signatureText}>Customer Signature</p>
          </div>
          
          <div style={styles.signatureBox}>
            <div style={styles.signatureLine}></div>
            <p style={styles.signatureText}>Authorized Signatory</p>
          </div>
        </div>

        {/* Thank You Message */}
        <div style={styles.thankYou}>
          <p style={styles.thankYouText}>Thank you for your business!</p>
          <p style={styles.thankYouSubtext}>This is a computer generated receipt - no signature required</p>
        </div>

        {/* Terms and Conditions */}
        <div style={styles.terms}>
          <p style={styles.termsText}>
            * Goods once sold will not be taken back. * Subject to local jurisdiction.
          </p>
        </div>
      </div>

      {/* Print Button */}
      <div style={styles.printSection} className="no-print">
        <button onClick={() => window.print()} style={styles.printButton}>
          <span style={styles.printIcon}>🖨️</span>
          Print Receipt
        </button>
        <button onClick={() => window.close()} style={styles.closeButton}>
          Close
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f1f5f9",
    padding: "30px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
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
    border: "4px solid var(--bg-sidebar)",
    borderTop: "4px solid var(--primary)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  loadingText: {
    color: "var(--text-muted)",
    fontSize: "16px"
  },
  receipt: {
    maxWidth: "800px",
    margin: "0 auto",
    background: "white",
    padding: "40px",
    borderRadius: "20px",
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
    border: "1px solid #e2e8f0"
  },
  header: {
    textAlign: "center",
    marginBottom: "24px"
  },
  storeIcon: {
    fontSize: "48px",
    marginBottom: "12px"
  },
  storeName: {
    fontSize: "28px",
    fontWeight: "700",
    color: "var(--text-heading)",
    margin: "0 0 8px 0",
    letterSpacing: "-0.02em"
  },
  tagline: {
    fontSize: "16px",
    color: "var(--text-muted)",
    margin: "0 0 12px 0",
    fontStyle: "italic"
  },
  storePhone: {
    fontSize: "14px",
    color: "#64748b",
    margin: "4px 0"
  },
  storeAddress: {
    fontSize: "14px",
    color: "var(--text-muted)",
    margin: "4px 0"
  },
  gstin: {
    fontSize: "14px",
    color: "var(--text-muted)",
    margin: "4px 0",
    fontFamily: "monospace"
  },
  divider: {
    height: "2px",
    background: "linear-gradient(90deg, transparent, var(--primary), transparent)",
    margin: "24px 0"
  },
  dividerLight: {
    height: "1px",
    background: "#e2e8f0",
    margin: "16px 0"
  },
  receiptTitle: {
    textAlign: "center",
    fontSize: "20px",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "24px",
    letterSpacing: "1px"
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    marginBottom: "20px"
  },
  infoColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px"
  },
  infoLabel: {
    color: "var(--text-muted)",
    fontWeight: "500"
  },
  infoValue: {
    color: "var(--text-heading)",
    fontWeight: "600"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "24px"
  },
  tableHeader: {
    padding: "12px 8px",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "2px solid #e2e8f0"
  },
  tableRow: {
    borderBottom: "1px solid #e2e8f0"
  },
  tableCell: {
    padding: "12px 8px",
    fontSize: "14px",
    color: "var(--text-main)"
  },
  productName: {
    fontWeight: "500"
  },
  productVariant: {
    fontSize: "12px",
    color: "var(--text-muted)"
  },
  summarySection: {
    background: "var(--bg-sidebar)",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "20px"
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
    fontSize: "16px"
  },
  summaryLabel: {
    color: "#475569"
  },
  summaryValue: {
    fontWeight: "600",
    color: "#0f172a"
  },
  balanceLabel: {
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
    marginBottom: "24px",
    padding: "12px 16px",
    background: "var(--bg-sidebar)",
    borderRadius: "8px"
  },
  paymentStatusLabel: {
    fontSize: "14px",
    fontWeight: "500",
    color: "var(--text-muted)"
  },
  paymentStatusBadge: {
    padding: "6px 16px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600"
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "32px"
  },
  signatureBox: {
    width: "200px",
    textAlign: "center"
  },
  signatureLine: {
    borderBottom: "2px dashed #94a3b8",
    marginBottom: "8px",
    height: "30px"
  },
  signatureText: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0
  },
  thankYou: {
    textAlign: "center",
    marginBottom: "16px"
  },
  thankYouText: {
    fontSize: "18px",
    fontWeight: "600",
    color: "var(--text-heading)",
    margin: "0 0 4px 0"
  },
  thankYouSubtext: {
    fontSize: "12px",
    color: "var(--text-light)",
    margin: 0
  },
  terms: {
    textAlign: "center",
    fontSize: "11px",
    color: "var(--text-light)",
    borderTop: "1px solid var(--bg-sidebar)",
    paddingTop: "16px"
  },
  termsText: {
    margin: 0
  },
  printSection: {
    maxWidth: "800px",
    margin: "24px auto 0",
    display: "flex",
    gap: "12px",
    justifyContent: "center"
  },
  printButton: {
    padding: "14px 32px",
    background: "#3b82f6",
    border: "none",
    borderRadius: "12px",
    color: "white",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 6px -1px rgba(59,130,246,0.3)"
  },
  closeButton: {
    padding: "14px 32px",
    background: "var(--bg-card)",
    border: "1px solid var(--bg-sidebar)",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "500",
    color: "var(--text-muted)",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  printIcon: {
    fontSize: "20px"
  },
  errorContainer: {
    textAlign: "center",
    padding: "60px 20px",
    background: "white",
    borderRadius: "20px",
    maxWidth: "400px",
    margin: "40px auto",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)"
  }
};

export default PrintReceipt;