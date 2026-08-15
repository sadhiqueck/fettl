import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/context/SocketContext";

// Define the shape of our message
export interface ChatMessage {
  id: string;
  groupId: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

export function useChat(groupId: string) {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!socket || !isConnected) return;

    type History = {
      groupId: string;
      history: ChatMessage[];
      hasMore: boolean;
    };
    const merge = (older: ChatMessage[], newer: ChatMessage[]) => [
      ...new Map([...older, ...newer].map((m) => [m.id, m])).values(),
    ];
    const handleNewMessage = (message: ChatMessage) => {
      if (message.groupId === groupId)
        setMessages((prev) => merge(prev, [message]));
    };
    const handleHistory = (page: History) => {
      if (page.groupId !== groupId) return;
      setMessages((prev) =>
        merge(page.history, prev).sort((a, b) =>
          a.createdAt.localeCompare(b.createdAt),
        ),
      );
      setHasMore(page.hasMore);
    };
    const handleOlderMessages = (page: History) => {
      if (page.groupId !== groupId) return;
      setMessages((prev) => merge(page.history, prev));
      setHasMore(page.hasMore);
    };
    // 3. Listen for real-time expense/settlement broadcasts
    //    When the server tells us an expense was created/updated/deleted,
    //    we invalidate the React Query cache so the group data re-fetches.
    const handleExpenseChange = () => {
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("chatHistory", handleHistory);
    socket.on("olderMessages", handleOlderMessages);
    socket.on("expense:created", handleExpenseChange);
    socket.on("expense:updated", handleExpenseChange);
    socket.on("expense:deleted", handleExpenseChange);
    socket.on("settlement:created", handleExpenseChange);

    socket.on("settlement:updated", handleExpenseChange);
    socket.emit("joinGroup", { groupId });
    // 4. Cleanup: Leave room and remove all listeners
    return () => {
      socket.emit("leaveGroup", { groupId });
      socket.off("newMessage", handleNewMessage);
      socket.off("chatHistory", handleHistory);
      socket.off("olderMessages", handleOlderMessages);
      socket.off("expense:created", handleExpenseChange);
      socket.off("expense:updated", handleExpenseChange);
      socket.off("expense:deleted", handleExpenseChange);
      socket.off("settlement:updated", handleExpenseChange);
      socket.off("settlement:created", handleExpenseChange);
    };
  }, [socket, isConnected, groupId, queryClient]);

  // Expose a simple function to send messages
  const sendMessage = useCallback(
    async (content: string, imageUrl?: string) => {
      if (!socket?.connected) throw new Error("Chat is offline.");
      const reply = await socket
        .timeout(10000)
        .emitWithAck("sendMessage", { groupId, content, imageUrl });
      if (reply?.status !== "delivered")
        throw new Error("Message delivery failed.");
    },
    [socket, groupId],
  );

  const loadMore = useCallback(() => {
    if (socket && isConnected && messages.length > 0 && hasMore) {
      socket.emit("loadMoreMessages", { groupId, cursor: messages[0].id });
    }
  }, [socket, isConnected, groupId, messages, hasMore]);

  return {
    messages,
    hasMore,
    loadMore,
    sendMessage,
    setMessages,
  };
}
