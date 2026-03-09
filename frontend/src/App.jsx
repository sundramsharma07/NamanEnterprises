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

import Navbar from "./components/Navbar";
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

const ADMIN_USER_ID = import.meta.env.VITE_ADMIN_USER_ID;

function ProtectedRoute({ children }) {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();

  if (!ADMIN_USER_ID) {
    return <div style={{ padding: "20px" }}>Missing VITE_ADMIN_USER_ID</div>;
  }

  if (!isLoaded) {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  if (!userId || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.id !== ADMIN_USER_ID) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function TopBar() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();

  useEffect(() => {
    if (!isLoaded || !userId || !user || !ADMIN_USER_ID) return;

    if (user.id !== ADMIN_USER_ID) {
      signOut({ redirectUrl: "/login" });
    }
  }, [isLoaded, userId, user, signOut]);

  if (!isLoaded || !userId || !user || !ADMIN_USER_ID) return null;
  if (user.id !== ADMIN_USER_ID) return null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        padding: "10px 16px",
      }}
    >
      <UserButton afterSignOutUrl="/login" />
    </div>
  );
}

function Layout() {
  const location = useLocation();

  const hideNavbar =
    location.pathname.startsWith("/receipt") ||
    location.pathname.startsWith("/login");

  return (
    <>
      {!hideNavbar && <Navbar />}
      {!hideNavbar && <TopBar />}

      <Routes>
        <Route path="/login/*" element={<Login />} />
        <Route
          path="/login/sso-callback"
          element={
            <AuthenticateWithRedirectCallback signInFallbackRedirectUrl="/" />
          }
        />

        <Route
          path="/"
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
      </Routes>
    </>
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