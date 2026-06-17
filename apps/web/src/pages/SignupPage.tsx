import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FaMagic, FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import AuthShowcase from "@/components/AuthShowcase";
import logo from "@/assets/joblensai.svg";
import googleLogo from "@/assets/google-logo.svg";
import axiosWrapper from "@/lib/axiosWrapper";
import { setCredentials } from "@/store/slices/authSlice";
import { RegisterSchema, type RegisterInput } from "@joblensai/shared/src/schemas/user.schema";

const SignupPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema.shape.body),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  const onSubmit = async (values: RegisterInput) => {
    try {
      const response = await axiosWrapper.post("/auth/register", values);
      dispatch(setCredentials({ user: response.data.user }));
      toast.success(response.data.message);
      // Gate auto-redirects to /complete-profile because isProfileComplete is false.
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Sign-up failed.");
    }
  };

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
                className="px-4 py-1.5 border-brand-border bg-emerald-500/5 text-emerald-600 tracking-wide transition-all hover:bg-emerald-500/10"
              >
                <FaMagic className="w-3.5 h-3.5 mr-2 inline-block animate-pulse text-emerald-500" />
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
            <div className="absolute -inset-1 bg-linear-to-r from-emerald-500/40 via-blue-500/25 to-emerald-500/40 rounded-4xl blur-lg opacity-30 group-hover:opacity-50 transition duration-1000" />

            <Card className="relative overflow-hidden rounded-4xl border border-brand-border bg-background/40 backdrop-blur-xl shadow-2xl">
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
                  asChild
                  variant="outline"
                  className="w-full h-12 rounded-2xl border-brand-border bg-background/50 hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all font-bold gap-3 group/google"
                >
                  <a href="/api/auth/google">
                    <img
                      src={googleLogo}
                      alt="Google"
                      className="w-4.5 h-4.5 group-hover/google:scale-110 transition-transform"
                    />
                    Continue with Google
                  </a>
                </Button>

                <div className="flex items-center gap-4">
                  <Separator className="flex-1 bg-brand-border" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-50">
                    OR
                  </span>
                  <Separator className="flex-1 bg-brand-border" />
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold tracking-tight ml-1">
                            Full name
                          </FormLabel>
                          <FormControl>
                            <div className="relative group/input">
                              <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
                              <Input
                                placeholder="Taylor Morgan"
                                className="h-12 pl-11 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="ml-1 text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold tracking-tight ml-1">
                            Work email
                          </FormLabel>
                          <FormControl>
                            <div className="relative group/input">
                              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
                              <Input
                                type="email"
                                placeholder="you@example.com"
                                className="h-12 pl-11 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="ml-1 text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold tracking-tight ml-1">
                            Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative group/input">
                              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
                              <Input
                                type="password"
                                placeholder="Create a password"
                                className="h-12 pl-11 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="ml-1 text-xs" />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={form.formState.isSubmitting}
                      className="w-full h-12 rounded-2xl font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all mt-2"
                    >
                      {form.formState.isSubmitting ? "Creating account..." : "Create account"}
                    </Button>
                  </form>
                </Form>

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
