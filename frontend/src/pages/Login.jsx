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
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <SignIn
        path="/login"
        routing="path"
        fallbackRedirectUrl="/"
      />
    </div>
  );
}

export default Login;