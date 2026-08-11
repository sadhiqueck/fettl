import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background text-foreground px-4">
      <span className="text-8xl select-none">🤷</span>
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-black font-display">404 — Page not found</h1>
        <p className="text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
      </div>
      <button
        onClick={() => navigate("/dashboard", { replace: true })}
        className="clay-btn-primary px-6 py-2 text-sm font-display font-bold"
      >
        Go home
      </button>
    </div>
  );
}
