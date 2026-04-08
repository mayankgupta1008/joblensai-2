import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Zap, MessageSquare, Smartphone } from "lucide-react";

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

        {/* Demo Section */}
        <div className="mt-24 relative max-w-250 mx-auto group">
          <div className="absolute -inset-1 bg-linear-to-r from-primary/30 via-blue-500/20 to-primary/30 rounded-3xl blur opacity-25 dark:opacity-40 group-hover:opacity-50 dark:group-hover:opacity-60 transition duration-1000"></div>
          <Card className="relative border border-border/60 dark:border-primary/20 bg-background/80 backdrop-blur-xl shadow-2xl dark:shadow-[0_0_50px_-12px_rgba(0,0,0,1)] dark:shadow-primary/10 overflow-hidden rounded-3xl">
            <div className="px-6 py-4 border-b border-border/60 dark:border-primary/15 flex items-center justify-between">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch">
              {/* Swiping Interface */}
              <div className="p-8 md:p-12 border-b lg:border-b-0 border-border/60 dark:border-primary/15 flex flex-col h-full">
                <div className="flex flex-col items-center justify-center min-h-120 relative pt-12 pb-6 group/stack">
                  {/* Background Stack */}
                  <Card className="absolute w-60 h-80 bg-background border-border/50 -translate-y-12 opacity-40 scale-[0.92] blur-[0.5px] pointer-events-none transition-all duration-700 group-hover/stack:-translate-y-16 group-hover/stack:scale-[0.90] z-10">
                    <div className="h-2 w-full bg-yellow-500/40 rounded-t-xl absolute top-0 left-0"></div>
                  </Card>
                  <Card className="absolute w-64 h-85 bg-background border-border/50 -translate-y-8 opacity-60 scale-[0.96] blur-[0.2px] pointer-events-none transition-all duration-700 group-hover/stack:-translate-y-12 group-hover/stack:scale-[0.95] z-20">
                    <div className="h-2 w-full bg-red-500/40 rounded-t-xl absolute top-0 left-0"></div>
                  </Card>

                  {/* Main Active Card */}
                  <Card className="w-70 group/card shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] relative z-30 overflow-hidden transition-all duration-500 hover:scale-[1.05] cursor-grab active:cursor-grabbing hover:-translate-y-2 border-border/50 dark:border-primary/50">
                    <div className="h-44 relative overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800"
                        alt="Tech background"
                        className="absolute inset-0 w-full h-full object-cover grayscale opacity-50"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-primary/20"></div>
                      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-10">
                        <div className="space-y-1">
                          <Badge className="bg-primary text-[8px] font-black h-4 px-1">
                            98% MATCH
                          </Badge>
                          <h3 className="text-foreground font-black text-lg tracking-tighter leading-none">
                            JobLens AI
                          </h3>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-background/80 backdrop-blur-md text-[8px] font-bold"
                        >
                          REMOTE
                        </Badge>
                      </div>
                    </div>
                    <CardHeader className="pt-4 px-4 pb-1 bg-background">
                      <CardTitle className="text-lg font-black tracking-tighter">
                        Staff Software Engineer
                      </CardTitle>
                      <CardDescription className="text-primary font-bold text-[10px] uppercase tracking-widest">
                        Product Team • $180k+
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 bg-background">
                      <div className="flex flex-wrap gap-1 mt-2">
                        {["Rust", "LLMs", "Scale"].map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="px-1.5 py-0 h-4 text-[8px] font-bold bg-muted/50 uppercase tracking-tighter"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="text-center mt-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">
                    Swipe Right to Apply
                  </p>
                </div>
              </div>

              {/* AI Outreach Interface */}
              <div className="p-8 md:p-12 bg-muted/5 flex flex-col items-center justify-center min-h-120">
                <div className="w-full max-w-lg space-y-6">
                  <div className="flex items-center gap-4 bg-background p-4 rounded-2xl border border-border/50 shadow-sm animate-in fade-in slide-in-from-right-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-sm tracking-tight">AI Agent Active</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                        Sending Outreach...
                      </p>
                    </div>
                  </div>

                  <Card className="w-full border-primary/20 bg-primary/5 p-6 relative overflow-hidden group/outreach">
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover/outreach:bg-primary/20 transition-colors"></div>

                    <div className="flex items-center gap-3 mb-4">
                      <p className="text-sm font-bold tracking-tight">
                        Personalized Outreach to HR
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="h-1.5 w-24 bg-primary/30 rounded-full"></div>
                        <div className="h-1.5 w-full bg-muted/40 rounded-full"></div>
                        <div className="h-1.5 w-[90%] bg-muted/40 rounded-full"></div>
                      </div>

                      <div className="p-4 bg-background/50 backdrop-blur-sm border border-dashed border-primary/30 rounded-xl relative">
                        <div className="absolute top-2 right-3">
                          <Badge
                            variant="outline"
                            className="text-[8px] font-bold h-4 py-0 border-primary/20 text-primary"
                          >
                            DRAFTED
                          </Badge>
                        </div>
                        <p className="text-[11px] leading-relaxed italic text-foreground/80 pr-4">
                          "Hi Sarah, I noticed JobLens is scaling their AI engine. With my
                          background in high-performance Rust and LLM infrastructure, I'd love to
                          discuss the Staff Engineer role..."
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex -space-x-2">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="h-6 w-6 rounded-full border-2 border-background bg-muted animate-pulse"
                            />
                          ))}
                        </div>
                        <Badge className="bg-green-500/10 text-green-600 border-none text-[10px] font-black uppercase">
                          AI Handshake Sent
                        </Badge>
                      </div>
                    </div>
                  </Card>

                  <p className="text-[10px] text-center text-muted-foreground max-w-70 mx-auto">
                    When you swipe right, our AI instantly researches the role and drafts a
                    high-conversion email to the hiring team.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
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
          <Card className="p-8 bg-muted/20 border-border/40 hover:bg-muted/30 transition-all group hover:shadow-2xl hover:shadow-primary/5 rounded-3xl">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">AI-Driven Signal</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              No more irrelevant filters. Our AI deeply understands your resume and intent to find
              matches that actually make sense for your career.
            </p>
          </Card>

          <Card className="p-8 bg-muted/20 border-border/40 hover:bg-muted/30 transition-all group hover:shadow-2xl hover:shadow-primary/5 rounded-3xl">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Smartphone className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">Swipe to Apply</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Applying for jobs shouldn't be a chore. With our mobile-first swiping mechanic, you
              can explore opportunities anywhere, anytime.
            </p>
          </Card>

          <Card className="p-8 bg-muted/20 border-border/40 hover:bg-muted/30 transition-all group hover:shadow-2xl hover:shadow-primary/5 rounded-3xl">
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
