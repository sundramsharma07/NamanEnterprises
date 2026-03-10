import { useNavigate } from "react-router-dom";
import greetingVideo from "../assets/greetings.mp4";

function GreetingPage() {
  const navigate = useNavigate();

  const handleVideoEnd = () => {
    navigate("/dashboard");
  };

  return (
    <div style={styles.container}>
      <video
        src={greetingVideo}
        autoPlay
        muted
        controls
        onEnded={handleVideoEnd}
        style={styles.video}
      />

      <button onClick={handleVideoEnd} style={styles.skipButton}>
        Skip →
      </button>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    width: "100%",
    background: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },

  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },

  skipButton: {
    position: "absolute",
    bottom: "40px",
    right: "40px",
    padding: "12px 28px",
    fontSize: "16px",
    borderRadius: "30px",
    border: "none",
    background: "white",
    cursor: "pointer"
  }
};

export default GreetingPage;