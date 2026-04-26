import { Toaster } from "sonner";
import { useSelector, useDispatch } from "react-redux";
import { Routes, Route, Navigate } from "react-router-dom";
import type { RootState } from "@/store/store";
import { ThemeProvider } from "@/components/theme-provider";
import { Loader2 } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
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
import NotificationsPage from "@/pages/NotificationsPage";
import { useAuth } from "./hooks/useAuth";
import SettingsPage from "@/pages/SettingsPage";

const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  useAuth(dispatch);
  useNotifications(isAuthenticated);

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
        <Toaster closeButton position="top-right" richColors />
        <NavBar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/dashboard"
              element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/checkout"
              element={isAuthenticated ? <CheckoutPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/upload"
              element={isAuthenticated ? <UploadFile /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/subscription"
              element={isAuthenticated ? <SubscriptionPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/settings"
              element={isAuthenticated ? <SettingsPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/notifications"
              element={isAuthenticated ? <NotificationsPage /> : <Navigate to="/login" replace />}
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
};

export default App;
