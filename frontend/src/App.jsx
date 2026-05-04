import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
  useNavigate,
} from "react-router-dom";
import {
  useAuth,
  useUser,
  useClerk,
  UserButton,
  AuthenticateWithRedirectCallback,
} from "@clerk/react";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import api from "./services/api";
import { Search, Bell } from "lucide-react";
import Navbar from "./components/Navbar";
import GreetingPage from "./pages/GreetingPage";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import CreateOrder from "./pages/CreateOrder";
import PrintReceipt from "./pages/PrintReceipt";
import OrderDetails from "./pages/OrderDetails";
import DueCustomers from "./pages/DueCustomers";
import CustomerDueDetails from "./pages/CustomerDueDetails";
import Login from "./pages/Login";
import CustomerProfile from "./pages/CustomerProfile";

function ProtectedRoute({ children }) {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return (
      <div style={{ 
        padding: "60px", 
        textAlign: "center", 
        color: "#64748b",
        fontFamily: "'Inter', sans-serif",
        fontSize: "15px",
        fontWeight: "500"
      }}>
        Loading...
      </div>
    );
  }

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  // Clerk authentication is sufficient - no additional admin checks needed
  return children;
}

function TopBar({ onMenuClick, className }) {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get("/orders/due/customers");
        const alerts = (res.data.customers || [])
          .filter(c => Number(c.total_due) > 5000) // Threshold for critical debt
          .map(c => ({
            id: c.id,
            title: `Credit Warning: ${c.name}`,
            msg: `High outstanding balance (${formatCurrency(c.total_due)}). Avoid further credit.`,
            type: 'alert'
          }));
        setNotifications(alerts);
      } catch (err) {
        console.error("Alerts fetch error:", err);
      }
    };
    fetchAlerts();
  }, []);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(num || 0);
  };

  useEffect(() => {
    // Clear search bar when navigating away from search-related paths
    if (!location.search.includes("q=")) {
      setQuery("");
    }
  }, [location]);

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      if (query.trim()) {
        // If on products page, stay on products, otherwise go to customers
        const target = location.pathname.includes("products") ? "/products" : "/customers";
        navigate(`${target}?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  if (!isLoaded || !userId || !user) return null;

  return (
    <div
      className={className}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 32px",
        background: "#ffffff",
        borderBottom: "1px solid #f1f5f9",
        position: "sticky",
        top: "64px",
        zIndex: 10,
      }}
    >
      {/* ... (Mobile menu button) ... */}
      <button 
        onClick={onMenuClick}
        style={{
          display: "none",
          background: "none",
          border: "none",
          color: "#64748b",
          cursor: "pointer",
          padding: "8px",
          borderRadius: "8px",
          marginRight: "16px",
        }}
        className="mobile-menu-btn"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      <div className="hide-mobile" style={{ position: "relative", width: "400px", flex: 1, maxWidth: "400px" }}>
        <Search 
          size={16} 
          style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} 
        />
        <input 
          type="text" 
          placeholder="Search products or customers... (Press Enter)" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearch}
          style={{
            width: "100%",
            padding: "10px 14px 10px 40px",
            background: "#F8FAFC",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            fontSize: "13px",
            color: "#475569",
            outline: "none",
            fontFamily: "inherit",
            fontWeight: "400",
            transition: "border-color 0.2s",
          }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{ position: "relative" }}>
          <button 
            onClick={() => setShowNotif(!showNotif)}
            style={{ 
              background: "none", 
              border: "none", 
              color: notifications.length > 0 ? "#ef4444" : "#94a3b8", 
              cursor: "pointer",
              padding: "6px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bell size={18} className={notifications.length > 0 ? "pulse-notif" : ""} />
            {notifications.length > 0 && (
              <div style={{ position: "absolute", top: "4px", right: "4px", width: "8px", height: "8px", background: "#ef4444", borderRadius: "50%", border: "2px solid #fff" }} />
            )}
          </button>

          <AnimatePresence>
            {showNotif && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  width: "300px",
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  padding: "16px",
                  marginTop: "12px",
                  zIndex: 100,
                }}
              >
                <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: "700", color: "#0F172A" }}>Notifications</h4>
                {notifications.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {notifications.map(n => (
                      <div key={n.id} style={{ padding: "10px", background: "#FEF2F2", borderRadius: "8px", border: "1px solid #FEE2E2" }}>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: "#B91C1C", marginBottom: "2px" }}>{n.title}</div>
                        <div style={{ fontSize: "11px", color: "#991B1B" }}>{n.msg}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "12px" }}>No urgent alerts</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div style={{ width: "1px", height: "24px", background: "#e2e8f0" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "#0F172A" }}>{user.fullName || "Admin"}</p>
            <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", fontWeight: "400" }}>Administrator</p>
          </div>
          <UserButton afterSignOutUrl="/login" />
        </div>
      </div>
    </div>
  );
}

function BackgroundDesign() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: -1, overflow: "hidden", pointerEvents: "none", background: "#F8FAFC" }}>
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute",
          top: "-10%",
          left: "-10%",
          width: "40vw",
          height: "40vw",
          background: "radial-gradient(circle, rgba(37, 99, 235, 0.05) 0%, rgba(37, 99, 235, 0) 70%)",
          borderRadius: "50%",
          filter: "blur(60px)",
        }}
      />
      <motion.div
        animate={{
          x: [0, -80, 0],
          y: [0, 100, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute",
          bottom: "10%",
          right: "-5%",
          width: "35vw",
          height: "35vw",
          background: "radial-gradient(circle, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0) 70%)",
          borderRadius: "50%",
          filter: "blur(60px)",
        }}
      />
      <div style={{ position: "absolute", inset: 0, opacity: 0.2, backgroundImage: "radial-gradient(#e2e8f0 0.5px, transparent 0.5px)", backgroundSize: "24px 24px" }} />
    </div>
  );
}

function Layout() {
  const location = useLocation();

  const isLoginPage = location.pathname.startsWith("/login");
  const isFullPage =
    location.pathname.startsWith("/receipt") ||
    location.pathname.startsWith("/greeting") ||
    isLoginPage;

  if (isFullPage) {
    return (
      <div style={{ background: "#F8FAFC", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {!isLoginPage && <Navbar className="no-print" />}
        <Toaster position="top-right" />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/login/*" element={<Login />} />
            <Route path="/greeting" element={<ProtectedRoute><GreetingPage /></ProtectedRoute>} />
            <Route path="/receipt/:order_id" element={<ProtectedRoute><PrintReceipt /></ProtectedRoute>} />
            <Route path="/login/sso-callback" element={<AuthenticateWithRedirectCallback signInFallbackRedirectUrl="/" />} />
          </Routes>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", background: "transparent", minHeight: "100vh" }}>
      <BackgroundDesign />
      <Toaster position="top-right" />
      <Navbar className="no-print" />
      <TopBar className="no-print hide-mobile" onMenuClick={() => {}} />
      
      <main style={{ flex: 1, width: "100%", position: "relative", zIndex: 1 }}>
        <motion.div 
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="page-container"
        >
          <Routes>
            <Route
              path="/"
              element={
                sessionStorage.getItem("greetingSeen") 
                  ? <Navigate to="/dashboard" replace /> 
                  : <Navigate to="/greeting" replace />
              }
            />

        <Route
          path="/greeting"
          element={
            <ProtectedRoute>
              <GreetingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/:id"
          element={
            <ProtectedRoute>
              <CustomerProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:order_id"
          element={
            <ProtectedRoute>
              <OrderDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/receipt/:order_id"
          element={
            <ProtectedRoute>
              <PrintReceipt />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-order"
          element={
            <ProtectedRoute>
              <CreateOrder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/due-customers"
          element={
            <ProtectedRoute>
              <DueCustomers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer-due/:customer_id"
          element={
            <ProtectedRoute>
              <CustomerDueDetails />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;