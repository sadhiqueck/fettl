import { useTheme } from "@/context/ThemeContext";
import { SignupForm } from "@/features/auth/components/SignupForm";
import { LoginForm } from "@/features/auth/components/LoginForm";
import logoDark from "@/assets/logo-dark.webp";
import logoLight from "@/assets/logo-light.webp";
import { Link, useLocation } from "react-router-dom";

export default function AuthPage() {
  const { resolvedTheme } = useTheme();
  const location = useLocation();
  const mode = location.pathname.includes("login") ? "login" : "signup";

  const isDark = resolvedTheme === "dark";
  const bgColor = isDark ? "#171717" : "#ffffff";

  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center gap-2 md:gap-6 p-6 md:p-10"
      style={{ backgroundColor: bgColor }}
    >
      <div className="flex flex-col items-center gap-2 mb-2 md:mb-4">
        <Link to="/">
          <img
            src={logoLight}
            alt="Fettl"
            tabIndex={-1}
            className="hidden dark:block h-10 md:h-16 w-auto"
          />
          <img
            src={logoDark}
            alt="Fettl"
            tabIndex={-1}
            className="block dark:hidden h-10 md:h-16 w-auto"
          />
        </Link>
      </div>

      <div className="w-full flex justify-center">
        {mode === "login" ? <LoginForm /> : <SignupForm />}
      </div>
      
    </div>
  );
}
