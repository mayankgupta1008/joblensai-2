import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";

export interface Notification {
  _id: string;
  userId: string;
  type:
    | "PAYMENT_FAILED"
    | "SUBSCRIPTION_STARTED"
    | "SUBSCRIPTION_CANCELLED"
    | "SUBSCRIPTION_REMINDER"
    | "SUBSCRIPTION_RENEWED"
    | "SUBSCRIPTION_RENEWAL_FAILED"
    | "JOB_APPLIED"
    | "JOB_INTERVIEW"
    | "JOB_OFFER"
    | "JOB_REJECTED"
    | "JOB_ACCEPTED";
  title: string;
  message: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

interface NotificationsState {
  items: Notification[];
  unreadCount: number;
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.items = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.isRead).length;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      // Add to start of list
      state.items.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.items.find((n) => n._id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach((n) => {
        n.isRead = true;
      });
      state.unreadCount = 0;
    },
  },
});

export const { setNotifications, addNotification, markAsRead, markAllAsRead } =
  notificationsSlice.actions;
export default notificationsSlice.reducer;
