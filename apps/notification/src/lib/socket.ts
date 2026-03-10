import { Server } from "socket.io";
import type http from "http";
import { createAdapter } from "@socket.io/redis-adapter";
import { redisClient } from "@joblensai/shared/src/utils/redis.config.js";

export const io = new Server({
  pingInterval: 25000,
  pingTimeout: 20000,
  maxHttpBufferSize: 1e6,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
});

export function initSocket(server: http.Server) {
  io.adapter(createAdapter(redisClient, redisClient.duplicate()));
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
