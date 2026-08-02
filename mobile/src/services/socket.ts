import { io, Socket } from "socket.io-client";

const SOCKET_URL = "https://date-planner-api-mv82.onrender.com";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function joinCouple(coupleId: string) {
  const s = getSocket();
  s.emit("join_couple", coupleId);
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
