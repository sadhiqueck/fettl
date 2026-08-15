import { useEffect, useState, type ReactNode } from "react";
import { getSocket } from "@/shared/lib/socket";
import { refreshSession } from "@/shared/lib/apiClient";
import { SocketContext } from "./SocketContext";

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket] = useState(getSocket);
  const [isConnected, setConnected] = useState(false);
  useEffect(() => {
    let mounted = true;
    const connected = () => setConnected(true);
    const renew = () => {
      void refreshSession()
        .then(() => {
          if (mounted) socket.connect();
        })
        .catch(() => {});
    };
    const disconnected = (reason: string) => {
      setConnected(false);
      if (reason === "io server disconnect") renew();
    };
    const failed = (error: Error) => {
      if (error.message === "Authentication required") renew();
    };
    socket
      .on("connect", connected)
      .on("disconnect", disconnected)
      .on("connect_error", failed);
    socket.connect();
    return () => {
      mounted = false;
      socket
        .off("connect", connected)
        .off("disconnect", disconnected)
        .off("connect_error", failed);
      socket.disconnect();
    };
  }, [socket]);
  return (
    <SocketContext.Provider
      value={{ socket, isConnected, reconnect: () => socket.connect() }}
    >
      {children}
    </SocketContext.Provider>
  );
}
