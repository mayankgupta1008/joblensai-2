import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { socket } from "@/lib/socket-client";
import { showNotification } from "@/lib/notification-toast";
import {
  addNotification,
  setNotifications,
  markAsRead,
  markAllAsRead,
  type Notification,
} from "@/store/slices/notificationsSlice";
import axiosWrapper from "@/lib/axiosWrapper";
import { useBroadcastChannel } from "@/hooks/useBroadcastChannel";
import { NOTIFICATIONS_CHANNEL, type NotificationMessage } from "@/hooks/channels/notifications";

export const useNotifications = (isAuthenticated: boolean) => {
  const dispatch = useDispatch();

  useBroadcastChannel<NotificationMessage>(NOTIFICATIONS_CHANNEL, (msg) => {
    if (msg.type === "MARK_ALL_AS_READ") dispatch(markAllAsRead());
    else if (msg.type === "MARK_AS_READ") dispatch(markAsRead(msg._id));
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    // 1. Initial Load: Fetch history from DB
    const fetchHistory = async () => {
      try {
        const response = await axiosWrapper.get("/notifications/");
        dispatch(setNotifications(response.data.notifications));
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchHistory();

    // 2. Stream: Listen for live updates
    socket.connect();
    socket.on("notification", (n: Notification) => {
      dispatch(addNotification(n));
      showNotification(n);
    });

    return () => {
      socket.off("notification");
      socket.disconnect();
    };
  }, [isAuthenticated, dispatch]);
};
