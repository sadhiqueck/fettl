import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useJoinGroup } from "@/features/groups/hooks/useGroups";
import { useUserProfile } from "@/shared/hooks/useUser";

export default function JoinGroupPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { mutate: joinGroup } = useJoinGroup();
  const { data: user, isLoading: authLoading, isError: notAuthed } = useUserProfile();
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    // If not authenticated, redirect to login and come back after sign-in
    if (notAuthed || !user) {
      navigate(`/login?redirect=/groups/join/${inviteCode ?? ""}`, { replace: true });
      return;
    }

    if (!inviteCode || attempted) return;
    setAttempted(true);

    joinGroup(inviteCode, {
      onSuccess: (data) => {
        // Navigate to the newly joined group
        const groupId = (data as { id?: string })?.id;
        navigate(groupId ? `/groups/${groupId}` : "/dashboard", { replace: true });
      },
      onError: () => {
        navigate("/dashboard", { replace: true });
      },
    });
  }, [authLoading, notAuthed, user, inviteCode, joinGroup, navigate, attempted]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="text-muted-foreground font-medium">Joining group…</p>
    </div>
  );
}
