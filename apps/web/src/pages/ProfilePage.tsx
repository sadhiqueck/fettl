import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { VPA_REGEX } from "@fettl/shared";
import { AtSign, Bell, CheckCircle2, LogOut, UserRound } from "lucide-react";
import { ThemeToggle } from "@/shared/components/ui/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { usePushNotifications } from "@/shared/hooks/usePushNotifications";
import {
  useLogout,
  useUpdateProfile,
  useUserProfile,
} from "@/shared/hooks/useUser";

type ProfileDraft = { userId: string; name: string; vpa: string };

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?"
  );
}

function ProfileSkeleton() {
  return (
    <div className="chat-main-panel overflow-y-auto">
      <header className="chat-header bg-card">
        <div className="space-y-2">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-48" />
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl space-y-8 px-5 py-8 sm:px-8">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-52" />
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.85fr)]">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { data: user, isLoading } = useUserProfile();
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const updateProfile = useUpdateProfile();
  const logout = useLogout();
  const {
    isSupported,
    subscription,
    permission,
    loading: pushLoading,
    subscribe,
  } = usePushNotifications();

  const currentDraft = draft?.userId === user?.id ? draft : null;
  const name = currentDraft?.name ?? user?.name ?? "";
  const vpa = currentDraft?.vpa ?? user?.vpa ?? "";
  const normalizedName = name.trim();
  const normalizedVpa = vpa.trim();
  const nameValid = normalizedName.length >= 2 && normalizedName.length <= 80;
  const vpaValid = !normalizedVpa || VPA_REGEX.test(normalizedVpa);
  const changed =
    Boolean(user) &&
    (normalizedName !== user?.name || normalizedVpa !== (user?.vpa ?? ""));

  const updateDraft = (patch: Partial<Pick<ProfileDraft, "name" | "vpa">>) => {
    if (!user) return;
    setDraft({ userId: user.id, name, vpa, ...patch });
  };

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !changed || !nameValid || !vpaValid) return;
    updateProfile.mutate(
      { name: normalizedName, vpa: normalizedVpa || null },
      {
        onSuccess: () => {
          setDraft(null);
          toast.success("Profile saved");
        },
        onError: () =>
          toast.error("Could not save your profile. Check your details."),
      },
    );
  };

  if (isLoading || !user) return <ProfileSkeleton />;

  return (
    <div className="chat-main-panel overflow-y-auto">
      <header className="chat-header bg-card">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your details and app preferences
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-5 py-7 sm:px-8 sm:py-9">
        <div className="mb-7 flex min-w-0 items-center gap-4 sm:mb-9">
          <Avatar className="size-16 border-2 border-card bg-muted ring-1 ring-border sm:size-18">
            {user.avatarUrl && (
              <AvatarImage
                src={user.avatarUrl}
                alt=""
                referrerPolicy="no-referrer"
              />
            )}
            <AvatarFallback className="bg-[#f8edca] text-xl font-semibold text-[#5d481a] dark:bg-[#453a24] dark:text-[#f4dfaa]">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
              {user.name}
            </h2>
            <p className="truncate text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.85fr)] lg:gap-6">
          <Card className="gap-0 py-0 shadow-none">
            <CardHeader className="gap-1 border-b border-border/70 px-5 py-5 sm:px-7 sm:py-6">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <UserRound className="size-4 text-muted-foreground" />
                Personal details
              </CardTitle>
              <CardDescription>
                The information people in your groups can see.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 py-6 sm:px-7">
              <form onSubmit={save} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Full name</Label>
                  <Input
                    id="profile-name"
                    autoComplete="name"
                    maxLength={80}
                    value={name}
                    aria-invalid={Boolean(currentDraft && !nameValid)}
                    aria-describedby={currentDraft && !nameValid ? "profile-name-error" : undefined}
                    onChange={(event) => updateDraft({ name: event.target.value })}
                  />
                  {currentDraft && !nameValid && (
                    <p id="profile-name-error" className="text-xs text-destructive">
                      Enter at least two characters.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Email address</Label>
                  <div className="rounded-lg border border-border bg-muted/35 px-3 py-2.5 text-sm text-foreground">
                    {user.email}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Used for sign in. This address can’t be changed here.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-vpa">UPI ID</Label>
                  <div className="relative">
                    <AtSign
                      aria-hidden="true"
                      className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="profile-vpa"
                      value={vpa}
                      onChange={(event) => updateDraft({ vpa: event.target.value })}
                      placeholder="yourname@upi"
                      aria-invalid={Boolean(normalizedVpa && !vpaValid)}
                      aria-describedby="profile-vpa-help"
                      className="pl-9"
                    />
                  </div>
                  <p
                    id="profile-vpa-help"
                    className={
                      normalizedVpa && !vpaValid
                        ? "text-xs text-destructive"
                        : "text-xs text-muted-foreground"
                    }
                  >
                    {normalizedVpa && !vpaValid
                      ? "Enter a UPI ID in the format name@bank."
                      : normalizedVpa
                        ? "Format looks right. We don’t verify the UPI account."
                        : "Optional. Group members can use this ID to settle up with you."}
                  </p>
                </div>

                <div className="flex justify-end border-t border-border/70 pt-5">
                  <Button
                    type="submit"
                    disabled={
                      !changed || !nameValid || !vpaValid || updateProfile.isPending
                    }
                  >
                    {updateProfile.isPending ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-5">
            <Card className="gap-0 py-0 shadow-none">
              <CardHeader className="gap-1 px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
                <CardTitle className="text-base font-semibold">Appearance</CardTitle>
                <CardDescription>
                  Choose how Fettl looks on this device.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-6 sm:px-6">
                <ThemeToggle />
              </CardContent>
            </Card>

            <Card className="gap-0 py-0 shadow-none">
              <CardHeader className="gap-1 px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Bell className="size-4 text-muted-foreground" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Alerts for new expenses and messages.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-6 sm:px-6">
                {pushLoading ? (
                  <Skeleton className="h-9 w-36" />
                ) : !isSupported ? (
                  <p className="text-sm text-muted-foreground">
                    Push notifications aren’t available in this browser.
                  </p>
                ) : subscription ? (
                  <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="size-4" /> Notifications are on
                  </p>
                ) : permission === "denied" ? (
                  <p className="text-sm text-muted-foreground">
                    Notifications are blocked in your browser settings.
                  </p>
                ) : (
                  <Button
                    variant="outline"
                    disabled={pushLoading}
                    onClick={async () => {
                      if (!(await subscribe()))
                        toast.error("Could not enable notifications.");
                    }}
                  >
                    Enable notifications
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <section
          aria-labelledby="profile-session"
          className="mt-9 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h2 id="profile-session" className="text-sm font-semibold">
              Account access
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign out of Fettl on this browser.
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            <LogOut className="size-4" />
            {logout.isPending ? "Signing out…" : "Sign out"}
          </Button>
        </section>
      </div>
    </div>
  );
}
