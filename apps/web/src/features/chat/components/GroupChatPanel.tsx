import { GroupInfoSidebar } from "@/shared/components/layout/GroupInfoSidebar";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  MoreVertical,
  LogOut,
  Activity,
  Receipt,
  UsersRound,
  UserPlus,
  Wallet,
  ArrowLeft,
  MessageCircle,
} from "lucide-react";
import { DropdownMenu, Tabs } from "radix-ui";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import type {
  GroupDetailsData,
  GroupExpense,
  GroupSettlement,
} from "@/features/groups/hooks/useGroups";
import { useLeaveGroup } from "@/features/groups/hooks/useGroups";
import { useUserProfile } from "@/shared/hooks/useUser";
import { InviteMemberModal } from "@/features/groups/components/InviteMemberModal";
import { AddExpenseModal } from "@/features/groups/components/AddExpenseModal";

import { DeleteExpenseDialog } from "@/features/groups/components/DeleteExpenseDialog";
import { MarkAsPaidDialog } from "@/features/groups/components/MarkAsPaidDialog";
import { useUpload } from "@/shared/hooks/useUpload";
import { ChatFeed } from "./ChatFeed";
import { ChatBalances } from "./ChatBalances";
import { ChatActivity } from "./ChatActivity";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useChat } from "@/features/chat/hooks/useChat";

const views = [
  { id: "conversation", label: "Conversation", icon: MessageCircle },
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "balances", label: "Balances", icon: Wallet },
  { id: "activity", label: "Activity", icon: Activity },
] as const;

interface GroupChatPanelProps {
  group: GroupDetailsData;
}

