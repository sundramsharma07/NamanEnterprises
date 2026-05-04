import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, 
  Users, 
  Package, 
  ShoppingCart, 
  PlusCircle, 
  Banknote,
  Menu,
  X,
  Building2,
  Bell,
  Tractor,
  AlignJustify
} from "lucide-react";

const NAV_LINKS = [
  { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { path: "/customers", label: "Customers", icon: Users },
  { path: "/products", label: "Products", icon: Package },
  { path: "/orders", label: "Orders", icon: ShoppingCart },
  { path: "/create-order", label: "Create Order", icon: PlusCircle },
  { path: "/due-customers", label: "Due Section", icon: Banknote }
];

import { useUser, useClerk, UserButton } from "@clerk/react";
import api from "../services/api";

function Navbar({ className }) {
  const location = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get("/orders/due/customers");
        const alerts = (res.data.customers || [])
          .filter(c => Number(c.total_due) > 5000)
          .map(c => ({
            id: c.id,
            title: `Credit Warning: ${c.name}`,
            msg: `High outstanding balance (${formatCurrency(c.total_due)}). Avoid further credit.`,
          }));
        setNotifications(alerts);
      } catch (err) {
        console.error("Alerts fetch error:", err);
      }
    };
    if (user) fetchAlerts();
  }, [user]);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(num || 0);
  };
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
  const [logoIconIdx, setLogoIconIdx] = useState(0);
  const [logoHovered, setLogoHovered] = useState(false);
  // Using native OS emojis for building, bricks/cement, construction/rods, tractor
  const logoIcons = ["🏢", "🧱", "🏗️", "🚜"];

  useEffect(() => {
    const interval = setInterval(() => {
      setLogoIconIdx((prev) => (prev + 1) % logoIcons.length);
    }, 2000); // Slower, automatic flip every 2 seconds
    return () => clearInterval(interval);
  }, [logoIcons.length]);

  useEffect(() => {
    const handleScroll = () => {
      // Scroll handling logic if needed
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mobile menu closes automatically on route change via user interaction

  return (
    <nav 
      className={className}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        transition: "all 0.3s ease",
        fontFamily: "'Inter', sans-serif",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
      }}
    >
      <style>{css}</style>
      
      {/* Brand Logo */}
      <Link 
        to="/" 
        style={{ textDecoration: "none", minWidth: "fit-content", display: "block" }}
        onMouseEnter={() => setLogoHovered(true)}
        onMouseLeave={() => setLogoHovered(false)}
      >
        <motion.div 
          style={{ display: "flex", alignItems: "center", gap: "12px" }}
        >
          <motion.div
            animate={{ scale: logoHovered ? 1.05 : 1 }}
            transition={{ duration: 0.3 }}
            style={{
              width: "44px",
              height: "44px",
              background: "#FFF7ED",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(249, 115, 22, 0.15)",
              flexShrink: 0,
              border: "1px solid #FFEDD5"
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={logoIconIdx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
              >
                <span style={{ fontSize: "24px", lineHeight: 1 }}>{logoIcons[logoIconIdx]}</span>
              </motion.div>
            </AnimatePresence>
          </motion.div>
          
          <motion.div 
            animate={{ x: logoHovered ? 4 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{ display: "flex", flexDirection: "column", lineHeight: "1.1" }}
          >
            <span 
              style={{ 
                fontSize: "22px", 
                fontWeight: "900", 
                color: "#0F172A", 
                letterSpacing: "-0.8px", 
                fontFamily: "'Outfit', sans-serif" 
              }}
            >
              NAMAN
            </span>
            <span 
              style={{ 
                fontSize: "11px", 
                fontWeight: "800", 
                color: "#F97316",
                letterSpacing: "1.5px", 
                textTransform: "uppercase",
                fontFamily: "'Outfit', sans-serif"
              }}
            >
              Enterprises
            </span>
          </motion.div>
        </motion.div>
      </Link>

      {/* Desktop Links */}
      <div className="desktop-nav" style={styles.desktopLinks}>
        {NAV_LINKS.map((link) => {
          const isActive = location.pathname === link.path;
          const Icon = link.icon;
          
          return (
            <Link
              key={link.path}
              to={link.path}
              onMouseEnter={() => setHoveredIndex(NAV_LINKS.indexOf(link))}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                textDecoration: "none",
                color: isActive ? "#F97316" : "#64748b",
                padding: "8px 14px",
                fontSize: "13px",
                fontWeight: isActive ? "700" : "500",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                position: "relative",
                transition: "all 0.2s ease",
                borderRadius: "8px",
                background: isActive ? "rgba(249, 115, 22, 0.08)" : "transparent",
              }}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
              {link.label}

              {/* Hover Effect */}
              {hoveredIndex === NAV_LINKS.indexOf(link) && !isActive && (
                <motion.div
                  layoutId="nav-hover"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(241, 245, 249, 0.8)",
                    borderRadius: "8px",
                    zIndex: -1,
                  }}
                  transition={{ duration: 0.15 }}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* Mobile Actions (Profile + Alert) */}
      <div className="mobile-actions" style={styles.mobileActions}>
        <div style={{ position: "relative" }}>
          <button 
            style={{ ...styles.iconBtn, color: notifications.length > 0 ? "#ef4444" : "#64748b" }}
            onClick={() => setShowNotif(!showNotif)}
          >
            <Bell size={20} className={notifications.length > 0 ? "pulse-notif" : ""} />
            {notifications.length > 0 && <div style={styles.alertDot} />}
          </button>

          <AnimatePresence>
            {showNotif && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                style={styles.notifDropdown}
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
        <div style={styles.profileWrapper}>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      {/* Mobile Menu Button */}
      <button 
        className="menu-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        style={styles.menuBtn}
      >
        {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              style={{ ...styles.drawerBackdrop, willChange: "opacity" }}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
              style={{ ...styles.drawer, willChange: "transform" }}
            >
              <div style={{ padding: "32px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                  <h2 style={{ fontSize: "20px", color: "#0F172A", fontWeight: "700" }}>Menu</h2>
                  <button onClick={() => setMobileMenuOpen(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "4px" }}>
                    <X size={22} />
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {NAV_LINKS.map((link) => {
                    const isActive = location.pathname === link.path;
                    const Icon = link.icon;

                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setMobileMenuOpen(false)}
                        style={{
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                          padding: "14px 16px",
                          borderRadius: "10px",
                          background: isActive ? "rgba(249, 115, 22, 0.08)" : "transparent",
                          color: isActive ? "#F97316" : "#475569",
                          fontWeight: isActive ? "600" : "500",
                          fontSize: "15px",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <Icon size={20} />
                        {link.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}

const styles = {
  desktopLinks: {
    display: "flex",
    gap: "2px",
  },
  menuBtn: {
    display: "flex",
    background: "none",
    border: "none",
    color: "#475569",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "8px",
    transition: "all 0.2s ease"
  },
  drawerBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.3)",
    backdropFilter: "blur(4px)",
    zIndex: 1001
  },
  drawer: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    width: "300px",
    background: "#ffffff",
    boxShadow: "-10px 0 40px rgba(0,0,0,0.08)",
    zIndex: 1002,
    borderLeft: "1px solid #e2e8f0",
  },
  mobileActions: {
    display: "none",
    alignItems: "center",
    gap: "12px",
    marginLeft: "auto",
    marginRight: "8px"
  },
  iconBtn: {
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    padding: "8px",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  alertDot: {
    position: "absolute",
    top: "8px",
    right: "8px",
    width: "8px",
    height: "8px",
    background: "#ef4444",
    borderRadius: "50%",
    border: "2px solid #fff"
  },
  profileWrapper: {
    display: "flex",
    alignItems: "center"
  },
  notifDropdown: {
    position: "absolute",
    top: "100%",
    right: "-40px",
    width: "280px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    padding: "16px",
    marginTop: "12px",
    zIndex: 1003,
  }
};

const css = `
@media (min-width: 1024px) {
  .menu-btn { display: none !important; }
  .desktop-nav { display: flex !important; }
}
@media (max-width: 1024px) {
  .menu-btn { display: flex !important; }
  .mobile-actions { display: flex !important; }
  .desktop-nav { display: none !important; }
  nav { padding: 0 16px !important; }
}
`;

export default Navbar;
