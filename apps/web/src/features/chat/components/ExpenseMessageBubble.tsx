import React from "react";
import {
  ArrowUpRight,
  BedDouble,
  CarFront,
  Clapperboard,
  House,
  Receipt,
  ShoppingBag,
  Utensils,
  Zap,
} from "lucide-react";
import { Dialog, DialogTrigger } from "@/shared/components/ui/dialog";
import type { GroupExpense } from "@/features/groups/hooks/useGroups";
import { formatCurrency, formatMessageTime } from "@/shared/lib/format";
import { ExpenseDetailsModal } from "./ExpenseDetailsModal";

const categories = {
  FOOD: { label: "Food", Icon: Utensils },
  TRANSPORT: { label: "Transport", Icon: CarFront },
  ACCOMMODATION: { label: "Accommodation", Icon: BedDouble },
  SHOPPING: { label: "Shopping", Icon: ShoppingBag },
  ENTERTAINMENT: { label: "Entertainment", Icon: Clapperboard },
  UTILITIES: { label: "Utilities", Icon: Zap },
  RENT: { label: "Rent", Icon: House },
  OTHER: { label: "Other", Icon: Receipt },
} as const;

interface ExpenseMessageBubbleProps {
  expense: GroupExpense;
  groupId: string;
  groupName: string;
  currentUserId?: string;
  onEdit: (expense: GroupExpense) => void;
  onDelete: (expense: GroupExpense) => void;
}

export const ExpenseMessageBubble = React.memo(function ExpenseMessageBubble({
  expense,
  groupId,
  groupName,
  currentUserId,
  onEdit,
  onDelete,
}: ExpenseMessageBubbleProps) {
  const { label, Icon } =
    categories[expense.category as keyof typeof categories] ?? categories.OTHER;
  const isPayer = expense.paidById === currentUserId;
  const share = expense.splits.find((split) => split.userId === currentUserId);
  const splitCount = expense.splits.length;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group/expense w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card text-left transition-colors hover:border-ring/50 active:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span className="flex items-start gap-3 p-3.5 sm:p-4">
            <span className="expense-category-icon size-10">
              <Icon size={19} aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                {label}
              </span>
              <span className="text-[15px] leading-5 font-semibold wrap-anywhere">
                {expense.title}
              </span>
              <span className="text-xs leading-5 text-muted-foreground wrap-anywhere">
                {isPayer ? "You paid" : `Paid by ${expense.paidBy}`} ·{" "}
                <time dateTime={expense.date}>{formatMessageTime(expense.date)}</time>
              </span>
            </span>
            <span className="min-w-0 max-w-[45%] shrink-0 text-right">
              <span className="block text-base leading-5 font-semibold tracking-tight tabular-nums wrap-anywhere sm:text-lg">
                {formatCurrency(expense.amount)}
              </span>
              <span className="text-xs text-muted-foreground">Total</span>
            </span>
          </span>
          <span className="flex min-h-12 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-border bg-muted/55 px-3.5 py-2.5 transition-colors group-hover/expense:bg-muted sm:px-4">
            <span className="flex min-w-0 flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
              {share ? (
                <>
                  <span>Your share</span>
                  <strong className="font-semibold text-foreground tabular-nums wrap-anywhere">
                    {formatCurrency(share.amount)}
                  </strong>
                </>
              ) : currentUserId ? (
                <span>You weren’t part of this split</span>
              ) : (
                <span>Split with {splitCount} {splitCount === 1 ? "person" : "people"}</span>
              )}
              {expense.receiptUrl && (
                <span className="inline-flex items-center gap-1">
                  <Receipt size={13} aria-hidden="true" /> Receipt
                </span>
              )}
            </span>
            <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-foreground">
              View split <ArrowUpRight size={15} aria-hidden="true" />
            </span>
          </span>
        </button>
      </DialogTrigger>
      <ExpenseDetailsModal
        expense={expense}
        groupId={groupId}
        groupName={groupName}
        currentUserId={currentUserId}
        onEdit={isPayer ? () => onEdit(expense) : undefined}
        onDelete={isPayer ? () => onDelete(expense) : undefined}
      />
    </Dialog>
  );
});

interface ActivityBubbleProps {
  user: string;
  action: string;
  target?: string;
  timestamp: string;
}

export const ActivityBubble = React.memo(function ActivityBubble({
  user,
  action,
  target,
  timestamp,
}: ActivityBubbleProps) {
  return (
    <div className="chat-bubble-system">
      <span className="font-semibold text-foreground">{user}</span> {action}{" "}
      {target && (
        <span className="font-semibold text-foreground">{target}</span>
      )}
      <span className="block mt-0.5 opacity-60">{timestamp}</span>
    </div>
  );
});
