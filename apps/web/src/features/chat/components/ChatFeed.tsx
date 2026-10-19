import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type RefObject,
} from "react";
import { isToday, isYesterday } from "date-fns";
import { ArrowDown, ArrowUp, ImageIcon, Loader2, MessageCircle, Plus, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { useExpensePages } from "@/features/groups/hooks/useGroups";
import type { GroupDetailsData, GroupExpense } from "@/features/groups/hooks/useGroups";
import type { ChatMessage } from "@/features/chat/hooks/useChat";
import { Button } from "@/shared/components/ui/button";
import { Bubble, BubbleContent } from "@/shared/components/ui/bubble";
import { Message, MessageContent, MessageFooter } from "@/shared/components/ui/message";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { formatMessageTime } from "@/shared/lib/format";
import { ChatImageBubble } from "./ChatImageBubble";
import { ExpenseMessageBubble } from "./ExpenseMessageBubble";

interface ChatFeedProps {
  group: GroupDetailsData;
  currentUserId?: string;
  expensesOnly: boolean;
  messages: ChatMessage[];
  hasMore: boolean;
  loadMore: () => Promise<void>;
  isConnected: boolean;
  chatInput: string;
  setChatInput: (input: string) => void;
  sendMessage: () => Promise<boolean>;
  isSending: boolean;
  isUploading: boolean;
  uploadPreview: string | null;
  handleImageUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onAddExpense: () => void;
  onEditExpense: (expense: GroupExpense) => void;
  onDeleteExpense: (expense: GroupExpense) => void;
}

type FeedItem =
  | { type: "chat"; data: ChatMessage; date: Date }
  | { type: "expense"; data: GroupExpense; date: Date };

const dateFormatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });
const groupMessageInterval = 5 * 60 * 1000;

function isSameMessageGroup(first: FeedItem | undefined, second: FeedItem) {
  return first?.type === "chat" &&
    second.type === "chat" &&
    first.data.user.id === second.data.user.id &&
    first.date.toDateString() === second.date.toDateString() &&
    Math.abs(first.date.getTime() - second.date.getTime()) < groupMessageInterval;
}

