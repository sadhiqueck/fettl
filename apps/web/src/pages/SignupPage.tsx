import { SignupForm } from "@/features/auth/components/Signup-form";
import { AnimatedGridPattern } from "@/shared/components/ui/animated-grid-pattern";
import { cn } from "@/shared/lib/utils";

export default function SignupPage() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-white dark:bg-background overflow-hidden p-6 md:p-10">
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.1}
        duration={3}
        repeatDelay={1}
        className={cn(
          "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12",
        )}
      />
      <div className="z-10 w-full max-w-sm md:max-w-4xl">
        <SignupForm />
      </div>
    </div>
  );
}
