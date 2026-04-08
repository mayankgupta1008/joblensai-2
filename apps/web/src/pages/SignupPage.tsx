import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles } from "lucide-react";
import AuthShowcase from "@/components/auth/AuthShowcase";
import logo from "@/assets/joblensai.svg";
import googleLogo from "@/assets/google-logo.svg";

const SignupPage = () => {
  return (
    <section className="relative overflow-hidden bg-muted/20 px-4 py-12 md:py-16">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[55%] h-[55%] rounded-full bg-linear-to-bl from-primary/20 to-blue-500/15 blur-[130px] opacity-50 animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-15%] w-[50%] h-[50%] rounded-full bg-linear-to-tr from-purple-500/15 to-primary/20 blur-[110px] opacity-40"></div>
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:items-stretch">
        <div className="mx-auto flex h-full w-full max-w-md flex-col lg:mx-0 lg:max-w-none">
          <div className="text-center lg:text-left">
            <div className="flex justify-center lg:justify-start">
              <Badge
                variant="outline"
                className="px-4 py-1.5 border-primary/20 bg-primary/5 text-primary tracking-wide transition-all hover:bg-primary/10"
              >
                <Sparkles className="w-3.5 h-3.5 mr-2 inline-block animate-pulse text-yellow-500" />
                Start free
              </Badge>
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
              Build your next career pipeline in minutes.
            </h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
              Create your account, set your preferences, and start swiping through roles that fit
              your experience.
            </p>
          </div>

          <div className="relative mt-8 flex-1 group">
            <div className="absolute -inset-1 bg-linear-to-r from-primary/35 via-blue-500/20 to-primary/35 rounded-3xl blur-lg opacity-30 dark:opacity-50 group-hover:opacity-50 dark:group-hover:opacity-70 transition duration-1000"></div>

            <Card className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
              <div className="h-1 w-full bg-linear-to-r from-primary/60 via-blue-500/50 to-primary/60"></div>

              <CardHeader className="px-7 pb-1 pt-7 text-center">
                <Link to="/" className="mb-4 flex items-center justify-center gap-2">
                  <img src={logo} alt="JobLens AI" className="w-9 h-9" />
                  <span className="font-bold text-xl tracking-tight">JobLens AI</span>
                </Link>
                <h2 className="bg-linear-to-b from-foreground to-foreground/60 bg-clip-text text-3xl font-black tracking-tighter text-transparent">
                  Create account
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Start matching with roles built around your strengths.
                </p>
              </CardHeader>

              <CardContent className="flex-1 space-y-4 px-7 pb-7 pt-5">
                <Button
                  variant="outline"
                  className="h-10 w-full gap-2.5 rounded-2xl border-border font-semibold transition-all hover:border-primary/30 hover:bg-muted/50"
                >
                  <img src={googleLogo} alt="Google" className="w-4 h-4" />
                  Continue with Google
                </Button>

                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">
                    or
                  </span>
                  <Separator className="flex-1" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full-name" className="text-sm font-semibold tracking-tight">
                    Full name
                  </Label>
                  <Input
                    id="full-name"
                    type="text"
                    placeholder="Taylor Morgan"
                    className="h-10 rounded-2xl bg-muted/30 placeholder:text-muted-foreground/50 transition-all focus-visible:border-primary/50 focus-visible:ring-primary/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-semibold tracking-tight">
                    Work email
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    className="h-10 rounded-2xl bg-muted/30 placeholder:text-muted-foreground/50 transition-all focus-visible:border-primary/50 focus-visible:ring-primary/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-semibold tracking-tight">
                    Password
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    className="h-10 rounded-2xl bg-muted/30 placeholder:text-muted-foreground/50 transition-all focus-visible:border-primary/50 focus-visible:ring-primary/30"
                  />
                </div>

                <Button className="mt-1 h-10 w-full rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95">
                  Create account
                </Button>

                <p className="pt-1 text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-primary font-bold hover:underline underline-offset-4 transition-colors"
                  >
                    Log in
                  </Link>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <AuthShowcase
          title="From swipe to recruiter reply without the cold-apply grind."
          description="Preview the exact loop: discover the role, approve the match, and let JobLens AI send the first message."
        />
      </div>
    </section>
  );
};

export default SignupPage;
