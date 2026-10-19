import { Pencil, Receipt, Trash2, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { formatCurrency } from "@/shared/lib/format";
import type { GroupExpense } from "@/features/groups/hooks/useGroups";

interface ExpenseDetailsModalProps {
  expense: GroupExpense;
  currentUserId?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

const expenseDate = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

export function ExpenseDetailsModal({
  expense,
  currentUserId,
  onEdit,
  onDelete,
}: ExpenseDetailsModalProps) {
  const isPayer = expense.paidById === currentUserId;
  const share = expense.splits.find((split) => split.userId === currentUserId);

  return (
    <DialogContent
      showCloseButton={false}
      className="inset-x-0 top-auto bottom-0 flex max-h-[90dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-t-2xl rounded-b-none p-0 motion-reduce:animate-none sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[min(85dvh,44rem)] sm:w-[min(30rem,92vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
    >
      <DialogDescription className="sr-only">
        Expense total, payer and individual shares.
      </DialogDescription>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <div className="border-b border-border bg-muted/60 px-5 pt-5 pb-4 sm:px-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="expense-category-icon size-10">
              <Receipt size={20} aria-hidden="true" />
            </span>
            <DialogClose asChild>
              <Button variant="ghost" size="icon-lg" aria-label="Close expense details">
                <X aria-hidden="true" />
              </Button>
            </DialogClose>
          </div>
          <DialogTitle className="text-xl leading-tight font-semibold tracking-tight wrap-anywhere">
            {expense.title}
          </DialogTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            <time dateTime={expense.date}>{expenseDate.format(new Date(expense.date))}</time>
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-4">
            <div className="min-w-0">
              <dt className="text-xs font-medium text-muted-foreground">Total paid</dt>
              <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums wrap-anywhere">
                {formatCurrency(expense.amount)}
              </dd>
            </div>
            <div className="min-w-0 border-l border-border pl-4">
              <dt className="text-xs font-medium text-muted-foreground">Your share</dt>
              <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums wrap-anywhere">
                {share ? formatCurrency(share.amount) : "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="space-y-5 px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6">
          <div className="flex items-center gap-2.5">
            <Avatar className="size-8 shrink-0" aria-hidden="true">
              {expense.paidByAvatar && (
                <AvatarImage src={expense.paidByAvatar} alt="" referrerPolicy="no-referrer" />
              )}
              <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                {expense.paidBy.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm wrap-anywhere">
              {isPayer ? (
                <strong className="font-semibold">You paid</strong>
              ) : (
                <>Paid by <strong className="font-semibold">{expense.paidBy}</strong></>
              )}
            </p>
          </div>

          <section>
            <h3 className="mb-1 text-sm font-semibold">Split breakdown</h3>
            {expense.splits.length > 0 ? (
              <ul className="divide-y divide-border">
                {expense.splits.map((split) => (
                  <li key={split.userId} className="flex items-center gap-2.5 py-2.5 text-sm">
                    <Avatar className="size-8 shrink-0" aria-hidden="true">
                      <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                        {split.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 font-medium wrap-anywhere">
                      {split.userId === currentUserId ? "You" : split.name}
                    </span>
                    <span className="max-w-[48%] text-right font-semibold tabular-nums wrap-anywhere">
                      {formatCurrency(split.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-2 text-muted-foreground">No shares recorded.</p>
            )}
          </section>

          {expense.notes && (
            <section className="border-t border-border pt-4">
              <h3 className="mb-1 text-sm font-semibold">Notes</h3>
              <p className="whitespace-pre-wrap text-muted-foreground wrap-anywhere">
                {expense.notes}
              </p>
            </section>
          )}
          {expense.receiptUrl && (
            <section className="border-t border-border pt-4">
              <h3 className="mb-2 text-sm font-semibold">Receipt</h3>
              <a
                href={expense.receiptUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Open receipt in a new tab"
                className="block w-fit max-w-full rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <img
                  alt="Expense receipt"
                  className="max-h-72 max-w-full rounded-lg border border-border object-contain"
                  src={expense.receiptUrl}
                />
              </a>
            </section>
          )}
        </div>
      </div>

      {(onEdit || onDelete) && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
          {onEdit && (
            <DialogClose asChild>
              <Button variant="outline" onClick={onEdit} className="h-11">
                <Pencil aria-hidden="true" /> Edit expense
              </Button>
            </DialogClose>
          )}
          {onDelete && (
            <DialogClose asChild>
              <Button variant="ghost" onClick={onDelete} className="h-11 text-destructive hover:text-destructive">
                <Trash2 aria-hidden="true" /> Delete
              </Button>
            </DialogClose>
          )}
        </div>
      )}
    </DialogContent>
  );
}