export function ChatFeed({
  group,
  currentUserId,
  expensesOnly,
  messages,
  hasMore,
  loadMore,
  isConnected,
  chatInput,
  setChatInput,
  sendMessage,
  isSending,
  isUploading,
  uploadPreview,
  handleImageUpload,
  fileInputRef,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}: ChatFeedProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const followingLatest = useRef(true);
  const [showJump, setShowJump] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const expenses = useExpensePages(group);
  const feed = useMemo<FeedItem[]>(() => {
    const expenseData = expenses.data?.pages.flatMap((page) => page.expenses) ?? group.expenses;
    const distinctExpenses = new Map(expenseData.map((expense) => [expense.id, expense]));
    const items: FeedItem[] = [];

    for (const expense of distinctExpenses.values()) {
      items.push({ type: "expense", data: expense, date: new Date(expense.date) });
    }
    if (!expensesOnly) {
      for (const message of messages) {
        items.push({ type: "chat", data: message, date: new Date(message.createdAt) });
      }
    }
    return items.sort((first, second) => first.date.getTime() - second.date.getTime());
  }, [expenses.data, expensesOnly, group.expenses, messages]);

  const updateScrollPosition = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller?.clientHeight) return;
    followingLatest.current = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= 80;
    setShowJump(!followingLatest.current);
  }, []);

  const jumpToLatest = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTop = scroller.scrollHeight;
    followingLatest.current = true;
    setShowJump(false);
  }, []);

  useLayoutEffect(jumpToLatest, [expensesOnly, jumpToLatest]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const timeline = timelineRef.current;
    if (!scroller || !timeline) return;

    const observer = new ResizeObserver(() => {
      if (followingLatest.current) jumpToLatest();
      else updateScrollPosition();
    });
    observer.observe(scroller);
    observer.observe(timeline);
    return () => observer.disconnect();
  }, [jumpToLatest, updateScrollPosition]);

  const loadOlderMessages = async () => {
    if (loadingMessages) return;
    setLoadingMessages(true);
    try {
      await loadMore();
    } catch {
      toast.error("Couldn’t load older messages. Try again.");
    } finally {
      setLoadingMessages(false);
    }
  };

  return (
    <>
      <div className="relative flex min-h-0 flex-1">
        <div
          ref={scrollerRef}
          role="region"
          aria-label={expensesOnly ? "Expense history" : "Conversation history"}
          tabIndex={0}
          onScroll={updateScrollPosition}
          className="thread-scroll min-w-0 flex-1 overflow-y-auto overscroll-contain focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          <div ref={timelineRef} className="thread-rail flex min-h-full flex-col py-5 sm:py-6">
            {(expenses.hasNextPage || (!expensesOnly && hasMore)) && (
              <div className="mb-4 flex flex-wrap justify-center gap-2">
                {!expensesOnly && hasMore && (
                  <Button
                    variant="outline"
                    className="min-h-11 text-xs"
                    disabled={!isConnected || loadingMessages}
                    onClick={loadOlderMessages}
                  >
                    {loadingMessages ? "Loading messages…" : "Load older messages"}
                  </Button>
                )}
                {expenses.hasNextPage && (
                  <Button
                    variant="outline"
                    className="min-h-11 text-xs"
                    disabled={expenses.isFetchingNextPage}
                    onClick={() => void expenses.fetchNextPage()}
                  >
                    {expenses.isFetchingNextPage ? "Loading expenses…" : "Load older expenses"}
                  </Button>
                )}
              </div>
            )}
            {expenses.isError && (
              <div className="mb-4 flex flex-wrap items-center justify-center gap-x-3 text-sm">
                <p role="alert">Couldn’t load expenses.</p>
                <Button variant="ghost" className="min-h-11 underline" onClick={() => void expenses.refetch()}>
                  Retry
                </Button>
              </div>
            )}

            {feed.length === 0 && (expensesOnly || !uploadPreview) ? (
              <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
                <span className="expense-category-icon mb-4 size-12">
                  {expensesOnly ? <Receipt size={22} aria-hidden="true" /> : <MessageCircle size={22} aria-hidden="true" />}
                </span>
                <h2 className="text-lg font-semibold tracking-tight">
                  {expensesOnly ? "No expenses yet" : "Start the conversation"}
                </h2>
                <p className="mt-1.5 max-w-[34ch] text-sm leading-relaxed text-muted-foreground">
                  {expensesOnly
                    ? "Add a shared cost to see who paid and how it’s split."
                    : "Send a message or add an expense for the group."}
                </p>
                {expensesOnly && (
                  <Button className="mt-4 h-11" onClick={onAddExpense}>
                    <Plus aria-hidden="true" /> Add expense
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col">
                {feed.map((item, index) => {
                  const previous = feed[index - 1];
                  const next = feed[index + 1];
                  const newDay = previous?.date.toDateString() !== item.date.toDateString();
                  const isFirst = !isSameMessageGroup(previous, item);
                  const isLast = !isSameMessageGroup(next, item);

                  return (
                    <Fragment key={`${item.type}-${item.data.id}`}>
                      {newDay && (
                        <div className="chat-date-divider">
                          <span>
                            {isToday(item.date) ? "Today" : isYesterday(item.date) ? "Yesterday" : dateFormatter.format(item.date)}
                          </span>
                        </div>
                      )}
                      {item.type === "expense" ? (
                        <div className="mb-3.5 sm:mb-4">
                          <ExpenseMessageBubble
                            expense={item.data}
                            groupId={group.id}
                            groupName={group.name}
                            currentUserId={currentUserId}
                            onEdit={onEditExpense}
                            onDelete={onDeleteExpense}
                          />
                        </div>
                      ) : (
                        <ChatTextMessage
                          message={item.data}
                          isOwn={item.data.user.id === currentUserId}
                          isFirst={isFirst}
                          isLast={isLast}
                        />
                      )}
                    </Fragment>
                  );
                })}
              </div>
            )}

            {!expensesOnly && uploadPreview && (
              <div className="relative ml-auto max-w-60 overflow-hidden rounded-xl border border-border">
                <img src={uploadPreview} alt="Image being sent" className="max-h-60 object-contain" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-black/70 p-2 text-xs font-medium text-white" role="status">
                  <Loader2 size={14} className="motion-safe:animate-spin" aria-hidden="true" />
                  Sending image…
                </div>
              </div>
            )}
          </div>
        </div>
        {showJump && (
          <Button
            variant="outline"
            className="absolute right-3 bottom-3 min-h-11 rounded-full shadow-sm sm:right-6"
            onClick={() => {
              scrollerRef.current?.focus({ preventScroll: true });
              jumpToLatest();
            }}
          >
            <ArrowDown aria-hidden="true" /> Jump to latest
          </Button>
        )}
      </div>

      {!expensesOnly && (
        <form
          className="chat-input-bar"
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage().then((sent) => {
              if (sent) jumpToLatest();
            });
          }}
          aria-label="Message composer"
        >
          <div className="thread-rail">
            {!isConnected && (
              <p className="mb-1.5 text-xs font-medium text-muted-foreground" role="status">
                Connecting to chat…
              </p>
            )}
            <div className="flex items-center gap-1 rounded-2xl border border-input bg-card p-1 focus-within:border-ring/60 focus-within:ring-2 focus-within:ring-ring/15 sm:gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    aria-label="Attach image"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || !isConnected}
                    className="rounded-xl text-muted-foreground"
                  >
                    {isUploading ? <Loader2 className="motion-safe:animate-spin" /> : <ImageIcon />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach image</TooltipContent>
              </Tooltip>
              <input
                ref={inputRef}
                type="text"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Message the group"
                aria-label="Message"
                maxLength={2000}
                readOnly={isSending}
                className="h-11 min-w-0 flex-1 bg-transparent px-1 text-base text-foreground outline-none placeholder:text-muted-foreground sm:text-sm"
              />
              <Button
                type="submit"
                size="icon-lg"
                aria-label="Send message"
                aria-busy={isSending}
                disabled={!isConnected || isSending || !chatInput.trim()}
                className="rounded-xl"
                onClick={() => inputRef.current?.focus()}
              >
                {isSending ? <Loader2 className="motion-safe:animate-spin" /> : <ArrowUp />}
              </Button>
            </div>
          </div>
        </form>
      )}
    </>
  );
}

