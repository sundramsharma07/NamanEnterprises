import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import greetingVideo from "../assets/greetings1.mp4";
import { motion } from "framer-motion";
import { ChevronRight, Volume2, VolumeX } from "lucide-react";

function GreetingPage() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem("greetingSeen")) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

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

  // Try to unmute on first user click anywhere on the page
  const handlePageClick = () => {
    if (videoRef.current && videoRef.current.muted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  return (
    <div style={styles.container} onClick={handlePageClick}>
      <video
        ref={videoRef}
        src={greetingVideo}
        autoPlay
        muted
        controls={false}
        onEnded={handleVideoEnd}
        style={styles.video}
      />

      {/* Sound Toggle Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        onClick={(e) => { e.stopPropagation(); toggleSound(); }}
        style={styles.soundBtn}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        <span style={{ fontSize: "13px" }}>{isMuted ? "Tap to unmute" : "Playing"}</span>
      </motion.button>

      <motion.button 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
        onClick={(e) => { e.stopPropagation(); handleVideoEnd(); }}
        style={styles.skipButton}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Enter Dashboard <ChevronRight size={20} />
      </motion.button>

      <div style={styles.overlay} />
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
    cursor: "pointer"
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    zIndex: 1
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "150px",
    background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)",
    zIndex: 2,
    pointerEvents: "none"
  },
  soundBtn: {
    position: "absolute",
    top: "32px",
    right: "32px",
    padding: "12px 20px",
    fontSize: "14px",
    fontWeight: "600",
    borderRadius: "50px",
    border: "1px solid rgba(255,255,255,0.3)",
    background: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(10px)",
    color: "#fff",
    cursor: "pointer",
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontFamily: "inherit"
  },
  skipButton: {
    position: "absolute",
    bottom: "40px",
    right: "40px",
    padding: "16px 32px",
    fontSize: "18px",
    fontWeight: "700",
    borderRadius: "20px",
    border: "none",
    background: "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(10px)",
    color: "#000",
    cursor: "pointer",
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
    fontFamily: "inherit"
  }
};

export default GreetingPage;