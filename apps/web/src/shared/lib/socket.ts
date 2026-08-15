import { io, type Socket } from "socket.io-client";
import { apiClient } from "./apiClient";

let socket: Socket | undefined;
export function getSocket() {
  socket ??= io(apiClient.defaults.baseURL, {
    withCredentials: true,
    autoConnect: false,
  });
  return socket;
}
export function disconnectSocket() {
  socket?.disconnect();
}
