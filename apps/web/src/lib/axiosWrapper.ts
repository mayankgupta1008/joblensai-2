import type { AxiosError } from "axios";
import axios from "axios";
import createAuthRefreshInterceptor from "axios-auth-refresh";
import { store } from "@/store/store";
import { setCredentials, logout } from "@/store/slices/authSlice";

// Create axios instance with base configuration
const axiosWrapper = axios.create({
  baseURL: "/api",
  withCredentials: true, // CRITICAL: Required for httpOnly cookies to be sent
  headers: {
    "Content-Type": "application/json",
  },
});

// Called by axios-auth-refresh when a 401 response is received
const refreshAuthLogic = async (failedRequest: AxiosError): Promise<void> => {
  // Prevent infinite loop - if refresh endpoint itself failed, bail out
  if (failedRequest.config?.url === "/auth/refresh") {
    store.dispatch(logout());
    window.location.href = "/login";
    throw failedRequest;
  }

  try {
    const response = await axiosWrapper.post(
      "/auth/refresh",
      {},
      {
        withCredentials: true,
      }
    );

    store.dispatch(setCredentials({ user: response.data.user }));
    return Promise.resolve();
  } catch (error) {
    store.dispatch(logout());
    window.location.href = "/login";
    return Promise.reject(error);
  }
};

// Attach the auth refresh interceptor
createAuthRefreshInterceptor(axiosWrapper, refreshAuthLogic, {
  statusCodes: [401], // Only trigger on 401 Unauthorized
  pauseInstanceWhileRefreshing: true, // Queue other 401 requests while refreshing
});

export default axiosWrapper;
