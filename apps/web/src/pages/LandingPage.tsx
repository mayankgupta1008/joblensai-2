import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Zap, MessageSquare, Smartphone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
            className="rounded-full px-10 py-7 text-lg font-bold h-auto hover:bg-muted/50"
            asChild
          >
            <Link to="/login">Join as Employer</Link>
          </Button>
        </div>

        {/* Demo Section using Tabs */}
        <div className="mt-24 relative max-w-250 mx-auto group">
          <div className="absolute -inset-1 bg-linear-to-r from-primary/20 via-blue-500/10 to-primary/20 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <Card className="relative border border-border/50 bg-background/80 backdrop-blur-xl shadow-2xl overflow-hidden rounded-3xl">
            <Tabs defaultValue="swipe" className="w-full">
              <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
                <TabsList className="grid grid-cols-2 w-75">
                  <TabsTrigger value="swipe">Candidate View</TabsTrigger>
                  <TabsTrigger value="match">Recruiter View</TabsTrigger>
                </TabsList>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                </div>
              </div>

              <TabsContent value="swipe" className="p-8 md:p-12 focus-visible:outline-none">
                <div className="flex flex-col items-center justify-center min-h-120 relative pt-24 pb-12 group/stack">
                  {/* Background Card 3 - Yellow Accents (Furthest) */}
                  <Card className="absolute w-75 h-100 bg-background border-border/50 -translate-y-12 opacity-40 scale-[0.92] blur-[0.5px] pointer-events-none transition-all duration-700 group-hover/stack:-translate-y-16 group-hover/stack:scale-[0.90] z-10">
                    <div className="h-3 w-full bg-yellow-500/40 rounded-t-xl absolute top-0 left-0"></div>
                  </Card>

                  {/* Background Card 2 - Red Accents */}
                  <Card className="absolute w-77.5 h-105 bg-background border-border/50 -translate-y-8 opacity-60 scale-[0.96] blur-[0.2px] pointer-events-none transition-all duration-700 group-hover/stack:-translate-y-12 group-hover/stack:scale-[0.95] z-20">
                    <div className="h-3 w-full bg-red-500/40 rounded-t-xl absolute top-0 left-0"></div>
                  </Card>

                  {/* Background Card 1 - Green Accents (Behind main) */}
                  <Card className="absolute w-80 h-110 bg-background border-border/50 -translate-y-4 opacity-80 scale-[0.98] pointer-events-none transition-all duration-700 group-hover/stack:-translate-y-8 group-hover/stack:scale-[0.99] z-30">
                    <div className="h-3 w-full bg-green-500/40 rounded-t-xl absolute top-0 left-0"></div>
                  </Card>

                  {/* Main Active Card */}
                  <Card className="w-[320px] group/card shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] relative z-40 overflow-hidden transition-all duration-500 hover:scale-[1.05] cursor-grab active:cursor-grabbing hover:-translate-y-2 shadow-primary/5">
                    <div className="h-56 relative overflow-hidden">
                      {/* High-fidelity tech background */}
                      <img
                        src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800"
                        alt="Tech background"
                        className="absolute inset-0 w-full h-full object-cover grayscale opacity-50 transition-transform duration-700 group-hover/card:scale-110"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-primary/20 transition-colors duration-500 group-hover/card:via-background/20"></div>

                      {/* Swipe Hints - Subtle visual cues */}
                      <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover/card:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-red-500/80 flex items-center justify-center text-white shadow-lg -rotate-12">
                          <ArrowRight className="w-5 h-5 rotate-180" />
                        </div>
                        <div className="w-10 h-10 rounded-full bg-green-500/80 flex items-center justify-center text-white shadow-lg rotate-12">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-10">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Badge className="bg-primary text-[10px] font-black h-5">
                              98% MATCH
                            </Badge>
                            <div className="flex gap-0.5">
                              {[1, 2, 3].map((i) => (
                                <div
                                  key={i}
                                  className="w-1 h-1 rounded-full bg-primary animate-pulse"
                                  style={{ animationDelay: `${i * 150}ms` }}
                                />
                              ))}
                            </div>
                          </div>
                          <h3 className="text-foreground font-black text-xl tracking-tighter leading-none">
                            JobLens AI
                          </h3>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-background/80 backdrop-blur-md border-border/50 text-[10px] font-bold"
                        >
                          <Smartphone className="w-3 h-3 mr-1" /> REMOTE
                        </Badge>
                      </div>
                    </div>

                    <CardHeader className="pt-6 px-5 pb-2 relative z-10 bg-background">
                      <div className="flex items-center justify-between mb-1">
                        <CardTitle className="text-xl font-black tracking-tighter leading-tight">
                          Staff Software Engineer
                        </CardTitle>
                      </div>
                      <CardDescription className="text-primary font-bold text-xs uppercase tracking-widest">
                        Product Team • $180k - $220k
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-5 pb-6 bg-background">
                      <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                        Join our core team to scale the swiping engine and build the future of AI
                        matching...
                      </p>
                      <div className="flex flex-wrap gap-2 mt-5">
                        {["Rust", "LLMs", "Scale"].map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="px-2 py-0 h-5 text-[9px] font-bold bg-muted/50 border-none uppercase tracking-tighter"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>

                    {/* Swiping effect shimmer layer */}
                    <div className="absolute inset-0 pointer-events-none bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/card:animate-shimmer"></div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="match" className="p-8 md:p-12 focus-visible:outline-none">
                <div className="flex flex-col items-center justify-center min-h-100 space-y-6">
                  <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border/50 animate-in fade-in slide-in-from-top-4">
                    <Avatar className="h-12 w-12 border-2 border-primary shadow-lg">
                      <AvatarImage src="https://github.com/shadcn.png" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold">John Doe matched with your role!</p>
                      <p className="text-xs text-muted-foreground">
                        AI is generating outreach now...
                      </p>
                    </div>
                  </div>
                  <Card className="w-full max-w-lg border-primary/20 bg-primary/5 p-6 animate-in zoom-in-95 duration-500">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-sm font-bold tracking-tight">AI Handshake Generated</p>
                    </div>
                    <div className="space-y-4">
                      <div className="h-2 w-full bg-muted/50 rounded animate-pulse"></div>
                      <div className="h-2 w-[90%] bg-muted/50 rounded animate-pulse"></div>
                      <div className="h-24 w-full border border-dashed border-primary/30 rounded-xl flex items-center justify-center">
                        <p className="text-[10px] text-center italic text-primary px-8">
                          "Hi John, noticed your expertise in scaling swiping engines at Tinder.
                          We're building something similar at JobLens and would love..."
                        </p>
                      </div>
                      <Button size="sm" className="w-full h-8 text-[11px]">
                        Approve & Send Outreach
                      </Button>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
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
            <h3 className="text-xl font-bold mb-3">Smart Outreach</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              When you match, our AI generates a high-signal handshake message tailored to the role
              and your experience. No more ghosting.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
