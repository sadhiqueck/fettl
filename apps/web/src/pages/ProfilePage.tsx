import { ThemeToggle } from "@/shared/components/ui/ThemeToggle";
import { toast } from "sonner";
import { useState } from "react";
import { VPA_REGEX } from "@fettl/shared";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  AtSign,
  CheckCircle2,
  LogOut,
  Bell,
  User as UserIcon,
} from "lucide-react";
import {
  useUpdateProfile,
  useUserProfile,
  useLogout,
} from "@/shared/hooks/useUser";
import { usePushNotifications } from "@/shared/hooks/usePushNotifications";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [vpa, setVpa] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: user, isLoading } = useUserProfile();
  const updateProfileMutation = useUpdateProfile();
  const logoutMutation = useLogout();

  const {
    isSupported,
    subscription,
    permission,
    loading: pushLoading,
    subscribe,
  } = usePushNotifications();

  if (user && !isInitialized) {
    setName(user.name || "");
    setEmail(user.email || "");
    setVpa(user.vpa || "");
    setIsInitialized(true);
  }

  const isVpaValid = vpa.length === 0 || VPA_REGEX.test(vpa);

  const handleSaveChanges = () => {
    updateProfileMutation.mutate(
      {
        name,
        vpa: vpa.trim() || null,
      },
      {
        onSuccess: () => toast.success("Profile saved"),
        onError: () =>
          toast.error("Could not save your profile. Check your details."),
      },
    );
  };

  const getInitials = (fullname: string) => {
    if (!fullname) return "UK";
    return fullname
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="chat-main-panel overflow-hidden">
        <header className="chat-header">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-4 w-1/3 mt-2" />
        </header>

        <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full space-y-6">
          {/* Avatar card skeleton */}
          <div className="chat-info-card p-8 mb-6 flex flex-col items-center space-y-4">
            <Skeleton className="size-24 rounded-full" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>

          <div className="flex flex-col gap-6">
            {/* Form card skeleton */}
            <div className="chat-info-card p-6 space-y-6">
              <Skeleton className="h-6 w-1/4" />
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-10 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-main-panel overflow-y-auto">
      <header className="chat-header bg-card">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your account settings
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex items-center gap-4 rounded-xl border border-border bg-card p-5">
          <div className="app-avatar size-14 shrink-0 overflow-hidden">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={name}
                className="w-full h-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <span className="text-lg font-semibold text-foreground">
                  {getInitials(user?.name || "")}
                </span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold">{name}</h2>
            <p className="truncate text-sm text-muted-foreground">{email}</p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="rounded-xl border border-border bg-card p-0 shadow-none">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <UserIcon size={18} className="text-muted-foreground" /> Personal details
              </CardTitle>
              <CardDescription>
                Update your personal information below.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="profile-name"
                  className="text-sm font-medium"
                >
                  Full name
                </Label>
                <Input
                  id="profile-name"
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="profile-email"
                  className="text-sm font-medium"
                >
                  Email address
                </Label>
                <Input
                  id="profile-email"
                  value={email}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="profile-vpa"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  UPI ID (VPA)
                  {vpa && isVpaValid && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald">
                      <CheckCircle2 size={10} />
                      Valid
                    </span>
                  )}
                </Label>
                <div className="relative">
                  <AtSign
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={18}
                  />
                  <Input
                    id="profile-vpa"
                    value={vpa}
                    onChange={(e) => setVpa(e.target.value.trim())}
                    placeholder="yourname@upi"
                    aria-invalid={Boolean(vpa && !isVpaValid)}
                    className="pl-11"
                  />
                </div>
                {vpa && !isVpaValid && (
                  <p className="text-xs text-red-500 font-medium">
                    Enter a valid UPI ID (e.g. name@okaxis)
                  </p>
                )}
              </div>

              <Separator className="app-divider my-4" />

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveChanges}
                  disabled={Boolean(
                    updateProfileMutation.isPending ||
                    (name === user?.name && vpa === (user?.vpa || "")) ||
                    (vpa && !isVpaValid),
                  )}
                >
                  {updateProfileMutation.isPending
                    ? "Saving…"
                    : "Save changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <section className="rounded-xl border border-border bg-card p-6">
            <ThemeToggle />
          </section>
          <Card className="rounded-xl border border-border bg-card p-0 shadow-none">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Bell size={18} className="text-muted-foreground" /> Notifications
              </CardTitle>
              <CardDescription>
                Receive alerts for new expenses and messages even when the app
                is closed.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {!isSupported ? (
                <p className="text-sm text-muted-foreground">
                  Push notifications are not supported on your current browser.
                </p>
              ) : subscription ? (
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <CheckCircle2 size={18} />
                  Notifications are enabled
                </div>
              ) : permission === "denied" ? (
                <p className="text-sm text-red-500 font-medium">
                  Notifications are blocked. Please enable them in your browser
                  settings.
                </p>
              ) : (
                <Button
                  onClick={async () => {
                    if (!(await subscribe()))
                      toast.error("Could not enable notifications.");
                  }}
                  disabled={pushLoading}
                >
                  {pushLoading ? "Enabling…" : "Enable notifications"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <Button
          onClick={() => logoutMutation.mutate()}
          variant="outline"
          className="mt-6 w-full text-destructive hover:text-destructive"
        >
          <LogOut size={18} /> Log out
        </Button>
      </div>
    </div>
  );
}
