import { useUserProfile } from "@/shared/hooks/useUser";
import { useReviewPayment } from "@/features/groups/hooks/useGroups";
import { Button } from "@/shared/components/ui/button";
import { Wallet } from "lucide-react";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { ArrowRightIcon, WalletIcon } from "@/shared/components/ui/icons";
import { formatCurrency } from "@/shared/lib/format";
import type {
  GroupDetailsData,
  GroupSettlement,
} from "@/features/groups/hooks/useGroups";
import { UpiPayButton } from "@/features/groups/components/UpiPayButton";

interface ChatBalancesProps {
  group: GroupDetailsData;
  onSettlePayment: (settle: GroupSettlement) => void;
}

export function ChatBalances({ group, onSettlePayment }: ChatBalancesProps) {
  const { data: user } = useUserProfile();
  const review = useReviewPayment(group.id);
  const memberName = (id: string) =>
    group.members.find((member) => member.id === id)?.name ?? "Group member";
  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="chat-info-card">
        <h3 className="font-display font-bold text-sm mb-4 flex items-center gap-2">
          <WalletIcon size={20} /> Group balances
        </h3>
        <div className="space-y-3">
          {group.balances.map((member) => (
            <div
              key={member.memberId}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Avatar className="size-7">
                  <AvatarFallback className="text-[10px] font-bold bg-primary text-primary-foreground">
                    {member.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold">{member.name}</span>
              </div>
              {member.balance > 0 ? (
                <span className="app-stat-green text-sm font-bold">
                  +{formatCurrency(member.balance)}
                </span>
              ) : member.balance < 0 ? (
                <span className="app-stat-red text-sm font-bold">
                  −{formatCurrency(Math.abs(member.balance))}
                </span>
              ) : (
                <span className="text-muted-foreground text-sm">settled</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {group.pendingPayments.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-semibold">Awaiting confirmation</h3>
          {group.pendingPayments.map((p) => (
            <div key={p.id} className="app-card space-y-2 p-4">
              <p className="text-sm">
                {memberName(p.payerId)} reported paying{" "}
                <strong>{formatCurrency(p.amount)}</strong> to{" "}
                {memberName(p.receiverId)}.
              </p>
              {p.note && (
                <p className="text-sm text-muted-foreground">{p.note}</p>
              )}
              {user?.id === p.receiverId && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={review.isPending}
                    size="sm"
                    onClick={() =>
                      review.mutate({ id: p.id, status: "CONFIRMED" })
                    }
                  >
                    Confirm receipt
                  </Button>
                  <Button
                    disabled={review.isPending}
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      review.mutate({ id: p.id, status: "REJECTED" })
                    }
                  >
                    Decline
                  </Button>
                </div>
              )}
            </div>
          ))}
        </section>
      )}
      {group.settlements.length > 0 && (
        <div>
          <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2 px-1">
            <Wallet size={16} className="text-primary" /> Suggested payments
          </h3>
          <div className="space-y-2">
            {group.settlements.map((settle, i) => (
              <div
                key={i}
                className="chat-info-card flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <span className="font-bold bg-soft-clay px-2.5 py-1 rounded-full">
                    {settle.from}
                  </span>
                  <ArrowRightIcon size={14} className="text-muted-foreground" />
                  <span className="font-bold bg-soft-clay px-2.5 py-1 rounded-full">
                    {settle.to}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">
                    {formatCurrency(settle.amount)}
                  </span>
                  {user?.id === settle.fromId &&
                    !group.pendingPayments.some(
                      (p) =>
                        p.payerId === settle.fromId &&
                        p.receiverId === settle.toId,
                    ) && (
                      <>
                        <button
                          onClick={() => onSettlePayment(settle)}
                          className="clay-btn-secondary text-[10px] px-3 py-1.5"
                        >
                          Mark paid
                        </button>
                        <UpiPayButton
                          receiverVpa={settle.toVpa}
                          receiverName={settle.to}
                          amount={settle.amount}
                          groupName={group.name}
                        />
                      </>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
