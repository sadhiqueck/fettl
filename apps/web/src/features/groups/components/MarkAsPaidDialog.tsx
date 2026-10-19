import { formatCurrency } from "@/shared/lib/format";
import { useId, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Loader2 } from "lucide-react";
import { ArrowRightIcon } from "@/shared/components/ui/icons";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useMarkAsPaid } from "@/features/groups/hooks/useGroups";
import { toast } from "sonner";
import type { AxiosError } from "axios";

interface MarkAsPaidDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  fromName: string;
  fromId: string;
  toName: string;
  toId: string;
  amount: number; // In display currency (e.g. ₹500, not paise)
  expense?: { id: string; title: string; reportId: string };
}

export function MarkAsPaidDialog({
  isOpen,
  onClose,
  groupId,
  fromName,
  fromId,
  toName,
  toId,
  amount,
  expense,
}: MarkAsPaidDialogProps) {
  const noteId = useId();
  const [note, setNote] = useState("");
  const { mutate: markAsPaid, isPending, error } = useMarkAsPaid();

  const handleConfirm = () => {
    markAsPaid(
      {
        groupId,
        payerId: fromId,
        receiverId: toId,
        amount: Math.round(amount * 100), // Convert to paise
        note: note.trim() || undefined,
        expenseId: expense?.id,
        reportId: expense?.reportId,
      },
      {
        onSuccess: () => {
          toast.success("Payment sent for confirmation", {
            description: `${fromName} → ${toName}: ${formatCurrency(amount)}`,
          });
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Report a payment</DialogTitle>
          <DialogDescription>
            Report this after you’ve paid. The recipient will confirm it before balances change.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {formatCurrency(amount)}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{fromName}</span>
            <ArrowRightIcon size={16} />
            <span>{toName}</span>
          </div>
          {expense && <p className="text-sm wrap-anywhere">{expense.title}</p>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor={noteId}>Note (optional)</Label>
          <Input
            id={noteId}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Cash, Google Pay, bank transfer…"
            maxLength={200}
            disabled={isPending}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {(error as AxiosError<{ message: string }>).response?.data?.message ||
              "Couldn’t record the payment. Try again."}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending && <Loader2 className="animate-spin" size={16} />}
            {isPending ? "Recording…" : "Report payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
