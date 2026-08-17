import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useUserProfile } from "@/shared/hooks/useUser";
import { useJoinGroup } from "@/features/groups/hooks/useGroups";
import { Button } from "@/shared/components/ui/button";
import { useEffect } from "react";
import { isAxiosError } from "axios";

export default function JoinGroupPage() {
  const { inviteCode = "" } = useParams();
  const { data: user, isPending, error, refetch } = useUserProfile();
  const join = useJoinGroup();
  const navigate = useNavigate();
  const valid = /^[A-Z1-9]{6}$/i.test(inviteCode);
  const signedOut = isAxiosError(error) && error.response?.status === 401;
  useEffect(() => {
    if (valid && user?.isOnboarded) sessionStorage.removeItem("pendingInvite");
    if (valid && (signedOut || (user && !user.isOnboarded))) {
      sessionStorage.setItem("pendingInvite", inviteCode);
      navigate(signedOut ? "/login" : "/onboarding", { replace: true });
    }
  }, [valid, signedOut, user, inviteCode, navigate]);
  if (!valid) return <Navigate to="/dashboard" replace />;
  return (
    <main className="min-h-svh grid place-items-center p-5">
      <section className="state-panel">
        <h1 className="text-2xl font-semibold">Group invitation</h1>
        {isPending || signedOut ? (
          <p role="status">Checking your account…</p>
        ) : error ? (
          <Button onClick={() => refetch()}>Retry loading account</Button>
        ) : (
          <>
            <p>
              Join the group with invite code <strong>{inviteCode}</strong>.
            </p>
            <Button
              disabled={join.isPending}
              onClick={() =>
                join.mutate(inviteCode.toUpperCase(), {
                  onSuccess: (data) =>
                    navigate(`/groups/${data.group.id}`, { replace: true }),
                })
              }
            >
              {join.isPending ? "Joining…" : "Join group"}
            </Button>
          </>
        )}
        <Button variant="link" onClick={() => navigate("/dashboard")}>
          Back to overview
        </Button>
      </section>
    </main>
  );
}
