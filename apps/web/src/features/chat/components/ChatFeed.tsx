import { useMemo, useRef, useEffect, useState } from "react";
import { toast } from "sonner";
import { MessageCircle, ImageIcon, Loader2, Plus, Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { useExpensePages } from "@/features/groups/hooks/useGroups";
import type {
  GroupDetailsData,
  GroupExpense,
} from "@/features/groups/hooks/useGroups";
import { ExpenseMessageBubble } from "@/features/chat/components/ExpenseMessageBubble";
import { ChatImageBubble } from "@/features/chat/components/ChatImageBubble";
import type { ChatMessage } from "@/features/chat/hooks/useChat";
import { Button } from "@/shared/components/ui/button";
import { Bubble, BubbleContent } from "@/shared/components/ui/bubble";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
} from "@/shared/components/ui/message";
import { Attachment, AttachmentMedia } from "@/shared/components/ui/attachment";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

interface ChatFeedProps {
  group: GroupDetailsData;
  currentUser: { id: string } | undefined;
  messages: ChatMessage[];
  hasMore: boolean;
  loadMore: () => void;
  chatInput: string;
  setChatInput: (input: string) => void;
  sendMessage: (content: string, imageUrl?: string) => Promise<void>;
  isUploading: boolean;
  uploadPreview: string | null;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  setIsAddExpenseOpen: (isOpen: boolean) => void;
  setEditingExpense: (expense: GroupExpense) => void;
  setDeletingExpense: (expense: GroupExpense) => void;
}

type FeedItem =
  | { type: "chat"; data: ChatMessage; timestamp: number }
  | { type: "expense"; data: GroupExpense; timestamp: number };

