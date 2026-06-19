import { Toaster } from "sonner";
import { useSelector, useDispatch } from "react-redux";
import { Routes, Route, Navigate } from "react-router-dom";
import type { RootState } from "@/store/store";
import { ThemeProvider } from "@/components/theme-provider";
import { FaSpinner } from "react-icons/fa";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "./hooks/useAuth";
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
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import SettingsPage from "@/pages/SettingsPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import CompleteProfile from "@/pages/CompleteProfile";
import EmailVerificationPage from "./pages/EmailVerificationPage";

const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading, user } = useSelector((state: RootState) => state.auth);
  useAuth(dispatch);
  useNotifications(isAuthenticated);
  const needsProfileCompletion = isAuthenticated && user && !user.isProfileComplete;
  const gated = (page: React.ReactNode) =>
    !isAuthenticated ? (
      <Navigate to="/login" replace />
    ) : needsProfileCompletion ? (
      <Navigate to="/complete-profile" replace />
    ) : (
      page
    );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <FaSpinner className="h-8 w-8 animate-spin" />
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
              path="/complete-profile"
              element={
                !isAuthenticated ? (
                  <Navigate to="/login" replace />
                ) : !needsProfileCompletion ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <CompleteProfile />
                )
              }
            />
            <Route path="/dashboard" element={gated(<DashboardPage />)} />
            <Route path="/checkout" element={gated(<CheckoutPage />)} />
            <Route path="/upload" element={gated(<UploadFile />)} />
            <Route path="/subscription" element={gated(<SubscriptionPage />)} />
            <Route path="/settings" element={gated(<SettingsPage />)} />
            <Route path="/notifications" element={gated(<NotificationsPage />)} />
            <Route
              path="/forgot-password"
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />
              }
            />
            <Route
              path="/reset-password/:token"
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <ResetPasswordPage />
              }
            />
            <Route path="/verified" element={<EmailVerificationPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
};

export default App;
