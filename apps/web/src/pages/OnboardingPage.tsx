import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { VPA_REGEX } from "@fettl/shared";
import { useUpdateProfile, useUserProfile } from "@/shared/hooks/useUser";
import { useUpload } from "@/shared/hooks/useUpload";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

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
  return (
    <main className="mx-auto max-w-lg px-5 py-10">
      <img
        width="42"
        height="42"
        alt="Fettl"
        src="/icon-192x192.png"
        className="rounded-xl mb-8"
      />
      <h1 className="text-4xl font-semibold tracking-tight">
        Set up your profile
      </h1>
      <p className="my-3 text-muted-foreground">
        Choose the name your group will see on expenses.
      </p>
      <form
        className="expense-editor app-card mt-6 p-5"
        onSubmit={(event) => {
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
                setError(
                  "Couldn’t save your profile. Check the details and try again.",
                ),
            },
          );
        }}
      >
        <label>
          Display name
          <Input
            autoComplete="name"
            value={name}
            minLength={2}
            maxLength={80}
            required
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          UPI ID (optional)
          <Input
            value={vpa}
            placeholder="name@bank"
            onChange={(e) => setVpa(e.target.value)}
          />
        </label>
        <p className="text-sm text-muted-foreground">
          Add a UPI ID if you want group members to pay you through their UPI
          app.
        </p>
        <details>
          <summary>Phone and profile photo</summary>
          <label>
            Phone (optional)
            <Input
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label>
            Profile photo (optional)
            <Input
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
          </label>
          {avatar && (
            <img
              src={avatar}
              alt="Your profile photo"
              className="size-14 rounded-full object-cover"
            />
          )}
        </details>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button
          type="submit"
          disabled={
            update.isPending || upload.isUploading || name.trim().length < 2
          }
        >
          {update.isPending ? "Saving…" : "Continue to Fettl"}
        </Button>
      </form>
    </main>
  );
}
