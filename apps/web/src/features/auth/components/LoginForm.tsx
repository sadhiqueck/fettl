import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { apiClient } from "@/shared/lib/apiClient";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { GoogleIcon } from "@/shared/components/ui/icons";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await apiClient.post(`/auth/login`, {
        email,
        password,
      });

      const { user } = response.data;
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message || "Invalid credentials. Please try again.",
        );
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2.5 text-red-600 dark:bg-red-950/20 dark:border-red-800/40 dark:text-red-400">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="text-sm leading-snug">{error}</p>
        </div>
      )}

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="login-email"
            className="text-sm font-semibold text-[#111827] dark:text-[#dbdee1]"
          >
            Email
          </Label>
          <Input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            required
            disabled={isLoading}
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="login-password"
              className="text-sm font-semibold text-[#111827] dark:text-[#dbdee1]"
            >
              Password
            </Label>
            <button
              type="button"
              className="text-xs text-[#f59e0b] font-medium hover:text-[#d97706] transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••••••••"
              className="pr-10"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#374151] dark:hover:text-[#dbdee1] transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full mt-1"
        >
          {isLoading && <Loader2 className="animate-spin" size={16} />}
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-1">
          <Separator className="flex-1 bg-[#e5e7eb] dark:bg-[rgba(255,255,255,0.08)]" />
          <span className="text-xs uppercase tracking-wider text-[#9ca3af] font-medium">
            or
          </span>
          <Separator className="flex-1 bg-[#e5e7eb] dark:bg-[rgba(255,255,255,0.08)]" />
        </div>

        {/* Google */}
        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={() => (window.location.href = `${API_URL}/auth/google`)}
          className="w-full gap-3"
        >
          <GoogleIcon size={18} />
          <span>Continue with Google</span>
        </Button>
      </form>
    </>
  );
}
