import { useEffect } from "react";
import { socket } from "@/lib/socket-client";
import { showNotification, type Notification } from "@/lib/notification-toast";

export const useNotifications = (isAuthenticated: boolean) => {
  useEffect(() => {
    if (!isAuthenticated) return;

    socket.connect();
    socket.on("notification", (n: Notification) => showNotification(n));

    return () => {
      socket.off("notification");
      socket.disconnect();
    };
  }, [isAuthenticated]);
};
