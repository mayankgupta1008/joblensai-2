// Single source of truth for the cross-tab "auth" BroadcastChannel.
// Importers: useAuth (listener), NavBar (logout sender), LoginPage (login sender).
export const AUTH_CHANNEL = "auth" as const;

export type AuthMessage = { type: "LOGIN"; user: any } | { type: "LOGOUT" };
