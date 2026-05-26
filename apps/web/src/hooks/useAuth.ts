import { useEffect } from "react";
import axios from "axios";
import { setCredentials, setLoading, logout } from "@/store/slices/authSlice";
import { useBroadcastChannel } from "@/hooks/useBroadcastChannel";
import { AUTH_CHANNEL, type AuthMessage } from "@/hooks/channels/auth";

export const useAuth = (dispatch: any) => {
  // Subscribe to the 'auth' channel. When another tab posts LOGOUT,
  // dispatch the local logout so this tab updates its Redux state.
  useBroadcastChannel<AuthMessage>(AUTH_CHANNEL, (msg) => {
    if (msg.type === "LOGOUT") dispatch(logout());
    if (msg.type === "LOGIN") dispatch(setCredentials({ user: msg.user }));
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await axios.post("api/auth/refresh", {}, { withCredentials: true });
        dispatch(setCredentials({ user: data.user }));
      } catch (error) {
        console.error("Auth check failed:", error);
        // Silent fail
      } finally {
        dispatch(setLoading(false));
      }
    };
    checkAuth();
  }, [dispatch]);
};
