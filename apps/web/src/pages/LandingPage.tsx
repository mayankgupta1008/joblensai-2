import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FaMagic, FaArrowRight, FaBolt, FaCommentAlt, FaMobileAlt } from "react-icons/fa";
import WorkflowStrip from "@/components/WorkflowStrip";

const LandingPage = () => {
  return (
    <div className="relative flex flex-col min-h-screen selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Background Blobs - Emerald & Blue premium vibe */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full bg-linear-to-br from-emerald-500/15 to-blue-500/5 blur-[130px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-[5%] right-[-10%] w-[45%] h-[45%] rounded-full bg-linear-to-tr from-blue-600/8 to-emerald-500/15 blur-[110px] opacity-30"></div>
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16 md:pt-32 md:pb-24 text-center">
        <Badge
          variant="outline"
          className="mb-6 px-4 py-1.5 border-brand-border bg-emerald-500/5 text-emerald-600 tracking-wide transition-all hover:bg-emerald-500/10"
        >
          <FaMagic className="w-3.5 h-3.5 mr-2 inline-block animate-pulse text-emerald-500" />
          The LinkedIn Killer is here.
        </Badge>

        <h1 className="text-5xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-8 bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/50 leading-[0.9] md:leading-[0.85]">
          SWIPE. MATCH. <br />
          <span className="bg-clip-text text-transparent bg-linear-to-r from-emerald-500 to-blue-600 underline decoration-emerald-500/30 underline-offset-12 md:underline-offset-20">
            GET HIRED.
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-muted-foreground text-lg md:text-2xl mb-12 leading-relaxed opacity-90 font-medium">
          The Tinder for jobs. Find your dream career in seconds. When you match, our AI generates
          the perfect personalized outreach instantly.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Button
            size="lg"
            className="rounded-full px-10 py-7 text-lg font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xl shadow-emerald-500/20 h-auto active:scale-95 transition-all group"
            asChild
          >
            <Link to="/signup" className="flex items-center gap-2">
              Start Swiping Free{" "}
              <FaArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="rounded-full px-10 py-7 text-lg font-bold h-auto hover:bg-emerald-500/5 border border-brand-border text-emerald-600 transition-all"
            asChild
          >
            <Link to="/login">Post a Job</Link>
          </Button>
        </div>

        <div className="mt-16 md:mt-24">
          <WorkflowStrip />
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24 border-t border-brand-border">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 border-blue-500/20 bg-blue-500/5 text-blue-600">
            Why JobLens?
          </Badge>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/70">
            Why settle for job boards?
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl font-medium">
            Stop spending hours scanning outdated listings. JobLens AI is designed for the modern
            talent stack, prioritizing efficiency and signal over noise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          <Card className="group p-8 bg-background/40 backdrop-blur-sm border-brand-border hover:bg-background/60 hover:border-emerald-500/40 transition-all rounded-4xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
              <FaBolt className="w-7 h-7 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-3">AI-Driven Signal</h3>
            <p className="text-muted-foreground leading-relaxed font-medium">
              No more irrelevant filters. Our AI deeply understands your resume and intent to find
              matches that actually make sense for your career.
            </p>
          </Card>

          <Card className="group p-8 bg-background/40 backdrop-blur-sm border-brand-border hover:bg-background/60 hover:border-emerald-500/40 transition-all rounded-4xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
              <FaMobileAlt className="w-7 h-7 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-3">Swipe to Apply</h3>
            <p className="text-muted-foreground leading-relaxed font-medium">
              Applying for jobs shouldn't be a chore. With our mobile-first swiping mechanic, you
              can explore opportunities anywhere, anytime.
            </p>
          </Card>

          <Card className="group p-8 bg-background/40 backdrop-blur-sm border-brand-border hover:bg-background/60 hover:border-emerald-500/40 transition-all rounded-4xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
              <FaCommentAlt className="w-7 h-7 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-3">AI Agent Outreach</h3>
            <p className="text-muted-foreground leading-relaxed font-medium">
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
