import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { useSelector, useDispatch } from "react-redux";
import { Routes, Route } from "react-router-dom";
import type { RootState } from "@/store/store";
import { ThemeProvider } from "@/components/theme-provider";
import { Loader2, CircleCheckIcon, CircleXIcon, InfoIcon } from "lucide-react";
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
import SignupPage from "@/pages/SignupPage";
import NotFoundPage from "@/pages/NotFoundPage";
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
        const errorTypes = ["PAYMENT_FAILED", "SUBSCRIPTION_RENEWAL_FAILED"];
        const successTypes = ["SUBSCRIPTION_STARTED", "SUBSCRIPTION_RENEWED"];
        if (errorTypes.includes(notification.type)) {
          toast.error(notification.title, {
            description: notification.message,
            icon: <CircleXIcon className="size-4 text-red-500" />,
          });
        } else if (successTypes.includes(notification.type)) {
          toast.success(notification.title, {
            description: notification.message,
            icon: <CircleCheckIcon className="size-4 text-green-500" />,
          });
        } else {
          toast.info(notification.title, {
            description: notification.message,
            icon: <InfoIcon className="size-4 text-blue-500" />,
          });
        }
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
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
        <Toaster />
        <NavBar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="*" element={<NotFoundPage />} />
            {isAuthenticated && (
              <>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/upload" element={<UploadFile />} />
                <Route path="/subscription" element={<SubscriptionPage />} />
              </>
            )}
          </Routes>
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
};

export default App;
