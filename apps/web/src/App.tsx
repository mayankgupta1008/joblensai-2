import Navbar from "@/components/Navbar";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useSession } from "@/lib/auth-client";
import DashboardPage from "@/pages/DashboardPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import ForgotPassword from "@/pages/ForgotPassword";

function App() {
  const { data: session } = useSession();
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={session ? <DashboardPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/signup"
          element={!session ? <SignupPage /> : <Navigate to="/" />}
        />
        <Route
          path="/login"
          element={session ? <Navigate to="/" /> : <LoginPage />}
        />
        <Route
          path="/forgot-password"
          element={!session ? <ForgotPassword /> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
