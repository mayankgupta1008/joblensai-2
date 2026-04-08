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

const LoginPage = () => {
  return (
    <section className="relative overflow-hidden bg-muted/20 px-4 py-12 md:py-16">
      {/* Background Blobs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] rounded-full bg-linear-to-br from-primary/25 to-blue-500/15 blur-[130px] opacity-50 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-15%] w-[50%] h-[50%] rounded-full bg-linear-to-tr from-purple-500/15 to-primary/25 blur-[110px] opacity-40"></div>
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
                Welcome back
              </Badge>
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
              Pick up where the matches started.
            </h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
              Log in to review fresh roles, send AI-crafted intros, and keep momentum with hiring
              teams already engaging.
            </p>
          </div>

          <div className="relative mt-8 flex-1 group">
            <div className="absolute -inset-1 bg-linear-to-r from-primary/40 via-blue-500/25 to-primary/40 rounded-3xl blur-lg opacity-30 dark:opacity-50 group-hover:opacity-50 dark:group-hover:opacity-70 transition duration-1000"></div>

            <Card className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
              <div className="h-1 w-full bg-linear-to-r from-primary/60 via-blue-500/50 to-primary/60"></div>

              <CardHeader className="pt-8 pb-2 px-8 text-center">
                <Link to="/" className="flex items-center justify-center gap-2 mb-5">
                  <img src={logo} alt="JobLens AI" className="w-9 h-9" />
                  <span className="font-bold text-xl tracking-tight">JobLens AI</span>
                </Link>
                <h2 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/60">
                  Log in
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Swipe, match, and let AI write the first hello.
                </p>
              </CardHeader>

              <CardContent className="flex-1 space-y-5 px-8 pb-8 pt-6">
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-2xl border-border hover:bg-muted/50 hover:border-primary/30 transition-all font-semibold gap-2.5"
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
                  <Label htmlFor="email" className="text-sm font-semibold tracking-tight">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="h-11 rounded-2xl bg-muted/30 placeholder:text-muted-foreground/50 focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-semibold tracking-tight">
                      Password
                    </Label>
                    <a
                      href="#"
                      className="text-[11px] text-primary font-bold hover:underline underline-offset-4 transition-colors"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="h-11 rounded-2xl bg-muted/30 placeholder:text-muted-foreground/50 focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all"
                  />
                </div>

                <Button className="w-full h-11 rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all mt-2">
                  Log in
                </Button>

                <p className="text-center text-sm text-muted-foreground pt-1">
                  Don't have an account?{" "}
                  <Link
                    to="/signup"
                    className="text-primary font-bold hover:underline underline-offset-4 transition-colors"
                  >
                    Get started free
                  </Link>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <AuthShowcase />
      </div>
    </section>
  );
};

export default LoginPage;
