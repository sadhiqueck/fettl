import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ArrowRight } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearPendingOtp } from "@/features/auth/lib/pendingOtp";
import { Button } from "@/shared/components/ui/button";
import { apiClient } from "@/shared/lib/apiClient";
import { userKeys } from "@/shared/hooks/queryKeys";

export default function MagicLinkPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const cache = useQueryClient();
  const [token] = useState(() =>
    new URLSearchParams(location.hash.slice(1)).get("token"),
  );
  const validToken = Boolean(token && /^[a-f0-9]{64}$/.test(token));
  const confirm = useMutation({
    mutationFn: () => apiClient.post("/auth/magic-link/verify", { token }),
    onSuccess: async () => {
      clearPendingOtp();
      await cache.invalidateQueries({ queryKey: userKeys.profile });
      navigate("/dashboard", { replace: true });
    },
  });

  useEffect(() => {
    if (location.hash) {
      navigate(
        { pathname: location.pathname, search: location.search, hash: "" },
        { replace: true },
      );
    }
  }, [location.hash, location.pathname, location.search, navigate]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validToken && !confirm.isPending) confirm.mutate();
  };
  const expired =
    isAxiosError(confirm.error) && confirm.error.response?.status === 401;

  return (
    <main className="auth-page">
      <section className="auth-form-panel">
        <div className="auth-form">
          <Link to="/" className="auth-brand justify-center">
            <img src="/icon-192x192.png" width="35" height="35" alt="" /> Fettl
          </Link>
          <h1>{validToken ? "Confirm sign in" : "This link isn’t valid"}</h1>
          <p>
            {validToken
              ? "Continue to sign in with the link from your email."
              : "Request a new sign-in link to access your account."}
          </p>
          {validToken ? (
            <form onSubmit={submit} className="grid gap-3">
              {confirm.isError && (
                <p role="alert" className="text-sm text-destructive">
                  {expired
                    ? "This link has expired or was already used. Request a new one."
                    : "We couldn’t complete sign in. Check your connection and try again."}
                </p>
              )}
              <Button type="submit" disabled={confirm.isPending}>
                {confirm.isPending ? "Signing in…" : "Continue to Fettl"}
                <ArrowRight />
              </Button>
            </form>
          ) : null}
          <p className="auth-switch">
            <Link to="/login">Back to sign in</Link>
          </p>
        </div>
        <footer>
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
        </footer>
      </section>
    </main>
  );
}
