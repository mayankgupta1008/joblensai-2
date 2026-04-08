import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Zap, MessageSquare, Smartphone } from "lucide-react";
import WorkflowStrip from "@/components/marketing/WorkflowStrip";

const LandingPage = () => {
  return (
    <div className="relative flex flex-col min-h-screen selection:bg-primary/30">
      {/* Background Blobs - Improved with mixed gradients */}
      <div className="fixed inset-0 z-[-1] overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-linear-to-br from-primary/20 to-blue-500/10 blur-[130px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[-15%] w-[45%] h-[45%] rounded-full bg-linear-to-tr from-purple-500/10 to-primary/20 blur-[110px] opacity-30"></div>
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16 md:pt-32 md:pb-24 text-center">
        <Badge
          variant="outline"
          className="mb-6 px-4 py-1.5 border-primary/20 bg-primary/5 text-primary tracking-wide transition-all hover:bg-primary/10"
        >
          <Sparkles className="w-3.5 h-3.5 mr-2 inline-block animate-pulse text-yellow-500" />
          The LinkedIn Killer is here.
        </Badge>
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/50 leading-none">
          SWIPE. MATCH. <br />
          <span className="text-primary decoration-primary/20 underline underline-offset-8">
            GET HIRED.
          </span>
        </h1>
        <p className="max-w-200 mx-auto text-muted-foreground text-lg md:text-2xl mb-12 leading-relaxed opacity-90">
          The Tinder for jobs. Find your dream career in seconds. When you match, our AI generates
          the perfect personalized outreach instantly.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Button
            size="lg"
            className="rounded-full px-10 py-7 text-lg font-bold shadow-2xl shadow-primary/30 h-auto active:scale-95 transition-transform group"
            asChild
          >
            <Link to="/signup" className="flex items-center gap-2">
              Start Swiping Free{" "}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="rounded-full px-10 py-7 text-lg font-bold h-auto hover:bg-muted/50 border border-primary/20"
            asChild
          >
            <Link to="/login">Post a Job</Link>
          </Button>
        </div>

        <WorkflowStrip />
      </section>

      {/* Features Section - Replacing the 'Trusted by' section with something more appropriate for a new launch */}
      <section className="container mx-auto px-4 py-24 border-t border-border/40">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6">
            Why settle for job boards?
          </h2>
          <p className="text-muted-foreground text-lg">
            Stop spending hours scanning outdated listings. JobLens AI is designed for the modern
            talent stack, prioritizing efficiency and signal over noise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          <Card className="p-8 bg-muted/20 border-border/40 dark:border-primary/20 hover:bg-muted/30 transition-all rounded-3xl">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">AI-Driven Signal</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              No more irrelevant filters. Our AI deeply understands your resume and intent to find
              matches that actually make sense for your career.
            </p>
          </Card>

          <Card className="p-8 bg-muted/20 border-border/40 dark:border-primary/20 hover:bg-muted/30 transition-all rounded-3xl">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Smartphone className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">Swipe to Apply</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Applying for jobs shouldn't be a chore. With our mobile-first swiping mechanic, you
              can explore opportunities anywhere, anytime.
            </p>
          </Card>

          <Card className="p-8 bg-muted/20 border-border/40 dark:border-primary/20 hover:bg-muted/30 transition-all rounded-3xl">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">AI Agent Outreach</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Employers post roles, and our AI agent handles the rest. When you swipe right, we send
              a high-signal, personalized email directly to the HR team.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
