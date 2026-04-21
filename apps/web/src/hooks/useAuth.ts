import { useEffect } from "react";
import axios from "axios";
import { setCredentials, setLoading } from "@/store/slices/authSlice";

export const useAuth = (dispatch: any) => {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await axios.post(
          "/api/auth/refresh",
          {},
          {
            withCredentials: true,
          }
        );
        dispatch(setCredentials({ user: data.user }));
      } catch {
        // Silent fail
      } finally {
        dispatch(setLoading(false));
      }
    };
    checkAuth();
  }, [dispatch]);
};
