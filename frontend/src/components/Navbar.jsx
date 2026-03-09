import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

function Navbar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);
  const [logoHover, setLogoHover] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinks = [
    { path: "/", label: "Dashboard", icon: "📊", color: "#FF6B6B" },
    { path: "/customers", label: "Customers", icon: "👥", color: "#4ECDC4" },
    { path: "/products", label: "Products", icon: "📦", color: "#45B7D1" },
    { path: "/orders", label: "Orders", icon: "🛒", color: "#96CEB4" },
    { path: "/create-order", label: "Create Order", icon: "✨", color: "#FFEAA7" },
    { path: "/due-customers", label: "Due", icon: "💰", color: "#FF9F1C" }
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-5px) rotate(2deg); }
          75% { transform: translateY(5px) rotate(-2deg); }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 5px rgba(255,255,255,0.5)); }
          50% { filter: drop-shadow(0 0 20px rgba(255,255,255,0.8)); }
        }
        
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(10deg); }
          75% { transform: rotate(-10deg); }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .navbar {
          font-family: 'Poppins', sans-serif;
          background: ${scrolled 
            ? 'linear-gradient(135deg, #1a2639 0%, #0f172a 100%)' 
            : 'linear-gradient(135deg, #2b3a67 0%, #1b2a4e 100%)'};
          padding: ${scrolled ? '10px 30px' : '16px 40px'};
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: ${scrolled 
            ? '0 10px 30px -10px rgba(0,0,0,0.3)' 
            : '0 4px 20px rgba(0,0,0,0.1)'};
          position: sticky;
          top: 0;
          z-index: 1000;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: ${scrolled ? 'blur(10px)' : 'none'};
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .logo-container {
          display: flex;
          align-items: center;
          gap: 15px;
          text-decoration: none;
          position: relative;
          animation: slideIn 0.6s ease;
        }
        
        .logo-wrapper {
          position: relative;
          cursor: pointer;
        }
        
        .logo-icon {
          width: 55px;
          height: 55px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 700;
          color: white;
          box-shadow: 0 10px 20px -5px rgba(102,126,234,0.5);
          transform: ${logoHover ? 'scale(1.1) rotate(360deg)' : 'scale(1) rotate(0)'};
          transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          position: relative;
          z-index: 2;
          animation: float 3s ease-in-out infinite;
        }
        
        .logo-icon::before {
          content: '';
          position: absolute;
          top: -3px;
          left: -3px;
          right: -3px;
          bottom: -3px;
          background: linear-gradient(135deg, #667eea, #764ba2, #ff6b6b);
          border-radius: 20px;
          z-index: -1;
          opacity: ${logoHover ? '0.8' : '0'};
          filter: blur(10px);
          transition: opacity 0.3s ease;
          animation: ${logoHover ? 'pulse 1s ease infinite' : 'none'};
        }
        
        .logo-ring {
          position: absolute;
          top: -5px;
          left: -5px;
          right: -5px;
          bottom: -5px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 22px;
          animation: wave 3s ease-in-out infinite;
          opacity: ${logoHover ? '1' : '0'};
          transition: opacity 0.3s ease;
        }
        
        .logo-ring:nth-child(2) {
          animation-delay: 0.5s;
        }
        
        .logo-ring:nth-child(3) {
          animation-delay: 1s;
        }
        
        .logo-text-container {
          position: relative;
          overflow: hidden;
        }
        
        .logo-text {
          font-size: 26px;
          font-weight: 700;
          color: white;
          letter-spacing: -0.5px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
          background: linear-gradient(90deg, #fff, #ffeaa7, #fff);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: ${logoHover ? 'shimmer 2s linear infinite' : 'none'};
          transition: all 0.3s ease;
        }
        
        .logo-tagline {
          font-size: 12px;
          color: rgba(255,255,255,0.7);
          margin-top: 2px;
          font-weight: 400;
          letter-spacing: 0.5px;
          transform: ${logoHover ? 'translateY(0)' : 'translateY(5px)'};
          opacity: ${logoHover ? '1' : '0.7'};
          transition: all 0.3s ease;
        }
        
        .logo-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          background: #ff6b6b;
          border-radius: 50%;
          margin-left: 4px;
          animation: pulse 1.5s ease infinite;
        }
        
        .nav-links {
          display: flex;
          gap: 5px;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .nav-link {
          text-decoration: none;
          color: rgba(255,255,255,0.9);
          font-weight: 500;
          font-size: 15px;
          padding: 12px 20px;
          border-radius: 40px;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          isolation: isolate;
        }
        
        .nav-link::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
          z-index: -1;
        }
        
        .nav-link:hover::before {
          width: 300px;
          height: 300px;
        }
        
        .nav-link.active {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          box-shadow: 0 10px 20px -5px rgba(102,126,234,0.5);
          animation: glow 2s ease-in-out infinite;
        }
        
        .nav-link.active .nav-icon {
          animation: pulse 1s ease infinite;
        }
        
        .nav-icon {
          font-size: 20px;
          transition: all 0.3s ease;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }
        
        .nav-link:hover .nav-icon {
          transform: scale(1.2) rotate(10deg);
        }
        
        .nav-label {
          position: relative;
        }
        
        .nav-label::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: ${hoveredLink ? '100%' : '0'};
          height: 2px;
          background: white;
          transition: width 0.3s ease;
        }
        
        .nav-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          width: 8px;
          height: 8px;
          background: #ff6b6b;
          border-radius: 50%;
          animation: pulse 1.5s ease infinite;
        }
        
        @media (max-width: 768px) {
          .navbar {
            padding: 12px 20px;
            flex-wrap: wrap;
          }
          
          .logo-text {
            font-size: 20px;
          }
          
          .logo-tagline {
            display: none;
          }
          
          .logo-icon {
            width: 45px;
            height: 45px;
            font-size: 22px;
          }
          
          .nav-links {
            order: 3;
            width: 100%;
            margin-top: 15px;
            justify-content: center;
            gap: 3px;
          }
          
          .nav-link {
            font-size: 13px;
            padding: 8px 12px;
          }
        }
      `}</style>

      <nav className="navbar">
        {/* Animated Logo Section */}
        <Link 
          to="/" 
          className="logo-container"
          onMouseEnter={() => setLogoHover(true)}
          onMouseLeave={() => setLogoHover(false)}
        >
          <div className="logo-wrapper">
            <div className="logo-icon">
              <span>NE</span>
            </div>
            <div className="logo-ring"></div>
            <div className="logo-ring"></div>
            <div className="logo-ring"></div>
          </div>
          <div className="logo-text-container">
            <div className="logo-text">
              Naman Enterprises
              <span className="logo-dot"></span>
            </div>
            <div className="logo-tagline">
              {logoHover ? '✨ Quality First ✨' : 'Your trusted partner'}
            </div>
          </div>
        </Link>

        {/* Navigation Links with Animations */}
        <div className="nav-links">
          {navLinks.map((link, index) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
              onMouseEnter={() => setHoveredLink(index)}
              onMouseLeave={() => setHoveredLink(null)}
              style={{
                animation: `slideIn 0.3s ease ${index * 0.1}s both`
              }}
            >
              <span className="nav-icon">{link.icon}</span>
              <span className="nav-label">{link.label}</span>
              {link.label === "Create Order" && (
                <span className="nav-badge"></span>
              )}
            </Link>
          ))}
        </div>

        {/* Decorative Elements */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)'
        }} />
      </nav>
    </>
  );
}

export default Navbar;