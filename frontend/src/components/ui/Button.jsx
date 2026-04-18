import { motion } from "framer-motion";

export const Button = ({ children, variant = "primary", className = "", style = {}, ...props }) => {
  let bg = "#F8FAFC";
  let color = "#475569";
  let border = "1px solid #e2e8f0";

  if (variant === "primary") {
    bg = "#2563EB";
    color = "#ffffff";
    border = "1px solid #2563EB";
  } else if (variant === "gradient") {
    bg = "#2563EB";
    color = "#ffffff";
    border = "none";
  } else if (variant === "danger") {
    bg = "#ef4444";
    color = "#ffffff";
    border = "1px solid #ef4444";
  }

  const baseStyle = {
    padding: "8px 16px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    background: bg,
    color,
    border,
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "inherit",
    ...style,
  };

  return (
    <motion.button
      style={baseStyle}
      className={className}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};
