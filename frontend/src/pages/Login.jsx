import { SignIn, useAuth, useClerk, useUser } from "@clerk/react";
import { useEffect } from "react";

const ALLOWED_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

function Login() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();

  useEffect(() => {
    if (!isLoaded || !userId || !user) return;

    const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();

    if (email !== ALLOWED_EMAIL.toLowerCase()) {
      signOut({ redirectUrl: "/login" });
    }
  }, [isLoaded, userId, user, signOut]);

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        .login-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at top left, rgba(99, 102, 241, 0.18), transparent 30%),
            radial-gradient(circle at bottom right, rgba(236, 72, 153, 0.18), transparent 30%),
            linear-gradient(135deg, #0f172a 0%, #111827 45%, #1e293b 100%);
        }

        .bg-orb {
          position: absolute;
          border-radius: 999px;
          filter: blur(18px);
          opacity: 0.55;
          animation: floatOrb 9s ease-in-out infinite;
          pointer-events: none;
        }

        .orb-1 {
          width: 220px;
          height: 220px;
          background: rgba(99, 102, 241, 0.35);
          top: 8%;
          left: 8%;
        }

        .orb-2 {
          width: 300px;
          height: 300px;
          background: rgba(236, 72, 153, 0.24);
          bottom: 6%;
          right: 10%;
          animation-delay: 1.5s;
        }

        .orb-3 {
          width: 170px;
          height: 170px;
          background: rgba(34, 197, 94, 0.18);
          top: 50%;
          left: 58%;
          animation-delay: 3s;
        }

        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(circle at center, black 45%, transparent 90%);
          pointer-events: none;
        }

        .login-shell {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1100px;
          display: grid;
          grid-template-columns: 1fr 460px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 28px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow:
            0 20px 80px rgba(0, 0, 0, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          animation: cardIn 0.8s ease;
        }

        .login-left {
          position: relative;
          padding: 56px;
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
        }

        .brand-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          width: fit-content;
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255,255,255,0.9);
          font-size: 14px;
          margin-bottom: 24px;
          animation: fadeUp 0.8s ease;
        }

        .badge-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: linear-gradient(135deg, #22c55e, #3b82f6);
          box-shadow: 0 0 18px rgba(59, 130, 246, 0.7);
        }

        .login-title {
          font-size: clamp(2.2rem, 5vw, 4rem);
          line-height: 1.02;
          margin: 0 0 16px;
          font-weight: 800;
          letter-spacing: -0.04em;
          animation: fadeUp 0.95s ease;
        }

        .gradient-text {
          background: linear-gradient(135deg, #ffffff, #a5b4fc, #f9a8d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .login-text {
          max-width: 540px;
          margin: 0 0 28px;
          color: rgba(255,255,255,0.74);
          font-size: 1.02rem;
          line-height: 1.7;
          animation: fadeUp 1.1s ease;
        }

        .feature-list {
          display: grid;
          gap: 14px;
          margin-top: 18px;
          animation: fadeUp 1.2s ease;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          width: fit-content;
          border-radius: 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.88);
          transition: transform 0.25s ease, background 0.25s ease, border-color 0.25s ease;
        }

        .feature-item:hover {
          transform: translateX(6px);
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.18);
        }

        .feature-icon {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(99,102,241,0.35), rgba(236,72,153,0.3));
          font-size: 16px;
        }

        .login-right {
          position: relative;
          padding: 32px 24px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.04);
        }

        .signin-card {
          width: 100%;
          display: flex;
          justify-content: center;
          animation: fadeUp 1s ease;
        }

        .signin-card > div {
          width: 100%;
        }

        .login-glow {
          position: absolute;
          inset: auto;
          width: 420px;
          height: 420px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(99,102,241,0.2), transparent 60%);
          filter: blur(30px);
          z-index: 0;
          pointer-events: none;
        }

        @keyframes floatOrb {
          0%, 100% {
            transform: translateY(0px) translateX(0px) scale(1);
          }
          50% {
            transform: translateY(-18px) translateX(10px) scale(1.06);
          }
        }

        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 920px) {
          .login-shell {
            grid-template-columns: 1fr;
            max-width: 520px;
          }

          .login-left {
            padding: 32px 28px 10px;
          }

          .login-right {
            padding: 16px 18px 28px;
          }

          .login-title {
            font-size: 2.2rem;
          }

          .feature-list {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .login-page {
            padding: 16px;
          }

          .login-left {
            padding: 24px 20px 4px;
          }

          .login-right {
            padding: 12px 12px 20px;
          }

          .feature-item {
            width: 100%;
          }
        }
      `}</style>

      <div className="login-page">
        <div className="bg-orb orb-1" />
        <div className="bg-orb orb-2" />
        <div className="bg-orb orb-3" />
        <div className="grid-overlay" />

        <div className="login-shell">
          <div className="login-left">
            <div className="brand-badge">
              <span className="badge-dot" />
              Secure Admin Access
            </div>

            <h1 className="login-title">
              Welcome to <span className="gradient-text">Naman Enterprises</span>
            </h1>

            <p className="login-text">
              Sign in to manage products, monitor orders, and keep your inventory under control with a cleaner,
              faster admin workflow.
            </p>

            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-icon">📦</div>
                <div>Track products and stock in one place</div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">⚡</div>
                <div>Fast access to orders and daily operations</div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">🔒</div>
                <div>Protected admin-only authentication flow</div>
              </div>
            </div>
          </div>

          <div className="login-right">
            <div className="login-glow" />
            <div className="signin-card">
              <SignIn path="/login" routing="path" fallbackRedirectUrl="/" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;