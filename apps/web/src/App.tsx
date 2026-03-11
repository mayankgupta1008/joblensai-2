import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { useSelector, useDispatch } from "react-redux";
import { Routes, Route } from "react-router-dom";
import type { RootState } from "@/store/store";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { setCredentials, setLoading } from "@/store/slices/authSlice";
import { socket } from "@/lib/socket-client";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import LandingPage from "@/pages/LandingPage";
import DashboardPage from "@/pages/DashboardPage";
import CheckoutPage from "@/pages/CheckoutPage";
import UploadFile from "@/pages/UploadFile";
import SubscriptionPage from "@/pages/SubscriptionPage";
import LoginPage from "@/pages/LoginPage";
import { toast } from "sonner";

const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

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

  useEffect(() => {
    if (isAuthenticated) {
      socket.connect();

      socket.on("notification", (notification) => {
        toast(notification.title, {
          description: notification.message,
        });
      });
    }
    return () => {
      socket.off("notification");
      socket.disconnect();
    };
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  return (
    <div>
      <Toaster />
      <NavBar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {isAuthenticated ? (
          <>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/upload" element={<UploadFile />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
          </>
        ) : (
          <Route path="/login" element={<LoginPage />} />
        )}
      </Routes>
      <Footer />
    </div>
  );
};

export default App;
