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
      {/* Decorative background elements */}
      <div style={styles.bgCircle1} />
      <div style={styles.bgCircle2} />

      <div style={styles.container}>
        {/* Left Section */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          style={styles.leftSection}
        >
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <Building2 size={28} />
            </div>
            <div>
              <h1 style={styles.logoName}>NAMAN ENTERPRISES</h1>
              <p style={styles.logoSub}>Building Material Store</p>
            </div>
          </div>

          <div style={styles.quoteSection}>
            <p style={styles.quoteText}>
              Quality materials for lasting structures
            </p>
            <div style={styles.quoteLine} />
          </div>

          <div style={styles.features}>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>
                <Package size={18} />
              </div>
              <div>
                <div style={styles.featureTitle}>Premium Materials</div>
                <div style={styles.featureDesc}>Cement, Bricks, Steel & Sand</div>
              </div>
            </div>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>
                <Truck size={18} />
              </div>
              <div>
                <div style={styles.featureTitle}>Fast Delivery</div>
                <div style={styles.featureDesc}>Same-day delivery across city</div>
              </div>
            </div>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>
                <Users size={18} />
              </div>
              <div>
                <div style={styles.featureTitle}>Credit Management</div>
                <div style={styles.featureDesc}>Smart ledger for contractors</div>
              </div>
            </div>
          </div>

          <div style={styles.stats}>
            <div style={styles.statBox}>
              <span style={styles.statNum}>500+</span>
              <span style={styles.statLabel}>Happy Contractors</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statBox}>
              <span style={styles.statNum}>50+</span>
              <span style={styles.statLabel}>Material Categories</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statBox}>
              <span style={styles.statNum}>10+</span>
              <span style={styles.statLabel}>Years of Trust</span>
            </div>
          </div>
        </motion.div>

        {/* Right Section - Login */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={styles.rightSection}
        >
          <div style={styles.loginCard}>
            <div style={styles.cardHeader}>
              <div style={styles.welcomeIcon}>
                <Shield size={20} color="#2563EB" />
              </div>
              <h2 style={styles.cardTitle}>Welcome Back</h2>
              <p style={styles.cardSub}>Sign in to access your dashboard</p>
            </div>

            {authError && (
              <div style={styles.errorAlert}>
                <AlertCircle size={16} />
                <span>{authError}</span>
              </div>
            )}

            <div style={styles.clerkWrapper} className="clerk-wrapper">
              <SignIn
                path="/login"
                routing="path"
                fallbackRedirectUrl="/dashboard"
                appearance={{
                  elements: {
                    rootBox: {
                      width: "100%",
                      maxWidth: "100%",
                    },
                    cardBox: {
                      width: "100%",
                      maxWidth: "100%",
                      background: "transparent",
                      boxShadow: "none",
                      border: "none",
                      padding: 0,
                      margin: 0,
                    },
                    card: {
                      width: "100%",
                      maxWidth: "100%",
                      background: "transparent",
                      boxShadow: "none",
                      border: "none",
                      padding: 0,
                      margin: 0,
                      borderRadius: 0,
                    },
                    main: {
                      width: "100%",
                      padding: 0,
                      margin: 0,
                    },
                    header: {
                      display: "none",
                    },
                    headerTitle: {
                      display: "none",
                    },
                    headerSubtitle: {
                      display: "none",
                    },
                    form: {
                      width: "100%",
                    },
                    formField: {
                      marginBottom: "18px",
                    },
                    formFieldLabel: {
                      color: "#0F172A",
                      fontSize: "13px",
                      fontWeight: "600",
                      marginBottom: "8px",
                    },
                    formFieldInput: {
                      width: "100%",
                      height: "48px",
                      padding: "0 14px",
                      fontSize: "14px",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "12px",
                      backgroundColor: "#F8FAFC",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    },
                    formButtonPrimary: {
                      width: "100%",
                      height: "50px",
                      background: "#2563EB",
                      color: "#fff",
                      fontSize: "15px",
                      fontWeight: "600",
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                      transition: "all 0.2s",
                    },
                    socialButtons: {
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    },
                    socialButtonsBlockButton: {
                      width: "100%",
                      minHeight: "48px",
                      borderRadius: "12px",
                      border: "1.5px solid #e2e8f0",
                      backgroundColor: "#fff",
                      boxShadow: "none",
                      fontSize: "14px",
                      color: "#0F172A",
                      fontWeight: "500",
                      transition: "all 0.2s",
                    },
                    divider: {
                      width: "100%",
                      margin: "20px 0",
                    },
                    dividerLine: {
                      backgroundColor: "#e2e8f0",
                    },
                    dividerText: {
                      color: "#94a3b8",
                      fontSize: "13px",
                    },
                    footer: {
                      width: "100%",
                      marginTop: "16px",
                    },
                    footerAction: {
                      justifyContent: "center",
                      gap: "6px",
                    },
                    footerActionText: {
                      fontSize: "13px",
                      color: "#64748b",
                    },
                    footerActionLink: {
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#2563EB",
                      textDecoration: "none",
                    },
                    alert: {
                      width: "100%",
                      borderRadius: "12px",
                      boxSizing: "border-box",
                    },
                    identityPreview: {
                      width: "100%",
                      borderRadius: "12px",
                      boxSizing: "border-box",
                    },
                    identityPreviewText: {
                      color: "#0F172A",
                    },
                    identityPreviewEditButton: {
                      color: "#2563EB",
                    },
                  },
                }}
              />
            </div>

            <div style={styles.cardFooter}>
              <Shield size={12} color="#94a3b8" />
              <span>Secured by Clerk • Enterprise Authentication</span>
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .clerk-wrapper,
        .clerk-wrapper .cl-rootBox,
        .clerk-wrapper .cl-cardBox,
        .clerk-wrapper .cl-card,
        .clerk-wrapper .cl-main {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }

        .clerk-wrapper .cl-form,
        .clerk-wrapper .cl-formField,
        .clerk-wrapper .cl-footer,
        .clerk-wrapper .cl-socialButtons,
        .clerk-wrapper .cl-formButtonPrimary,
        .clerk-wrapper .cl-socialButtonsBlockButton {
          width: 100% !important;
        }

        .clerk-wrapper .cl-footer {
          margin-top: 16px !important;
        }

        .clerk-wrapper .cl-formButtonPrimary:hover {
          background: #1d4ed8 !important;
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35) !important;
        }

        .clerk-wrapper .cl-socialButtonsBlockButton:hover {
          background: #F8FAFC !important;
          border-color: #2563EB !important;
        }

        .clerk-wrapper .cl-formFieldInput:focus {
          border-color: #2563EB !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
        }

        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px #F8FAFC inset !important;
        }

        @media (max-width: 900px) {
          .clerk-wrapper,
          .clerk-wrapper .cl-rootBox,
          .clerk-wrapper .cl-cardBox,
          .clerk-wrapper .cl-card {
            max-width: 100% !important;
          }
        }
      `}</style>
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
    fontFamily: "'Inter', sans-serif",
    position: "relative",
    padding: "24px",
    overflow: "hidden",
  },
  bgCircle1: {
    position: "absolute",
    top: "-200px",
    right: "-200px",
    width: "600px",
    height: "600px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(37, 99, 235, 0.06) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  bgCircle2: {
    position: "absolute",
    bottom: "-150px",
    left: "-150px",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(56, 189, 248, 0.05) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  container: {
    display: "flex",
    maxWidth: "1100px",
    width: "100%",
    background: "#ffffff",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04)",
    position: "relative",
    zIndex: 1,
    border: "1px solid rgba(226, 232, 240, 0.6)",
  },
  leftSection: {
    flex: 1,
    padding: "48px",
    background: "linear-gradient(135deg, #eff6ff 0%, #F8FAFC 100%)",
    borderRight: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "56px",
  },
  logoIcon: {
    width: "48px",
    height: "48px",
    background: "#2563EB",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
  },
  logoName: {
    fontSize: "17px",
    fontWeight: "800",
    color: "#0F172A",
    margin: 0,
    letterSpacing: "0.5px",
  },
  logoSub: {
    fontSize: "12px",
    color: "#64748b",
    margin: "2px 0 0",
    letterSpacing: "0.5px",
    fontWeight: "500",
  },
  quoteSection: {
    marginBottom: "48px",
  },
  quoteText: {
    fontSize: "26px",
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 1.35,
    margin: "0 0 16px",
    letterSpacing: "-0.5px",
  },
  quoteLine: {
    width: "48px",
    height: "3px",
    background: "#2563EB",
    borderRadius: "2px",
  },
  features: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    marginBottom: "48px",
  },
  feature: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  featureIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "rgba(37, 99, 235, 0.08)",
    color: "#2563EB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: "1px",
  },
  featureDesc: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "400",
  },
  stats: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    padding: "24px",
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
  },
  statBox: {
    flex: 1,
    textAlign: "center",
  },
  statDivider: {
    width: "1px",
    height: "40px",
    background: "#e2e8f0",
  },
  statNum: {
    display: "block",
    fontSize: "22px",
    fontWeight: "800",
    color: "#2563EB",
    letterSpacing: "-0.5px",
  },
  statLabel: {
    display: "block",
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "4px",
    fontWeight: "500",
  },
  rightSection: {
    flex: 0.9,
    padding: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ffffff",
  },
  loginCard: {
    width: "100%",
    maxWidth: "420px",
    margin: "0 auto",
  },
  cardHeader: {
    marginBottom: "32px",
    textAlign: "center",
  },
  welcomeIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "rgba(37, 99, 235, 0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  cardTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: "8px",
    letterSpacing: "-0.3px",
  },
  cardSub: {
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "400",
  },
  errorAlert: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 16px",
    background: "#fef2f2",
    borderRadius: "12px",
    fontSize: "13px",
    color: "#dc2626",
    marginBottom: "24px",
    border: "1px solid #fecaca",
  },
  clerkWrapper: {
    width: "100%",
    maxWidth: "100%",
    margin: "0 auto",
  },
  cardFooter: {
    marginTop: "32px",
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontSize: "11px",
    color: "#94a3b8",
    paddingTop: "24px",
    borderTop: "1px solid #f1f5f9",
    fontWeight: "400",
  },
};

export default Login;