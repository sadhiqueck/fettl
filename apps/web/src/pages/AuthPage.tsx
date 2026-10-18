import { useEffect, useState, type FormEvent } from "react";
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
import {
  clearPendingOtp,
  readPendingOtp,
  savePendingOtp,
  type PendingOtp,
} from "@/features/auth/lib/pendingOtp";

const OTP_LIFETIME_MS = 15 * 60 * 1000;
const RESEND_WAIT_MS = 62 * 1000;

export default function AuthPage() {
  const signup = useLocation().pathname === "/signup";
  const navigate = useNavigate();
  const sessionError = useOutletContext<Error | null>();
  const sessionUnavailable =
    sessionError &&
    !(isAxiosError(sessionError) && sessionError.response?.status === 401);
  const cache = useQueryClient();
  const { sendOtp, verifyOtp, loginWithGoogle } = useAuth();
  const [pending, setPending] = useState<PendingOtp | null>(readPendingOtp);
  const [email, setEmail] = useState(pending?.email ?? "");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(Date.now);
  const sent = pending !== null;
  const codeExpired = Boolean(pending && now - pending.sentAt >= OTP_LIFETIME_MS);
  const resendSeconds = pending
    ? Math.max(0, Math.ceil((pending.sentAt + RESEND_WAIT_MS - now) / 1000))
    : 0;

  useEffect(() => {
    if (!pending) return;
    const updateNow = () => setNow(Date.now());
    const interval = window.setInterval(updateNow, 1000);
    window.addEventListener("focus", updateNow);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", updateNow);
    };
  }, [pending]);

  const requestCode = (requestedEmail: string, resent = false) => {
    sendOtp.mutate(requestedEmail, {
      onSuccess: () => {
        const next = { email: requestedEmail, sentAt: Date.now() };
        savePendingOtp(next);
        setPending(next);
        setEmail(requestedEmail);
        setCode("");
        setNow(next.sentAt);
        setNotice(resent ? "A new code has been sent." : "");
        verifyOtp.reset();
      },
    });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pending) {
      requestCode(email.trim().toLowerCase());
      return;
    }
    if (codeExpired) return;
    verifyOtp.mutate(
      { email: pending.email, otp: code },
      {
        onSuccess: async () => {
          clearPendingOtp();
          await cache.invalidateQueries({ queryKey: userKeys.profile });
          navigate("/dashboard", { replace: true });
        },
      },
    );
  };

  const mutation = sent ? verifyOtp : sendOtp;
  const message = isAxiosError(mutation.error)
    ? mutation.error.response?.data?.message
    : null;
  const resendMessage = isAxiosError(sendOtp.error)
    ? sendOtp.error.response?.data?.message
    : null;
  return (
    <main className="auth-page">
      <section className="auth-form-panel">
        <div className="auth-form">
          <Link to="/" className="auth-brand justify-center">
            <img src="/icon-192x192.png" width="35" height="35" alt="" /> Fettl
          </Link>
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
          {!sent && (
            <>
              <Button
                variant="outline"
                className="w-full"
                onClick={loginWithGoogle}
              >
                <GoogleIcon size={18} /> Continue with Google
              </Button>
              <div className="auth-or">or continue with email</div>
            </>
          )}
          <form onSubmit={submit} className="grid gap-3">
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
                {codeExpired && (
                  <p role="status" className="text-sm text-muted-foreground">
                    This code has expired. Request a new one below.
                  </p>
                )}
                {notice && (
                  <p role="status" className="text-sm text-emerald">
                    {notice}
                  </p>
                )}
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
            {(mutation.isError || (sent && sendOtp.isError)) && (
              <p role="alert" className="text-sm text-destructive">
                {typeof (sent && sendOtp.isError ? resendMessage : message) ===
                "string"
                  ? sent && sendOtp.isError
                    ? resendMessage
                    : message
                  : "Something went wrong. Please try again."}
              </p>
            )}
            <Button
              type="submit"
              disabled={
                mutation.isPending ||
                (sent && (code.length !== 6 || codeExpired))
              }
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                variant="link"
                onClick={() => {
                  clearPendingOtp();
                  setPending(null);
                  setCode("");
                  setNotice("");
                  sendOtp.reset();
                  verifyOtp.reset();
                }}
              >
                Change email
              </Button>
              <Button
                variant="link"
                disabled={resendSeconds > 0 || sendOtp.isPending}
                onClick={() => requestCode(pending!.email, true)}
              >
                {sendOtp.isPending
                  ? "Sending…"
                  : resendSeconds > 0
                    ? `Resend in ${resendSeconds}s`
                    : "Resend code"}
              </Button>
            </div>
          ) : (
            <>
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
