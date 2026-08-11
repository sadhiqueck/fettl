import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground mb-6 hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-3xl font-black font-display mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-8">Last updated: August 2026</p>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-muted-foreground">
          <p>
            Fettl collects only the information needed to provide the expense-splitting
            service: your email address, display name, and the financial data you
            voluntarily enter (expenses, settlements, group memberships).
          </p>
          <p>
            We do not sell your data to third parties. Data is stored securely and
            encrypted at rest where appropriate (e.g. UPI/VPA IDs).
          </p>
          <p>
            You may request deletion of your account and associated data at any time by
            contacting support@fettl.app.
          </p>
        </div>
      </div>
    </div>
  );
}
