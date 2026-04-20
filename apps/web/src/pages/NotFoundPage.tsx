import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-primary/5 px-3 py-1 text-sm font-semibold text-primary mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          404 Error
        </div>

        <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
          Page not found
        </h1>

        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          The page you are looking for might have been removed, had its name changed, or is
          temporarily unavailable.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row sm:justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/">Go back to home</Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link to="/login">Log in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
