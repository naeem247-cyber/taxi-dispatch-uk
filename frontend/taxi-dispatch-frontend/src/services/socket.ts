import { io, Socket } from "socket.io-client";
import { getStoredToken } from "./api";

let socket: Socket | null = null;

export function connectSocket() {
  const token = getStoredToken();

  socket = io("http://localhost:3000", {
    auth: {
      token,
    },
    transports: ["websocket"],
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
