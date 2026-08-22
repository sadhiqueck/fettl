import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { userKeys } from "@/shared/hooks/queryKeys";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { GoogleIcon } from "@/shared/components/ui/icons";

export default function AuthPage() {
  const signup = useLocation().pathname === "/signup";
  const navigate = useNavigate();
  const sessionError = useOutletContext<Error | null>();
  const sessionUnavailable =
    sessionError &&
    !(isAxiosError(sessionError) && sessionError.response?.status === 401);
  const cache = useQueryClient();
  const { sendOtp, verifyOtp, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const mutation = sent ? verifyOtp : sendOtp;
  const message = isAxiosError(mutation.error)
    ? mutation.error.response?.data?.message
    : null;
  return (
    <main className="auth-page">
      <section className="auth-form-panel">
        <Link to="/" className="auth-brand">
          <img src="/icon-192x192.png" width="35" height="35" alt="" /> Fettl
        </Link>
        <div className="auth-form">
          <h1>
            {sent
              ? "Check your email"
              : signup
                ? "Create your account"
                : "Welcome back"}
          </h1>
          <p>
            {sent
              ? `Enter the six-digit code sent to ${email}.`
              : signup
                ? "Create a group and start sharing expenses."
                : "Sign in to see your groups and balances."}
          </p>
          {sessionUnavailable && (
            <div role="status" className="mb-4 text-sm text-muted-foreground">
              We couldn’t check your session. You can try signing in below.
            </div>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!sent)
                sendOtp.mutate(email.trim(), {
                  onSuccess: () => {
                    setEmail(email.trim());
                    setSent(true);
                  },
                });
              else
                verifyOtp.mutate(
                  { email, otp: code },
                  {
                    onSuccess: async () => {
                      await cache.invalidateQueries({
                        queryKey: userKeys.profile,
                      });
                      navigate("/dashboard", { replace: true });
                    },
                  },
                );
            }}
            className="grid gap-3"
          >
            {sent ? (
              <>
                <Label htmlFor="code">Verification code</Label>
                <Input
                  id="code"
                  autoFocus
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  value={code}
                  maxLength={6}
                  required
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
              </>
            ) : (
              <>
                <Label htmlFor="email">Email address</Label>
                <Input
                  type="email"
                  id="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                />
              </>
            )}
            {mutation.isError && (
              <p role="alert" className="text-sm text-destructive">
                {typeof message === "string"
                  ? message
                  : "Something went wrong. Please try again."}
              </p>
            )}
            <Button
              type="submit"
              disabled={mutation.isPending || (sent && code.length !== 6)}
            >
              {mutation.isPending
                ? "Please wait…"
                : sent
                  ? "Verify and continue"
                  : "Continue with email"}{" "}
              <ArrowRight />
            </Button>
          </form>
          {sent ? (
            <Button
              variant="link"
              onClick={() => {
                setSent(false);
                setCode("");
                sendOtp.reset();
                verifyOtp.reset();
              }}
            >
              Change email or request another code
            </Button>
          ) : (
            <>
              <div className="auth-or">or</div>
              <Button
                variant="outline"
                className="w-full"
                onClick={loginWithGoogle}
              >
                <GoogleIcon size={18} /> Continue with Google
              </Button>
              <p className="auth-switch">
                {signup ? "Already have an account?" : "New to Fettl?"}{" "}
                <Link to={signup ? "/login" : "/signup"}>
                  {signup ? "Sign in" : "Create an account"}
                </Link>
              </p>
            </>
          )}
        </div>
        <footer>
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
        </footer>
      </section>
    </main>
  );
}
