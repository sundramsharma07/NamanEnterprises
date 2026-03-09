import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function DueCustomers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("due_desc");
  const [totalDueAmount, setTotalDueAmount] = useState(0);

  const fetchDueCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders/due/customers");
      const data = res.data.customers || [];
      setCustomers(data);
      
      const total = data.reduce((sum, c) => sum + (Number(c.total_due) || 0), 0);
      setTotalDueAmount(total);
    } catch (error) {
      console.error("Failed to fetch due customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDueCustomers();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const filteredAndSortedCustomers = customers
    .filter(customer => 
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm)
    )
    .sort((a, b) => {
      switch(sortBy) {
        case 'due_desc':
          return (b.total_due || 0) - (a.total_due || 0);
        case 'due_asc':
          return (a.total_due || 0) - (b.total_due || 0);
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'name_desc':
          return (b.name || '').localeCompare(a.name || '');
        default:
          return 0;
      }
    });

  const handleViewPay = (customerId) => {
    navigate(`/customer-due/${customerId}`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading due customers...</p>
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
        
        /* Hide print section on screen */
        #print-section {
          display: none;
        }
        
        /* Print Styles - Only apply when printing */
        @media print {
          /* Hide everything on screen */
          body * {
            visibility: hidden;
          }
          
          /* Show only print section */
          #print-section, #print-section * {
            visibility: visible;
          }
          
          #print-section {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white;
          }
          
          .no-print {
            display: none !important;
          }
          
          #print-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          
          #print-table th {
            background: #f0f0f0;
            padding: 12px;
            text-align: left;
            border: 1px solid #ddd;
            font-weight: bold;
          }
          
          #print-table td {
            padding: 10px 12px;
            border: 1px solid #ddd;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 30px;
          }
          
          .print-header h1 {
            font-size: 24px;
            margin: 0 0 5px 0;
          }
          
          .print-header h2 {
            font-size: 20px;
            margin: 0 0 10px 0;
            color: #333;
          }
          
          .print-header p {
            font-size: 14px;
            margin: 5px 0;
            color: #666;
          }
          
          .print-summary {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #ccc;
            background: #f9f9f9;
          }
          
          .print-summary div {
            font-size: 14px;
          }
          
          .print-footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px dashed #ccc;
            padding-top: 15px;
          }
          
          .print-footer p {
            margin: 5px 0;
          }
        }
        
        /* Regular screen styles */
        .view-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(59,130,246,0.3);
        }
      `}</style>

      {/* Regular Screen Content */}
      <div>
        {/* Header Section */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Customers With Dues</h1>
            <p style={styles.subtitle}>
              Track and manage customer payments • {customers.length} customers have dues
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>👥</div>
            <div>
              <div style={styles.summaryLabel}>Customers with Dues</div>
              <div style={styles.summaryValue}>{customers.length}</div>
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>💰</div>
            <div>
              <div style={styles.summaryLabel}>Total Due Amount</div>
              <div style={{...styles.summaryValue, color: '#dc2626'}}>
                {formatCurrency(totalDueAmount)}
              </div>
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>📊</div>
            <div>
              <div style={styles.summaryLabel}>Average Due</div>
              <div style={styles.summaryValue}>
                {formatCurrency(totalDueAmount / (customers.length || 1))}
              </div>
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>🏆</div>
            <div>
              <div style={styles.summaryLabel}>Highest Due</div>
              <div style={styles.summaryValue}>
                {formatCurrency(Math.max(...customers.map(c => c.total_due || 0), 0))}
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div style={styles.filterContainer}>
          <div style={styles.searchWrapper}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search by customer name or phone..."
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
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={styles.sortSelect}
          >
            <option value="due_desc">Highest Due First</option>
            <option value="due_asc">Lowest Due First</option>
            <option value="name_asc">Name (A to Z)</option>
            <option value="name_desc">Name (Z to A)</option>
          </select>
        </div>

        {/* Screen Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead style={styles.tableHead}>
              <tr>
                <th style={styles.th}>S.No</th>
                <th style={styles.th}>Customer Name</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Due Amount</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedCustomers.length > 0 ? (
                filteredAndSortedCustomers.map((customer, index) => {
                  const dueAmount = Number(customer.total_due) || 0;
                  const dueSeverity = 
                    dueAmount > 10000 ? 'high' :
                    dueAmount > 5000 ? 'medium' : 'low';
                  
                  const severityColor = {
                    high: '#dc2626',
                    medium: '#f59e0b',
                    low: '#f97316'
                  }[dueSeverity];

                  return (
                    <tr key={customer.id} style={styles.tableRow}>
                      <td style={styles.td}>{index + 1}</td>
                      <td style={styles.td}>
                        <div style={styles.customerInfo}>
                          <div style={styles.customerAvatar}>
                            {customer.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={styles.customerName}>{customer.name}</div>
                            <div style={styles.customerId}>ID: #{customer.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <a href={`tel:${customer.phone}`} style={styles.phoneLink}>
                          📞 {customer.phone}
                        </a>
                      </td>
                      <td style={styles.td}>
                        <span style={{...styles.dueAmount, color: severityColor}}>
                          {formatCurrency(dueAmount)}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.dueBadge,
                          backgroundColor: `${severityColor}20`,
                          color: severityColor
                        }}>
                          {dueSeverity === 'high' ? '⚠️ Critical' :
                           dueSeverity === 'medium' ? '⚡ Moderate' : '● Low'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => handleViewPay(customer.id)}
                          style={styles.viewButton}
                          className="view-button"
                        >
                          <span style={styles.viewIcon}>💰</span>
                          View & Pay
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" style={styles.noData}>
                    {searchTerm ? "No customers match your search" : "No customers with dues found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with Summary and Print Button */}
        <div style={styles.footer}>
          <div style={styles.resultsInfo}>
            Showing {filteredAndSortedCustomers.length} of {customers.length} customers
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={styles.clearAllButton}
              >
                Clear Search
              </button>
            )}
          </div>
          
          <div style={styles.actionButtons}>
            <button
              onClick={handlePrint}
              style={styles.printButton}
            >
              <span style={styles.printIcon}>🖨️</span>
              Print Due List
            </button>
            
            <button
              onClick={() => navigate('/customers')}
              style={styles.quickActionButton}
            >
              <span style={styles.quickActionIcon}>📋</span>
              All Customers
            </button>
            
            <button
              onClick={() => navigate('/orders')}
              style={styles.quickActionButton}
            >
              <span style={styles.quickActionIcon}>📦</span>
              All Orders
            </button>
          </div>
        </div>
      </div>

      {/* Print Section - Hidden on screen, visible only when printing */}
      <div id="print-section">
        <div className="print-header">
          <h1>Naman Enterprises, Ajmatpur</h1>
          <h2>Customers with Dues Report</h2>
          <p>Generated on: {new Date().toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>

        <div className="print-summary">
          <div><strong>Total Customers:</strong> {filteredAndSortedCustomers.length}</div>
          <div><strong>Total Due Amount:</strong> {formatCurrency(filteredAndSortedCustomers.reduce((sum, c) => sum + (Number(c.total_due) || 0), 0))}</div>
          <div><strong>Report Type:</strong> Due List Summary</div>
        </div>

        <table id="print-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Customer Name</th>
              <th>Phone</th>
              <th>Due Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedCustomers.length > 0 ? (
              filteredAndSortedCustomers.map((customer, index) => {
                const dueAmount = Number(customer.total_due) || 0;
                return (
                  <tr key={customer.id}>
                    <td>{index + 1}</td>
                    <td>
                      {customer.name}
                      <div style={{fontSize: '10pt', color: '#666'}}>ID: #{customer.id}</div>
                    </td>
                    <td>{customer.phone}</td>
                    <td>{formatCurrency(dueAmount)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" style={{textAlign: 'center', padding: '40px'}}>
                  No customers with dues found
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{background: '#f5f5f5', fontWeight: 'bold'}}>
              <td colSpan="3" style={{textAlign: 'right'}}>Total Due Amount:</td>
              <td>{formatCurrency(filteredAndSortedCustomers.reduce((sum, c) => sum + (Number(c.total_due) || 0), 0))}</td>
            </tr>
          </tfoot>
        </table>

        <div className="print-footer">
          <p>This is a computer generated report - no signature required</p>
          <p>Naman Enterprises, Ajmatpur • Phone: {import.meta.env.VITE_STORE_PHONE || '+91 9XXXXXXXXX'}</p>
        </div>
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
  filterContainer: {
    display: "flex",
    gap: "16px",
    marginBottom: "24px",
    flexWrap: "wrap"
  },
  searchWrapper: {
    position: "relative",
    flex: "2",
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
  sortSelect: {
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
    border: "1px solid #e2e8f0",
    marginBottom: "20px"
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
  customerInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  customerAvatar: {
    width: "40px",
    height: "40px",
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "18px",
    fontWeight: "600"
  },
  customerName: {
    fontWeight: "600",
    marginBottom: "4px"
  },
  customerId: {
    fontSize: "12px",
    color: "#64748b"
  },
  phoneLink: {
    color: "#3b82f6",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    ':hover': {
      textDecoration: "underline"
    }
  },
  dueAmount: {
    fontSize: "16px",
    fontWeight: "600"
  },
  dueBadge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
    display: "inline-block"
  },
  viewButton: {
    padding: "8px 20px",
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
  viewIcon: {
    fontSize: "14px"
  },
  noData: {
    padding: "48px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "16px"
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginTop: "20px"
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
  actionButtons: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap"
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
    boxShadow: "0 4px 6px -1px rgba(59,130,246,0.3)"
  },
  printIcon: {
    fontSize: "16px"
  },
  quickActionButton: {
    padding: "12px 20px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#475569",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s ease"
  },
  quickActionIcon: {
    fontSize: "16px"
  }
};

export default DueCustomers;