export function ChatFeed({
  group,
  currentUser,
  messages,
  hasMore,
  loadMore,
  chatInput,
  setChatInput,
  sendMessage,
  isUploading,
  uploadPreview,
  handleImageUpload,
  fileInputRef,
  setIsAddExpenseOpen,
  setEditingExpense,
  setDeletingExpense,
}: ChatFeedProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [sending, setSending] = useState(false);
  const submit = async () => {
    if (sending || !chatInput.trim()) return;
    setSending(true);
    try {
      await sendMessage(chatInput.trim());
      setChatInput("");
    } catch {
      toast.error(
        "Message could not be confirmed. Check the conversation before retrying.",
      );
    } finally {
      setSending(false);
    }
  };
  const expenses = useExpensePages(group);
  const unifiedFeed = useMemo<FeedItem[]>(() => {
    const chatItems: FeedItem[] = messages.map((msg) => ({
      type: "chat" as const,
      data: msg,
      timestamp: new Date(msg.createdAt).getTime(),
    }));

    const expenseItems: FeedItem[] = (
      expenses.data?.pages.flatMap((page) => page.expenses) ?? group.expenses
    ).map((exp) => ({
      type: "expense" as const,
      data: exp,
      timestamp: new Date(exp.date).getTime(),
    }));

    return [...chatItems, ...expenseItems].sort(
      (a, b) => a.timestamp - b.timestamp,
    );
  }, [messages, group.expenses, expenses.data]);

  const lastItem = unifiedFeed.at(-1)?.data.id;
  useEffect(() => {
    // Only scroll to bottom on initial load or new messages,
    // not when older messages are loaded. For now, simple scroll is fine.
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lastItem]);

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6 space-y-4">
        {expenses.hasNextPage && (
          <div className="text-center">
            <Button
              size="sm"
              variant="outline"
              disabled={expenses.isFetchingNextPage}
              onClick={() => expenses.fetchNextPage()}
            >
              Load older expenses
            </Button>
          </div>
        )}
        {expenses.isError && (
          <p role="alert">
            Couldn’t load expenses.{" "}
            <button className="underline" onClick={() => expenses.refetch()}>
              Retry
            </button>
          </p>
        )}
        {hasMore && unifiedFeed.length > 0 && (
          <div className="flex justify-center pb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={loadMore}
              className="text-xs bg-white text-muted-foreground hover:text-foreground"
            >
              Load older messages
            </Button>
          </div>
        )}

        {unifiedFeed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="app-card p-5 rounded-full mb-4">
              <MessageCircle
                size={40}
                className="text-muted-foreground opacity-50"
              />
            </div>
            <h3 className="font-display font-bold text-lg mb-1">
              Start the conversation
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Send a message or add your first expense — everything shows up
              here in real-time.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {unifiedFeed.map((item) => {
              if (item.type === "expense") {
                return (
                  <ExpenseMessageBubble
                    key={`expense-${item.data.id}`}
                    expense={item.data}
                    isOwn={item.data.paidById === currentUser?.id}
                    onEdit={() => setEditingExpense(item.data)}
                    onDelete={() => setDeletingExpense(item.data)}
                    currentUserId={currentUser?.id}
                    members={group.members}
                  />
                );
              }

              const msg = item.data;
              const isOwn = msg.user.id === currentUser?.id;
              const timeString = new Date(msg.createdAt).toLocaleTimeString(
                [],
                { hour: "2-digit", minute: "2-digit" },
              );

              return (
                <Message
                  key={`chat-${msg.id}`}
                  align={isOwn ? "end" : "start"}
                  className="mb-2"
                >
                  {!isOwn && (
                    <MessageAvatar>
                      <Avatar>
                        <img
                          src={msg.user.avatarUrl || undefined}
                          alt={msg.user.name}
                        />
                        <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                          {msg.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </MessageAvatar>
                  )}
                  <MessageContent>
                    {!isOwn && (
                      <span className="text-[10px] font-bold text-primary mb-1 ml-1">
                        {msg.user.name}
                      </span>
                    )}

                    {msg.imageUrl && (
                      <Attachment className="mb-1" orientation="horizontal">
                        <AttachmentMedia
                          variant="image"
                          className="w-full max-w-[240px] h-auto aspect-auto rounded-xl"
                        >
                          <ChatImageBubble
                            src={msg.imageUrl}
                            senderName={msg.user.name}
                          />
                        </AttachmentMedia>
                      </Attachment>
                    )}

                    {msg.content && msg.content.trim() && (
                      <Bubble variant={isOwn ? "default" : "muted"}>
                        <BubbleContent>{msg.content}</BubbleContent>
                      </Bubble>
                    )}

                    <MessageFooter>{timeString}</MessageFooter>
                  </MessageContent>
                </Message>
              );
            })}
          </div>
        )}

        {uploadPreview && (
          <Message align="end" className="mb-2">
            <MessageContent>
              <Attachment className="mb-1" state="uploading">
                <AttachmentMedia
                  variant="image"
                  className="w-full max-w-[240px] h-auto aspect-auto rounded-xl"
                >
                  <div className="relative">
                    <img
                      src={uploadPreview}
                      alt="Uploading..."
                      className="max-w-full h-auto object-cover opacity-60"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span className="text-xs text-white font-medium drop-shadow-md">
                          Uploading...
                        </span>
                      </div>
                    </div>
                  </div>
                </AttachmentMedia>
              </Attachment>
            </MessageContent>
          </Message>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-bar">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              aria-label="Add expense"
              onClick={() => setIsAddExpenseOpen(true)}
              className="text-primary hover:text-primary/80 p-2 rounded-full hover:bg-soft-clay transition-colors shrink-0"
            >
              <Plus size={22} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">Add expense manually</TooltipContent>
        </Tooltip>
        <input
          type="text"
          placeholder="Type a message..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          aria-label="Message"
          maxLength={2000}
          disabled={sending}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) void submit();
          }}
          className="chat-input-field"
        />
        <div className="flex items-center gap-2 pr-1 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                aria-label="Attach image"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-primary bg-primary/10 hover:bg-primary/20 p-2 rounded-full transition-colors flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <ImageIcon size={20} />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Send image</TooltipContent>
          </Tooltip>
          <button
            aria-label="Send message"
            onClick={submit}
            disabled={sending || !chatInput.trim()}
            className="chat-send-btn disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