export function GroupChatPanel({ group }: GroupChatPanelProps) {
  const navigate = useNavigate();
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<GroupExpense | null>(
    null,
  );
  const [deletingExpense, setDeletingExpense] = useState<GroupExpense | null>(
    null,
  );
  const [settlingPayment, setSettlingPayment] =
    useState<GroupSettlement | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { data: currentUser } = useUserProfile();
  const leaveGroupMutation = useLeaveGroup();

  // File Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading } = useUpload(group.id);

  // Real-time chat integration
  const { messages, hasMore, loadMore, sendMessage, isConnected } = useChat(group.id);

  // Optimistic preview: show a local preview immediately while uploading
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a local preview URL immediately
    const localPreview = URL.createObjectURL(file);
    setUploadPreview(localPreview);

    try {
      const fileUrl = await uploadFile(file);
      await sendMessage("", fileUrl);
      toast.success("Image sent");
    } catch {
      toast.error("The image could not be sent. Please try again.");
    } finally {
      setUploadPreview(null);
      URL.revokeObjectURL(localPreview);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async () => {
    const message = chatInput.trim();
    if (!message || isSending || !isConnected) return false;

    setIsSending(true);
    try {
      await sendMessage(message);
      setChatInput("");
      return true;
    } catch {
      toast.error("Message could not be confirmed. Check the conversation before retrying.");
      return false;
    } finally {
      setIsSending(false);
    }
  };

  const handleLeaveGroup = () => {
    if (
      window.confirm(
        "Leave this group? Make sure your balance is settled first.",
      )
    ) {
      leaveGroupMutation.mutate(group.id, {
        onSuccess: () => navigate("/dashboard"),
        onError: (error: Error) => {
          const err = error as AxiosError<{ message: string }>;
          toast.error(err.response?.data?.message || "Failed to leave group");
        },
      });
    }
  };

  return (
    <div className="flex min-h-0 flex-1">
      <div className="chat-main-panel">
        <header className="chat-header">
          <div className="thread-rail flex min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="icon-lg"
                onClick={() => navigate("/dashboard")}
                aria-label="Back to overview"
              >
                <ArrowLeft className="size-5" aria-hidden="true" />
              </Button>
              <span className="hidden size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground sm:inline-flex">
                <UsersRound size={19} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-base leading-tight font-semibold tracking-tight sm:text-lg" title={group.name}>
                  {group.name}
                </h1>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
                  <span className="hidden sm:inline"> · {group.category}</span>
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <Button className="h-11 gap-1.5 px-2.5 sm:px-3.5" onClick={() => setIsAddExpenseOpen(true)}>
                <Plus aria-hidden="true" /> Add expense
              </Button>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <Button variant="ghost" size="icon-lg" aria-label="Group options" className="text-muted-foreground">
                    <MoreVertical className="size-5" aria-hidden="true" />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={6}
                    className="z-40 min-w-44 rounded-xl border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md"
                  >
                    <DropdownMenu.Item
                      onSelect={() => setIsInviteModalOpen(true)}
                      className="flex min-h-11 cursor-default items-center gap-2 rounded-lg px-3 outline-none data-highlighted:bg-muted"
                    >
                      <UserPlus size={16} aria-hidden="true" /> Invite members
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onSelect={handleLeaveGroup}
                      className="flex min-h-11 cursor-default items-center gap-2 rounded-lg px-3 text-destructive outline-none data-highlighted:bg-muted"
                    >
                      <LogOut size={16} aria-hidden="true" /> Leave group
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>
        </header>

        <Tabs.Root defaultValue="conversation" activationMode="manual" className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-border bg-card">
            <Tabs.List className="thread-rail flex" aria-label="Group views">
              {views.map(({ id, label, icon: Icon }) => (
                <Tabs.Trigger
                  key={id}
                  value={id}
                  className="thread-tab"
                >
                  <Icon size={16} aria-hidden="true" className="hidden sm:block" />
                  {label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </div>

          {(["conversation", "expenses"] as const).map((view) => (
            <Tabs.Content key={view} value={view} tabIndex={-1} className="thread-panel flex flex-col">
              <ChatFeed
                group={group}
                currentUserId={currentUser?.id}
                expensesOnly={view === "expenses"}
                messages={messages}
                hasMore={hasMore}
                loadMore={loadMore}
                isConnected={isConnected}
                chatInput={chatInput}
                setChatInput={setChatInput}
                sendMessage={handleSendMessage}
                isSending={isSending}
                isUploading={isUploading || !!uploadPreview}
                uploadPreview={uploadPreview}
                handleImageUpload={handleImageUpload}
                fileInputRef={fileInputRef}
                onAddExpense={() => setIsAddExpenseOpen(true)}
                onEditExpense={setEditingExpense}
                onDeleteExpense={setDeletingExpense}
              />
            </Tabs.Content>
          ))}

          <Tabs.Content value="balances" className="thread-panel overflow-y-auto">
            <div className="thread-rail py-5 sm:py-6">
              <ChatBalances group={group} onSettlePayment={setSettlingPayment} />
            </div>
          </Tabs.Content>

          <Tabs.Content value="activity" className="thread-panel overflow-y-auto">
            <div className="thread-rail py-5 sm:py-6">
              <ChatActivity group={group} />
            </div>
          </Tabs.Content>
        </Tabs.Root>

        {/* Modals */}
        <AddExpenseModal
          key={isAddExpenseOpen ? "open" : "closed"}
          isOpen={isAddExpenseOpen}
          onClose={() => setIsAddExpenseOpen(false)}
          groupId={group.id}
          groupName={group.name}
          members={group.members}
        />
        <InviteMemberModal
          isOpen={isInviteModalOpen}
          onOpenChange={setIsInviteModalOpen}
          groupId={group.id}
          groupName={group.name}
          inviteCode={group.inviteCode}
        />
        {editingExpense && (
          <AddExpenseModal
            groupName={group.name}
            members={group.members}
            isOpen
            onClose={() => setEditingExpense(null)}
            groupId={group.id}
            expense={editingExpense}
          />
        )}
        {deletingExpense && (
          <DeleteExpenseDialog
            isOpen
            onClose={() => setDeletingExpense(null)}
            groupId={group.id}
            expenseId={deletingExpense.id}
            expenseTitle={deletingExpense.title}
            expenseAmount={deletingExpense.amount}
          />
        )}
        {settlingPayment && (
          <MarkAsPaidDialog
            isOpen
            onClose={() => setSettlingPayment(null)}
            groupId={group.id}
            fromName={settlingPayment.from}
            fromId={settlingPayment.fromId}
            toName={settlingPayment.to}
            toId={settlingPayment.toId}
            amount={settlingPayment.amount}
          />
        )}
      </div>
      <GroupInfoSidebar
        group={group}
        onInvite={() => setIsInviteModalOpen(true)}
      />
    </div>
  );
}

export function GroupChatLoading() {
  return (
    <div className="chat-main-panel" aria-busy="true" aria-label="Loading conversation">
      <header className="chat-header">
        <div className="thread-rail flex items-center gap-3">
          <Skeleton className="size-11 shrink-0 rounded-xl" />
          <div className="mr-auto space-y-2">
            <Skeleton className="h-5 w-24 sm:w-36" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-11 w-24 shrink-0 rounded-lg sm:w-32" />
          <Skeleton className="size-11 shrink-0 rounded-lg" />
        </div>
      </header>
      <div className="shrink-0 border-b border-border bg-card">
        <div className="thread-rail flex min-h-12 items-center gap-3">
          {[18, 12, 12, 10].map((width, index) => (
            <Skeleton key={index} className="h-3" style={{ width: `${width}%`, maxWidth: 84 }} />
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="thread-rail space-y-4 py-6">
          <Skeleton className="h-3 w-24 mx-auto" />
          <Skeleton className="h-14 w-2/3 max-w-80 rounded-2xl" />
          <Skeleton className="ml-auto h-14 w-1/2 max-w-64 rounded-2xl" />
          <Skeleton className="h-32 w-full max-w-lg rounded-2xl" />
        </div>
      </div>
      <div className="chat-input-bar">
        <div className="thread-rail">
          <Skeleton className="h-[54px] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
