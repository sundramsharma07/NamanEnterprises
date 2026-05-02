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
  Lock,
  Quote
} from "lucide-react";
const QUOTES = [
  {
    en: "Hard work is the foundation of every great village.",
    hi: "कड़ी मेहनत हर महान गाँव की नींव है।"
  },
  {
    en: "Building communities, one brick at a time.",
    hi: "एक-एक ईंट से समाज का निर्माण।"
  },
  {
    en: "The sweat of the worker builds the future.",
    hi: "मज़दूर का पसीना ही भविष्य का निर्माण करता है।"
  },
  {
    en: "Strong foundations create lasting legacies.",
    hi: "मज़बूत नींव से ही स्थायी विरासत बनती है।"
  },
  {
    en: "From raw materials to rural dreams realized.",
    hi: "कच्चे माल से ग्रामीण सपनों के साकार होने तक।"
  }
];

function Login() {
  const { isLoaded } = useAuth();
  const [authError, setAuthError] = useState(null);
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const handleClerkError = (event) => {
      if (event.detail?.type === "error") {
        setAuthError(event.detail.message || "Authentication failed.");
      }
    };
    window.addEventListener("clerk-error", handleClerkError);
    return () => window.removeEventListener("clerk-error", handleClerkError);
  }, []);

  // Quote Rotation Animation
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % QUOTES.length);
    }, 5000); // Rotates every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-wrapper" style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap');

        @keyframes floatAnimation {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(180deg); }
          100% { transform: translateY(0px) rotate(360deg); }
        }

        @keyframes pulseGlow {
          0% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
          100% { opacity: 0.3; transform: scale(1); }
        }

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
          .page-wrapper {
            padding: 0 !important;
            display: block !important;
          }
          .main-container-login {
            flex-direction: column !important;
            height: auto !important;
            min-height: 100vh !important;
            border-radius: 0 !important;
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
          }
          .branding-section-login {
            display: flex !important;
            flex: none !important;
            height: 35vh !important;
            min-height: 250px !important;
            padding: 30px 20px !important;
            justify-content: center !important;
            align-items: center !important;
            text-align: center !important;
          }
          .logo-badge {
            margin-bottom: 15px !important;
            justify-content: center !important;
          }
          .brand-text {
            font-size: 42px !important;
          }
          .sub-brand-text {
            margin-top: 5px !important;
          }
          .hero-text, .quote-wrapper {
            display: none !important;
          }
          .form-section-login {
            flex: 1 !important;
            padding: 40px 20px !important;
            border-radius: 30px 30px 0 0 !important;
            margin-top: -30px !important;
            z-index: 20 !important;
            position: relative !important;
            box-shadow: 0 -10px 40px rgba(0,0,0,0.1) !important;
            background: #FFFFFF !important;
          }
        }
      `}</style>

      {/* Decorative Background Animations */}
      <div style={styles.ring1}></div>
      <div style={styles.ring2}></div>
      <div style={styles.ring3}></div>

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
            <div className="logo-badge" style={styles.logoBadge}>
               <Building2 size={40} color="#F59E0B" />
            </div>
            
            <h1 className="brand-text">NAMAN</h1>
            <p className="sub-brand-text">Enterprises</p>

            <div className="hero-text" style={styles.heroText}>
              <p style={styles.heroDesc}>
                Building material stores at <br/>
                <span style={{color: "#fff", fontWeight: "600"}}>Ajmatpur, Bihar, India</span>
              </p>
            </div>

            <div className="quote-wrapper" style={styles.quoteWrapper}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={quoteIdx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  style={styles.transparentQuoteBox}
                >
                  <Quote size={24} color="#F59E0B" style={{ marginBottom: '10px', opacity: 0.7 }} />
                  <p style={styles.quoteEn}>"{QUOTES[quoteIdx].en}"</p>
                  <p style={styles.quoteHi}>"{QUOTES[quoteIdx].hi}"</p>
                </motion.div>
              </AnimatePresence>
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
    fontFamily: "'Outfit', sans-serif",
    padding: "20px",
    position: "relative",
    overflowX: "hidden",
    overflowY: "auto"
  },
  ring1: {
    position: "absolute",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    border: "2px solid rgba(245, 158, 11, 0.15)",
    top: "-150px",
    left: "-150px",
    animation: "floatAnimation 12s ease-in-out infinite",
    zIndex: 0,
    pointerEvents: "none"
  },
  ring2: {
    position: "absolute",
    width: "700px",
    height: "700px",
    borderRadius: "50%",
    border: "1px dashed rgba(37, 99, 235, 0.15)",
    bottom: "-250px",
    right: "-200px",
    animation: "floatAnimation 18s ease-in-out infinite reverse",
    zIndex: 0,
    pointerEvents: "none"
  },
  ring3: {
    position: "absolute",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(245,158,11,0.03) 0%, rgba(245,158,11,0) 70%)",
    top: "30%",
    right: "20%",
    animation: "pulseGlow 8s ease-in-out infinite",
    zIndex: 0,
    pointerEvents: "none"
  },
  mainContainer: {
    width: "100%",
    maxWidth: "1280px",
    height: "800px",
    background: "#FFFFFF",
    borderRadius: "40px", // Keeps the heavy curves
    display: "flex",
    overflow: "hidden",
    boxShadow: "0 40px 100px -20px rgba(15, 23, 42, 0.12)",
    border: "1px solid #F1F5F9",
    position: "relative",
    zIndex: 10,
    margin: "auto"
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
    background: "rgba(15, 23, 42, 0.75)",
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
    marginBottom: "40px",
    marginTop: "20px"
  },
  heroDesc: {
    fontSize: "18px",
    color: "#CBD5E1",
    lineHeight: "1.6",
    letterSpacing: "0.5px"
  },
  quoteWrapper: {
    marginTop: "auto",
    marginBottom: "40px",
    minHeight: "120px",
    position: "relative"
  },
  transparentQuoteBox: {
    padding: "0",
    background: "transparent",
    border: "none",
    boxShadow: "none"
  },
  quoteEn: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "19px",
    fontStyle: "italic",
    margin: "0 0 10px 0",
    color: "#FFFFFF",
    lineHeight: "1.4"
  },
  quoteHi: {
    fontFamily: "'Hind', sans-serif",
    fontSize: "18px",
    fontWeight: "500",
    margin: 0,
    color: "#F59E0B",
    lineHeight: "1.4"
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