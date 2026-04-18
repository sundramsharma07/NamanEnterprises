import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import {
  useAuth,
  useUser,
  useClerk,
  UserButton,
  AuthenticateWithRedirectCallback,
} from "@clerk/react";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

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

import { Search, Bell } from "lucide-react";

function TopBar({ onMenuClick }) {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();

  // Clerk authentication is sufficient - no additional admin checks needed
  if (!isLoaded || !userId || !user) return null;

  return (
    <div
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
      {/* Mobile menu button */}
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

      <div style={{ position: "relative", width: "400px", flex: 1, maxWidth: "400px" }}>
        <Search 
          size={16} 
          style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} 
        />
        <input 
          type="text" 
          placeholder="Search..." 
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
        <button style={{ 
          background: "none", 
          border: "none", 
          color: "#94a3b8", 
          cursor: "pointer",
          padding: "6px",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Bell size={18} />
        </button>
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
        {!isLoginPage && <Navbar />}
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
    <div style={{ display: "flex", flexDirection: "column", background: "#F8FAFC", minHeight: "100vh" }}>
      <Toaster position="top-right" />
      <Navbar />
      <TopBar />
      
      <main style={{ flex: 1, width: "100%" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "28px 24px 40px" }}>
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
        </div>
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