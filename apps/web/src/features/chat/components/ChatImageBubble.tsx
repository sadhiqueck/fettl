import { memo, useCallback, useState } from "react";
import { Download, ImageOff, Loader2, X, ZoomIn } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";

interface ChatImageBubbleProps {
  src: string;
  senderName: string;
}

type ImageLoadState = "loading" | "loaded" | "error";

export const ChatImageBubble = memo(function ChatImageBubble({
  src,
  senderName,
}: ChatImageBubbleProps) {
  const [loadState, setLoadState] = useState<ImageLoadState>("loading");

  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error("Image download failed.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fettl-${Date.now()}.${blob.type.split("/")[1] || "jpg"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(src, "_blank", "noopener,noreferrer");
    }
  }, [src]);

  if (loadState === "error") {
    return (
      <p className="flex min-h-20 items-center gap-2 rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground">
        <ImageOff size={16} aria-hidden="true" /> Image unavailable
      </p>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Open image from ${senderName}`}
          disabled={loadState !== "loaded"}
          className="group/image relative block min-h-11 max-w-full overflow-hidden rounded-xl border border-border bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <img
            src={src}
            alt=""
            className="block max-h-72 min-h-11 max-w-full object-contain"
            loading="lazy"
            onLoad={() => setLoadState("loaded")}
            onError={() => setLoadState("error")}
          />
          {loadState === "loading" ? (
            <span className="absolute inset-0 flex items-center justify-center bg-muted" aria-hidden="true">
              <Loader2 size={18} className="motion-safe:animate-spin" />
            </span>
          ) : (
            <span className="absolute right-2 bottom-2 rounded-lg bg-black/65 p-2 text-white opacity-0 transition-opacity group-hover/image:opacity-100 group-focus-visible/image:opacity-100" aria-hidden="true">
              <ZoomIn size={16} />
            </span>
          )}
        </button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="max-h-[90dvh] w-[min(92vw,60rem)] max-w-none gap-0 overflow-hidden border-0 bg-neutral-950 p-0 text-white motion-reduce:animate-none"
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/15 px-4 py-2">
          <DialogTitle className="truncate text-sm font-medium">Image from {senderName}</DialogTitle>
          <DialogDescription className="sr-only">Full-size chat attachment.</DialogDescription>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              onClick={() => void handleDownload()}
              aria-label="Download image"
              className="text-white hover:bg-white/15"
            >
              <Download aria-hidden="true" />
            </Button>
            <DialogClose asChild>
              <Button variant="ghost" size="icon-lg" aria-label="Close image" className="text-white hover:bg-white/15">
                <X aria-hidden="true" />
              </Button>
            </DialogClose>
          </div>
        </div>
        <img
          src={src}
          alt={`Attachment from ${senderName}`}
          className="mx-auto max-h-[calc(90dvh-3.875rem)] max-w-full object-contain"
        />
      </DialogContent>
    </Dialog>
  );
});
