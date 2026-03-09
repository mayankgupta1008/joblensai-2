import { Server } from "socket.io";
import type http from "http";

export const io = new Server();

export function initSocket(server: http.Server) {
  io.attach(server);

  io.on("connection", (socket) => {
    console.log("Websocket connection established:", socket.id);
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
}
