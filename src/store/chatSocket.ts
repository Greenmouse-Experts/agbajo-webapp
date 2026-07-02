import { atom } from "jotai/vanilla";
import { getDefaultStore } from "jotai/vanilla";
import { io, type Socket } from "socket.io-client";

export const isConnectedAtom = atom(false);
export const newChatCountAtom = atom(0); // unread while not on chat page

let _socket: Socket | null = null;
const store = getDefaultStore();

export function getChatSocket(): Socket | null {
  return _socket;
}

export function connectChatSocket(token: string, userId: string) {
  if (_socket?.connected) return;
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }

  const socket = io(
    import.meta.env.VITE_BACKEND_URL ||
      "https://needhomes-backend-staging.onrender.com",
    {
      auth: { token },
      extraHeaders: { Authorization: `Bearer ${token}` },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    },
  );

  socket.on("connect", () => {
    store.set(isConnectedAtom, true);
    socket.emit("join", { userId });
    socket.emit("joinRoom", "admin-notifications");
  });

  socket.on("disconnect", () => store.set(isConnectedAtom, false));

  socket.on("chat:newMessage", () => {
    store.set(newChatCountAtom, store.get(newChatCountAtom) + 1);
  });

  _socket = socket;
}

export function disconnectChatSocket() {
  _socket?.disconnect();
  _socket = null;
  store.set(isConnectedAtom, false);
  store.set(newChatCountAtom, 0);
}

export function clearNewChatCount() {
  store.set(newChatCountAtom, 0);
}
