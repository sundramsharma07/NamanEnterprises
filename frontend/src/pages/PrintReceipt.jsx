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

  const sendWhatsAppReceipt = () => {
    if (!order.customer_phone) {
      alert("Customer phone number is not available for this order.");
      return;
    }
    const customerName = order.customer_name || 'Customer';
    const date = new Date(order.created_at).toLocaleDateString('en-IN');
    const message = `नमस्ते ${customerName} 🙏,\n\nनमन एंटरप्राइजेज (Naman Enterprises) 🏗️ से खरीदारी करने के लिए आपका बहुत-बहुत धन्यवाद! ✨\n\nआपके ऑर्डर का विवरण नीचे दिया गया है:\n🆔 *ऑर्डर आईडी:* #${order.order_id}\n📅 *दिनांक:* ${date}\n💰 *कुल बिल:* ${formatCurrency(order.total_amount)}\n✅ *जमा राशि:* ${formatCurrency(order.paid_amount)}\n\nहम आशा करते हैं कि आपको हमारी सेवाएँ पसंद आईं। 🌟\nआपका दिन शुभ हो! 😊`;
    
    const encodedMessage = encodeURIComponent(message);
    let cleanPhone = order.customer_phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
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
            padding: 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
          }
          @page {
            size: A4;
            margin: 1cm;
          }
          .table-header { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; }
          .summary-right { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        #receipt {
          position: relative;
          overflow: hidden;
        }

        @media (max-width: 768px) {
          #receipt { padding: 20px !important; }
          .receipt-header { flex-direction: column !important; align-items: flex-start !important; }
          .header-right { text-align: left !important; margin-top: 20px !important; }
          .key-row { justify-content: flex-start !important; }
          .customer-grid { flex-direction: column !important; gap: 10px !important; }
          .payment-box { text-align: left !important; }
          .summary-container { flex-direction: column !important; gap: 20px !important; }
          .summary-right { width: 100% !important; box-sizing: border-box; }
          .table-wrapper { width: 100%; overflow-x: auto; }
          .footer-section { flex-direction: column !important; align-items: flex-start !important; gap: 30px !important; }
          .gratitude { text-align: left !important; }
          .print-section { flex-wrap: wrap; justify-content: center; }
        }
      `}</style>

      {/* Receipt Content */}
      <div id="receipt" style={styles.receipt}>
        {/* Watermark */}
        <div style={styles.watermarkContainer}>
          <img src="/logo.png" style={styles.watermark} alt="" />
        </div>

        {/* Header Section */}
        <div className="receipt-header" style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.logoWrapper}>
              <img src="/logo.png" style={styles.logoImage} alt="Naman Enterprises Logo" />
            </div>
            <div style={styles.storeDetails}>
              <h1 style={styles.storeName}>Naman Enterprises</h1>
              <p style={styles.storeSubtext}>Ajmatpur, Building Materials Store</p>
              <div style={styles.contactInfo}>
                <span style={styles.contactItem}>📞 {import.meta.env.VITE_STORE_PHONE || "9934271372"}</span>
                <span style={styles.contactItem}>📍 Ajmatpur, Bihar</span>
              </div>
              {import.meta.env.VITE_STORE_GSTIN && (
                <p style={styles.gstin}>GSTIN: {import.meta.env.VITE_STORE_GSTIN}</p>
              )}
            </div>
          </div>
          <div className="header-right" style={styles.headerRight}>
            <div style={styles.receiptBadge}>SALES RECEIPT</div>
            <div style={styles.orderKeyInfo}>
              <div className="key-row" style={styles.keyRow}>
                <span style={styles.keyLabel}>Invoice No :</span>
                <span style={styles.keyValue}>#{order.order_id}</span>
              </div>
              <div className="key-row" style={styles.keyRow}>
                <span style={styles.keyLabel}>Date :</span>
                <span style={styles.keyValue}>{formatDate(order.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.divider} />

        {/* Customer Info */}
        <div style={styles.customerSection}>
          <div className="customer-grid" style={styles.customerInfoGrid}>
            <div style={styles.customerMain}>
              <div style={styles.sectionTitle}>BILL TO:</div>
              <p style={styles.customerName}>{order.customer_name || 'Walk-in Customer'}</p>
              {order.customer_phone && <p style={styles.customerContact}>📞 {order.customer_phone}</p>}
              {order.customer_address && <p style={styles.customerAddressSimple}>{order.customer_address}</p>}
            </div>
            <div className="payment-box" style={styles.paymentMethodBox}>
              <div style={styles.sectionTitle}>PAYMENT METHOD:</div>
              <p style={styles.paymentMethodValue}>{order.payment_method || 'Cash'}</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="table-wrapper">
          <table style={styles.table}>
            <thead>
              <tr>
                <th className="table-header" style={{...styles.tableHeader, width: '40px'}}>#</th>
                <th className="table-header" style={styles.tableHeader}>Item Description</th>
                <th className="table-header" style={{...styles.tableHeader, textAlign: 'center'}}>Qty</th>
                <th className="table-header" style={{...styles.tableHeader, textAlign: 'center'}}>Unit</th>
                <th className="table-header" style={{...styles.tableHeader, textAlign: 'right'}}>Rate</th>
                <th className="table-header" style={{...styles.tableHeader, textAlign: 'right'}}>Total</th>
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
        </div>

        {/* Totals Section */}
        <div className="summary-container" style={styles.summaryContainer}>
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
              <p style={styles.termsItem}>* This is a computer generated invoice.</p>
            </div>
          </div>
          
          <div className="summary-right" style={styles.summaryRight}>
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

        {/* Footer */}
        <div className="footer-section" style={styles.footer}>
          <div style={styles.signatureSection}>
            <div style={styles.signatureBox}>
              <div style={styles.signatureLine} />
              <p style={styles.signatureText}>Authorized Signatory</p>
            </div>
          </div>
          
          <div className="gratitude" style={styles.gratitudeSection}>
            <p style={styles.thankYou}>Thank you for your business!</p>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="print-section no-print" style={styles.printSection}>
        <button 
          onClick={() => {
            setTimeout(() => window.print(), 200);
          }} 
          style={styles.printButton}
        >
          <span style={styles.printIcon}>🖨️</span>
          Print
        </button>

        <button 
          onClick={sendWhatsAppReceipt} 
          style={{ ...styles.printButton, background: '#25D366' }}
        >
          <span>💬</span>
          WhatsApp
        </button>
        
        {navigator.share && (
          <button 
            onClick={() => {
              navigator.share({
                title: `Invoice #${order.order_id}`,
                text: `Here is your invoice from Naman Enterprises. Total: ${formatCurrency(order.total_amount)}`,
                url: window.location.href,
              }).catch(console.error);
            }} 
            style={{ ...styles.printButton, background: '#10b981' }}
          >
            <span>🔗</span>
            Share
          </button>
        )}

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
    padding: "20px",
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
    maxWidth: "800px",
    background: "white",
    padding: "40px",
    borderRadius: "8px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    position: "relative",
    border: "1px solid #f1f5f9"
  },
  watermarkContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%) rotate(-15deg)",
    opacity: "0.03",
    width: "50%",
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
    marginBottom: "20px",
    position: "relative",
    zIndex: 1
  },
  headerLeft: {
    display: "flex",
    gap: "16px",
    alignItems: "center"
  },
  logoWrapper: {
    width: "60px",
    height: "60px",
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
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px"
  },
  storeSubtext: {
    fontSize: "13px",
    color: "#64748b",
    margin: "0 0 4px 0",
    fontWeight: "500"
  },
  contactInfo: {
    display: "flex",
    gap: "12px",
    fontSize: "11px",
    color: "#475569"
  },
  contactItem: {
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  gstin: {
    fontSize: "11px",
    color: "#475569",
    margin: "2px 0 0 0",
    fontWeight: "600"
  },
  headerRight: {
    textAlign: "right"
  },
  receiptBadge: {
    display: "inline-block",
    background: "#f1f5f9",
    color: "#475569",
    padding: "4px 12px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "700",
    marginBottom: "12px",
    letterSpacing: "0.5px"
  },
  orderKeyInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px"
  },
  keyRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "6px",
    fontSize: "12px"
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
    margin: "0 0 20px 0",
    position: "relative",
    zIndex: 1
  },
  customerSection: {
    marginBottom: "24px",
    position: "relative",
    zIndex: 1
  },
  sectionTitle: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "6px"
  },
  customerInfoGrid: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px"
  },
  customerMain: {
    flex: 1
  },
  customerName: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 2px 0"
  },
  customerContact: {
    fontSize: "13px",
    color: "#64748b",
    margin: 0
  },
  customerAddressSimple: {
    fontSize: "12px",
    color: "#475569",
    margin: "4px 0 0 0",
    lineHeight: "1.4"
  },
  paymentMethodBox: {
    textAlign: "right"
  },
  paymentMethodValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "24px",
    position: "relative",
    zIndex: 1
  },
  tableHeader: {
    padding: "10px 8px",
    background: "#f8fafc",
    textAlign: "left",
    fontSize: "11px",
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "1.5px solid #e2e8f0"
  },
  tableRow: {
    borderBottom: "1px solid #f1f5f9"
  },
  tableCell: {
    padding: "12px 8px",
    fontSize: "13px",
    color: "#334155"
  },
  productName: {
    fontWeight: "600",
    color: "#0f172a"
  },
  productVariant: {
    fontSize: "11px",
    color: "#94a3b8"
  },
  summaryContainer: {
    display: "flex",
    justifyContent: "space-between",
    position: "relative",
    zIndex: 1,
    gap: "40px"
  },
  summaryLeft: {
    flex: 1
  },
  paymentStatusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "16px"
  },
  statusLabel: {
    fontSize: "12px",
    fontWeight: "500",
    color: "#94a3b8"
  },
  statusValue: {
    fontSize: "12px",
    fontWeight: "700"
  },
  terms: {
    marginTop: "12px"
  },
  termsTitle: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#475569",
    marginBottom: "4px"
  },
  termsItem: {
    fontSize: "10px",
    color: "#94a3b8",
    margin: "1px 0"
  },
  summaryRight: {
    width: "240px",
    background: "#f8fafc",
    padding: "16px",
    borderRadius: "8px"
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    margin: "8px 0",
    fontSize: "13px"
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
    margin: "12px 0"
  },
  finalTotalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  finalTotalLabel: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#0f172a"
  },
  finalTotalValue: {
    fontSize: "18px",
    fontWeight: "800"
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    position: "relative",
    zIndex: 1,
    marginTop: "40px"
  },
  signatureSection: {
    textAlign: "center"
  },
  signatureBox: {
    width: "180px"
  },
  signatureLine: {
    borderBottom: "1px solid #cbd5e1",
    marginBottom: "8px"
  },
  signatureText: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  gratitudeSection: {
    textAlign: "right"
  },
  thankYou: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0
  },
  printSection: {
    marginTop: "32px",
    display: "flex",
    gap: "12px"
  },
  printButton: {
    padding: "12px 24px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)"
  },
  closeButton: {
    padding: "12px 24px",
    background: "white",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
  },
  printIcon: {
    fontSize: "16px"
  },
  errorContainer: {
    textAlign: "center",
    padding: "40px",
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
  }
};

export default PrintReceipt;