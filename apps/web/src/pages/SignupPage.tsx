import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Mail, Lock, User } from "lucide-react";
import AuthShowcase from "@/components/AuthShowcase";
import logo from "@/assets/joblensai.svg";
import googleLogo from "@/assets/google-logo.svg";

const SignupPage = () => {
  return (
    <section className="relative min-h-screen overflow-hidden bg-background px-4 py-12 md:py-16 selection:bg-emerald-500/30">
      {/* Background Blobs - Emerald & Blue premium vibe */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full bg-linear-to-bl from-emerald-500/15 to-blue-500/5 blur-[130px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[5%] left-[-15%] w-[50%] h-[50%] rounded-full bg-linear-to-tr from-blue-600/8 to-emerald-500/15 blur-[110px] opacity-30" />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:items-stretch h-full">
        <div className="mx-auto flex h-full w-full max-w-md flex-col justify-center lg:mx-0 lg:max-w-none">
          <div className="text-center lg:text-left">
            <div className="flex justify-center lg:justify-start">
              <Badge
                variant="outline"
                className="px-4 py-1.5 border-emerald-500/20 bg-emerald-500/5 text-emerald-600 tracking-wide transition-all hover:bg-emerald-500/10"
              >
                <Sparkles className="w-3.5 h-3.5 mr-2 inline-block animate-pulse text-emerald-500" />
                Start free
              </Badge>
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tighter sm:text-5xl leading-none">
              Build your next <br />
              <span className="bg-clip-text text-transparent bg-linear-to-r from-emerald-500 to-blue-600">
                career pipeline.
              </span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base font-medium opacity-90">
              Create your account, set your preferences, and start swiping through roles that fit
              your experience.
            </p>
          </div>

          <div className="relative mt-10 group">
            <div className="absolute -inset-1 bg-linear-to-r from-emerald-500/40 via-blue-500/25 to-emerald-500/40 rounded-[2.5rem] blur-lg opacity-30 group-hover:opacity-50 transition duration-1000" />

            <Card className="relative overflow-hidden rounded-[2.5rem] border border-emerald-500/10 bg-background/40 backdrop-blur-xl shadow-2xl">
              <div className="h-1.5 w-full bg-linear-to-r from-emerald-500 via-blue-500 to-emerald-500" />

              <CardHeader className="pt-10 pb-2 px-8 text-center">
                <Link to="/" className="flex items-center justify-center gap-2 mb-6 group/logo">
                  <img
                    src={logo}
                    alt="JobLens AI"
                    className="w-10 h-10 group-hover/logo:scale-110 transition-transform"
                  />
                  <span className="font-black text-2xl tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70 group-hover/logo:from-emerald-500 group-hover/logo:to-blue-600 transition-all">
                    JobLens AI
                  </span>
                </Link>
                <h2 className="text-3xl font-black tracking-tighter">Create account</h2>
                <p className="text-sm text-muted-foreground mt-2 font-medium">
                  Start matching with roles built around your strengths.
                </p>
              </CardHeader>

              <CardContent className="px-8 pb-10 pt-6 space-y-6">
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-2xl border-emerald-500/10 bg-background/50 hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all font-bold gap-3 group/google"
                >
                  <img
                    src={googleLogo}
                    alt="Google"
                    className="w-4.5 h-4.5 group-hover/google:scale-110 transition-transform"
                  />
                  Continue with Google
                </Button>

                <div className="flex items-center gap-4">
                  <Separator className="flex-1 bg-emerald-500/10" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-50">
                    OR
                  </span>
                  <Separator className="flex-1 bg-emerald-500/10" />
                </div>

                <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                  <div className="space-y-2">
                    <Label htmlFor="full-name" className="text-sm font-bold tracking-tight ml-1">
                      Full name
                    </Label>
                    <div className="relative group/input">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
                      <Input
                        id="full-name"
                        type="text"
                        placeholder="Taylor Morgan"
                        className="h-12 pl-11 rounded-2xl bg-muted/30 border-emerald-500/10 placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-bold tracking-tight ml-1">
                      Work email
                    </Label>
                    <div className="relative group/input">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        className="h-12 pl-11 rounded-2xl bg-muted/30 border-emerald-500/10 placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="signup-password"
                      className="text-sm font-bold tracking-tight ml-1"
                    >
                      Password
                    </Label>
                    <div className="relative group/input">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password"
                        className="h-12 pl-11 rounded-2xl bg-muted/30 border-emerald-500/10 placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all"
                      />
                    </div>
                  </div>

                  <Button className="w-full h-12 rounded-2xl font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all mt-2">
                    Create account
                  </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground pt-2 font-medium">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-emerald-600 font-black hover:text-emerald-500 hover:underline underline-offset-4 transition-all"
                  >
                    Log in
                  </Link>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="hidden lg:block h-full">
          <AuthShowcase
            title="From swipe to recruiter reply without the cold-apply grind."
            description="Preview the exact loop: discover the role, approve the match, and let JobLens AI send the first message."
          />
        </div>
      </div>
    </section>
  );
};

export default SignupPage;
