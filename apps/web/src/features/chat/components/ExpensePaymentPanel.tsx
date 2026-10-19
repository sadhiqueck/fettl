import { useState } from "react";
import { Check, Clock } from "lucide-react";
import type { SettlementStatus } from "@fettl/shared";
import { Button } from "@/shared/components/ui/button";
import { formatCurrency } from "@/shared/lib/format";
import { MarkAsPaidDialog } from "@/features/groups/components/MarkAsPaidDialog";
import { UpiPayButton } from "@/features/groups/components/UpiPayButton";
import {
  useExpensePayments,
  useReviewPayment,
  type GroupExpense,
} from "@/features/groups/hooks/useGroups";

interface ExpensePaymentPanelProps {
  groupId: string;
  groupName: string;
  expense: GroupExpense;
  currentUserId: string;
  shareAmount: number;
}

const statuses: Record<SettlementStatus, string> = {
  PENDING: "Awaiting confirmation",
  CONFIRMED: "Confirmed",
  REJECTED: "Declined",
};

export function ExpensePaymentPanel({
  groupId,
  groupName,
  expense,
  currentUserId,
  shareAmount,
}: ExpensePaymentPanelProps) {
  const query = useExpensePayments(groupId, expense.id);
  const review = useReviewPayment(groupId);
  const [report, setReport] = useState<{ amount: number; id: string } | null>(null);
  const receivesPayments = expense.paidById === currentUserId;

  if (query.isPending) {
    return <p role="status" className="text-sm text-muted-foreground">Checking payment status…</p>;
  }

  if (!query.data) {
    return (
      <div className="flex flex-wrap items-center gap-x-2 border-y border-border py-2">
        <p role="alert" className="text-sm">Couldn’t load payment details.</p>
        <Button variant="outline" className="h-11" onClick={() => void query.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const { payments, availableAmount, receiverVpa } = query.data;
  if (receivesPayments) {
    if (!payments.length) return null;

    return (
      <section className="border-y border-border py-4">
        <h3 className="mb-1 text-sm font-semibold">Payments for this expense</h3>
        <ul className="divide-y divide-border">
          {payments.map((payment) => (
            <li key={payment.id} className="space-y-2 py-3 last:pb-0">
              <div className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium wrap-anywhere">{payment.name}</p>
                  <p className="text-xs text-muted-foreground">{statuses[payment.status]}</p>
                </div>
                <span className="font-semibold tabular-nums">
                  {formatCurrency(payment.amount / 100)}
                </span>
              </div>
              {payment.note && (
                <p className="text-sm text-muted-foreground wrap-anywhere">{payment.note}</p>
              )}
              {payment.status === "PENDING" && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="min-h-11"
                    disabled={review.isPending}
                    onClick={() => review.mutate({ id: payment.id, status: "CONFIRMED" })}
                  >
                    Confirm receipt
                  </Button>
                  <Button
                    size="sm"
                    className="min-h-11"
                    variant="outline"
                    disabled={review.isPending}
                    onClick={() => review.mutate({ id: payment.id, status: "REJECTED" })}
                  >
                    Decline
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const pending = payments.find((payment) => payment.status === "PENDING");
  const confirmed = payments.reduce(
    (total, payment) => payment.status === "CONFIRMED" ? total + payment.amount : total,
    0,
  );
  const isPaid = confirmed >= Math.round(shareAmount * 100);
  const amount = availableAmount / 100;
  const limitedByBalance = availableAmount < Math.round(shareAmount * 100) - confirmed;

  return (
    <section className="space-y-2.5 border-y border-border py-4">
      <h3 className="text-sm font-semibold">Your payment</h3>
      {confirmed > 0 && (
        <p className="flex items-center gap-2 text-sm" role="status">
          <Check size={16} aria-hidden="true" />
          {formatCurrency(confirmed / 100)} confirmed
        </p>
      )}
      {pending ? (
        <p className="flex items-start gap-2 text-sm text-muted-foreground" role="status">
          <Clock size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
          {formatCurrency(pending.amount / 100)} awaiting confirmation from {expense.paidBy}.
        </p>
      ) : !isPaid && (
        <>
          {payments[0]?.status === "REJECTED" && (
            <p className="text-sm text-muted-foreground">Your last payment report was declined.</p>
          )}
          {availableAmount > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                {limitedByBalance ? (
                  <>You can pay {formatCurrency(amount)} to {expense.paidBy} based on your group balance.</>
                ) : (
                  <>Pay {formatCurrency(amount)} to {expense.paidBy}.</>
                )}
              </p>
              {!receiverVpa && (
                <p className="text-sm text-muted-foreground">{expense.paidBy} hasn’t added a UPI ID.</p>
              )}
              <div className="flex flex-wrap gap-2">
                {receiverVpa && (
                  <UpiPayButton
                    key={`${receiverVpa}-${availableAmount}`}
                    receiverVpa={receiverVpa}
                    receiverName={expense.paidBy}
                    amount={amount}
                    groupName={groupName}
                    buttonText={`Pay ${formatCurrency(amount)}`}
                    disabled={query.isFetching || query.isError}
                  />
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="min-h-11"
                  disabled={query.isFetching || query.isError}
                  onClick={() => setReport({ amount, id: crypto.randomUUID() })}
                >
                  Report payment
                </Button>
              </div>
              {query.isError && (
                <div className="flex flex-wrap items-center gap-x-2">
                  <p role="alert" className="text-sm">Couldn’t refresh the payment amount.</p>
                  <Button variant="outline" className="h-11" onClick={() => void query.refetch()}>
                    Retry
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Your current group balance has no payment available to {expense.paidBy}.
            </p>
          )}
        </>
      )}
      {report && (
        <MarkAsPaidDialog
          isOpen
          onClose={() => setReport(null)}
          groupId={groupId}
          fromId={currentUserId}
          fromName="You"
          toId={expense.paidById}
          toName={expense.paidBy}
          amount={report.amount}
          expense={{ id: expense.id, title: expense.title, reportId: report.id }}
        />
      )}
    </section>
  );
}
