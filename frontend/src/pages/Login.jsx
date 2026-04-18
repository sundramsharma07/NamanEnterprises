import { SignIn, useAuth, useClerk, useUser } from "@clerk/react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  AlertCircle,
  Shield,
  Truck,
  Package,
  Users,
  ChevronRight,
  Sparkles
} from "lucide-react";

function Login() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const handleClerkError = (event) => {
      if (event.detail?.type === "error") {
        setAuthError(
          event.detail.message || "Authentication failed. Please try again."
        );
      }
    };

    window.addEventListener("clerk-error", handleClerkError);
    return () => window.removeEventListener("clerk-error", handleClerkError);
  }, []);

  return (
    <div style={styles.page}>
      {/* Google Fonts Import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Dancing+Script:wght@600;700&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .clerk-wrapper {
          width: 100% !important;
          display: flex;
          justify-content: center;
        }

        .cl-rootBox {
          width: 100% !important;
        }

        .cl-card {
          box-shadow: none !important;
          border: none !important;
          background: transparent !important;
        }

        .cl-formButtonPrimary {
          background-color: #111827 !important;
          font-family: 'Outfit', sans-serif !important;
          text-transform: none !important;
          font-weight: 600 !important;
          height: 44px !important;
        }

        .cl-formButtonPrimary:hover {
          background-color: #374151 !important;
        }

        .cl-footerActionLink {
          color: #B45309 !important;
        }

        .cl-headerTitle {
          font-family: 'Outfit', sans-serif !important;
          color: #111827 !important;
          font-weight: 800 !important;
          letter-spacing: -0.5px !important;
        }

        .cl-headerSubtitle {
          font-family: 'Outfit', sans-serif !important;
          color: #64748B !important;
        }

        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .ticker-text {
          white-space: nowrap;
          display: inline-block;
          animation: scroll 40s linear infinite;
          padding-left: 50px;
        }

        .ticker-item {
          display: inline-block;
          font-family: 'Dancing Script', cursive;
          font-size: 130px;
          color: rgba(252, 211, 77, 0.05); /* Very subtle Amber/Gold */
          margin-right: 120px;
          pointer-events: none;
          letter-spacing: 2px;
        }

        /* Responsive adjustments */
        @media (max-width: 900px) {
          .login-container-box {
            flex-direction: column !important;
            height: auto !important;
            min-height: auto !important;
          }
          .login-left-pane {
            display: none !important;
          }
          .login-right-pane {
            padding: 40px 20px !important;
          }
        }
      `}</style>

      <div style={styles.container} className="login-container-box">
        {/* Left Section - Narrative/Brand with Gradient */}
        <div style={styles.leftSection} className="login-left-pane">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={styles.leftContent}
          >
            <div style={styles.brandBadge}>
              <Sparkles size={14} color="#B45309" />
              <span>Premium Hardware Solutions</span>
            </div>

            <div style={styles.logoSection}>
              <h1 style={styles.brandName}>Naman Enterprises</h1>
              <p style={styles.brandTagline}>Crafting the foundations of tomorrow</p>
            </div>

            <div style={styles.visionQuote}>
              <p style={styles.quoteText}>
                "True architecture is more than walls. It's the silent witness of our lives."
              </p>
              <div style={styles.quoteAuthor}>— Establishing Quality Since 2012</div>
            </div>

            <div style={styles.featuresGrid}>
              <div style={styles.featureItem}>
                <div style={styles.featureIcon}>
                  <Package size={20} />
                </div>
                <div>
                  <h4 style={styles.featureTitle}>Global Sourcing</h4>
                  <p style={styles.featureDesc}>Finest cement & premium steel</p>
                </div>
              </div>
              <div style={styles.featureItem}>
                <div style={styles.featureIcon}>
                  <Truck size={20} />
                </div>
                <div>
                  <h4 style={styles.featureTitle}>Rapid Logistics</h4>
                  <p style={styles.featureDesc}>Project-site delivery within hours</p>
                </div>
              </div>
            </div>

            <div style={styles.trustFooter}>
              <div style={styles.avatars}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{...styles.avatar, left: (i-1)*-12 + 'px'}} />
                ))}
              </div>
              <span style={styles.trustText}>Trusted by 500+ Local Contractors</span>
            </div>
          </motion.div>

          {/* Cursive Infinite Scrolling Ticker */}
          <div style={styles.tickerContainer}>
            <div className="ticker-text">
              <span className="ticker-item">Naman Enterprises</span>
              <span className="ticker-item">Naman Enterprises</span>
              <span className="ticker-item">Naman Enterprises</span>
              <span className="ticker-item">Naman Enterprises</span>
              <span className="ticker-item">Naman Enterprises</span>
              <span className="ticker-item">Naman Enterprises</span>
            </div>
          </div>
        </div>

        {/* Right Section - Login Form */}
        <div style={styles.rightSection} className="login-right-pane">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={styles.loginCard}
          >
            {authError && (
              <div style={styles.errorAlert}>
                <AlertCircle size={16} />
                <span>{authError}</span>
              </div>
            )}

            <div className="clerk-wrapper">
              <SignIn
                path="/login"
                routing="path"
                fallbackRedirectUrl="/dashboard"
                appearance={{
                  layout: {
                    socialButtonsPlacement: "bottom",
                    showOptionalFields: false,
                  },
                  elements: {
                    formFieldInput: {
                      fontFamily: "'Outfit', sans-serif",
                      borderRadius: "10px",
                      border: "1.5px solid #E2E8F0",
                      height: "44px",
                      backgroundColor: "#FFFFFF",
                      "&:focus": {
                        borderColor: "#111827",
                        boxShadow: "0 0 0 3px rgba(17, 24, 39, 0.05)",
                      }
                    },
                    formFieldLabel: {
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: "600",
                      fontSize: "13px",
                      color: "#374151",
                      marginBottom: "6px"
                    },
                    socialButtonsBlockButton: {
                      borderRadius: "10px",
                      border: "1.5px solid #E2E8F0",
                      fontFamily: "'Outfit', sans-serif",
                    },
                    formFieldAction: {
                      fontSize: "12px",
                      color: "#B45309"
                    }
                  }
                }}
              />
            </div>

            <div style={styles.cardFooter}>
              <div style={styles.securitySeal}>
                <Shield size={12} />
                <span>Bank-level Encryption</span>
              </div>
              <p style={styles.copyright}>© 2026 Naman Enterprises.</p>
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
    background: "#F1F5F9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Outfit', sans-serif",
    padding: "20px",
  },
  container: {
    width: "100%",
    maxWidth: "1100px",
    minHeight: "720px",
    background: "#FFFFFF",
    borderRadius: "28px",
    display: "flex",
    overflow: "hidden",
    boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.08)",
    border: "1px solid #E2E8F0",
  },
  leftSection: {
    flex: 1.2,
    background: "linear-gradient(135deg, #020617 0%, #334155 100%)", /* Dark midnight to Steel Slate */
    padding: "60px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    position: "relative",
    color: "#FFFFFF",
    overflow: "hidden",
  },
  leftContent: {
    position: "relative",
    zIndex: 2,
  },
  tickerContainer: {
    position: "absolute",
    bottom: "20px",
    left: "0",
    width: "100%",
    overflow: "hidden",
    pointerEvents: "none",
    zIndex: 1,
  },
  brandBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(180, 83, 9, 0.1)",
    padding: "8px 16px",
    borderRadius: "100px",
    fontSize: "12px",
    fontWeight: "700",
    color: "#FCD34D",
    marginBottom: "40px",
    border: "1px solid rgba(180, 83, 9, 0.2)",
  },
  logoSection: {
    marginBottom: "40px",
  },
  brandName: {
    fontFamily: "'Dancing Script', cursive",
    fontSize: "56px",
    color: "#FCD34D",
    margin: "0 0 10px 0",
    lineHeight: 1,
  },
  brandTagline: {
    fontSize: "18px",
    color: "#94A3B8",
    fontWeight: "400",
  },
  visionQuote: {
    borderLeft: "2px solid #B45309",
    paddingLeft: "24px",
    margin: "40px 0 60px",
  },
  quoteText: {
    fontSize: "20px",
    fontWeight: "400",
    fontStyle: "italic",
    color: "#F1F5F9",
    lineHeight: 1.6,
    marginBottom: "8px",
  },
  quoteAuthor: {
    fontSize: "12px",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontWeight: "700",
  },
  featuresGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    marginBottom: "40px",
  },
  featureItem: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
  },
  featureIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "rgba(255, 255, 255, 0.03)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#B45309",
    border: "1px solid rgba(255, 255, 255, 0.05)",
  },
  featureTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#F8FAFC",
  },
  featureDesc: {
    fontSize: "13px",
    color: "#64748B",
  },
  trustFooter: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  avatars: {
    display: "flex",
    marginLeft: "10px",
  },
  avatar: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    border: "2px solid #111827",
    background: "#334155",
    position: "relative",
  },
  trustText: {
    fontSize: "12px",
    color: "#475569",
    fontWeight: "500",
  },
  rightSection: {
    flex: 1,
    padding: "60px 40px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#FFFFFF",
  },
  loginCard: {
    width: "100%",
    maxWidth: "480px",
  },
  errorAlert: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 16px",
    background: "#FEF2F2",
    borderRadius: "12px",
    color: "#991B1B",
    fontSize: "13px",
    marginBottom: "20px",
    border: "1px solid #FEE2E2",
  },
  cardFooter: {
    marginTop: "32px",
    textAlign: "center",
  },
  securitySeal: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#059669",
    background: "#ECFDF5",
    padding: "4px 12px",
    borderRadius: "100px",
    marginBottom: "12px",
  },
  copyright: {
    fontSize: "11px",
    color: "#94A3B8",
  }
};

export default Login;