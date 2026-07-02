import { atom } from "jotai/vanilla";
import { getDefaultStore } from "jotai/vanilla";
import { io, type Socket } from "socket.io-client";

export const userChatConnectedAtom = atom(false);
export const userNewChatCountAtom = atom(0);

let _socket: Socket | null = null;
const store = getDefaultStore();

export function connectUserChatSocket(token: string, userId: string) {
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
    store.set(userChatConnectedAtom, true);
    socket.emit("join", { userId });
  });

  socket.on("disconnect", () => store.set(userChatConnectedAtom, false));

  socket.on("chat:newMessage", () => {
    store.set(userNewChatCountAtom, store.get(userNewChatCountAtom) + 1);
  });

  _socket = socket;
}

export function disconnectUserChatSocket() {
  _socket?.disconnect();
  _socket = null;
  store.set(userChatConnectedAtom, false);
  store.set(userNewChatCountAtom, 0);
}

export function clearUserNewChatCount() {
  store.set(userNewChatCountAtom, 0);
}
