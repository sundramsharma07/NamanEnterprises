import { motion } from "framer-motion";

export const Skeleton = ({ width, height, borderRadius = "12px", className = "" }) => {
  return (
    <div
      className={`skeleton-loader ${className}`}
      style={{
        width: width || "100%",
        height: height || "100%",
        borderRadius: borderRadius,
        background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite"
      }}
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export const Card = ({ children, className = "", onClick, noPadding = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { y: -2, transition: { duration: 0.2 } } : {}}
      onClick={onClick}
      className={`ui-card ${className}`}
      style={{
        background: "#ffffff",
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
        padding: noPadding ? 0 : "24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {children}
    </motion.div>
  );
};
