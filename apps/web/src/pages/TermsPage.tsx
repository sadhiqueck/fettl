import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
        <h1 className="text-3xl font-black font-display mb-4">Terms of Service</h1>
        <p className="text-muted-foreground text-sm mb-8">Last updated: August 2026</p>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-muted-foreground">
          <p>
            By using Fettl you agree to these terms. Fettl is provided as-is for
            splitting shared expenses among friends and groups. We reserve the right to
            update these terms at any time.
          </p>
          <p>
            You are responsible for the accuracy of the expenses and settlements you
            record. Fettl does not facilitate actual money transfers.
          </p>
          <p>
            For questions, contact us at support@fettl.app.
          </p>
        </div>
      </div>
    </div>
  );
}
