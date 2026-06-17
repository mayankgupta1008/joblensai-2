import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FaMagic, FaArrowLeft, FaHome } from "react-icons/fa";

const NotFoundPage = () => {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden selection:bg-emerald-500/30">
      {/* Background Blobs - Emerald & Blue premium vibe */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full bg-linear-to-br from-emerald-500/15 to-blue-500/5 blur-[130px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[5%] right-[-10%] w-[45%] h-[45%] rounded-full bg-linear-to-tr from-blue-600/8 to-emerald-500/15 blur-[110px] opacity-30" />
      </div>

      <div className="relative z-10 max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-emerald-500/5 px-4 py-1.5 text-sm font-bold text-emerald-600 mb-8 shadow-sm">
          <FaMagic className="h-4 w-4 animate-pulse text-emerald-500" />
          404 Error
        </div>

        <h1 className="text-5xl font-black tracking-tighter sm:text-7xl lg:text-8xl bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/50 leading-none">
          LOST IN THE <br />
          <span className="bg-clip-text text-transparent bg-linear-to-r from-emerald-500 to-blue-600">
            STACK.
          </span>
        </h1>

        <p className="mt-8 text-lg md:text-xl leading-relaxed text-muted-foreground font-medium opacity-90 max-w-lg mx-auto">
          The page you are looking for might have been removed or moved to another dimension. Let's
          get you back to the match.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row sm:justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="rounded-full h-14 px-8 font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <Link to="/">
              <FaHome className="w-5 h-5 mr-2" />
              Back to Home
            </Link>
          </Button>
          <Button
            variant="outline"
            asChild
            size="lg"
            className="rounded-full h-14 px-8 font-bold border-brand-border text-emerald-600 hover:bg-emerald-500/5 transition-all"
          >
            <Link to="/login">
              <FaArrowLeft className="w-5 h-5 mr-2" />
              Log in
            </Link>
          </Button>
        </div>
      </div>

      {/* Decorative large 404 in background */}
      <div className="absolute inset-0 z-[-1] flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
        <span className="text-[30rem] font-black tracking-tighter">404</span>
      </div>
    </div>
  );
};

export default NotFoundPage;
