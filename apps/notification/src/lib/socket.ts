import { Server } from "socket.io";
import type http from "http";

export const io = new Server();

export function initSocket(server: http.Server) {
  io.attach(server);

  io.on("connection", (socket) => {
    const userId = socket.handshake.headers["x-user-id"] as string;
    socket.join(userId);
    console.log(`Socket ${socket.id} joined room ${userId}`);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
}
