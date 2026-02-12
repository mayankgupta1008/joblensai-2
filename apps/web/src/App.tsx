import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import LandingPage from "@/pages/LandingPage";
import DashboardPage from "@/pages/DashboardPage";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/store/store";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { setCredentials, setLoading } from "@/store/slices/authSlice";
import CheckoutPage from "@/pages/CheckoutPage";

const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth,
  );

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await axios.post(
          "/api/auth/refresh",
          {},
          { withCredentials: true },
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
      {isAuthenticated ? <DashboardPage /> : <LandingPage />}
      <CheckoutPage />
      <Footer />
    </div>
  );
};

export default App;
