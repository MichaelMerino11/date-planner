import { io, Socket } from "socket.io-client";

const SOCKET_URL = "https://date-planner-api-mv82.onrender.com";

let socket: Socket | null = null;
let isConnecting = false;

export function getSocket(): Socket {
  if (socket?.connected) return socket;

  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      timeout: 10000,
      autoConnect: false,
    });

    socket.on("connect_error", (err) => {
      console.log("Socket connection error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });
  }

  if (!socket.connected && !isConnecting) {
    isConnecting = true;
    socket.connect();
    socket.once("connect", () => {
      isConnecting = false;
    });
  }

  return socket;
}

export function joinCouple(coupleId: string) {
  const s = getSocket();
  if (s.connected) {
    s.emit("join_couple", coupleId);
  } else {
    s.once("connect", () => {
      s.emit("join_couple", coupleId);
    });
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    isConnecting = false;
  }
}
