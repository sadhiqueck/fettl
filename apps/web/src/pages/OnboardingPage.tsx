import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { ArrowRight, Check, ReceiptText, Users } from "lucide-react";
import { VPA_REGEX } from "@fettl/shared";
import { useUpdateProfile, useUserProfile } from "@/shared/hooks/useUser";
import { useUpload } from "@/shared/hooks/useUpload";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

export default function OnboardingPage() {
  const { data: user } = useUserProfile();
  const update = useUpdateProfile();
  const upload = useUpload();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [vpa, setVpa] = useState(user?.vpa ?? "");
  const [avatar, setAvatar] = useState(user?.avatarUrl ?? "");
  const [error, setError] = useState("");

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const number = phone.trim()
      ? parsePhoneNumberFromString(phone, "IN")
      : undefined;
    if (phone.trim() && !number?.isValid()) {
      setError("Enter a valid phone number.");
      return;
    }
    if (vpa.trim() && !VPA_REGEX.test(vpa.trim())) {
      setError("Check your UPI ID.");
      return;
    }
    setError("");
    update.mutate(
      {
        name: name.trim(),
        phone: number?.number,
        vpa: vpa.trim() || undefined,
        avatarUrl: avatar || undefined,
        isOnboarded: true,
      },
      {
        onSuccess: () => navigate("/dashboard", { replace: true }),
        onError: () =>
          setError("Couldn’t save your profile. Check the details and try again."),
      },
    );
  };

  return (
    <main className="onboarding-page">
      <div className="onboarding-brand">
        <img src="/icon-192x192.png" width="30" height="30" alt="" />
        Fettl
      </div>
      <section className="onboarding-card" aria-labelledby="onboarding-title">
        <div className="onboarding-form-panel">
          <div>
            <span className="onboarding-step">Your profile · 1 of 1</span>
            <h1 id="onboarding-title">Set up your profile</h1>
            <p>Choose the name your group will see on shared expenses.</p>
          </div>
          <form onSubmit={saveProfile} className="onboarding-form">
            <div className="grid gap-2">
              <Label htmlFor="onboarding-name">Display name</Label>
              <Input
                id="onboarding-name"
                autoComplete="name"
                value={name}
                minLength={2}
                maxLength={80}
                required
                placeholder="Your name"
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="onboarding-vpa">UPI ID (optional)</Label>
              <Input
                id="onboarding-vpa"
                value={vpa}
                placeholder="name@bank"
                aria-describedby="onboarding-vpa-help"
                onChange={(e) => setVpa(e.target.value)}
              />
              <p id="onboarding-vpa-help" className="text-xs text-muted-foreground">
                Members can use this to pay you in their UPI app.
              </p>
            </div>
            <details className="onboarding-optional">
              <summary>Add phone or profile photo</summary>
              <div className="grid gap-4 pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="onboarding-phone">Phone (optional)</Label>
                  <Input
                    id="onboarding-phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="onboarding-photo">Profile photo (optional)</Label>
                  <Input
                    id="onboarding-photo"
                    type="file"
                    accept="image/*"
                    disabled={upload.isUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        setAvatar(await upload.uploadFile(file));
                        setError("");
                      } catch {
                        setError("Photo upload failed. Please try again.");
                      }
                    }}
                  />
                  {avatar && (
                    <img
                      src={avatar}
                      alt="Your profile photo"
                      className="size-12 rounded-full object-cover"
                    />
                  )}
                </div>
              </div>
            </details>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="onboarding-actions">
              <p>You can update these details later in Profile.</p>
              <Button
                type="submit"
                disabled={update.isPending || upload.isUploading || name.trim().length < 2}
              >
                {update.isPending ? "Saving…" : "Continue"}
                {!update.isPending && <ArrowRight size={15} />}
              </Button>
            </div>
          </form>
        </div>
        <div className="onboarding-preview" aria-hidden="true">
          <div className="onboarding-preview-card">
            <div className="flex items-center gap-3 border-b border-border p-4">
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <Users size={17} />
              </div>
              <div>
                <strong className="block text-sm">Weekend away</strong>
                <span className="text-xs text-muted-foreground">4 members</span>
              </div>
            </div>
            <div className="grid gap-3 p-4">
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <ReceiptText size={16} className="text-muted-foreground" />
                <span className="flex-1 text-sm">Shared expense</span>
                <span className="text-sm font-medium tabular-nums">₹1,200</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">
                <Check size={15} /> Everyone stays in sync
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
