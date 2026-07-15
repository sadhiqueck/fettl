import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { GoogleIcon } from "@/shared/components/ui/icons";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { ChevronRight, X, Loader2 } from "lucide-react";
import { MicrosoftIcon, YahooIcon, AppleIcon, ZohoIcon } from "@/shared/components/ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toast } from "sonner";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const { sendOtp, verifyOtp, loginWithGoogle } = useAuth();
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error("Please enter a valid email address");
        return;
      }
      
      sendOtp.mutate(email, {
        onSuccess: () => {
          setStep("otp");
          if (cooldown === 0) setCooldown(60);
        }
      });
    } else {
      verifyOtp.mutate({ email, otp });
    }
  };

  const getEmailProviders = (email: string) => {
    const lowerEmail = email.toLowerCase();
    if (lowerEmail.endsWith("@gmail.com")) return [{ name: "Gmail", url: "https://mail.google.com/", Icon: GoogleIcon }];
    if (lowerEmail.endsWith("@outlook.com") || lowerEmail.endsWith("@hotmail.com")) return [{ name: "Outlook", url: "https://outlook.live.com/", Icon: MicrosoftIcon }];
    if (lowerEmail.endsWith("@yahoo.com")) return [{ name: "Yahoo", url: "https://mail.yahoo.com/", Icon: YahooIcon }];
    if (lowerEmail.endsWith("@icloud.com") || lowerEmail.endsWith("@me.com") || lowerEmail.endsWith("@mac.com")) return [{ name: "iCloud", url: "https://www.icloud.com/mail", Icon: AppleIcon }];
    if (lowerEmail.endsWith("@zoho.com") || lowerEmail.endsWith("@zohomail.in")) return [{ name: "Zoho", url: "https://mail.zoho.com/", Icon: ZohoIcon }];
    
    // Custom domain fallback: suggest primary business email providers
    return [
      { name: "Gmail", url: "https://mail.google.com/", Icon: GoogleIcon },
      { name: "Outlook", url: "https://outlook.live.com/", Icon: MicrosoftIcon },
      { name: "Zoho", url: "https://mail.zoho.com/", Icon: ZohoIcon }
    ];
  };

  const providers = getEmailProviders(email);

  return (
    <>
      <div
        className={cn(
          "flex flex-col gap-4 md:gap-6 w-full max-w-md mx-auto justify-center",
          className,
        )}
        {...props}
      >
        <div className="flex flex-col items-center gap-2 md:gap-4 text-center mb-0 md:mb-2">
          <div className="space-y-1 md:space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Create your Fettl account
            </h1>
            <p className="text-sm md:text-lg text-muted-foreground text-balance">
              Balance Together. Start sharing expenses the smarter way.
            </p>
          </div>
        </div>
        <form className="max-w-92 mx-auto w-full" onSubmit={handleSubmit}>
          <FieldGroup>
            {step === "email" ? (
              <>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <div className="relative">
                    <Input
                      key="email-input"
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={email.length > 0 ? "pr-8" : ""}
                    />
                    {email.length > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              tabIndex={-1}
                              onClick={() => setEmail("")}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted/50 transition-colors"
                              aria-label="Clear email"
                            >
                              <X className="size-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">
                            <p>Clear Email</p>
                          </TooltipContent>
                        </Tooltip>
                    )}
                  </div>
                  <FieldDescription className="mb-2 text-xs">
                    We'll use this to contact you. We never share your email.
                  </FieldDescription>
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={sendOtp.isPending || cooldown > 0}
                    className="w-full justify-center opacity-75 font-normal gap-1 transition-all"
                  >
                    {sendOtp.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : cooldown > 0 ? (
                      `Resend available in ${cooldown}s`
                    ) : (
                      <>
                        Continue with email
                        <ChevronRight className="size-4 opacity-50" strokeWidth={3} />
                      </>
                    )}
                  </Button>
                </Field>

                <FieldSeparator className=" text-sm text-muted-foreground [&>span]:bg-white dark:[&>span]:bg-[#171717]">
                  OR
                </FieldSeparator>

                <Field className="flex flex-col gap-3">
                  <Button
                    variant="glassyInverted"
                    type="button"
                    onClick={loginWithGoogle}
                    className="w-full gap-1.5 font-normal"
                  >
                    <GoogleIcon size={26} />
                    Continue with Google
                  </Button>
                </Field>
              </>
            ) : (
              <Field>
                <FieldLabel htmlFor="otp">Enter confirmation code</FieldLabel>
                <Input
                  key="otp-input"
                  id="otp"
                  type="text"
                  maxLength={6}
                  placeholder="••••••"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                  className="text-center tracking-[1em] pl-[1em] text-lg font-mono"
                  autoComplete="one-time-code"
                />
                <FieldDescription className="mb-2 text-xs text-center flex flex-col items-center gap-3">
                  <span>We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>.</span>
                  
                  {providers.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2">
                      {providers.map((p) => (
                        <Button
                          key={p.name}
                          type="button"
                          variant="outline"
                          className="h-7 px-3 text-xs rounded-full border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:border-muted-foreground/60 transition-colors gap-1.5"
                          onClick={() => p.url ? window.open(p.url, '_blank') : null}
                          title={`Open ${p.name}`}
                        >
                          <p.Icon size={14} />
                          {providers.length === 1 ? `Open ${p.name}` : p.name}
                        </Button>
                      ))}
                    </div>
                  )}
                </FieldDescription>
                <Button
                  type="submit"
                  variant="glassyInverted"
                  disabled={verifyOtp.isPending || otp.length !== 6}
                  className="w-full justify-center font-normal gap-1 opacity-80"
                >
                  {verifyOtp.isPending ? <Loader2 className="size-4 animate-spin" /> : "Verify Code"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={verifyOtp.isPending}
                  className="w-full text-muted-foreground"
                  onClick={() => setStep("email")}
                >
                  Back to email
                </Button>
              </Field>
            )}
          </FieldGroup>
        </form>

        <FieldDescription className="px-6 text-center mt-4">
          By clicking continue, you agree to our{" "}
          <Link
            to="/terms"
            className="underline hover:text-foreground transition-colors"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            to="/privacy"
            className="underline hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          .
        </FieldDescription>

        <div className="text-center text-sm md:text-base text-muted-foreground px-6 mt-1">
          Already using Fettl?{" "}
          <Link
            to="/login"
            className="text-blue-500 hover:text-blue-600 font-medium hover:underline transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </>
  );
}
