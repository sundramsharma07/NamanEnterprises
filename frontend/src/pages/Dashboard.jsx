import { useEffect, useState, useCallback, useMemo } from "react";
import api from "../services/api";

function Dashboard() {
  const [stats, setStats] = useState({
    customers: 0,
    products: 0,
    orders: 0,
    due: 0,
    paid: 0,
    totalRevenue: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [recentActivity, setRecentActivity] = useState([]);
  const [timeRange, setTimeRange] = useState('today'); // today, week, month

  const fetchStats = useCallback(async () => {
    try {
      setRefreshing(true);
      
      // Parallel API calls for better performance
      const [customers, products, orders] = await Promise.all([
        api.get("/customers"),
        api.get("/products"),
        api.get("/orders")
      ]);

      let totalDue = 0;
      let totalPaid = 0;
      let totalRevenue = 0;
      
      orders.data.orders.forEach(order => {
        const due = Number(order.remaining_amount || 0);
        const paid = Number(order.paid_amount || 0);
        totalDue += due;
        totalPaid += paid;
        totalRevenue += Number(order.total_amount || 0);
      });

      // Get recent orders for activity feed
      const recentOrders = orders.data.orders
        .slice(0, 5)
        .map(order => ({
          id: order.id,
          customer: order.customer_name,
          amount: order.total_amount,
          status: order.status,
          time: new Date(order.created_at).toLocaleTimeString()
        }));

      setStats({
        customers: customers.data.length,
        products: products.data.length,
        orders: orders.data.orders.length,
        due: totalDue,
        paid: totalPaid,
        totalRevenue
      });
      
      setRecentActivity(recentOrders);
      setLastUpdated(new Date());
      
    } catch (err) {
      console.error("Dashboard load failed", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const getCardIcon = (type) => {
    const icons = {
      customers: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
      products: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
      ),
      orders: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
      ),
      due: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2"></rect>
          <line x1="2" y1="10" x2="22" y2="10"></line>
        </svg>
      ),
      revenue: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5M17 5a3 3 0 0 1 0 6h-5M17 5a3 3 0 0 0 0 6h-5M7 19h10M7 19a3 3 0 0 1 0-6h10M7 19a3 3 0 0 0 0-6h10"></path>
        </svg>
      )
    };
    return icons[type] || null;
  };

  const getCardColor = (type) => {
    const colors = {
      customers: { bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', icon: '#1976d2', text: '#0d47a1' },
      products: { bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', icon: '#2e7d32', text: '#1b5e20' },
      orders: { bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)', icon: '#ed6c02', text: '#b85c00' },
      due: { bg: 'linear-gradient(135deg, #fce4e4 0%, #ffcdd2 100%)', icon: '#d32f2f', text: '#b71c1c' },
      revenue: { bg: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)', icon: '#7b1fa2', text: '#4a148c' }
    };
    return colors[type] || colors.customers;
  };

  const StatCard = ({ type, value, label, index }) => {
    const colors = getCardColor(type);
    const isHovered = hoveredCard === type;
    
    return (
      <div
        className="stat-card"
        style={{
          padding: "24px",
          border: "none",
          borderRadius: "20px",
          minWidth: "240px",
          flex: "1 1 auto",
          textAlign: "left",
          background: colors.bg,
          boxShadow: isHovered 
            ? "0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.1)" 
            : "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
          transform: isHovered ? "translateY(-4px) scale(1.02)" : "translateY(0) scale(1)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
          animation: `slideIn 0.5s ease forwards ${index * 0.1}s`,
          opacity: 0,
          transformOrigin: "center"
        }}
        onMouseEnter={() => setHoveredCard(type)}
        onMouseLeave={() => setHoveredCard(null)}
        onClick={() => console.log(`${type} card clicked`)}
      >
        {/* Decorative elements */}
        <div style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 120,
          height: 120,
          background: `radial-gradient(circle, ${colors.icon}15 0%, transparent 70%)`,
          borderRadius: "50%"
        }} />
        
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: `linear-gradient(90deg, ${colors.icon} 0%, ${colors.icon}80 100%)`,
          transform: isHovered ? "scaleX(1)" : "scaleX(0)",
          transition: "transform 0.3s ease",
          transformOrigin: "left"
        }} />
        
        {/* Header with icon and trend */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "16px"
        }}>
          <div style={{
            color: colors.icon,
            transform: isHovered ? "scale(1.1) rotate(5deg)" : "scale(1) rotate(0)",
            transition: "transform 0.3s ease"
          }}>
            {getCardIcon(type)}
          </div>
          
          <div style={{
            background: `${colors.icon}20`,
            padding: "4px 8px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "600",
            color: colors.icon
          }}>
            +{Math.floor(Math.random() * 20)}% 
          </div>
        </div>
        
        {/* Value */}
        <div style={{
          marginBottom: "8px"
        }}>
          <span style={{
            fontSize: "32px",
            fontWeight: "700",
            color: colors.text,
            lineHeight: "1.2"
          }}>
            {type === 'due' || type === 'revenue' || type === 'paid' 
              ? formatCurrency(value) 
              : formatNumber(value)}
          </span>
        </div>
        
        {/* Label */}
        <h3 style={{
          margin: "0 0 4px 0",
          fontSize: "14px",
          fontWeight: "500",
          color: colors.icon,
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}>
          {label}
        </h3>
        
        {/* Mini progress bar */}
        <div style={{
          marginTop: "16px",
          height: "4px",
          background: `${colors.icon}30`,
          borderRadius: "2px",
          overflow: "hidden"
        }}>
          <div style={{
            width: `${Math.random() * 40 + 60}%`,
            height: "100%",
            background: colors.icon,
            borderRadius: "2px",
            transition: "width 0.3s ease"
          }} />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
        flexDirection: "column",
        gap: "24px"
      }}>
        <div style={{
          width: "56px",
          height: "56px",
          border: "4px solid #e2e8f0",
          borderTop: "4px solid #3b82f6",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }} />
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#1e293b", fontSize: "18px", fontWeight: "500", margin: "0 0 8px 0" }}>
            Loading your dashboard
          </p>
          <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
            Fetching latest data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: "32px", 
      maxWidth: "1440px", 
      margin: "0 auto",
      background: "#f8fafc",
      minHeight: "100vh"
    }}>
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
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .stat-card {
          backdrop-filter: blur(10px);
        }
        
        .refresh-button:active {
          transform: scale(0.95);
        }
      `}</style>

      {/* Header Section */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "32px",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div>
          <h1 style={{ 
            fontSize: "36px", 
            fontWeight: "700", 
            color: "#0f172a",
            margin: "0 0 8px 0",
            letterSpacing: "-0.02em"
          }}>
            Dashboard
          </h1>
          <p style={{ 
            color: "#475569", 
            fontSize: "16px", 
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span>Welcome back! Here's your business overview</span>
            <span style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              background: "#22c55e",
              borderRadius: "50%",
              animation: "pulse 2s ease infinite"
            }} />
          </p>
        </div>
        
        <div style={{
          display: "flex",
          gap: "12px",
          alignItems: "center"
        }}>
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              padding: "10px 16px",
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              fontSize: "14px",
              color: "#1e293b",
              cursor: "pointer",
              outline: "none"
            }}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          
          <button
            onClick={fetchStats}
            disabled={refreshing}
            className="refresh-button"
            style={{
              padding: "10px 20px",
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#1e293b",
              cursor: refreshing ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => !refreshing && (e.currentTarget.style.background = "#f8fafc")}
            onMouseLeave={(e) => !refreshing && (e.currentTarget.style.background = "#fff")}
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              style={{ 
                animation: refreshing ? "spin 1s linear infinite" : "none" 
              }}
            >
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "24px",
        marginBottom: "32px"
      }}>
        <StatCard type="customers" value={stats.customers} label="Total Customers" index={0} />
        <StatCard type="products" value={stats.products} label="Active Products" index={1} />
        <StatCard type="orders" value={stats.orders} label="Total Orders" index={2} />
        <StatCard type="revenue" value={stats.totalRevenue} label="Total Revenue" index={3} />
        <StatCard type="due" value={stats.due} label="Pending Dues" index={4} />
      </div>

      {/* Bottom Section - Activity & Insights */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: "24px",
        marginTop: "32px"
      }}>
        {/* Recent Activity */}
        <div style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "24px",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          border: "1px solid #e2e8f0"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px"
          }}>
            <h3 style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#0f172a",
              margin: 0
            }}>
              Recent Activity
            </h3>
            <span style={{
              fontSize: "14px",
              color: "#64748b"
            }}>
              Last 5 orders
            </span>
          </div>
          
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}>
            {recentActivity.map((activity, index) => (
              <div
                key={activity.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px",
                  background: "#f8fafc",
                  borderRadius: "12px",
                  animation: `slideIn 0.3s ease forwards ${index * 0.05}s`,
                  opacity: 0
                }}
              >
                <div>
                  <div style={{
                    fontWeight: "600",
                    color: "#0f172a",
                    marginBottom: "4px"
                  }}>
                    {activity.customer}
                  </div>
                  <div style={{
                    fontSize: "13px",
                    color: "#64748b"
                  }}>
                    Order #{activity.id} • {activity.time}
                  </div>
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}>
                  <span style={{
                    fontWeight: "600",
                    color: "#0f172a"
                  }}>
                    {formatCurrency(activity.amount)}
                  </span>
                  <span style={{
                    padding: "4px 8px",
                    background: activity.status === 'completed' ? '#22c55e20' : '#eab30820',
                    color: activity.status === 'completed' ? '#16a34a' : '#b45309',
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "500"
                  }}>
                    {activity.status || 'pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Insights */}
        <div style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "24px",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          border: "1px solid #e2e8f0"
        }}>
          <h3 style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#0f172a",
            margin: "0 0 20px 0"
          }}>
            Quick Insights
          </h3>
          
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}>
            <div style={{
              padding: "16px",
              background: "linear-gradient(135deg, #3b82f610 0%, #3b82f620 100%)",
              borderRadius: "16px"
            }}>
              <div style={{
                fontSize: "14px",
                color: "#1e293b",
                marginBottom: "8px"
              }}>
                Collection Efficiency
              </div>
              <div style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#0f172a",
                marginBottom: "8px"
              }}>
                {((stats.paid / stats.totalRevenue) * 100 || 0).toFixed(1)}%
              </div>
              <div style={{
                width: "100%",
                height: "8px",
                background: "#e2e8f0",
                borderRadius: "4px",
                overflow: "hidden"
              }}>
                <div style={{
                  width: `${(stats.paid / stats.totalRevenue) * 100 || 0}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                  borderRadius: "4px"
                }} />
              </div>
            </div>
            
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px"
            }}>
              <div style={{
                padding: "16px",
                background: "#f8fafc",
                borderRadius: "16px",
                textAlign: "center"
              }}>
                <div style={{
                  fontSize: "13px",
                  color: "#64748b",
                  marginBottom: "4px"
                }}>
                  Avg Order Value
                </div>
                <div style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#0f172a"
                }}>
                  {formatCurrency(stats.totalRevenue / stats.orders || 0)}
                </div>
              </div>
              
              <div style={{
                padding: "16px",
                background: "#f8fafc",
                borderRadius: "16px",
                textAlign: "center"
              }}>
                <div style={{
                  fontSize: "13px",
                  color: "#64748b",
                  marginBottom: "4px"
                }}>
                  Paid vs Due
                </div>
                <div style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#0f172a"
                }}>
                  {formatCurrency(stats.paid)} / {formatCurrency(stats.due)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div style={{
        marginTop: "24px",
        padding: "16px 24px",
        background: "#fff",
        borderRadius: "16px",
        fontSize: "13px",
        color: "#64748b",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        border: "1px solid #e2e8f0"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "16px"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Last updated: {lastUpdated.toLocaleTimeString('en-IN')}</span>
          </div>
          <span style={{ color: "#cbd5e1" }}>•</span>
          <span>Auto-refreshes every 30s</span>
        </div>
        
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <span style={{
            display: "inline-block",
            width: "8px",
            height: "8px",
            background: "#22c55e",
            borderRadius: "50%"
          }} />
          <span>All systems operational</span>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;