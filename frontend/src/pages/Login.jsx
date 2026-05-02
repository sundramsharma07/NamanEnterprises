import { SignIn, useAuth, useClerk, useUser } from "@clerk/react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  ShieldCheck,
  Zap,
  TrendingUp,
  LayoutDashboard,
  ArrowRight,
  Globe,
  Lock
} from "lucide-react";

function Login() {
  const { isLoaded } = useAuth();
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const handleClerkError = (event) => {
      if (event.detail?.type === "error") {
        setAuthError(event.detail.message || "Authentication failed.");
      }
    };
    window.addEventListener("clerk-error", handleClerkError);
    return () => window.removeEventListener("clerk-error", handleClerkError);
  }, []);

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap');

        .clerk-card {
          box-shadow: none !important;
          border: none !important;
          background: transparent !important;
        }

        .cl-formButtonPrimary {
          background: #0F172A !important;
          border-radius: 12px !important;
          font-weight: 700 !important;
          height: 48px !important;
        }

        .brand-text {
          font-family: 'Playfair Display', serif;
          font-size: 84px;
          font-weight: 900;
          line-height: 0.9;
          letter-spacing: -2px;
          color: #FFFFFF;
          margin: 0;
          text-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        .sub-brand-text {
          font-family: 'Outfit', sans-serif;
          font-size: 16px;
          font-weight: 800;
          color: #F59E0B;
          letter-spacing: 6px;
          text-transform: uppercase;
          margin-top: 20px;
          text-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }

        @media (max-width: 768px) {
          .main-container-login {
            flex-direction: column !important;
            height: auto !important;
            border-radius: 0 !important;
          }
          .branding-section-login {
            display: none !important;
          }
          .form-section-login {
            padding: 40px 20px !important;
          }
          .brand-text {
            font-size: 48px !important;
          }
        }
      `}</style>

      <div className="main-container-login" style={styles.mainContainer}>
        {/* Left Side: Brand & Visuals */}
        <div className="branding-section-login" style={styles.brandingSection}>
          <div style={styles.brandOverlay} />
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={styles.brandContent}
          >
            <div style={styles.logoBadge}>
               <Building2 size={40} color="#F59E0B" />
            </div>
            
            <h1 className="brand-text">NAMAN</h1>
            <p className="sub-brand-text">Enterprises</p>

            <div style={styles.heroText}>
              <p style={styles.heroDesc}>
                Premium Building Materials & Hardware Solutions. <br/>
                Empowering Village Development since 2012.
              </p>
            </div>

            <div style={styles.statGrid}>
              <div style={styles.statItem}>
                <div style={styles.statIcon}><TrendingUp size={20} /></div>
                <div>
                  <div style={styles.statVal}>99.9%</div>
                  <div style={styles.statLabel}>Quality</div>
                </div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statIcon}><ShieldCheck size={20} /></div>
                <div>
                  <div style={styles.statVal}>Trusted</div>
                  <div style={styles.statLabel}>Partners</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Login Form */}
        <div className="form-section-login" style={styles.formSection}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={styles.loginWrapper}
          >
            <div style={styles.loginHeader}>
              <h3 style={styles.welcomeText}>Welcome Back</h3>
              <p style={styles.loginSub}>Access your management dashboard</p>
            </div>

            <div style={styles.clerkWrapper}>
              <SignIn
                path="/login"
                routing="path"
                fallbackRedirectUrl="/dashboard"
                appearance={{
                  elements: {
                    rootBox: "clerk-card",
                    card: "clerk-card",
                    footer: "hidden"
                  }
                }}
              />
            </div>

            <div style={styles.loginFooter}>
              <div style={styles.trustRow}>
                <Lock size={12} />
                <span>Authorized Personnel Only</span>
              </div>
              <p style={styles.copyText}>© 2026 Naman Enterprises Management</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#F8FAFC",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Outfit', sans-serif",
    padding: "20px",
  },
  mainContainer: {
    width: "100%",
    maxWidth: "1280px",
    height: "800px",
    background: "#FFFFFF",
    borderRadius: "32px",
    display: "flex",
    overflow: "hidden",
    boxShadow: "0 40px 100px -20px rgba(15, 23, 42, 0.12)",
    border: "1px solid #F1F5F9",
  },
  brandingSection: {
    flex: 1.1,
    background: "url('/images/premium_store.png') center/cover no-repeat",
    padding: "60px",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    color: "#FFFFFF",
    overflow: "hidden",
  },
  brandOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(15, 23, 42, 0.75)", // Slightly darker for extreme contrast
    zIndex: 1,
  },
  brandContent: {
    position: "relative",
    zIndex: 2,
  },
  brandBox: {
    background: "rgba(2, 6, 23, 0.4)",
    backdropFilter: "blur(20px)",
    padding: "40px",
    borderRadius: "24px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    marginBottom: "40px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
  },
  logoBadge: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "60px",
  },
  logoIcon: {
    width: "56px",
    height: "56px",
    background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#020617",
    boxShadow: "0 10px 20px rgba(245, 158, 11, 0.2)",
  },
  logoText: {
    display: "flex",
    flexDirection: "column",
  },
  mainTitle: {
    fontSize: "36px",
    fontWeight: "900",
    letterSpacing: "-1px",
    lineHeight: "1",
    margin: 0,
    color: "#FFFFFF",
    textShadow: "0 2px 10px rgba(0,0,0,0.5)",
  },
  subTitle: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#F59E0B",
    letterSpacing: "4px",
    margin: "4px 0 0 0",
    textShadow: "0 2px 8px rgba(0,0,0,0.3)",
  },
  heroText: {
    marginBottom: "60px",
  },
  heroHeadline: {
    fontSize: "48px",
    fontWeight: "800",
    lineHeight: "1.1",
    marginBottom: "24px",
    letterSpacing: "-1.5px",
  },
  heroDesc: {
    fontSize: "18px",
    color: "#94A3B8",
    lineHeight: "1.6",
    maxWidth: "480px",
  },
  statGrid: {
    display: "flex",
    gap: "40px",
    marginBottom: "60px",
  },
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  statIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.05)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#F59E0B",
  },
  statVal: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#F8FAFC",
  },
  statLabel: {
    fontSize: "12px",
    color: "#64748B",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  featureCards: {
    display: "flex",
    gap: "16px",
  },
  miniCard: {
    padding: "12px 20px",
    background: "rgba(255, 255, 255, 0.03)",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#CBD5E1",
  },
  miniIcon: {
    color: "#F59E0B",
  },
  floatingDecor: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
  },
  decorCircle: {
    position: "absolute",
    borderRadius: "50%",
    filter: "blur(40px)",
  },
  formSection: {
    flex: 0.9,
    background: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
  },
  loginWrapper: {
    width: "100%",
    maxWidth: "420px",
  },
  loginHeader: {
    textAlign: "center",
    marginBottom: "40px",
  },
  welcomeText: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: "-1px",
    marginBottom: "8px",
  },
  loginSub: {
    fontSize: "15px",
    color: "#64748B",
  },
  clerkWrapper: {
    marginBottom: "40px",
  },
  loginFooter: {
    textAlign: "center",
  },
  trustRow: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 16px",
    background: "#F1F5F9",
    borderRadius: "100px",
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748B",
    marginBottom: "16px",
  },
  copyText: {
    fontSize: "12px",
    color: "#94A3B8",
  }
};

export default Login;