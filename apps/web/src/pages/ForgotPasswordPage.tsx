import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FaMagic, FaArrowLeft, FaEnvelope, FaCheckCircle } from "react-icons/fa";
import AuthShowcase from "@/components/AuthShowcase";
import logo from "@/assets/joblensai.svg";
import {
  ForgotPasswordSchema,
  type ForgotPasswordInput,
} from "@joblensai/shared/src/schemas/user.schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import axiosWrapper from "@/lib/axiosWrapper";

const ForgotPasswordPage = () => {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema.shape.body),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordInput) => {
    try {
      const response = await axiosWrapper.post("/auth/forgot-password", values);
      toast.success(response.data.message);
      setSubmitted(true);
    } catch (error: any) {
      toast.error(error.response.data.message);
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-background px-4 py-12 md:py-16 selection:bg-emerald-500/30">
      {/* Background Blobs - Emerald & Blue premium vibe */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full bg-linear-to-br from-emerald-500/15 to-blue-500/5 blur-[130px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[5%] right-[-10%] w-[45%] h-[45%] rounded-full bg-linear-to-tr from-blue-600/8 to-emerald-500/15 blur-[110px] opacity-30" />
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
                Security first
              </Badge>
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tighter sm:text-5xl leading-none">
              Recovery mode.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base font-medium opacity-90">
              Don't lose your momentum. Enter your email and we'll send you a magic link to get back
              to swiping.
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

                {!submitted ? (
                  <>
                    <h2 className="text-3xl font-black tracking-tighter">Forgot Password?</h2>
                    <p className="text-sm text-muted-foreground mt-2 font-medium">
                      Enter your email address and we'll send you a reset link.
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                      <FaCheckCircle className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter">Check your email</h2>
                    <p className="text-sm text-muted-foreground mt-2 font-medium leading-relaxed">
                      If an account exists for that email, we've sent a recovery link.
                    </p>
                  </div>
                )}
              </CardHeader>

              <CardContent className="px-8 pb-10 pt-6">
                {!submitted ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-bold tracking-tight ml-1">
                              Email Address
                            </FormLabel>
                            <FormControl>
                              <div className="relative group/input">
                                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
                                <Input
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

                      <Button
                        type="submit"
                        className="w-full h-12 rounded-2xl font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                      >
                        Send Reset Link
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-2xl font-bold border-brand-border hover:bg-emerald-500/5 text-emerald-600 transition-all"
                    onClick={() => setSubmitted(false)}
                  >
                    Resend Link
                  </Button>
                )}

                <div className="mt-8 pt-6 border-t border-emerald-500/5">
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-emerald-600 font-bold transition-colors group"
                  >
                    <FaArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Log in
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="hidden lg:block h-full">
          <AuthShowcase />
        </div>
      </div>
    </section>
  );
};

export default ForgotPasswordPage;