function ChatTextMessage({
  message,
  isOwn,
  isFirst,
  isLast,
}: {
  message: ChatMessage;
  isOwn: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <Message align={isOwn ? "end" : "start"} className={isLast ? "mb-3.5 sm:mb-4" : "mb-1"}>
      {!isOwn && (
        <div className="w-8 shrink-0">
          {isFirst && (
            <Avatar className="size-8" aria-hidden="true">
              {message.user.avatarUrl && (
                <AvatarImage src={message.user.avatarUrl} alt="" referrerPolicy="no-referrer" />
              )}
              <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                {message.user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}
      <MessageContent className="gap-1">
        {!isOwn && isFirst && (
          <span className="px-0.5 text-xs font-semibold text-foreground wrap-anywhere">
            {message.user.name}
          </span>
        )}
        {message.imageUrl && (
          <div data-slot="chat-image" className="max-w-[85%] sm:max-w-60">
            <ChatImageBubble src={message.imageUrl} senderName={message.user.name} />
          </div>
        )}
        {message.content.trim() && (
          <Bubble variant={isOwn ? "tinted" : "outline"} className="max-w-[88%] sm:max-w-[82%]">
            <BubbleContent className={`rounded-2xl whitespace-pre-wrap ${isOwn ? "rounded-br-sm" : "rounded-bl-sm"}`}>
              {message.content}
            </BubbleContent>
          </Bubble>
        )}
        {isLast && (
          <MessageFooter className="px-0.5 tabular-nums">
            <time dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time>
          </MessageFooter>
        )}
      </MessageContent>
    </Message>
  );
}
