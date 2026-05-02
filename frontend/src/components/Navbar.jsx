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
  Building2
} from "lucide-react";

const NAV_LINKS = [
  { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { path: "/customers", label: "Customers", icon: Users },
  { path: "/products", label: "Products", icon: Package },
  { path: "/orders", label: "Orders", icon: ShoppingCart },
  { path: "/create-order", label: "Create Order", icon: PlusCircle },
  { path: "/due-customers", label: "Due Section", icon: Banknote }
];

function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

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
      <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "14px" }}>
        <div
          style={{
            width: "42px",
            height: "42px",
            background: "linear-gradient(135deg, #0F172A 0%, #334155 100%)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#F59E0B", // Amber gold
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
          }}
        >
          <Building2 size={24} strokeWidth={2} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span 
            style={{ 
              fontSize: "22px", 
              fontWeight: "900", 
              color: "#0F172A", 
              letterSpacing: "-0.8px", 
              lineHeight: "0.9",
              fontFamily: "'Outfit', sans-serif" 
            }}
          >
            NAMAN
          </span>
          <span 
            style={{ 
              fontSize: "12px", 
              fontWeight: "800", 
              color: "#D97706", // Slightly darker amber for better contrast on white
              letterSpacing: "2px", 
              textTransform: "uppercase" 
            }}
          >
            Enterprises
          </span>
        </div>
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
                color: isActive ? "#2563EB" : "#64748b",
                padding: "8px 14px",
                fontSize: "13px",
                fontWeight: isActive ? "600" : "500",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                position: "relative",
                transition: "all 0.2s ease",
                borderRadius: "8px",
                background: isActive ? "rgba(37, 99, 235, 0.06)" : "transparent",
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
              onClick={() => setMobileMenuOpen(false)}
              style={styles.drawerBackdrop}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={styles.drawer}
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
                          background: isActive ? "rgba(37, 99, 235, 0.06)" : "transparent",
                          color: isActive ? "#2563EB" : "#475569",
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
  }
};

const css = `
@media (min-width: 1024px) {
  .menu-btn { display: none !important; }
  .desktop-nav { display: flex !important; }
}
@media (max-width: 1023px) {
  .menu-btn { display: flex !important; }
  .desktop-nav { display: none !important; }
  nav { padding: 0 16px !important; }
  .nav-brand-text span:last-child { display: none; }
}
`;

export default Navbar;
