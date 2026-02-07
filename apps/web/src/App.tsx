import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LandingPage from "@/pages/LandingPage";

const App = () => {
  return (
    <div>
      <Toaster />
      <Navbar />
      <LandingPage />
      <Footer />
    </div>
  );
};

export default App;
