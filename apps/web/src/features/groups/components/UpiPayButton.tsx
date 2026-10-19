import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { Button } from "@/shared/components/ui/button";
import { AlertCircle, ExternalLink, Copy, Check, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface UpiPayButtonProps {
  receiverVpa: string | null;
  receiverName: string;
  amount: number;
  groupName: string;
  buttonText?: string;
  disabled?: boolean;
}

function generateUpiUrl(
  vpa: string,
  name: string,
  amount: number,
  groupName: string,
): string {
  const params = new URLSearchParams({
    pa: vpa,
    pn: name,
    am: amount.toFixed(2),
    cu: "INR",
    tn: `Fettl: ${groupName}`,
  });
  return `upi://pay?${params.toString()}`;
}

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent,
  );
}

function handleDownloadQr() {
  const svgEl = document.getElementById("upi-qr-code");
  if (!svgEl) return;

  const svgData = new XMLSerializer().serializeToString(svgEl);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();

  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx?.drawImage(img, 0, 0);
    const pngUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "upi-qr-code.png";
    link.href = pngUrl;
    link.click();
  };

  img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
}

export function UpiPayButton({
  receiverVpa,
  receiverName,
  amount,
  groupName,
  buttonText,
  disabled,
}: UpiPayButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const isMobile = isMobileDevice();

  if (!receiverVpa) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className="inline-block">
            <Button disabled variant="outline" size="sm">
              No UPI ID
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">Recipient hasn't set up their UPI ID yet</TooltipContent>
      </Tooltip>
    );
  }

  const upiUrl = generateUpiUrl(receiverVpa, receiverName, amount, groupName);

  const handleConfirmPay = () => {
    window.location.href = upiUrl;
    setShowConfirm(false);
  };

  const handleCopyVpa = async () => {
    try {
      await navigator.clipboard.writeText(receiverVpa);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = receiverVpa;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
      <DialogTrigger asChild>
        <Button size="sm" className={buttonText ? "min-h-11" : undefined} disabled={disabled}>
          <ExternalLink size={14} aria-hidden="true" />
          {buttonText ?? "Pay via UPI"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Pay {receiverName}</DialogTitle>
          <DialogDescription>
            Scan the QR code or open your UPI app.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3">
          <div className="rounded-lg border border-border bg-white p-4">
            <QRCodeSVG
              id="upi-qr-code"
              value={upiUrl}
              size={180}
              level="M"
              includeMargin={false}
              bgColor="transparent"
              fgColor="#1a1a1a"
            />
          </div>
          <button
            onClick={handleDownloadQr}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Download size={12} />
            Save QR Code
          </button>
        </div>

        <div className="space-y-1 rounded-lg border border-border bg-muted/50 p-4 text-center">
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            ₹{amount.toLocaleString("en-IN")}
          </p>
          <div className="flex items-center justify-center gap-2">
            <p className="text-sm text-muted-foreground">
              to{" "}
              <span className="font-medium text-foreground">
                {receiverVpa}
              </span>
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleCopyVpa}
                  className="rounded p-1 text-foreground hover:bg-muted"
                  aria-label="Copy UPI ID"
                >
                  {copied ? (
                    <Check size={14} className="text-green-500" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Copy UPI ID</TooltipContent>
            </Tooltip>
          </div>
          <p className="text-xs text-muted-foreground">
            Fettl: {groupName}
          </p>
        </div>

        <div className="flex gap-2 text-xs text-muted-foreground">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>
            Please verify the recipient's name matches your friend's name on
            your UPI app before entering your PIN.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setShowConfirm(false)}>
            Cancel
          </Button>
          {isMobile ? (
            <Button onClick={handleConfirmPay}>
            <ExternalLink size={14} />
            Open UPI app
            </Button>
          ) : (
            <Button onClick={handleCopyVpa}>
              {copied ? (
                <>
                  <Check size={14} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={14} />
                  Copy UPI ID
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
