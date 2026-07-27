import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile, useUpdateProfile } from "@/shared/hooks/useUser";
import { useUpload } from "@/shared/hooks/useUpload";
import { VPA_REGEX } from "@fettl/shared";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  AtSign,
  Camera,
  User as UserIcon,
  LayoutGrid,
  Home,
  Briefcase,
  Users,
  IndianRupee,
  Info,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Lock,
  MoreVertical,
} from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { toast } from "sonner";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";

const PREDEFINED_AVATARS = [
  "https://api.dicebear.com/9.x/notionists/svg?seed=Felix",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Aneka",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Jasper",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Mia",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Leo",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Zoe",
];

export default function OnboardingPage() {
  const { data: user } = useUserProfile();
  const updateProfileMutation = useUpdateProfile();
  const { uploadFile, isUploading } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);

  // Step 1
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(
    user?.avatarUrl || PREDEFINED_AVATARS[0],
  );

  // Step 2
  const [vpa, setVpa] = useState(user?.vpa || "");
  const [vpaTouched, setVpaTouched] = useState(false);

  // Handlers
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Optimistic UI preview
    const objectUrl = URL.createObjectURL(file);
    setAvatarUrl(objectUrl);

    try {
      const url = await uploadFile(file);
      setAvatarUrl(url);
      toast.success("Avatar uploaded successfully");
    } catch {
      toast.error("Failed to upload avatar");
    }
  };

  const isPhoneValid = () => {
    if (!phone) return true; // optional
    const parsed = parsePhoneNumberFromString(phone, "IN");
    return parsed?.isValid() ?? false;
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (phone && !isPhoneValid()) {
      setPhoneTouched(true);
      return;
    }

    setStep(2);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isValidVpa = vpa.trim().length > 0 && VPA_REGEX.test(vpa);

    if (!isValidVpa) {
      setVpaTouched(true);
      toast.error("Please enter a valid UPI ID");
      return;
    }

    let formattedPhone = phone;
    if (phone) {
      const parsed = parsePhoneNumberFromString(phone, "IN");
      if (parsed) {
        formattedPhone = parsed.number; // E.164
      }
    }

    updateProfileMutation.mutate(
      {
        name,
        avatarUrl,
        vpa: vpa.trim(),
        ...(formattedPhone ? { phone: formattedPhone } : {}),
        isOnboarded: true,
      },
      {
        onSuccess: () => {
          toast.success("Welcome to Fettl!");
          navigate("/dashboard", { replace: true });
        },
        onError: () => {
          toast.error("Failed to update profile");
        },
      },
    );
  };

  const isVpaValid = vpa.trim().length > 0 && VPA_REGEX.test(vpa);
  const showVpaError = vpaTouched && !isVpaValid;
  const showVpaSuccess = isVpaValid;

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-between overflow-clip p-4 bg-background">
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-2 py-4">
        <Card className="grid w-full grid-cols-1 gap-12 overflow-hidden px-4 py-2 sm:px-12 sm:py-10 xl:grid-cols-[40%_1fr] xl:pl-10 xl:pr-0 bg-card h-[85dvh] min-h-170 max-h-225 max-w-133 xl:max-w-6xl rounded-2xl border border-border">
          {/* Left: Form */}
          <div className="flex h-full min-h-0 flex-col relative">
            {/* Scrollable form area */}
            <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto pb-20 pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {/* Progress Bar */}
              <div className="flex gap-2 w-full mb-10 shrink-0">
                <div
                  className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`}
                />
                <div
                  className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`}
                />
              </div>

              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="mb-8">
                    <h1 className="text-2xl font-semibold mb-2">
                      Complete your profile
                    </h1>
                    <p className="text-muted-foreground text-sm">
                      How should we identify you in groups?
                    </p>
                  </div>

                  <form
                    id="onboarding-form"
                    onSubmit={handleStep1Submit}
                    className="space-y-6"
                  >
                    <div className="flex flex-col items-center sm:items-start gap-4">
                      <div className="relative">
                        <Avatar className="h-24 w-24 rounded-full">
                          <AvatarImage src={avatarUrl} alt={name || "Avatar"} />
                          <AvatarFallback className="rounded-full">
                            <UserIcon className="h-10 w-10 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute bottom-0 right-0 p-2 rounded-full bg-background border border-border shadow-sm hover:bg-muted transition-colors disabled:opacity-50"
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Camera className="h-4 w-4" />
                          )}
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleAvatarUpload}
                        />
                      </div>

                      <div className="flex gap-2 overflow-x-auto w-full pb-2">
                        {PREDEFINED_AVATARS.map((url, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setAvatarUrl(url)}
                            className={`relative h-12 w-12 rounded-full shrink-0 overflow-hidden border-2 transition-all ${avatarUrl === url ? "border-primary ring-2 ring-primary/20" : "border-border/50 hover:border-border"}`}
                          >
                            <img
                              src={url}
                              alt={`Predefined ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Jane Doe"
                          required
                          className="clay-input"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number (Optional)</Label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                            +91
                          </div>
                          <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => {
                              setPhone(e.target.value);
                              setPhoneTouched(true);
                            }}
                            onBlur={() => setPhoneTouched(true)}
                            placeholder="98765 43210"
                            className={`pl-12 ${phoneTouched && phone && !isPhoneValid() ? "border-destructive/80 focus-visible:ring-destructive/20" : ""}`}
                          />
                          {phoneTouched && phone && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {isPhoneValid() ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              )}
                            </div>
                          )}
                        </div>
                        {phoneTouched && phone && !isPhoneValid() ? (
                          <p className="text-xs text-red-500 font-medium mt-1">
                            Please enter a valid phone number.
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">
                            Helps you connect with friends easily.
                          </p>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 h-full flex flex-col">
                  <div className="mb-8">
                    <div className="h-14 w-14 rounded-2xl bg-muted border border-border flex items-center justify-center mb-6 shadow-sm">
                      <IndianRupee className="h-6 w-6 text-foreground" />
                    </div>
                    <h1 className="text-2xl font-semibold mb-2">
                      Set up payments
                    </h1>
                    <p className="text-muted-foreground text-sm">
                      Where should group members send your money?
                    </p>
                  </div>

                  <form
                    id="onboarding-form"
                    onSubmit={handleFinalSubmit}
                    className="space-y-6 flex-1"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="vpa">UPI ID (VPA)</Label>
                      <div className="relative group">
                        <AtSign
                          className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                            showVpaSuccess
                              ? "text-green-500"
                              : showVpaError
                                ? "text-destructive"
                                : "text-muted-foreground group-focus-within:text-primary"
                          }`}
                        />
                        <Input
                          id="vpa"
                          value={vpa}
                          onChange={(e) => {
                            setVpa(e.target.value.toLowerCase());
                            if (vpaTouched) setVpaTouched(true);
                          }}
                          onBlur={() => setVpaTouched(true)}
                          placeholder="username@upi"
                          className={`pl-9 ${
                            showVpaError
                              ? "border-destructive/80 focus-visible:ring-destructive/20"
                              : showVpaSuccess
                                ? "border-green-500/50 focus-visible:ring-green-500/20"
                                : ""
                          }`}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {showVpaSuccess && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                          {showVpaError && (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      </div>
                      {showVpaError && (
                        <p className="text-[0.8rem] text-destructive font-medium">
                          Please enter a valid UPI ID (e.g., name@okbank)
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl border border-border bg-muted/40 p-4 flex gap-3 text-sm">
                      <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="text-muted-foreground leading-relaxed">
                        You can find your UPI ID in Google Pay, PhonePe, or your
                        bank's app. We only use this to let others pay you.
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Floating Glassy Footer */}
            <div className="absolute bottom-0 left-0 right-3 z-10 flex items-center justify-start rounded-2xl bg-white dark:bg-[rgba(255,255,255,0.01)] p-2 shadow-[0px_12px_32px_-6px_rgba(0,0,0,0.12),0px_0px_0px_1px_rgba(255,255,255,0.06),0px_1px_3px_0px_rgba(0,0,0,0.1)] backdrop-blur-md transform-gpu">
              <div className="flex w-full items-center justify-between gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => (step === 1 ? navigate(-1) : setStep(1))}
                  className="px-4 h-9 text-muted-foreground font-medium"
                >
                  Back
                </Button>
                <Button
                  form="onboarding-form"
                  type="submit"
                  variant="glassyInverted"
                  className="px-4 h-8 font-medium"
                  disabled={
                    step === 2 &&
                    (updateProfileMutation.isPending || !isVpaValid)
                  }
                >
                  {step === 2 && updateProfileMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {step === 1 ? "Continue" : "Complete Setup"}
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Mockup Preview */}
          <div className="hidden h-full max-h-full min-h-0 flex-col overflow-hidden xl:flex">
            <div className="bg-card border-border hidden h-full w-full flex-col overflow-hidden rounded-l-2xl border-y border-l xl:flex">
              {/* Top Browser Bar */}
              <div className="border-border bg-card flex min-w-0 shrink-0 items-center gap-3 rounded-t-2xl border-b p-3">
                <div className="flex shrink-0 items-center gap-4 opacity-50">
                  <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <RotateCw className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="bg-muted flex w-full min-w-0 items-center gap-2 rounded-full px-3 py-2">
                  <Lock className="h-3 w-3 text-muted-foreground" />
                  <p className="text-foreground truncate text-sm font-medium leading-tight">
                    fettl.com/
                    {name.toLowerCase().replace(/\s+/g, "") || "new-user"}
                  </p>
                </div>
                <MoreVertical className="h-4 w-4 text-muted-foreground opacity-50" />
              </div>

              {/* Content Area with our App Mockup inside */}
              <div className="bg-background h-full pl-11 pt-11 relative">
                <div className="bg-card border-border flex h-full w-full flex-col overflow-hidden rounded-tl-xl border-t border-l shadow-2xl relative">
                  <div
                    className={`flex w-full h-full transition-all duration-1000 ease-in-out ${step === 1 ? "translate-x-0 scale-100" : "-translate-x-[50%] scale-[1.3]"}`}
                  >
                    {/* Nav Rail */}
                    <div className="w-16 border-r border-border/40 flex flex-col items-center py-6 gap-6 bg-muted/10 rounded-tl-2xl">
                      <Avatar className="h-8 w-8 ring-2 ring-primary/20 mb-4 rounded-full">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium rounded-full">
                          {name ? (
                            name.charAt(0).toUpperCase()
                          ) : (
                            <UserIcon className="h-4 w-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <LayoutGrid className="h-5 w-5 text-primary" />
                      <Home className="h-5 w-5 text-muted-foreground/50" />
                      <Briefcase className="h-5 w-5 text-muted-foreground/50" />
                      <Users className="h-5 w-5 text-muted-foreground/50" />
                    </div>

                    {/* Chat List (simplified mockup) */}
                    <div className="w-55 border-r border-border/40 flex flex-col p-3 bg-card">
                      <div className="text-xs font-semibold mb-3 px-1">
                        Chats
                      </div>
                      <div className="h-12 rounded-lg bg-primary/10 mb-2 flex items-center px-2 border border-primary/20 gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/20 shrink-0 flex items-center justify-center text-[10px] font-medium text-primary">
                          GT
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="text-xs font-medium text-primary truncate">
                            Goa Trip
                          </div>
                          <div className="text-[10px] text-primary/70 truncate">
                            Rahul: I paid for...
                          </div>
                        </div>
                      </div>
                      <div className="h-12 rounded-lg hover:bg-muted/50 mb-1 flex items-center px-2 gap-2 cursor-default">
                        <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0 flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                          R
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="text-xs font-medium truncate">
                            Roommates
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            You: Rent is due
                          </div>
                        </div>
                      </div>
                      <div className="h-12 rounded-lg hover:bg-muted/50 flex items-center px-2 gap-2 cursor-default">
                        <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0 flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                          WT
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="text-xs font-medium truncate">
                            Weekend Trip
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            Sarah: Let's book
                          </div>
                        </div>
                      </div>
                      <div className="h-12 rounded-lg hover:bg-muted/50 flex items-center px-2 gap-2 cursor-default mt-1">
                        <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0 flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                          OL
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="text-xs font-medium truncate">
                            Office Lunch
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            Amit: 🍕
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Main Chat Area */}
                    <div className="flex-1 flex flex-col bg-card rounded-tr-2xl">
                      <div className="h-12 border-b border-border/40 flex items-center px-4">
                        <div className="text-sm font-medium">Goa Trip</div>
                      </div>

                      <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden relative">
                        {/* Received Message */}
                        <div className="self-start max-w-[80%]">
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="h-4 w-4 rounded-full bg-muted-foreground/20" />
                            <span className="text-[10px] text-muted-foreground">
                              Rahul
                            </span>
                          </div>
                          <div className="bg-muted p-2.5 rounded-2xl rounded-tl-sm text-xs">
                            Who paid for dinner ?
                          </div>
                        </div>

                        {/* Sent Expense Bubble showing VPA status dynamically */}
                        <div className="self-end max-w-[85%] mt-4">
                          <div className="flex items-center gap-1.5 mb-1 justify-end">
                            <span className="text-[10px] font-medium">
                              {name || "You"}
                            </span>
                            <Avatar className="h-4 w-4 rounded-full">
                              <AvatarImage src={avatarUrl} />
                            </Avatar>
                          </div>
                          <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-sm shadow-sm border border-primary-foreground/5 backdrop-blur-[2px]">
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <span className="text-xs font-medium">
                                Dinner at Paragon
                              </span>
                              <span className="text-sm font-bold">₹4,200</span>
                            </div>
                            <div className="h-px w-full bg-primary-foreground/20 mb-2" />
                            <div className="text-[10px] flex items-center gap-1 opacity-90">
                              {isVpaValid ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3" />
                                  Pay to {vpa}
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-3 w-3" />
                                  Setup UPI to receive payments
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Input mockup */}
                        <div className="absolute bottom-4 left-4 right-4 h-10 rounded-full border border-border/60 bg-muted/20 flex items-center px-3">
                          <div className="h-4 w-4 rounded-full bg-muted-foreground/30 mr-2" />
                          <div className="h-1.5 w-16 bg-muted-foreground/20 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex w-full flex-col items-center justify-center sm:gap-4 px-6 sm:py-4">
          <div className="flex min-h-1.5 items-center gap-2">
            <div
              className={`shrink-0 rounded-full transition-all h-1.5 w-1.5 ${step === 1 ? "bg-primary" : "bg-primary/50"}`}
            />
            <div
              className={`shrink-0 rounded-full transition-all h-1 w-1 ${step === 2 ? "bg-primary" : "bg-primary/50 opacity-50"}`}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              /* logout logic if available */
            }}
            className="group whitespace-nowrap inline-flex items-center font-medium relative rounded-lg cursor-pointer gap-1 border border-transparent hover:bg-muted hover:text-foreground text-muted-foreground transition-all px-2.5 py-2 text-sm h-7"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
