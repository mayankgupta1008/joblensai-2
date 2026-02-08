import axios from "axios";
import { store } from "@/store/store";
import { setCredentials, logout } from "@/store/slices/authSlice";

const axiosWrapper = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Handle 401 → refresh → retry
axiosWrapper.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axiosWrapper.post(
          "/auth/refresh",
          {},
          { withCredentials: true },
        );
        store.dispatch(setCredentials({ user: data.user }));
        return axiosWrapper(originalRequest);
      } catch {
        store.dispatch(logout());
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);

export default axiosWrapper;
