import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  PlusCircle, 
  CreditCard,
  LogOut,
  ChevronRight,
  HardHat,
  BadgeAlert
} from "lucide-react";
import { useClerk } from "@clerk/react";
import { motion } from "framer-motion";

const SIDEBAR_LINKS = [
  { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'customers', path: '/customers', label: 'Customers', icon: Users },
  { id: 'products', path: '/products', label: 'Inventory', icon: Package },
  { id: 'orders', path: '/orders', label: 'Order History', icon: ShoppingCart },
  { id: 'create-order', path: '/create-order', label: 'Create Order', icon: PlusCircle },
  { id: 'due', path: '/due-customers', label: 'Recovery Manager', icon: BadgeAlert },
];

function Sidebar({ onClose }) {
  const location = useLocation();
  const { signOut } = useClerk();

  return (
    <div style={styles.sidebar} className="sidebar-mobile">
      {/* Mobile close button */}
      <button 
        onClick={onClose}
        style={{
          display: "none",
          position: "absolute",
          top: "16px",
          right: "16px",
          background: "none",
          border: "none",
          color: "rgba(255, 255, 255, 0.7)",
          cursor: "pointer",
          padding: "8px",
          borderRadius: "8px",
        }}
        className="mobile-close-btn"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div style={styles.brand}>
        <div style={styles.logoCircle}>
          <HardHat size={24} color="#FFF" />
        </div>
        <div style={styles.brandInfo}>
          <h1 style={styles.brandName}>Naman</h1>
          <p style={styles.brandSub}>Enterprises</p>
        </div>
      </div>

      <nav style={styles.nav}>
        {SIDEBAR_LINKS.map((link) => {
          const isActive = location.pathname.startsWith(link.path);
          const Icon = link.icon;
          
          return (
            <Link 
              key={link.id} 
              to={link.path} 
              style={{
                ...styles.link,
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? '#FFF' : 'var(--text-main)',
                fontWeight: isActive ? '700' : '500'
              }}
            >
              <div style={styles.linkLeft}>
                <Icon size={20} style={{ opacity: isActive ? 1 : 0.7 }} />
                <span>{link.label}</span>
              </div>
              {isActive && (
                <motion.div 
                  initial={{ opacity: 0, x: -5 }} 
                  animate={{ opacity: 1, x: 0 }} 
                >
                  <ChevronRight size={16} />
                </motion.div>
              )}
            </Link>
          );
        })}
      </nav>

      <div style={styles.footer}>
        <button onClick={() => signOut()} style={styles.logoutBtn}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: "280px",
    background: "var(--bg-sidebar)",
    height: "100vh",
    position: "fixed",
    left: 0,
    top: 0,
    borderRight: "1px solid rgba(255, 255, 255, 0.05)",
    display: "flex",
    flexDirection: "column",
    padding: "32px 16px",
    zIndex: 1000,
    fontFamily: "'Outfit', sans-serif"
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "0 12px 40px",
  },
  logoCircle: {
    width: "48px",
    height: "48px",
    background: "var(--primary)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 16px rgba(37, 99, 235, 0.12)"
  },
  brandInfo: {
    display: "flex",
    flexDirection: "column",
  },
  brandName: {
    fontSize: "20px",
    fontWeight: "900",
    color: "var(--text-main)",
    margin: 0,
    letterSpacing: "1px",
    textTransform: "uppercase"
  },
  brandSub: {
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--text-muted)",
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "2px"
  },
  nav: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  link: {
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderRadius: "12px",
    transition: "all 0.2s ease",
  },
  linkLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  footer: {
    paddingTop: "24px",
    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
  },
  logoutBtn: {
    width: "100%",
    padding: "16px",
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: "12px",
    color: "rgba(255, 255, 255, 0.7)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontWeight: "600"
  }
};

export default Sidebar;
