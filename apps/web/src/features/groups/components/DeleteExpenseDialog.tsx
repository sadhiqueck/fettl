import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { useDeleteExpense } from "@/features/groups/hooks/useExpenseActions";
import { formatCurrency } from "@/shared/lib/format";

interface DeleteExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  expenseId: string;
  expenseTitle: string;
  expenseAmount: number;
}

export function DeleteExpenseDialog({
  isOpen,
  onClose,
  groupId,
  expenseId,
  expenseTitle,
  expenseAmount,
}: DeleteExpenseDialogProps) {
  const { mutate: deleteExpense, isPending } = useDeleteExpense(groupId);

  const handleDelete = () => {
    deleteExpense(expenseId, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete expense</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this expense?
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="truncate text-sm font-medium text-foreground">
            {expenseTitle}
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
            {formatCurrency(expenseAmount)}
          </p>
        </div>

        <div className="flex gap-2 text-sm text-destructive">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" />
          <p>
            This will reverse all balance calculations for this expense. This
            action cannot be undone.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending && <Loader2 className="animate-spin" size={16} />}
            {isPending ? "Deleting…" : "Delete expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
