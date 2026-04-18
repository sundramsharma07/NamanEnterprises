import { motion } from "framer-motion";

export const Card = ({ children, className = "", style = {}, hover = false, ...props }) => {
  const baseStyle = {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "24px",
    color: "#1e293b",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    ...style,
  };

  const Component = hover ? motion.div : "div";

  return (
    <Component
      style={baseStyle}
      className={className}
      whileHover={hover ? { y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" } : undefined}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </Component>
  );
};
