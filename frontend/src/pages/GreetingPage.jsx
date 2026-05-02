import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import greetingVideo from "../assets/greetings1.mp4";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Volume2, VolumeX, Loader2 } from "lucide-react";

function GreetingPage() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const bgVideoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("greetingSeen")) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    // Show content after a short delay
    const timer = setTimeout(() => setShowContent(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleVideoEnd = () => {
    sessionStorage.setItem("greetingSeen", "true");
    navigate("/dashboard");
  };

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      if (bgVideoRef.current) bgVideoRef.current.muted = true; // Background stays muted
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
    <div style={styles.container} onClick={handlePageClick}>
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            exit={{ opacity: 0 }}
            style={styles.loaderContainer}
          >
            <Loader2 className="animate-spin" size={40} color="#fff" />
            <p style={styles.loaderText}>Preparing Experience...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Video (Blurred & Cover) - Fills the gaps */}
      <video
        ref={bgVideoRef}
        src={greetingVideo}
        autoPlay
        loop
        muted
        style={styles.bgVideo}
        onLoadedData={onLoadedData}
      />
      <div style={styles.blurOverlay} />

      {/* Foreground Video (Contain) - Ensures whole video is visible */}
      <div style={styles.videoWrapper}>
        <video
          ref={videoRef}
          src={greetingVideo}
          autoPlay
          muted
          controls={false}
          onEnded={handleVideoEnd}
          style={styles.mainVideo}
        />
      </div>

      {/* Interactive Layer */}
      {showContent && (
        <div style={styles.uiContainer}>
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={styles.header}
          >
            <h1 style={styles.title}>Naman Enterprises</h1>
            <p style={styles.subtitle}>Welcome to our official store system</p>
          </motion.div>

          <div style={styles.controls}>
            {/* Sound Toggle Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              onClick={(e) => { e.stopPropagation(); toggleSound(); }}
              style={styles.soundBtn}
              whileHover={{ scale: 1.05, background: "rgba(255,255,255,0.2)" }}
              whileTap={{ scale: 0.95 }}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              <span>{isMuted ? "Unmute" : "Mute"}</span>
            </motion.button>

            <motion.button 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 }}
              onClick={(e) => { e.stopPropagation(); handleVideoEnd(); }}
              style={styles.skipButton}
              whileHover={{ scale: 1.05, boxShadow: "0 15px 35px rgba(0,0,0,0.4)" }}
              whileTap={{ scale: 0.95 }}
            >
              Skip to Dashboard <ChevronRight size={20} />
            </motion.button>
          </div>
        </div>
      )}

      {/* Aesthetic Gradients */}
      <div style={styles.vignette} />
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    width: "100vw",
    background: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    cursor: "pointer",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
  },
  loaderContainer: {
    position: "absolute",
    inset: 0,
    background: "#000",
    zIndex: 100,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px"
  },
  loaderText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: "14px",
    letterSpacing: "1px",
    fontWeight: "500"
  },
  bgVideo: {
    position: "absolute",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    zIndex: 1,
    filter: "blur(40px) brightness(0.6)",
    transform: "scale(1.1)" // Prevent blur edges
  },
  blurOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.3)",
    zIndex: 2
  },
  videoWrapper: {
    width: "100%",
    height: "100%",
    maxWidth: "1400px",
    maxHeight: "800px",
    zIndex: 5,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 50px 100px -20px rgba(0,0,0,0.5)",
    borderRadius: "12px",
    overflow: "hidden"
  },
  mainVideo: {
    width: "100%",
    height: "100%",
    objectFit: "contain", // Ensures whole video is visible
  },
  uiContainer: {
    position: "absolute",
    inset: 0,
    zIndex: 10,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "48px"
  },
  header: {
    textAlign: "left"
  },
  title: {
    color: "#fff",
    fontSize: "32px",
    fontWeight: "800",
    margin: 0,
    letterSpacing: "-1px"
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: "16px",
    margin: "8px 0 0 0",
    fontWeight: "400"
  },
  controls: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end"
  },
  soundBtn: {
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "600",
    borderRadius: "50px",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(20px)",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    transition: "all 0.3s ease"
  },
  skipButton: {
    padding: "18px 36px",
    fontSize: "16px",
    fontWeight: "700",
    borderRadius: "50px",
    border: "none",
    background: "#fff",
    color: "#000",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
    transition: "all 0.3s ease"
  },
  vignette: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(circle, transparent 40%, rgba(0,0,0,0.7) 100%)",
    pointerEvents: "none",
    zIndex: 8
  }
};

export default GreetingPage;