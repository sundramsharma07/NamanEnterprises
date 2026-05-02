import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import greetingVideo from "../assets/greetings1.mp4";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Volume2, VolumeX, Loader2 } from "lucide-react";

function GreetingPage() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("greetingSeen")) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleVideoEnd = () => {
    sessionStorage.setItem("greetingSeen", "true");
    navigate("/dashboard");
  };

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handlePageClick = () => {
    if (videoRef.current && videoRef.current.muted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  const onLoadedData = () => {
    setIsLoading(false);
  };

  return (
    <>
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        @keyframes sweep {
          0% { left: -100%; }
          20% { left: 200%; }
          100% { left: 200%; }
        }
        @keyframes pulseGlow {
          0% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.05); }
          100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
      
      <div style={styles.container} onClick={handlePageClick}>
        <AnimatePresence>
          {isLoading && (
            <motion.div 
              exit={{ opacity: 0 }}
              style={styles.loaderContainer}
            >
              <Loader2 className="animate-spin" size={40} color="#fff" />
              <p style={styles.loaderText}>Initializing System...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ambient background lighting */}
        <div style={styles.bgGlow1} />
        <div style={styles.bgGlow2} />
        <div style={styles.vignette} />

        {/* Premium Television Mockup */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={styles.tvWrapper}
        >
          {/* Ambient Glow behind the TV */}
          <div style={styles.ambientGlow} />

          {/* Main TV Body */}
          <div style={styles.tvBezel}>
            
            {/* The Screen Area */}
            <div style={styles.tvScreen}>
              <video
                ref={videoRef}
                src={greetingVideo}
                autoPlay
                muted
                controls={false}
                onEnded={handleVideoEnd}
                onLoadedData={onLoadedData}
                style={styles.video}
              />
              
              {/* Glossy OLED Reflection */}
              <div style={styles.screenReflection} />
              <div style={styles.innerShadow} />
            </div>

            {/* Bottom Metallic Chin */}
            <div style={styles.tvChin}>
              <div style={styles.powerLed} />
              <div style={styles.brandLogo}>NAMAN</div>
            </div>
          </div>

          {/* TV Stand Base */}
          <div style={styles.tvStandNeck} />
          <div style={styles.tvStandBase} />
        </motion.div>

        {/* Cinematic Floating UI */}
        {showContent && (
          <div style={styles.uiContainer}>
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              style={styles.header}
            >
              <h1 style={styles.title}>Naman Enterprises</h1>
              <p style={styles.subtitle}>Premium Store Management System</p>
            </motion.div>

            <div style={styles.controls}>
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => { e.stopPropagation(); toggleSound(); }}
                style={styles.soundBtn}
                whileHover={{ scale: 1.05, background: "rgba(255,255,255,0.15)" }}
                whileTap={{ scale: 0.95 }}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                <span>{isMuted ? "Unmute" : "Mute"}</span>
              </motion.button>

              <motion.button 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={(e) => { e.stopPropagation(); handleVideoEnd(); }}
                style={styles.skipButton}
                whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(255,255,255,0.2)" }}
                whileTap={{ scale: 0.95 }}
              >
                Enter Portal <ChevronRight size={20} />
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  container: {
    height: "100vh",
    width: "100vw",
    background: "#050507", // Deep cinematic black
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    cursor: "pointer",
    fontFamily: "'Outfit', 'Inter', sans-serif"
  },
  loaderContainer: {
    position: "absolute",
    inset: 0,
    background: "#050507",
    zIndex: 100,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px"
  },
  loaderText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: "13px",
    letterSpacing: "2px",
    textTransform: "uppercase"
  },
  bgGlow1: {
    position: "absolute",
    top: "-20%",
    left: "-10%",
    width: "60vw",
    height: "60vw",
    background: "radial-gradient(circle, rgba(40,50,80,0.15) 0%, rgba(0,0,0,0) 70%)",
    zIndex: 1
  },
  bgGlow2: {
    position: "absolute",
    bottom: "-20%",
    right: "-10%",
    width: "50vw",
    height: "50vw",
    background: "radial-gradient(circle, rgba(80,40,40,0.1) 0%, rgba(0,0,0,0) 70%)",
    zIndex: 1
  },
  vignette: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(circle at center, transparent 30%, #020202 100%)",
    zIndex: 2,
    pointerEvents: "none"
  },
  tvWrapper: {
    position: "relative",
    zIndex: 10,
    width: "85%",
    maxWidth: "1100px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    animation: "float 6s ease-in-out infinite",
  },
  ambientGlow: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "110%",
    height: "110%",
    background: "radial-gradient(circle, rgba(200,220,255,0.15) 0%, rgba(0,0,0,0) 60%)",
    filter: "blur(60px)",
    animation: "pulseGlow 8s ease-in-out infinite",
    zIndex: -1
  },
  tvBezel: {
    width: "100%",
    aspectRatio: "16/9",
    background: "linear-gradient(135deg, #2a2a2a 0%, #0a0a0a 50%, #1a1a1a 100%)",
    borderRadius: "16px",
    padding: "6px", // Ultra-thin bezels
    boxShadow: "0 40px 100px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.8)",
    position: "relative",
    display: "flex",
    flexDirection: "column"
  },
  tvScreen: {
    flex: 1,
    background: "#000",
    borderRadius: "8px",
    position: "relative",
    overflow: "hidden",
    boxShadow: "inset 0 0 30px rgba(0,0,0,1)" // Edge darkening for OLED feel
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover", // perfectly fills the screen
    filter: "contrast(1.05) saturate(1.1)", // Cinematic color boost
  },
  innerShadow: {
    position: "absolute",
    inset: 0,
    boxShadow: "inset 0 0 20px rgba(0,0,0,0.8)",
    pointerEvents: "none"
  },
  screenReflection: {
    position: "absolute",
    top: 0,
    left: "-150%",
    width: "100%",
    height: "200%",
    background: "linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0) 100%)",
    transform: "skewX(-25deg)",
    animation: "sweep 10s infinite",
    pointerEvents: "none",
    zIndex: 2
  },
  tvChin: {
    height: "18px",
    width: "100%",
    background: "linear-gradient(to bottom, #111, #000)",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  powerLed: {
    position: "absolute",
    right: "30px",
    width: "4px",
    height: "4px",
    borderRadius: "50%",
    background: "#ff3b30",
    boxShadow: "0 0 8px #ff3b30"
  },
  brandLogo: {
    color: "rgba(255,255,255,0.2)",
    fontSize: "8px",
    letterSpacing: "4px",
    fontWeight: "300"
  },
  tvStandNeck: {
    width: "clamp(60px, 15vw, 120px)",
    height: "clamp(15px, 4vw, 35px)",
    background: "linear-gradient(to right, #111 0%, #333 50%, #111 100%)",
    boxShadow: "inset 0 2px 5px rgba(0,0,0,0.8)",
    marginTop: "-2px",
    zIndex: 9
  },
  tvStandBase: {
    width: "min(400px, 80vw)",
    height: "clamp(6px, 1.5vw, 10px)",
    background: "linear-gradient(to bottom, #444, #111)",
    borderRadius: "2px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255,255,255,0.2)",
    zIndex: 10
  },
  uiContainer: {
    position: "absolute",
    inset: 0,
    zIndex: 20,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "clamp(20px, 5vw, 50px)",
    pointerEvents: "none"
  },
  header: {
    textAlign: "left"
  },
  title: {
    color: "#fff",
    fontSize: "clamp(24px, 5vw, 38px)",
    fontWeight: "700",
    margin: 0,
    letterSpacing: "-1px",
    textShadow: "0 10px 30px rgba(0,0,0,0.8)"
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: "clamp(14px, 3vw, 16px)",
    margin: "8px 0 0 0",
    fontWeight: "300",
    letterSpacing: "1px"
  },
  controls: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    pointerEvents: "auto",
    gap: "10px",
    flexWrap: "wrap"
  },
  soundBtn: {
    padding: "clamp(10px, 2vw, 14px) clamp(16px, 4vw, 28px)",
    fontSize: "clamp(12px, 2.5vw, 14px)",
    fontWeight: "500",
    borderRadius: "50px",

    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(12px)",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    transition: "all 0.3s ease"
  },
  skipButton: {
    padding: "clamp(12px, 2.5vw, 16px) clamp(20px, 5vw, 32px)",
    fontSize: "clamp(13px, 3vw, 15px)",
    fontWeight: "600",
    borderRadius: "50px",
    border: "none",
    background: "linear-gradient(135deg, #fff 0%, #e0e0e0 100%)",
    color: "#000",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 10px 20px rgba(0,0,0,0.5)",
    transition: "all 0.3s ease"
  }
};

export default GreetingPage;