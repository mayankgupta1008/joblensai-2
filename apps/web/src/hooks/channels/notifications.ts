// Single source of truth for the cross-tab "notifications" BroadcastChannel.
// Importers: useNotifications (listener), NavBar (sender).
export const NOTIFICATIONS_CHANNEL = "notifications" as const;

export type NotificationMessage =
  | { type: "MARK_AS_READ"; _id: string }
  | { type: "MARK_ALL_AS_READ" };
