import { Toaster } from "@/components/ui/sonner";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/store/store";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { setCredentials, setLoading } from "@/store/slices/authSlice";

const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth,
  );

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          dispatch(
            setCredentials({ user: data.user, accessToken: data.accessToken }),
          );
        } else {
          dispatch(setLoading(false)); // Not logged in, just stop loading
        }
      } catch (error) {
        console.log(error);
        dispatch(setLoading(false)); // Error, just stop loading
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
      {isAuthenticated ? <Dashboard /> : <LandingPage />}
      <Footer />
    </div>
  );
};

export default App;
